import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data } = await supabase
    .from('notification_settings')
    .select('notify_warn, notify_bad, warn_threshold, bad_threshold, strava_wear_comment')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    notify_warn:         data?.notify_warn         ?? true,
    notify_bad:          data?.notify_bad          ?? true,
    warn_threshold:      data?.warn_threshold      ?? 80,
    bad_threshold:       data?.bad_threshold       ?? 100,
    strava_wear_comment: data?.strava_wear_comment ?? false,
  })
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()

  const payload = {
    user_id:             user.id,
    notify_warn:         typeof body.notify_warn         === 'boolean' ? body.notify_warn         : true,
    notify_bad:          typeof body.notify_bad          === 'boolean' ? body.notify_bad          : true,
    warn_threshold:      typeof body.warn_threshold      === 'number'  ? Math.min(95, Math.max(50, body.warn_threshold))  : 80,
    bad_threshold:       typeof body.bad_threshold       === 'number'  ? Math.min(120, Math.max(80, body.bad_threshold))  : 100,
    strava_wear_comment: typeof body.strava_wear_comment === 'boolean' ? body.strava_wear_comment : false,
  }

  const { error } = await supabase.from('notification_settings').upsert(payload)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
