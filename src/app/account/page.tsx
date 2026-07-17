import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, PageHead } from "@/components/bi/ui";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { AccountClient } from "./client";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("strava_athlete_id, strava_access_token")
    .eq("id", user.id)
    .single();

  const { data: bikes } = await supabase
    .from("bikes")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const { data: components } = await supabase
    .from("components")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const { count: notifCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const firstName = (user.user_metadata?.first_name as string | undefined) ?? fullName.split(" ")[0] ?? "";
  const lastName = (user.user_metadata?.last_name as string | undefined) ?? fullName.split(" ").slice(1).join(" ") ?? "";
  const email = user.email ?? "";
  const initials = fullName
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join("") || email[0]?.toUpperCase() || "?";

  const stravaConnected = !!profile?.strava_athlete_id;
  const memberSince = new Date(user.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page bi-page-narrow">
        <PageHead title="Mon compte" sub={`Membre depuis ${memberSince}`} />

        <AccountClient
          userId={user.id}
          firstName={firstName}
          lastName={lastName}
          email={email}
          initials={initials}
          stravaConnected={stravaConnected}
          bikes={(bikes ?? []).map(b => ({ id: b.id as string, name: b.name as string }))}
          bikeCount={bikes?.length ?? 0}
          componentCount={components?.length ?? 0}
          unreadNotifCount={notifCount ?? 0}
          memberSince={memberSince}
        />
      </div>
    </AppShell>
  );
}
