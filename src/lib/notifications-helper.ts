import type { SupabaseClient } from '@supabase/supabase-js'
import { computeMaintenanceStatus, type MaintenanceLast } from './maintenance-catalog'
import { fetchUserMaintenanceDefsByBike } from './maintenance-types'

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

/**
 * Génère des notifications pour les entretiens dus ou bientôt dus
 * (lubrification, purge, révision, ...). Même principe que l'usure :
 * pas de doublon tant que la notification précédente n'est pas lue,
 * et on n'alerte que sur les entretiens déjà enregistrés au moins une fois.
 */
export async function createMaintenanceNotifications(supabase: SupabaseClient, userId: string) {
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('notify_warn, notify_bad')
    .eq('user_id', userId)
    .single()

  const notifyWarn = settings?.notify_warn ?? true
  const notifyBad  = settings?.notify_bad  ?? true
  if (!notifyWarn && !notifyBad) return

  const [{ data: bikes }, { data: logs }] = await Promise.all([
    supabase
      .from('bikes')
      .select('id, name, total_km')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('maintenance_logs')
      .select('bike_id, maintenance_type, performed_at, km_at_action')
      .eq('user_id', userId)
      .not('maintenance_type', 'is', null)
      .order('performed_at', { ascending: false }),
  ])

  if (!bikes || bikes.length === 0) return

  const defsByBike = await fetchUserMaintenanceDefsByBike(supabase, userId)

  const lastByKey: Record<string, MaintenanceLast> = {}
  for (const l of logs ?? []) {
    const key = `${l.bike_id}:${l.maintenance_type}`
    if (!(key in lastByKey)) {
      lastByKey[key] = {
        performed_at: l.performed_at as string,
        km_at_action: (l.km_at_action as number | null) ?? null,
      }
    }
  }

  const alerts: { bike_id: string; bike_name: string; maintenance_type: string; label: string; type: 'warn' | 'bad' }[] = []
  for (const b of bikes) {
    const bikeKm = (b.total_km as number) ?? 0
    for (const def of (defsByBike[b.id as string] ?? [])) {
      const last = lastByKey[`${b.id}:${def.id}`] ?? null
      if (!last) continue
      const st = computeMaintenanceStatus(def, last, bikeKm)
      if (st.state === 'due' && notifyBad) {
        alerts.push({ bike_id: b.id as string, bike_name: (b.name as string) ?? '—', maintenance_type: def.id, label: def.label, type: 'bad' })
      } else if (st.state === 'soon' && notifyWarn) {
        alerts.push({ bike_id: b.id as string, bike_name: (b.name as string) ?? '—', maintenance_type: def.id, label: def.label, type: 'warn' })
      }
    }
  }
  if (alerts.length === 0) return

  // Dédoublonnage sur les notifications d'entretien non lues
  const { data: existing } = await supabase
    .from('notifications')
    .select('bike_id, maintenance_type, type')
    .eq('user_id', userId)
    .eq('read', false)
    .not('maintenance_type', 'is', null)

  const existingSet = new Set((existing ?? []).map(n => `${n.bike_id}:${n.maintenance_type}:${n.type}`))

  const toInsert = alerts
    .filter(a => !existingSet.has(`${a.bike_id}:${a.maintenance_type}:${a.type}`))
    .map(a => ({
      user_id:          userId,
      component_id:     null,
      bike_id:          a.bike_id,
      component_name:   a.label,
      bike_name:        a.bike_name,
      type:             a.type,
      maintenance_type: a.maintenance_type,
      read:             false,
    }))

  if (toInsert.length > 0) {
    await supabase.from('notifications').insert(toInsert)
  }
}
