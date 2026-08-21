import Link from "next/link";
import { PoweredByStrava } from "@/components/bi/strava-brand";
import { SUPPORT_EMAIL } from "@/lib/contact";

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
  white: "var(--bi-white)",
  strava: "var(--bi-strava)",
  accentSoft: "var(--bi-accent-soft)",
};

function Dot({ color, size = 7 }: { color: string; size?: number }) {
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: 999, background: color, flexShrink: 0 }} />;
}

function Mono({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return <span className={className} style={{ fontFamily: "var(--bi-font-mono)", ...style }}>{children}</span>;
}

// ── Nav ────────────────────────────────────────────────────────
function LandingNav() {
  return (
    <div className="bi-land-pad bi-land-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: `1px solid ${T.line}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l4-8 4 6 4-10 4 8"/></svg>
        </div>
        <span className="bi-land-nav-name" style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>Bike Insight</span>
        <span className="bi-land-nav-beta" style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: "transparent", border: `1px solid ${T.line}`, color: T.muted, fontWeight: 600, letterSpacing: 0.5, marginLeft: 6 }}>BETA</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link href="/login" className="bi-land-nav-login" style={{ fontSize: 13, color: T.ink, padding: "8px 14px", fontWeight: 500, textDecoration: "none" }}>
          <span className="bi-inline-desktop">Se connecter</span>
          <span className="bi-inline-mobile">Connexion</span>
        </Link>
        <Link href="/signup">
          <button className="bi-land-nav-cta" style={{ padding: "10px 16px", background: T.ink, color: T.bg, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", marginLeft: 4 }}>
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
          <div style={{ fontSize: 9, fontWeight: 600, color: T.muted, letterSpacing: 0.8, textTransform: "uppercase" }}>Canyon Aeroad · vélo actif</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>Bonjour, Leo</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "4px 8px", border: `1px solid ${T.line}`, borderRadius: 999, fontSize: 10, color: T.muted }}>
          <Dot color={T.ok} size={5} />Sync · 4 min
        </div>
      </div>

      {/* Score de forme */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.line}`, padding: 16, marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 14, alignItems: "center" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Dot color={T.warn} size={6} />
            <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: T.muted }}>Santé du vélo</span>
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
          {[["Pièces", 52, T.warn], ["Entretien", 80, T.ok]].map(([k, v, c]) => (
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
      <div style={{ marginTop: 12, background: T.card, borderRadius: 14, border: `1px solid ${T.line}`, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 999, background: T.bad, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, fontFamily: "var(--bi-font-mono)" }}>2</div>
          <span style={{ fontSize: 11, fontWeight: 600 }}>Ce qui nécessite ton attention</span>
        </div>
        {[
          { name: "Chaîne · Ultegra HG701", life: 0.94, status: "bad", remain: "~ 160 km", cost: "38 €" },
          { name: "Pneus AR · GP5000", life: 0.71, status: "warn", remain: "~ 1 160 km", cost: "52 €" },
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

      {/* Ce qui t'attend */}
      <div style={{ marginTop: 12, background: T.ink, color: T.white, borderRadius: 14, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 8.5, fontWeight: 700, color: T.accent, letterSpacing: 0.8, textTransform: "uppercase" }}>Ce qui t&apos;attend · 3 mois</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginTop: 3 }}>
            <Mono style={{ fontSize: 24, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1 }}>90</Mono>
            <Mono style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>€</Mono>
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.45 }}>
          Chaîne <span style={{ color: T.white, fontWeight: 600 }}>~3 sem.</span><br/>
          Pneus AR <span style={{ color: T.white, fontWeight: 600 }}>~10 sem.</span>
        </div>
      </div>
    </div>
  );
}

// ── Hero ───────────────────────────────────────────────────────
function LandingHero() {
  return (
    <div className="bi-land-pad bi-land-hero" style={{ padding: "64px 48px 48px", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 64, alignItems: "center" }}>
      <div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: `1px solid ${T.line}`, background: T.card }}>
          <Dot color={T.accent} size={6} />
          {/* « Compatible avec Strava » est une des deux formulations explicitement
              autorisées par la section 4 des Brand Guidelines. « Conçu pour cyclistes
              Strava » pouvait se lire comme une approbation de leur part. */}
          <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: 0.5 }}>Compatible avec Strava</span>
        </div>

        <div className="bi-land-hero-title" style={{ marginTop: 24, fontSize: "clamp(40px, 5vw, 76px)", fontWeight: 600, letterSpacing: -3, lineHeight: 0.96 }}>
          Ton matériel<br />
          te coûte{" "}
          <span style={{ position: "relative", display: "inline-block" }}>
            <span style={{ position: "relative", zIndex: 2 }}>plus cher</span>
            {/* Décalage et épaisseur en `em` : en px (bottom 6 / height 14) le trait
                était calibré pour 76px et barrait le texte à 40px sur mobile.
                Les valeurs em reproduisent exactement le rendu desktop. */}
            <span style={{ position: "absolute", left: "-0.03em", right: "-0.05em", bottom: "0.08em", height: "0.18em", background: T.accent, zIndex: 1, borderRadius: 2 }} />
          </span>
          <br />
          que tu ne le crois.
        </div>

        <div style={{ marginTop: 24, fontSize: 17, color: T.muted, lineHeight: 1.55, maxWidth: 480 }}>
          Bike Insight branche tes activités Strava et suit l&apos;usure et le{" "}
          <Mono style={{ color: T.ink, fontWeight: 600 }}>coût réel</Mono> de chaque composant. Tu sais quand remplacer, combien ça va te coûter, et combien tu peux éviter de gaspiller.
        </div>

        <div className="bi-land-hero-cta" style={{ marginTop: 36, display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/signup">
            <button style={{ padding: "15px 22px", background: T.ink, color: T.bg, border: "none", borderRadius: 14, fontSize: 14, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              Connecter mon Strava
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          </Link>
          {/* Pointait vers /dashboard, qui redirige vers /login sans session : le
              bouton promettait une démo et livrait un formulaire de connexion.
              /demo rend le vrai dashboard sur des données fictives, sans compte. */}
          <Link href="/demo">
            <button style={{ padding: "15px 20px", background: "transparent", color: T.ink, border: `1px solid ${T.line}`, borderRadius: 14, fontSize: 14, fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
              Voir une démo
            </button>
          </Link>
        </div>

      </div>

      <MiniDashPreview />
    </div>
  );
}

// ── Metrics strip ──────────────────────────────────────────────
function LandingMetrics() {
  return (
    <div className="bi-land-pad" style={{ padding: "32px 48px", borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, background: T.card }}>
      <div className="bi-land-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 48 }}>
        {/* Chiffres tirés du contenu réel de l'app, vérifiables dans le code —
            et non des affirmations sur des résultats utilisateurs.
            Deux versions ont précédé celle-ci :
              1. « 180 € évités en moyenne », « 2,1x de durée de vie », « 142 sorties
                 analysées en moyenne par cycliste » — des résultats mesurés qui ne
                 l'étaient pas (art. 11.1(d) de l'accord API, pratiques trompeuses),
                 et le troisième supposait une moyenne calculée sur les données Strava
                 des utilisateurs, interdite même anonymisée (§5.4) ;
              2. des fourchettes génériques d'entretien vélo, dont « 3-5x d'écart selon
                 les conditions » — contre-productif : le moteur d'usure est linéaire
                 en kilomètres et ne tient pas compte des conditions. Autant ne pas
                 attirer l'attention sur sa propre limite.
            Sources : lib/components-catalog.ts, lib/maintenance-catalog.ts,
            lib/repair-guides.ts, lib/benchmarks.ts. À recompter si ces fichiers
            grossissent. */}
        {[
          ["180", "pièces au catalogue, avec leur durée de vie de référence"],
          ["15", "tutos, avec l'estimation atelier en face pour trancher"],
          ["7", "entretiens suivis, au kilomètre et au calendrier"],
          ["0,03-0,08 €", "le coût d'entretien au kilomètre où tu te situes"],
        ].map(([v, k]) => (
          <div key={String(v)}>
            <Mono className="bi-land-stat-v" style={{ fontSize: 36, fontWeight: 500, letterSpacing: -1.2, lineHeight: 1, display: "block" }}>{v}</Mono>
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
      sub: "On lit tes activités passées et on synchronise les nouvelles automatiquement.",
      visual: (
        <div style={{ padding: 20, display: "flex", flexDirection: "column" as const, gap: 0 }}>
          {/* Représente le flux Bike Insight ← Strava.
              L'ancienne version mettait « St » en blanc sur l'orange de marque : un
              logo Strava inventé, interdit par la section 2 des Brand Guidelines.
              Il n'existe pas d'icône Strava carrée concédée aux tiers — les seuls
              assets sont les verrous « Powered by » (176×60) et « Compatible with »
              (437×37), qu'on ne peut ni recadrer ni déformer. D'où une mention
              textuelle, explicitement autorisée par la section 4, et le logo officiel
              placé juste en dessous à sa taille naturelle. */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l4-8 4 6 4-10 4 8"/></svg>
            </div>
            <div style={{ display: "flex", gap: 3 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: 999, background: T.muted }} />)}
            </div>
            <div style={{ height: 40, padding: "0 14px", borderRadius: 10, background: T.card, border: `1px solid ${T.line}`, display: "flex", alignItems: "center", fontSize: 13, fontWeight: 600, color: T.muted }}>
              Strava
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <PoweredByStrava height={16} />
          </div>
          <div style={{ padding: 12, borderRadius: 10, background: T.bg, border: `1px solid ${T.line}`, fontSize: 12, lineHeight: 1.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.ok, fontWeight: 600, fontSize: 11 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
              CONNECTÉ
            </div>
            <div style={{ marginTop: 8, color: T.muted }}>
              <span style={{ color: T.ink, fontWeight: 600 }}>142 activités</span> importées<br/>
              <span style={{ color: T.ink, fontWeight: 600 }}>3 vélos</span> détectés<br/>
              <span style={{ color: T.ink, fontWeight: 600 }}>4 500 km</span> synchronisés
            </div>
          </div>
        </div>
      ),
    },
    {
      n: "02", title: "Déclare ton matériel",
      sub: "Chaîne, pneus, cassette. Prix et date d'installation. On gère le reste.",
      visual: (
        <div style={{ padding: 20, display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {[["Chaîne", "Shimano Ultegra", "38 €"], ["Pneus AR", "Continental GP5000", "52 €"], ["Cassette", "Ultegra 11-30", "85 €"]].map(([n, m, p], i) => (
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
      n: "03", title: "Reçois la décision",
      sub: "On te dit quand changer, combien, et combien tu économises en agissant à temps.",
      visual: (
        <div style={{ padding: 20 }}>
          <div style={{ padding: 14, background: T.ink, color: T.white, borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Dot color={T.bad} size={6} />
              <span style={{ fontSize: 9, fontWeight: 700, color: T.bad, letterSpacing: 0.8, textTransform: "uppercase" as const }}>Action prioritaire</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, marginTop: 8, lineHeight: 1.3 }}>
              Remplace ta chaîne dans les <Mono style={{ color: T.accent, fontWeight: 600 }}>~160 km</Mono>.
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 6, lineHeight: 1.4 }}>
              Si tu attends, tu uses ta cassette et tes plateaux.
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Coût évité ·</span>
              <Mono style={{ fontSize: 16, fontWeight: 600, color: T.accent }}>180 €</Mono>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="bi-land-pad" style={{ padding: "80px 48px 64px" }}>
      <div className="bi-land-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: 1, textTransform: "uppercase" }}>Comment ça marche</div>
          <div className="bi-land-h2" style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1.4, lineHeight: 1.05, marginTop: 8, maxWidth: 600 }}>
            Trois étapes, et{" "}
            <span style={{ background: T.accent, padding: "0 6px", borderRadius: 6 }}>ton matériel se pilote tout seul</span>.
          </div>
        </div>
        <div className="bi-land-head-side" style={{ fontSize: 13, color: T.muted, maxWidth: 280, lineHeight: 1.55 }}>
          Pas de check-list manuelle. Pas de tableur. Tes sorties Strava font le travail.
        </div>
      </div>

      <div className="bi-land-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {steps.map(s => (
          <div key={s.n} style={{ borderRadius: 18, border: `1px solid ${T.line}`, background: T.card, overflow: "hidden" }}>
            <div style={{ padding: "24px 24px 0" }}>
              <Mono style={{ fontSize: 12, fontWeight: 600, color: T.muted }}>{s.n}</Mono>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5, marginTop: 6 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>{s.sub}</div>
            </div>
            <div style={{ background: T.bg, margin: 20, marginTop: 24, borderRadius: 14, border: `1px solid ${T.line}`, minHeight: 180 }}>
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
    <div className="bi-land-pad" style={{ padding: "40px 48px 80px" }}>
      <div className="bi-land-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: 1, textTransform: "uppercase" }}>Ce que tu vas apprendre</div>
          <div className="bi-land-h2" style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1.4, lineHeight: 1.05, marginTop: 8, maxWidth: 560 }}>
            Des décisions, pas des dashboards.
          </div>
        </div>
        <div className="bi-land-head-side" style={{ fontSize: 13, color: T.muted, maxWidth: 320, lineHeight: 1.55 }}>
          Trois exemples de ce que l&apos;app t&apos;affiche, à partir de tes kilomètres et de tes
          prix d&apos;achat.
        </div>
      </div>

      {/* Ces trois cartes décrivent des fonctionnalités qui existent réellement.
          La version précédente annonçait « trois insights réels remontés à des
          beta-testeurs sur les 30 derniers jours » — une affirmation factuelle sur
          des données utilisateurs, intenable avec la base actuelle, et deux des trois
          cartes décrivaient des analyses que l'app ne sait pas faire :
            • « tu changes tes chaînes 30 % trop tôt » supposerait de détecter un
              motif sur plusieurs remplacements successifs ;
            • « ton pneu AR s'use 2x plus vite que l'AV » est **structurellement
              impossible** : l'usure vaut `total_km - installed_km`, donc toutes les
              pièces d'un même vélo accumulent exactement les mêmes kilomètres.
          Remplacées par ce que le produit fait vraiment : seuil d'usure et km
          restants, arbitrage atelier/DIY (`lib/repair-guides.ts`), répartition du
          budget par catégorie et repères de coût (`lib/benchmarks.ts`). */}
      <div className="bi-land-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {[
          { eyebrow: "Seuil d'usure atteint", color: T.accent, headline: "Ta cassette est à 92 % d'usure.", body: "Environ 400 km avant le seuil critique. Tu vois venir la dépense au lieu de la subir.", impact: "≈ 400 km" },
          { eyebrow: "Atelier ou soi-même", color: T.warn, headline: "Changer ta chaîne : 20 min chez toi.", body: "Le tuto, la difficulté et la fourchette main-d'œuvre d'un vélociste, côte à côte.", impact: "25-40 € d'écart" },
          { eyebrow: "Où part ton argent", color: T.muted, headline: "La transmission pèse le plus lourd.", body: "Ta dépense d'entretien par catégorie, et ton coût au kilomètre face aux repères du milieu.", impact: "€ / km" },
        ].map((item, idx) => (
          <div key={idx} style={{ borderRadius: 18, background: T.card, border: `1px solid ${T.line}`, padding: 24, borderLeft: `4px solid ${item.color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Dot color={item.color} size={6} />
              <span style={{ fontSize: 11, fontWeight: 700, color: item.color, letterSpacing: 0.8, textTransform: "uppercase" as const }}>{item.eyebrow}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.5, marginTop: 14, lineHeight: 1.3 }}>{item.headline}</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 10, lineHeight: 1.55, minHeight: 60 }}>{item.body}</div>
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.soft}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: 0.6, textTransform: "uppercase" as const }}>Impact</span>
              <Mono style={{ fontSize: 14, fontWeight: 600 }}>{item.impact}</Mono>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Comparaison : section supprimée ────────────────────────────
//
// ⚠️ NE PAS REMETTRE DE TABLEAU COMPARATIF NOMMANT STRAVA.
//
// La landing opposait Bike Insight à Strava, six croix sur sept lignes, sous le
// titre « Ils tracent. On décide. ». Trois clauses l'interdisaient :
//   • accord API — « You may not create applications that compete with or
//     replicate Strava functionality » ;
//   • API Policy §5.2 — usage de l'API « in any manner that is competitive to
//     Strava or the Strava Platform » ;
//   • API Policy §5.12 — contenu « perceived as detrimental, disparaging, or
//     harmful to Strava ».
//
// Une version sans colonne Strava a existé brièvement, puis la section entière a
// été retirée : le positionnement du produit est « à côté de Strava, pas en
// face », et il se défend mieux en montrant ce que l'app fait qu'en montrant ce
// que les autres ne font pas.
// ── CTA ────────────────────────────────────────────────────────
function LandingCTA() {
  return (
    <div className="bi-land-pad" style={{ padding: "80px 48px", background: T.ink, color: T.white, textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(199,255,63,0.13), transparent 60%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.accent, letterSpacing: 1.2, textTransform: "uppercase" }}>Beta · accès libre</div>
        <div style={{ fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 600, letterSpacing: -2, lineHeight: 1.05, marginTop: 16 }}>
          Connecte ton Strava.<br />
          On s&apos;occupe du reste.
        </div>
        <div style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", marginTop: 20, maxWidth: 480, margin: "20px auto 0", lineHeight: 1.55 }}>
          30 secondes de setup. Tu vois tes premiers insights immédiatement.
        </div>
        <div style={{ marginTop: 36, display: "flex", justifyContent: "center", gap: 12 }}>
          <Link href="/signup">
            <button style={{ padding: "17px 28px", background: T.accent, color: T.accentInk, border: "none", borderRadius: 14, fontSize: 15, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              Commencer maintenant
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────
function LandingFooter() {
  return (
    <div className="bi-land-pad" style={{ padding: "40px 48px 32px", background: T.bg, borderTop: `1px solid ${T.line}` }}>
      {/* Bloc centré : les trois colonnes de liens (Produit / Ressources / Legal) ont
          été retirées — douze `<span>` non cliquables pointant vers des pages
          inexistantes (Blog, Tarifs, Roadmap, Statut, Méthodologie, Cookies…).
          L'entrée « API » posait en plus un problème de fond : elle laissait entendre
          que Bike Insight expose sa propre API, alors que le §5.16 de l'API Policy
          Strava interdit toute couche d'abstraction réexposant leurs données à des
          tiers. Et « Tarifs » contredisait le bandeau « Beta · accès libre ».
          Les seuls liens réels vivent dans la barre du bas. En rajouter au fur et à
          mesure qu'ils existent, jamais avant. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l4-8 4 6 4-10 4 8"/></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Bike Insight</span>
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 12, lineHeight: 1.55, maxWidth: 320 }}>
          L&apos;outil de gestion du matériel pour cyclistes. Compatible avec Strava.
        </div>
        {/* Attribution obligatoire dès qu'on fait référence à l'interopérabilité
            avec Strava (Brand Guidelines section 4). La landing cite Strava une
            dizaine de fois : elle est donc concernée, tout autant que l'app. */}
        <div style={{ marginTop: 16 }}>
          <PoweredByStrava />
        </div>
      </div>
      {/* Lien public vers la politique de confidentialité : exigé par l'API Policy
          Strava §7.3 (lien « reasonably prominent ») et par les deux stores, qui
          demandent une URL accessible sans compte. Le pied de page de la landing est
          l'endroit qu'un reviewer regarde en premier. */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.line}`, display: "flex", justifyContent: "center", alignItems: "center", gap: 18, flexWrap: "wrap", fontSize: 11, color: T.muted }}>
        <Mono>© 2026 Bike Insight · v 0.5 beta</Mono>
        <Link href="/confidentialite" style={{ fontSize: 11, color: T.muted, textDecoration: "underline" }}>
          Politique de confidentialité
        </Link>
        <a href={`mailto:${SUPPORT_EMAIL}`} style={{ fontSize: 11, color: T.muted, textDecoration: "underline" }}>
          Contact
        </a>
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
      <LandingCTA />
      <LandingFooter />
    </main>
  );
}
