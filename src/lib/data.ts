import { createSupabaseServerClient } from './supabase-server'
import { computeMaintenanceStatus, type MaintenanceLast } from './maintenance-catalog'
import { fetchUserMaintenanceDefsByBike } from './maintenance-types'

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
    { data: yearActivitiesByBike },
    { data: bikeMaintLogs },
  ] = await Promise.all([
    primaryBike
      ? supabase.from('component_stats').select('*').eq('bike_id', primaryBike.id).eq('is_active', true).order('wear_pct', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from('activities').select('started_at, distance_km').eq('user_id', user.id).gte('started_at', thirtyDaysAgo.toISOString()).order('started_at', { ascending: true }),
    supabase.from('activities').select('started_at, distance_km').eq('user_id', user.id).gte('started_at', twelveMonthsAgo.toISOString()).order('started_at', { ascending: true }),
    // Tous les composants actifs de tous les vélos pour les prédictions
    supabase.from('component_stats').select('*').eq('user_id', user.id).eq('is_active', true).not('km_remaining', 'is', null),
    // Activités 90j + 12m par vélo pour calculer le rythme km/semaine (avec fallback)
    supabase.from('activities').select('bike_id, distance_km, started_at').eq('user_id', user.id).gte('started_at', ninetyDaysAgo.toISOString()),
    supabase.from('activities').select('bike_id, distance_km').eq('user_id', user.id).gte('started_at', twelveMonthsAgo.toISOString()),
    // Entretiens au niveau vélo (lubrification, purge, ...) pour les alertes
    supabase.from('maintenance_logs').select('bike_id, maintenance_type, performed_at, km_at_action').eq('user_id', user.id).not('maintenance_type', 'is', null).order('performed_at', { ascending: false }),
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
    if (bikeKm90d > 0) {
      kmPerWeekByBike.set(bike.id as string, bikeKm90d / 13) // 90j ≈ 13 semaines
    } else {
      // Fallback: utiliser le rythme sur 12 mois si 90j est vide (période creuse)
      const bikeKm12m = (yearActivitiesByBike ?? [])
        .filter(a => a.bike_id === bike.id)
        .reduce((s, a) => s + (a.distance_km ?? 0), 0)
      kmPerWeekByBike.set(bike.id as string, bikeKm12m / 52)
    }
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
    readinessByBike[_bid] = { value: _cScore, components: _comps.length }
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

  // ── Budget par catégorie, par vélo ───────────────────────────
  const budgetByBike: Record<string, Record<string, number>> = {}
  for (const bike of (bikes ?? [])) {
    const bid = bike.id as string
    const bikeComps = allActive.filter(c => c.bike_id === bid)
    budgetByBike[bid] = bikeComps.reduce((acc, c) => {
      const cat = (c.category as string) ?? 'autre'
      const price = (c.purchase_price as number) ?? 0
      acc[cat] = (acc[cat] ?? 0) + price
      return acc
    }, {} as Record<string, number>)
  }
  // Garder budget12m global pour compatibilité (budget12mTotal affiché dans l'en-tête)
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

  // ── Alertes entretien (niveau vélo) ──────────────────────────
  // On n'alerte que sur les entretiens déjà enregistrés au moins une fois :
  // pas de fausses alertes pour les entretiens non pertinents pour l'utilisateur.
  // Les types d'entretien sont désormais propres à chaque vélo (table maintenance_types).
  const defsByBike = await fetchUserMaintenanceDefsByBike(supabase, user.id)
  const lastMaintByBikeType: Record<string, MaintenanceLast> = {}
  for (const l of bikeMaintLogs ?? []) {
    const key = `${l.bike_id}:${l.maintenance_type}`
    if (!(key in lastMaintByBikeType)) {
      lastMaintByBikeType[key] = {
        performed_at: l.performed_at as string,
        km_at_action: (l.km_at_action as number | null) ?? null,
      }
    }
  }
  const maintenanceAlerts: Array<{ bikeId: string; bikeName: string; typeId: string; label: string; state: 'due' | 'soon'; detail: string }> = []
  for (const b of bikes ?? []) {
    const bikeKm = (b.total_km as number) ?? 0
    for (const def of (defsByBike[b.id as string] ?? [])) {
      const last = lastMaintByBikeType[`${b.id}:${def.id}`] ?? null
      if (!last) continue
      const st = computeMaintenanceStatus(def, last, bikeKm)
      if (st.state !== 'due' && st.state !== 'soon') continue
      const detail = st.kmSince !== null && def.intervalKm
        ? `fait il y a ${Math.round(st.kmSince).toLocaleString('fr')} km`
        : `fait il y a ${st.weeksSince} sem.`
      maintenanceAlerts.push({
        bikeId: b.id as string,
        bikeName: (b.name as string) ?? '',
        typeId: def.id,
        label: def.label,
        state: st.state,
        detail,
      })
    }
  }
  maintenanceAlerts.sort((a, b2) => (a.state === 'due' ? 0 : 1) - (b2.state === 'due' ? 0 : 1))

  // ── Résumé entretien par vélo (pour la carte compacte du dashboard) ──
  // Contrairement aux alertes, on inclut aussi les entretiens "ok" afin
  // d'afficher les prochaines échéances même quand rien n'est en retard.
  const STATE_RANK: Record<string, number> = { due: 0, soon: 1, ok: 2 }
  const maintenanceSummaryByBike: Record<string, {
    counts: { due: number; soon: number; ok: number }
    items: Array<{ typeId: string; label: string; state: 'due' | 'soon' | 'ok'; pct: number; statusLabel: string; detail: string }>
  }> = {}
  for (const b of bikes ?? []) {
    const bikeKm = (b.total_km as number) ?? 0
    const counts = { due: 0, soon: 0, ok: 0 }
    const items: Array<{ typeId: string; label: string; state: 'due' | 'soon' | 'ok'; pct: number; statusLabel: string; detail: string }> = []
    for (const def of (defsByBike[b.id as string] ?? [])) {
      const last = lastMaintByBikeType[`${b.id}:${def.id}`] ?? null
      if (!last) continue // seulement les entretiens déjà enregistrés au moins une fois
      const st = computeMaintenanceStatus(def, last, bikeKm)
      if (st.state === 'never') continue
      counts[st.state]++
      const dueParts: string[] = []
      if (st.dueInKm !== null) dueParts.push(`~${st.dueInKm.toLocaleString('fr')} km`)
      if (st.dueInWeeks !== null) dueParts.push(st.dueInWeeks >= 5 ? `${Math.round(st.dueInWeeks / 4)} mois` : `${st.dueInWeeks} sem.`)
      const statusLabel = st.state === 'due' ? 'À faire'
        : st.state === 'soon' ? 'Bientôt'
        : dueParts.length > 0 ? `dans ${dueParts.join(' ou ')}` : 'OK'
      const detail = st.kmSince !== null && def.intervalKm
        ? `fait il y a ${Math.round(st.kmSince).toLocaleString('fr')} km`
        : `fait il y a ${st.weeksSince} sem.`
      items.push({ typeId: def.id, label: def.label, state: st.state, pct: st.pct, statusLabel, detail })
    }
    items.sort((x, y) => STATE_RANK[x.state] - STATE_RANK[y.state] || y.pct - x.pct)
    maintenanceSummaryByBike[b.id as string] = { counts, items }
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
    budgetByBike,
    wearByCategoryByBike,
    maintenanceAlerts,
    maintenanceSummaryByBike,
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

// ── Cost analysis ──────────────────────────────────────────────
// Page Coût dédiée : agrège le coût des pièces (via bike_stats.total_cost,
// qui inclut les pièces archivées) + le coût des entretiens courants
// (maintenance_logs avec maintenance_type, pour ne pas doubler les pièces).

export async function getCostData() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10)

  const [
    { data: components },
    { data: bikes },
    { data: maintLogs },
    { data: replacements },
  ] = await Promise.all([
    supabase
      .from('component_stats')
      .select('name, category, bike_id, purchase_price, cost_per_km, km_used, installed_at')
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
      .from('bike_stats')
      .select('id, name, total_km, total_cost, cost_per_km')
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
      .from('maintenance_logs')
      .select('cost, performed_at, maintenance_type, bike_id')
      .eq('user_id', user.id)
      .not('cost', 'is', null),
    // Remplacements de pièces (tout l'historique) pour longévité + économie transmission
    supabase
      .from('maintenance_logs')
      .select('cost, km_at_action, component_id, components(name, category, km_max, installed_km, bike_id)')
      .eq('user_id', user.id)
      .eq('action', 'Remplacement'),
  ])

  const comps = components ?? []
  const bikeList = bikes ?? []
  const logs = maintLogs ?? []
  const repl = replacements ?? []

  const bikeNames = Object.fromEntries(bikeList.map(b => [b.id as string, b.name as string]))

  // Coût entretien courant (maintenance_type non nul) — hors remplacements de pièces
  const maintByBike: Record<string, number> = {}
  let maintTotal = 0
  let maint12m = 0
  for (const l of logs) {
    if (!l.maintenance_type) continue
    const cost = (l.cost as number) ?? 0
    maintTotal += cost
    const bid = l.bike_id as string | null
    if (bid) maintByBike[bid] = (maintByBike[bid] ?? 0) + cost
    if ((l.performed_at as string) >= twelveMonthsAgo) maint12m += cost
  }

  // Coût pièces (bike_stats.total_cost inclut les pièces archivées)
  const partsTotal = bikeList.reduce((s, b) => s + ((b.total_cost as number) ?? 0), 0)
  const parts12m = comps
    .filter(c => {
      const d = c.installed_at as string | null
      return d !== null && d >= twelveMonthsAgo
    })
    .reduce((s, c) => s + ((c.purchase_price as number) ?? 0), 0)

  const totalKm = bikeList.reduce((s, b) => s + ((b.total_km as number) ?? 0), 0)
  const totalCost = partsTotal + maintTotal
  const costPerKm = totalKm > 0 ? totalCost / totalKm : null

  // Coût par vélo (pièces + entretien)
  const byBike = bikeList
    .map(b => {
      const bid = b.id as string
      const parts = (b.total_cost as number) ?? 0
      const maint = maintByBike[bid] ?? 0
      const km = (b.total_km as number) ?? 0
      const total = parts + maint
      return {
        id: bid,
        name: b.name as string,
        totalCost: Math.round(total),
        totalKm: Math.round(km),
        costPerKm: km > 0 ? total / km : null,
      }
    })
    .sort((a, b) => b.totalCost - a.totalCost)

  // Classement des pièces par €/km (les plus coûteuses au kilomètre)
  const topByCpm = comps
    .filter(c => (c.cost_per_km as number | null) !== null)
    .map(c => ({
      name: c.name as string,
      bikeName: bikeNames[c.bike_id as string] ?? '—',
      category: (c.category as string) ?? 'autre',
      costPerKm: c.cost_per_km as number,
      cost: (c.purchase_price as number | null) ?? null,
      kmUsed: Math.round((c.km_used as number) ?? 0),
    }))
    .sort((a, b) => b.costPerKm - a.costPerKm)
    .slice(0, 8)

  // Répartition du coût des pièces par catégorie
  const byCat: Record<string, number> = {}
  for (const c of comps) {
    const cat = (c.category as string) ?? 'autre'
    byCat[cat] = (byCat[cat] ?? 0) + ((c.purchase_price as number) ?? 0)
  }
  const categoryBreakdown = Object.entries(byCat)
    .filter(([, v]) => v > 0)
    .map(([category, total]) => ({
      category,
      total: Math.round(total),
      pct: partsTotal > 0 ? Math.round((total / partsTotal) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  // ── Bénéfices d'entretien ────────────────────────────────────
  // Hypothèses de l'estimation transmission (affichées à l'utilisateur)
  const DEFAULT_CASSETTE = 90        // € si la cassette du vélo n'a pas de prix
  const CHAINRINGS_ESTIMATE = 50     // € plateaux (estimation)
  const CHAINS_PER_CASSETTE = 2      // ~2 chaînes à temps préservent 1 transmission

  // Prix cassette par vélo (composant actif dont le nom contient « cassette »)
  const cassettePriceByBike: Record<string, number> = {}
  for (const c of comps) {
    const name = ((c.name as string) ?? '').toLowerCase()
    const price = c.purchase_price as number | null
    if (name.includes('cassette') && price !== null) {
      const bid = c.bike_id as string
      cassettePriceByBike[bid] = Math.max(cassettePriceByBike[bid] ?? 0, price)
    }
  }

  type ReplComp = { name: string; category: string; km_max: number | null; installed_km: number | null; bike_id: string | null }
  const normalizeComp = (raw: unknown): ReplComp | null => {
    const c = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null)
    return (c as ReplComp | null) ?? null
  }

  let repairTotal = 0
  let longevityKm = 0
  let longevityParts = 0
  let transmissionSavings = 0
  let onTimeChains = 0

  for (const r of repl) {
    repairTotal += (r.cost as number) ?? 0
    const comp = normalizeComp(r.components)
    if (!comp) continue

    const kmAt = r.km_at_action as number | null
    const installedKm = comp.installed_km
    const kmMax = comp.km_max
    const lifeKm = (kmAt !== null && installedKm !== null) ? Math.max(0, kmAt - installedKm) : null

    // Longévité : km tenus au-delà de l'estimation
    if (lifeKm !== null && kmMax !== null && lifeKm > kmMax) {
      longevityKm += lifeKm - kmMax
      longevityParts++
    }

    // Économie transmission : chaîne remplacée à temps (avant sa durée de vie estimée)
    const name = (comp.name ?? '').toLowerCase()
    const isChain = name.includes('chaîne') || name.includes('chaine') || name.includes('chain')
    if (isChain && lifeKm !== null && kmMax !== null && lifeKm <= kmMax) {
      const bid = comp.bike_id
      const cassette = (bid && cassettePriceByBike[bid]) ? cassettePriceByBike[bid] : DEFAULT_CASSETTE
      transmissionSavings += (cassette + CHAINRINGS_ESTIMATE) / CHAINS_PER_CASSETTE
      onTimeChains++
    }
  }

  const preventionCost = Math.round(maintTotal)   // entretien courant
  const repairCost = Math.round(repairTotal)      // remplacements de pièces

  return {
    kpis: {
      totalCost: Math.round(totalCost),
      costPerKm,
      spend12m: Math.round(parts12m + maint12m),
      maint12m: Math.round(maint12m),
    },
    byBike,
    topByCpm,
    categoryBreakdown,
    insights: {
      transmissionSavings: Math.round(transmissionSavings),
      onTimeChains,
      longevityKm: Math.round(longevityKm),
      longevityParts,
      preventionCost,
      repairCost,
    },
    hasData: comps.length > 0 || maintTotal > 0 || repl.length > 0,
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

  // Trois requêtes indépendantes → en parallèle
  const [{ data: bike }, { data: components }, { data: activities }] = await Promise.all([
    supabase
      .from('bike_stats')
      .select('*')
      .eq('id', bikeId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('component_stats')
      .select('*')
      .eq('bike_id', bikeId)
      .eq('is_active', true)
      .order('wear_pct', { ascending: false }),
    supabase
      .from('activities')
      .select('started_at, distance_km')
      .eq('bike_id', bikeId)
      .order('started_at', { ascending: false })
      .limit(90),
  ])

  if (!bike) return null

  return { bike, components: components ?? [], activities: activities ?? [] }
}
