import { createSupabaseServerClient } from './supabase-server'
import { computeMaintenanceStatus, formatNextDue, type MaintenanceLast } from './maintenance-catalog'
import { fetchUserMaintenanceDefsByBike } from './maintenance-types'

// ── Dashboard data ─────────────────────────────────────────────

export async function getDashboardData() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  const { data: bikes } = await supabase
    .from('bike_stats')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('total_km', { ascending: false })

  const [
    { data: allComponents },
    { data: ninetyDaysActivities },
    { data: yearActivitiesByBike },
    { data: bikeMaintLogs },
  ] = await Promise.all([
    // Composants actifs SUIVIS (km_max renseigné → km_remaining non nul) de tous
    // les vélos. Les pièces sans suivi km n'ont ni usure ni statut : les inclure
    // fausserait les moyennes.
    supabase.from('component_stats').select('*').eq('user_id', user.id).eq('is_active', true).not('km_remaining', 'is', null),
    // Activités 90j + 12m par vélo pour calculer le rythme km/semaine (avec fallback)
    supabase.from('activities').select('bike_id, distance_km, started_at').eq('user_id', user.id).gte('started_at', ninetyDaysAgo.toISOString()),
    supabase.from('activities').select('bike_id, distance_km').eq('user_id', user.id).gte('started_at', twelveMonthsAgo.toISOString()),
    // Entretiens au niveau vélo (lubrification, purge, ...) pour les alertes
    supabase.from('maintenance_logs').select('bike_id, maintenance_type, performed_at, km_at_action').eq('user_id', user.id).not('maintenance_type', 'is', null).order('performed_at', { ascending: false }),
  ])

  // Distance + sorties 12 mois PAR VÉLO — tous les chiffres du dashboard sont
  // rattachés au vélo sélectionné, jamais mélangés avec le global tous vélos.
  const km12mByBike: Record<string, number> = {}
  const rides12mByBike: Record<string, number> = {}
  for (const a of yearActivitiesByBike ?? []) {
    const bid = a.bike_id as string | null
    if (!bid) continue
    km12mByBike[bid] = (km12mByBike[bid] ?? 0) + (a.distance_km ?? 0)
    rides12mByBike[bid] = (rides12mByBike[bid] ?? 0) + 1
  }
  for (const k of Object.keys(km12mByBike)) km12mByBike[k] = Math.round(km12mByBike[k])

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

  const allActive = allComponents ?? []

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
      const nextDue = formatNextDue(st)
      const statusLabel = st.state === 'due' ? 'À faire'
        : st.state === 'soon' ? 'Bientôt'
        : nextDue ? `Dans ${nextDue}` : 'OK'
      const detail = st.kmSince !== null && def.intervalKm
        ? `fait il y a ${Math.round(st.kmSince).toLocaleString('fr')} km`
        : `fait il y a ${st.weeksSince} sem.`
      items.push({ typeId: def.id, label: def.label, state: st.state, pct: st.pct, statusLabel, detail })
    }
    items.sort((x, y) => STATE_RANK[x.state] - STATE_RANK[y.state] || y.pct - x.pct)
    maintenanceSummaryByBike[b.id as string] = { counts, items }
  }

  // Seuls les chiffres réellement affichés sont retournés — chacun est
  // rattaché à un vélo précis (jamais d'agrégat tous-vélos ambigu).
  return {
    user,
    bikes: bikes ?? [],
    km12mByBike,
    rides12mByBike,
    predictions,
    attentionItems,
    readinessByBike,
    maintenanceAlerts,
    maintenanceSummaryByBike,
  }
}

// ── Cost analysis ──────────────────────────────────────────────
// Modèle « dépense d'entretien » : on ne compte QUE l'argent réellement
// déboursé — remplacements de pièces + entretiens (maintenance_logs).
// Les prix catalogue des pièces d'origine ne sont pas comptés comme dépense
// (le prix cassette sert juste de référence à l'économie transmission).

export async function getCostData(bikeId?: string | null) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10)

  // Requêtes filtrables par vélo (sélecteur en haut de page). bikeId vide/null = tous.
  const compQ = supabase
    .from('component_stats')
    .select('id, name, category, bike_id, purchase_price, km_remaining')
    .eq('user_id', user.id)
    .eq('is_active', true)
  const bikeQ = supabase
    .from('bike_stats')
    .select('id, name, total_km')
    .eq('user_id', user.id)
    .eq('is_active', true)
  const actQ = supabase
    .from('activities')
    .select('bike_id, distance_km, started_at')
    .eq('user_id', user.id)
    .gte('started_at', twelveMonthsAgo)
  const maintQ = supabase
    .from('maintenance_logs')
    .select('cost, performed_at, maintenance_type, bike_id, action')
    .eq('user_id', user.id)
    .not('cost', 'is', null)
  const bikeMaintQ = supabase
    .from('maintenance_logs')
    .select('bike_id, maintenance_type, performed_at, km_at_action')
    .eq('user_id', user.id)
    .not('maintenance_type', 'is', null)
    .order('performed_at', { ascending: false })

  const [
    { data: components },
    { data: bikes },
    { data: activities },
    { data: maintLogs },
    { data: replacements },
    { data: bikeMaintLogs },
    { data: allBikesRaw },
    { data: allBikeCompStatus },
  ] = await Promise.all([
    bikeId ? compQ.eq('bike_id', bikeId) : compQ,
    bikeId ? bikeQ.eq('id', bikeId) : bikeQ,
    bikeId ? actQ.eq('bike_id', bikeId) : actQ,
    bikeId ? maintQ.eq('bike_id', bikeId) : maintQ,
    // Remplacements de pièces (join components) — filtrés par vélo côté JS plus bas
    supabase
      .from('maintenance_logs')
      .select('cost, performed_at, km_at_action, component_id, components(name, category, km_max, installed_km, bike_id)')
      .eq('user_id', user.id)
      .eq('action', 'Remplacement'),
    bikeId ? bikeMaintQ.eq('bike_id', bikeId) : bikeMaintQ,
    // Liste de TOUS les vélos actifs (pour le sélecteur, jamais filtrée)
    supabase.from('bike_stats').select('id, name').eq('user_id', user.id).eq('is_active', true),
    // État des pièces de TOUS les vélos — alimente la pastille de couleur du
    // sélecteur, qui doit rester lisible même quand la page est filtrée.
    supabase
      .from('component_stats')
      .select('bike_id, status')
      .eq('user_id', user.id)
      .eq('is_active', true),
  ])

  const comps = components ?? []
  const bikeList = bikes ?? []
  const logs = maintLogs ?? []
  // Remplacements filtrés par vélo (le bike_id est sur le composant joint).
  const repl = (replacements ?? []).filter(r => {
    if (!bikeId) return true
    const c = Array.isArray(r.components) ? r.components[0] : r.components
    return (c as { bike_id?: string | null } | null)?.bike_id === bikeId
  })
  const acts = activities ?? []

  // ── Entretien courant (maintenance_type non nul) ──────────────
  const servicingByBike: Record<string, number> = {}
  const servicingItems: Record<string, number> = {} // détail par type d'entretien
  let servicingTotal = 0
  let servicing12m = 0
  for (const l of logs) {
    if (!l.maintenance_type) continue
    const cost = (l.cost as number) ?? 0
    servicingTotal += cost
    const bid = l.bike_id as string | null
    if (bid) servicingByBike[bid] = (servicingByBike[bid] ?? 0) + cost
    if ((l.performed_at as string) >= twelveMonthsAgo) servicing12m += cost
    const label = (l.action as string | null) ?? 'Entretien'
    servicingItems[label] = (servicingItems[label] ?? 0) + cost
  }

  // Prix cassette par vélo (composant actif « cassette ») — référence éco transmission
  const cassettePriceByBike: Record<string, number> = {}
  for (const c of comps) {
    const name = ((c.name as string) ?? '').toLowerCase()
    const price = c.purchase_price as number | null
    if (name.includes('cassette') && price !== null) {
      const bid = c.bike_id as string
      cassettePriceByBike[bid] = Math.max(cassettePriceByBike[bid] ?? 0, price)
    }
  }

  // ── Remplacements de pièces (dépense réelle) ──────────────────
  const DEFAULT_CASSETTE = 90
  const CHAINRINGS_ESTIMATE = 50
  const CHAINS_PER_CASSETTE = 2

  type ReplComp = { name: string; category: string; km_max: number | null; installed_km: number | null; bike_id: string | null }
  const normalizeComp = (raw: unknown): ReplComp | null => {
    const c = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null)
    return (c as ReplComp | null) ?? null
  }

  const replacementByBike: Record<string, number> = {}
  const replacementByCat: Record<string, number> = {}
  const replItemsByCat: Record<string, Record<string, number>> = {} // détail par pièce
  let replacementTotal = 0
  let replacement12m = 0
  let longevityKm = 0
  let longevityParts = 0
  let transmissionSavings = 0
  let onTimeChains = 0
  let wastedTransmission = 0
  let lateChains = 0

  for (const r of repl) {
    const cost = (r.cost as number) ?? 0
    replacementTotal += cost
    if ((r.performed_at as string) >= twelveMonthsAgo) replacement12m += cost

    const comp = normalizeComp(r.components)
    const cat = comp?.category ?? 'autre'
    replacementByCat[cat] = (replacementByCat[cat] ?? 0) + cost
    const nm = comp?.name ?? 'Pièce'
    ;(replItemsByCat[cat] ??= {})[nm] = (replItemsByCat[cat][nm] ?? 0) + cost
    const bid = comp?.bike_id ?? null
    if (bid) replacementByBike[bid] = (replacementByBike[bid] ?? 0) + cost

    if (!comp) continue
    const kmAt = r.km_at_action as number | null
    const lifeKm = (kmAt !== null && comp.installed_km !== null) ? Math.max(0, kmAt - comp.installed_km) : null
    const kmMax = comp.km_max

    if (lifeKm !== null && kmMax !== null && lifeKm > kmMax) {
      longevityKm += lifeKm - kmMax
      longevityParts++
    }
    const name = (comp.name ?? '').toLowerCase()
    const isChain = name.includes('chaîne') || name.includes('chaine') || name.includes('chain')
    if (isChain && lifeKm !== null && kmMax !== null) {
      const cassette = (comp.bike_id && cassettePriceByBike[comp.bike_id]) ? cassettePriceByBike[comp.bike_id] : DEFAULT_CASSETTE
      const unit = (cassette + CHAINRINGS_ESTIMATE) / CHAINS_PER_CASSETTE
      if (lifeKm <= kmMax) {
        // Changée à temps → transmission préservée
        transmissionSavings += unit
        onTimeChains++
      } else {
        // Changée en retard → usure prématurée cassette/plateaux (évitable)
        wastedTransmission += unit
        lateChains++
      }
    }
  }

  // ── Dépense d'entretien = remplacements + entretien courant ───
  const spendTotal = replacementTotal + servicingTotal
  const spend12m = replacement12m + servicing12m

  // ── Repères « où tu te situes » ───────────────────────────────
  // km sur 12 mois (= km/an) et coût d'entretien par km sur la même fenêtre.
  const km12mTotal = acts.reduce((s, a) => s + ((a.distance_km as number) ?? 0), 0)
  const costPerKm = km12mTotal > 0 ? spend12m / km12mTotal : null

  const byBike = bikeList
    .map(b => {
      const bid = b.id as string
      const spend = (replacementByBike[bid] ?? 0) + (servicingByBike[bid] ?? 0)
      return {
        id: bid,
        name: b.name as string,
        totalKm: Math.round((b.total_km as number) ?? 0),
        spend: Math.round(spend),
      }
    })
    .filter(b => b.spend > 0)
    .sort((a, b) => b.spend - a.spend)

  // Où part l'argent : remplacements par catégorie + entretien courant, avec détail
  const itemsFor = (key: string): { label: string; total: number }[] => {
    const src = key === 'entretien' ? servicingItems : (replItemsByCat[key] ?? {})
    return Object.entries(src)
      .map(([label, total]) => ({ label, total: Math.round(total) }))
      .filter(i => i.total > 0)
      .sort((a, b) => b.total - a.total)
  }
  const breakdownRaw = Object.entries(replacementByCat).map(([key, total]) => ({ key, total }))
  if (servicingTotal > 0) breakdownRaw.push({ key: 'entretien', total: servicingTotal })
  const breakdown = breakdownRaw
    .filter(x => x.total > 0)
    .map(x => ({
      key: x.key,
      total: Math.round(x.total),
      pct: spendTotal > 0 ? Math.round((x.total / spendTotal) * 100) : 0,
      items: itemsFor(x.key),
    }))
    .sort((a, b) => b.total - a.total)

  // ── Projection : ce qui t'attend ──────────────────────────────
  // Rythme km/semaine par vélo (90 jours, repli sur 12 mois)
  const ninetyCut = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const km90: Record<string, number> = {}
  const km12: Record<string, number> = {}
  for (const a of acts) {
    const bid = a.bike_id as string | null
    if (!bid) continue
    const d = (a.distance_km as number) ?? 0
    km12[bid] = (km12[bid] ?? 0) + d
    if ((a.started_at as string) >= ninetyCut) km90[bid] = (km90[bid] ?? 0) + d
  }
  const kmPerWeek: Record<string, number> = {}
  for (const b of bikeList) {
    const bid = b.id as string
    kmPerWeek[bid] = (km90[bid] ?? 0) > 0 ? km90[bid] / 13 : (km12[bid] ?? 0) / 52
  }

  // Élément de projection unifié : pièce à remplacer OU entretien à venir, avec lien.
  type UpcomingItem = { key: string; name: string; cost: number; weeksUntil: number; href: string }

  // Pièces actives approchant leur fin de vie, avec un prix estimé de remplacement.
  const componentUpcoming: UpcomingItem[] = comps
    .filter(c => (c.km_remaining as number | null) !== null && (c.purchase_price as number | null) !== null)
    .map(c => {
      const weekly = kmPerWeek[c.bike_id as string] ?? 0
      const kmRem = Math.max(0, (c.km_remaining as number) ?? 0)
      const weeksUntil = weekly > 0 ? Math.max(0, Math.round(kmRem / weekly)) : null
      return {
        key: (c.category as string) ?? 'autre',
        name: c.name as string,
        cost: Math.round((c.purchase_price as number) ?? 0),
        weeksUntil,
        href: `/components/${c.id as string}`,
      }
    })
    .filter((u): u is UpcomingItem => u.weeksUntil !== null)

  // Entretiens à venir qui ont un coût atelier indicatif (purge, révision, suspension…) :
  // ils font partie du budget à prévoir, on les intègre à la projection.
  const defsByBikeCost = await fetchUserMaintenanceDefsByBike(supabase, user.id)
  const lastMaintCost: Record<string, MaintenanceLast> = {}
  for (const l of bikeMaintLogs ?? []) {
    const k = `${l.bike_id}:${l.maintenance_type}`
    if (!(k in lastMaintCost)) {
      lastMaintCost[k] = {
        performed_at: l.performed_at as string,
        km_at_action: (l.km_at_action as number | null) ?? null,
      }
    }
  }
  const maintenanceUpcoming: UpcomingItem[] = []
  for (const b of bikeList) {
    const bid = b.id as string
    const bikeKm = (b.total_km as number) ?? 0
    const weekly = kmPerWeek[bid] ?? 0
    for (const def of (defsByBikeCost[bid] ?? [])) {
      const cost = def.defaultCost
      if (!cost) continue // seulement les entretiens qui coûtent (atelier)
      const last = lastMaintCost[`${bid}:${def.id}`] ?? null
      const st = computeMaintenanceStatus(def, last, bikeKm)
      if (st.state === 'never') continue
      // Semaines avant échéance : par le temps, ou converties depuis les km restants.
      const wByKm = st.dueInKm !== null && weekly > 0 ? Math.round(st.dueInKm / weekly) : null
      const candidates = [st.dueInWeeks, wByKm].filter((x): x is number => x !== null)
      if (candidates.length === 0) continue
      maintenanceUpcoming.push({
        key: 'entretien',
        name: def.label,
        cost,
        weeksUntil: Math.min(...candidates),
        href: `/bikes/${bid}`,
      })
    }
  }

  const upcomingAll: UpcomingItem[] = [...componentUpcoming, ...maintenanceUpcoming]
    .sort((a, b) => a.weeksUntil - b.weeksUntil)

  const projected12m = upcomingAll
    .filter(u => u.weeksUntil <= 52)
    .reduce((s, u) => s + u.cost, 0)

  // ── Activité 3 mois (tous vélos, agrégée par semaine) ─────────
  const WEEKS = 13
  const nowMs = Date.now()
  const weekly = new Array(WEEKS).fill(0)
  for (const a of acts) {
    const daysAgo = (nowMs - new Date(a.started_at as string).getTime()) / 86400000
    if (daysAgo < 0 || daysAgo >= WEEKS * 7) continue
    const idx = WEEKS - 1 - Math.floor(daysAgo / 7) // semaine la plus récente = dernière barre
    weekly[idx] += (a.distance_km as number) ?? 0
  }
  const activityChart = weekly.map(v => Math.round(v))
  const totalKm90d = activityChart.reduce((s, v) => s + v, 0)

  return {
    kpis: {
      spendTotal: Math.round(spendTotal),
      spend12m: Math.round(spend12m),
      costPerKm, // €/km sur 12 mois, non arrondi (null si pas de km)
      km12m: Math.round(km12mTotal),
    },
    byBike,
    breakdown,
    activity: {
      chart: activityChart,
      total: totalKm90d,
    },
    projection: {
      total12m: Math.round(projected12m),
      upcoming: upcomingAll.slice(0, 6),
    },
    allBikes: (allBikesRaw ?? []).map(b => {
      // Le vélo prend le pire état de ses pièces — même règle que le dashboard.
      const own = (allBikeCompStatus ?? []).filter(c => c.bike_id === b.id)
      const status = own.some(c => c.status === 'bad')
        ? 'bad' as const
        : own.some(c => c.status === 'warn')
          ? 'warn' as const
          : 'ok' as const
      return { id: b.id as string, name: b.name as string, status }
    }),
    selectedBikeId: bikeId ?? null,
    insights: {
      transmissionSavings: Math.round(transmissionSavings),
      onTimeChains,
      wastedTransmission: Math.round(wastedTransmission),
      lateChains,
      longevityKm: Math.round(longevityKm),
      longevityParts,
      replacementCost: Math.round(replacementTotal),
      servicingCost: Math.round(servicingTotal),
    },
    hasData: spendTotal > 0 || upcomingAll.length > 0 || totalKm90d > 0,
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

  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

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
    // Toutes les sorties des 12 derniers mois de CE vélo (pas de limit :
    // un limit tronquerait les stats « 12 mois » des cyclistes réguliers).
    supabase
      .from('activities')
      .select('started_at, distance_km')
      .eq('bike_id', bikeId)
      .gte('started_at', twelveMonthsAgo)
      .order('started_at', { ascending: false }),
  ])

  if (!bike) return null

  return { bike, components: components ?? [], activities: activities ?? [] }
}
