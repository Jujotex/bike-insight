-- Entretiens au niveau vélo (lubrification chaîne, purge freins, ...)
-- La table maintenance_logs servait uniquement l'historique par composant ;
-- on ajoute un rattachement direct au vélo + un type d'entretien normalisé.

ALTER TABLE maintenance_logs
  ADD COLUMN IF NOT EXISTS bike_id uuid REFERENCES bikes(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS maintenance_type text;

CREATE INDEX IF NOT EXISTS idx_maintenance_logs_bike_id ON maintenance_logs(bike_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_type ON maintenance_logs(maintenance_type);

COMMENT ON COLUMN maintenance_logs.bike_id IS
  'Vélo concerné pour les entretiens au niveau vélo (component_id est alors null)';
COMMENT ON COLUMN maintenance_logs.maintenance_type IS
  'Slug du type d''entretien — voir src/lib/maintenance-catalog.ts (ex: lubrification-chaine)';
