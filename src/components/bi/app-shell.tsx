import { SideNav } from "./side-nav";
import { BottomNav } from "./bottom-nav";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Wraps main app pages with the appropriate nav:
 * - Desktop: SideNav (left rail) + scrollable main area
 * - Mobile: BottomNav footer (via CSS visibility)
 */
export function AppShell({ children }: AppShellProps) {
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
        <SideNav />
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
        <main
          style={{ flex: 1, overflow: "auto" }}
        >
          {children}
        </main>

        {/* Mobile bottom nav */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
