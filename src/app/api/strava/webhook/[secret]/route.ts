import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'
import { getValidStravaToken } from '@/lib/strava'

/**
 * Webhook Strava — événements d'activité et de désautorisation.
 *
 * Couvre deux obligations de l'API Policy que le polling ne peut pas satisfaire :
 *   §6.3 — refléter sous 48 h une sortie supprimée par l'athlète sur Strava.
 *          L'import incrémental (`after=last_sync_at`) ne demande que les
 *          nouveautés : il ne voit jamais une suppression.
 *   §7.4 — supprimer les données d'un utilisateur qui révoque l'autorisation.
 *          Sans webhook, on ne l'apprend jamais.
 *
 * ── Sécurité ────────────────────────────────────────────────────────────
 *
 * Strava **ne signe pas** ses webhooks : le `verify_token` n'intervient qu'au
 * handshake d'abonnement, jamais sur les POST d'événements. L'endpoint est donc
 * intrinsèquement non authentifié, et n'importe qui connaissant l'URL peut forger
 * un événement — y compris une désautorisation, qui supprime des données.
 *
 * Parade retenue : un **secret dans le chemin**. L'URL enregistrée chez Strava est
 * `/api/strava/webhook/<STRAVA_WEBHOOK_SECRET>` ; toute requête sur un autre chemin
 * renvoie 404. C'est un secret partagé, pas une signature — la meilleure protection
 * disponible compte tenu de ce que Strava propose. Le secret est dans le chemin et
 * non en query string, parce qu'un paramètre de requête risque d'être tronqué ou
 * journalisé plus facilement, et que Strava réécrit les query params au handshake.
 *
 * Conséquence : ce secret ne doit apparaître ni dans les logs, ni dans le dépôt.
 *
 * ── Réponses ────────────────────────────────────────────────────────────
 *
 * Strava attend un 200 en moins de 2 secondes et réessaie sinon. Le traitement est
 * donc volontairement court, et **toute erreur métier renvoie quand même 200** :
 * un échec de notre côté ne doit pas déclencher une tempête de réessais.
 */

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

type StravaEvent = {
  object_type: 'activity' | 'athlete'
  object_id: number
  aspect_type: 'create' | 'update' | 'delete'
  updates?: Record<string, string>
  owner_id: number
  subscription_id: number
  event_time: number
}

function checkSecret(secret: string): boolean {
  const expected = process.env.STRAVA_WEBHOOK_SECRET
  return !!expected && secret === expected
}

/**
 * Handshake de validation. Strava appelle cette URL en GET lors de la création de
 * l'abonnement et attend l'écho de `hub.challenge`, avec un `hub.verify_token`
 * conforme à celui fourni au moment de la souscription.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params
  if (!checkSecret(secret)) return new NextResponse('Not found', { status: 404 })

  const sp = request.nextUrl.searchParams
  const mode = sp.get('hub.mode')
  const challenge = sp.get('hub.challenge')
  const verifyToken = sp.get('hub.verify_token')

  if (mode !== 'subscribe' || !challenge) {
    return NextResponse.json({ error: 'Requête de validation invalide' }, { status: 400 })
  }
  if (verifyToken !== process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    console.error('[webhook] verify_token invalide au handshake')
    return NextResponse.json({ error: 'verify_token invalide' }, { status: 403 })
  }

  return NextResponse.json({ 'hub.challenge': challenge })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params
  if (!checkSecret(secret)) return new NextResponse('Not found', { status: 404 })

  let event: StravaEvent
  try {
    event = await request.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  try {
    await handleEvent(event)
  } catch (err) {
    // 200 malgré l'erreur : voir la note sur les réessais en tête de fichier.
    console.error('[webhook] traitement échoué', event?.object_type, event?.aspect_type, err)
  }

  return NextResponse.json({ ok: true })
}

async function handleEvent(event: StravaEvent) {
  const admin = createSupabaseAdminClient()

  // Le seul lien entre l'événement et nos données est l'identifiant d'athlète.
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('strava_athlete_id', event.owner_id)
    .maybeSingle()

  if (!profile) {
    console.log('[webhook] athlète inconnu, ignoré:', event.owner_id)
    return
  }
  const userId = profile.id as string

  // ── Désautorisation (§7.4) ────────────────────────────────────
  if (
    event.object_type === 'athlete' &&
    event.aspect_type === 'update' &&
    event.updates?.authorized === 'false'
  ) {
    await handleDeauthorization(admin, userId)
    return
  }

  if (event.object_type !== 'activity') return

  if (event.aspect_type === 'delete') {
    await handleActivityDelete(admin, userId, event.object_id)
    return
  }

  if (event.aspect_type === 'create' || event.aspect_type === 'update') {
    await handleActivityUpsert(admin, userId, event.object_id)
  }
}

/**
 * L'athlète a retiré l'autorisation depuis Strava. Obligation : supprimer toutes
 * les données Strava le concernant. On ne supprime PAS son compte Bike Insight —
 * il n'a pas demandé ça — mais tout ce qui vient de Strava doit partir, et les
 * tokens avec.
 */
async function handleDeauthorization(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string
) {
  // Sorties importées de Strava. Les saisies manuelles (strava_id null) sont des
  // données de l'utilisateur, pas de Strava : elles restent.
  const { error: actErr } = await admin
    .from('activities')
    .delete()
    .eq('user_id', userId)
    .not('strava_id', 'is', null)
  if (actErr) console.error('[webhook] suppression activités échouée:', actErr)

  const { error: profErr } = await admin
    .from('profiles')
    .update({
      strava_access_token: null,
      strava_refresh_token: null,
      strava_token_expires_at: null,
      strava_athlete_id: null,
      last_sync_at: null,
    })
    .eq('id', userId)
  if (profErr) console.error('[webhook] purge tokens échouée:', profErr)

  // Les vélos et composants sont conservés : ce sont les données de l'utilisateur.
  // On coupe seulement le lien Strava, sinon une reconnexion créerait des doublons.
  const { error: bikeErr } = await admin
    .from('bikes')
    .update({ strava_gear_id: null })
    .eq('user_id', userId)
  if (bikeErr) console.error('[webhook] détachement vélos échoué:', bikeErr)

  console.log('[webhook] désautorisation traitée pour', userId)
}

/** Sortie supprimée sur Strava — §6.3 impose de la refléter sous 48 h. */
async function handleActivityDelete(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  stravaId: number
) {
  const { error } = await admin
    .from('activities')
    .delete()
    .eq('user_id', userId)
    .eq('strava_id', stravaId)

  if (error) {
    console.error('[webhook] suppression activité échouée:', error)
    return
  }

  // `bikes.total_km` vient de l'odomètre Strava du gear, que Strava recalcule
  // après une suppression : on le resynchronise puis on recalcule l'usure.
  await refreshGearKmAndWear(admin, userId)
}

/** Sortie créée ou modifiée sur Strava. */
async function handleActivityUpsert(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  stravaId: number
) {
  const token = await getValidStravaToken(userId, admin)
  if (!token) {
    console.error('[webhook] token indisponible pour', userId)
    return
  }

  const res = await fetch(`https://www.strava.com/api/v3/activities/${stravaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    console.error('[webhook] lecture activité échouée:', res.status)
    return
  }

  const a = await res.json()
  const isCycling = CYCLING_TYPES.has(a.sport_type ?? a.type ?? '')

  // Une sortie retypée en course à pied doit sortir de nos données : l'app ne
  // suit que le vélo, et ses kilomètres fausseraient l'usure.
  if (!isCycling) {
    await admin.from('activities').delete().eq('user_id', userId).eq('strava_id', stravaId)
    await refreshGearKmAndWear(admin, userId)
    return
  }

  const { data: bike } = a.gear_id
    ? await admin
        .from('bikes')
        .select('id')
        .eq('user_id', userId)
        .eq('strava_gear_id', a.gear_id)
        .maybeSingle()
    : { data: null }

  // Mêmes colonnes que l'import : pas de nom, pas de dénivelé, pas de durée
  // (minimisation des données, cf. migration 20260812000001).
  const { error } = await admin.from('activities').upsert(
    {
      user_id: userId,
      strava_id: stravaId,
      bike_id: bike?.id ?? null,
      distance_km: Math.round((a.distance / 1000) * 10) / 10,
      started_at: a.start_date,
    },
    { onConflict: 'strava_id', ignoreDuplicates: false }
  )
  if (error) {
    console.error('[webhook] upsert activité échoué:', error)
    return
  }

  await refreshGearKmAndWear(admin, userId)
}

/**
 * Resynchronise les compteurs des vélos depuis l'odomètre Strava, puis relance le
 * calcul d'usure. `total_km = odomètre du gear + manual_km` — sans le second terme
 * on effacerait les sorties saisies à la main (cf. migration 20260812000004).
 */
async function refreshGearKmAndWear(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string
) {
  const token = await getValidStravaToken(userId, admin)
  if (!token) return

  const res = await fetch('https://www.strava.com/api/v3/athlete', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.ok) {
    const athlete = await res.json()
    const gears: Array<{ id: string; distance: number }> = athlete.bikes ?? []

    const { data: bikes } = await admin
      .from('bikes')
      .select('id, strava_gear_id, manual_km')
      .eq('user_id', userId)
      .not('strava_gear_id', 'is', null)

    for (const b of bikes ?? []) {
      const gear = gears.find(g => g.id === b.strava_gear_id)
      if (!gear) continue
      await admin
        .from('bikes')
        .update({ total_km: Math.round(gear.distance / 1000) + Number(b.manual_km ?? 0) })
        .eq('id', b.id as string)
    }
  } else {
    console.error('[webhook] lecture athlete échouée:', res.status)
  }

  const { error } = await admin.rpc('recalculate_component_km', { p_user_id: userId })
  if (error) console.error('[webhook] recalcul usure échoué:', error)
}
