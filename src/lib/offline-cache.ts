'use client'

/**
 * Cache de consultation hors-ligne.
 *
 * Le besoin est concret : on regarde l'usure de ses pièces dans un garage ou un
 * sous-sol, là où le réseau manque. C'est aussi l'un des deux arguments qui
 * distinguent l'app d'un site web emballé, face à la guideline 4.2 d'Apple.
 *
 * **Portée délibérément étroite.** On conserve la dernière réponse de chaque
 * écran, et on la réaffiche quand le réseau fait défaut, datée. Pas de
 * synchronisation bidirectionnelle, pas de file d'écritures en attente : sans
 * réseau, l'app est en lecture seule. Une synchronisation différée demanderait la
 * résolution de conflits, soit un ordre de grandeur de complexité au-dessus, pour
 * un bénéfice que personne n'a demandé.
 *
 * **Pourquoi `localStorage` et non `@capacitor/preferences`.** Preferences est
 * asynchrone, ce qui interdirait d'afficher la donnée dès le premier rendu : on
 * verrait le squelette de chargement avant le contenu, exactement ce qu'on
 * cherche à éviter. `localStorage` est synchrone et fonctionne dans la WebView.
 * Son défaut connu — le système peut l'effacer sous pression de stockage — est
 * sans gravité ici : perdre un cache fait retomber sur le réseau. C'est
 * précisément pour ce défaut que la session d'authentification, elle, utilise
 * Preferences : la perdre déconnecterait l'utilisateur.
 */

/**
 * Préfixe de balayage, commun à toutes les versions du format. C'est lui que la
 * purge utilise, pour emporter aussi les entrées d'un format antérieur.
 */
const SCAN_PREFIX = 'bi:cache:'

/**
 * Préfixe d'écriture, versionné.
 *
 * Le numéro est le moyen d'invalider un format devenu incompatible : les entrées
 * de la version précédente cessent simplement d'être trouvées, et sont réécrites
 * au premier chargement en ligne. Sans lui, corriger la sérialisation ne
 * suffirait pas — les entrées déjà en place sur les appareils resteraient
 * illisibles, et continueraient de faire planter les écrans concernés.
 *
 * **v2** (03/09/2026) : prise en charge des `Map`, `Set` et `Date`, que la v1
 * réduisait silencieusement à des objets vides.
 */
const PREFIX = 'bi:cache:v2:'

/**
 * Propriétaire du cache. Volontairement hors du préfixe ci-dessus, pour survivre
 * à `clearCache()` et être réécrit ensuite.
 */
const OWNER_KEY = 'bi:cache-owner'

interface Entry<T> {
  /** Horodatage de l'écriture, en millisecondes. */
  at: number
  data: T
}

/**
 * ## Sérialisation des types que JSON ne connaît pas
 *
 * `JSON.stringify(new Map([['a', 1]]))` rend `{}`. Sans bruit, sans erreur : la
 * donnée disparaît et n'est retrouvée qu'au moment où l'écran appelle `.get()`
 * sur un objet nu, à chaque rendu. Or plusieurs écrans renvoient des `Map` — les
 * statistiques par vélo, les compteurs d'état — parce que c'est la bonne
 * structure pour une recherche par identifiant.
 *
 * On marque donc ces valeurs à l'écriture et on les reconstruit à la lecture.
 * Les `Date` subissent le même sort en JSON (elles deviennent des chaînes), avec
 * un mode de panne identique : `.getTime is not a function`, à l'exécution, sur
 * un seul écran, uniquement hors ligne. Trois lignes de plus valent mieux que
 * cette enquête-là.
 *
 * Le marqueur `__bi` est choisi assez spécifique pour qu'aucune donnée métier ne
 * le porte par accident.
 */
type Tagged = { __bi: 'Map' | 'Set' | 'Date'; v: unknown }

function isTagged(value: unknown): value is Tagged {
  return typeof value === 'object' && value !== null && '__bi' in value
}

/**
 * `function` et non fléchée : `this` doit désigner l'objet contenant, seul moyen
 * d'atteindre la valeur **avant** que `JSON.stringify` n'ait appelé son `toJSON`.
 * Sans cela une `Date` serait déjà devenue une chaîne, indiscernable des autres.
 */
function replacer(this: Record<string, unknown>, key: string, value: unknown): unknown {
  const raw = this[key]

  if (raw instanceof Map) return { __bi: 'Map', v: [...raw] } satisfies Tagged
  if (raw instanceof Set) return { __bi: 'Set', v: [...raw] } satisfies Tagged
  if (raw instanceof Date) return { __bi: 'Date', v: raw.toISOString() } satisfies Tagged

  return value
}

function reviver(_key: string, value: unknown): unknown {
  if (!isTagged(value)) return value

  switch (value.__bi) {
    case 'Map':
      return new Map(value.v as [unknown, unknown][])
    case 'Set':
      return new Set(value.v as unknown[])
    case 'Date':
      return new Date(value.v as string)
    default:
      return value
  }
}

/**
 * Lit une entrée, ou `null` si absente, illisible ou corrompue.
 *
 * Toute anomalie est traitée comme une absence : un cache est par nature
 * facultatif, et le faire échouer bruyamment transformerait un confort en panne.
 */
export function readCache<T>(key: string): Entry<T> | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (!raw) return null

    const parsed = JSON.parse(raw, reviver) as Entry<T>
    // Une entrée d'une version antérieure du format, ou tronquée par une écriture
    // interrompue, peut être syntaxiquement valide sans être exploitable.
    if (typeof parsed?.at !== 'number' || !('data' in parsed)) return null

    return parsed
  } catch {
    return null
  }
}

/**
 * Écrit une entrée. Silencieux en cas d'échec.
 *
 * Le quota de `localStorage` (environ 5 Mo) peut être atteint, et le mode privé
 * de certains navigateurs fait lever l'écriture. Dans les deux cas l'app doit
 * continuer : on perd le hors-ligne sur cet écran, rien de plus. Purger tout le
 * cache pour faire de la place serait pire — on sacrifierait des écrans qui
 * fonctionnent pour en sauver un.
 */
export function writeCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return

  try {
    const entry: Entry<T> = { at: Date.now(), data }
    window.localStorage.setItem(PREFIX + key, JSON.stringify(entry, replacer))
  } catch {
    // Quota dépassé, stockage indisponible, donnée non sérialisable.
  }
}

/**
 * Vide le cache applicatif, sans toucher au reste du stockage.
 *
 * Appelé au changement de compte : sans cela, un second utilisateur sur le même
 * appareil verrait fugitivement les vélos du précédent, le temps que le réseau
 * réponde. Le préfixe garantit qu'on ne supprime que nos propres clés — la
 * session Supabase et les préférences d'affichage vivent à côté.
 */
export function clearCache(): void {
  if (typeof window === 'undefined') return

  try {
    // On collecte avant de supprimer : retirer une clé pendant l'itération
    // décale les index et en laisserait passer une sur deux.
    const keys: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k?.startsWith(SCAN_PREFIX)) keys.push(k)
    }
    keys.forEach(k => window.localStorage.removeItem(k))
  } catch {
    // Stockage indisponible : il n'y a alors rien à purger.
  }
}

/**
 * Rattache le cache à un utilisateur, en le purgeant s'il appartenait à un autre.
 *
 * Appelée à chaque événement d'authentification. Comparer un propriétaire
 * **persisté** plutôt qu'une variable en mémoire couvre le cas qu'une variable
 * manquerait : l'app tuée entre une déconnexion et sa purge, puis rouverte sur un
 * autre compte. En mémoire, le programme redémarre sans passé et ne voit pas le
 * changement ; sur disque, l'ancien propriétaire est toujours là pour le trahir.
 *
 * Passer `null` (déconnexion) purge également : laisser des données en clair sur
 * l'appareil après une déconnexion serait le contraire de ce qu'elle promet.
 *
 * @returns `true` si une purge a eu lieu.
 */
export function syncCacheOwner(userId: string | null): boolean {
  if (typeof window === 'undefined') return false

  try {
    const previous = window.localStorage.getItem(OWNER_KEY)
    if (previous === userId) return false

    clearCache()

    if (userId) window.localStorage.setItem(OWNER_KEY, userId)
    else window.localStorage.removeItem(OWNER_KEY)

    return true
  } catch {
    return false
  }
}
