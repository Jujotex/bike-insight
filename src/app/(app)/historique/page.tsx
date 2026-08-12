import { EmptyState, PageHead } from "@/components/bi/ui";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCachedUser } from "@/lib/supabase-server";
import { BikePicker } from "@/components/bi/bike-picker";
import { HistoryLog, type HistoryItem } from "./history-log";
import { HistoryCharts } from "./history-charts";

export default async function HistoriquePage({ searchParams }: { searchParams: Promise<{ bike?: string }> }) {
  const { bike } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const [{ data: bikes }, { data: compStatuses }] = await Promise.all([
    supabase
      .from("bikes")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("total_km", { ascending: false }),
    // État des pièces de chaque vélo → pastille colorée du sélecteur (comme dashboard/coût).
    supabase
      .from("component_stats")
      .select("bike_id, status")
      .eq("user_id", user.id)
      .eq("is_active", true),
  ]);
  const statusByBike = new Map<string, "ok" | "warn" | "bad">();
  for (const c of compStatuses ?? []) {
    const bid = c.bike_id as string;
    const st = c.status as string;
    const cur = statusByBike.get(bid);
    if (st === "bad") statusByBike.set(bid, "bad");
    else if (st === "warn" && cur !== "bad") statusByBike.set(bid, "warn");
    else if (!cur) statusByBike.set(bid, "ok");
  }
  const bikeList = (bikes ?? []).map((b) => ({
    id: b.id as string,
    name: b.name as string,
    status: statusByBike.get(b.id as string) ?? ("ok" as const),
  }));
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
    <div className="bi-page">
      <PageHead title="Historique" sub="Tes remplacements de pièces et tes entretiens" />
      <BikePicker bikes={bikeList} selected={selectedBikeId} basePath="/historique" />
      <div className="bi-stack">
        {historyItems.length === 0 ? (
          <EmptyState
            title={"Rien à afficher pour l'instant"}
            text={"Dès que tu remplaces une pièce ou que tu enregistres un entretien, l'événement apparaît ici, daté et chiffré."}
          />
        ) : (
          <>
            <HistoryCharts items={historyItems} />
            <HistoryLog items={historyItems} />
          </>
        )}
      </div>
    </div>
  );
}
