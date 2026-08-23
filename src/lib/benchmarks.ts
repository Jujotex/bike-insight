/**
 * Repères de référence — « où tu te situes ».
 *
 * Des fourchettes **statiques**, assumées comme des ordres de grandeur, et non des
 * moyennes calculées sur les utilisateurs. Ce n'est pas une limite technique : le
 * §5.4 de l'API Policy Strava interdit d'agréger les données des athlètes, même
 * anonymisées, à des fins d'analyse ou de communication. Toute tentative de
 * remplacer ces valeurs par des moyennes observées serait une violation.
 *
 * Historique : la tâche 4.1 du backlog de juillet a été cochée « faite » mais ce
 * fichier n'a jamais atterri dans le dépôt, alors que le calcul de `costPerKm` et
 * `km12m` dans `data.ts`, lui, était bien présent. Le calcul tournait donc dans le
 * vide depuis un mois. Écrit le 12/08/2026.
 */

export type BenchmarkRange = {
  /** Borne basse de la fourchette de référence. */
  min: number
  /** Borne haute. */
  max: number
  /** Unité affichée. */
  unit: string
  /** Ce que la fourchette décrit, en une phrase. */
  label: string
}

/**
 * Coût d'entretien au kilomètre d'un cycliste route régulier.
 *
 * Ordre de grandeur usuel : consommables (chaîne, cassette, plateaux, pneus,
 * plaquettes) rapportés au kilométrage annuel. En dessous, on roule peu ou on
 * repousse les remplacements ; au-dessus, matériel haut de gamme, conditions
 * difficiles, ou passage systématique en atelier.
 */
export const MAINTENANCE_COST_PER_KM: BenchmarkRange = {
  min: 0.03,
  max: 0.08,
  unit: '€/km',
  label: "coût d'entretien au kilomètre d'un routier régulier",
}

/** Kilométrage annuel d'un cycliste route régulier. */
export const KM_PER_YEAR: BenchmarkRange = {
  min: 3000,
  max: 8000,
  unit: 'km/an',
  label: "kilométrage annuel d'un routier régulier",
}

export type BenchmarkVerdict = 'below' | 'within' | 'above' | 'unknown'

/**
 * Situe une valeur par rapport à une fourchette.
 *
 * `unknown` quand la valeur est absente ou nulle — cas fréquent et normal : un
 * compte neuf n'a ni dépense ni kilomètres. Il ne faut surtout pas le confondre
 * avec « en dessous de la fourchette », qui serait un jugement infondé.
 */
export function benchmarkVerdict(
  value: number | null | undefined,
  range: BenchmarkRange
): BenchmarkVerdict {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) {
    return 'unknown'
  }
  if (value < range.min) return 'below'
  if (value > range.max) return 'above'
  return 'within'
}

/** Libellé court associé à un verdict, pour l'affichage. */
export function verdictLabel(verdict: BenchmarkVerdict): string {
  switch (verdict) {
    case 'below':
      return 'En dessous de la fourchette'
    case 'within':
      return 'Dans la fourchette'
    case 'above':
      return 'Au-dessus de la fourchette'
    case 'unknown':
      return 'Pas encore assez de données'
  }
}

/**
 * Couleur associée à un verdict.
 *
 * Volontairement **neutre pour `below` et `above`** : être hors de la fourchette
 * n'est ni bien ni mal. Un coût faible peut signifier un entretien repoussé, un
 * coût élevé un matériel haut de gamme. Colorer en rouge ou en vert reviendrait à
 * porter un jugement que ces fourchettes ne permettent pas.
 */
export function verdictColor(verdict: BenchmarkVerdict): string {
  return verdict === 'within' ? 'var(--bi-ok)' : 'var(--bi-muted)'
}

/** Formate une fourchette pour l'affichage : « 0,03-0,08 €/km ». */
export function formatRange(range: BenchmarkRange): string {
  const fmt = (n: number) =>
    n < 1 ? n.toFixed(2).replace('.', ',') : n.toLocaleString('fr-FR')
  return `${fmt(range.min)}-${fmt(range.max)} ${range.unit}`
}
