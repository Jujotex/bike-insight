-- ============================================================
-- Bike Insight — Moteur de calcul usure
-- Migration : 20260523000003_wear_engine
-- ============================================================

-- ============================================================
-- FUNCTION : recalculate_component_km
-- Recalcule km_used pour tous les composants actifs d'un user
-- Formule : km_used = MAX(0, bike.total_km - component.installed_km)
-- Le trigger trg_component_status met à jour le statut automatiquement
-- ============================================================

create or replace function recalculate_component_km(p_user_id uuid)
returns void as $$
begin
  update components c
  set km_used = greatest(0, b.total_km - c.installed_km)
  from bikes b
  where c.bike_id = b.id
    and c.user_id = p_user_id
    and c.is_active = true;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================
-- VIEW : component_stats
-- Vue dénormalisée pour faciliter les requêtes dashboard
-- ============================================================

create or replace view component_stats as
select
  c.id,
  c.bike_id,
  c.user_id,
  c.name,
  c.brand,
  c.category,
  c.purchase_price,
  c.installed_at,
  c.km_used,
  c.km_max,
  c.status,
  c.notes,
  c.is_active,
  b.name as bike_name,
  -- Usure en pourcentage
  case
    when c.km_max is not null and c.km_max > 0
    then round((c.km_used / c.km_max * 100)::numeric, 1)
    else null
  end as wear_pct,
  -- Coût par km
  case
    when c.purchase_price is not null and c.km_max is not null and c.km_max > 0
    then round((c.purchase_price / c.km_max)::numeric, 3)
    else null
  end as cost_per_km,
  -- Km restants estimés
  case
    when c.km_max is not null
    then greatest(0, c.km_max - c.km_used)
    else null
  end as km_remaining
from components c
join bikes b on b.id = c.bike_id;

-- ============================================================
-- VIEW : bike_stats
-- Vue dénormalisée vélos avec coûts agrégés
-- ============================================================

create or replace view bike_stats as
select
  b.id,
  b.user_id,
  b.name,
  b.brand,
  b.model,
  b.total_km,
  b.purchase_price,
  b.strava_gear_id,
  b.is_active,
  -- Nombre de composants actifs
  count(c.id) filter (where c.is_active = true) as component_count,
  -- Coût total des composants
  coalesce(sum(c.purchase_price) filter (where c.is_active = true), 0) as components_cost,
  -- Coût total vélo (achat + composants)
  coalesce(b.purchase_price, 0) + coalesce(sum(c.purchase_price) filter (where c.is_active = true), 0) as total_cost,
  -- Coût par km global
  case
    when b.total_km > 0
    then round(
      (coalesce(b.purchase_price, 0) + coalesce(sum(c.purchase_price) filter (where c.is_active = true), 0))
      / b.total_km
    ::numeric, 2)
    else null
  end as cost_per_km,
  -- Composant le plus critique
  (
    select cs.name
    from component_stats cs
    where cs.bike_id = b.id and cs.is_active = true and cs.status = 'bad'
    order by cs.wear_pct desc
    limit 1
  ) as most_critical_component
from bikes b
left join components c on c.bike_id = b.id
group by b.id;
