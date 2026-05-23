import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, Dot } from "@/components/bi/ui";
import { redirect } from "next/navigation";
import { getAnalysisData } from "@/lib/data";

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

export default async function AnalysisPage() {
  const data = await getAnalysisData();
  if (!data) redirect("/login");

  const { components, kpis, costByCategory } = data;

  const distEntries = (Object.entries(costByCategory) as [string, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);
  const totalCatCost = distEntries.reduce((s, [, v]) => s + v, 0);

  // Insights calculés depuis les vraies données
  type Insight = { cat: string; text: string; impact: string; color: string }
  const insights: Insight[] = []

  const badComponents = components.filter((c) => c.status === "bad")
  const warnComponents = components.filter((c) => c.status === "warn")

  if (badComponents.length > 0) {
    insights.push({
      cat: "urgence",
      text: `${badComponents.length} composant${badComponents.length > 1 ? "s" : ""} à remplacer maintenant`,
      impact: badComponents.map((c) => c.name).join(", "),
      color: "var(--bi-bad)",
    })
  }

  if (warnComponents.length > 0) {
    insights.push({
      cat: "prévention",
      text: `${warnComponents.length} composant${warnComponents.length > 1 ? "s" : ""} à surveiller`,
      impact: warnComponents.map((c) => c.name).join(", "),
      color: "var(--bi-warn)",
    })
  }

  if (distEntries.length > 0 && totalCatCost > 0) {
    const top = distEntries[0]
    const pct = Math.round((top[1] / totalCatCost) * 100)
    if (pct > 25) {
      insights.push({
        cat: "financier",
        text: `${CATEGORY_LABELS[top[0]] ?? top[0]} représente ${pct} % du budget composants`,
        impact: `${top[1]} €`,
        color: "var(--bi-muted)",
      })
    }
  }

  if (kpis.totalKm12m > 0 && kpis.bikeCount > 0) {
    insights.push({
      cat: "kilométrage",
      text: `${kpis.totalKm12m.toLocaleString("fr-FR")} km parcourus sur ${kpis.bikeCount} vélo${kpis.bikeCount > 1 ? "s" : ""} en 12 mois`,
      impact: `${kpis.totalRides12m} sortie${kpis.totalRides12m !== 1 ? "s" : ""}`,
      color: "var(--bi-ok)",
    })
  }

  if (insights.length === 0) {
    insights.push({
      cat: "état",
      text: "Tous les composants sont en bon état",
      impact: "Aucune action requise",
      color: "var(--bi-ok)",
    })
  }

  return (
    <AppShell nav={<SideNavLoader />}>
      <div style={{ padding: "24px 36px 40px" }}>

        {/* Page head */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1 }}>Analyse</div>
            <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 6 }}>
              Insights financiers et mécaniques · {kpis.bikeCount} vélo{kpis.bikeCount !== 1 ? "s" : ""} · 12 derniers mois
            </div>
          </div>
        </div>

        {/* Hero KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
          <BiCard pad={22}>
            <BiLabel>Coût total composants</BiLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
              <Mono style={{ fontSize: 38, fontWeight: 500, letterSpacing: -1.2 }}>{kpis.totalCost.toLocaleString("fr-FR")}</Mono>
              <span style={{ fontSize: 14, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>€</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11.5, color: "var(--bi-muted)" }}>
              <Dot color="var(--bi-muted)" size={5} />
              {components.length} composant{components.length !== 1 ? "s" : ""} actif{components.length !== 1 ? "s" : ""}
            </div>
          </BiCard>

          <BiCard pad={22}>
            <BiLabel>Coût / km global</BiLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
              <Mono style={{ fontSize: 38, fontWeight: 500, letterSpacing: -1.2 }}>
                {kpis.costPerKm !== null ? kpis.costPerKm.toFixed(2).replace(".", ",") : "—"}
              </Mono>
              <span style={{ fontSize: 14, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>€/km</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11.5, color: "var(--bi-muted)" }}>
              <Dot color="var(--bi-muted)" size={5} />
              Tous vélos confondus
            </div>
          </BiCard>

          <BiCard pad={22}>
            <BiLabel>Distance · 12 mois</BiLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
              <Mono style={{ fontSize: 38, fontWeight: 500, letterSpacing: -1.2 }}>{kpis.totalKm12m.toLocaleString("fr-FR")}</Mono>
              <span style={{ fontSize: 14, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>km</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11.5, color: "var(--bi-ok)" }}>
              <Dot color="var(--bi-ok)" size={5} />
              {kpis.totalRides12m} sortie{kpis.totalRides12m !== 1 ? "s" : ""}
            </div>
          </BiCard>

          <BiCard pad={22}>
            <BiLabel>Alertes actives</BiLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
              <Mono style={{ fontSize: 38, fontWeight: 500, letterSpacing: -1.2 }}>{badComponents.length + warnComponents.length}</Mono>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11.5, color: badComponents.length > 0 ? "var(--bi-bad)" : warnComponents.length > 0 ? "var(--bi-warn)" : "var(--bi-ok)" }}>
              <Dot color={badComponents.length > 0 ? "var(--bi-bad)" : warnComponents.length > 0 ? "var(--bi-warn)" : "var(--bi-ok)"} size={5} />
              {badComponents.length > 0 ? `${badComponents.length} critique${badComponents.length > 1 ? "s" : ""}` : warnComponents.length > 0 ? `${warnComponents.length} à surveiller` : "Aucune alerte"}
            </div>
          </BiCard>
        </div>

        {/* Répartition */}
        {distEntries.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <BiCard pad={24}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Répartition par catégorie</div>
                  <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>{totalCatCost} € · composants actifs</div>
                </div>
              </div>
              <div style={{ height: 10, borderRadius: 999, overflow: "hidden", display: "flex", gap: 2, marginBottom: 20 }}>
                {distEntries.map(([cat, val]) => (
                  <div key={cat} style={{ flex: val, background: CATEGORY_COLORS[cat] ?? "var(--bi-muted)" }} />
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {distEntries.map(([cat, val]) => (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Dot color={CATEGORY_COLORS[cat] ?? "var(--bi-muted)"} size={8} />
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{CATEGORY_LABELS[cat] ?? cat}</span>
                    <Mono style={{ fontSize: 11, color: "var(--bi-muted)", marginRight: 8 }}>{Math.round((val / totalCatCost) * 100)} %</Mono>
                    <Mono style={{ fontSize: 13, fontWeight: 500 }}>{val} €</Mono>
                  </div>
                ))}
              </div>
            </BiCard>
          </div>
        )}

        {/* Insights */}
        <BiCard pad={0}>
          <div style={{ padding: "20px 22px 14px" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Insights · {insights.length} détecté{insights.length !== 1 ? "s" : ""}</div>
            <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>Basés sur ton historique Strava et l&apos;état de tes composants</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1.4fr 1fr", padding: "8px 22px", gap: 16, fontSize: 10.5, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--bi-line)" }}>
            <span></span>
            <span>Catégorie</span>
            <span>Insight</span>
            <span>Détail</span>
          </div>
          {insights.map((ins, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr 1.4fr 1fr", padding: "16px 22px", gap: 16, alignItems: "center", borderBottom: "1px solid var(--bi-line)" }}>
              <Dot color={ins.color} size={8} />
              <span style={{ fontSize: 11, color: "var(--bi-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{ins.cat}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{ins.text}</span>
              <span style={{ fontSize: 12, color: ins.color, fontWeight: 500 }}>{ins.impact}</span>
            </div>
          ))}
        </BiCard>
      </div>
    </AppShell>
  );
}
