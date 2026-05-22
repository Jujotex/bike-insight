import Link from "next/link";
import { BrandMark } from "@/components/bi/brand-mark";
import { Mono } from "@/components/bi/ui";

export default function Home() {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--bi-bg)", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <header style={{ padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BrandMark />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/login" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--bi-muted)", textDecoration: "none", padding: "9px 16px" }}>
            Se connecter
          </Link>
          <Link href="/signup">
            <button style={{ background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
              Commencer
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--bi-muted)", marginBottom: 20 }}>
          Outil de maintenance vélo
        </div>
        <h1 style={{ fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 600, letterSpacing: -2.5, lineHeight: 1.04, maxWidth: 800, marginBottom: 24 }}>
          Connais le vrai coût<br />de ton matériel.
        </h1>
        <p style={{ fontSize: 18, color: "var(--bi-muted)", maxWidth: 520, lineHeight: 1.6, marginBottom: 44 }}>
          Bike Insight calcule l&apos;usure réelle et le coût par kilomètre de chaque composant, synchronisé avec tes sorties Strava.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 64 }}>
          <Link href="/signup">
            <button style={{ background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 12, padding: "16px 32px", fontSize: 15, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              Créer un compte gratuit
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </button>
          </Link>
          <Link href="/dashboard">
            <button style={{ background: "transparent", color: "var(--bi-ink)", border: "1px solid var(--bi-line)", borderRadius: 12, padding: "16px 32px", fontSize: 15, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
              Voir la démo
            </button>
          </Link>
        </div>

        {/* Feature strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, width: "100%", maxWidth: 900 }}>
          {[
            { icon: "M4 20V10M10 20V4M16 20v-6M22 20H2", title: "Coût/km en temps réel", sub: "Par composant, par vélo, sur 12 mois" },
            { icon: "M12 9v4M12 17h.01M3 12a9 9 0 1018 0 9 9 0 00-18 0z", title: "Alertes de remplacement", sub: "Avant que ça dégrade tes autres pièces" },
            { icon: "M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-3M20 14a8 8 0 01-14 3", title: "Sync Strava auto", sub: "Kilométrage mis à jour après chaque sortie" },
          ].map((f) => (
            <div key={f.title} style={{ background: "var(--bi-card)", borderRadius: 16, border: "1px solid var(--bi-line)", padding: "22px 20px", textAlign: "left" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bi-accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--bi-accent-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--bi-muted)", lineHeight: 1.5 }}>{f.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: "20px 40px", borderTop: "1px solid var(--bi-line)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--bi-muted)" }}>
        <BrandMark />
        <Mono>bike-insight.app</Mono>
      </footer>
    </main>
  );
}
