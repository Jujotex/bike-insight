import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from './supabase-server'
import { decryptToken, encryptToken } from './token-crypto'

export interface StravaTokens {
  access_token: string
  refresh_token: string
  expires_at: number
}

/**
 * Pourquoi l'obtention d'un token a échoué.
 *
 * Ces quatre cas appelaient auparavant tous le même message — « reconnecte ton
 * compte Strava ». Deux d'entre eux le méritent, les deux autres non : lors d'un
 * incident de l'API Strava ou d'une erreur de configuration, on envoyait
 * l'utilisateur refaire une connexion qui ne pouvait rien résoudre, et qui
 * échouerait de la même manière.
 */
export type StravaTokenFailure =
  /** Aucun compte Strava lié. L'utilisateur doit en connecter un. */
  | 'not-linked'
  /** Compte lié mais refresh token absent : la reconnexion est la seule issue. */
  | 'no-refresh-token'
  /** Strava a refusé le rafraîchissement — autorisation révoquée de leur côté. */
  | 'refresh-rejected'
  /** Strava injoignable, ou configuration serveur incomplète. Rien à faire côté
   *  utilisateur : réessayer plus tard. */
  | 'strava-unavailable'

export class StravaTokenError extends Error {
  constructor(readonly reason: StravaTokenFailure, message: string) {
    super(message)
    this.name = 'StravaTokenError'
  }
}

/**
 * Rafraîchit le token Strava si expiré, retourne un access_token valide.
 *
 * `client` permet d'injecter un client Supabase : les webhooks Strava n'ont pas de
 * session utilisateur et doivent passer le client admin, sans quoi la RLS bloque la
 * lecture de `profiles`. Par défaut, client serveur classique lié à la session.
 *
 * @returns le token, ou `null` si aucun compte Strava n'est lié.
 * @throws {StravaTokenError} quand un compte est lié mais que le token n'a pas pu
 *   être obtenu. L'appelant peut alors distinguer « reconnecte-toi » de
 *   « réessaie plus tard » — voir `StravaTokenFailure`.
 */
export async function getValidStravaToken(
  userId: string,
  client?: SupabaseClient
): Promise<string | null> {
  const supabase = client ?? (await createSupabaseServerClient())

  const { data: profile } = await supabase
    .from('profiles')
    .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
    .eq('id', userId)
    .single()

  // Pas de compte lié : ce n'est pas une panne, c'est un état normal.
  if (!profile?.strava_access_token) return null

  // Les tokens sont chiffrés en base (cf. token-crypto.ts). Les valeurs en clair
  // héritées sont tolérées en lecture et réécrites chiffrées au premier refresh.
  const accessToken = decryptToken(profile.strava_access_token)
  const refreshToken = decryptToken(profile.strava_refresh_token)

  const nowInSeconds = Math.floor(Date.now() / 1000)
  const isExpired = profile.strava_token_expires_at
    ? nowInSeconds >= profile.strava_token_expires_at - 300 // 5 min de marge
    : true

  if (!isExpired) return accessToken

  if (!refreshToken) {
    throw new StravaTokenError(
      'no-refresh-token',
      'Token expiré et aucun refresh token en base : reconnexion nécessaire.'
    )
  }

  // Sans identifiants d'application, la requête partirait avec `client_id:
  // undefined` et Strava répondrait 400 — indiscernable d'une autorisation
  // révoquée. C'est exactement ce qui s'est produit en développement le
  // 03/09/2026 : l'interface annonçait un token expiré alors qu'il ne manquait
  // que deux variables d'environnement.
  if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
    throw new StravaTokenError(
      'strava-unavailable',
      'STRAVA_CLIENT_ID ou STRAVA_CLIENT_SECRET absent de l’environnement.'
    )
  }

  // Refresh le token
  let res: Response
  try {
    res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })
  } catch (err) {
    throw new StravaTokenError(
      'strava-unavailable',
      `Strava injoignable : ${err instanceof Error ? err.message : String(err)}`
    )
  }

  if (!res.ok) {
    // 400 et 401 signifient que Strava refuse ce refresh token — typiquement une
    // autorisation révoquée depuis leurs réglages. Là, se reconnecter résout
    // vraiment. Un 5xx est une panne de leur côté : insister demain suffira.
    const reason: StravaTokenFailure = res.status >= 500 ? 'strava-unavailable' : 'refresh-rejected'
    throw new StravaTokenError(reason, `Rafraîchissement refusé par Strava (HTTP ${res.status}).`)
  }

  const tokens: StravaTokens = await res.json()

  await supabase
    .from('profiles')
    .update({
      strava_access_token: encryptToken(tokens.access_token),
      strava_refresh_token: encryptToken(tokens.refresh_token),
      strava_token_expires_at: tokens.expires_at,
    })
    .eq('id', userId)

  return tokens.access_token
}
