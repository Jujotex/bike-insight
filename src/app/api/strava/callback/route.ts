import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/connect/strava?error=access_denied`)
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`)
  }

  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/connect/strava?error=token_exchange`)
  }

  const tokenData = await tokenRes.json()
  const { access_token, refresh_token, expires_at, athlete } = tokenData

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      strava_access_token: access_token,
      strava_refresh_token: refresh_token,
      strava_token_expires_at: expires_at,
      strava_athlete_id: athlete.id,
    })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.redirect(`${appUrl}/connect/strava?error=db_error`)
  }

  // Fetch athlete complet pour avoir les vélos (plus fiable que athlete.bikes du token exchange)
  let allBikes: Array<{ id: string; name: string; distance: number }> = []

  try {
    const athleteRes = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (athleteRes.ok) {
      const fullAthlete = await athleteRes.json()
      allBikes = fullAthlete.bikes ?? []
    }
  } catch {
    // Fallback sur les vélos du token exchange si l'appel échoue
    allBikes = athlete?.bikes ?? []
  }

  if (allBikes.length > 0) {
    const bikesData = allBikes.map((bike) => ({
      user_id: user.id,
      strava_gear_id: bike.id,
      name: bike.name,
      total_km: Math.round(bike.distance / 1000),
      is_active: true,
    }))

    await supabase
      .from('bikes')
      .upsert(bikesData, { onConflict: 'strava_gear_id', ignoreDuplicates: false })
  }

  // Déclenche l'import des activités en arrière-plan
  fetch(`${appUrl}/api/strava/import`, {
    method: 'POST',
    headers: { Cookie: request.headers.get('cookie') ?? '' },
  }).catch(() => {}) // non-bloquant

  return NextResponse.redirect(`${appUrl}/connect/strava?success=true`)
}
