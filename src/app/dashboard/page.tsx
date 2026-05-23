import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, Dot, ProgressBar } from "@/components/bi/ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/data";

const STATUS_COLORS: Record<string, string> = {
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
};

const STATUS_LABELS: Record<string, string> = {
  ok: "OK",
  warn: "Surveiller",
  bad: "Remplacer",
};

const CATEGORY_COLORS: Record<string, string> = {
  transmission: "var(--bi-accent)",
  freins: "var(--bi-ok)",
  roues: "var(--bi-warn)",
  pneumatiques: "var(--bi-warn)",
  cadre: "#8B7CF8",
  autre: "var(--bi-muted)",
};

const CATEGORY_LABELS: Record<string, string> = {
  transmission: "Transmission",
  freins: "Freinage",
  roues: "Roues",
  pneumatiques: "Pneumatiques",
  cadre: "Cadre",
  autre: "Autre",
};

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/login");

  const { primaryBike, components, activityChart, kpis, costByCategory, mostCritical } = data;

  // Activity stats (30 days)
  const totalKm30d = activityChart.reduce((s, v) => s + v, 0);
  const totalRides30d = activityChart.filter((v) => v > 0).length;
  const avgKm30d = totalRides30d > 0 ? Math.round(totalKm30d / totalRides30d) : 0;
  const maxActivity = Math.max(...activityChart, 1);

  // Cost distribution entries (exclude 0-cost categories)
  const distEntries = Object.entries(costByCategory)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  // Date display (server-side)
  const now = new Date();
  const rawDate = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const dateDisplay = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  // KPI sub-texts
  const criticalLabel =
    kpis.criticalCount === 0
      ? "Aucune alerte critique"
      : `${kpis.criticalCount} alerte${kpis.criticalCount > 1 ? "s" : ""} critique${kpis.criticalCount > 1 ? "s" : ""}`;

  // Insights from real data
  const insights: Array<[string, string]> = [];
  if (kpis.criticalCount > 0) {
    insights.push([
      `${kpis.criticalCount} composant${kpis.criticalCount > 1 ? "s" : ""} à remplacer maintenant`,
      "var(--bi-bad)",
    ]);
  }
  if (kpis.avgWear !== null && kpis.avgWear > 60) {
    insights.push([`Usure moyenne élevée · ${kpis.avgWear} %`, "var(--bi-warn)"]);
  }
  if (distEntries.length > 0) {
    const topCat = distEntries[0];
    const topLabel = CATEGORY_LABELS[topCat[0]] ?? topCat[0];
    const totalCost = distEntries.reduce((s, [, v]) => s + v, 0);
    const pct = totalCost > 0 ? Math.round((topCat[1] / totalCost) * 100) : 0;
    if (pct > 30) {
      insights.push([`${topLabel} = ${pct} % du budget composants`, "var(--bi-muted)"]);
    }
  }
  // Fallback insight
  if (insights.length === 0) {
    insights.push(["Tous les composants sont en bon état", "var(--bi-ok)"]);
  }

  return (
    <AppShell nav={<SideNavLoader />}>
      <div style={{ padding: "24px 36px 40px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {dateDisplay} · Vue d&apos;ensemble
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1, marginTop: 4 }}>
              {primaryBike?.name ?? "Aucun vélo"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 12.5, color: "var(--bi-muted)" }}>
              <Dot color="var(--bi-ok)" size={6} /> Sync · Strava
            </div>
            <Link href="/components">
              <button style={{ padding: "8px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                Composant
              </button>
            </Link>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
          <BiCard pad={20}>
            <BiLabel>Coût total composants</BiLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
              <Mono style={{ fontSize: 40, fontWeight: 500, letterSpacing: -1.2 }}>{formatNumber(kpis.totalComponentCost)}</Mono>
              <span style={{ fontSize: 16, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>€</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <Dot color="var(--bi-muted)" size={5} />{components.length} composant{components.length !== 1 ? "s" : ""} suivis
            </div>
          </BiCard>

          <BiCard pad={20}>
            <BiLabel>Coût par km</BiLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
              <Mono style={{ fontSize: 40, fontWeight: 500, letterSpacing: -1.2 }}>
                {kpis.costPerKm !== null ? kpis.costPerKm.toFixed(2).replace(".", ",") : "—"}
              </Mono>
              <span style={{ fontSize: 16, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>€/km</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <Dot color="var(--bi-muted)" size={5} />Sur {formatNumber(primaryBike?.total_km ?? 0)} km totaux
            </div>
          </BiCard>

          <BiCard pad={20}>
            <BiLabel>Distance · 12 mois</BiLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
              <Mono style={{ fontSize: 40, fontWeight: 500, letterSpacing: -1.2 }}>{formatNumber(kpis.totalKm12m)}</Mono>
              <span style={{ fontSize: 16, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>km</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              <Dot color="var(--bi-muted)" size={5} />{kpis.totalRides12m} sortie{kpis.totalRides12m !== 1 ? "s" : ""}
            </div>
          </BiCard>

          <BiCard pad={20}>
            <BiLabel>État global</BiLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
              <Mono style={{ fontSize: 40, fontWeight: 500, letterSpacing: -1.2 }}>
                {kpis.avgWear !== null ? kpis.avgWear : "—"}
              </Mono>
              {kpis.avgWear !== null && (
                <span style={{ fontSize: 16, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>%</span>
              )}
            </div>
            <div style={{
              fontSize: 11.5,
              color: kpis.criticalCount > 0 ? "var(--bi-bad)" : "var(--bi-muted)",
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              <Dot color={kpis.criticalCount > 0 ? "var(--bi-bad)" : "var(--bi-muted)"} size={5} />
              {criticalLabel}
            </div>
          </BiCard>
        </div>

        {/* Main grid 1.4fr 1fr */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 18 }}>

          {/* Components table */}
          <BiCard pad={0}>
            <div style={{ padding: "20px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>État du matériel</div>
                <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>
                  {components.length} composant{components.length !== 1 ? "s" : ""} suivi{components.length !== 1 ? "s" : ""} · basé sur kilométrage importé
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--bi-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                Trié par usure
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10l5 5 5-5" /></svg>
              </div>
            </div>
            {/* Column headers */}
            <div style={{
              padding: "8px 22px 6px",
              display: "grid",
              gridTemplateColumns: "1.4fr 0.7fr 1.4fr 0.6fr 0.6fr 0.3fr",
              gap: 14,
              fontSize: 10.5,
              color: "var(--bi-muted)",
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              borderBottom: "1px solid var(--bi-line)",
            }}>
              <span>Composant</span>
              <span>Statut</span>
              <span>Usure</span>
              <span style={{ textAlign: "right" }}>Km</span>
              <span style={{ textAlign: "right" }}>Coût</span>
              <span />
            </div>
            {components.length === 0 ? (
              <div style={{ padding: "32px 22px", textAlign: "center", color: "var(--bi-muted)", fontSize: 13 }}>
                Aucun composant ajouté
              </div>
            ) : (
              components.map((c) => {
                const color = STATUS_COLORS[c.status] ?? "var(--bi-muted)";
                const wearPct = c.wear_pct ?? 0;
                const wearFraction = Math.min(wearPct / 100, 1);
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: "16px 22px",
                      display: "grid",
                      gridTemplateColumns: "1.4fr 0.7fr 1.4fr 0.6fr 0.6fr 0.3fr",
                      gap: 14,
                      alignItems: "center",
                      borderBottom: "1px solid var(--bi-line)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>
                        {c.brand ?? c.category ?? "—"}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color }}>
                      <Dot color={color} size={6} />
                      {STATUS_LABELS[c.status] ?? c.status}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={wearFraction} color={color} height={3} />
                      </div>
                      <Mono style={{ fontSize: 11.5, color: "var(--bi-muted)", width: 36, textAlign: "right" }}>
                        {c.wear_pct !== null ? `${Math.round(wearPct)} %` : "—"}
                      </Mono>
                    </div>
                    <Mono style={{ fontSize: 12.5, textAlign: "right" }}>
                      {formatNumber(c.km_used ?? 0)}
                    </Mono>
                    <Mono style={{ fontSize: 12.5, textAlign: "right" }}>
                      {c.purchase_price !== null ? `${c.purchase_price} €` : "—"}
                    </Mono>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="2" style={{ justifySelf: "end" }}>
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </div>
                );
              })
            )}
          </BiCard>

          {/* Right column: priority action + insights */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Priority action */}
            <div style={{ background: "#0E0E10", color: "#fff", borderRadius: 18, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Dot color="var(--bi-accent)" size={6} />
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--bi-accent)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Action prioritaire</span>
                </div>
              </div>
              {mostCritical ? (
                <>
                  <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.2, marginTop: 14 }}>
                    {mostCritical.status === "bad"
                      ? `Remplacer ${mostCritical.name}`
                      : `Surveiller ${mostCritical.name}`}
                    {mostCritical.km_remaining !== null && mostCritical.km_remaining < 500
                      ? ` sous ~${mostCritical.km_remaining} km`
                      : ""}
                  </div>
                  <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", marginTop: 8, lineHeight: 1.5 }}>
                    {mostCritical.wear_pct !== null
                      ? `Usure à ${Math.round(mostCritical.wear_pct)} %.`
                      : "Vérifier l'état de ce composant."}{" "}
                    {mostCritical.km_used !== null && mostCritical.km_max !== null
                      ? `${formatNumber(mostCritical.km_used)} km / ${formatNumber(mostCritical.km_max)} km max.`
                      : ""}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                    <Link href="/components">
                      <button style={{ background: "var(--bi-accent)", color: "#0E0E10", border: "none", borderRadius: 999, padding: "9px 14px", fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>Voir composants</button>
                    </Link>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.3, marginTop: 14, color: "rgba(255,255,255,0.8)" }}>
                  Tous les composants sont en bon état 🎉
                </div>
              )}
            </div>

            {/* Insights compact */}
            <BiCard pad={20}>
              <BiLabel>Insights · {insights.length}</BiLabel>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                {insights.map(([text, color]) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid var(--bi-line)" }}>
                    <div style={{ width: 3, height: 24, background: color, borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{text}</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="2">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </div>
                ))}
              </div>
            </BiCard>

          </div>
        </div>

        {/* Activity + cost split */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>

          {/* Activity chart */}
          <BiCard pad={22}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Activité · 30 derniers jours</div>
                <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>
                  {formatNumber(totalKm30d)} km · {totalRides30d} sortie{totalRides30d !== 1 ? "s" : ""} · moyenne {avgKm30d} km
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, background: "var(--bi-ink)", color: "var(--bi-bg)", fontWeight: 600 }}>30 j</span>
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, border: "1px solid var(--bi-line)", color: "var(--bi-muted)" }}>90 j</span>
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, border: "1px solid var(--bi-line)", color: "var(--bi-muted)" }}>12 m</span>
              </div>
            </div>
            <div style={{ marginTop: 18, height: 80, display: "flex", alignItems: "flex-end", gap: 4 }}>
              {activityChart.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${Math.max(2, Math.round((h / maxActivity) * 100))}%`,
                    background: h > maxActivity * 0.6 ? "var(--bi-accent)" : h > 0 ? "#D9D8D2" : "var(--bi-line)",
                    borderRadius: 2,
                    minHeight: 2,
                  }}
                />
              ))}
            </div>
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>
              {/* Date labels: J-30, J-20, J-10, Today */}
              {[-29, -20, -10, 0].map((offset) => {
                const d = new Date(now);
                d.setDate(d.getDate() + offset);
                return (
                  <span key={offset}>
                    {d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                );
              })}
            </div>
          </BiCard>

          {/* Cost distribution */}
          <BiCard pad={22}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Répartition du coût</div>
            <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>par catégorie · composants actifs</div>
            {distEntries.length > 0 ? (
              <>
                <div style={{ marginTop: 18, height: 8, borderRadius: 999, overflow: "hidden", display: "flex", gap: 2 }}>
                  {distEntries.map(([cat, val]) => (
                    <div
                      key={cat}
                      style={{ flex: val, background: CATEGORY_COLORS[cat] ?? "var(--bi-muted)" }}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  {distEntries.map(([cat, val]) => (
                    <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                      <Dot color={CATEGORY_COLORS[cat] ?? "var(--bi-muted)"} size={8} />
                      <span style={{ flex: 1 }}>{CATEGORY_LABELS[cat] ?? cat}</span>
                      <Mono style={{ fontWeight: 500 }}>{val} €</Mono>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ marginTop: 24, textAlign: "center", color: "var(--bi-muted)", fontSize: 13 }}>
                Aucun coût enregistré
              </div>
            )}
          </BiCard>

        </div>
      </div>
    </AppShell>
  );
}
