import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// POST /api/notifications/read — marque toutes les notifs comme lues
// ou { id } pour une seule
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const id: string | undefined = body?.id

  let query = supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)

  if (id) query = query.eq('id', id)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextRespons