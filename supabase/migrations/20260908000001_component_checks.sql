-- ============================================================
-- Bike Insight — Contrôles de pièce (« je l'ai vérifiée, elle tient encore »)
-- Migration : 20260908000001_component_checks
-- ============================================================
--
-- Le moteur d'usure ne connaît que des kilomètres : une chaîne à 5 000 km sur
-- une durée de vie déclarée de 5 000 km passe en rouge, même quand le pied à
-- coulisse dit qu'elle est encore bonne. L'utilisateur en sait alors plus que
-- l'app — il faut qu'il puisse le lui dire.
--
-- Choix : le contrôle **révise `components.km_max`** plutôt que d'introduire un
-- crédit de kilomètres à part. `km_max` est déjà une estimation modifiable à la
-- main (écran « Modifier ») ; un contrôle n'est rien d'autre que cette même
-- révision, guidée et tracée. Une colonne parallèle aurait obligé à changer la
-- vue `component_stats`, le trigger de statut et les quinze endroits qui lisent
-- `km_max` — pour le même résultat affiché.
--
-- La valeur d'origine n'est pas perdue : chaque contrôle écrit son avant/après
-- dans `maintenance_logs`, ce qui rend la révision auditable et réversible.

ALTER TABLE maintenance_logs
  ADD COLUMN IF NOT EXISTS km_added      numeric(10,2),
  ADD COLUMN IF NOT EXISTS km_max_before numeric(10,2),
  ADD COLUMN IF NOT EXISTS km_max_after  numeric(10,2);

COMMENT ON COLUMN maintenance_logs.km_added IS
  'Kilomètres ajoutés à la durée de vie lors d''un contrôle (action = ''Contrôle''). Null ailleurs.';
COMMENT ON COLUMN maintenance_logs.km_max_before IS
  'Durée de vie de la pièce avant le contrôle — permet de retrouver l''estimation initiale.';
COMMENT ON COLUMN maintenance_logs.km_max_after IS
  'Durée de vie après le contrôle (km_max_before + km_added).';

-- Un contrôle ne peut que prolonger ou confirmer : jamais raccourcir en négatif.
ALTER TABLE maintenance_logs
  DROP CONSTRAINT IF EXISTS km_added_non_negative;
ALTER TABLE maintenance_logs
  ADD CONSTRAINT km_added_non_negative CHECK (km_added IS NULL OR km_added >= 0);

-- Retrouver les contrôles d'une pièce sans scanner tout l'historique.
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_km_added
  ON maintenance_logs(component_id) WHERE km_added IS NOT NULL;
