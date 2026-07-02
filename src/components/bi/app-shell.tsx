import { SideNav } from "./side-nav";
import { BottomNav } from "./bottom-nav";

interface AppShellProps {
  children: React.ReactNode;
  /** Passer <SideNavLoader /> depuis un Server Component pour avoir les vraies données.
   *  Les pages "use client" peuvent omettre cette prop (SideNav statique en fallback). */
  nav?: React.ReactNode;
}

/**
 * Wraps main app pages with the appropriate nav:
 * - Desktop: SideNav (left rail) + scrollable main area
 * - Mobile: BottomNav footer (via CSS visibility)
 *
 * IMPORTANT: AppShell n'importe pas de code server-only pour rester
 * compatible avec les pages "use client". Passer nav={<SideNavLoader />}
 * depuis les Server Component pages pour avoir la liste des vélos réelle.
 */
export function AppShell({ children, nav }: AppShellProps) {
  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        overflow: "hidden",
        background: "var(--bi-bg)",
      }}
    >
      {/* Desktop side nav */}
      <div className="hidden md:flex">
        {nav ?? <SideNav />}
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </main>

        {/* Mobile bottom nav */}
        <div className="md:hidden">
          <BottomNav 