import { createSupabaseServerClient } from './supabase-server'

export interface StravaTokens {
  access_token: string
  refresh_token: string
  expires_at: number
}

// Rafraîchit le token Strava si expiré, retourne un access_token valide
export async function getValidStravaToken(userId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
    .eq('id', userId)
    .single()

  if (!profile?.strava_access_token) return null

  const nowInSeconds = Math.floor(Date.now() / 1000)
  const isExpired = profile.strava_token_expires_at
    ? nowInSeconds >= profile.strava_token_expires_at - 300 // 5 min de marge
    : true

  if (!isExpired) return profile.strava_access_token

  // Refresh le token
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: profile.strava_refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) return null

  const tokens: StravaTokens = await res.json()

  await supabase
    .from('profiles')
    .update({
      strava_access_token: tokens.access_token,
      strava_refresh_token: tokens.refresh_token,
      strava_token_expires_at: tokens.expires_at,
    })
    .eq('id', userId)

  return tokens.access_token
}
