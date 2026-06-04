import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createWearNotifications } from '@/lib/notifications-helper'

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

  // 2. Notifications
  await createWearNotifications(supabase, user.id)

  return NextResponse.json({ ok: true })
}
