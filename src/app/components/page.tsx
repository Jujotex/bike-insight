import { AppShell } from "@/components/bi/app-shell";
import { BiCard, BiLabel, Mono, Dot, ProgressBar, PageHead } from "@/components/bi/ui";
import Link from "next/link";

const ALL_COMPONENTS = [
  { id: "1", bike: "Canyon Aeroad", name: "Chaîne", model: "Shimano Ultegra CN-HG701", life: 0.94, km: 2840, max: 3000, cost: 38, status: "bad" as const },
  { id: "2", bike: "Canyon Aeroad", name: "Pneus", model: "Continental GP5000 25c", life: 0.71, km: 2840, max: 4000, cost: 52, status: "warn" as const },
  { id: "3", bike: "Canyon Aeroad", name: "Cassette", model: "Ultegra 11-30", life: 0.42, km: 2840, max: 6800, cost: 85, status: "ok" as const },
  { id: "4", bike: "Canyon Aeroad", name: "Plaquettes AV", model: "Shimano L03A", life: 0.55, km: 1420, max: 2600, cost: 24, status: "ok" as const },
  { id: "5", bike: "Canyon Aeroad", name: "Plateaux", model: "52/36 4-Iron", life: 0.18, km: 2840, max: 16000, cost: 140, status: "ok" as const },
  { id: "6", bike: "Specialized Tarmac", name: "Chaîne", model: "Shimano 105 HG601", life: 0.52, km: 1120, max: 2200, cost: 28, status: "ok" as const },
  { id: "7", bike: "Specialized Tarmac", name: "Pneus", model: "Specialized Turbo Pro 700c", life: 0.65, km: 1120, max: 1700, cost: 65, status: "warn" as const },
];
const STATUS_COLORS = { ok: "var(--bi-ok)", warn: "var(--bi-warn)", bad: "var(--bi-bad)" };

export default function ComponentsPage() {
  return (
    <AppShell>
      <div style={{ padding: "24px 28px 40px", maxWidth: 1100 }}>
        <PageHead
          title="Composants"
          sub={`${ALL_COMPONENTS.length} composants suivis sur 3 vélos`}
          actions={
            <Link href="/components/new">
              <button style={{ padding: "9px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                Déclarer un composant
              </button>
            </Link>
          }
        />

        <BiCard pad={0}>
          <div style={{ display: "grid", gridTemplateColumns: "40px 1.5fr 1fr 1fr 140px 80px 80px", padding: "8px 22px", gap: 14, fontSize: 10.5, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--bi-line)" }}>
            <span></span>
            <span>Composant</span>
            <span>Vélo</span>
            <span>Usure</span>
            <span>Progression</span>
            <span style={{ textAlign: "right" }}>Km</span>
            <span style={{ textAlign: "right" }}>Coût</span>
          </div>
          {ALL_COMPONENTS.map((c, i) => {
            const color = STATUS_COLORS[c.status];
            return (
              <Link key={c.id} href={`/components/${c.id}`} style={{ textDecoration: "none" }}>
                <div style={{ display: "grid", gridTemplateColumns: "40px 1.5fr 1fr 1fr 140px 80px 80px", padding: "14px 22px", gap: 14, alignItems: "center", borderBottom: "1px solid var(--bi-line)", cursor: "pointer" }}>
                  <Dot color={color} size={8} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>{c.model}</div>
                  </div>
                  <span style={{ fontSize: 12.5, color: "var(--bi-muted)" }}>{c.bike}</span>
                  <Mono style={{ fontSize: 14, fontWeight: 500, color }}>{Math.round(c.life * 100)} %</Mono>
                  <ProgressBar value={c.life} color={color} height={4} />
                  <Mono style={{ fontSize: 12, color: "var(--bi-muted)", textAlign: "right" }}>{c.km.toLocaleString("fr")}</Mono>
                  <Mono style={{ fontSize: 12.5, fontWeight: 500, textAlign: "right" }}>{c.cost} €</Mono>
                </div>
              </Link>
            );
          })}
        </BiCard>
      </div>
    </AppShell>
  );
}
