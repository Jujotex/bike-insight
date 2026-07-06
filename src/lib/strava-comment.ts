import type { SupabaseClient } from '@supabase/supabase-js'

// Ajoute une alerte d'usure critique à la description des sorties Strava.
// Opt-in (réglage strava_wear_comment) + scope activity:write requis.
// Idempotent : n'écrit pas deux fois sur la même sortie (marqueur).

const STRAVA_API = 'https://www.strava.com/api/v3'
const MARKER = 'Bike Insight' // présence = déjà annotée, on n'y retouche pas

type SyncedActivity = { strava_id: number; bike_id: string | null }

// Type court = premier mot du nom, pour voir le problème d'un coup d'œil.
// « Cassette Shimano 105 CS-HG700-11 » → « Cassette », « Pneus route 700c » → « Pneus »
function shortType(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

function buildPhrase(comps: { name: string; wear: number }[]): string {
  // Regroupe par type court, garde l'usure la plus élevée, trie décroissant
  const worstByType = new Map<string, number>()
  for (const c of comps) {
    const type = shortType(c.name)
    if (c.wear > (worstByType.get(type) ?? 0)) worstByType.set(type, c.wear)
  }
  const lines = [...worstByType.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, wear]) => `🔴 ${type} · ${Math.round(wear)}%`)

  const parts = [
    `🚴 ${MARKER}`,
    ...lines,
  ]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) parts.push(`Suis l'usure de ton vélo → ${appUrl}`)
  return parts.join('\n')
}

export async function commentWearOnActivities(
  supabase: SupabaseClient,
  userId: string,
  accessToken: string,
  activities: SyncedActivity[]
): Promise<void> {
  // 1. Réglage activé ?
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('strava_wear_comment')
    .eq('user_id', userId)
    .single()
  if (!settings?.strava_wear_comment) return

  const withBike = activities.filter(a => a.bike_id && a.strava_id)
  if (withBike.length === 0) return

  // 2. Pièces critiques (bad) groupées par vélo
  const { data: comps } = await supabase
    .from('component_stats')
    .select('name, bike_id, wear_pct, status')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('status', 'bad')

  if (!comps || comps.length === 0) return

  const badByBike = new Map<string, { name: string; wear: number }[]>()
  for (const c of comps) {
    const bid = c.bike_id as string
    if (!badByBike.has(bid)) badByBike.set(bid, [])
    badByBike.get(bid)!.push({ name: c.name as string, wear: (c.wear_pct as number) ?? 100 })
  }

  const auth = { Authorization: `Bearer ${accessToken}` }

  // 3. Pour chaque nouvelle sortie sur un vélo à pièce critique
  for (const act of withBike) {
    const bikeComps = badByBike.get(act.bike_id as string)
    if (!bikeComps || bikeComps.length === 0) continue

    try {
      const getRes = await fetch(`${STRAVA_API}/activities/${act.strava_id}`, { headers: auth })
      if (!getRes.ok) {
        // 401/403 = scope activity:write absent ou token invalide → inutile de continuer
        if (getRes.status === 401 || getRes.status === 403) {
          console.error('[strava-comment] accès refusé (scope activity:write manquant ?) — arrêt')
          return
        }
        if (getRes.status === 429) { console.error('[strava-comment] rate limit — arrêt'); return }
        continue
      }

      const activity = await getRes.json()
      const existing = (activity.description as string | null) ?? ''
      if (existing.includes(MARKER)) continue // déjà annotée

      const phrase = buildPhrase(bikeComps)
      const description = existing.trim() ? `${existing.trim()}\n\n${phrase}` : phrase

      const putRes = await fetch(`${STRAVA_API}/activities/${act.strava_id}`, {
        method: 'PUT',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      if (!putRes.ok) {
        if (putRes.status === 401 || putRes.status === 403) {
          console.error('[strava-comment] écriture refusée (scope activity:write manquant ?) — arrêt')
          return
        }
        if (putRes.status === 429) { console.error('[strava-comment] rate limit — arrêt'); return }
        console.error('[strava-comment] PUT échoué:', putRes.status)
      }
    } catch (err) {
      console.error('[strava-comment] erreur sur activité', act.strava_id, err)
    }
  }
}
