import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, ProgressBar } from "@/components/bi/ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getBikeData } from "@/lib/data";

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
      <div style={{ padding: "24px 36px 40px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--bi-muted)", marginBottom: 10 }}>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "var(--bi-muted)" }}>Vue d&apos;ensemble</Link>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
          <span style={{ color: "var(--bi-ink)" }}>{bike.name}</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1 }}>{bike.name}</span>
              {bike.is_active && (
                <span style={{ fontSize: 10, padding: "4px 9px", background: "var(--bi-accent)", color: "#0E0E10", borderRadius: 999, fontWeight: 700, letterSpacing: 0.5 }}>ACTIF</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 6 }}>
              {bike.brand ? `${bike.brand} · ` : ""}{totalRides12m} sortie{totalRides12m !== 1 ? "s" : ""} enregistrée{totalRides12m !== 1 ? "s" : ""} · 12 mois
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href={`/components/new`}>
              <button style={{ padding: "9px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                Composant
              </button>
            </Link>
          </div>
        </div>

        {/* Hero stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, background: "var(--bi-line)", borderRadius: 18, overflow: "hidden", marginBottom: 14 }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>

          {/* Components table */}
          <BiCard pad={0}>
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
                  <div key={c.id} style={{ padding: "14px 22px", display: "grid", gridTemplateColumns: "1.5fr 1fr 1.4fr 0.6fr 0.5fr 0.5fr", gap: 14, alignItems: "center", borderBottom: "1px solid var(--bi-line)" }}>
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
                  </div>
                );
              })
            )}
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
      </div>
    </AppShell>
  );
}
