'use client'

import { useEffect, useState } from 'react'
import { readCache, writeCache } from './offline-cache'

/**
 * Délai au-delà duquel on considère le serveur injoignable, quand une copie
 * locale existe.
 *
 * Sans réseau, une requête vers un hôte distant n'échoue pas : elle **reste
 * suspendue**. Le système attend une réponse qui ne viendra pas, parfois plus
 * d'une minute. Se contenter d'attraper les erreurs laissait donc l'écran
 * afficher les données du cache sans jamais les dater — précisément l'affichage
 * périmé d'apparence fraîche que le bandeau doit empêcher.
 *
 * Huit secondes : assez pour ne pas déclencher sur une connexion lente, assez
 * court pour ne pas laisser quelqu'un devant un écran figé. Ce n'est pas un
 * abandon — la requête continue, et l'écran se met à jour si elle finit par
 * aboutir.
 */
const UNREACHABLE_AFTER_MS = 8_000

/**
 * Chargement de données côté client, avec état de chargement, d'erreur et cache
 * hors-ligne facultatif.
 *
 * Écrit pour la migration des pages de Server Components vers composants clients
 * (phase 2.1) : le motif se répète sur une quinzaine d'écrans, autant qu'il soit
 * écrit une fois et correctement.
 *
 * Deux pièges qu'il évite, et qui sont la raison d'être de ce fichier :
 *
 * 1. **Réponse périmée.** Changer de vélo dans le sélecteur relance un chargement
 *    pendant que le précédent est encore en vol. Sans garde, la première réponse
 *    peut arriver après la seconde et écraser l'affichage avec les données du
 *    mauvais vélo. Le drapeau `cancelled` l'empêche.
 *
 * 2. **`data` remis à null pendant un rechargement.** On garde les anciennes
 *    données visibles tant que les nouvelles n'arrivent pas : l'écran ne clignote
 *    pas entre deux sélections.
 *
 * `deps` fonctionne comme pour `useEffect` : y mettre tout ce dont `load` dépend.
 *
 * ## Le cache hors-ligne (phase 2.3)
 *
 * Passer une `cacheKey` active la consultation sans réseau : la dernière réponse
 * est conservée, réaffichée immédiatement au retour sur l'écran, puis rafraîchie
 * en arrière-plan. Si le rafraîchissement échoue, l'affichage **reste** sur la
 * donnée conservée et `cachedAt` en porte la date, à charge pour la page de le
 * signaler. Le hook branché sans `cacheKey` se comporte exactement comme avant.
 *
 * Trois signaux font basculer l'écran en mode hors-ligne : une requête rejetée,
 * un système qui se déclare déconnecté, ou une réponse qui n'arrive pas dans le
 * délai imparti. Le troisième est le plus important en pratique — voir
 * `UNREACHABLE_AFTER_MS`.
 *
 * **Un échec réseau avec cache disponible ne produit donc pas d'erreur.** C'est
 * délibéré : afficher « chargement impossible » au-dessus de données parfaitement
 * lisibles serait faux. `error` reste réservé au cas où il n'y a rien à montrer.
 *
 * La clé doit inclure les paramètres dont dépend la réponse — `bike:${id}` et non
 * `bike` — sinon deux vélos partageraient une même entrée et l'un afficherait les
 * pièces de l'autre.
 */
export function useAsyncData<T>(
  load: () => Promise<T>,
  deps: unknown[],
  cacheKey?: string
): { data: T | null; loading: boolean; error: string | null; cachedAt: Date | null } {
  // Initialisation paresseuse : la lecture du cache a lieu avant le premier
  // rendu, pas après. C'est ce qui évite de voir le squelette de chargement
  // clignoter alors que la donnée était déjà disponible localement.
  const [data, setData] = useState<T | null>(() => {
    if (!cacheKey) return null
    return readCache<T>(cacheKey)?.data ?? null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cachedAt, setCachedAt] = useState<Date | null>(null)

  // Incrémenté au retour du réseau, pour relancer le chargement. Sans cela,
  // sortir d'un parking souterrain laisserait l'écran sur ses données datées
  // jusqu'à ce que l'utilisateur pense à recharger lui-même.
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const onOnline = () => setRetry(n => n + 1)
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    // La clé change en même temps que les dépendances (autre vélo, autre pièce).
    // On repart donc de l'entrée correspondante plutôt que de laisser à l'écran
    // celle du sujet précédent, qui serait trompeuse et non plus seulement vieille.
    const cached = cacheKey ? readCache<T>(cacheKey) : null
    if (cached) setData(cached.data)

    /** Bascule l'écran en consultation hors-ligne, datée. */
    const showCached = (entry: NonNullable<typeof cached>) => {
      setCachedAt(new Date(entry.at))
      setLoading(false)
    }

    // Le système sait déjà qu'il n'y a pas de réseau : inutile de faire patienter
    // huit secondes pour l'apprendre.
    if (cached && typeof navigator !== 'undefined' && navigator.onLine === false) {
      showCached(cached)
    }

    // Filet pour le cas inverse — le navigateur se croit connecté, mais le serveur
    // ne répond pas : portail captif, Wi-Fi sans sortie, panne côté Supabase.
    const timer = cached
      ? setTimeout(() => {
          if (!cancelled) showCached(cached)
        }, UNREACHABLE_AFTER_MS)
      : undefined

    load()
      .then(result => {
        if (cancelled) return
        setData(result)
        // La requête a fini par aboutir, même après le délai : l'écran repasse en
        // données fraîches et le bandeau disparaît.
        setCachedAt(null)
        if (cacheKey) writeCache(cacheKey, result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.error('[useAsyncData]', err)

        if (cached) {
          // Réseau absent mais donnée conservée : on bascule en mode consultation
          // hors-ligne au lieu de signaler une panne.
          setCachedAt(new Date(cached.at))
          return
        }
        setError(err instanceof Error ? err.message : 'Chargement impossible')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // `load` est recréée à chaque rendu : c'est `deps` qui fait foi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, cacheKey, retry])

  return { data, loading, error, cachedAt }
}
