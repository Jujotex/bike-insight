'use client'

import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAsyncData } from '@/lib/use-async-data'
import { SideNav, SideNavBike } from './side-nav'

/**
 * Charge les données de la navigation latérale : vélos, notifications non lues,
 * identité de l'utilisateur.
 *
 * **Passé en composant client le 24/08/2026** — et c'était le dernier verrou de
 * l'étape 2.1. Tant qu'il lisait les cookies via `getCachedUser`, ce composant
 * rendait **tout le groupe `(app)` dynamique**, quelles que soient les pages :
 * convertir les quinze écrans ne suffisait pas, le layout dominait. Le build le
 * montrait clairement — seule `/onboarding`, hors de ce groupe, était passée en
 * statique.
 *
 * Le bénéfice d'origine est conservé : le layout reste monté pendant la navigation
 * entre pages sœurs, donc `useAsyncData` ne se déclenche qu'une fois et la nav ne
 * recharge pas à chaque changement de page.
 */
export function SideNavLoader() {
  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const [{ data: bikesData }, { count }] = await Promise.all([
      supabase
        .from('bikes')
        .select('id, name, is_active')
        .eq('user_id', user.id)
        .order('total_km', { ascending: false }),
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false),
    ])

    const bikes = (bikesData ?? []) as SideNavBike[]
    const email = user.email ?? ''
    const displayName =
      (user.user_metadata?.full_name as string | undefined) ??
      email.split('@')[0] ??
      'Utilisateur'

    return {
      bikes,
      bikeCount: bikes.filter(b => b.is_active).length,
      unreadCount: count ?? 0,
      userName: displayName,
      userInitials: displayName
        .split(/[\s.]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0].toUpperCase())
        .join(''),
    }
  }, [])

  // Les erreurs sont ignorées volontairement : la navigation ne doit jamais
  // empêcher le rendu de la page. Elle s'affiche alors dans son état vide.
  const { data } = useAsyncData(load, [])

  return (
    <SideNav
      bikes={data?.bikes ?? []}
      userInitials={data?.userInitials ?? '?'}
      userName={data?.userName ?? ''}
      bikeCount={data?.bikeCount ?? 0}
      unreadCount={data?.unreadCount ?? 0}
    />
  )
}
