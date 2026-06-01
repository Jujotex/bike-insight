import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// GET — récupère les paramètres (ou les défauts si pas encore configuré)
export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data } = await supabase
    .from('notification_settings')
    .select('notify_warn, notify_bad')
    .eq('user_id', user.id)
    .single()

  // Valeurs par défaut si aucun réglage enregistré
  return NextResponse.json({
    notify_warn: data?.notify_warn ?? true,
    notify_bad:  data?.notify_bad  ?? true,
  })
}

// POST — upsert les paramètres
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const notify_warn = typeof body.notify_warn === 'boolean' ? body.notify_warn : true
  const notify_bad  = typeof body.notify_bad  === 'boolean' ? body.notify_bad  : true

  const { error } = await supabase
    .from('notification_settings')
    .upsert({ user_id: user.id, notify_warn, notify_bad })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
