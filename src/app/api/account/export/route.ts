import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/api-auth'
import { assertNoError } from '@/lib/supabase-result'

/**
 * Export des données personnelles de l'utilisateur courant, en JSON.
 *
 * Couvre le **droit à la portabilité** (RGPD art. 20), qui exige un format
 * « structuré, couramment utilisé et lisible par machine » — JSON les remplit
 * tous les trois. Également attendu par l'API Policy Strava §2.2, qui demande
 * que l'utilisateur puisse récupérer les données le concernant.
 *
 * ## Ce qui est délibérément exclu
 *
 * **Les jetons Strava.** Les exporter mettrait un identifiant d'accès **vivant**
 * dans un fichier que l'utilisateur va télécharger, garder dans ses
 * téléchargements et parfois transférer par courriel. Ce sont des données
 * techniques d'authentification, pas des données qu'il a fournies ou produites :
 * la portabilité ne les couvre pas, et les inclure créerait un risque réel pour
 * un bénéfice nul. Les colonnes sont donc énumérées une à une plutôt que
 * sélectionnées par `*`, pour qu'aucun ajout futur de colonne sensible ne se
 * retrouve exporté par inadvertance.
 *
 * **Les vues agrégées** (`bike_stats`, `component_stats`, `activity_bike_stats`)
 * sont également absentes : elles sont calculées à partir des tables ci-dessous
 * et n'apportent aucune information nouvelle.
 */
export async function GET(request: Request) {
  // Cookie (web) ou jeton en en-tête (app native) — cf. `lib/api-auth.ts`.
  const auth = await getApiUser(request)
  if (!auth) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  const { user, supabase } = auth

  const results = await Promise.all([
    // Colonnes énumérées : voir la note sur les jetons ci-dessus.
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, strava_athlete_id, last_sync_at, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('bikes').select('*').eq('user_id', user.id),
    supabase.from('components').select('*').eq('user_id', user.id),
    supabase.from('maintenance_types').select('*').eq('user_id', user.id),
    supabase.from('maintenance_logs').select('*').eq('user_id', user.id),
    supabase.from('activities').select('*').eq('user_id', user.id),
    supabase.from('notification_settings').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('notifications').select('*').eq('user_id', user.id),
  ])

  assertNoError(results, 'account/export')

  const [
    { data: profile },
    { data: bikes },
    { data: components },
    { data: maintenanceTypes },
    { data: maintenanceLogs },
    { data: activities },
    { data: notificationSettings },
    { data: notifications },
  ] = results

  const donnees = {
    // En-tête d'export : sans lui, un fichier retrouvé six mois plus tard ne dit
    // ni de quand il date, ni de quelle application il vient.
    export: {
      genere_le: new Date().toISOString(),
      application: 'Bike Insight',
      format: 1,
      compte: { id: user.id, email: user.email },
      note:
        "Les jetons d'accès Strava sont volontairement absents de cet export : " +
        "ce sont des identifiants d'authentification, pas des données personnelles, " +
        'et les faire circuler dans un fichier présenterait un risque inutile.',
    },
    profil: profile,
    velos: bikes ?? [],
    pieces: components ?? [],
    types_entretien: maintenanceTypes ?? [],
    journaux_entretien: maintenanceLogs ?? [],
    sorties: activities ?? [],
    reglages_notifications: notificationSettings,
    notifications: notifications ?? [],
  }

  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(JSON.stringify(donnees, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="bike-insight-donnees-${date}.json"`,
      // Un export doit refléter l'état courant, jamais une copie mise en cache.
      'Cache-Control': 'no-store',
    },
  })
}
