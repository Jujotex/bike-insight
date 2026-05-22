import { AppShell } from "@/components/bi/app-shell";
import { BiCard, BiLabel, Mono, Dot, PageHead, StatusPill } from "@/components/bi/ui";

const BIKES = [
  { name: "Canyon Aeroad", id: "b1734", km: 2840 },
  { name: "Specialized Tarmac", id: "b1735", km: 1120 },
  { name: "Cube Reaction", id: "b1736", km: 540 },
];

const ACTIVITIES = [
  { name: "Sortie matin", bike: "Canyon Aeroad", date: "22 mai · 7h12", dist: "48,2 km", dur: "1h42", elev: "420 m" },
  { name: "Sortie club", bike: "Canyon Aeroad", date: "20 mai · 9h00", dist: "92,4 km", dur: "3h18", elev: "980 m" },
  { name: "Aller travail", bike: "Specialized Tarmac", date: "19 mai · 8h30", dist: "12,1 km", dur: "28 min", elev: "60 m" },
  { name: "Rouleurs 30/30", bike: "Canyon Aeroad", date: "18 mai · 18h45", dist: "54,8 km", dur: "1h54", elev: "510 m" },
  { name: "Recovery", bike: "Specialized Tarmac", date: "17 mai · 10h12", dist: "32,2 km", dur: "1h12", elev: "220 m" },
  { name: "Aller travail", bike: "Specialized Tarmac", date: "16 mai · 8h28", dist: "12,1 km", dur: "32 min", elev: "60 m" },
];

export default function SyncPage() {
  return (
    <AppShell>
      <div style={{ padding: "24px 28px 40px", maxWidth: 1100 }}>
        <PageHead
          title="Strava"
          sub="Statut de la connexion, dernière synchronisation et activités importées"
          actions={
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "9px 14px", background: "transparent", color: "var(--bi-bad)", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 12.5, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
                Déconnecter Strava
              </button>
              <button style={{ padding: "9px 16px", background: "#FC4C02", color: "#fff", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-3M20 14a8 8 0 01-14 3" /></svg>
                Resynchroniser
              </button>
            </div>
          }
        />

        {/* Connection hero */}
        <BiCard pad={28} style={{ marginBottom: 14, borderLeft: "4px solid var(--bi-ok)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#FC4C02", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>St</span>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 600 }}>Strava</span>
                <StatusPill kind="ok" label="CONNECTÉ" />
              </div>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>
                Connecté en tant que <Mono style={{ color: "var(--bi-ink)", fontWeight: 600 }}>leo.martin@strava</Mono> · depuis le 18 juin 2024
              </div>
            </div>
            <div>
              <BiLabel>Dernière sync</BiLabel>
              <Mono style={{ display: "block", fontSize: 16, fontWeight: 500, marginTop: 6 }}>il y a 4 min</Mono>
            </div>
            <div>
              <BiLabel>Auto-sync</BiLabel>
              <Mono style={{ display: "block", fontSize: 16, fontWeight: 500, marginTop: 6 }}>15 min</Mono>
            </div>
          </div>
        </BiCard>

        {/* Permissions + bikes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <BiCard pad={24}>
            <BiLabel style={{ marginBottom: 14 }}>Permissions Strava actives</BiLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[["Lecture des activités", "activity:read_all"], ["Liste vélos + profil", "profile:read_all"]].map(([k, v], i) => (
                <div key={String(k)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 1 ? "1px solid var(--bi-line)" : "none" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 999, background: "var(--bi-ok)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 7" /></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{k}</div>
                    <Mono style={{ fontSize: 10.5, color: "var(--bi-muted)", display: "block", marginTop: 2 }}>{String(v)}</Mono>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, fontSize: 11.5, color: "var(--bi-muted)", lineHeight: 1.55 }}>
              Pour modifier ces permissions, va sur <Mono style={{ color: "var(--bi-ink)" }}>strava.com/settings/apps</Mono>.
            </div>
          </BiCard>

          <BiCard pad={24}>
            <BiLabel style={{ marginBottom: 14 }}>Vélos détectés sur Strava</BiLabel>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {BIKES.map((b, i) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < BIKES.length - 1 ? "1px solid var(--bi-line)" : "none" }}>
                  <Dot color="var(--bi-ok)" />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{b.name}</span>
                  <Mono style={{ fontSize: 10.5, color: "var(--bi-muted)" }}>{b.id}</Mono>
                  <Mono style={{ fontSize: 12.5, fontWeight: 500, minWidth: 80, textAlign: "right" }}>{b.km.toLocaleString("fr")} km</Mono>
                </div>
              ))}
            </div>
          </BiCard>
        </div>

        {/* Activities table */}
        <BiCard pad={0}>
          <div style={{ padding: "20px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Activités importées récemment</div>
              <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>142 sorties au total · les 6 dernières affichées</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              Voir tout <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 0.7fr 0.6fr 0.5fr", padding: "8px 22px", gap: 14, fontSize: 10.5, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--bi-line)" }}>
            <span>Activité</span><span>Vélo</span><span>Date</span><span style={{ textAlign: "right" }}>Distance</span><span style={{ textAlign: "right" }}>Durée</span><span style={{ textAlign: "right" }}>D+</span>
          </div>
          {ACTIVITIES.map((a, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 0.7fr 0.6fr 0.5fr", padding: "14px 22px", gap: 14, alignItems: "center", borderBottom: "1px solid var(--bi-line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F0EFEA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" />
                    <path d="M12 7l-3 10h6l-3-10zM12 7V4h3" />
                  </svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>{a.bike}</span>
              <Mono style={{ fontSize: 11.5, color: "var(--bi-muted)" }}>{a.date}</Mono>
              <Mono style={{ fontSize: 12.5, fontWeight: 500, textAlign: "right" }}>{a.dist}</Mono>
              <Mono style={{ fontSize: 12, color: "var(--bi-muted)", textAlign: "right" }}>{a.dur}</Mono>
              <Mono style={{ fontSize: 12, color: "var(--bi-muted)", textAlign: "right" }}>{a.elev}</Mono>
            </div>
          ))}
        </BiCard>
      </div>
    </AppShell>
  );
}
