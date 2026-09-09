import { describe, expect, it } from 'vitest'
import {
  WEAR_BAD_RATIO,
  costPerKm,
  estimatedReplacementDate,
  extensionSuggestions,
  kmPerWeek,
  minKmExtensionFor,
  readinessScore,
  statusFromKm,
  urgencyOf,
  wearPctOf,
  weeksUntilWorn,
} from './wear-math'

describe('kmPerWeek', () => {
  it('utilise les 90 derniers jours en priorité', () => {
    expect(kmPerWeek(1300, 5200)).toBeCloseTo(100) // 1300 / 13
  })

  // Cas réel : reprise après coupure hivernale. Sans le repli, le rythme
  // tomberait à 0 et plus aucune échéance ne serait prédictible.
  it('se rabat sur les 12 mois quand la fenêtre courte est vide', () => {
    expect(kmPerWeek(0, 5200)).toBeCloseTo(100) // 5200 / 52
  })

  it('renvoie 0 quand aucune donnée n’est disponible', () => {
    expect(kmPerWeek(0, 0)).toBe(0)
  })
})

describe('weeksUntilWorn', () => {
  it('convertit des kilomètres restants en semaines', () => {
    expect(weeksUntilWorn(1000, 100)).toBe(10)
  })

  it('arrondit au plus proche', () => {
    expect(weeksUntilWorn(1040, 100)).toBe(10)
    expect(weeksUntilWorn(1060, 100)).toBe(11)
  })

  // Distinction essentielle : « je ne sais pas » n'est pas « c'est pour maintenant ».
  // Remplacer ce null par 0 afficherait une urgence à tous les vélos à l'arrêt.
  it('renvoie null quand le vélo ne roule pas, jamais 0', () => {
    expect(weeksUntilWorn(1000, 0)).toBeNull()
    expect(weeksUntilWorn(1000, -5)).toBeNull()
    expect(weeksUntilWorn(1000, NaN)).toBeNull()
  })

  // Une pièce déjà dépassée a un kmRemaining négatif : on plafonne à 0 semaine,
  // pas à un délai négatif.
  it('ne renvoie jamais de délai négatif', () => {
    expect(weeksUntilWorn(-500, 100)).toBe(0)
  })
})

describe('urgencyOf', () => {
  // Le statut prime sur le délai : une pièce en fin de vie reste urgente même sur
  // un vélo à l'arrêt, parce que le prochain kilomètre la met en défaut.
  it('classe « now » toute pièce en fin de vie, quel que soit le délai', () => {
    expect(urgencyOf('bad', null)).toBe('now')
    expect(urgencyOf('bad', 200)).toBe('now')
  })

  it('classe « soon » jusqu’à 8 semaines incluses', () => {
    expect(urgencyOf('ok', 8)).toBe('soon')
    expect(urgencyOf('ok', 9)).toBe('later')
    expect(urgencyOf('warn', 0)).toBe('soon')
  })

  it('classe « later » quand le délai est inconnu', () => {
    expect(urgencyOf('ok', null)).toBe('later')
    expect(urgencyOf('warn', null)).toBe('later')
  })
})

describe('estimatedReplacementDate', () => {
  it('projette la date à partir du nombre de semaines', () => {
    expect(estimatedReplacementDate(new Date('2026-01-01T00:00:00Z'), 4)).toBe('2026-01-29')
  })

  it('renvoie null quand le délai est inconnu', () => {
    expect(estimatedReplacementDate(new Date('2026-01-01T00:00:00Z'), null)).toBeNull()
  })
})

describe('readinessScore', () => {
  it('applique le régime « tout va bien » avec plancher à 75', () => {
    expect(readinessScore([{ status: 'ok', wearPct: 20 }])).toBe(90) // 100 - 10
    expect(readinessScore([{ status: 'ok', wearPct: 100 }])).toBe(75) // plancher
  })

  it('applique le régime « attention » avec plancher à 60', () => {
    expect(readinessScore([{ status: 'warn', wearPct: 20 }])).toBe(82) // 100 - 18
    expect(readinessScore([{ status: 'warn', wearPct: 100 }])).toBe(60) // plancher
  })

  it('applique le régime « fin de vie » avec plancher à 30', () => {
    expect(readinessScore([{ status: 'bad', wearPct: 20 }])).toBe(74) // 100 - 26
    expect(readinessScore([{ status: 'bad', wearPct: 100 }])).toBe(30) // plancher
  })

  // Une seule pièce en fin de vie suffit à faire basculer tout le vélo : c'est
  // volontaire, on ne veut pas qu'une chaîne morte soit diluée dans une moyenne.
  it('retient le régime le plus sévère présent', () => {
    const comps = [
      { status: 'ok', wearPct: 0 },
      { status: 'ok', wearPct: 0 },
      { status: 'bad', wearPct: 90 },
    ]
    expect(readinessScore(comps)).toBe(61) // moyenne 30 → 100 - 39
  })

  it('traite une usure absente comme zéro', () => {
    expect(readinessScore([{ status: 'ok', wearPct: null }])).toBe(100)
  })

  // Choix produit assumé (arbitré le 12/08/2026) : un vélo qui vient d'être créé,
  // avant toute déclaration de composants, affiche une santé parfaite plutôt qu'un
  // score dégradé — on ne va pas accuser l'utilisateur d'un problème qu'il n'a pas.
  // Ce test existe pour qu'un futur changement soit une décision, pas un effet de bord.
  it('donne 100 à un vélo sans aucune pièce suivie (intentionnel)', () => {
    expect(readinessScore([])).toBe(100)
  })
})

describe('costPerKm', () => {
  it('divise la dépense par les kilomètres', () => {
    expect(costPerKm(300, 6000)).toBeCloseTo(0.05)
  })

  // Sans ce garde-fou, un compte neuf produirait Infinity, qui traverserait tout
  // l'affichage jusqu'à l'écran de l'utilisateur.
  it('renvoie null sans kilomètres, jamais Infinity', () => {
    expect(costPerKm(300, 0)).toBeNull()
    expect(costPerKm(0, 0)).toBeNull()
  })
})

describe('statusFromKm', () => {
  it('reproduit les seuils du trigger SQL', () => {
    expect(statusFromKm(4000, 5000)).toBe('warn') // 80 %
    expect(statusFromKm(3400, 5000)).toBe('ok')   // 68 %
    expect(statusFromKm(4500, 5000)).toBe('bad')  // 90 % pile → bad
  })

  it('reste « ok » sans durée de vie déclarée', () => {
    expect(statusFromKm(4000, 0)).toBe('ok')
  })
})

describe('wearPctOf', () => {
  it('arrondit au dixième comme la vue component_stats', () => {
    expect(wearPctOf(5000, 5250)).toBeCloseTo(95.2)
  })

  it('renvoie null sans durée de vie', () => {
    expect(wearPctOf(5000, 0)).toBeNull()
  })
})

describe('minKmExtensionFor', () => {
  // Le cas qui a motivé la fonctionnalité : chaîne à 5 000 / 5 000 km, encore
  // bonne au contrôle. +250 km ne suffisent pas à sortir du rouge (95 %), il en
  // faut 556. C'est ce chiffre que l'écran doit afficher.
  it('donne les km nécessaires pour repasser sous le seuil rouge', () => {
    expect(minKmExtensionFor(5000, 5000, WEAR_BAD_RATIO)).toBe(556)
    expect(statusFromKm(5000, 5000 + 556)).toBe('warn')
    expect(statusFromKm(5000, 5000 + 555)).toBe('bad')
  })

  it('renvoie 0 quand la pièce est déjà sous le seuil', () => {
    expect(minKmExtensionFor(3000, 5000, WEAR_BAD_RATIO)).toBe(0)
  })

  it('renvoie 0 sans durée de vie déclarée', () => {
    expect(minKmExtensionFor(3000, 0, WEAR_BAD_RATIO)).toBe(0)
  })
})

describe('extensionSuggestions', () => {
  it('propose des paliers proportionnels à la pièce', () => {
    expect(extensionSuggestions(5000)).toEqual([250, 500, 1000])
    expect(extensionSuggestions(20000)).toEqual([1000, 2000, 4000])
  })

  it('ne descend jamais sous un palier lisible', () => {
    expect(extensionSuggestions(300)).toEqual([25, 25, 50])
  })

  it('renvoie une liste vide sans durée de vie', () => {
    expect(extensionSuggestions(0)).toEqual([])
  })
})
