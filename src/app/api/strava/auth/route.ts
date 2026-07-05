import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!))
  }

  const stravaAuthUrl = new URL('https://www.strava.com/oauth/authorize')
  stravaAuthUrl.searchParams.set('client_id', process.env.STRAVA_CLIENT_ID!)
  stravaAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`)
  stravaAuthUrl.searchParams.set('response_type', 'code')
  stravaAuthUrl.searchParams.set('approval_prompt', 'auto')
  // activity:write requis pour ajouter l'alerte d'usure dans la description des sorties
  stravaAuthUrl.searchParams.set('scope', 'activity:read_all,activity:write,profile:read_all')

  return NextResponse.redirect(stravaAuthUrl.toString())
}
