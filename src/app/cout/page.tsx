import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, PageHead } from "@/components/bi/ui";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCostData } from "@/lib/data";

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
  if (w < 5) return `dans ~${w} sem.`;
  return `dans ~${Math.round(w / 4)} mois`;
}

export default async function CostPage() {
  const data = await getCostData();
  if (!data) redirect("/login");

  const { kpis, byBike, breakdown, projection, insights, hasData } = data;

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 820 }}>
        <PageHead title="Coût" sub="Ce que ton vélo te coûte à entretenir." />

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
                <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 4 }}>remplacements + entretiens</div>
              </div>
              <div style={{ background: "var(--bi-card)", padding: "20px 22px" }}>
                <BiLabel>Cette année</BiLabel>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                  <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }}>{fmt(kpis.spend12m)}</Mono>
                  <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--bi-font-mono)" }}>€</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 4 }}>sur 12 mois</div>
              </div>
            </div>

            {/* Ce qui t'attend — projection */}
            {projection.upcoming.length > 0 && (
              <BiCard pad={0} style={{ marginBottom: 14 }}>
                <div style={{ padding: "20px 22px 14px", borderBottom: "1px solid var(--bi-line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Ce qui t&apos;attend</div>
                    <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>Estimé d&apos;après ton rythme et l&apos;usure de tes pièces</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
                      <Mono style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>{fmt(projection.total12m)}</Mono>
                      <span style={{ fontSize: 11, color: "var(--bi-muted)", fontFamily: "var(--bi-font-mono)" }}>€</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--bi-muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>à prévoir · 12 mois</div>
                  </div>
                </div>
                {projection.upcoming.map((u, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 22px", borderTop: i === 0 ? "none" : "1px solid var(--bi-line)" }}>
                    <div style={{ width: 4, height: 26, background: COLORS[u.key] ?? "var(--bi-muted)", borderRadius: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>{delay(u.weeksUntil)}</div>
                    </div>
                    <Mono style={{ fontSize: 13, fontWeight: 600, color: "var(--bi-muted)", flexShrink: 0 }}>~{fmt(u.cost)} €</Mono>
                  </div>
                ))}
                <div style={{ padding: "10px 22px 14px", fontSize: 10.5, color: "var(--bi-muted)", borderTop: "1px solid var(--bi-line)", lineHeight: 1.5 }}>
                  Estimation basée sur ton rythme récent et le prix de tes pièces — pas une facture ferme.
                </div>
              </BiCard>
            )}

            {/* Bilan entretien chaîne — économisé vs gaspillé, en un seul bloc */}
            {(insights.onTimeChains > 0 || insights.lateChains > 0) && (
              <BiCard pad={22} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <BiLabel>Bilan entretien chaîne</BiLabel>
                    <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>Changer ta chaîne à temps protège ta transmission</div>
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
                  <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>Répartition de tes dépenses d&apos;entretien</div>
                </div>
                <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {breakdown.map(({ key, total, pct }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 4, height: 26, background: COLORS[key] ?? "var(--bi-muted)", borderRadius: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{LABELS[key] ?? key}</span>
                          <Mono style={{ fontSize: 12.5, color: "var(--bi-muted)" }}>{fmt(total)} €</Mono>
                        </div>
                        <div style={{ height: 4, borderRadius: 999, background: "var(--bi-line)", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: COLORS[key] ?? "var(--bi-muted)", borderRadius: 999 }} />
                        </div>
                      </div>
                    </div>
                  ))}
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
                  <Link key={b.id} href={`/bikes/${b.id}`} className="bi-component-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 22px", textDecoration: "none", color: "inherit", borderTop: i === 0 ? "none" : "1px solid var(--bi-line)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 1 }}>{fmt(b.totalKm)} km parcourus</div>
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
