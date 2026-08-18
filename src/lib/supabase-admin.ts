import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase à privilèges élevés (clé de service) — contourne la RLS.
 *
 * ⚠️ NE JAMAIS IMPORTER CE MODULE DEPUIS DU CODE CLIENT. La clé de service donne
 * un accès total à la base, sans aucun filtrage par utilisateur. Elle n'est pas
 * préfixée `NEXT_PUBLIC_`, donc Next.js ne l'exposera pas au bundle, mais la règle
 * reste : usage exclusivement serveur, et le plus tard possible.
 *
 * Pourquoi cette clé existe malgré tout, alors qu'elle a été délibérément évitée
 * pour la suppression de compte : les webhooks Strava arrivent **sans session
 * utilisateur**. `auth.uid()` vaut null, donc la RLS bloque toute lecture, et il
 * n'y a aucun moyen d'identifier l'appelant autrement que par le `owner_id` du
 * payload.
 *
 * L'alternative — des fonctions `security definer` — serait pire ici : pour être
 * appelables par le webhook, elles devraient être ouvertes au rôle `anon`, et
 * n'importe qui disposant de la clé anon (publique, dans le bundle client)
 * pourrait alors purger le compte d'un tiers en devinant un identifiant d'athlète.
 *
 * Seul appelant autorisé à ce jour : `src/app/api/strava/webhook/[secret]/route.ts`.
 * Toute nouvelle utilisation doit être justifiée par la même contrainte — absence
 * de session — et pas par la commodité.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL manquante — ' +
        'client admin indisponible (nécessaire aux webhooks Strava).'
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
