import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computeMaintenanceStatus, formatNextDue, type MaintenanceDef } from './maintenance-catalog'

// La fonction lit `Date.now()`. On fige l'horloge pour que les tests ne dépendent
// pas du jour où ils tournent — sinon ils passeraient en juin et casseraient en
// décembre, ce qui est pire que pas de test du tout.
const NOW = new Date('2026-08-12T12:00:00Z')

/** Date ISO située `days` jours avant l'instant figé. */
function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86400000).toISOString()
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

const KM_ONLY: MaintenanceDef = {
  id: 'test-km',
  label: 'Entretien au kilométrage',
  sub: '',
  intervalKm: 1000,
}

const TIME_ONLY: MaintenanceDef = {
  id: 'test-time',
  label: 'Entretien au calendrier',
  sub: '',
  intervalMonths: 12,
}

const BOTH: MaintenanceDef = {
  id: 'test-both',
  label: 'Entretien mixte',
  sub: '',
  intervalKm: 1000,
  intervalMonths: 12,
}

describe('computeMaintenanceStatus — états', () => {
  it('renvoie « never » quand aucun entretien n’a été enregistré', () => {
    expect(computeMaintenanceStatus(KM_ONLY, null, 5000)).toEqual({ state: 'never' })
  })

  it('passe ok → soon → due aux seuils 75 % et 100 %', () => {
    const last = { performed_at: daysAgo(1), km_at_action: 0 }

    expect(computeMaintenanceStatus(KM_ONLY, last, 500).state).toBe('ok')
    expect(computeMaintenanceStatus(KM_ONLY, last, 749).state).toBe('ok')
    expect(computeMaintenanceStatus(KM_ONLY, last, 750).state).toBe('soon')
    expect(computeMaintenanceStatus(KM_ONLY, last, 999).state).toBe('soon')
    expect(computeMaintenanceStatus(KM_ONLY, last, 1000).state).toBe('due')
    expect(computeMaintenanceStatus(KM_ONLY, last, 3000).state).toBe('due')
  })

  it('plafonne la progression à 100 %, même très en retard', () => {
    const last = { performed_at: daysAgo(1), km_at_action: 0 }
    const status = computeMaintenanceStatus(KM_ONLY, last, 9999)
    expect(status.state).toBe('due')
    if (status.state !== 'never') expect(status.pct).toBe(100)
  })
})

describe('computeMaintenanceStatus — dimension contraignante', () => {
  // Le cœur de la logique : quand un entretien a deux échéances, c'est la plus
  // avancée qui doit être annoncée. Se tromper ici afficherait « encore 900 km »
  // à quelqu'un dont l'échéance calendaire est dépassée depuis six mois.
  it('retient le kilométrage quand il est plus avancé que le temps', () => {
    const last = { performed_at: daysAgo(30), km_at_action: 0 }
    const status = computeMaintenanceStatus(BOTH, last, 900) // 90 % km, ~8 % temps
    if (status.state === 'never') throw new Error('inattendu')
    expect(status.dueKind).toBe('km')
    expect(status.state).toBe('soon')
  })

  it('retient le temps quand il est plus avancé que le kilométrage', () => {
    const last = { performed_at: daysAgo(340), km_at_action: 0 }
    const status = computeMaintenanceStatus(BOTH, last, 100) // 10 % km, ~93 % temps
    if (status.state === 'never') throw new Error('inattendu')
    expect(status.dueKind).toBe('time')
    expect(status.state).toBe('soon')
  })

  it('n’annonce que la dimension définie quand il n’y en a qu’une', () => {
    const last = { performed_at: daysAgo(30), km_at_action: 0 }

    const km = computeMaintenanceStatus(KM_ONLY, last, 500)
    if (km.state === 'never') throw new Error('inattendu')
    expect(km.dueKind).toBe('km')
    expect(km.dueInWeeks).toBeNull()

    const time = computeMaintenanceStatus(TIME_ONLY, last, 500)
    if (time.state === 'never') throw new Error('inattendu')
    expect(time.dueKind).toBe('time')
    expect(time.dueInKm).toBeNull()
  })
})

describe('computeMaintenanceStatus — robustesse', () => {
  // Scénario devenu réel avec les webhooks : une sortie supprimée sur Strava fait
  // *baisser* le compteur du vélo. Sans le garde-fou, `kmSince` deviendrait négatif
  // et l'échéance repartirait en arrière.
  it('ne produit pas de kilométrage négatif si le compteur du vélo a baissé', () => {
    const last = { performed_at: daysAgo(10), km_at_action: 2000 }
    const status = computeMaintenanceStatus(KM_ONLY, last, 1800)
    if (status.state === 'never') throw new Error('inattendu')
    expect(status.kmSince).toBe(0)
    expect(status.state).toBe('ok')
  })

  // Une sortie manuelle enregistrée sans kilométrage laisse `km_at_action` à null.
  // L'échéance doit alors basculer sur le temps sans planter.
  it('gère un entretien enregistré sans kilométrage', () => {
    const last = { performed_at: daysAgo(400), km_at_action: null }
    const status = computeMaintenanceStatus(BOTH, last, 5000)
    if (status.state === 'never') throw new Error('inattendu')
    expect(status.kmSince).toBeNull()
    expect(status.dueInKm).toBeNull()
    expect(status.dueKind).toBe('time')
    expect(status.state).toBe('due')
  })

  it('ne renvoie jamais de délai restant négatif', () => {
    const last = { performed_at: daysAgo(1000), km_at_action: 0 }
    const status = computeMaintenanceStatus(BOTH, last, 9999)
    if (status.state === 'never') throw new Error('inattendu')
    expect(status.dueInKm).toBe(0)
    expect(status.dueInWeeks).toBe(0)
  })
})

describe('formatNextDue', () => {
  it('ne renvoie rien quand l’entretien n’a jamais été fait', () => {
    expect(formatNextDue({ state: 'never' })).toBe('')
  })

  it('exprime une échéance kilométrique en km', () => {
    const last = { performed_at: daysAgo(1), km_at_action: 0 }
    expect(formatNextDue(computeMaintenanceStatus(KM_ONLY, last, 500))).toMatch(/^500 km$/)
  })

  // Bascule semaines → mois à partir de 5 semaines, pour éviter « 34 sem. ».
  it('bascule des semaines aux mois au-delà de 5 semaines', () => {
    const proche = { performed_at: daysAgo(345), km_at_action: null }
    expect(formatNextDue(computeMaintenanceStatus(TIME_ONLY, proche, 0))).toMatch(/sem\.$/)

    const lointain = { performed_at: daysAgo(30), km_at_action: null }
    expect(formatNextDue(computeMaintenanceStatus(TIME_ONLY, lointain, 0))).toMatch(/mois$/)
  })
})
