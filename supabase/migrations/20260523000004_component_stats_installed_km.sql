-- ============================================================
-- Migration: add installed_km to component_stats view
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
  c.installed_km,
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
