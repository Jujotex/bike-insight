import { createSupabaseServerClient } from './supabase-server'

// ── Dashboard data ─────────────────────────────────────────────

export async function getDashboardData() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  // Vélo principal (premier vélo actif)
  const { data: bikes } = await supabase
    .from('bike_stats')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('total_km', { ascending: false })

  const primaryBike = bikes?.[0] ?? null

  // Composants du vélo principal triés par usure décroissante
  const { data: components } = primaryBike
    ? await supabase
        .from('component_stats')
        .select('*')
        .eq('bike_id', primaryBike.id)
        .eq('is_active', true)
        .order('wear_pct', { ascending: false })
    : { data: [] }

  // Activités 30 derniers jours pour le graphique
  const { data: recentActivities } = await supabase
    .from('activities')
    .select('started_at, distance_km')
    .eq('user_id', user.id)
    .gte('started_at', thirtyDaysAgo.toISOString())
    .order('started_at', { ascending: true })

  // Activités 12 mois pour les KPIs et le graphique
  const { data: yearActivities } = await supabase
    .from('activities')
    .select('started_at, distance_km')
    .eq('user_id', user.id)
    .gte('started_at', twelveMonthsAgo.toISOString())
    .order('started_at', { ascending: true })

  const totalKm12m = yearActivities?.reduce((s, a) => s + (a.distance_km ?? 0), 0) ?? 0
  const totalRides12m = yearActivities?.length ?? 0

  // Graphique activité : 30 buckets jour par jour
  const activityChart = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(thirtyDaysAgo)
    day.setDate(day.getDate() + i)
    const dayStr = day.toISOString().slice(0, 10)
    const dayKm = recentActivities
      ?.filter(a => a.started_at.slice(0, 10) === dayStr)
      .reduce((s, a) => s + (a.distance_km ?? 0), 0) ?? 0
    return Math.round(dayKm)
  })

  // KPIs
  const totalComponentCost = components?.reduce((s, c) => s + (c.purchase_price ?? 0), 0) ?? 0
  const costPerKm = primaryBike?.cost_per_km ?? null
  const criticalCount = components?.filter(c => c.status === 'bad').length ?? 0
  const avgWear = components?.length
    ? Math.round(components.reduce((s, c) => s + (c.wear_pct ?? 0), 0) / components.length)
    : null

  // Répartition coût par catégorie
  const costByCategory = components?.reduce((acc, c) => {
    const cat = c.category ?? 'autre'
    acc[cat] = (acc[cat] ?? 0) + (c.purchase_price ?? 0)
    return acc
  }, {} as Record<string, number>) ?? {}

  // Composant le plus critique
  const mostCritical = components?.find(c => c.status === 'bad') ?? components?.[0] ?? null

  return {
    user,
    primaryBike,
    bikes: bikes ?? [],
    components: components ?? [],
    activityChart,
    kpis: {
      totalComponentCost: Math.round(totalComponentCost),
      costPerKm,
      totalKm12m: Math.round(totalKm12m),
      totalRides12m,
      criticalCount,
      avgWear,
    },
    costByCategory,
    mostCritical,
    recentActivities: recentActivities ?? [],
    yearActivities: (yearActivities ?? []).map(a => ({ started_at: a.started_at as string, distance_km: a.distance_km ?? 0 })),
  }
}

// ── All components (toutes les bikes) ─────────────────────────

export async function getComponentsData() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: components } = await supabase
    .from('component_stats')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('wear_pct', { ascending: false })

  const { data: archivedComponents } = await supabase
    .from('component_stats')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', false)
    .order('updated_at', { ascending: false })

  const { data: bikes } = await supabase
    .from('bike_stats')
    .select('id, name')
    .eq('user_id', user.id)

  return { components: components ?? [], archivedComponents: archivedComponents ?? [], bikes: bikes ?? [] }
}

// ── Analysis data ──────────────────────────────────────────────

export async function getAnalysisData() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

  const [{ data: components }, { data: bikes }, { data: yearActivities }] = await Promise.all([
    supabase.from('component_stats').select('*').eq('user_id', user.id).eq('is_active', true).order('wear_pct', { ascending: false }),
    supabase.from('bike_stats').select('*').eq('user_id', user.id).eq('is_active', true),
    supabase.from('activities').select('distance_km').eq('user_id', user.id).gte('started_at', twelveMonthsAgo.toISOString()),
  ])

  const totalKm12m = yearActivities?.reduce((s, a) => s + (a.distance_km ?? 0), 0) ?? 0
  const totalRides12m = yearActivities?.length ?? 0
  const totalCost = bikes?.reduce((s, b) => s + ((b.total_cost as number) ?? 0), 0) ?? 0
  const totalKm = bikes?.reduce((s, b) => s + ((b.total_km as number) ?? 0), 0) ?? 0
  const costPerKm = totalKm > 0 ? Math.round((totalCost / totalKm) * 100) / 100 : null

  const costByCategory = (components ?? []).reduce((acc, c) => {
    const cat = (c.category as string) ?? 'autre'
    acc[cat] = (acc[cat] ?? 0) + ((c.purchase_price as number) ?? 0)
    return acc
  }, {} as Record<string, number>)

  return {
    components: components ?? [],
    bikes: bikes ?? [],
    kpis: {
      totalCost: Math.round(totalCost),
      costPerKm,
      totalKm12m: Math.round(totalKm12m),
      totalRides12m,
      bikeCount: bikes?.length ?? 0,
    },
    costByCategory,
  }
}

// ── Sync page data ─────────────────────────────────────────────

export async function getSyncData() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: bikes }, { data: activities }, { data: profile }] = await Promise.all([
    supabase.from('bike_stats').select('id, name, total_km, strava_gear_id').eq('user_id', user.id).eq('is_active', true).order('total_km', { ascending: false }),
    supabase.from('activities').select('name, bike_id, started_at, distance_km, moving_time_s, elevation_m').eq('user_id', user.id).order('started_at', { ascending: false }).limit(10),
    supabase.from('profiles').select('full_name, strava_athlete_id').eq('id', user.id).single(),
  ])

  const bikeNames = new Map((bikes ?? []).map(b => [b.id, b.name]))

  return {
    user,
    profile: profile ?? null,
    bikes: bikes ?? [],
    activities: (activities ?? []).map(a => ({
      ...a,
      bikeName: a.bike_id ? (bikeNames.get(a.bike_id) ?? '—') : '—',
    })),
  }
}

// ── Bike detail data ───────────────────────────────────────────

export async function getBikeData(bikeId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: bike } = await supabase
    .from('bike_stats')
    .select('*')
    .eq('id', bikeId)
    .eq('user_id', user.id)
    .single()

  if (!bike) return null

  const { data: components } = await supabase
    .from('component_stats')
    .select('*')
    .eq('bike_id', bikeId)
    .eq('is_active', true)
    .order('wear_pct', { ascending: false })

  const { data: activities } = await supabase
    .from('activities')
    .select('started_at, distance_km')
    .eq('bike_id', bikeId)
    .order('started_at', { ascending: false })
    .limit(90)

  return { bike, components: components ?? [], activities: activities ?? [] }
}
