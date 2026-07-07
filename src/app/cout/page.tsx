import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, PageHead } from "@/components/bi/ui";
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

export default async function CostPage() {
  const data = await getCostData();
  if (!data) redirect("/login");

  const { kpis, byBike, categoryBreakdown, insights, hasData } = data;

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 820 }}>
        <PageHead title="Coût" sub="Ce que ton vélo te coûte, en clair." />

        {!hasData ? (
          <BiCard pad={40} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Pas encore de données de coût</div>
            <div style={{ fontSize: 13, color: "var(--bi-muted)" }}>
              Ajoute le prix de tes pièces et enregistre tes entretiens pour voir combien te coûte ton vélo.
            </div>
          </BiCard>
        ) : (
          <>
            {/* Deux chiffres clés — même langage que les stats de la fiche vélo */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, background: "var(--bi-line)", borderRadius: 18, overflow: "hidden", marginBottom: 14 }} className="bi-grid-2">
              <div style={{ background: "var(--bi-card)", padding: "20px 22px" }}>
                <BiLabel>Coût total</BiLabel>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                  <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }}>{fmt(kpis.totalCost)}</Mono>
                  <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--bi-font-mono)" }}>€</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 4 }}>depuis le début</div>
              </div>
              <div style={{ background: "var(--bi-card)", padding: "20px 22px" }}>
                <BiLabel>Dépensé cette année</BiLabel>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                  <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }}>{fmt(kpis.spend12m)}</Mono>
                  <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--bi-font-mono)" }}>€</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 4 }}>sur 12 mois</div>
              </div>
            </div>

            {/* Économisé grâce à l'entretien — carte blanche, badge d'icône neutre */}
            <BiCard pad={22} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <BiLabel>Économisé grâce à l&apos;entretien</BiLabel>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                    <Mono style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.6, color: "var(--bi-ok)" }}>{fmt(insights.transmissionSavings)}</Mono>
                    <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--bi-font-mono)" }}>€</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 12, lineHeight: 1.5 }}>
                {insights.onTimeChains > 0
                  ? `En changeant ta chaîne à temps (${insights.onTimeChains}×), tu as évité d'abîmer ta cassette et tes plateaux, bien plus chers.`
                  : "Change ta chaîne avant qu'elle soit trop usée : elle protège ta cassette et tes plateaux, bien plus chers à remplacer."}
              </div>
            </BiCard>

            {/* Où part ton argent */}
            {categoryBreakdown.length > 0 && (
              <BiCard pad={0} style={{ marginBottom: 14 }}>
                <div style={{ padding: "20px 22px 14px", borderBottom: "1px solid var(--bi-line)" }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Où part ton argent</div>
                  <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>Répartition du coût de tes pièces</div>
                </div>
                <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {categoryBreakdown.map(({ category, total, pct }) => (
                    <div key={category} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 4, height: 26, background: CATEGORY_COLORS[category] ?? "var(--bi-muted)", borderRadius: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{CATEGORY_LABELS[category] ?? category}</span>
                          <Mono style={{ fontSize: 12.5, color: "var(--bi-muted)" }}>{fmt(total)} €</Mono>
                        </div>
                        <div style={{ height: 4, borderRadius: 999, background: "var(--bi-line)", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: CATEGORY_COLORS[category] ?? "var(--bi-muted)", borderRadius: 999 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </BiCard>
            )}

            {/* Coût par vélo (si plusieurs) */}
            {byBike.length > 1 && (
              <BiCard pad={0}>
                <div style={{ padding: "20px 22px 14px", borderBottom: "1px solid var(--bi-line)" }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Coût par vélo</div>
                </div>
                {byBike.map((b, i) => (
                  <Link key={b.id} href={`/bikes/${b.id}`} className="bi-component-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 22px", textDecoration: "none", color: "inherit", borderTop: i === 0 ? "none" : "1px solid var(--bi-line)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 1 }}>{fmt(b.totalKm)} km parcourus</div>
                    </div>
                    <Mono style={{ fontSize: 14, fontWeight: 600, flexShrink: 0 }}>{fmt(b.totalCost)} €</Mono>
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
