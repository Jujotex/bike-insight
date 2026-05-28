import Link from "next/link";

// Token helpers
const T = {
  bg: "var(--bi-bg)",
  card: "var(--bi-card)",
  ink: "var(--bi-ink)",
  muted: "var(--bi-muted)",
  line: "var(--bi-line)",
  soft: "var(--bi-soft-line)",
  accent: "var(--bi-accent)",
  accentInk: "var(--bi-accent-ink)",
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
};

function Dot({ color, size = 7 }: { color: string; size?: number }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: 999, background: color, flexShrink: 0 }} />;
}

function Mono({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: "var(--bi-font-mono)", ...style }}>{children}</span>;
}

// ── Nav ────────────────────────────────────────────────────────
function LandingNav() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: `1px solid ${T.line}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l4-8 4 6 4-10 4 8"/></svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>Bike Insight</span>
        <span style={{ fontSize: 10, padding: "3px 7px", borderRadius: 999, background: "transparent", border: `1px solid ${T.line}`, color: T.muted, fontWeight: 600, letterSpacing: 0.5, marginLeft: 6 }}>BETA</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {["Comment ca marche", "Tarifs", "Pourquoi nous"].map(l => (
          <span key={l} style={{ fontSize: 13, color: T.muted, padding: "8px 14px", fontWeight: 500, cursor: "pointer" }}>{l}</span>
        ))}
        <div style={{ width: 1, height: 20, background: T.line, marginLeft: 6 }} />
        <Link href="/login" style={{ fontSize: 13, color: T.ink, padding: "8px 14px", fontWeight: 500, textDecoration: "none" }}>Se connecter</Link>
        <Link href="/signup">
          <button style={{ padding: "9px 16px", background: T.ink, color: T.bg, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", marginLeft: 4 }}>
            Commencer
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── Mini dashboard preview ─────────────────────────────────────
function MiniDashPreview() {
  return (
    <div style={{ background: T.bg, borderRadius: 18, border: `1px solid ${T.line}`, padding: 18, boxShadow: "0 40px 80px -30px rgba(14,14,16,0.25), 0 0 0 1px rgba(14,14,16,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: `1px solid ${T.soft}` }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, color: T.muted, letterSpacing: 0.8, textTransform: "uppercase" }}>Canyon Aeroad · velo actif</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>Bonjour, Leo</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 8px", border: `1px solid ${T.line}`, borderRadius: 999, fontSize: 9.5, color: T.muted }}>
          <Dot color={T.ok} size={5} />Sync · 4 min
        </div>
      </div>

      {/* Readiness */}
      <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, padding: 16, marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 14, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Dot color={T.warn} size={6} />
            <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: T.muted }}>Pret a rouler</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
            <Mono style={{ fontSize: 42, fontWeight: 400, letterSpacing: -1.4, lineHeight: 1, color: T.warn }}>62</Mono>
            <Mono style={{ fontSize: 12, color: T.muted }}>/100</Mono>
          </div>
          <div style={{ marginTop: 8, height: 3, borderRadius: 999, background: T.line, overflow: "hidden" }}>
            <div style={{ width: "62%", height: "100%", background: T.warn }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[["Composants", 55, T.warn], ["Regularite", 95, T.ok], ["Maintenance", 80, T.ok]].map(([k, v, c]) => (
            <div key={String(k)} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, width: 64, color: T.muted }}>{k as string}</span>
              <div style={{ flex: 1, height: 3, background: T.line, borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${v}%`, height: "100%", background: c as string }} />
              </div>
              <Mono style={{ fontSize: 10, fontWeight: 600, width: 20, textAlign: "right" }}>{v as number}</Mono>
            </div>
          ))}
        </div>
      </div>

      {/* Attention */}
      <div style={{ marginTop: 12, background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 999, background: T.bad, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, fontFamily: "var(--bi-font-mono)" }}>2</div>
          <span style={{ fontSize: 11, fontWeight: 600 }}>Ce qui necessite ton attention</span>
        </div>
        {[
          { name: "Chaine · Ultegra HG701", life: 0.94, status: "bad", remain: "~ 160 km", cost: "38 EUR" },
          { name: "Pneus AR · GP5000", life: 0.71, status: "warn", remain: "~ 1 160 km", cost: "52 EUR" },
        ].map((c) => {
          const color = c.status === "bad" ? T.bad : T.warn;
          return (
            <div key={c.name} style={{ padding: "10px 14px", borderTop: `1px solid ${T.soft}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 26, background: color, borderRadius: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{c.name}</span>
                  <Mono style={{ fontSize: 10, color: T.muted }}>{c.remain}</Mono>
                </div>
                <div style={{ marginTop: 5, height: 3, borderRadius: 999, background: T.line, overflow: "hidden" }}>
                  <div style={{ width: `${c.life * 100}%`, height: "100%", background: color }} />
                </div>
              </div>
              <Mono style={{ fontSize: 11, fontWeight: 500, width: 36, textAlign: "right" }}>{c.cost}</Mono>
            </div>
          );
        })}
      </div>

      {/* Forecast */}
      <div style={{ marginTop: 12, background: T.ink, color: "#fff", borderRadius: 12, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 8.5, fontWeight: 700, color: T.accent, letterSpacing: 0.8, textTransform: "uppercase" }}>Prevision 3 mois</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginTop: 3 }}>
            <Mono style={{ fontSize: 24, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1 }}>90</Mono>
            <Mono style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>EUR</Mono>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 10.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.45 }}>
          Chaine <span style={{ color: "#fff", fontWeight: 600 }}>~3 sem.</span><br/>
          Pneus AR <span style={{ color: "#fff", fontWeight: 600 }}>~10 sem.</span>
        </div>
      </div>
    </div>
  );
}

// ── Hero ───────────────────────────────────────────────────────
function LandingHero() {
  return (
    <div style={{ padding: "64px 48px 48px", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 64, alignItems: "center" }}>
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: `1px solid ${T.line}`, background: T.card }}>
          <Dot color={T.accent} size={6} />
          <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: 0.5 }}>Concu pour cyclistes Strava</span>
        </div>

        <div style={{ marginTop: 24, fontSize: "clamp(40px, 5vw, 76px)", fontWeight: 600, letterSpacing: -3, lineHeight: 0.96 }}>
          Ton materiel<br />
          te coute{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            <span style={{ position: "relative", zIndex: 2 }}>plus cher</span>
            <span style={{ position: "absolute", left: -2, right: -4, bottom: 6, height: 14, background: T.accent, zIndex: 1, borderRadius: 2 }} />
          </span>
          <br />
          que tu ne le crois.
        </div>

        <div style={{ marginTop: 24, fontSize: 17, color: T.muted, lineHeight: 1.55, maxWidth: 480 }}>
          Bike Insight branche tes activites Strava et calcule en temps reel l&apos;usure et le{" "}
          <Mono style={{ color: T.ink, fontWeight: 600 }}>EUR/km</Mono> de chaque composant. Tu sais quand remplacer, combien ca va te couter, et combien tu peux eviter de gaspiller.
        </div>

        <div style={{ marginTop: 36, display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/signup">
            <button style={{ padding: "15px 22px", background: T.ink, color: T.bg, border: "none", borderRadius: 12, fontSize: 14.5, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              Connecter mon Strava
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          </Link>
          <Link href="/dashboard">
            <button style={{ padding: "15px 20px", background: "transparent", color: T.ink, border: `1px solid ${T.line}`, borderRadius: 12, fontSize: 14, fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
              Voir une demo
            </button>
          </Link>
        </div>

        <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 16, fontSize: 11.5, color: T.muted }}>
          {["Gratuit pendant la beta", "Pas de CB", "Setup en 30 sec."].map(l => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
              {l}
            </div>
          ))}
        </div>
      </div>

      <MiniDashPreview />
    </div>
  );
}

// ── Metrics strip ──────────────────────────────────────────────
function LandingMetrics() {
  return (
    <div style={{ padding: "32px 48px", borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, background: T.card }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 48 }}>
        {[
          ["180 EUR", "evites en moyenne par utilisateur sur une chaine usee trop tard"],
          ["2,1x", "de duree de vie en plus quand on respecte le seuil critique"],
          ["142", "sorties Strava analysees en moyenne par cycliste"],
          ["< 1 min", "pour synchroniser ton historique complet"],
        ].map(([v, k]) => (
          <div key={String(v)}>
            <Mono style={{ fontSize: 36, fontWeight: 500, letterSpacing: -1.2, lineHeight: 1, display: "block" }}>{v}</Mono>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 8, lineHeight: 1.45 }}>{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── How it works ───────────────────────────────────────────────
function LandingHow() {
  const steps = [
    {
      n: "01", title: "Connecte Strava",
      sub: "On lit tes activites passees et synchronise les nouvelles en temps reel.",
      visual: (
        <div style={{ padding: 20, display: "flex", flexDirection: "column" as const, gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l4-8 4 6 4-10 4 8"/></svg>
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: 999, background: T.muted }} />)}
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FC4C02", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800 }}>St</div>
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: T.bg, border: `1px solid ${T.line}`, fontSize: 11.5, lineHeight: 1.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.ok, fontWeight: 600, fontSize: 10.5 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
              CONNECTE
            </div>
            <div style={{ marginTop: 8, color: T.muted }}>
              <span style={{ color: T.ink, fontWeight: 600 }}>142 activites</span> importees<br/>
              <span style={{ color: T.ink, fontWeight: 600 }}>3 velos</span> detectes<br/>
              <span style={{ color: T.ink, fontWeight: 600 }}>4 500 km</span> synchronises
            </div>
          </div>
        </div>
      ),
    },
    {
      n: "02", title: "Declare ton materiel",
      sub: "Chaine, pneus, cassette. Prix et date d'installation. On gere le reste.",
      visual: (
        <div style={{ padding: 20, display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {[["Chaine", "Shimano Ultegra", "38 EUR"], ["Pneus AR", "Continental GP5000", "52 EUR"], ["Cassette", "Ultegra 11-30", "85 EUR"]].map(([n, m, p], i) => (
            <div key={i} style={{ padding: "10px 12px", background: T.bg, borderRadius: 10, border: `1px solid ${T.line}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: 999, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="3.5" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{n}</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{m}</div>
              </div>
              <Mono style={{ fontSize: 11, fontWeight: 500 }}>{p}</Mono>
            </div>
          ))}
        </div>
      ),
    },
    {
      n: "03", title: "Recois la decision",
      sub: "On te dit quand changer, combien, et combien tu economies en agissant maintenant.",
      visual: (
        <div style={{ padding: 20 }}>
          <div style={{ padding: 14, background: T.ink, color: "#fff", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Dot color={T.bad} size={6} />
              <span style={{ fontSize: 9, fontWeight: 700, color: T.bad, letterSpacing: 0.8, textTransform: "uppercase" as const }}>Action prioritaire</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, marginTop: 8, lineHeight: 1.3 }}>
              Remplace ta chaine dans les <Mono style={{ color: T.accent, fontWeight: 600 }}>~160 km</Mono>.
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 6, lineHeight: 1.4 }}>
              Si tu attends, tu uses ta cassette et tes plateaux.
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Cout evite ·</span>
              <Mono style={{ fontSize: 16, fontWeight: 600, color: T.accent }}>180 EUR</Mono>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "80px 48px 64px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: 1, textTransform: "uppercase" }}>Comment ca marche</div>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1.4, lineHeight: 1.05, marginTop: 8, maxWidth: 600 }}>
            Trois etapes, et{" "}
            <span style={{ background: T.accent, padding: "0 6px", borderRadius: 4 }}>ton materiel pilote tout seul</span>.
          </div>
        </div>
        <div style={{ fontSize: 13, color: T.muted, maxWidth: 280, lineHeight: 1.55 }}>
          Pas de check-list manuelle. Pas de tableur. Tes sorties Strava font le travail.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {steps.map(s => (
          <div key={s.n} style={{ borderRadius: 16, border: `1px solid ${T.line}`, background: T.card, overflow: "hidden" }}>
            <div style={{ padding: "24px 24px 0" }}>
              <Mono style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>{s.n}</Mono>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, marginTop: 6 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>{s.sub}</div>
            </div>
            <div style={{ background: T.bg, margin: 20, marginTop: 24, borderRadius: 12, border: `1px solid ${T.line}`, minHeight: 180 }}>
              {s.visual}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Insights ───────────────────────────────────────────────────
function LandingInsights() {
  return (
    <div style={{ padding: "40px 48px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: 1, textTransform: "uppercase" }}>Ce que tu vas apprendre</div>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1.4, lineHeight: 1.05, marginTop: 8, maxWidth: 560 }}>
            Des decisions, pas des dashboards.
          </div>
        </div>
        <div style={{ fontSize: 13, color: T.muted, maxWidth: 320, lineHeight: 1.55 }}>
          Voici trois insights reels remontés a des beta-testeurs sur les 30 derniers jours.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { eyebrow: "Sur-remplacement detecte", color: T.accent, headline: "Tu changes tes chaines 30% trop tot.", body: "Le seuil critique est a 95% d'usure, pas 70%.", impact: "+ 22 EUR/an" },
          { eyebrow: "Anomalie mecanique", color: T.warn, headline: "Ton pneu AR s'use 2x plus vite que l'AV.", body: "Probablement une pression mal ajustee ou un poids mal reparti.", impact: "Risque ponction x2" },
          { eyebrow: "Concentration des couts", color: T.muted, headline: "La transmission represente 60% de ton budget.", body: "Concentre tes efforts d'optimisation ici.", impact: "263 EUR / 412 EUR" },
        ].map((item, idx) => (
          <div key={idx} style={{ borderRadius: 16, background: T.card, border: `1px solid ${T.line}`, padding: 24, borderLeft: `4px solid ${item.color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Dot color={item.color} size={6} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: item.color, letterSpacing: 0.8, textTransform: "uppercase" as const }}>{item.eyebrow}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.5, marginTop: 14, lineHeight: 1.3 }}>{item.headline}</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 10, lineHeight: 1.55, minHeight: 60 }}>{item.body}</div>
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.soft}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: T.muted, letterSpacing: 0.6, textTransform: "uppercase" as const }}>Impact</span>
              <Mono style={{ fontSize: 14, fontWeight: 600 }}>{item.impact}</Mono>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Comparison ─────────────────────────────────────────────────
function LandingComparison() {
  const rows = [
    ["Sync auto Strava", "check", "dash", "manuel", "cross"],
    ["Cout par km calcule", "check", "cross", "cross", "manual"],
    ["Recommandations d'action", "check", "cross", "basic", "cross"],
    ["Cout evite chiffre", "check", "cross", "cross", "cross"],
    ["Score de pret a rouler", "check", "cross", "cross", "cross"],
    ["Comparateur de remplacement", "check", "cross", "cross", "cross"],
  ];

  return (
    <div style={{ padding: "60px 48px", background: T.card, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: 1, textTransform: "uppercase" }}>Pourquoi pas Strava, ProBikeGarage ou un tableur ?</div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1, marginTop: 10 }}>Ils tracent. On decide.</div>
        </div>

        <div style={{ background: T.bg, borderRadius: 16, border: `1px solid ${T.line}`, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", padding: "16px 22px", gap: 14, fontSize: 10.5, color: T.muted, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" as const, borderBottom: `1px solid ${T.line}` }}>
            <span></span>
            <span style={{ textAlign: "center", color: T.ink }}>Bike Insight</span>
            <span style={{ textAlign: "center" }}>Strava</span>
            <span style={{ textAlign: "center" }}>ProBikeGarage</span>
            <span style={{ textAlign: "center" }}>Tableur</span>
          </div>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr", padding: "14px 22px", gap: 14, alignItems: "center", borderBottom: i === rows.length - 1 ? "none" : `1px solid ${T.soft}` }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{row[0]}</span>
              {[1, 2, 3, 4].map(j => {
                const v = row[j];
                const isBI = j === 1;
                return (
                  <div key={j} style={{ textAlign: "center", background: isBI ? "rgba(199,255,63,0.08)" : "transparent", padding: "6px 0", borderRadius: 6 }}>
                    {v === "check" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isBI ? T.ok : T.muted} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}><path d="M4 12l5 5L20 7"/></svg>
                    ) : v === "cross" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2.5" strokeLinecap="round" style={{ verticalAlign: "middle", opacity: 0.5 }}><path d="M18 6L6 18M6 6l12 12"/></svg>
                    ) : (
                      <span style={{ fontSize: 12, color: T.muted }}>{v}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CTA ────────────────────────────────────────────────────────
function LandingCTA() {
  return (
    <div style={{ padding: "80px 48px", background: T.ink, color: "#fff", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(199,255,63,0.13), transparent 60%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: T.accent, letterSpacing: 1.2, textTransform: "uppercase" }}>Beta · acces libre</div>
        <div style={{ fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 600, letterSpacing: -2, lineHeight: 1.05, marginTop: 16 }}>
          Connecte ton Strava.<br />
          On s&apos;occupe du reste.
        </div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginTop: 20, maxWidth: 480, margin: "20px auto 0", lineHeight: 1.55 }}>
          30 secondes de setup. Tu vois tes premiers insights immediatement.
        </div>
        <div style={{ marginTop: 36, display: "flex", justifyContent: "center", gap: 12 }}>
          <Link href="/signup">
            <button style={{ padding: "17px 28px", background: T.accent, color: T.accentInk, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              Commencer maintenant
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          </Link>
        </div>
        <div style={{ marginTop: 24, fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>
          Gratuit · Pas de carte bancaire · Desinscription en 1 clic
        </div>
      </div>
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <div style={{ padding: "40px 48px 32px", background: T.bg, borderTop: `1px solid ${T.line}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l4-8 4 6 4-10 4 8"/></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Bike Insight</span>
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 12, lineHeight: 1.55, maxWidth: 280 }}>
            L&apos;outil de gestion materiel pour cyclistes Strava. Construit a Paris.
          </div>
        </div>
        {[
          ["Produit", ["Fonctionnalites", "Tarifs", "Roadmap", "Statut"]],
          ["Ressources", ["Blog", "Guide entretien", "Methodologie", "API"]],
          ["Legal", ["Confidentialite", "Conditions", "Cookies", "Contact"]],
        ].map(([h, items]) => (
          <div key={h as string}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: 0.8, textTransform: "uppercase" }}>{h as string}</div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {(items as string[]).map(item => <span key={item} style={{ fontSize: 12.5, color: T.ink, cursor: "pointer" }}>{item}</span>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: T.muted }}>
        <Mono>© 2026 Bike Insight · v 0.4.2 beta</Mono>
        <span>Compatible Strava · Donnees privees, jamais revendues</span>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function Home() {
  return (
    <main style={{ minHeight: "100dvh", background: T.bg, color: T.ink, fontFamily: "var(--bi-font-ui)" }}>
      <LandingNav />
      <LandingHero />
      <LandingMetrics />
      <LandingHow />
      <LandingInsights />
      <LandingComparison />
      <LandingCTA />
      <LandingFooter />
    </main>
  );
}
