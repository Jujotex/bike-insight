import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

/**
 * Chiffrement des tokens Strava stockés en base.
 *
 * Pourquoi : `profiles.strava_access_token` / `strava_refresh_token` étaient en clair.
 * Un token Strava donne accès aux données personnelles d'un athlète — l'accord API
 * (art. 6) et l'API Policy (§8.1) imposent des mesures « commercially reasonable and
 * appropriate », et le RGPD des mesures adaptées au risque.
 *
 * Choix : chiffrement **applicatif** (AES-256-GCM via le module `crypto` de Node,
 * aucune dépendance nouvelle) plutôt que pgcrypto ou Supabase Vault. La raison est le
 * modèle de menace : la clé vit dans une variable d'environnement, donc **hors de la
 * base**. Une fuite de dump, une policy RLS trop permissive ou une lecture via le
 * dashboard ne donnent plus rien d'exploitable. Avec pgcrypto, la clé serait à côté
 * des données ; avec Vault, il faudrait passer par des fonctions `security definer`
 * et réécrire les chemins de lecture existants.
 *
 * GCM (et non CBC) parce qu'il est authentifié : une valeur altérée en base est
 * détectée au déchiffrement au lieu de produire une sortie silencieusement fausse.
 *
 * Format stocké : `v1:<iv>:<tag>:<chiffré>`, chaque partie en base64. Le préfixe de
 * version permettra une rotation d'algorithme sans deviner le format. Le base64
 * n'utilise jamais `:`, le découpage est donc sûr.
 *
 * ⚠️ Perte de la clé = tokens irrécupérables. Ce n'est pas dramatique — les
 * utilisateurs reconnectent leur compte Strava en trois clics — mais la clé doit être
 * sauvegardée hors de Vercel (gestionnaire de mots de passe).
 *
 * Génération de la clé :
 *   openssl rand -base64 32
 */

const PREFIX = 'v1'
const ALGO = 'aes-256-gcm'
const IV_BYTES = 12 // recommandé pour GCM
const KEY_BYTES = 32 // AES-256

function getKey(): Buffer {
  const raw = process.env.STRAVA_TOKEN_ENC_KEY
  if (!raw) {
    throw new Error(
      'STRAVA_TOKEN_ENC_KEY manquante — impossible de chiffrer les tokens Strava. ' +
        'Générer une clé avec `openssl rand -base64 32` et la définir sur Vercel et dans .env.local.'
    )
  }
  const key = Buffer.from(raw, 'base64')
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `STRAVA_TOKEN_ENC_KEY invalide : ${key.length} octets décodés, ${KEY_BYTES} attendus (base64 de 32 octets).`
    )
  }
  return key
}

/** Chiffre un token avant écriture en base. Lève si la clé est absente ou invalide —
 *  il ne faut jamais retomber silencieusement sur du stockage en clair. */
export function encryptToken(plain: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [PREFIX, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':')
}

/**
 * Déchiffre un token lu en base.
 *
 * Tolère les valeurs **en clair héritées** (celles écrites avant ce changement) : elles
 * sont renvoyées telles quelles et seront chiffrées à la prochaine écriture — c'est-à-dire
 * au premier refresh de token, donc sous quelques heures. Migration auto-cicatrisante,
 * sans reconnexion imposée aux utilisateurs déjà branchés.
 *
 * À supprimer une fois qu'aucune valeur en clair ne subsiste (requête de contrôle dans
 * le changelog).
 */
export function decryptToken(stored: string | null | undefined): string | null {
  if (!stored) return null
  if (!stored.startsWith(`${PREFIX}:`)) return stored

  const parts = stored.split(':')
  if (parts.length !== 4) {
    throw new Error('Token chiffré malformé (nombre de segments inattendu).')
  }
  const [, ivB64, tagB64, ctB64] = parts

  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

/** Vrai si la valeur stockée est encore en clair — utile pour un contrôle de migration. */
export function isEncrypted(stored: string | null | undefined): boolean {
  return !!stored && stored.startsWith(`${PREFIX}:`)
}
