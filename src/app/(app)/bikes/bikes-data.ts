import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Données de la page « Mes vélos ».
 *
 * Extraite de la page lors du passage en composant client (phase 2.1, lot 1).
 * Requêtes rigoureusement identiques à la version serveur : seul le client change.
 */

export type BikeRow = {
  id: string
  name: string
  total_km: number | null
  strava_gear_id: string | null
  brand: string | null
  model: string | null
}

export type BikeRideStats = { rides: number; lastDate: string | null }

export type BikesData = {
  bikeList: BikeRow[]
  /** Sorties à vie et dernière sortie, par vélo. */
  bikeStats: Map<string, BikeRideStats>
  /** Compteurs de pièces en alerte, par vélo. */
  statusCounts: Map<string, { bad: number; warn: number }>
  /** Vélos ayant au moins une pièce déclarée. */
  configuredBikeIds: Set<string>
  /** Vélo utilisé le plus récemment. */
  activeBikeId: string | null
  stravaConnected: boolean
  totalKm: number
  totalRides: number
  totalCost: number
  bikesMini: { id: string; name: string }[]
}

export async function loadBikesData(
  supabase: SupabaseClient,
  userId: string
): Promise<BikesData> {
  const [
    { data: bikes },
    { data: activityStats },
    { data: profile },
    { data: configuredBikes },
    { data: maintLogs },
  ] = await Promise.all([
    supabase
      .from('bike_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('total_km', { ascending: false }),
    // Sorties à vie + dernière sortie + sorties 12 mois, agrégées en base.
    supabase
      .from('activity_bike_stats')
      .select('bike_id, rides_total, last_ride_at, rides_365d')
      .eq('user_id', userId),
    supabase.from('profiles').select('strava_athlete_id').eq('id', userId).single(),
    supabase
      .from('components')
      .select('bike_id, status')
      .eq('user_id', userId)
      .eq('is_active', true),
    // Dépense d'entretien réelle (remplacements + entretiens) — tous vélos.
    supabase
      .from('maintenance_logs')
      .select('cost')
      .eq('user_id', userId)
      .not('cost', 'is', null),
  ])

  const configuredBikeIds = new Set((configuredBikes ?? []).map(c => c.bike_id as string))

  // Compteurs bad/warn par vélo, calculés depuis les composants actifs.
  // (`bike_stats` n'expose pas ces colonnes — ne jamais lire `b.bad_count`.)
  const statusCounts = new Map<string, { bad: number; warn: number }>()
  for (const c of configuredBikes ?? []) {
    const bid = c.bike_id as string
    const cur = statusCounts.get(bid) ?? { bad: 0, warn: 0 }
    if (c.status === 'bad') cur.bad += 1
    else if (c.status === 'warn') cur.warn += 1
    statusCounts.set(bid, cur)
  }

  const bikeList = (bikes ?? []) as BikeRow[]

  // Sorties à vie + dernière sortie par vélo (cohérent avec les km à vie).
  // Le KPI « 12 m » du bandeau agrège `rides_365d` de tous les vélos.
  const bikeStats = new Map<string, BikeRideStats>()
  let rides12m = 0
  for (const s of activityStats ?? []) {
    rides12m += (s.rides_365d as number) ?? 0
    const bid = s.bike_id as string | null
    if (!bid) continue
    bikeStats.set(bid, {
      rides: (s.rides_total as number) ?? 0,
      lastDate: (s.last_ride_at as string | null) ?? null,
    })
  }

  // Vélo le plus récemment utilisé = « actif ».
  let activeBikeId: string | null = null
  let latestDate: string | null = null
  for (const [bid, s] of bikeStats.entries()) {
    if (s.lastDate && (!latestDate || s.lastDate > latestDate)) {
      latestDate = s.lastDate
      activeBikeId = bid
    }
  }

  return {
    bikeList,
    bikeStats,
    statusCounts,
    configuredBikeIds,
    activeBikeId,
    stravaConnected: !!profile?.strava_athlete_id,
    totalKm: bikeList.reduce((s, b) => s + (b.total_km ?? 0), 0),
    totalRides: rides12m,
    totalCost: Math.round((maintLogs ?? []).reduce((s, l) => s + ((l.cost as number) ?? 0), 0)),
    bikesMini: bikeList.map(b => ({ id: b.id, name: b.name })),
  }
}
