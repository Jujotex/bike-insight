import { AppShell } from "@/components/bi/app-shell";
import { BiCard, BiLabel, Mono, Dot, PageHead } from "@/components/bi/ui";

const HISTORY = [
  { label: "Installation", date: "14 sept. 2024", km: "0 km", status: "ok" as const },
  { label: "Vérification visuelle", date: "12 fév. 2025", km: "1 240 km", status: "ok" as const },
  { label: "Mesure usure (jauge)", date: "14 avr. 2025", km: "2 100 km", status: "warn" as const },
  { label: "Alerte 90 %", date: "08 mai 2025", km: "2 580 km", status: "bad" as const },
];
const STATUS_COLORS = { ok: "var(--bi-muted)", warn: "var(--bi-warn)", bad: "var(--bi-bad)" };

export default function ComponentDetailPage() {
  return (
    <AppShell>
      <div style={{ padding: "24px 28px 40px", maxWidth: 1100 }}>
        <PageHead
          title="Chaîne · Shimano Ultegra"
          breadcrumb={["Mes vélos", "Canyon Aeroad", "Chaîne"]}
          sub="CN-HG701 · installée le 14 sept. 2024"
          actions={
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "9px 14px", background: "transparent", color: "var(--bi-ink)", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 12.5, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>Modifier</button>
              <button style={{ padding: "9px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>Marquer remplacé</button>
            </div>
          }
        />

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
          {/* Hero dark card */}
          <div style={{ background: "#0E0E10", color: "#fff", borderRadius: 18, padding: 32, position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-bad)", letterSpacing: "0.07em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                  <Dot color="var(--bi-bad)" size={6} /> À remplacer
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>Composant #03 sur Canyon Aeroad</div>
              </div>
              <Mono style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>ID 8a73f1</Mono>
            </div>

            <div style={{ marginTop: 32, display: "flex", alignItems: "baseline", gap: 10 }}>
              <Mono style={{ fontSize: 100, fontWeight: 400, letterSpacing: -4, lineHeight: 1 }}>94</Mono>
              <Mono style={{ fontSize: 28, color: "rgba(255,255,255,0.45)" }}>%</Mono>
              <div style={{ flex: 1 }} />
              <div style={{ textAlign: "right" }}>
                <Mono style={{ display: "block", fontSize: 20, fontWeight: 500 }}>2 840 / 3 000</Mono>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>km · ~160 km restants</span>
              </div>
            </div>

            <div style={{ marginTop: 22, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
              <div style={{ width: "94%", height: "100%", background: "var(--bi-bad)", borderRadius: 999 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-jetbrains-mono)" }}>
              <span>0 km</span><span>1 000</span><span>2 000</span><span>3 000 km</span>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Recommendation */}
            <div style={{ padding: 22, border: "1.5px solid var(--bi-bad)", borderRadius: 16, background: "rgba(200,54,46,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bi-bad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4M12 17h.01M3 12a9 9 0 1018 0 9 9 0 00-18 0z" /></svg>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--bi-bad)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Recommandation</span>
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 500, lineHeight: 1.45 }}>Remplacer maintenant.</div>
              <div style={{ fontSize: 12.5, color: "var(--bi-muted)", marginTop: 6, lineHeight: 1.5 }}>
                Continuer dégrade ta cassette (<Mono>85 €</Mono>) et tes plateaux (<Mono>140 €</Mono>). Coût évité estimé : <Mono style={{ color: "var(--bi-ink)", fontWeight: 600 }}>180 €</Mono>.
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--bi-line)", borderRadius: 14, overflow: "hidden" }}>
              {[["Prix d'achat", "38 €"], ["Coût / km", "0,013 €"], ["Intensité", "Élevée"], ["Vie restante", "~ 5 j"]].map(([k, v]) => (
                <div key={String(k)} style={{ background: "var(--bi-card)", padding: "14px 16px" }}>
                  <BiLabel style={{ fontSize: 10 }}>{k}</BiLabel>
                  <Mono style={{ display: "block", fontSize: 16, fontWeight: 500, marginTop: 4 }}>{v}</Mono>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wear chart + history */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
          <BiCard pad={24}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Usure dans le temps</div>
                <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>Modélisation basée sur tes activités Strava</div>
              </div>
              <Mono style={{ fontSize: 11, color: "var(--bi-muted)" }}>% d&apos;usure</Mono>
            </div>
            <div style={{ position: "relative", height: 200 }}>
              <svg viewBox="0 0 600 200" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="comp-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C8362E" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#C8362E" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="20" x2="600" y2="20" stroke="rgba(14,14,16,0.08)" strokeDasharray="3 3" />
                <line x1="0" y1="110" x2="600" y2="110" stroke="rgba(14,14,16,0.08)" strokeDasharray="3 3" />
                <line x1="0" y1="180" x2="600" y2="180" stroke="rgba(14,14,16,0.08)" strokeDasharray="3 3" />
                <path d="M0,180 L75,165 L150,140 L225,115 L300,95 L375,75 L450,50 L525,30 L600,18 L600,200 L0,200 Z" fill="url(#comp-grad)" />
                <path d="M0,180 L75,165 L150,140 L225,115 L300,95 L375,75 L450,50 L525,30 L600,18" stroke="#C8362E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <rect x="0" y="0" width="600" height="20" fill="#C8362E" opacity="0.07" />
                <text x="595" y="14" textAnchor="end" fontSize="10" fill="#C8362E" fontWeight="600">SEUIL 100%</text>
                <circle cx="525" cy="30" r="5" fill="#C8362E" />
                <circle cx="525" cy="30" r="10" fill="none" stroke="#C8362E" strokeWidth="1.5" opacity="0.3" />
              </svg>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10.5, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>
              <span>14 sept.</span><span>Nov</span><span>Jan</span><span>Mars</span><span>Mai</span><span>Aujourd&apos;hui</span>
            </div>
          </BiCard>

          <BiCard pad={0}>
            <div style={{ padding: "22px 22px 12px" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Historique</div>
              <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>4 événements depuis l&apos;installation</div>
            </div>
            {HISTORY.map((h, i) => (
              <div key={h.label} style={{ padding: "14px 22px", borderTop: i > 0 ? "1px solid var(--bi-line)" : "none", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, background: STATUS_COLORS[h.status], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{h.label}</div>
                  <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>{h.date}</div>
                </div>
                <Mono style={{ fontSize: 11, color: "var(--bi-muted)" }}>{h.km}</Mono>
              </div>
            ))}
          </BiCard>
        </div>
      </div>
    </AppShell>
  );
}
