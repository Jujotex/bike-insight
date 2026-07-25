import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

type CookieItem = { name: string; value: string; options?: Record<string, unknown> }

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: CookieItem[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Record<string, unknown>)
          )
        },
      },
    }
  )
}

// Récupère l'utilisateur courant, mémoïsé pour la durée d'une requête.
// auth.getUser() fait un aller-retour réseau vers Supabase Auth pour valider
// le JWT : sans cache, le layout (SideNav) ET la page l'appelleraient chacun
// au même rendu. cache() de React dédoublonne ces appels en un seul par requête.
export const getCachedUser = cache(async () => {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
