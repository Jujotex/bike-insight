import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // 1. Recalcul de l'usure
  const { error } = await supabase.rpc('recalculate_component_km', { p_user_id: user.id })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 2. Paramètres de notification
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('notify_warn, notify_bad, warn_threshold, bad_threshold')
    .eq('user_id', user.id)
    .single()

  const notifyWarn    = settings?.notify_warn    ?? true
  const notifyBad     = settings?.notify_bad     ?? true
  const warnThreshold = settings?.warn_threshold ?? 80
  const badThreshold  = settings?.bad_threshold  ?? 100

  if (!notifyWarn && !notifyBad) {
    return NextResponse.json({ ok: true })
  }

  // 3. Fetch tous les composants actifs avec leur wear_pct
  const { data: allComps } = await supabase
    .from('component_stats')
    .select('id, name, bike_id, wear_pct, bikes(name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .not('wear_pct', 'is', null)

  if (!allComps || allComps.length === 0) {
    return NextResponse.json({ ok: true })
  }

  // 4. Déterminer le type d'alerte selon les seuils custom
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

  if (alertComps.length === 0) {
    return NextResponse.json({ ok: true })
  }

  // 5. Éviter les doublons — notifs non lues existantes
  const compIds = alertComps.map(c => c.id)
  const { data: existing } = await supabase
    .from('notifications')
    .select('component_id, type')
    .eq('user_id', user.id)
    .eq('read', false)
    .in('component_id', compIds)

  const existingSet = new Set((existing ?? []).map(n => `${n.component_id}:${n.type}`))

  const toInsert = alertComps
    .filter(c => !existingSet.has(`${c.id}:${c.type}`))
    .map(c => ({
      user_id:        user.id,
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

  return NextResponse.json({ ok: true })
}
