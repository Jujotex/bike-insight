// Lecture des types d'entretien depuis la base (table maintenance_types).
// Remplace l'ancien tableau en dur MAINTENANCE_TYPES : chaque vélo a sa liste.
// Le `slug` sert de clé stable avec maintenance_logs.maintenance_type.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { MaintenanceDef } from './maintenance-catalog'

export type MaintenanceTypeRow = {
  id: string
  bike_id: string
  slug: string
  label: string
  sub: string | null
  interval_km: number | null
  interval_months: number | null
  default_cost: number | null
  sort_order: number
}

const SELECT =
  'id, bike_id, slug, label, sub, interval_km, interval_months, default_cost, sort_order'

// Convertit une ligne DB en MaintenanceDef consommable par computeMaintenanceStatus.
export function mapRowToDef(row: MaintenanceTypeRow): MaintenanceDef {
  return {
    id: row.slug,
    label: row.label,
    sub: row.sub ?? '',
    intervalKm: row.interval_km ?? undefined,
    intervalMonths: row.interval_months ?? undefined,
    defaultCost: row.default_cost ?? undefined,
  }
}

// Types d'un seul vélo (page vélo).
export async function fetchBikeMaintenanceDefs(
  supabase: SupabaseClient,
  bikeId: string
): Promise<MaintenanceDef[]> {
  const { data } = await supabase
    .from('maintenance_types')
    .select(SELECT)
    .eq('bike_id', bikeId)
    .order('sort_order', { ascending: true })
  return (data ?? []).map(r => mapRowToDef(r as MaintenanceTypeRow))
}

// Types de tous les vélos de l'utilisateur, groupés par bike_id
// (dashboard + notifications).
export async function fetchUserMaintenanceDefsByBike(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<string, MaintenanceDef[]>> {
  const { data } = await supabase
    .from('maintenance_types')
    .select(SELECT)
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  const byBike: Record<string, MaintenanceDef[]> = {}
  for (const r of data ?? []) {
    const row = r as MaintenanceTypeRow
    ;(byBike[row.bike_id] ??= []).push(mapRowToDef(row))
  }
  return byBike
}
