import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";

// Layout partagé des pages authentifiées.
// AppShell + SideNav sont rendus UNE seule fois ici : Next les préserve
// pendant la navigation entre pages sœurs (dashboard, bikes, cout…), au lieu
// de refetcher la nav (vélos + notifs + auth.getUser) à chaque changement de page.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell nav={<SideNavLoader />}>{children}</AppShell>;
}
