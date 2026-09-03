import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { NativeShell } from "@/components/bi/native-shell";

// Layout partagé des pages authentifiées.
//
// AppShell + SideNav sont rendus UNE seule fois ici : Next les préserve pendant la
// navigation entre pages sœurs (dashboard, bikes, cout…), au lieu de recharger la
// nav (vélos + notifications + session) à chaque changement de page.
//
// ⚠️ Ce layout doit rester libre de tout accès serveur — cookies, en-têtes,
// `supabase-server`. Le moindre appel de ce type le rendrait dynamique, et avec
// lui **toutes** les pages du groupe, ce qui interdirait l'export statique dont
// dépend l'app Capacitor. C'était le cas jusqu'au 24/08/2026 via `SideNavLoader`,
// désormais composant client.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell nav={<SideNavLoader />}>
      {/* Comportements natifs (bouton retour, barre de statut, écran de
          démarrage). Sans rendu, et entièrement inerte sur le web. */}
      <NativeShell />
      {children}
    </AppShell>
  );
}
