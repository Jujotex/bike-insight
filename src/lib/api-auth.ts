import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import { createSupabaseServerClient } from './supabase-server'

/**
 * Authentification des routes API, pour le web **et** pour l'app native.
 *
 * Le web s'authentifie par cookie : le navigateur les envoie automatiquement,
 * `@supabase/ssr` les lit. L'app native ne le peut pas — l'origine d'une WebView
 * Capacitor (`capacitor://localhost`) diffère de celle du backend, l'appel est
 * cross-origin et les cookies ne suivent pas. Elle envoie donc le jeton d'accès
 * en en-tête `Authorization: Bearer`, ce que produit `apiFetch` (`lib/api.ts`).
 *
 * ⚠️ **Le jeton n'est pas cru sur parole.** Il est passé à Supabase, qui vérifie
 * sa signature et son expiration côté serveur. Un jeton forgé ou périmé donne
 * `null`. C'est la même garantie qu'avec un cookie — seul le transport change.
 *
 * Le client renvoyé porte l'identité de l'utilisateur, donc **la RLS s'applique
 * normalement**. Ce n'est en aucun cas un contournement : rien à voir avec le
 * client admin de `supabase-admin.ts`, réservé aux webhooks.
 */
export async function getApiUser(
  request: Request
): Promise<{ user: User; supabase: SupabaseClient } | null> {
  // Chemin natif : jeton en en-tête.
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (bearer) {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    )
    const {
      data: { user },
    } = await client.auth.getUser()
    if (user) return { user, supabase: client }
    // Jeton invalide ou expiré : on retombe sur le cookie plutôt que d'échouer,
    // au cas où les deux seraient présents (web avec en-tête redondant).
  }

  // Chemin web : cookie de session.
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user ? { user, supabase } : null
}
