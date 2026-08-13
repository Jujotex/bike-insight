import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { decryptToken } from '@/lib/token-crypto'

/**
 * Suppression définitive du compte de l'utilisateur courant.
 *
 * Exigences couvertes :
 *   • Apple : la suppression doit être déclenchable dans l'app (ferme depuis 2022).
 *   • API Policy Strava §7.4 : suppression de toutes les données Strava sur demande.
 *   • API Policy Strava §2.5 : confirmation écrite de la suppression (voir la note
 *     en fin de fichier — l'envoi par email reste à brancher).
 *
 * L'effacement lui-même passe par la fonction Postgres `delete_own_account()`
 * (migration 20260812000002) : elle s'appuie sur `auth.uid()`, donc un utilisateur
 * ne peut supprimer que son propre compte, et l'application n'a pas besoin d'une
 * clé de service.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // ── 1. Révoquer l'accès chez Strava, avant de perdre le token ──
  //
  // Supprimer nos copies ne suffit pas : tant que l'autorisation vit chez Strava,
  // l'app garde un accès qu'elle n'a plus lieu d'avoir. Best effort — un token
  // expiré fait échouer l'appel, ce qui ne doit pas bloquer la suppression. Le
  // cas échéant, l'utilisateur peut révoquer depuis ses réglages Strava (lien
  // fourni dans la page Compte).
  const { data: profile } = await supabase
    .from('profiles')
    .select('strava_access_token')
    .eq('id', user.id)
    .single()

  // Tolère les valeurs en clair héritées (cf. lib/token-crypto.ts). Un token illisible
  // ne doit pas empêcher la suppression : on laisse passer et l'utilisateur pourra
  // révoquer manuellement depuis ses réglages Strava.
  let stravaToken: string | null = null
  try {
    stravaToken = decryptToken(profile?.strava_access_token as string | null)
  } catch (err) {
    console.error('[account/delete] token Strava illisible, deautorisation ignoree:', err)
  }

  if (stravaToken) {
    try {
      const res = await fetch('https://www.strava.com/oauth/deauthorize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${stravaToken}` },
      })
      if (!res.ok) {
        console.error('[account/delete] déautorisation Strava refusée:', res.status)
      }
    } catch (err) {
      console.error('[account/delete] déautorisation Strava injoignable:', err)
    }
  }

  // ── 2. Suppression en cascade depuis auth.users ────────────────
  const { error } = await supabase.rpc('delete_own_account')
  if (error) {
    console.error('[account/delete] échec de la suppression:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── 3. Nettoyer la session locale ──────────────────────────────
  //
  // Scope « local » : le compte n'existe plus côté Supabase, un signOut global
  // échouerait. On se contente d'effacer les cookies de session.
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch (err) {
    console.error('[account/delete] signOut post-suppression:', err)
  }

  // ⚠️ RESTE À FAIRE (API Policy §2.5) : envoyer à l'utilisateur une confirmation
  // écrite de la suppression. L'écran de confirmation affiché par le client est un
  // premier niveau, mais un email est plus solide — à brancher quand un fournisseur
  // d'envoi sera en place (l'adresse est encore connue à ce stade : user.email).
  return NextResponse.json({ ok: true })
}
