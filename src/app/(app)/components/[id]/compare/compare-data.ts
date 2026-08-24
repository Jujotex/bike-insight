import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Données de la page « Comparer un remplacement ».
 *
 * Comme pour la fiche pièce : seules les requêtes sont ici. Le choix du catalogue
 * et les calculs de coût annuel restent dans la page — ils ne touchent pas la base.
 *
 * Les deux requêtes d'activités étaient auparavant lancées **au milieu** des
 * dérivations, une trentaine de lignes après les deux premières. Elles sont
 * regroupées ici : tout ce qui parle à la base part en même temps.
 */
export async function loadCompareData(
  supabase: SupabaseClient,
  userId: string,
  componentId: string
) {
  const { data: comp } = await supabase
    .from('component_stats')
    .select('*')
    .eq('id', componentId)
    .eq('user_id', userId)
    .single()

  if (!comp) return null

  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: bike }, { data: recentActs }, { data: firstActs }] = await Promise.all([
    supabase
      .from('bikes')
      .select('name, total_km, groupset_template_id')
      .eq('id', comp.bike_id)
      .single(),
    // Distance réelle des 12 derniers mois, pour le coût annuel.
    supabase
      .from('activities')
      .select('distance_km')
      .eq('user_id', userId)
      .eq('bike_id', comp.bike_id)
      .gte('started_at', twelveMonthsAgo),
    // Première sortie connue du vélo, pour estimer son âge.
    supabase
      .from('activities')
      .select('started_at')
      .eq('user_id', userId)
      .eq('bike_id', comp.bike_id)
      .order('started_at', { ascending: true })
      .limit(1),
  ])

  return {
    comp,
    bike,
    km365: Math.round((recentActs ?? []).reduce((s, a) => s + ((a.distance_km as number) ?? 0), 0)),
    firstRide: (firstActs?.[0]?.started_at as string | undefined) ?? undefined,
  }
}
