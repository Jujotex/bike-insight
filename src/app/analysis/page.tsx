import { AppShell } from "@/components/bi/app-shell";
import { BiCard, BiLabel, Mono, Dot } from "@/components/bi/ui";

const DIST = [
  { name: "Transmission", value: 263, color: "var(--bi-accent)" },
  { name: "Pneumatiques", value: 412, color: "var(--bi-warn)" },
  { name: "Freinage", value: 168, color: "var(--bi-ok)" },
  { name: "Autre", value: 404, color: "var(--bi-muted)" },
];
const TOTAL = DIST.reduce((s, d) => s + d.value, 0);

const INSIGHTS = [
  { cat: "mécanique", text: "Chaînes remplacées 30 % trop tôt", impact: "Économie · 22 €/an", action: "Tester +500 km", color: "var(--bi-accent)" },
  { cat: "financier", text: "Pneumatiques = 33 % du coût total", impact: "Investiguer modèle", action: "Comparer pneus", color: "var(--bi-muted)" },
  { cat: "mécanique", text: "Pneu arrière 2× plus usé que le AV", impact: "Risque ponction +50 %", action: "Vérifier pression", color: "var(--bi-warn)" },
  { cat: "comportement", text: "Tu roules + 18 % vs an dernier", impact: "Anticiper renouvellement", action: "Stocker 1 chaîne", color: "var(--bi-ok)" },
  { cat: "financier", text: "Coût/km 14 % au-dessus médiane", impact: "Marge d'optimisation", action: "Voir détail", color: "var(--bi-bad)" },
];

export default function AnalysisPage() {
  return (
    <AppShell>
      <div style={{ padding: "24px 36px 40px" }}>

        {/* Page head */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1 }}>Analyse</div>
            <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 6 }}>Insights financiers et mécaniques sur tes 3 vélos · 12 derniers mois</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["12 mois", "6 mois", "90 j", "Tout"].map((p, i) => (
              <span key={p} style={{ fontSize: 11.5, padding: "7px 14px", borderRadius: 999, background: i === 0 ? "var(--bi-ink)" : "transparent", color: i === 0 ? "var(--bi-bg)" : "var(--bi-muted)", border: i === 0 ? "none" : "1px solid var(--bi-line)", fontWeight: i === 0 ? 600 : 500, cursor: "pointer" }}>
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Hero KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
          {[
            { k: "Coût total · 12 m", v: "1 847", u: "€", badge: "+ 14 %", c: "var(--bi-bad)", sub: "vs médiane utilisateurs" },
            { k: "Coût / km moyen", v: "0,41", u: "€/km", badge: "au-dessus", c: "var(--bi-muted)", sub: "des cyclistes route" },
            { k: "Distance · 12 m", v: "4 500", u: "km", badge: "+ 12 %", c: "var(--bi-ok)", sub: "vs année précédente" },
            { k: "Économie potentielle", v: "180", u: "€", badge: "à réaliser", c: "var(--bi-accent)", sub: "si tu agis sur les 3 alertes" },
          ].map(({ k, v, u, badge, c, sub }) => (
            <BiCard key={k} pad={22}>
              <BiLabel>{k}</BiLabel>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
                <Mono style={{ fontSize: 38, fontWeight: 500, letterSpacing: -1.2 }}>{v}</Mono>
                <span style={{ fontSize: 14, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>{u}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11.5, color: c }}>
                <Dot color={c} size={5} />
                <span style={{ fontWeight: 600 }}>{badge}</span>
                <span style={{ color: "var(--bi-muted)", fontWeight: 400 }}>· {sub}</span>
              </div>
            </BiCard>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>

          {/* Cost/km trend chart */}
          <BiCard pad={24}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Coût / km dans le temps</div>
                <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>Tendance haussière depuis ton dernier remplacement de chaîne</div>
              </div>
              <Mono style={{ fontSize: 11, color: "var(--bi-muted)" }}>€/km</Mono>
            </div>
            <div style={{ position: "relative", height: 220 }}>
              <svg viewBox="0 0 600 220" style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ana-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C7FF3F" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#C7FF3F" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="50" x2="600" y2="50" stroke="rgba(14,14,16,0.07)" strokeDasharray="3 3" />
                <line x1="0" y1="110" x2="600" y2="110" stroke="rgba(14,14,16,0.07)" strokeDasharray="3 3" />
                <line x1="0" y1="170" x2="600" y2="170" stroke="rgba(14,14,16,0.07)" strokeDasharray="3 3" />
                <text x="6" y="46" fontSize="10" fill="#6B6B72">0,60</text>
                <text x="6" y="106" fontSize="10" fill="#6B6B72">0,40</text>
                <text x="6" y="166" fontSize="10" fill="#6B6B72">0,20</text>
                <line x1="0" y1="125" x2="600" y2="125" stroke="#6B6B72" strokeDasharray="6 6" strokeOpacity="0.5" />
                <text x="595" y="121" textAnchor="end" fontSize="10" fill="#6B6B72">médiane 0,35</text>
                <path d="M0,170 L50,160 L100,150 L150,142 L200,128 L250,118 L300,108 L350,100 L400,90 L450,80 L500,72 L550,62 L600,50 L600,220 L0,220 Z" fill="url(#ana-grad)" />
                <path d="M0,170 L50,160 L100,150 L150,142 L200,128 L250,118 L300,108 L350,100 L400,90 L450,80 L500,72 L550,62 L600,50" stroke="#C7FF3F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <circle cx="600" cy="50" r="5" fill="#C7FF3F" />
              </svg>
              <div style={{ position: "absolute", top: 28, right: 0, background: "var(--bi-accent)", color: "var(--bi-accent-ink)", padding: "4px 9px", borderRadius: 6, fontSize: 11, fontFamily: "var(--font-jetbrains-mono)", fontWeight: 600 }}>0,41 €</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10.5, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>
              {["Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc", "Jan", "Fév", "Mars", "Avr", "Mai"].map((m) => <span key={m}>{m}</span>)}
            </div>
          </BiCard>

          {/* Distribution */}
          <BiCard pad={24}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Répartition par poste</div>
            <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2, marginBottom: 20 }}>1 247 € sur 12 mois</div>
            <div style={{ height: 10, borderRadius: 999, overflow: "hidden", display: "flex", gap: 2, marginBottom: 20 }}>
              {DIST.map((d) => <div key={d.name} style={{ flex: d.value, background: d.color }} />)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {DIST.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid var(--bi-line)" }}>
                  <Dot color={d.color} />
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{d.name}</span>
                  <Mono style={{ fontSize: 11, color: "var(--bi-muted)", marginRight: 12 }}>{Math.round(d.value / TOTAL * 100)} %</Mono>
                  <Mono style={{ fontSize: 13.5, fontWeight: 500 }}>{d.value} €</Mono>
                </div>
              ))}
            </div>
          </BiCard>
        </div>

        {/* Insights table — 5 columns with Catégorie */}
        <BiCard pad={0}>
          <div style={{ padding: "20px 22px 14px" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Insights · {INSIGHTS.length} détectés</div>
            <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>Recommandations basées sur ton historique Strava et les patterns détectés</div>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr 1.4fr 1fr 1fr",
            padding: "8px 22px",
            gap: 16,
            fontSize: 10.5,
            color: "var(--bi-muted)",
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            borderBottom: "1px solid var(--bi-line)",
          }}>
            <span></span>
            <span>Catégorie</span>
            <span>Insight</span>
            <span>Impact estimé</span>
            <span style={{ textAlign: "right" }}>Action</span>
          </div>
          {INSIGHTS.map((ins, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 1.4fr 1fr 1fr",
              padding: "16px 22px",
              gap: 16,
              alignItems: "center",
              borderBottom: "1px solid var(--bi-line)",
            }}>
              <Dot color={ins.color} size={8} />
              <span style={{ fontSize: 11, color: "var(--bi-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{ins.cat}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{ins.text}</span>
              <span style={{ fontSize: 12, color: ins.color, fontWeight: 500 }}>{ins.impact}</span>
              <span style={{ fontSize: 12, fontWeight: 600, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, cursor: "pointer" }}>
                {ins.action}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
              </span>
            </div>
          ))}
        </BiCard>
      </div>
    </AppShell>
  );
}
