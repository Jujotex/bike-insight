import { AppShell } from "@/components/bi/app-shell";
import { BiCard, BiLabel, Mono, Dot, PageHead, StatusPill } from "@/components/bi/ui";
import Link from "next/link";

const BIKES = [
  { id: "1", name: "Canyon Aeroad", model: "CF SLX 8 · 2024", type: "Route", km: 2840, cost: 1247, costPerKm: 0.44, sorties: 87, last: "Hier · 48 km", active: true, statusBad: 1, statusWarn: 1 },
  { id: "2", name: "Specialized Tarmac", model: "SL7 Comp · 2023", type: "Route", km: 1120, cost: 412, costPerKm: 0.37, sorties: 38, last: "Il y a 12 j · 32 km", active: false, statusBad: 0, statusWarn: 2 },
  { id: "3", name: "Cube Reaction", model: "C:62 Pro · 2022", type: "VTT", km: 540, cost: 188, costPerKm: 0.35, sorties: 17, last: "Avril · 18 km", active: false, statusBad: 0, statusWarn: 0 },
];

export default function BikesPage() {
  return (
    <AppShell>
      <div style={{ padding: "24px 28px 40px", maxWidth: 1100 }}>
        <PageHead
          title="Mes vélos"
          sub="3 vélos importés depuis Strava · 4 500 km cumulés"
          actions={
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "9px 14px", background: "transparent", color: "var(--bi-ink)", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 12.5, fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-3M20 14a8 8 0 01-14 3" /></svg>
                Resync Strava
              </button>
              <button style={{ padding: "9px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                Ajouter manuellement
              </button>
            </div>
          }
        />

        {/* Summary strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--bi-line)", borderRadius: 16, overflow: "hidden", marginBottom: 22 }}>
          {[["Vélos", "3"], ["Sorties · 12 m", "142"], ["Distance", "4 500 km"], ["Coût total", "1 847 €"]].map(([k, v]) => (
            <div key={String(k)} style={{ background: "var(--bi-card)", padding: "18px 22px" }}>
              <BiLabel>{k}</BiLabel>
              <Mono style={{ display: "block", fontSize: 24, fontWeight: 500, letterSpacing: -0.7, marginTop: 8 }}>{v}</Mono>
            </div>
          ))}
        </div>

        {/* Bikes grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {BIKES.map((b) => (
            <Link key={b.id} href={`/bikes/${b.id}`} style={{ textDecoration: "none" }}>
              <BiCard pad={0} style={{ border: b.active ? "1.5px solid var(--bi-ink)" : "1px solid var(--bi-line)", overflow: "hidden", cursor: "pointer" }}>
                {/* Hero placeholder */}
                <div style={{ height: 140, background: "#F0EFEA", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid var(--bi-line)" }}>
                  <svg width="74" height="74" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}>
                    <circle cx="5" cy="17" r="3.5" /><circle cx="19" cy="17" r="3.5" />
                    <path d="M12 7l-3 10h6l-3-10zM12 7V4h3" />
                  </svg>
                  {b.active && <span style={{ position: "absolute", top: 12, right: 12, fontSize: 10, padding: "4px 9px", background: "var(--bi-accent)", color: "var(--bi-accent-ink)", borderRadius: 999, fontWeight: 700, letterSpacing: 0.5 }}>ACTIF</span>}
                  <span style={{ position: "absolute", top: 12, left: 12, fontSize: 9.5, padding: "4px 9px", background: "var(--bi-card)", color: "var(--bi-muted)", borderRadius: 999, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{b.type}</span>
                </div>

                <div style={{ padding: 18 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{b.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>{b.model}</div>

                  <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <BiLabel>Kilométrage</BiLabel>
                      <div style={{ marginTop: 4 }}>
                        <Mono style={{ fontSize: 18, fontWeight: 500 }}>{b.km.toLocaleString("fr")}</Mono>
                        <span style={{ fontSize: 11, color: "var(--bi-muted)" }}> km</span>
                      </div>
                    </div>
                    <div>
                      <BiLabel>Coût/km</BiLabel>
                      <div style={{ marginTop: 4 }}>
                        <Mono style={{ fontSize: 18, fontWeight: 500 }}>{b.costPerKm.toFixed(2)}</Mono>
                        <span style={{ fontSize: 11, color: "var(--bi-muted)" }}> €</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--bi-bg)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {b.statusBad > 0 && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--bi-bad)" }}>
                          <Dot color="var(--bi-bad)" size={6} /> {b.statusBad}
                        </span>
                      )}
                      {b.statusWarn > 0 && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--bi-warn)" }}>
                          <Dot color="var(--bi-warn)" size={6} /> {b.statusWarn}
                        </span>
                      )}
                      {b.statusBad === 0 && b.statusWarn === 0 && (
                        <StatusPill kind="ok" label="Tout OK" />
                      )}
                    </div>
                    <Mono style={{ fontSize: 10.5, color: "var(--bi-muted)" }}>{b.sorties} sorties</Mono>
                  </div>

                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--bi-muted)" }}>{b.last}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      Détail <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                    </span>
                  </div>
                </div>
              </BiCard>
            </Link>
          ))}

          {/* Add bike slot */}
          <div style={{ borderRadius: 18, border: "1px dashed var(--bi-line)", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10, minHeight: 320, cursor: "pointer" }}>
            <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--bi-card)", border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>Ajouter un vélo manuel</div>
            <div style={{ fontSize: 11.5, color: "var(--bi-muted)", maxWidth: 200, lineHeight: 1.45 }}>Pour suivre un vélo qui n&apos;apparaît pas dans ton Strava.</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
