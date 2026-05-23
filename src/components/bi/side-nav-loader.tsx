// Server Component — pas de "use client"
// Fait le fetch des vélos et renvoie <SideNav> avec les vraies données.
// À utiliser uniquement depuis des Server Components (pages, layouts).

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { SideNav, SideNavBike } from './side-nav'

export async function SideNavLoader() {
  let bikes: SideNavBike[] = []
  let userInitials = '?'
  let userName = ''
  let bikeCount = 0

  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: bikesData } = await supabase
        .from('bike_stats')
        .select('id, name, is_active, most_critical_component')
        .eq('user_id', user.id)
        .order('total_km', { ascending: false })

      bikes = (bikesData ?? []) as SideNavBike[]
      bikeCount = bikes.filter((b) => b.is_active).length

      const email = user.email ?? ''
      const displayName =
        (user.user_metadata?.full_name as string | undefined) ??
        email.split('@')[0] ??
        'Utilisateur'
      userName = displayName
      userInitials = displayName
        .split(/[\s.]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0].toUpperCase())
        .join('')
    }
  } catch {
    // Fail silently — la nav ne doit pas faire crasher le layout
  }

  return (
    <SideNav
      bikes={bikes}
      userInitials={userInitials}
      userName={userName}
      bikeCount={bikeCount}
    />
  )
}
