-- ============================================================
-- Bike Insight — Agrégats d'activité par vélo
-- Migration : 20260725000001_activity_bike_stats
--
-- But : éviter de rapatrier toutes les activités (parfois des années
-- d'historique) pour les additionner en JavaScript à chaque affichage du
-- dashboard, de la page coût et de la page vélos. Postgres agrège en une
-- passe et ne renvoie qu'une ligne par vélo.
-- ============================================================

-- Index composite qui sert la vue : filtrer par utilisateur, regrouper par
-- vélo, et découper par fenêtre temporelle (90 j / 365 j) sur started_at.
create index if not exists idx_activities_user_bike_started
  on activities (user_id, bike_id, started_at desc);

-- ============================================================
-- VIEW : activity_bike_stats
-- Une ligne par (user_id, bike_id) avec les chiffres réellement affichés.
-- security_invoker = true → la RLS de la table activities s'applique à
-- l'appelant (chaque utilisateur ne voit que ses propres activités).
-- ============================================================
create or replace view activity_bike_stats
with (security_invoker = true) as
select
  a.user_id,
  a.bike_id,
  -- Sorties à vie + dernière sortie (page vélos)
  count(*)                                    as rides_total,
  max(a.started_at)                           as last_ride_at,
  -- Fenêtre 12 mois (dashboard, coût, ordre du sélecteur)
  count(*) filter (
    where a.started_at >= now() - interval '365 days'
  )                                           as rides_365d,
  coalesce(sum(a.distance_km) filter (
    where a.started_at >= now() - interval '365 days'
  ), 0)                                       as km_365d,
  -- Fenêtre 90 jours (rythme km/semaine, avec repli sur 12 mois côté app)
  coalesce(sum(a.distance_km) filter (
    where a.started_at >= now() - interval '90 days'
  ), 0)                                       as km_90d
from activities a
group by a.user_id, a.bike_id;

comment on view activity_bike_stats is
  'Agrégats d''activité par vélo (à vie + 12 mois + 90 jours). Remplace le calcul JS.';
