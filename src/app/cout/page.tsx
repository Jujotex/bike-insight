import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, Mono, PageHead } from "@/components/bi/ui";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCostData } from "@/lib/data";

const CATEGORY_LABELS: Record<string, string> = {
  transmission: "Transmission",
  freinage: "Freinage",
  suspension: "Suspension",
  roues: "Pneumatiques",
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

function eurPerKm(v: number) {
  return v.toFixed(3).replace(".", ",");
}

export default async function CostPage() {
  const data = await getCostData();
  if (!data) redirect("/login");

  const { kpis, byBike, topByCpm, categoryBreakdown, hasData } = data;

  const KPIS: { label: string; value: string; unit: string }[] = [
    { label: "Coût total", value: fmt(kpis.totalCost), unit: "€" },
    { label: "Coût / km moyen", value: kpis.costPerKm !== null ? (Math.round(kpis.costPerKm * 100) / 100).toString().replace(".", ",") : "—", unit: "€/km" },
    { label: "Dépense · 12 mois", value: fmt(kpis.spend12m), unit: "€" },
    { label: "Entretien · 12 mois", value: fmt(kpis.maint12m), unit: "€" },
  ];

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 1000 }}>
        <PageHead
          title="Coût"
          sub="Ce que ton matériel te coûte, et où part l'argent."
        />

        {!hasData ? (
          <BiCard pad={40} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Pas encore de données de coût</div>
            <div style={{ fontSize: 13, color: "var(--bi-muted)" }}>
              Ajoute le prix de tes pièces et enregistre tes entretiens pour voir l&apos;analyse ici.
            </div>
          </BiCard>
        ) : (
          <>
            {/* KPI strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--bi-line)", borderRadius: 16, overflow: "hidden", marginBottom: 22 }} className="bi-grid-4">
              {KPIS.map(({ label, value, unit }) => (
                <div key={label} style={{ background: "var(--bi-card)", padding: "18px 22px" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--bi-muted)" }}>
                    {label}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 8 }}>
                    <Mono style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.5 }}>{value}</Mono>
                    <span style={{ fontSize: 11, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bi-grid-split-lg" style={{ gap: 14, alignItems: "start" }}>
              {/* Classement pièces par €/km */}
              <BiCard pad={0}>
                <div style={{ padding: "20px 22px 12px", borderBottom: "1px solid var(--bi-line)" }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Pièces les plus coûteuses au km</div>
                  <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>
                    Le vrai indicateur de rentabilité d&apos;une pièce
                  </div>
                </div>

                {topByCpm.length === 0 ? (
                  <div style={{ padding: "28px 22px", textAlign: "center", color: "var(--bi-muted)", fontSize: 13 }}>
                    Renseigne le prix et le kilométrage de tes pièces pour voir ce classement.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <div style={{ minWidth: 480 }}>
                      <div style={{ padding: "8px 22px", display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.7fr 0.8fr", gap: 12, fontSize: 10.5, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--bi-line)" }}>
                        <span>Pièce</span>
                        <span style={{ textAlign: "right" }}>Km</span>
                        <span style={{ textAlign: "right" }}>Coût</span>
                        <span style={{ textAlign: "right" }}>€/km</span>
                      </div>
                      {topByCpm.map((c, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.7fr 0.8fr", gap: 12, padding: "13px 22px", alignItems: "center", borderBottom: i < topByCpm.length - 1 ? "1px solid var(--bi-line)" : "none" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>{c.bikeName} · {CATEGORY_LABELS[c.category] ?? c.category}</div>
                          </div>
                          <Mono style={{ fontSize: 12, textAlign: "right", color: "var(--bi-muted)" }}>{fmt(c.kmUsed)}</Mono>
                          <Mono style={{ fontSize: 12, textAlign: "right" }}>{c.cost !== null ? `${c.cost} €` : "—"}</Mono>
                          <Mono style={{ fontSize: 12.5, textAlign: "right", fontWeight: 600 }}>{eurPerKm(c.costPerKm)}</Mono>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </BiCard>

              {/* Colonne droite */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Coût par vélo */}
                <BiCard pad={0}>
                  <div style={{ padding: "18px 20px 10px", borderBottom: "1px solid var(--bi-line)" }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Coût par vélo</div>
                  </div>
                  {byBike.map((b, i) => (
                    <Link key={b.id} href={`/bikes/${b.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 20px", textDecoration: "none", color: "inherit", borderBottom: i < byBike.length - 1 ? "1px solid var(--bi-line)" : "none" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                        <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>
                          {fmt(b.totalKm)} km · {b.costPerKm !== null ? `${eurPerKm(b.costPerKm)} €/km` : "—"}
                        </div>
                      </div>
                      <Mono style={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{fmt(b.totalCost)} €</Mono>
                    </Link>
                  ))}
                </BiCard>

                {/* Répartition par catégorie */}
                {categoryBreakdown.length > 0 && (
                  <BiCard pad={20}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Répartition par catégorie</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {categoryBreakdown.map(({ category, total, pct }) => (
                        <div key={category}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 500 }}>{CATEGORY_LABELS[category] ?? category}</span>
                            <Mono style={{ fontSize: 12, color: "var(--bi-muted)" }}>{fmt(total)} € · {pct}%</Mono>
                          </div>
                          <div style={{ height: 6, borderRadius: 999, background: "var(--bi-line)", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: CATEGORY_COLORS[category] ?? "var(--bi-muted)", borderRadius: 999 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </BiCard>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
