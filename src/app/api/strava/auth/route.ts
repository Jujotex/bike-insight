import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!))
  }

  const clientId = process.env.STRAVA_CLIENT_ID!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`

  const stravaAuthUrl = new URL('https://www.strava.com/oauth/authorize')
  stravaAuthUrl.searchParams.set('client_id', clientId)
  stravaAuthUrl.searchParams.set('redirect_uri', redirectUri)
  stravaAuthUrl.searchParams.set('response_type', 'code')
  stravaAuthUrl.searchParams.set('approval_prompt', 'auto')
  stravaAuthUrl.searchParams.set('scope', 'activity:read_all,profile:read_all')

  return NextResponse.redirect(stravaAuthUrl.toString())
}
