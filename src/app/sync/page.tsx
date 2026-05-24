import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, Dot, PageHead, StatusPill } from "@/components/bi/ui";
import { SyncButton } from "@/components/bi/sync-button";
import { redirect } from "next/navigation";
import { getSyncData } from "@/lib/data";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${m.toString().padStart(2, "0")}`
  return `${m} min`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const day = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  return `${day} · ${time}`
}

export default async function SyncPage() {
  const data = await getSyncData();
  if (!data) redirect("/login");

  const { bikes, activities, profile } = data;

  const stravaConnected = !!profile?.strava_athlete_id;

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 1100 }}>
        <PageHead
          title="Strava"
          sub="Statut de la connexion, dernière synchronisation et activités importées"
          actions={
            <div style={{ display: "flex", gap: 8 }}>
              <SyncButton />
            </div>
          }
        />

        {/* Connection hero */}
        <BiCard pad={28} style={{ marginBottom: 14, borderLeft: `4px solid ${stravaConnected ? "var(--bi-ok)" : "var(--bi-bad)"}` }}>
          <div className="bi-hero-card">
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#FC4C02", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>St</span>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 600 }}>Strava</span>
                {stravaConnected
                  ? <StatusPill kind="ok" label="CONNECTÉ" />
                  : <StatusPill kind="bad" label="DÉCONNECTÉ" />
                }
              </div>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>
                {stravaConnected
                  ? <>Athlete ID : <Mono style={{ color: "var(--bi-ink)", fontWeight: 600 }}>{profile.strava_athlete_id}</Mono></>
                  : "Connecte ton compte Strava pour importer tes activités"
                }
              </div>
            </div>
            <div className="bi-hero-card-count">
              <BiLabel>Activités importées</BiLabel>
              <Mono style={{ display: "block", fontSize: 22, fontWeight: 600, marginTop: 6 }}>{activities.length > 0 ? `${activities.length}+` : "0"}</Mono>
            </div>
          </div>
        </BiCard>

        {/* Permissions + bikes */}
        <div className="bi-grid-2" style={{ marginBottom: 14 }}>
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
            {bikes.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--bi-muted)", paddingTop: 8 }}>Aucun vélo détecté — lance une synchronisation.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {bikes.map((b, i) => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < bikes.length - 1 ? "1px solid var(--bi-line)" : "none" }}>
                    <Dot color="var(--bi-ok)" />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{b.name}</span>
                    {b.strava_gear_id && <Mono style={{ fontSize: 10.5, color: "var(--bi-muted)" }}>{b.strava_gear_id}</Mono>}
                    <Mono style={{ fontSize: 12.5, fontWeight: 500, minWidth: 80, textAlign: "right" }}>
                      {(b.total_km ?? 0).toLocaleString("fr")} km
                    </Mono>
                  </div>
                ))}
              </div>
            )}
          </BiCard>
        </div>

        {/* Activities table */}
        <BiCard pad={0}>
          <div style={{ padding: "20px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Activités importées récemment</div>
              <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>
                {activities.length === 0 ? "Aucune activité importée" : `${activities.length} dernières activités affichées`}
              </div>
            </div>
          </div>
          {activities.length === 0 ? (
            <div style={{ padding: "24px 22px", fontSize: 13, color: "var(--bi-muted)" }}>
              Lance une synchronisation pour importer tes activités Strava.
            </div>
          ) : (
            <>
              <div className="bi-table-scroll"><div style={{ minWidth: 600 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 0.7fr 0.6fr 0.5fr", padding: "8px 22px", gap: 14, fontSize: 10.5, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--bi-line)" }}>
                <span>Activité</span><span>Vélo</span><span>Date</span><span style={{ textAlign: "right" }}>Distance</span><span style={{ textAlign: "right" }}>Durée</span><span style={{ textAlign: "right" }}>D+</span>
              </div>
              {activities.map((a, i) => (
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
                  <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>{a.bikeName}</span>
                  <Mono style={{ fontSize: 11.5, color: "var(--bi-muted)" }}>{formatDate(a.started_at)}</Mono>
                  <Mono style={{ fontSize: 12.5, fontWeight: 500, textAlign: "right" }}>
                    {(a.distance_km ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km
                  </Mono>
                  <Mono style={{ fontSize: 12, color: "var(--bi-muted)", textAlign: "right" }}>
                    {a.moving_time_s ? formatDuration(a.moving_time_s) : "—"}
                  </Mono>
                  <Mono style={{ fontSize: 12, color: "var(--bi-muted)", textAlign: "right" }}>
                    {a.elevation_m ? `${Math.round(a.elevation_m)} m` : "—"}
                  </Mono>
                </div>
              ))}
            </div></div>
            </>
          )}
        </BiCard>
      </div>
    </AppShell>
  );
}
