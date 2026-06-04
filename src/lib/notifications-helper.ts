import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Génère des notifications d'usure pour les composants qui dépassent
 * les seuils configurés. Évite les doublons sur les notifs non lues.
 * Appelée après chaque recalcul d'usure (sync Strava ou manuel).
 */
export async function createWearNotifications(supabase: SupabaseClient, userId: string) {
  // Paramètres de notification
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('notify_warn, notify_bad, warn_threshold, bad_threshold')
    .eq('user_id', userId)
    .single()

  const notifyWarn    = settings?.notify_warn    ?? true
  const notifyBad     = settings?.notify_bad     ?? true
  const warnThreshold = settings?.warn_threshold ?? 80
  const badThreshold  = settings?.bad_threshold  ?? 100

  if (!notifyWarn && !notifyBad) return

  // Composants actifs avec usure
  const { data: allComps } = await supabase
    .from('component_stats')
    .select('id, name, bike_id, wear_pct, bikes(name)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .not('wear_pct', 'is', null)

  if (!allComps || allComps.length === 0) return

  const alertComps: { id: string; name: string; bike_id: string; bike_name: string; type: 'warn' | 'bad' }[] = []

  for (const c of allComps) {
    const pct = (c.wear_pct as number) ?? 0
    const bikeRaw = c.bikes as { name: string } | { name: string }[] | null
    const bikeName = Array.isArray(bikeRaw) ? (bikeRaw[0]?.name ?? '—') : (bikeRaw?.name ?? '—')

    if (notifyBad && pct >= badThreshold) {
      alertComps.push({ id: c.id as string, name: c.name as string, bike_id: c.bike_id as string, bike_name: bikeName, type: 'bad' })
    } else if (notifyWarn && pct >= warnThreshold && pct < badThreshold) {
      alertComps.push({ id: c.id as string, name: c.name as string, bike_id: c.bike_id as string, bike_name: bikeName, type: 'warn' })
    }
  }

  if (alertComps.length === 0) return

  // Éviter les doublons sur notifs non lues
  const compIds = alertComps.map(c => c.id)
  const { data: existing } = await supabase
    .from('notifications')
    .select('component_id, type')
    .eq('user_id', userId)
    .eq('read', false)
    .in('component_id', compIds)

  const existingSet = new Set((existing ?? []).map(n => `${n.component_id}:${n.type}`))

  const toInsert = alertComps
    .filter(c => !existingSet.has(`${c.id}:${c.type}`))
    .map(c => ({
      user_id:        userId,
      component_id:   c.id,
      bike_id:        c.bike_id,
      component_name: c.name,
      bike_name:      c.bike_name,
      type:           c.type,
      read:           false,
    }))

  if (toInsert.length > 0) {
    await supabase.from('notifications').insert(toInsert)
  }
}
