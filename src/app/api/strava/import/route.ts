import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getValidStravaToken } from '@/lib/strava'

const DAYS_TO_IMPORT = 90
const PAGE_SIZE = 100

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let accessToken: string | null = null
  try {
    accessToken = await getValidStravaToken(user.id)
  } catch (err) {
    console.error('[sync] getValidStravaToken error:', err)
    return NextResponse.json({ error: 'Erreur lors du refresh du token Strava' }, { status: 500 })
  }

  if (!accessToken) {
    return NextResponse.json({ error: 'Token Strava invalide ou expiré — reconnecte ton compte Strava' }, { status: 401 })
  }

  // Récupère les vélos de l'utilisateur pour mapper strava_gear_id → bike_id
  const { data: bikes } = await supabase
    .from('bikes')
    .select('id, strava_gear_id')
    .eq('user_id', user.id)

  const bikeMap = new Map<string, string>()
  bikes?.forEach(b => { if (b.strava_gear_id) bikeMap.set(b.strava_gear_id, b.id) })

  // Fetch des activités Strava (paginé)
  const after = Math.floor((Date.now() - DAYS_TO_IMPORT * 24 * 60 * 60 * 1000) / 1000)
  let page = 1
  let totalImported = 0
  const allActivities: object[] = []

  while (true) {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=${PAGE_SIZE}&page=${page}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!res.ok) {
      console.error('[sync] Strava activities fetch failed:', res.status, await res.text().catch(() => ''))
      break
    }

    const activities = await res.json()
    if (!Array.isArray(activities) || activities.length === 0) break

    const rows = activities.map((a: {
      id: number
      name: string
      distance: number
      moving_time: number
      total_elevation_gain: number
      start_date: string
      gear_id: string | null
    }) => ({
      user_id: user.id,
      strava_id: a.id,
      bike_id: a.gear_id ? (bikeMap.get(a.gear_id) ?? null) : null,
      name: a.name,
      distance_km: Math.round((a.distance / 1000) * 10) / 10,
      moving_time_s: a.moving_time,
      elevation_m: a.total_elevation_gain,
      started_at: a.start_date,
    }))

    allActivities.push(...rows)
    page++

    if (activities.length < PAGE_SIZE) break
  }

  // Upsert en batch
  if (allActivities.length > 0) {
    const { error } = await supabase
      .from('activities')
      .upsert(allActivities, { onConflict: 'strava_id', ignoreDuplicates: false })

    if (error) {
      console.error('[sync] upsert activities error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    totalImported = allActivities.length
  }

  // Met à jour total_km depuis Strava (kilométrage de vie total, pas juste les 90j importés)
  try {
    const athleteRes = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (athleteRes.ok) {
      const athlete = await athleteRes.json()
      const gears: Array<{ id: string; distance: number }> = athlete.bikes ?? []
      for (const gear of gears) {
        const bikeId = bikeMap.get(gear.id)
        if (bikeId) {
          await supabase
            .from('bikes')
            .update({ total_km: Math.round(gear.distance / 1000) })
            .eq('id', bikeId)
        }
      }
    }
  } catch (err) {
    console.error('[sync] athlete fetch error:', err)
    // Fail silently — total_km sera mis à jour au prochain import
  }

  // Recalcule km_used sur tous les composants actifs (déclenche le trigger statut ok/warn/bad)
  const { error: rpcError } = await supabase.rpc('recalculate_component_km', { p_user_id: user.id })
  if (rpcError) {
    console.error('[sync] recalculate_component_km error:', rpcError)
    // Ne pas bloquer la réponse — les km seront recalculés au prochain import
  }

  return NextResponse.json({ imported: totalImported, pages: page - 1 })
}
