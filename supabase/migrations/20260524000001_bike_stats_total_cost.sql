-- ============================================================
-- Migration: bike_stats inclut tous les composants pour le coût
-- Le coût de possession doit compter actifs + archivés
-- ============================================================

DROP VIEW IF EXISTS bike_stats;

CREATE OR REPLACE VIEW bike_stats AS
SELECT
  b.id,
  b.user_id,
  b.name,
  b.brand,
  b.model,
  b.total_km,
  b.purchase_price,
  b.strava_gear_id,
  b.is_active,
  -- Nombre de composants actifs uniquement
  COUNT(c.id) FILTER (WHERE c.is_active = true) AS component_count,
  -- Coût total composants = actifs + archivés (vrai coût de possession)
  COALESCE(SUM(c.purchase_price), 0) AS components_cost,
  -- Coût total vélo
  COALESCE(b.purchase_price, 0) + COALESCE(SUM(c.purchase_price), 0) AS total_cost,
  -- Coût par km
  CASE
    WHEN b.total_km > 0
    THEN ROUND(
      (COALESCE(b.purchase_price, 0) + COALESCE(SUM(c.purchase_price), 0))
      / b.total_km
    ::numeric, 2)
    ELSE NULL
  END AS cost_per_km,
  -- Composant le plus critique (actifs seulement)
  (
    SELECT cs.name
    FROM component_stats cs
    WHERE cs.bike_id = b.id AND cs.is_active = true AND cs.status = 'bad'
    ORDER BY cs.wear_pct DESC
    LIMIT 1
  ) AS most_critical_component
FROM bikes b
LEFT JOIN components c ON c.bike_id = b.id
GROUP BY b.id;
