-- ============================================================
-- Purge des activités non cyclistes historiques
-- Migration : 20260715000001_purge_non_cycling_activities
-- ============================================================
-- Contexte : avant le correctif de l'import Strava, TOUTES les
-- activités (course à pied, marche, natation…) étaient importées
-- dans `activities`, gonflant les KPI km/sorties. L'import filtre
-- désormais sur les types vélo (Ride, MountainBikeRide, GravelRide,
-- EBikeRide, EMountainBikeRide, VirtualRide, Handcycle, Velomobile),
-- mais le stock historique reste pollué.
--
-- La table `activities` ne stocke pas `sport_type` : impossible de
-- distinguer directement une course à pied d'une sortie vélo. Le seul
-- critère fiable est `bike_id` :
--   * une activité non cycliste ne peut JAMAIS avoir de vélo — Strava
--     n'attache un gear vélo (« b… ») qu'aux sorties vélo, et l'import
--     ne mappe que les gears de `athlete.bikes` ;
--   * on supprime donc les lignes importées de Strava
--     (`strava_id is not null`) sans vélo (`bike_id is null`).
--
-- Effet de bord assumé : les sorties vélo Strava SANS gear assigné
-- sont aussi supprimées. Elles ne comptaient déjà pas dans l'usure
-- des pièces (bike_id null) ; celles des 90 derniers jours seront
-- réimportées par le resync complet (last_sync_at remis à null
-- ci-dessous), les plus anciennes sont perdues pour les KPI 12 mois.
-- Les sorties saisies manuellement (`strava_id is null`) sont
-- intactes.
--
-- ⚠️ Étapes manuelles après application sur Supabase :
--   1. appliquer cette migration (supabase db push ou SQL editor) ;
--   2. relancer une synchronisation Strava depuis l'app (last_sync_at
--      étant remis à null, elle réimporte les 90 derniers jours en ne
--      gardant que les types vélo) ;
--   3. le recalcul d'usure est déclenché ici puis à nouveau en fin de
--      sync — rien d'autre à faire.
-- ============================================================

-- NB : écrit en deux instructions autonomes (sans bloc `do $$` ni table
-- temporaire) pour rester exécutable par tout runner, y compris ceux qui
-- découpent sur `;` et ouvrent une session par instruction. Chaque
-- instruction est valide et complète isolément.

-- 1. Supprimer les activités importées de Strava sans vélo ET, dans la
--    même requête (CTE de modification), forcer un resync complet des
--    utilisateurs concernés. Le `delete ... returning` alimente le
--    `update`, donc pas besoin de mémoriser l'ensemble entre deux étapes.
with deleted as (
  delete from activities
  where strava_id is not null
    and bike_id is null
  returning user_id
)
update profiles set last_sync_at = null
where id in (select distinct user_id from deleted where user_id is not null);

-- 2. Recalcul immédiat de l'usure. Appliqué à tous les utilisateurs :
--    idempotent, basé sur les activités restantes (post-suppression), et
--    de toute façon relancé en fin de resync. Plus simple et plus sûr que
--    de retenir l'ensemble exact des utilisateurs touchés.
select recalculate_component_km(id) from profiles;
