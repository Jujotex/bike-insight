'use client'

import { useEffect, useState } from 'react'

/**
 * Chargement de données côté client, avec état de chargement et d'erreur.
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
 */
export function useAsyncData<T>(
  load: () => Promise<T>,
  deps: unknown[]
): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    load()
      .then(result => {
        if (cancelled) return
        setData(result)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.error('[useAsyncData]', err)
        setError(err instanceof Error ? err.message : 'Chargement impossible')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // `load` est recréée à chaque rendu : c'est `deps` qui fait foi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
