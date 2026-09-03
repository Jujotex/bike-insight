import type { SupabaseClient } from '@supabase/supabase-js'
import { assertNoError } from '@/lib/supabase-result'
import { fetchBikeMaintenanceDefs } from '@/lib/maintenance-types'
import type { MaintenanceLast } from '@/lib/maintenance-catalog'

/**
 * Données de la fiche vélo.
 *
 * Regroupe ce qui était éclaté entre `getBikeData` (dans `data.ts`) et une seconde
 * série de requêtes faite directement dans la page — dont un `await import()` de
 * `supabase-server` en plein milieu du rendu.
 *
 * Le type de retour n'est **volontairement pas annoté** : les lignes de
 * `bike_stats` et `component_stats` arrivent non typées de Supabase (pas de types
 * générés dans ce projet), et la page les lit avec des `as` un peu partout.
 * Annoter ici resserrerait le typage et casserait le rendu pour un gain nul.
 */
export async function loadBikeDetailData(
  supabase: SupabaseClient,
  userId: string,
  bikeId: string
) {
  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

  const results = await Promise.all([
    // `maybeSingle` : un vélo introuvable est un cas géré plus bas par une
    // redirection, pas une erreur de chargement.
    supabase.from('bike_stats').select('*').eq('id', bikeId).eq('user_id', userId).maybeSingle(),
    supabase
      .from('component_stats')
      .select('*')
      .eq('bike_id', bikeId)
      .eq('is_active', true)
      .order('wear_pct', { ascending: false }),
    // Toutes les sorties des 12 derniers mois de CE vélo (pas de `limit` :
    // il tronquerait les stats « 12 mois » des cyclistes réguliers).
    supabase
      .from('activities')
      .select('started_at, distance_km')
      .eq('bike_id', bikeId)
      .gte('started_at', twelveMonthsAgo)
      .order('started_at', { ascending: false }),
  ])

  assertNoError(results, 'bike-detail')
  const [{ data: bike }, { data: components }, { data: activities }] = results

  if (!bike) return null

  const secondResults = await Promise.all([
    supabase
      .from('maintenance_logs')
      .select('id, action, cost, notes, maintenance_type, performed_at, km_at_action')
      .eq('bike_id', bikeId)
      .not('maintenance_type', 'is', null)
      .order('performed_at', { ascending: false }),
    // Remplacements de pièces de ce vélo (via le composant), pour la dépense.
    supabase
      .from('maintenance_logs')
      .select('cost, components!inner(bike_id)')
      .eq('action', 'Remplacement')
      .eq('components.bike_id', bikeId),
    fetchBikeMaintenanceDefs(supabase, bikeId),
  ])

  // Le troisième élément n'est pas un résultat Supabase mais une valeur déjà
  // construite : on ne contrôle que les deux requêtes.
  const [maintLogsRes, replacementsRes, maintenanceDefs] = secondResults
  assertNoError([maintLogsRes, replacementsRes], 'bike-detail')

  const { data: bikeMaintLogs } = maintLogsRes
  const { data: bikeReplacements } = replacementsRes

  // Dépense d'entretien du vélo = entretiens + remplacements réellement payés.
  const maintenanceSpend = Math.round(
    (bikeMaintLogs ?? []).reduce((s, l) => s + ((l.cost as number) ?? 0), 0) +
      (bikeReplacements ?? []).reduce((s, l) => s + ((l.cost as number) ?? 0), 0)
  )

  // Dernier entretien enregistré, par type — la liste est déjà triée du plus
  // récent au plus ancien, donc la première occurrence gagne.
  const lastByType: Record<string, MaintenanceLast> = {}
  for (const l of bikeMaintLogs ?? []) {
    const t = l.maintenance_type as string
    if (!(t in lastByType)) {
      lastByType[t] = {
        performed_at: l.performed_at as string,
        km_at_action: (l.km_at_action as number | null) ?? null,
      }
    }
  }

  const acts = activities ?? []
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  const activities12m = acts.filter(a => new Date(a.started_at) >= cutoff)
  const totalRides12m = activities12m.length
  const totalKm12m = activities12m.reduce((s, a) => s + (a.distance_km ?? 0), 0)

  return {
    bike,
    components: components ?? [],
    activities: acts,
    bikeMaintLogs: bikeMaintLogs ?? [],
    maintenanceDefs,
    maintenanceSpend,
    lastByType,
    totalRides12m,
    totalKm12m,
    avgKmPerRide: totalRides12m > 0 ? Math.round((totalKm12m / totalRides12m) * 10) / 10 : 0,
  }
}
