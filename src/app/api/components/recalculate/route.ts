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

  // 2. Fetch composants warn/bad après recalcul
  const { data: alertComps } = await supabase
    .from('component_stats')
    .select('id, name, bike_id, status, bikes(name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .in('status', ['warn', 'bad'])

  if (alertComps && alertComps.length > 0) {
    // 3. Notifs déjà non lues pour ces composants (évite les doublons)
    const compIds = alertComps.map(c => c.id as string)
    const { data: existing } = await supabase
      .from('notifications')
      .select('component_id, type')
      .eq('user_id', user.id)
      .eq('read', false)
      .in('component_id', compIds)

    const existingSet = new Set(
      (existing ?? []).map(n => `${n.component_id}:${n.type}`)
    )

    const toInsert = alertComps
      .filter(c => {
        const key = `${c.id}:${c.status}`
        return !existingSet.has(key)
      })
      .map(c => {
        const bikeRaw = c.bikes as { name: string } | { name: string }[] | null
        const bikeName = Array.isArray(bikeRaw) ? (bikeRaw[0]?.name ?? '—') : (bikeRaw?.name ?? '—')
        return {
          user_id:        user.id,
          component_id:   c.id as string,
          bike_id:        c.bike_id as string,
          component_name: c.name as string,
          bike_name:      bikeName,
          type:           c.status as string,
          read:           false,
        }
      })

    if (toInsert.length > 0) {
      await supabase.from('notifications').insert(toInsert)
    }
  }

  return NextResponse.json({ ok: true })
}
