'use client'

import { supabase } from './supabase'

/**
 * Appels aux routes API, depuis le web comme depuis l'app native.
 *
 * Deux problèmes que le `fetch("/api/…")` d'origine ne pouvait pas résoudre une
 * fois l'interface embarquée dans un binaire Capacitor :
 *
 * **1. L'URL relative ne pointe plus vers le serveur.** Dans une WebView, la page
 * est servie depuis le système de fichiers local : `/api/strava/import` chercherait
 * un fichier sur l'appareil. `NEXT_PUBLIC_API_BASE_URL` préfixe donc les appels par
 * l'adresse du backend. Vide sur le web — l'URL reste relative, rien ne change.
 *
 * **2. Les cookies ne partent pas.** L'origine d'une WebView Capacitor
 * (`capacitor://localhost`) est différente de celle du backend : l'appel est
 * cross-origin, et les cookies de session ne suivent pas. On envoie donc le jeton
 * Supabase en en-tête `Authorization`, ce que les routes API doivent accepter en
 * plus du cookie.
 *
 * Sur le web, les deux mécanismes coexistent sans se gêner : le cookie part comme
 * avant, l'en-tête est simplement redondant.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

/** Préfixe un chemin d'API par l'adresse du backend, si elle est définie. */
export function apiUrl(path: string): string {
  return API_BASE + path
}

/**
 * `fetch` vers une route API, avec le jeton de session en en-tête.
 *
 * Récupère la session à chaque appel plutôt que de la mémoriser : le jeton
 * Supabase expire au bout d'une heure et `getSession` le rafraîchit au besoin.
 * Un jeton mis en cache produirait des 401 aléatoires après une heure d'usage.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers = new Headers(init?.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
    // Conserve l'envoi du cookie sur le web, où l'origine est la même.
    credentials: 'include',
  })
}
