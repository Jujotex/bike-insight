import type { SupabaseClient } from '@supabase/supabase-js'
import { assertNoError } from '@/lib/supabase-result'

/**
 * Données de la fiche pièce.
 *
 * Seules les **requêtes** sont extraites ici. La centaine de lignes de calculs qui
 * suit dans la page (vie restante, coût aux 1 000 km, points du graphe d'usure)
 * reste sur place : ce sont des dérivations d'affichage qui dépendent de l'instant
 * du rendu, pas des données.
 *
 * Type de retour non annoté : les lignes de `component_stats` arrivent non typées
 * de Supabase et la page les lit avec des `as` un peu partout.
 */
export async function loadComponentDetailData(
  supabase: SupabaseClient,
  userId: string,
  componentId: string
) {
  const results = await Promise.all([
    // `maybeSingle` : une pièce introuvable est traitée plus bas par une
    // redirection, ce n'est pas une erreur de chargement.
    supabase
      .from('component_stats')
      .select('*')
      .eq('id', componentId)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('maintenance_logs')
      .select('action, performed_at, km_at_action, cost, reason')
      .eq('component_id', componentId)
      .order('performed_at', { ascending: true }),
  ])

  assertNoError(results, 'component-detail')
  const [{ data: comp }, { data: logs }] = results

  if (!comp) return null

  const bikeRes = await supabase
    .from('bikes')
    .select('name, total_km')
    .eq('id', comp.bike_id)
    .maybeSingle()

  assertNoError([bikeRes], 'component-detail')
  const { data: bike } = bikeRes

  // Activités du vélo — une seule requête, réutilisée pour le rythme (vie
  // restante) et pour le graphe d'usure. Inutile de la lancer si la pièce n'a pas
  // de durée de vie déclarée : rien ne serait calculable.
  const kmMax = Math.round((comp.km_max as number) ?? 0)
  let bikeRides: { started_at: string; distance_km: number | null }[] = []

  if (kmMax > 0 && comp.bike_id) {
    let ridesQuery = supabase
      .from('activities')
      .select('started_at, distance_km')
      .eq('bike_id', comp.bike_id as string)
    if (comp.installed_at) {
      ridesQuery = ridesQuery.gte('started_at', comp.installed_at as string)
    }
    const ridesRes = await ridesQuery.order('started_at', { ascending: true })
    assertNoError([ridesRes], 'component-detail')
    bikeRides = (ridesRes.data ?? []) as { started_at: string; distance_km: number | null }[]
  }

  return { comp, logs: logs ?? [], bike, bikeRides }
}
