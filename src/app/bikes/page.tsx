import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, Dot, PageHead, StatusPill } from "@/components/bi/ui";
import { SyncButton } from "@/components/bi/sync-button";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function BikesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  const [{ data: bikes }, { data: yearActivities }] = await Promise.all([
    supabase
      .from("bike_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("total_km", { ascending: false }),
    supabase
      .from("activities")
      .select("bike_id, distance_km, started_at")
      .eq("user_id", user.id)
      .gte("started_at", twelveMonthsAgo.toISOString()),
  ]);

  const bikeList = bikes ?? [];

  // km and rides per bike (12m)
  const bikeStats12m = new Map<string, { km: number; rides: number; lastDate: string | null }>();
  for (const a of yearActivities ?? []) {
    if (!a.bike_id) continue;
    const cur = bikeStats12m.get(a.bike_id) ?? { km: 0, rides: 0, lastDate: null };
    cur.km += a.distance_km ?? 0;
    cur.rides += 1;
    if (!cur.lastDate || a.started_at > cur.lastDate) cur.lastDate = a.started_at;
    bikeStats12m.set(a.bike_id, cur);
  }

  const totalKm = bikeList.reduce((s, b) => s + (b.total_km ?? 0), 0);
  const totalRides = Array.from(bikeStats12m.values()).reduce((s, v) => s + v.rides, 0);
  const totalCost = bikeList.reduce((s, b) => s + ((b.total_cost as number) ?? 0), 0);

  function formatLastRide(iso: string | null): string {
    if (!iso) return "Aucune sortie";
    const d = new Date(iso);
    const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
    return d.toLocaleDateString("fr-FR", { month: "long" });
  }

  return (
    <AppShell nav={<SideNavLoader />}>
      <div style={{ padding: "24px 28px 40px", maxWidth: 1100 }}>
        <PageHead
          title="Mes vélos"
          sub={`${bikeList.length} vélo${bikeList.length !== 1 ? "s" : ""} importé${bikeList.length !== 1 ? "s" : ""} depuis Strava · ${totalKm.toLocaleString("fr-FR")} km cumulés`}
          actions={<SyncButton />}
        />

        {/* Summary strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--bi-line)", borderRadius: 16, overflow: "hidden", marginBottom: 22 }}>
          {[
            ["Vélos", String(bikeList.length)],
            ["Sorties · 12 m", String(totalRides)],
            ["Distance totale", `${totalKm.toLocaleString("fr-FR")} km`],
            ["Coût composants", `${Math.round(totalCost).toLocaleString("fr-FR")} €`],
          ].map(([k, v]) => (
            <div key={String(k)} style={{ background: "var(--bi-card)", padding: "18px 22px" }}>
              <BiLabel>{k}</BiLabel>
              <Mono style={{ display: "block", fontSize: 24, fontWeight: 500, letterSpacing: -0.7, marginTop: 8 }}>{v}</Mono>
            </div>
          ))}
        </div>

        {bikeList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--bi-muted)" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🚴</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--bi-ink)" }}>Aucun vélo importé</div>
            <div style={{ fontSize: 13, marginTop: 8, marginBottom: 24 }}>Connecte ton compte Strava pour importer tes vélos.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {bikeList.map((b) => {
              const stats = bikeStats12m.get(b.id) ?? { km: 0, rides: 0, lastDate: null };
              const badCount = (b.most_critical_component ? 1 : 0); // proxy — component_stats not joined here
              return (
                <Link key={b.id} href={`/bikes/${b.id}`} style={{ textDecoration: "none" }}>
                  <BiCard pad={0} style={{ overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.15s" }}>
                    {/* Hero */}
                    <div style={{ height: 140, background: "#F0EFEA", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid var(--bi-line)" }}>
                      <svg width="74" height="74" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45 }}>
                        <circle cx="5" cy="17" r="3.5" /><circle cx="19" cy="17" r="3.5" />
                        <path d="M12 7l-3 10h6l-3-10zM12 7V4h3" />
                      </svg>
                      {b.strava_gear_id && (
                        <span style={{ position: "absolute", top: 12, left: 12, fontSize: 9.5, padding: "4px 9px", background: "#FC4C02", color: "#fff", borderRadius: 999, fontWeight: 600, letterSpacing: 0.5 }}>STRAVA</span>
                      )}
                    </div>

                    <div style={{ padding: 18 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{b.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>
                        {b.brand ? `${b.brand}${b.model ? ` · ${b.model}` : ""}` : (b.model ?? "Vélo")}
                      </div>

                      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <BiLabel>Kilométrage total</BiLabel>
                          <div style={{ marginTop: 4 }}>
                            <Mono style={{ fontSize: 18, fontWeight: 500 }}>{(b.total_km ?? 0).toLocaleString("fr")}</Mono>
                            <span style={{ fontSize: 11, color: "var(--bi-muted)" }}> km</span>
                          </div>
                        </div>
                        <div>
                          <BiLabel>Sorties · 12 m</BiLabel>
                          <div style={{ marginTop: 4 }}>
                            <Mono style={{ fontSize: 18, fontWeight: 500 }}>{stats.rides}</Mono>
                            <span style={{ fontSize: 11, color: "var(--bi-muted)" }}> sorties</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--bi-bg)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {b.most_critical_component ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--bi-bad)" }}>
                            <Dot color="var(--bi-bad)" size={6} /> {b.most_critical_component}
                          </span>
                        ) : (
                          <StatusPill kind="ok" label="Tout OK" />
                        )}
                        <Mono style={{ fontSize: 10.5, color: "var(--bi-muted)" }}>
                          {(b.component_count as number) ?? 0} composant{((b.component_count as number) ?? 0) !== 1 ? "s" : ""}
                        </Mono>
                      </div>

                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, color: "var(--bi-muted)" }}>
                          Dernière sortie : {formatLastRide(stats.lastDate)}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          Détail <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                        </span>
                      </div>
                    </div>
                  </BiCard>
                </Link>
              );
            })}

            {/* Add bike slot */}
            <div style={{ borderRadius: 18, border: "1px dashed var(--bi-line)", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10, minHeight: 320 }}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--bi-card)", border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Vélo non Strava ?</div>
              <div style={{ fontSize: 11.5, color: "var(--bi-muted)", maxWidth: 200, lineHeight: 1.45 }}>
                Lance une synchronisation pour importer les vélos depuis Strava.
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
