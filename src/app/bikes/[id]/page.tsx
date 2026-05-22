import { AppShell } from "@/components/bi/app-shell";
import { BiCard, BiLabel, Mono, Dot, ProgressBar, PageHead } from "@/components/bi/ui";
import Link from "next/link";

const COMPONENTS = [
  { id: "1", name: "Chaîne", model: "Ultegra CN-HG701", life: 0.94, km: 2840, max: 3000, cost: 38, status: "bad" as const, installed: "14 sept. 2024" },
  { id: "2", name: "Pneus AR", model: "Continental GP5000 25c", life: 0.71, km: 2840, max: 4000, cost: 52, status: "warn" as const, installed: "08 fév. 2025" },
  { id: "3", name: "Pneus AV", model: "Continental GP5000 25c", life: 0.34, km: 1320, max: 4000, cost: 52, status: "ok" as const, installed: "12 mars 2025" },
  { id: "4", name: "Cassette", model: "Ultegra 11-30", life: 0.42, km: 2840, max: 6800, cost: 85, status: "ok" as const, installed: "14 sept. 2024" },
  { id: "5", name: "Plateaux", model: "52/36 4-Iron", life: 0.18, km: 2840, max: 16000, cost: 140, status: "ok" as const, installed: "14 sept. 2024" },
  { id: "6", name: "Plaquettes AV", model: "Shimano L03A", life: 0.55, km: 1420, max: 2600, cost: 24, status: "ok" as const, installed: "02 jan. 2025" },
];

const STATUS_COLORS = { ok: "var(--bi-ok)", warn: "var(--bi-warn)", bad: "var(--bi-bad)" };
const ACTIVITY = [20, 15, 35, 8, 0, 42, 28, 18, 0, 32, 25, 40, 12, 0, 38, 22, 30, 8, 0, 28, 35, 18, 24, 0, 42, 0, 32, 28, 18, 32];

export default function BikeDetailPage() {
  return (
    <AppShell>
      <div style={{ padding: "24px 36px 40px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--bi-muted)", marginBottom: 10 }}>
          <Link href="/bikes" style={{ textDecoration: "none", color: "var(--bi-muted)" }}>Mes vélos</Link>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
          <span style={{ color: "var(--bi-ink)" }}>Canyon Aeroad</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1 }}>Canyon Aeroad CF SLX 8</span>
              <span style={{ fontSize: 10, padding: "4px 9px", background: "var(--bi-accent)", color: "var(--bi-accent-ink)", borderRadius: 999, fontWeight: 700, letterSpacing: 0.5 }}>ACTIF</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 6 }}>Route · acheté en juin 2024 · 142 sorties enregistrées</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ padding: "9px 14px", background: "transparent", color: "var(--bi-ink)", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 12.5, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>Renommer</button>
            <Link href="/components/new">
              <button style={{ padding: "9px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                Composant
              </button>
            </Link>
          </div>
        </div>

        {/* Hero stats — 5-cell row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1, background: "var(--bi-line)", borderRadius: 18, overflow: "hidden", marginBottom: 14 }}>
          {[
            ["Kilométrage", "2 840", "km"],
            ["Coût total", "1 247", "€"],
            ["Coût / km", "0,44", "€/km"],
            ["Sorties · 12 m", "142", ""],
            ["Moy. par sortie", "32,1", "km"],
          ].map(([k, v, u]) => (
            <div key={String(k)} style={{ background: "var(--bi-card)", padding: "20px 22px" }}>
              <BiLabel>{k}</BiLabel>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }}>{v}</Mono>
                {u && <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>{u}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Main grid: components table + right col */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>

          {/* Components table */}
          <BiCard pad={0}>
            <div style={{ padding: "20px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Composants · {COMPONENTS.length}</div>
                <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>Tri par taux d&apos;usure</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["Tous", "Transmission", "Roues", "Freinage"].map((f, i) => (
                  <span key={f} style={{
                    fontSize: 11, padding: "5px 11px", borderRadius: 999,
                    background: i === 0 ? "var(--bi-ink)" : "transparent",
                    color: i === 0 ? "var(--bi-bg)" : "var(--bi-muted)",
                    border: i === 0 ? "none" : "1px solid var(--bi-line)",
                    fontWeight: i === 0 ? 600 : 500,
                  }}>{f}</span>
                ))}
              </div>
            </div>
            {/* Column headers */}
            <div style={{
              padding: "8px 22px 6px",
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr 1.4fr 0.6fr 0.5fr 0.5fr",
              gap: 14,
              fontSize: 10.5,
              color: "var(--bi-muted)",
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              borderBottom: "1px solid var(--bi-line)",
            }}>
              <span>Composant</span>
              <span>Installé</span>
              <span>Usure</span>
              <span style={{ textAlign: "right" }}>Km</span>
              <span style={{ textAlign: "right" }}>Coût</span>
              <span style={{ textAlign: "right" }}>€/km</span>
            </div>
            {COMPONENTS.map((c) => {
              const color = STATUS_COLORS[c.status];
              return (
                <Link key={c.id} href={`/components/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{
                    padding: "14px 22px",
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr 1.4fr 0.6fr 0.5fr 0.5fr",
                    gap: 14,
                    alignItems: "center",
                    borderBottom: "1px solid var(--bi-line)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 4, height: 28, background: color, borderRadius: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>{c.model}</div>
                      </div>
                    </div>
                    <Mono style={{ fontSize: 11.5, color: "var(--bi-muted)" }}>{c.installed}</Mono>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={c.life} color={color} height={3} />
                      </div>
                      <Mono style={{ fontSize: 11, color: "var(--bi-muted)", width: 32, textAlign: "right" }}>
                        {Math.round(c.life * 100)}%
                      </Mono>
                    </div>
                    <Mono style={{ fontSize: 12, textAlign: "right" }}>{c.km.toLocaleString("fr")}</Mono>
                    <Mono style={{ fontSize: 12, textAlign: "right" }}>{c.cost} €</Mono>
                    <Mono style={{ fontSize: 11, color: "var(--bi-muted)", textAlign: "right" }}>
                      {(c.cost / c.km).toFixed(3)}
                    </Mono>
                  </div>
                </Link>
              );
            })}
          </BiCard>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Activity mini-chart */}
            <BiCard pad={22}>
              <BiLabel>Activité · 30 j</BiLabel>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }}>412</Mono>
                <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>km</span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: "var(--bi-ok)", fontWeight: 600 }}>+ 8 %</span>
              </div>
              <div style={{ marginTop: 14, height: 60, display: "flex", alignItems: "flex-end", gap: 3 }}>
                {ACTIVITY.map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${Math.max(2, h * 1.3)}%`, background: h > 30 ? "var(--bi-accent)" : h > 0 ? "#D9D8D2" : "var(--bi-line)", borderRadius: 2, minHeight: 2 }} />
                ))}
              </div>
            </BiCard>

            {/* Analyse intelligente */}
            <BiCard pad={22}>
              <BiLabel>Analyse intelligente</BiLabel>
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--bi-muted)", marginBottom: 4 }}>COMPOSANT CRITIQUE</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Dot color="var(--bi-bad)" size={6} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Chaîne · 94 % d&apos;usure</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--bi-muted)", marginBottom: 4 }}>POSTE LE PLUS COÛTEUX</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Pneumatiques · <Mono>412 €</Mono> · 33 %</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--bi-muted)", marginBottom: 4 }}>INCOHÉRENCE DÉTECTÉE</div>
                  <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>Pneu AR usé 2× plus vite que l&apos;AV — vérifier pression ou répartition du poids.</div>
                </div>
              </div>
            </BiCard>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
