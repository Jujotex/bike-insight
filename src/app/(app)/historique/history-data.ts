import type { SupabaseClient } from '@supabase/supabase-js'
import { assertNoError } from '@/lib/supabase-result'
import type { HistoryItem } from './history-log'

/**
 * Données de la page Historique.
 *
 * Extraite de la page lors du passage en composant client (phase 2.1). La requête
 * est rigoureusement identique à celle qui tournait côté serveur : c'est le
 * **client** qui change, pas le SQL. Ce qui rend ce déplacement acceptable, c'est
 * que la RLS fait réellement le cloisonnement depuis le correctif des vues du
 * 12/08/2026 — avant, une requête émise depuis le navigateur aurait pu lire les
 * données des autres utilisateurs.
 */

export type BikeOption = {
  id: string
  name: string
  status: 'ok' | 'warn' | 'bad'
}

export type HistoryData = {
  bikes: BikeOption[]
  selectedBikeId: string
  items: HistoryItem[]
}

export async function loadHistoryData(
  supabase: SupabaseClient,
  userId: string,
  requestedBikeId: string | null
): Promise<HistoryData> {
  const results = await Promise.all([
    supabase
      .from('bikes')
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('total_km', { ascending: false }),
    // État des pièces de chaque vélo → pastille colorée du sélecteur.
    supabase
      .from('component_stats')
      .select('bike_id, status')
      .eq('user_id', userId)
      .eq('is_active', true),
  ])

  assertNoError(results, 'historique')
  const [{ data: bikes }, { data: compStatuses }] = results

  const statusByBike = new Map<string, 'ok' | 'warn' | 'bad'>()
  for (const c of compStatuses ?? []) {
    const bid = c.bike_id as string
    const st = c.status as string
    const cur = statusByBike.get(bid)
    if (st === 'bad') statusByBike.set(bid, 'bad')
    else if (st === 'warn' && cur !== 'bad') statusByBike.set(bid, 'warn')
    else if (!cur) statusByBike.set(bid, 'ok')
  }

  const bikeList: BikeOption[] = (bikes ?? []).map(b => ({
    id: b.id as string,
    name: b.name as string,
    status: statusByBike.get(b.id as string) ?? ('ok' as const),
  }))

  const selectedBikeId =
    requestedBikeId && bikeList.some(b => b.id === requestedBikeId)
      ? requestedBikeId
      : bikeList[0]?.id ?? ''

  if (!selectedBikeId) return { bikes: bikeList, selectedBikeId: '', items: [] }

  const logsRes = await supabase
    .from('maintenance_logs')
    .select(
      'id, action, maintenance_type, bike_id, performed_at, km_at_action, cost, reason, components(name, bike_id)'
    )
    .eq('user_id', userId)
    .order('performed_at', { ascending: false })
    .limit(400)

  assertNoError([logsRes], 'historique')
  const { data: logRows } = logsRes

  const items: HistoryItem[] = (logRows ?? [])
    .filter(l => {
      const cr = (l as { components?: { bike_id?: string } | { bike_id?: string }[] | null }).components
      const c = Array.isArray(cr) ? cr[0] : cr
      const logBike = (l as { bike_id?: string | null }).bike_id ?? c?.bike_id ?? null
      return logBike === selectedBikeId
    })
    .slice(0, 200)
    .map(l => {
      const compRaw = (l as { components?: { name?: string } | { name?: string }[] | null }).components
      const comp = Array.isArray(compRaw) ? compRaw[0] : compRaw
      const isMaint = (l as { maintenance_type?: string | null }).maintenance_type != null
      return {
        id: (l as { id: string }).id,
        kind: (isMaint ? 'maint' : 'repl') as HistoryItem['kind'],
        title: isMaint ? (l as { action: string }).action : comp?.name ?? 'Pièce remplacée',
        dateISO: (l as { performed_at: string }).performed_at,
        km: (l as { km_at_action?: number | null }).km_at_action ?? null,
        reason: (l as { reason?: string | null }).reason ?? null,
        cost: (l as { cost?: number | null }).cost ?? null,
      }
    })

  return { bikes: bikeList, selectedBikeId, items }
}
