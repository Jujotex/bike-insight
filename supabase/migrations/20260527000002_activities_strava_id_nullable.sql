-- Rend strava_id nullable pour permettre les sorties saisies manuellement
-- La contrainte UNIQUE reste — Postgres traite chaque NULL comme distinct
-- donc plusieurs sorties manuelles peuvent coexister sans conflit

ALTER TABLE activities
  ALTER COLUMN strava_id DROP NOT NULL;
