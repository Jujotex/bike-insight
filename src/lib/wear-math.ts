/**
 * Calculs d'usure et de rythme — fonctions pures.
 *
 * Extraites de `data.ts` le 12/08/2026. Elles y étaient inlinées, parfois
 * dupliquées à trois endroits, et jamais testées — alors que ce sont elles qui
 * produisent les chiffres que l'app vend : quand remplacer, dans combien de temps,
 * et à quel coût.
 *
 * Aucune dépendance à Supabase, à React ou à l'heure système (sauf paramètre
 * explicite) : tout est testable sans mock.
 */

/** Statut d'usure d'une pièce, tel que calculé par la vue `component_stats`. */
export type ComponentStatus = 'ok' | 'warn' | 'bad' | 'archived'

/** Niveau d'urgence affiché sur le dashboard. */
export type Urgency = 'now' | 'soon' | 'later'

/** Au-delà de ce délai, une pièce n'est plus « bientôt à traiter ». */
export const SOON_WEEKS_THRESHOLD = 8

/**
 * Rythme hebdomadaire d'un vélo, en km/semaine.
 *
 * Priorité aux 90 derniers jours (≈ 13 semaines) : c'est le rythme actuel, celui
 * qui prédit le mieux la suite. Repli sur 12 mois (52 semaines) quand la fenêtre
 * courte est vide — typiquement une reprise après une coupure hivernale, où les
 * 90 jours donneraient 0 et rendraient toute prédiction impossible.
 */
export function kmPerWeek(km90d: number, km365d: number): number {
  if (km90d > 0) return km90d / 13
  return km365d / 52
}

/**
 * Nombre de semaines avant qu'une pièce atteigne sa fin de vie.
 *
 * `null` quand le rythme est inconnu ou nul : sans kilomètres, on ne peut rien
 * prédire. Ne jamais remplacer ce `null` par 0 — « échéance inconnue » et
 * « échéance immédiate » sont deux messages opposés pour l'utilisateur.
 */
export function weeksUntilWorn(
  kmRemaining: number,
  weeklyKm: number
): number | null {
  if (!(weeklyKm > 0) || !Number.isFinite(kmRemaining)) return null
  return Math.max(0, Math.round(kmRemaining / weeklyKm))
}

/**
 * Urgence d'une pièce.
 *
 * Le statut prime sur le délai : une pièce en fin de vie est urgente même si le
 * vélo ne roule plus, parce que le prochain kilomètre roulé la mettra en défaut.
 */
export function urgencyOf(
  status: ComponentStatus | string | null | undefined,
  weeksUntil: number | null
): Urgency {
  if (status === 'bad') return 'now'
  if (weeksUntil !== null && weeksUntil <= SOON_WEEKS_THRESHOLD) return 'soon'
  return 'later'
}

/** Date estimée de remplacement, au format `YYYY-MM-DD`. `null` si non prédictible. */
export function estimatedReplacementDate(
  from: Date,
  weeksUntil: number | null
): string | null {
  if (weeksUntil === null) return null
  const ms = from.getTime() + weeksUntil * 7 * 86400000
  return new Date(ms).toISOString().slice(0, 10)
}

/** Une pièce, réduite à ce dont le score de santé a besoin. */
export type ReadinessInput = {
  status: ComponentStatus | string | null | undefined
  wearPct: number | null | undefined
}

/**
 * Score de santé d'un vélo, de 0 à 100.
 *
 * Trois régimes, avec des planchers différents : la présence d'une pièce en fin de
 * vie pèse plus lourd que l'usure moyenne, sans jamais faire tomber le score à
 * zéro — un vélo avec une chaîne morte reste roulable.
 *
 * | Cas | Formule | Plancher |
 * |---|---|---|
 * | Une pièce `bad` | 100 − usure moyenne × 1,3 | 30 |
 * | Une pièce `warn` | 100 − usure moyenne × 0,9 | 60 |
 * | Tout `ok` | 100 − usure moyenne × 0,5 | 75 |
 *
 * **Un vélo sans aucune pièce suivie obtient 100** — choix assumé, arbitré le
 * 12/08/2026. C'est bien une absence de données plutôt qu'une bonne santé, mais
 * afficher un score dégradé à quelqu'un qui vient de créer son vélo, avant même
 * d'avoir déclaré ses composants, l'accuserait d'un problème qu'il n'a pas. Ne pas
 * « corriger » sans y repenser : c'est intentionnel.
 */
export function readinessScore(components: ReadinessInput[]): number {
  const hasBad = components.some(c => c.status === 'bad')
  const hasWarn = components.some(c => c.status === 'warn')

  const avgWear =
    components.length > 0
      ? components.reduce((sum, c) => sum + (c.wearPct ?? 0), 0) / components.length
      : 0

  if (hasBad) return Math.max(30, Math.round(100 - avgWear * 1.3))
  if (hasWarn) return Math.max(60, Math.round(100 - avgWear * 0.9))
  return Math.max(75, Math.round(100 - avgWear * 0.5))
}

/**
 * Coût d'entretien au kilomètre.
 *
 * `null` quand aucun kilomètre n'a été parcouru — surtout pas `Infinity`, qui
 * traverserait tout l'affichage et finirait sous les yeux de l'utilisateur.
 */
export function costPerKm(spend: number, km: number): number | null {
  if (!(km > 0)) return null
  return spend / km
}
