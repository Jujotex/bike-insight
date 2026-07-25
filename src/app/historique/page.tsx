import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, PageHead } from "@/components/bi/ui";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { BikePicker } from "@/components/bi/bike-picker";
import { CostHistory, type HistoryItem } from "../cout/history-client";

export default async function HistoriquePage({ searchParams }: { searchParams: Promise<{ bike?: string }> }) {
  const { bike } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bikes } = await supabase
    .from("bike_stats")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("total_km", { ascending: false });
  const bikeList = (bikes ?? []).map((b) => ({ id: b.id as string, name: b.name as string }));
  const selectedBikeId = bike && bikeList.some((b) => b.id === bike) ? bike : bikeList[0]?.id ?? "";

  const { data: logRows } = selectedBikeId
    ? await supabase
        .from("maintenance_logs")
        .select("id, action, maintenance_type, bike_id, performed_at, km_at_action, cost, reason, components(name, bike_id)")
        .eq("user_id", user.id)
        .order("performed_at", { ascending: false })
        .limit(400)
    : { data: [] as unknown[] };

  const historyItems: HistoryItem[] = (logRows ?? [])
    .filter((l) => {
      const cr = (l as { components?: { bike_id?: string } | { bike_id?: string }[] | null }).components;
      const c = Array.isArray(cr) ? cr[0] : cr;
      const logBike = (l as { bike_id?: string | null }).bike_id ?? c?.bike_id ?? null;
      return logBike === selectedBikeId;
    })
    .slice(0, 200)
    .map((l) => {
      const compRaw = (l as { components?: { name?: string } | { name?: string }[] | null }).components;
      const comp = Array.isArray(compRaw) ? compRaw[0] : compRaw;
      const isMaint = (l as { maintenance_type?: string | null }).maintenance_type != null;
      const kind: HistoryItem["kind"] = isMaint ? "maint" : "repl";
      return {
        id: (l as { id: string }).id,
        kind,
        title: isMaint ? ((l as { action: string }).action) : (comp?.name ?? "Pièce remplacée"),
        dateISO: (l as { performed_at: string }).performed_at,
        km: ((l as { km_at_action?: number | null }).km_at_action) ?? null,
        reason: ((l as { reason?: string | null }).reason) ?? null,
        cost: ((l as { cost?: number | null }).cost) ?? null,
      };
    });

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page">
        <PageHead title="Historique" sub="Tes remplacements de pièces et tes entretiens" breadcrumb={["Historique"]} />
        <BikePicker bikes={bikeList} selected={selectedBikeId} basePath="/historique" />
        {historyItems.length === 0 ? (
          <BiCard pad={40} style={{ textAlign: "center", marginTop: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Rien à afficher pour l&apos;instant</div>
            <div style={{ fontSize: 13, color: "var(--bi-muted)" }}>
              Dès que tu remplaces une pièce ou que tu enregistres un entretien, l&apos;événement apparaît ici, daté et chiffré.
            </div>
          </BiCard>
        ) : (
          <CostHistory items={historyItems} />
        )}
      </div>
    </AppShell>
  );
}
