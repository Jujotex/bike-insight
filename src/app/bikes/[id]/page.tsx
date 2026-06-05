import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, ProgressBar } from "@/components/bi/ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getBikeData } from "@/lib/data";
import { ManualRideButton } from "@/components/bi/manual-ride-button";

const STATUS_COLORS: Record<string, string> = {
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
};

const CATEGORY_LABELS: Record<string, string> = {
  transmission: "Transmission",
  freinage: "Freinage",
  suspension: "Suspension",
  roues: "Roues",
  cockpit: "Cockpit",
  eclairage: "Éclairage",
  autre: "Autre",
};

const CATEGORY_COLORS: Record<string, string> = {
  transmission: "var(--bi-accent)",
  freinage: "var(--bi-ok)",
  roues: "var(--bi-warn)",
  suspension: "#8B7CF8",
  cockpit: "var(--bi-muted)",
  eclairage: "var(--bi-muted)",
  autre: "var(--bi-muted)",
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

export default async function BikeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getBikeData(id);
  if (!data) redirect("/dashboard");

  const { bike, components, activities } = data;

  // Fetch maintenance history for this bike
  const { createSupabaseServerClient } = await import("@/lib/supabase-server");
  const supabase = await createSupabaseServerClient();
  const { data: maintenanceLogs } = await supabase
    .from("maintenance_logs")
    .select("id, action, km_at_action, cost, performed_at, notes, component_id, components(name, category)")
    .eq("components.bike_id", id)
    .not("component_id", "is", null)
    .order("performed_at", { ascending: false })
    .limit(20);

  const logs = (maintenanceLogs ?? []).filter(
    (l) => l.components !== null
  );

  // Fetch spending data — last 12 months, all maintenance logs with cost for this bike
  const twelveMonthsAgoStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: spendingLogs } = await supabase
    .from("maintenance_logs")
    .select("cost, performed_at")
    .eq("components.bike_id", id)
    .not("component_id", "is", null)
    .not("cost", "is", null)
    .gte("performed_at", twelveMonthsAgoStr)
    .order("performed_at", { ascending: true });

  // Aggregate by month
  const spendingByMonth: Record<string, number> = {};
  const now2 = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now2.getFullYear(), now2.getMonth() - i, 1);
    const key = d.toISOString().slice(0, 7); // YYYY-MM
    spendingByMonth[key] = 0;
  }
  for (const l of (spendingLogs ?? [])) {
    const key = (l.performed_at as string).slice(0, 7);
    if (key in spendingByMonth) spendingByMonth[key] += (l.cost as number) ?? 0;
  }
  const spendingEntries = Object.entries(spendingByMonth);
  const maxSpending = Math.max(...spendingEntries.map(([, v]) => v), 1);
  const totalSpending12m = spendingEntries.reduce((s, [, v]) => s + v, 0);

  // Stats 12 mois
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const activities12m = activities.filter(
    (a) => new Date(a.started_at) >= twelveMonthsAgo
  );
  const totalRides12m = activities12m.length;
  const totalKm12m = activities12m.reduce((s, a) => s + (a.distance_km ?? 0), 0);
  const avgKmPerRide =
    totalRides12m > 0 ? Math.round(totalKm12m / totalRides12m * 10) / 10 : 0;

  // Graphique 30j
  const activityChart = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(thirtyDaysAgo);
    day.setDate(day.getDate() + i);
    const dayStr = day.toISOString().slice(0, 10);
    return activities
      .filter((a) => a.started_at.slice(0, 10) === dayStr)
      .reduce((s, a) => s + (a.distance_km ?? 0), 0);
  });
  const totalKm30d = Math.round(activityChart.reduce((s, v) => s + v, 0));
  const maxActivity = Math.max(...activityChart, 1);

  // Composant le plus critique
  const mostCritical =
    components.find((c) => c.status === "bad") ?? components[0] ?? null;

  // Poste le plus coûteux
  const costByCategory = components.reduce(
    (acc, c) => {
      const cat = (c.category as string) ?? "autre";
      acc[cat] = (acc[cat] ?? 0) + ((c.purchase_price as number) ?? 0);
      return acc;
    },
    {} as Record<string, number>
  );
  const topCostEntry = (
    Object.entries(costByCategory) as [string, number][]
  ).sort(([, a], [, b]) => b - a)[0];
  const totalComponentCost = (
    Object.values(costByCategory) as number[]
  ).reduce((s, v) => s + v, 0);

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page">

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--bi-muted)", marginBottom: 10 }}>
          <Link href="/bikes" style={{ textDecoration: "none", color: "var(--bi-muted)" }}>Mes vélos</Link>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
          <span style={{ color: "var(--bi-ink)" }}>{bike.name}</span>
        </div>

        {/* Header */}
        <div className="bi-bike-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="bi-bike-title" style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1 }}>{bike.name}</span>
              {bike.is_active && (
                <span style={{ fontSize: 10, padding: "4px 9px", background: "var(--bi-accent)", color: "#0E0E10", borderRadius: 999, fontWeight: 700, letterSpacing: 0.5 }}>ACTIF</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 6 }}>
              {bike.brand ? `${bike.brand} · ` : ""}{totalRides12m} sortie{totalRides12m !== 1 ? "s" : ""} enregistrée{totalRides12m !== 1 ? "s" : ""} · 12 mois
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <ManualRideButton bikes={[{ id: bike.id as string, name: bike.name as string }]} defaultBikeId={bike.id as string} />
            <Link href={`/components/new`}>
              <button style={{ padding: "9px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                Composant
              </button>
            </Link>
          </div>
        </div>

        {/* Hero stats */}
        <div className="bi-stats-5" style={{ marginBottom: 14 }}>
          {[
            ["Kilométrage total", fmt(bike.total_km ?? 0), "km"],
            ["Coût total", fmt(Math.round((bike.total_cost as number) ?? 0)), "€"],
            ["Coût / km", bike.cost_per_km !== null ? String((bike.cost_per_km as number).toFixed(2)).replace(".", ",") : "—", "€/km"],
            ["Sorties · 12 m", String(totalRides12m), ""],
            ["Moy. par sortie", String(avgKmPerRide), "km"],
          ].map(([k, v, u]) => (
            <div key={String(k)} style={{ background: "var(--bi-card)", padding: "20px 22px" }}>
              <BiLabel>{k}</BiLabel>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }}>{v}</Mono>
                {u && <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>{u}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="bi-grid-split-lg" style={{ gap: 14 }}>

          {/* Components table */}
          <BiCard pad={0}>
            <div className="bi-table-scroll">
            <div style={{ minWidth: 580 }}>
            <div style={{ padding: "20px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Composants · {components.length}</div>
                <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>Trié par taux d&apos;usure</div>
              </div>
            </div>
            <div style={{ padding: "8px 22px 6px", display: "grid", gridTemplateColumns: "1.5fr 1fr 1.4fr 0.6fr 0.5fr 0.5fr", gap: 14, fontSize: 10.5, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--bi-line)" }}>
              <span>Composant</span>
              <span>Installé</span>
              <span>Usure</span>
              <span style={{ textAlign: "right" }}>Km</span>
              <span style={{ textAlign: "right" }}>Coût</span>
              <span style={{ textAlign: "right" }}>€/km</span>
            </div>
            {components.length === 0 ? (
              <div style={{ padding: "32px 22px", textAlign: "center", color: "var(--bi-muted)", fontSize: 13 }}>
                Aucun composant — <Link href="/components/new" style={{ color: "var(--bi-ink)", fontWeight: 600 }}>en ajouter un</Link>
              </div>
            ) : (
              components.map((c) => {
                const color = STATUS_COLORS[c.status] ?? "var(--bi-muted)";
                const wearPct = (c.wear_pct as number) ?? 0;
                const costPerKmVal = c.cost_per_km as number | null;
                const installedDate = c.installed_at
                  ? new Date(c.installed_at as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                  : "—";
                return (
                  <Link key={c.id} href={`/components/${c.id}`} className="bi-component-row" style={{ textDecoration: "none", color: "inherit", display: "grid", gridTemplateColumns: "1.5fr 1fr 1.4fr 0.6fr 0.5fr 0.5fr", gap: 14, alignItems: "center", padding: "14px 22px", borderBottom: "1px solid var(--bi-line)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 4, height: 28, background: color, borderRadius: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>{c.brand ?? CATEGORY_LABELS[c.category as string] ?? "—"}</div>
                      </div>
                    </div>
                    <Mono style={{ fontSize: 11.5, color: "var(--bi-muted)" }}>{installedDate}</Mono>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={Math.min(wearPct / 100, 1)} color={color} height={3} />
                      </div>
                      <Mono style={{ fontSize: 11, color: "var(--bi-muted)", width: 32, textAlign: "right" }}>
                        {c.wear_pct !== null ? `${Math.round(wearPct)}%` : "—"}
                      </Mono>
                    </div>
                    <Mono style={{ fontSize: 12, textAlign: "right" }}>{fmt(c.km_used ?? 0)}</Mono>
                    <Mono style={{ fontSize: 12, textAlign: "right" }}>
                      {c.purchase_price !== null ? `${c.purchase_price} €` : "—"}
                    </Mono>
                    <Mono style={{ fontSize: 11, color: "var(--bi-muted)", textAlign: "right" }}>
                      {costPerKmVal !== null ? costPerKmVal.toFixed(3) : "—"}
                    </Mono>
                  </Link>
                );
              })
            )}
            </div></div>
          </BiCard>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Activity mini-chart 30j */}
            <BiCard pad={22}>
              <BiLabel>Activité · 30 j</BiLabel>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }}>{fmt(totalKm30d)}</Mono>
                <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>km</span>
              </div>
              <div style={{ marginTop: 14, height: 60, display: "flex", alignItems: "flex-end", gap: 3 }}>
                {activityChart.map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${Math.max(2, Math.round((h / maxActivity) * 100))}%`, background: h > maxActivity * 0.6 ? "var(--bi-accent)" : h > 0 ? "#D9D8D2" : "var(--bi-line)", borderRadius: 2, minHeight: 2 }} />
                ))}
              </div>
            </BiCard>

            {/* Analyse */}
            <BiCard pad={22}>
              <BiLabel>Analyse</BiLabel>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                {mostCritical ? (
                  <div>
                    <div style={{ fontSize: 10.5, color: "var(--bi-muted)", marginBottom: 4, letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 600 }}>Composant critique</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 999, background: STATUS_COLORS[mostCritical.status] ?? "var(--bi-muted)", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {mostCritical.name} · {mostCritical.wear_pct !== null ? `${Math.round(mostCritical.wear_pct as number)} % d'usure` : "à vérifier"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 10.5, color: "var(--bi-muted)", marginBottom: 4, letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 600 }}>État général</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bi-ok)" }}>Tous les composants OK</div>
                  </div>
                )}

                {topCostEntry && totalComponentCost > 0 && (
                  <div>
                    <div style={{ fontSize: 10.5, color: "var(--bi-muted)", marginBottom: 4, letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 600 }}>Poste le plus coûteux</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {CATEGORY_LABELS[topCostEntry[0]] ?? topCostEntry[0]} · <Mono>{topCostEntry[1]} €</Mono> · {Math.round((topCostEntry[1] / totalComponentCost) * 100)} %
                    </div>
                  </div>
                )}

                {components.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10.5, color: "var(--bi-muted)", marginBottom: 8, letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 600 }}>Répartition coûts</div>
                    <div style={{ height: 6, borderRadius: 999, overflow: "hidden", display: "flex", gap: 2 }}>
                      {(Object.entries(costByCategory) as [string, number][]).filter(([, v]) => v > 0).map(([cat, val]) => (
                        <div key={cat} style={{ flex: val, background: CATEGORY_COLORS[cat] ?? "var(--bi-muted)" }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </BiCard>
          </div>
        </div>
      {/* ── Historique de maintenance ───────────────────── */}
      {logs.length > 0 && (
        <BiCard pad={0} style={{ marginTop: 14 }}>
          <div style={{ padding: "18px 22px 12px", borderBottom: "1px solid var(--bi-line)" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Historique de maintenance</div>
            <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>
              {logs.length} opération{logs.length > 1 ? "s" : ""} enregistrée{logs.length > 1 ? "s" : ""}
            </div>
          </div>
          {logs.map((log, i) => {
            const compRaw = log.components as { name: string; category: string } | { name: string; category: string }[] | null;
            const comp = Array.isArray(compRaw) ? compRaw[0] ?? null : compRaw;
            const date = new Date(log.performed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
            return (
              <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 22px", borderBottom: i < logs.length - 1 ? "1px solid var(--bi-line)" : "none" }}>
                {/* Icône action */}
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                  </svg>
                </div>
                {/* Détails */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {log.action} —{" "}
                    {log.component_id ? (
                      <Link href={`/components/${log.component_id}`} style={{ color: "inherit", textDecoration: "underline", textDecorationColor: "var(--bi-line)" }}>
                        {comp?.name ?? "Composant"}
                      </Link>
                    ) : (
                      comp?.name ?? "Composant supprimé"
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>
                    {date}
                    {log.km_at_action !== null && ` · ${Math.round(log.km_at_action).toLocaleString("fr")} km vélo`}
                  </div>
                  {log.notes && (
                    <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4, fontStyle: "italic" }}>{log.notes}</div>
                  )}
                </div>
                {/* Coût */}
                {log.cost !== null && (
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-jetbrains-mono)", flexShrink: 0 }}>
                    {Math.round(log.cost).toLocaleString("fr")} €
                  </div>
                )}
              </div>
            );
          })}
        </BiCard>
      )}

      {/* ── Historique des dépenses ─────────────────────────── */}
      {totalSpending12m > 0 && (
        <BiCard pad={0} style={{ marginTop: 14 }}>
          <div style={{ padding: "18px 24px 14px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Dépenses · 12 mois</div>
              <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>Remplacements enregistrés</div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <Mono style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.6 }}>{Math.round(totalSpending12m).toLocaleString("fr")}</Mono>
              <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>€</span>
            </div>
          </div>
          <div style={{ padding: "0 24px 8px", display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
            {spendingEntries.map(([month, val]) => {
              const heightPct = val > 0 ? Math.max(8, Math.round((val / maxSpending) * 100)) : 3;
              const isActive = val > 0;
              const label = new Date(month + "-01").toLocaleDateString("fr-FR", { month: "short" });
              return (
                <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                  <div
                    title={`${label} · ${Math.round(val)} €`}
                    style={{ width: "100%", height: `${heightPct}%`, background: isActive ? "var(--bi-ink)" : "var(--bi-line)", borderRadius: "3px 3px 0 0", minHeight: 3 }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ padding: "4px 24px 16px", display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>
            <span>{new Date(spendingEntries[0][0] + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })}</span>
            <span>{new Date(spendingEntries[5][0] + "-01").toLocaleDateString("fr-FR", { month: "short" })}</span>
            <span>{new Date(spendingEntries[11][0] + "-01").toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })}</span>
          </div>
        </BiCard>
      )}

      </div>
    </AppShell>
  );
}
