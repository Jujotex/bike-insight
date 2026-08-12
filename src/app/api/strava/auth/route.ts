import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!))
  }

  const stravaAuthUrl = new URL('https://www.strava.com/oauth/authorize')
  stravaAuthUrl.searchParams.set('client_id', process.env.STRAVA_CLIENT_ID!)
  stravaAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/callback`)
  stravaAuthUrl.searchParams.set('response_type', 'code')
  stravaAuthUrl.searchParams.set('approval_prompt', 'auto')
  // Périmètre volontairement réduit à la lecture.
  //
  // `activity:write` (alerte d'usure ajoutée à la description des sorties) a été retiré
  // avant la demande d'augmentation de capacité : c'est une permission élevée, et écrire
  // le nom de la marque + un lien dans la description publique d'une sortie s'apparente à
  // de la promotion via le contenu des utilisateurs — le point le plus susceptible d'être
  // relevé en revue. Une demande à périmètre restreint passe plus facilement.
  //
  // Réintroduction possible après obtention de la capacité, et sans lien promotionnel
  // (cf. `src/lib/strava-comment.ts`).
  stravaAuthUrl.searchParams.set('scope', 'activity:read_all,profile:read_all')

  return NextResponse.redirect(stravaAuthUrl.toString())
}
