-- Rendre component_id nullable et passer ON DELETE CASCADE → SET NULL
-- Ainsi, supprimer un composant ne supprime pas les logs de maintenance

ALTER TABLE maintenance_logs
  DROP CONSTRAINT maintenance_logs_component_id_fkey;

ALTER TABLE maintenance_logs
  ALTER COLUMN component_id DROP NOT NULL;

ALTER TABLE maintenance_logs
  ADD CONSTRAINT maintenance_logs_component_id_fkey
  FOREIGN KEY (component_id)
  REFERENCES components(id)
  ON DELETE SET NULL;
