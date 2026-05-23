import { SideNav, SideNavBike } from "./side-nav";
import { BottomNav } from "./bottom-nav";
import { createSupabaseServerClient } from "@/lib/supabase-server";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Wraps main app pages with the appropriate nav:
 * - Desktop: SideNav (left rail) + scrollable main area
 * - Mobile: BottomNav footer (via CSS visibility)
 */
export async function AppShell({ children }: AppShellProps) {
  // Fetch bikes and user for the side nav
  let bikes: SideNavBike[] = [];
  let userInitials = "?";
  let userName = "";
  let bikeCount = 0;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: bikesData } = await supabase
        .from("bike_stats")
        .select("id, name, is_active, most_critical_component")
        .eq("user_id", user.id)
        .order("total_km", { ascending: false });

      bikes = (bikesData ?? []) as SideNavBike[];
      bikeCount = bikes.filter((b) => b.is_active).length;

      // User display name from email or metadata
      const email = user.email ?? "";
      const displayName = (user.user_metadata?.full_name as string | undefined) ?? email.split("@")[0] ?? "Utilisateur";
      userName = displayName;
      userInitials = displayName
        .split(/[\s.]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0].toUpperCase())
        .join("");
    }
  } catch {
    // Fail silently — layout should not crash if data fetching fails
  }

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
        <SideNav
          bikes={bikes}
          userInitials={userInitials}
          userName={userName}
          bikeCount={bikeCount}
        />
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
