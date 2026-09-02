import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'

// POST /api/notifications/read — marque toutes les notifs comme lues
// ou { id } pour une seule
export async function POST(req: Request) {
  // Cookie (web) ou jeton en en-tête (app native) — cf. `lib/api-auth.ts`.
  const auth = await getApiUser(req)
  if (!auth) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { user, supabase } = auth

  const body = await req.json().catch(() => ({}))
  const id: string | undefined = body?.id

  let query = supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)

  if (id) query = query.eq('id', id)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
