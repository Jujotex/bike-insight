import {
  Bars,
  BiCard,
  BiLabel,
  CardHead,
  EmptyState,
  ListRow,
  Metric,
  Mono,
  PageHead,
} from "@/components/bi/ui";
import { redirect } from "next/navigation";
import { getCostData } from "@/lib/data";
import { BikePicker } from "@/components/bi/bike-picker";
import { categoryColor, categoryLabel } from "@/lib/design/categories";
import { fmtDelay, fmtNum } from "@/lib/format";
import {
  KM_PER_YEAR,
  MAINTENANCE_COST_PER_KM,
  benchmarkVerdict,
  formatRange,
  verdictColor,
  verdictLabel,
  type BenchmarkRange,
} from "@/lib/benchmarks";

/** Une ligne « ta valeur face à la fourchette de référence ». */
function BenchmarkRow({
  value,
  range,
  format,
}: {
  value: number | null;
  range: BenchmarkRange;
  format: (v: number) => string;
}) {
  const verdict = benchmarkVerdict(value, range);
  return (
    <div style={{ padding: "14px 16px", border: "1px solid var(--bi-line)", borderRadius: 14, background: "var(--bi-bg)" }}>
      <div style={{ fontSize: 12, color: "var(--bi-muted)", lineHeight: 1.4 }}>{range.label}</div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <Mono style={{ fontSize: 20, fontWeight: 600 }}>{value !== null ? format(value) : "—"}</Mono>
        <Mono style={{ fontSize: 12, color: "var(--bi-muted)" }}>/ {formatRange(range)}</Mono>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: verdictColor(verdict), marginTop: 6 }}>
        {verdictLabel(verdict)}
      </div>
    </div>
  );
}

export default async function CostPage({ searchParams }: { searchParams: Promise<{ bike?: string }> }) {
  const { bike } = await searchParams;
  const data = await getCostData(bike || null);
  if (!data) redirect("/login");

  const { kpis, byBike, breakdown, activity, projection, insights, hasData, allBikes, selectedBikeId } = data;

  return (
    <div className="bi-page">
      <PageHead title="Coût" sub="Ce que ton vélo te coûte à entretenir." />

      <BikePicker bikes={allBikes} selected={selectedBikeId} basePath="/cout" />

      <div className="bi-stack">
        {!hasData ? (
          <EmptyState
            title={"Pas encore de dépense d'entretien"}
            text="Enregistre un remplacement de pièce ou un entretien, et tu verras ici ce que ton vélo te coûte au fil du temps."
          />
        ) : (
          <>
            {/* Deux chiffres clés */}
            <div className="bi-grid-2">
              <BiCard>
                <BiLabel>Dépensé en entretien</BiLabel>
                <div style={{ marginTop: 10 }}>
                  <Metric value={fmtNum(kpis.spendTotal)} unit="€" />
                </div>
                <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>remplacements + entretiens</div>
              </BiCard>
              <BiCard>
                <BiLabel>Cette année</BiLabel>
                <div style={{ marginTop: 10 }}>
                  <Metric value={fmtNum(kpis.spend12m)} unit="€" />
                </div>
                <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>sur 12 mois</div>
              </BiCard>
            </div>

            {/* Où tu te situes — repères statiques (lib/benchmarks.ts).
                `getCostData` calculait déjà `costPerKm` et `km12m` depuis juillet, mais
                rien ne les affichait : le calcul tournait dans le vide. Les fourchettes
                sont volontairement statiques — le §5.4 de l'API Policy Strava interdit
                d'agréger les données des athlètes pour en tirer des moyennes. */}
            {kpis.costPerKm !== null && (
              <BiCard>
                <BiLabel>Où tu te situes</BiLabel>
                <div className="bi-grid-2" style={{ marginTop: 14 }}>
                  <BenchmarkRow value={kpis.costPerKm} range={MAINTENANCE_COST_PER_KM} format={(v) => `${v.toFixed(3).replace(".", ",")} €/km`} />
                  <BenchmarkRow value={kpis.km12m} range={KM_PER_YEAR} format={(v) => `${fmtNum(Math.round(v))} km/an`} />
                </div>
                <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 14, lineHeight: 1.5 }}>
                  Fourchettes indicatives pour un cycliste route régulier. Être en dehors
                  n&apos;est ni bon ni mauvais : un coût faible peut vouloir dire un entretien
                  repoussé, un coût élevé du matériel haut de gamme.
                </div>
              </BiCard>
            )}

            {/* Activité 3 mois + Où part ton argent — côte à côte */}
            {(breakdown.length > 0 || activity.total > 0) && (
              <div className={activity.total > 0 && breakdown.length > 0 ? "bi-grid-2" : undefined}>
                {/* Où part ton argent */}
                {breakdown.length > 0 && (
                  <BiCard pad={0}>
                    <CardHead title="Où part ton argent" sub={"Répartition de tes dépenses d'entretien"} />
                    <div style={{ padding: "20px 22px" }}>
                      <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", gap: 2, marginBottom: 16 }}>
                        {breakdown.filter(b => b.pct > 0).map(({ key, pct }) => (
                          <div key={key} style={{ width: `${pct}%`, background: categoryColor(key) }} />
                        ))}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {breakdown.map(({ key, pct, items }) => (
                          <div key={key}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ width: 8, height: 8, borderRadius: 999, background: categoryColor(key), flexShrink: 0 }} />
                              <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{categoryLabel(key)}</span>
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
                {/* Activité · 3 mois */}
                {activity.total > 0 && (
                  <BiCard>
                    <BiLabel>Activité · 3 mois</BiLabel>
                    <div style={{ marginTop: 10 }}>
                      <Metric value={fmtNum(activity.total)} unit="km" />
                    </div>
                    <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>sur les 3 derniers mois</div>
                    <div style={{ marginTop: 14 }}>
                      <Bars values={activity.chart} height={60} gap={3} />
                    </div>
                  </BiCard>
                )}
              </div>
            )}

            {/* Ce qui t'attend — projection */}
            {projection.upcoming.length > 0 && (
              <BiCard pad={0} style={{ overflow: "hidden" }}>
                <CardHead
                  title={"Ce qui t'attend"}
                  sub={"Pièces à remplacer et entretiens à venir, d'après ton rythme"}
                  right={
                    <>
                      <Metric value={fmtNum(projection.total12m)} unit="€" size="sm" align="right" />
                      <BiLabel style={{ marginTop: 2 }}>à prévoir · 12 mois</BiLabel>
                    </>
                  }
                />
                <div className="bi-rows">
                  {projection.upcoming.map((u, i) => (
                    <ListRow
                      key={i}
                      href={u.href}
                      accent={categoryColor(u.key)}
                      title={
                        <>
                          {u.name}
                          {u.key === "entretien" && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", color: "var(--bi-muted)", flexShrink: 0, marginLeft: 8 }}>Entretien</span>
                          )}
                        </>
                      }
                      sub={u.key === "entretien" && u.weeksUntil <= 0 ? "à faire" : fmtDelay(u.weeksUntil)}
                      trailing={<Mono style={{ fontSize: 13, fontWeight: 600, color: "var(--bi-muted)", flexShrink: 0 }}>{fmtNum(u.cost)} €</Mono>}
                    />
                  ))}
                </div>
                <div style={{ padding: "10px 22px 14px", fontSize: 11, color: "var(--bi-muted)", borderTop: "1px solid var(--bi-line)", lineHeight: 1.5 }}>
                  Estimation basée sur ton rythme récent, le prix de tes pièces et le coût atelier des entretiens.
                </div>
              </BiCard>
            )}

            {/* Bilan entretien chaîne — économisé vs gaspillé, en un seul bloc */}
            {(insights.onTimeChains > 0 || insights.lateChains > 0) && (
              <BiCard>
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
                <div className="bi-split-2">
                  <div style={{ flex: 1 }}>
                    <BiLabel style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--bi-ok)" }} />Économisé
                    </BiLabel>
                    <div style={{ marginTop: 6 }}>
                      <Metric value={fmtNum(insights.transmissionSavings)} unit="€" size="sm" color="var(--bi-ok)" />
                    </div>
                  </div>
                  <div className="bi-split-divider" />
                  <div style={{ flex: 1 }}>
                    <BiLabel style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--bi-warn)" }} />Gaspillé (évitable)
                    </BiLabel>
                    <div style={{ marginTop: 6 }}>
                      <Metric value={fmtNum(insights.wastedTransmission)} unit="€" size="sm" color="var(--bi-warn)" />
                    </div>
                  </div>
                </div>
              </BiCard>
            )}

            {/* Dépense par vélo (si plusieurs) */}
            {byBike.length > 1 && (
              <BiCard pad={0} style={{ overflow: "hidden" }}>
                <CardHead title="Dépense par vélo" />
                <div className="bi-rows">
                  {byBike.map((b) => (
                    <ListRow
                      key={b.id}
                      href={`/bikes/${b.id}`}
                      title={b.name}
                      sub={`${fmtNum(b.totalKm)} km parcourus`}
                      trailing={<Mono style={{ fontSize: 14, fontWeight: 600, flexShrink: 0 }}>{fmtNum(b.spend)} €</Mono>}
                    />
                  ))}
                </div>
              </BiCard>
            )}
          </>
        )}

        <BiCard pad={0} style={{ overflow: "hidden" }}>
          <div className="bi-rows">
            <ListRow
              href={`/historique?bike=${selectedBikeId}`}
              title="Historique"
              sub="Tes remplacements et entretiens, datés et chiffrés"
            />
          </div>
        </BiCard>
      </div>
    </div>
  );
}
