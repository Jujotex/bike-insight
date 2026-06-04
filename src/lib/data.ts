import { createSupabaseServerClient } from './supabase-server'

// ── Dashboard data ─────────────────────────────────────────────

export async function getDashboardData() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  const { data: bikes } = await supabase
    .from('bike_stats')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('total_km', { ascending: false })

  const primaryBike = bikes?.[0] ?? null

  const [
    { data: components },
    { data: recentActivities },
    { data: yearActivities },
    { data: allComponents },
    { data: ninetyDaysActivities },
  ] = await Promise.all([
    primaryBike
      ? supabase.from('component_stats').select('*').eq('bike_id', primaryBike.id).eq('is_active', true).order('wear_pct', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from('activities').select('started_at, distance_km').eq('user_id', user.id).gte('started_at', thirtyDaysAgo.toISOString()).order('started_at', { ascending: true }),
    supabase.from('activities').select('started_at, distance_km').eq('user_id', user.id).gte('started_at', twelveMonthsAgo.toISOString()).order('started_at', { ascending: true }),
    // Tous les composants actifs de tous les vélos pour les prédictions
    supabase.from('component_stats').select('*').eq('user_id', user.id).eq('is_active', true).not('km_remaining', 'is', null),
    // Activités 90j par vélo pour calculer le rythme km/semaine
    supabase.from('activities').select('bike_id, distance_km, started_at').eq('user_id', user.id).gte('started_at', ninetyDaysAgo.toISOString()),
  ])

  const totalKm12m = yearActivities?.reduce((s, a) => s + (a.distance_km ?? 0), 0) ?? 0
  const totalRides12m = yearActivities?.length ?? 0

  const activityChart = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(thirtyDaysAgo)
    day.setDate(day.getDate() + i)
    const dayStr = day.toISOString().slice(0, 10)
    const dayKm = recentActivities
      ?.filter(a => a.started_at.slice(0, 10) === dayStr)
      .reduce((s, a) => s + (a.distance_km ?? 0), 0) ?? 0
    return Math.round(dayKm)
  })

  const totalComponentCost = components?.reduce((s, c) => s + (c.purchase_price ?? 0), 0) ?? 0
  const costPerKm = primaryBike?.cost_per_km ?? null
  const criticalCount = components?.filter(c => c.status === 'bad').length ?? 0
  const avgWear = components?.length
    ? Math.round(components.reduce((s, c) => s + (c.wear_pct ?? 0), 0) / components.length)
    : null

  const costByCategory = components?.reduce((acc, c) => {
    const cat = c.category ?? 'autre'
    acc[cat] = (acc[cat] ?? 0) + (c.purchase_price ?? 0)
    return acc
  }, {} as Record<string, number>) ?? {}

  const mostCritical = components?.find(c => c.status === 'bad') ?? components?.[0] ?? null

  // ── Prédictions de remplacement ──────────────────────────────
  // Rythme km/semaine par vélo sur les 90 derniers jours
  const kmPerWeekByBike = new Map<string, number>()
  for (const bike of (bikes ?? [])) {
    const bikeKm90d = (ninetyDaysActivities ?? [])
      .filter(a => a.bike_id === bike.id)
      .reduce((s, a) => s + (a.distance_km ?? 0), 0)
    kmPerWeekByBike.set(bike.id as string, bikeKm90d / 13) // 90j ≈ 13 semaines
  }

  const bikeName = new Map((bikes ?? []).map(b => [b.id as string, b.name as string]))

  type Prediction = {
    componentId: string
    componentName: string
    category: string
    bikeName: string
    bikeId: string
    kmRemaining: number
    weeksUntil: number | null
    estimatedDate: string | null
    cost: number | null
    urgency: 'now' | 'soon' | 'later'
  }

  const predictions: Prediction[] = (allComponents ?? [])
    .filter(c => (c.km_remaining as number) !== null)
    .map(c => {
      const bikeId = c.bike_id as string
      const kmRemaining = c.km_remaining as number
      const weeklyKm = kmPerWeekByBike.get(bikeId) ?? 0
      const weeksUntil = weeklyKm > 0 ? Math.max(0, Math.round(kmRemaining / weeklyKm)) : null
      const estimatedDate = weeksUntil !== null
        ? new Date(now.getTime() + weeksUntil * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : null
      const urgency: Prediction['urgency'] =
        (c.status === 'bad') ? 'now' :
        (weeksUntil !== null && weeksUntil <= 8) ? 'soon' : 'later'

      return {
        componentId: c.id as string,
        componentName: c.name as string,
        category: (c.category as string) ?? 'autre',
        bikeName: bikeName.get(bikeId) ?? '—',
        bikeId,
        kmRemaining: Math.max(0, Math.round(kmRemaining)),
        weeksUntil,
        estimatedDate,
        cost: c.purchase_price as number | null,
        urgency,
      }
    })
    .filter(p => p.urgency !== 'later') // Ne garder que now + soon pour le dashboard
    .sort((a, b) => {
      const order = { now: 0, soon: 1, later: 2 }
      return order[a.urgency] - order[b.urgency]
    })

  // ── Readiness score — basé sur le vélo actif (primaryBike) uniquement ──
  const allActive = allComponents ?? []
  // Pour le score : uniquement les composants du vélo actif
  const primaryComponents = primaryBike
    ? allActive.filter(c => c.bike_id === primaryBike.id)
    : allActive
  const hasBad = primaryComponents.some(c => c.status === 'bad')
  const hasWarn = primaryComponents.some(c => c.status === 'warn')
  const globalAvgWear = primaryComponents.length > 0
    ? primaryComponents.reduce((s, c) => s + ((c.wear_pct as number) ?? 0), 0) / primaryComponents.length : 0
  const componentsScore = hasBad
    ? Math.max(30, Math.round(100 - globalAvgWear * 1.3))
    : hasWarn
      ? Math.max(60, Math.round(100 - globalAvgWear * 0.9))
      : Math.max(75, Math.round(100 - globalAvgWear * 0.5))
  const readinessScore = { value: componentsScore, components: componentsScore }

  // ── Readiness par vélo ────────────────────────────────────────
  type ReadinessScore = { value: number; components: number }
  const readinessByBike: Record<string, ReadinessScore> = {}
  for (const bike of (bikes ?? [])) {
    const _bid = bike.id as string
    const _comps = allActive.filter(c => c.bike_id === _bid)
    const _bad = _comps.some(c => c.status === 'bad')
    const _warn = _comps.some(c => c.status === 'warn')
    const _avgW = _comps.length > 0
      ? _comps.reduce((s, c) => s + ((c.wear_pct as number) ?? 0), 0) / _comps.length : 0
    const _cScore = _bad
      ? Math.max(30, Math.round(100 - _avgW * 1.3))
      : _warn ? Math.max(60, Math.round(100 - _avgW * 0.9)) : Math.max(75, Math.round(100 - _avgW * 0.5))
    readinessByBike[_bid] = { value: _cScore, components: _cScore }
  }

  // ── Attention items (bad + warn, tous vélos) ─────────────────
  const attentionItems = allActive
    .filter(c => c.status === 'bad' || c.status === 'warn')
    .map(c => {
      const bikeId = c.bike_id as string
      const weeklyKm = kmPerWeekByBike.get(bikeId) ?? 0
      const kmRem = (c.km_remaining as number) ?? 0
      const weeksUntil = weeklyKm > 0 ? Math.max(0, Math.round(kmRem / weeklyKm)) : null
      return {
        id: c.id as string,
        name: c.name as string,
        brand: (c.brand as string) ?? null,
        category: (c.category as string) ?? 'autre',
        bikeName: bikeName.get(bikeId) ?? '—',
        bikeId,
        status: c.status as string,
        wearPct: Math.round((c.wear_pct as number) ?? 0),
        kmRemaining: Math.max(0, Math.round(kmRem)),
        weeksUntil,
        cost: (c.purchase_price as number) ?? null,
      }
    })
    .sort((a, b) => {
      if (a.status === 'bad' && b.status !== 'bad') return -1
      if (a.status !== 'bad' && b.status === 'bad') return 1
      return b.wearPct - a.wearPct
    })
    

  // ── Statut par vélo ───────────────────────────────────────────
  const lastRideByBike = new Map<string, string>()
  for (const a of (ninetyDaysActivities ?? [])) {
    if (!a.bike_id) continue
    const cur = lastRideByBike.get(a.bike_id as string)
    if (!cur || (a.started_at as string) > cur) lastRideByBike.set(a.bike_id as string, a.started_at as string)
  }

  const bikeStatus = (bikes ?? []).map((b, i) => {
    const bikeComps = allActive.filter(c => c.bike_id === b.id)
    const badCount = bikeComps.filter(c => c.status === 'bad').length
    const warnCount = bikeComps.filter(c => c.status === 'warn').length
    const okCount = bikeComps.length - badCount - warnCount
    const status = badCount > 0 ? 'bad' : warnCount > 0 ? 'warn' : 'ok'
    return {
      id: b.id as string,
      name: b.name as string,
      totalKm: (b.total_km as number) ?? 0,
      lastRideAt: lastRideByBike.get(b.id as string) ?? null,
      status,
      badCount,
      warnCount,
      okCount,
      isActive: i === 0,
    }
  })

  // ── Budget 12 mois par catégorie ─────────────────────────────
  const budget12m = allActive.reduce((acc, c) => {
    const cat = (c.category as string) ?? 'autre'
    const price = (c.purchase_price as number) ?? 0
    acc[cat] = (acc[cat] ?? 0) + price
    return acc
  }, {} as Record<string, number>)
  const budget12mTotal = (Object.values(budget12m) as number[]).reduce((s, v) => s + v, 0)

  // ── Usure par catégorie, par vélo ────────────────────────────
  type CatWear = { avgWear: number; count: number; worstStatus: string }
  const wearByCategoryByBike: Record<string, Record<string, CatWear>> = {}
  for (const bike of (bikes ?? [])) {
    const bid = bike.id as string
    const bikeComps = allActive.filter(c => c.bike_id === bid)
    const byCat: Record<string, CatWear> = {}
    for (const c of bikeComps) {
      const cat = (c.category as string) ?? 'autre'
      const w = (c.wear_pct as number) ?? 0
      const st = (c.status as string) ?? 'ok'
      if (!byCat[cat]) byCat[cat] = { avgWear: 0, count: 0, worstStatus: 'ok' }
      byCat[cat].avgWear = (byCat[cat].avgWear * byCat[cat].count + w) / (byCat[cat].count + 1)
      byCat[cat].count += 1
      const rank = (s: string) => s === 'bad' ? 2 : s === 'warn' ? 1 : 0
      if (rank(st) > rank(byCat[cat].worstStatus)) byCat[cat].worstStatus = st
    }
    wearByCategoryByBike[bid] = byCat
  }

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
    predictions,
    readinessScore,
    attentionItems,
    bikeStatus,
    budget12m,
    budget12mTotal: Math.round(budget12mTotal),
    readinessByBike,
    wearByCategoryByBike,
  }
}

// ── All components (toutes les bikes) ─────────────────────────

export async function getComponentsData() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10)

  const [
    { data: components },
    { data: bikes },
    { data: logs },
  ] = await Promise.all([
    supabase
      .from('component_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('wear_pct', { ascending: false }),
    supabase
      .from('bike_stats')
      .select('id, name')
      .eq('user_id', user.id),
    supabase
      .from('maintenance_logs')
      .select('id, performed_at, km_at_action, cost, reason, component_id, components(name, brand, category, km_max, installed_km, bike_id)')
      .eq('user_id', user.id)
      .eq('action', 'Remplacement')
      .gte('performed_at', twelveMonthsAgo)
      .order('performed_at', { ascending: false }),
  ])

  const bikeNames = Object.fromEntries(
    (bikes ?? []).map(b => [b.id as string, b.name as string])
  )

  const replacementLogs = (logs ?? []).map(r => {
    const raw = r.components
    const comp = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null)
    const lifeKm = (r.km_at_action != null && comp?.installed_km != null)
      ? Math.max(0, Math.round((r.km_at_action as number) - (comp.installed_km as number)))
      : null
    const kmMax = comp ? ((comp.km_max as number) ?? null) : null
    const beat = lifeKm !== null && kmMax ? lifeKm - kmMax : null
    const bikeId = (comp?.bike_id as string) ?? null
    return {
      id: r.id as string,
      performedAt: r.performed_at as string | null,
      cost: r.cost as number | null,
      reason: r.reason as string | null,
      componentId: r.component_id as string | null,
      componentName: (comp?.name as string) ?? '—',
      componentBrand: (comp?.brand as string) ?? null,
      lifeKm,
      kmMax,
      beat,
      bikeId,
      bikeName: bikeId ? (bikeNames[bikeId] ?? '—') : '—',
    }
  })

  const activeCost = (components ?? []).reduce((s, c) => s + ((c.purchase_price as number) ?? 0), 0)
  const replacedCost = replacementLogs.reduce((s, r) => s + (r.cost ?? 0), 0)
  const logsWithBeat = replacementLogs.filter(r => r.beat !== null)
  const avgBeat = logsWithBeat.length > 0
    ? Math.round(logsWithBeat.reduce((s, r) => s + (r.beat ?? 0), 0) / logsWithBeat.length)
    : null

  return {
    components: components ?? [],
    bikes: (bikes ?? []).map(b => ({ id: b.id as string, name: b.name as string })),
    bikeNames,
    replacementLogs,
    kpis: {
      activeCount: components?.length ?? 0,
      replacedCount: replacementLogs.length,
      totalCost: Math.round(activeCost + replacedCost),
      avgBeat,
    },
  }
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
