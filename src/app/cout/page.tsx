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

// €/km → €/1000 km, plus lisible pour les petites valeurs
function per1000(v: number) {
  return (v * 1000).toFixed(1).replace(".", ",");
}

export default async function CostPage() {
  const data = await getCostData();
  if (!data) redirect("/login");

  const { kpis, byBike, topByCpm, categoryBreakdown, insights, hasData } = data;

  const KPIS: { label: string; value: string; unit: string }[] = [
    { label: "Coût total", value: fmt(kpis.totalCost), unit: "€" },
    { label: "Coût / 1000 km", value: kpis.costPerKm !== null ? Math.round(kpis.costPerKm * 1000).toString() : "—", unit: "€" },
    { label: "Dépense · 12 mois", value: fmt(kpis.spend12m), unit: "€" },
    { label: "Entretien · 12 mois", value: fmt(kpis.maint12m), unit: "€" },
  ];

  const preventionTotal = insights.preventionCost + insights.repairCost;
  const preventionPct = preventionTotal > 0 ? Math.round((insights.preventionCost / preventionTotal) * 100) : 0;

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

            {/* Bénéfices d'entretien */}
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bi-muted)", marginBottom: 12 }}>
              Ce que ton entretien te rapporte
            </div>

            {/* Héro : économie transmission */}
            <div style={{
              display: "flex", alignItems: "center", gap: 18,
              padding: "22px 24px", borderRadius: 18, marginBottom: 14,
              background: "color-mix(in srgb, var(--bi-ok) 7%, var(--bi-card))",
              border: "1px solid color-mix(in srgb, var(--bi-ok) 22%, var(--bi-line))",
            }}>
              <div style={{ width: 50, height: 50, borderRadius: 15, background: "color-mix(in srgb, var(--bi-ok) 15%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--bi-muted)" }}>Économie transmission</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 5 }}>
                  <Mono style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1, color: "var(--bi-ok)" }}>{fmt(insights.transmissionSavings)}</Mono>
                  <span style={{ fontSize: 13, color: "var(--bi-muted)" }}>€ préservés</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 5, lineHeight: 1.5 }}>
                  {insights.onTimeChains > 0
                    ? `${insights.onTimeChains} chaîne${insights.onTimeChains > 1 ? "s" : ""} changée${insights.onTimeChains > 1 ? "s" : ""} à temps — cassette et plateaux protégés de l'usure.`
                    : "Change ta chaîne avant sa durée de vie estimée : elle protège ta cassette et tes plateaux."}
                </div>
              </div>
            </div>

            {/* Longévité + Prévention */}
            <div className="bi-grid-2" style={{ marginBottom: 6 }}>
              {/* Longévité gagnée */}
              <BiCard pad={20}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "color-mix(in srgb, #8B7CF8 14%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8B7CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 6l-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" /></svg>
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--bi-muted)" }}>Longévité gagnée</div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 12 }}>
                  <Mono style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>{insights.longevityKm > 0 ? `+${fmt(insights.longevityKm)}` : "0"}</Mono>
                  <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>km au-delà des estimations</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 6, lineHeight: 1.5 }}>
                  {insights.longevityParts > 0
                    ? `${insights.longevityParts} pièce${insights.longevityParts > 1 ? "s ont" : " a"} tenu plus longtemps que prévu.`
                    : "Aucune pièce n'a encore dépassé son estimation."}
                </div>
              </BiCard>

              {/* Prévention vs réparation */}
              <BiCard pad={20}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "color-mix(in srgb, var(--bi-ok) 14%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--bi-muted)" }}>Prévention vs réparation</div>
                </div>
                {preventionTotal === 0 ? (
                  <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 12 }}>Pas encore de dépenses enregistrées.</div>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 12 }}>
                      <Mono style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>{preventionPct}</Mono>
                      <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>% en prévention</span>
                    </div>
                    <div style={{ display: "flex", height: 6, borderRadius: 999, overflow: "hidden", marginTop: 12, background: "var(--bi-line)" }}>
                      <div style={{ width: `${preventionPct}%`, background: "var(--bi-ok)" }} />
                      <div style={{ flex: 1, background: "var(--bi-warn)" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--bi-muted)" }}>
                      <span><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 999, background: "var(--bi-ok)", marginRight: 5 }} />Entretien {fmt(insights.preventionCost)} €</span>
                      <span>Pièces {fmt(insights.repairCost)} €<span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 999, background: "var(--bi-warn)", marginLeft: 5 }} /></span>
                    </div>
                  </>
                )}
              </BiCard>
            </div>

            {/* Hypothèse de l'estimation transmission */}
            <div style={{ fontSize: 10.5, color: "var(--bi-muted)", marginBottom: 22, marginTop: 8, lineHeight: 1.5 }}>
              Estimation transmission : ~2 chaînes changées à temps préservent 1 cassette (prix réel si connu, sinon 90 €) + plateaux (~50 €).
            </div>

            <div className="bi-grid-split-lg" style={{ gap: 14, alignItems: "start" }}>
              {/* Classement pièces par €/km */}
              <BiCard pad={0}>
                <div style={{ padding: "20px 22px 12px", borderBottom: "1px solid var(--bi-line)" }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Pièces les plus coûteuses</div>
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
                        <span style={{ textAlign: "right" }}>€/1000 km</span>
                      </div>
                      {topByCpm.map((c, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.7fr 0.8fr", gap: 12, padding: "13px 22px", alignItems: "center", borderBottom: i < topByCpm.length - 1 ? "1px solid var(--bi-line)" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <div style={{ width: 4, height: 28, background: CATEGORY_COLORS[c.category] ?? "var(--bi-muted)", borderRadius: 2, flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>{c.bikeName} · {CATEGORY_LABELS[c.category] ?? c.category}</div>
                            </div>
                          </div>
                          <Mono style={{ fontSize: 12, textAlign: "right", color: "var(--bi-muted)" }}>{fmt(c.kmUsed)}</Mono>
                          <Mono style={{ fontSize: 12, textAlign: "right" }}>{c.cost !== null ? `${c.cost} €` : "—"}</Mono>
                          <Mono style={{ fontSize: 12.5, textAlign: "right", fontWeight: 600 }}>{per1000(c.costPerKm)}</Mono>
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
                          {fmt(b.totalKm)} km · {b.costPerKm !== null ? `${per1000(b.costPerKm)} €/1000 km` : "—"}
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
