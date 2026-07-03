-- Notifications d'entretien (lubrification, purge, ...)
-- Les notifications d'entretien réutilisent la table notifications :
-- component_id est null, component_name porte le libellé de l'entretien,
-- et maintenance_type permet le dédoublonnage par vélo + type.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS maintenance_type text;

COMMENT ON COLUMN notifications.maintenance_type IS
  'Slug du type d''entretien (voir src/lib/maintenance-catalog.ts) — null pour les notifications d''usure de pièce';
