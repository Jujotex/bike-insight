import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Strava a refusé l'autorisation
  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/connect/strava?error=access_denied`)
  }

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
    return NextResponse.redirect(`${appUrl}/login`)
  }

  // Échange du code contre les tokens Strava
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

  // Stockage des tokens dans le profil
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

  // Création/mise à jour des vélos Strava dans la DB
  if (athlete.bikes && athlete.bikes.length > 0) {
    const bikesData = athlete.bikes.map((bike: {
      id: string
      name: string
      distance: number
    }) => ({
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

  return NextResponse.redirect(`${appUrl}/connect/strava?success=true`)
}
