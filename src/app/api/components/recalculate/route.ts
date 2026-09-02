import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { createWearNotifications, createMaintenanceNotifications } from '@/lib/notifications-helper'

export async function POST(request: Request) {
  // Cookie (web) ou jeton en en-tête (app native) — cf. `lib/api-auth.ts`.
  const auth = await getApiUser(request)
  if (!auth) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  const { user, supabase } = auth

  // 1. Recalcul de l'usure
  const { error } = await supabase.rpc('recalculate_component_km', { p_user_id: user.id })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 2. Notifications (usure + entretiens)
  await createWearNotifications(supabase, user.id)
  await createMaintenanceNotifications(supabase, user.id).catch(() => {})

  return NextResponse.json({ ok: true })
}
