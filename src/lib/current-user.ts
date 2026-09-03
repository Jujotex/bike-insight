'use client'

import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

/**
 * Identifiant de l'utilisateur courant, lu **sans appel réseau**.
 *
 * ## Pourquoi ne pas utiliser `auth.getUser()`
 *
 * `getUser()` interroge Supabase pour valider le jeton. C'est le bon choix côté
 * serveur, où le jeton vient du client et ne mérite aucune confiance. Côté
 * navigateur, c'est inutile — le client n'est pas une frontière de sécurité, et
 * c'est la RLS qui décide réellement de ce qui est lisible.
 *
 * Surtout, cet aller-retour **casse le mode hors-ligne** : sans réseau,
 * `getUser()` rend `user: null`, indistinguable d'une déconnexion. Les écrans
 * redirigeaient alors vers la page de connexion avant même que le cache ait pu
 * servir à quelque chose, et l'utilisateur se retrouvait déconnecté en apparence
 * pour être simplement entré dans un parking souterrain.
 *
 * `getSession()` lit le stockage local. Elle tente un rafraîchissement si le
 * jeton a expiré — une heure de validité — d'où la distinction ci-dessous.
 *
 * @returns l'identifiant, ou `null` si l'utilisateur n'est pas connecté.
 * @throws si l'absence de session s'explique par l'absence de réseau. L'appelant
 *   doit laisser remonter : `useAsyncData` bascule alors sur le cache plutôt que
 *   de rediriger, ce qui est le comportement voulu.
 */
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.user) return session.user

  // Pas de session. Deux causes très différentes, qu'il serait fâcheux de
  // confondre : réellement déconnecté, ou jeton expiré qu'on n'a pas pu
  // rafraîchir faute de réseau. Seule la première justifie une redirection.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('Hors ligne')
  }

  return null
}

/**
 * Raccourci pour le cas courant : seul l'identifiant sert, à passer aux requêtes.
 * Mêmes garanties et mêmes conditions d'échec que `getCurrentUser`.
 */
export async function getCurrentUserId(): Promise<string | null> {
  return (await getCurrentUser())?.id ?? null
}
