-- ============================================================
-- Bike Insight — Minimisation des données Strava conservées
-- Migration : 20260812000001_minimize_strava_activity_data
-- ============================================================
--
-- Contexte : API Policy Strava (1er juin 2026).
--   §6.4 — « you may use and retain Data only so long as necessary for the
--           purpose for which it was originally obtained »
--   §6.2 — limite de rétention en cache
--
-- Constat : `activities.name`, `.moving_time_s` et `.elevation_m` étaient écrits
-- par l'import Strava mais lus par la seule fonction `getSyncData`, orpheline
-- (jamais importée). Il s'agissait donc de contenu d'athlète conservé sans
-- finalité — le seul point de non-conformité indiscutable de l'audit.
--
-- Ce qui reste conservé, et pourquoi :
--   strava_id   → idempotence de l'upsert (sinon double comptage des km à chaque
--                 resync) ET capacité à retirer la contribution d'une sortie
--                 supprimée par l'athlète, comme l'exige le §6.3 (sous 48 h).
--   bike_id, distance_km, started_at
--               → seules colonnes lues par le moteur de graphes et les
--                 statistiques 12 mois.
--
-- Le moteur d'usure lui-même ne lit pas cette table : il calcule
-- `bikes.total_km - components.installed_km`. Cette purge est donc sans effet
-- sur l'usure, les statuts et les coûts.
--
-- ⚠️ Migration DESTRUCTIVE (perte de données définitive). À appliquer
--    manuellement sur Supabase après sauvegarde.
-- ============================================================

-- ── 1. Purge du contenu Strava non utilisé ───────────────────
--
-- IMPORTANT : `name` est conservé pour les sorties SAISIES MANUELLEMENT
-- (`manual-ride-button`, où `strava_id is null`). C'est une donnée de
-- l'utilisateur, pas une donnée Strava : elle n'est pas concernée par la Policy
-- et elle est affichée dans l'app. On ne purge donc que les lignes d'origine
-- Strava.

update activities
set name = null
where strava_id is not null
  and name is not null;

-- `moving_time_s` et `elevation_m` ne sont alimentés que par l'import Strava :
-- purge inconditionnelle.

update activities
set moving_time_s = null,
    elevation_m   = null
where moving_time_s is not null
   or elevation_m is not null;

-- ── 2. Empêcher la réintroduction ────────────────────────────
--
-- Les colonnes sont conservées (`name` sert aux sorties manuelles), mais une
-- contrainte garantit qu'aucun code futur ne réécrira du contenu Strava.

alter table activities
  add constraint activities_no_strava_content check (
    strava_id is null
    or (name is null and moving_time_s is null and elevation_m is null)
  );

comment on constraint activities_no_strava_content on activities is
  'API Policy Strava §6.4 : aucune donnée Strava conservée sans finalité. Les sorties importées ne stockent que km, date, vélo et identifiant. Le nom reste permis pour les sorties manuelles (strava_id null).';

comment on table activities is
  'Sorties : import Strava (données minimisées — cf. contrainte activities_no_strava_content) + saisies manuelles. Source de vérité des km.';
