import { AppShell } from "@/components/bi/app-shell";
import { BiCard, BiLabel, Mono, Dot, ProgressBar } from "@/components/bi/ui";
import Link from "next/link";

const COMPONENTS = [
  { name: "Chaîne", model: "Ultegra CN-HG701", life: 0.94, km: 2840, max: 3000, cost: 38, status: "bad" as const },
  { name: "Pneus AR", model: "Continental GP5000 25c", life: 0.71, km: 2840, max: 4000, cost: 52, status: "warn" as const },
  { name: "Cassette", model: "Ultegra 11-30", life: 0.42, km: 2840, max: 6800, cost: 85, status: "ok" as const },
  { name: "Plateaux", model: "52/36 4-Iron", life: 0.18, km: 2840, max: 16000, cost: 140, status: "ok" as const },
  { name: "Plaquettes AV", model: "Shimano L03A", life: 0.55, km: 1420, max: 2600, cost: 24, status: "ok" as const },
];

const STATUS_COLORS = {
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
};

const ACTIVITY = [20, 15, 35, 8, 0, 42, 28, 18, 0, 32, 25, 40, 12, 0, 38, 22, 30, 8, 0, 28, 35, 18, 24, 0, 42, 0, 32, 28, 18, 32];

const DIST = [
  { name: "Transmission", value: 263, color: "var(--bi-accent)" },
  { name: "Pneumatiques", value: 412, color: "var(--bi-warn)" },
  { name: "Freinage", value: 168, color: "var(--bi-ok)" },
  { name: "Autre", value: 404, color: "var(--bi-muted)" },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div style={{ padding: "24px 36px 40px" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Lundi 22 mai · Vue d&apos;ensemble
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1, marginTop: 4 }}>Canyon Aeroad</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 12.5, color: "var(--bi-muted)" }}>
              <Dot color="var(--bi-ok)" size={6} /> Sync · il y a 4 min
            </div>
            <button style={{ padding: "8px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              Composant
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 18 }}>
          {[
            { k: "Coût total · 12 mois", v: "1 247", u: "€", sub: "+ 14 % vs moyenne", c: "var(--bi-bad)" },
            { k: "Coût par km", v: "0,44", u: "€/km", sub: "au-dessus médiane", c: "var(--bi-muted)" },
            { k: "Distance · 12 mois", v: "2 840", u: "km", sub: "142 sorties", c: "var(--bi-muted)" },
            { k: "État global", v: "68", u: "%", sub: "1 alerte critique", c: "var(--bi-bad)" },
          ].map(({ k, v, u, sub, c }) => (
            <BiCard key={k} pad={20}>
              <BiLabel>{k}</BiLabel>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
                <Mono style={{ fontSize: 40, fontWeight: 500, letterSpacing: -1.2 }}>{v}</Mono>
                <span style={{ fontSize: 16, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>{u}</span>
              </div>
              <div style={{ fontSize: 11.5, color: c, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <Dot color={c} size={5} />{sub}
              </div>
            </BiCard>
          ))}
        </div>

        {/* Main grid 1.4fr 1fr */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 18 }}>

          {/* Components table */}
          <BiCard pad={0}>
            <div style={{ padding: "20px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>État du matériel</div>
                <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>5 composants suivis · basé sur kilométrage importé</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--bi-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                Trier par usure
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 10l5 5 5-5" /></svg>
              </div>
            </div>
            {/* Column headers */}
            <div style={{
              padding: "8px 22px 6px",
              display: "grid",
              gridTemplateColumns: "1.4fr 0.7fr 1.4fr 0.6fr 0.6fr 0.3fr",
              gap: 14,
              fontSize: 10.5,
              color: "var(--bi-muted)",
              fontWeight: 600,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              borderBottom: "1px solid var(--bi-line)",
            }}>
              <span>Composant</span>
              <span>Statut</span>
              <span>Usure</span>
              <span style={{ textAlign: "right" }}>Km</span>
              <span style={{ textAlign: "right" }}>Coût</span>
              <span />
            </div>
            {COMPONENTS.map((c) => {
              const color = STATUS_COLORS[c.status];
              return (
                <div
                  key={c.name}
                  style={{
                    padding: "16px 22px",
                    display: "grid",
                    gridTemplateColumns: "1.4fr 0.7fr 1.4fr 0.6fr 0.6fr 0.3fr",
                    gap: 14,
                    alignItems: "center",
                    borderBottom: "1px solid var(--bi-line)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>{c.model}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color }}>
                    <Dot color={color} size={6} />
                    {c.status === "bad" ? "Remplacer" : c.status === "warn" ? "Surveiller" : "OK"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={c.life} color={color} height={3} />
                    </div>
                    <Mono style={{ fontSize: 11.5, color: "var(--bi-muted)", width: 36, textAlign: "right" }}>
                      {Math.round(c.life * 100)} %
                    </Mono>
                  </div>
                  <Mono style={{ fontSize: 12.5, textAlign: "right" }}>{c.km.toLocaleString("fr")}</Mono>
                  <Mono style={{ fontSize: 12.5, textAlign: "right" }}>{c.cost} €</Mono>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="2" style={{ justifySelf: "end" }}>
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </div>
              );
            })}
          </BiCard>

          {/* Right column: priority action + insights */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Priority action */}
            <div style={{ background: "#0E0E10", color: "#fff", borderRadius: 18, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Dot color="var(--bi-accent)" size={6} />
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--bi-accent)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Action prioritaire</span>
                </div>
                <Mono style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>1/2</Mono>
              </div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.2, marginTop: 14 }}>
                Remplacer la chaîne sous ~200 km
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", marginTop: 8, lineHeight: 1.5 }}>
                Une chaîne usée à 94 % accélère l&apos;usure de la cassette (85 €) et des plateaux (140 €). Coût évité estimé · 180 €.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <Link href="/components/1">
                  <button style={{ background: "var(--bi-accent)", color: "var(--bi-accent-ink)", border: "none", borderRadius: 999, padding: "9px 14px", fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>Voir options</button>
                </Link>
                <button style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "none", borderRadius: 999, padding: "9px 14px", fontSize: 12, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>Marquer remplacé</button>
              </div>
            </div>

            {/* Insights compact */}
            <BiCard pad={20}>
              <BiLabel>Insights · 3</BiLabel>
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  ["Chaînes remplacées 30 % trop tôt", "var(--bi-accent)"],
                  ["Pneus AR usés 2× plus vite que AV", "var(--bi-warn)"],
                  ["Transmission = 60 % du budget", "var(--bi-muted)"],
                ].map(([text, color]) => (
                  <div key={String(text)} style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid var(--bi-line)" }}>
                    <div style={{ width: 3, height: 24, background: color, borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 500 }}>{text}</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="2">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </div>
                ))}
              </div>
            </BiCard>

          </div>
        </div>

        {/* Activity + cost split */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>

          {/* Activity chart */}
          <BiCard pad={22}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Activité · 30 derniers jours</div>
                <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>412 km · 14 sorties · moyenne 29 km</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, background: "var(--bi-ink)", color: "var(--bi-bg)", fontWeight: 600 }}>30 j</span>
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, border: "1px solid var(--bi-line)", color: "var(--bi-muted)" }}>90 j</span>
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, border: "1px solid var(--bi-line)", color: "var(--bi-muted)" }}>12 m</span>
              </div>
            </div>
            <div style={{ marginTop: 18, height: 80, display: "flex", alignItems: "flex-end", gap: 4 }}>
              {ACTIVITY.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${Math.max(2, h * 1.6)}%`,
                    background: h > 30 ? "var(--bi-accent)" : h > 0 ? "#D9D8D2" : "var(--bi-line)",
                    borderRadius: 2,
                    minHeight: 2,
                  }}
                />
              ))}
            </div>
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>
              <span>22 avr.</span><span>1 mai</span><span>10 mai</span><span>22 mai</span>
            </div>
          </BiCard>

          {/* Cost distribution */}
          <BiCard pad={22}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Répartition du coût</div>
            <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>par poste · 12 mois</div>
            <div style={{ marginTop: 18, height: 8, borderRadius: 999, overflow: "hidden", display: "flex", gap: 2 }}>
              {DIST.map((d) => (
                <div key={d.name} style={{ flex: d.value, background: d.color }} />
              ))}
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {DIST.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <Dot color={d.color} size={8} />
                  <span style={{ flex: 1 }}>{d.name}</span>
                  <Mono style={{ fontWeight: 500 }}>{d.value} €</Mono>
                </div>
              ))}
            </div>
          </BiCard>

        </div>
      </div>
    </AppShell>
  );
}
