import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearCache, readCache, syncCacheOwner, writeCache } from './offline-cache'

/**
 * Le périmètre des tests (cf. `vitest.config.mts`) est la logique pure. Ce module
 * n'en est pas, mais il y a une raison de l'inclure : ses modes de panne sont
 * silencieux. Une entrée corrompue, un quota atteint, un propriétaire mal comparé
 * ne lèvent aucune erreur — ils affichent les mauvaises données, ou plus rien.
 * C'est exactement le type de régression que les tests existants visent.
 *
 * L'environnement est `node` : pas de `window`. On en pose un minimal, ce qui a
 * l'avantage de rendre explicite la seule dépendance du module.
 */

function installStorage(): Map<string, string> {
  const store = new Map<string, string>()

  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size
    },
  }

  // @ts-expect-error — on construit un `window` minimal pour l'environnement node.
  globalThis.window = { localStorage }
  return store
}

describe('offline-cache', () => {
  let store: Map<string, string>

  beforeEach(() => {
    store = installStorage()
  })

  it('relit ce qui a été écrit', () => {
    writeCache('bikes', { count: 3 })
    expect(readCache<{ count: number }>('bikes')?.data).toEqual({ count: 3 })
  })

  it('horodate l’écriture', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-03T08:00:00Z'))

    writeCache('bikes', 'x')
    expect(readCache('bikes')?.at).toBe(new Date('2026-09-03T08:00:00Z').getTime())

    vi.useRealTimers()
  })

  describe('types que JSON ne connaît pas', () => {
    // Régression du 03/09/2026 : `JSON.stringify(new Map())` rend `{}` sans
    // erreur. La page vélos, qui renvoie deux `Map` et un `Set`, plantait à
    // chaque rendu après relecture — `bikeStats.get is not a function`.
    it('restitue une Map', () => {
      writeCache('stats', new Map([['velo-1', { rides: 12 }]]))

      const relu = readCache<Map<string, { rides: number }>>('stats')?.data
      expect(relu).toBeInstanceOf(Map)
      expect(relu?.get('velo-1')).toEqual({ rides: 12 })
    })

    it('restitue un Set', () => {
      writeCache('configures', new Set(['a', 'b']))

      const relu = readCache<Set<string>>('configures')?.data
      expect(relu).toBeInstanceOf(Set)
      expect(relu?.has('b')).toBe(true)
    })

    it('restitue une Date', () => {
      writeCache('derniere', new Date('2026-09-03T08:00:00.000Z'))

      const relu = readCache<Date>('derniere')?.data
      expect(relu).toBeInstanceOf(Date)
      expect(relu?.toISOString()).toBe('2026-09-03T08:00:00.000Z')
    })

    it('restitue des structures imbriquées', () => {
      // La forme réelle d'une charge d'écran : des Map dans un objet, avec des
      // valeurs qui sont elles-mêmes des structures marquées.
      writeCache('page', {
        stats: new Map([['velo-1', { lastDate: new Date('2026-08-01T00:00:00.000Z') }]]),
        ids: new Set(['velo-1']),
        total: 42,
      })

      const relu = readCache<{
        stats: Map<string, { lastDate: Date }>
        ids: Set<string>
        total: number
      }>('page')?.data

      expect(relu?.stats.get('velo-1')?.lastDate).toBeInstanceOf(Date)
      expect(relu?.ids).toBeInstanceOf(Set)
      expect(relu?.total).toBe(42)
    })
  })

  it('rend null pour une clé absente', () => {
    expect(readCache('jamais-ecrit')).toBeNull()
  })

  it('traite une entrée corrompue comme absente', () => {
    // Écriture interrompue.
    store.set('bi:cache:v2:bikes', '{"at":')
    expect(readCache('bikes')).toBeNull()
  })

  it('traite comme absente une entrée valide en JSON mais pas dans notre format', () => {
    store.set('bi:cache:v2:bikes', '{"autre":1}')
    expect(readCache('bikes')).toBeNull()
  })

  it('ignore une entrée écrite par un format antérieur', () => {
    // La v1 écrivait les Map comme `{}`. Relire ces entrées ferait planter les
    // écrans ; le numéro de version les rend simplement introuvables.
    store.set('bi:cache:bikes', JSON.stringify({ at: Date.now(), data: { stats: {} } }))
    expect(readCache('bikes')).toBeNull()
  })

  it('purge aussi les entrées des formats antérieurs', () => {
    store.set('bi:cache:bikes', 'ancienne')
    writeCache('dashboard', 'nouvelle')

    clearCache()

    expect(store.has('bi:cache:bikes')).toBe(false)
    expect(readCache('dashboard')).toBeNull()
  })

  it('ne fait pas échouer l’app quand le quota est atteint', () => {
    // On remplace l'écriture par une qui lève, comme le ferait un quota dépassé
    // ou le mode privé de certains navigateurs.
    globalThis.window.localStorage.setItem = () => {
      throw new Error('QuotaExceededError')
    }

    expect(() => writeCache('bikes', 'x')).not.toThrow()
  })

  it('ne purge que ses propres clés', () => {
    writeCache('bikes', 'a')
    writeCache('dashboard', 'b')
    store.set('sb-auth-token', 'session-supabase')
    store.set('bi:theme', 'sombre')
    store.set('bi:cache-owner', 'user-a')

    clearCache()

    expect(readCache('bikes')).toBeNull()
    expect(readCache('dashboard')).toBeNull()
    expect(store.get('sb-auth-token')).toBe('session-supabase')
    expect(store.get('bi:theme')).toBe('sombre')
    // Le propriétaire vit hors du préfixe balayé, exprès : il doit survivre à la
    // purge pour être réécrit ensuite par `syncCacheOwner`.
    expect(store.get('bi:cache-owner')).toBe('user-a')
  })

  describe('syncCacheOwner', () => {
    it('ne purge pas quand le propriétaire est inchangé', () => {
      syncCacheOwner('user-a')
      writeCache('bikes', 'a')

      // Cas du rafraîchissement périodique du jeton : même utilisateur.
      expect(syncCacheOwner('user-a')).toBe(false)
      expect(readCache('bikes')?.data).toBe('a')
    })

    it('purge au changement d’utilisateur', () => {
      syncCacheOwner('user-a')
      writeCache('bikes', 'velos-de-a')

      expect(syncCacheOwner('user-b')).toBe(true)
      expect(readCache('bikes')).toBeNull()
    })

    it('purge à la déconnexion', () => {
      syncCacheOwner('user-a')
      writeCache('bikes', 'a')

      expect(syncCacheOwner(null)).toBe(true)
      expect(readCache('bikes')).toBeNull()
    })

    it('purge un cache orphelin au démarrage suivant', () => {
      // Le scénario que la seule mémoire vive manquerait : l'app est tuée entre la
      // déconnexion et sa purge, puis rouverte sur un autre compte. Le propriétaire
      // persisté est le seul témoin du changement.
      syncCacheOwner('user-a')
      writeCache('bikes', 'velos-de-a')

      // Redémarrage : nouvelle exécution, aucun état en mémoire, même stockage.
      expect(syncCacheOwner('user-b')).toBe(true)
      expect(readCache('bikes')).toBeNull()
    })
  })
})
