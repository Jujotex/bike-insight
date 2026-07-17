import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createWearNotifications, createMaintenanceNotifications } from '@/lib/notifications-helper'
import { getValidStravaToken } from '@/lib/strava'
import { commentWearOnActivities } from '@/lib/strava-comment'

const PAGE_SIZE = 200  // max autorisé par Strava — limite le nombre de pages

// L'app ne suit que le vélo : on ignore course à pied, marche, natation, etc.
// Strava renvoie le type dans `sport_type` (récent) ou `type` (ancien).
const CYCLING_TYPES = new Set([
  'Ride',
  'MountainBikeRide',
  'GravelRide',
  'EBikeRide',
  'EMountainBikeRide',
  'VirtualRide',
  'Handcycle',
  'Velomobile',
])

function isCycling(a: { sport_type?: string; type?: string }): boolean {
  return CYCLING_TYPES.has(a.sport_type ?? a.type ?? '')
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  // ?full=1 → réimporte TOUT l'historique (backfill), même si déjà synchronisé.
  const fullReimport = new URL(request.url).searchParams.get('full') === '1'
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

  // ── Détermine la date de départ de l'import ───────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_sync_at')
    .eq('id', user.id)
    .single()

  const lastSyncAt = profile?.last_sync_at as string | null
  const isFirstSync = !lastSyncAt
  // Import complet = premier import OU réimport explicite : on récupère tout
  // l'historique Strava (after=0) pour des compteurs de sorties fiables (à vie).
  const fetchAll = isFirstSync || fullReimport

  let after: number
  if (fetchAll) {
    after = 0
    console.log(`[sync] Import complet (${fullReimport ? 'réimport' : 'premier import'}) — tout l'historique`)
  } else {
    // Import incrémental → depuis la dernière sync (avec 1h de marge pour éviter les trous)
    const lastSyncMs = new Date(lastSyncAt).getTime() - 60 * 60 * 1000
    after = Math.floor(lastSyncMs / 1000)
    console.log(`[sync] Import incrémental — depuis ${new Date(lastSyncAt).toISOString()}`)
  }

  // ── Récupère les vélos ────────────────────────────────────────
  const { data: bikes } = await supabase
    .from('bikes')
    .select('id, strava_gear_id')
    .eq('user_id', user.id)

  const bikeMap = new Map<string, string>()
  bikes?.forEach(b => { if (b.strava_gear_id) bikeMap.set(b.strava_gear_id, b.id) })

  // ── Synchronise les vélos Strava AVANT les activités ─────────
  // Filet de sécurité : crée les vélos manquants (si le callback a échoué
  // ou si un vélo a été ajouté sur Strava) et met à jour les km.
  // Sans ça, les activités seraient rattachées à bike_id null définitivement.
  try {
    const athleteRes = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (athleteRes.ok) {
      const athlete = await athleteRes.json()
      const gears: Array<{ id: string; name: string; distance: number }> = athlete.bikes ?? []

      const missing = gears.filter(g => !bikeMap.has(g.id))
      if (missing.length > 0) {
        const { data: created, error: createError } = await supabase
          .from('bikes')
          .insert(missing.map(g => ({
            user_id: user.id,
            strava_gear_id: g.id,
            name: g.name,
            total_km: Math.round(g.distance / 1000),
            is_active: true,
          })))
          .select('id, strava_gear_id')
        if (createError) {
          console.error('[sync] création vélos manquants error:', createError)
        } else {
          created?.forEach(b => { if (b.strava_gear_id) bikeMap.set(b.strava_gear_id as string, b.id as string) })
          console.log('[sync] vélos manquants créés:', missing.length)
        }
      }

      // Met à jour les km des vélos existants
      for (const g of gears) {
        const bikeId = bikeMap.get(g.id)
        if (bikeId && !missing.some(m => m.id === g.id)) {
          await supabase
            .from('bikes')
            .update({ total_km: Math.round(g.distance / 1000) })
            .eq('id', bikeId)
        }
      }
    } else {
      console.error('[sync] athlete fetch failed:', athleteRes.status)
    }
  } catch (err) {
    console.error('[sync] athlete fetch error:', err)
  }

  // ── Fetch des activités Strava (paginé) ───────────────────────
  const syncStartedAt = new Date().toISOString()
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

    const rows = activities.filter(isCycling).map((a: {
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

  // ── Upsert en batch ───────────────────────────────────────────
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

  // ── Mise à jour last_sync_at ──────────────────────────────────
  await supabase
    .from('profiles')
    .update({ last_sync_at: syncStartedAt })
    .eq('id', user.id)

  // ── Recalcul usure ────────────────────────────────────────────
  const { error: rpcError } = await supabase.rpc('recalculate_component_km', { p_user_id: user.id })
  if (rpcError) {
    console.error('[sync] recalculate_component_km error:', rpcError)
  } else {
    await createWearNotifications(supabase, user.id).catch(e => console.error('[sync] notifications error:', e))
    await createMaintenanceNotifications(supabase, user.id).catch(e => console.error('[sync] notifications entretien error:', e))

    // ── Alerte d'usure critique dans la description Strava (opt-in) ──
    // Seulement sur les imports incrémentaux : on n'annote jamais tout
    // l'historique lors d'un import complet (premier ou réimport).
    if (!fetchAll && allActivities.length > 0) {
      const acts = allActivities.map(a => ({
        strava_id: (a as { strava_id: number }).strava_id,
        bike_id: (a as { bike_id: string | null }).bike_id,
      }))
      await commentWearOnActivities(supabase, user.id, accessToken, acts)
        .catch(e => console.error('[sync] strava-comment error:', e))
    }
  }

  console.log(`[sync] ${isFirstSync ? 'Premier import' : 'Import incrémental'} — ${totalImported} activités, ${page - 1} pages`)

  return NextResponse.json({
    imported: totalImported,
    pages: page - 1,
    incremental: !fetchAll,
    full: fetchAll,
    since: after > 0 ? new Date(after * 1000).toISOString() : null,
  })
}
