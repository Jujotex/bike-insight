-- ============================================================
-- Bike Insight — Les sorties manuelles n'étaient plus comptées
-- Migration : 20260812000004_bikes_manual_km
-- ============================================================
--
-- 🔴 BUG. `bikes.total_km` a deux écrivains qui se contredisent :
--
--   • `manual-ride-button.tsx` l'incrémente à chaque sortie saisie à la main ;
--   • `api/strava/import/route.ts` l'ÉCRASE avec l'odomètre Strava du gear
--     (`round(g.distance / 1000)`), sans condition.
--
-- Conséquence : sur un vélo relié à Strava, **toute sortie manuelle disparaît à la
-- synchronisation suivante**. La ligne survit dans `activities`, mais `total_km` —
-- qui pilote tout le calcul d'usure — revient à la valeur Strava.
--
-- C'est d'autant plus gênant que la saisie manuelle est censée devenir un chemin
-- de première classe : c'est ce qui doit permettre à l'app de fonctionner sans
-- Strava.
--
-- ── Correctif ────────────────────────────────────────────────
--
-- Une colonne dédiée `manual_km` accumule les kilomètres inconnus de Strava, et
-- l'import calcule désormais :
--
--     total_km = odomètre Strava du gear + manual_km
--
-- Pourquoi une colonne plutôt qu'une somme calculée depuis `activities` : si la
-- question de rétention (§6.2 de l'API Policy) devait un jour imposer de purger les
-- anciennes activités, une somme calculée disparaîtrait avec elles. Une colonne
-- survit à la purge.
--
-- Les vélos sans `strava_gear_id` ne sont jamais touchés par l'import : pour eux
-- `total_km` reste la seule source de vérité et `manual_km` n'est qu'informatif.
-- ============================================================

alter table bikes
  add column if not exists manual_km numeric(10,2) not null default 0;

comment on column bikes.manual_km is
  'Kilomètres saisis manuellement, inconnus de Strava. L''import Strava calcule total_km = odomètre du gear + manual_km, sinon les sorties manuelles seraient écrasées à chaque synchronisation.';

-- ── Reconstitution de l'historique ───────────────────────────
--
-- Les sorties manuelles sont identifiables sans ambiguïté : `strava_id is null`.
-- Ce backfill **restaure** les kilomètres déjà perdus sur les vélos Strava : ils
-- réapparaîtront dans `total_km` à la prochaine synchronisation.

update bikes b
set manual_km = coalesce((
  select sum(a.distance_km)
  from activities a
  where a.bike_id = b.id
    and a.strava_id is null
), 0);

-- ── Contrôle ─────────────────────────────────────────────────
--
--   select b.name, b.total_km, b.manual_km, b.strava_gear_id
--   from bikes b where b.manual_km > 0;
--
-- Sur un vélo Strava avec manual_km > 0, total_km doit augmenter d'autant après
-- la prochaine synchronisation.
