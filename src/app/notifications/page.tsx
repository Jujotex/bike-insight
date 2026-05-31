import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, PageHead } from "@/components/bi/ui";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NotificationsClient } from "./client";

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifs = (notifications ?? []) as {
    id: string;
    component_id: string | null;
    bike_id: string;
    component_name: string;
    bike_name: string;
    type: "warn" | "bad";
    read: boolean;
    created_at: string;
  }[];

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 700 }}>
        <PageHead
          title="Alertes"
          sub={unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est à jour"}
        />

        <NotificationsClient notifications={notifs} />
      </div>
    </AppShell>
  );
}
