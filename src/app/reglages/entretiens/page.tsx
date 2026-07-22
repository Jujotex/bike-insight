import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { PageHead } from "@/components/bi/ui";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { MaintenanceSettingsClient, type MaintenanceTypeRow } from "./client";

export default async function MaintenanceSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ bike?: string }>;
}) {
  const { bike } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: bikes }, { data: types }] = await Promise.all([
    supabase
      .from("bikes")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("total_km", { ascending: false }),
    supabase
      .from("maintenance_types")
      .select("id, bike_id, slug, label, sub, interval_km, interval_months, default_cost, sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
  ]);

  const bikeList = (bikes ?? []).map((b) => ({ id: b.id as string, name: b.name as string }));
  const initialBikeId =
    bike && bikeList.some((b) => b.id === bike) ? bike : bikeList[0]?.id ?? "";

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page">
        <PageHead
          title="Entretiens"
          sub="Personnalise les types d'entretien et leurs échéances, vélo par vélo"
          breadcrumb={["Réglages", "Entretiens"]}
        />
        <MaintenanceSettingsClient
          bikes={bikeList}
          types={(types ?? []) as MaintenanceTypeRow[]}
          initialBikeId={initialBikeId}
        />
      </div>
    </AppShell>
  );
}
