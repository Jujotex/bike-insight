import { describe, expect, it } from 'vitest'
import {
  KM_PER_YEAR,
  MAINTENANCE_COST_PER_KM,
  benchmarkVerdict,
  formatRange,
  verdictColor,
} from './benchmarks'

describe('benchmarkVerdict', () => {
  const range = MAINTENANCE_COST_PER_KM // 0,03 – 0,08 €/km

  it('situe une valeur dans la fourchette', () => {
    expect(benchmarkVerdict(0.05, range)).toBe('within')
  })

  it('situe une valeur en dessous et au-dessus', () => {
    expect(benchmarkVerdict(0.01, range)).toBe('below')
    expect(benchmarkVerdict(0.2, range)).toBe('above')
  })

  // Les bornes appartiennent à la fourchette : quelqu'un pile à 0,03 €/km est
  // « dans la fourchette », pas « en dessous ».
  it('inclut les bornes', () => {
    expect(benchmarkVerdict(range.min, range)).toBe('within')
    expect(benchmarkVerdict(range.max, range)).toBe('within')
  })

  // Le cas le plus important : un compte neuf n'a ni dépense ni kilomètres.
  // Le classer « en dessous de la fourchette » serait un jugement infondé —
  // c'est une absence de données, pas une performance.
  it('renvoie unknown quand il n’y a pas de données, jamais below', () => {
    expect(benchmarkVerdict(null, range)).toBe('unknown')
    expect(benchmarkVerdict(undefined, range)).toBe('unknown')
    expect(benchmarkVerdict(0, range)).toBe('unknown')
  })

  // NaN et Infinity viennent d'une division par zéro en amont. `Infinity` €/km ne
  // veut pas dire « très au-dessus », ça veut dire que le kilométrage était nul.
  // Sans ce garde-fou, NaN passerait toutes les comparaisons et retomberait
  // silencieusement sur « dans la fourchette ».
  it('traite NaN, Infinity et les valeurs négatives comme une absence de données', () => {
    expect(benchmarkVerdict(NaN, range)).toBe('unknown')
    expect(benchmarkVerdict(Infinity, range)).toBe('unknown')
    expect(benchmarkVerdict(-Infinity, range)).toBe('unknown')
    expect(benchmarkVerdict(-5, range)).toBe('unknown')
  })

  it('fonctionne aussi sur la fourchette kilométrique', () => {
    expect(benchmarkVerdict(5000, KM_PER_YEAR)).toBe('within')
    expect(benchmarkVerdict(1200, KM_PER_YEAR)).toBe('below')
    expect(benchmarkVerdict(12000, KM_PER_YEAR)).toBe('above')
  })
})

describe('verdictColor', () => {
  // Hors fourchette n'est ni bon ni mauvais : un coût faible peut signifier un
  // entretien repoussé, un coût élevé du matériel haut de gamme. Seul « dans la
  // fourchette » est coloré — le reste doit rester neutre.
  it('ne colore que le verdict « dans la fourchette »', () => {
    expect(verdictColor('within')).toBe('var(--bi-ok)')
    expect(verdictColor('below')).toBe('var(--bi-muted)')
    expect(verdictColor('above')).toBe('var(--bi-muted)')
    expect(verdictColor('unknown')).toBe('var(--bi-muted)')
  })
})

describe('formatRange', () => {
  it('formate les décimales à la française', () => {
    expect(formatRange(MAINTENANCE_COST_PER_KM)).toBe('0,03-0,08 €/km')
  })

  it('formate les milliers avec séparateur', () => {
    // Espace insécable étroit selon la locale : on teste la structure, pas le
    // caractère exact d'espacement.
    expect(formatRange(KM_PER_YEAR)).toMatch(/^3\s?000-8\s?000 km\/an$/)
  })
})
