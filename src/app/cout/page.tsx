import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, PageHead } from "@/components/bi/ui";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCostData } from "@/lib/data";
import { BikePicker } from "@/components/bi/bike-picker";

const LABELS: Record<string, string> = {
  transmission: "Transmission",
  freinage: "Freinage",
  suspension: "Suspension",
  roues: "Pneumatiques",
  cockpit: "Cockpit",
  eclairage: "Éclairage",
  autre: "Autre",
  entretien: "Entretien courant",
};

const COLORS: Record<string, string> = {
  transmission: "var(--bi-accent)",
  freinage: "var(--bi-ok)",
  roues: "var(--bi-warn)",
  suspension: "#8B7CF8",
  cockpit: "var(--bi-muted)",
  eclairage: "var(--bi-muted)",
  autre: "var(--bi-muted)",
  entretien: "var(--bi-ink)",
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

function delay(w: number): string {
  if (w <= 0) return "à remplacer";
  if (w < 5) return `dans ${w} sem.`;
  return `dans ${Math.round(w / 4)} mois`;
}

export default async function CostPage({ searchParams }: { searchParams: Promise<{ bike?: string }> }) {
  const { bike } = await searchParams;
  const data = await getCostData(bike || null);
  if (!data) redirect("/login");

  const { kpis, byBike, breakdown, activity, projection, insights, hasData, allBikes, selectedBikeId } = data;
  const maxActivity = Math.max(...activity.chart, 1);

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page">
        <PageHead title="Coût" sub="Ce que ton vélo te coûte à entretenir." />

        <BikePicker bikes={allBikes} selected={selectedBikeId} basePath="/cout" />

        {!hasData ? (
          <BiCard pad={40} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Pas encore de dépense d&apos;entretien</div>
            <div style={{ fontSize: 13, color: "var(--bi-muted)" }}>
              Enregistre un remplacement de pièce ou un entretien, et tu verras ici ce que ton vélo te coûte au fil du temps.
            </div>
          </BiCard>
        ) : (
          <>
            {/* Deux chiffres clés */}
            <div style={{ display: "grid", gap: 1, background: "var(--bi-line)", borderRadius: 18, overflow: "hidden", marginBottom: 14 }} className="bi-grid-2">
              <div style={{ background: "var(--bi-card)", padding: "20px 22px" }}>
                <BiLabel>Dépensé en entretien</BiLabel>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                  <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }}>{fmt(kpis.spendTotal)}</Mono>
                  <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--bi-font-mono)" }}>€</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>remplacements + entretiens</div>
              </div>
              <div style={{ background: "var(--bi-card)", padding: "20px 22px" }}>
                <BiLabel>Cette année</BiLabel>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                  <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }}>{fmt(kpis.spend12m)}</Mono>
                  <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--bi-font-mono)" }}>€</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>sur 12 mois</div>
              </div>
            </div>

            {/* Activité · 3 mois — vue d'ensemble */}
            {activity.total > 0 && (
              <BiCard pad={22} style={{ marginBottom: 14 }}>
                <BiLabel>Activité · 3 mois</BiLabel>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                  <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }}>{fmt(activity.total)}</Mono>
                  <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--bi-font-mono)" }}>km</span>
                </div>
                <div style={{ marginTop: 14, height: 60, display: "flex", alignItems: "flex-end", gap: 3 }}>
                  {activity.chart.map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${Math.max(2, Math.round((h / maxActivity) * 100))}%`, background: h > maxActivity * 0.6 ? "var(--bi-accent)" : h > 0 ? "#D9D8D2" : "var(--bi-line)", borderRadius: 2, minHeight: 2 }} />
                  ))}
                </div>
              </BiCard>
            )}

            {/* Ce qui t'attend — projection */}
            {projection.upcoming.length > 0 && (
              <BiCard pad={0} style={{ marginBottom: 14 }}>
                <div style={{ padding: "20px 22px 14px", borderBottom: "1px solid var(--bi-line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Ce qui t&apos;attend</div>
                    <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>Pièces à remplacer et entretiens à venir, d&apos;après ton rythme</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
                      <Mono style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>{fmt(projection.total12m)}</Mono>
                      <span style={{ fontSize: 11, color: "var(--bi-muted)", fontFamily: "var(--bi-font-mono)" }}>€</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--bi-muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>à prévoir · 12 mois</div>
                  </div>
                </div>
                {projection.upcoming.map((u, i) => (
                  <Link key={i} href={u.href} className="bi-component-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px", borderTop: i === 0 ? "none" : "1px solid var(--bi-line)", textDecoration: "none", color: "inherit" }}>
                    <div style={{ width: 4, height: 26, background: COLORS[u.key] ?? "var(--bi-muted)", borderRadius: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8 }}>
                        {u.name}
                        {u.key === "entretien" && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", color: "var(--bi-muted)", flexShrink: 0 }}>Entretien</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>
                        {u.key === "entretien" && u.weeksUntil <= 0 ? "à faire" : delay(u.weeksUntil)}
                      </div>
                    </div>
                    <Mono style={{ fontSize: 13, fontWeight: 600, color: "var(--bi-muted)", flexShrink: 0 }}>{fmt(u.cost)} €</Mono>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M9 6l6 6-6 6"/></svg>
                  </Link>
                ))}
                <div style={{ padding: "10px 22px 14px", fontSize: 11, color: "var(--bi-muted)", borderTop: "1px solid var(--bi-line)", lineHeight: 1.5 }}>
                  Estimation basée sur ton rythme récent, le prix de tes pièces et le coût atelier des entretiens.
                </div>
              </BiCard>
            )}

            {/* Bilan entretien chaîne — économisé vs gaspillé, en un seul bloc */}
            {(insights.onTimeChains > 0 || insights.lateChains > 0) && (
              <BiCard pad={22} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 14, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <BiLabel>Bilan entretien chaîne</BiLabel>
                      <span className="bi-info">
                        <button className="bi-info-btn" type="button" aria-label="Pourquoi changer sa chaîne à temps ?">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                        </button>
                        <span className="bi-info-pop">
                          {"Ta chaîne s'allonge et s'use avec les kilomètres. Une chaîne trop usée « lime » les dents de ta cassette et de tes plateaux. Du coup, au lieu de changer juste la chaîne (~30 €), tu dois aussi remplacer cassette + plateaux (souvent 100 € et plus). La changer à temps protège ces pièces et te coûte bien moins cher au final."}
                        </span>
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>Changer ta chaîne à temps protège ta transmission</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "stretch" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--bi-ok)" }} />Économisé
                    </div>
                    <Mono style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.5, color: "var(--bi-ok)", marginTop: 6, display: "block" }}>{fmt(insights.transmissionSavings)} €</Mono>
                  </div>
                  <div style={{ width: 1, background: "var(--bi-line)", margin: "0 20px" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--bi-warn)" }} />Gaspillé (évitable)
                    </div>
                    <Mono style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.5, color: "var(--bi-warn)", marginTop: 6, display: "block" }}>{fmt(insights.wastedTransmission)} €</Mono>
                  </div>
                </div>
              </BiCard>
            )}

            {/* Où part ton argent */}
            {breakdown.length > 0 && (
              <BiCard pad={0} style={{ marginBottom: 14 }}>
                <div style={{ padding: "20px 22px 14px", borderBottom: "1px solid var(--bi-line)" }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Où part ton argent</div>
                  <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>Répartition de tes dépenses d&apos;entretien</div>
                </div>
                <div style={{ padding: "20px 22px" }}>
                  {/* Barre empilée : proportions en un coup d'œil */}
                  <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", gap: 2, marginBottom: 16 }}>
                    {breakdown.filter(b => b.pct > 0).map(({ key, pct }) => (
                      <div key={key} style={{ width: `${pct}%`, background: COLORS[key] ?? "var(--bi-muted)" }} />
                    ))}
                  </div>
                  {/* Légende détaillée : catégorie + détail par opération */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {breakdown.map(({ key, pct, items }) => (
                      <div key={key}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 999, background: COLORS[key] ?? "var(--bi-muted)", flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{LABELS[key] ?? key}</span>
                          <Mono style={{ fontSize: 14, fontWeight: 600, flexShrink: 0 }}>{pct}%</Mono>
                        </div>
                        {items.length > 0 && (
                          <div style={{ marginLeft: 18, marginTop: 4, fontSize: 12, color: "var(--bi-muted)", lineHeight: 1.5 }}>
                            {items.map((it) => it.label).join(" · ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </BiCard>
            )}

            {/* Dépense par vélo (si plusieurs) */}
            {byBike.length > 1 && (
              <BiCard pad={0}>
                <div style={{ padding: "20px 22px 14px", borderBottom: "1px solid var(--bi-line)" }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Dépense par vélo</div>
                </div>
                {byBike.map((b, i) => (
                  <Link key={b.id} href={`/bikes/${b.id}`} className="bi-component-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 22px", textDecoration: "none", color: "inherit", borderTop: i === 0 ? "none" : "1px solid var(--bi-line)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 1 }}>{fmt(b.totalKm)} km parcourus</div>
                    </div>
                    <Mono style={{ fontSize: 14, fontWeight: 600, flexShrink: 0 }}>{fmt(b.spend)} €</Mono>
                  </Link>
                ))}
              </BiCard>
            )}

          </>
        )}
      </div>
    </AppShell>
  );
}
