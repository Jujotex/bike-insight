import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, Dot, PageHead } from "@/components/bi/ui";
import { SyncButton } from "@/components/bi/sync-button";
import { ManualRideButton } from "@/components/bi/manual-ride-button";
import { AddBikeButton } from "@/components/bi/add-bike-button";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function BikesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  const [{ data: bikes }, { data: yearActivities }, { data: profile }] = await Promise.all([
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
    supabase
      .from("profiles")
      .select("strava_athlete_id")
      .eq("id", user.id)
      .single(),
  ]);

  const stravaConnected = !!profile?.strava_athlete_id;
  const bikeList = bikes ?? [];

  // km, rides, last ride per bike (12m)
  const bikeStats12m = new Map<string, { km: number; rides: number; lastDate: string | null }>();
  for (const a of yearActivities ?? []) {
    if (!a.bike_id) continue;
    const cur = bikeStats12m.get(a.bike_id) ?? { km: 0, rides: 0, lastDate: null };
    cur.km += a.distance_km ?? 0;
    cur.rides += 1;
    if (!cur.lastDate || a.started_at > cur.lastDate) cur.lastDate = a.started_at;
    bikeStats12m.set(a.bike_id, cur);
  }

  // Most recently ridden bike = "active"
  let activeBikeId: string | null = null;
  let latestDate: string | null = null;
  for (const [bid, s] of bikeStats12m.entries()) {
    if (s.lastDate && (!latestDate || s.lastDate > latestDate)) {
      latestDate = s.lastDate;
      activeBikeId = bid;
    }
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

  const bikesMini = bikeList.map(b => ({ id: b.id as string, name: b.name as string }));

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 1100 }}>
        <PageHead
          title="Mes vélos"
          sub={`${bikeList.length} vélo${bikeList.length !== 1 ? "s" : ""} · ${totalKm.toLocaleString("fr-FR")} km cumulés`}
          actions={
            <div style={{ display: "flex", gap: 8 }}>
              <SyncButton stravaConnected={stravaConnected} />
              <ManualRideButton bikes={bikesMini} />
            </div>
          }
        />

        {/* Summary strip */}
        <div className="bi-grid-4" style={{ gap: 1, background: "var(--bi-line)", borderRadius: 16, overflow: "hidden", marginBottom: 22 }}>
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
          <div className="bi-grid-bikes">
            {bikeList.map((b, bikeIdx) => {
              const stats = bikeStats12m.get(b.id) ?? { km: 0, rides: 0, lastDate: null };
              const isActive = b.id === activeBikeId;
              const badCount = (b.bad_count as number) ?? 0;
              const warnCount = (b.warn_count as number) ?? 0;
              const costPerKm = (b.cost_per_km as number | null);
              const isStrava = !!(b.strava_gear_id as string | null);

              // Couleur cyclique par index — comme l'ancienne version
              const BIKE_COLORS = ["#F97316", "#8B5CF6", "#84CC16", "#06B6D4", "#F43F5E", "#A78BFA"];
              const bikeColor = BIKE_COLORS[bikeIdx % BIKE_COLORS.length];

              return (
                <Link key={b.id} href={`/bikes/${b.id}`} style={{ textDecoration: "none" }}>
                  <BiCard
                    pad={0}
                    style={{
                      overflow: "hidden",
                      cursor: "pointer",
                      border: isActive ? "1.5px solid var(--bi-ink)" : "1px solid var(--bi-line)",
                    }}
                  >
                    {/* Hero — fond sombre + quadrillage + SVG coloré */}
                    <div style={{
                      height: 160,
                      background: "#14141A",
                      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {/* SVG vélo coloré */}
                      <svg width="110" height="80" viewBox="0 0 110 80" fill="none" stroke={bikeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {/* Roues */}
                        <circle cx="24" cy="56" r="20"/>
                        <circle cx="86" cy="56" r="20"/>
                        {/* Moyeux */}
                        <circle cx="24" cy="56" r="3" fill={bikeColor}/>
                        <circle cx="86" cy="56" r="3" fill={bikeColor}/>
                        {/* Cadre */}
                        <path d="M24 56 L50 24 L86 56"/>
                        <path d="M50 24 L64 56"/>
                        <path d="M50 24 L38 24"/>
                        {/* Fourche */}
                        <path d="M86 56 L80 32 L86 26"/>
                        {/* Cintre */}
                        <path d="M76 26 L96 24"/>
                        <path d="M86 26 L86 20"/>
                        {/* Selle */}
                        <path d="M44 24 L58 24"/>
                        <path d="M51 24 L51 17"/>
                        {/* Pédalier */}
                        <circle cx="64" cy="56" r="5"/>
                        <line x1="60" y1="60" x2="68" y2="52"/>
                      </svg>

                      {/* Badge STRAVA ou MANUEL */}
                      <span style={{
                        position: "absolute", top: 12, left: 12,
                        fontSize: 9.5, padding: "3px 8px",
                        background: isStrava ? "#FC4C02" : "rgba(255,255,255,0.12)",
                        color: "#fff",
                        borderRadius: 999, fontWeight: 700, letterSpacing: 0.8,
                      }}>
                        {isStrava ? "STRAVA" : "MANUEL"}
                      </span>

                      {/* Km en bas à droite */}
                      <span style={{
                        position: "absolute", bottom: 12, right: 12,
                        fontSize: 11.5, fontWeight: 600,
                        color: bikeColor,
                        fontFamily: "var(--bi-font-mono)",
                      }}>
                        {((b.total_km as number) ?? 0).toLocaleString("fr-FR")} km
                      </span>

                      {/* ACTIF badge */}
                      {isActive && (
                        <span style={{
                          position: "absolute", top: 12, right: 12,
                          fontSize: 10, padding: "4px 9px",
                          background: "var(--bi-accent)", color: "var(--bi-accent-ink)",
                          borderRadius: 999, fontWeight: 700, letterSpacing: 0.5,
                        }}>
                          ACTIF
                        </span>
                      )}
                    </div>


                    <div style={{ padding: 18 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{b.name as string}</div>
                      <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>
                        {(b.brand as string | null) ? `${b.brand}${(b.model as string | null) ? ` · ${b.model}` : ""}` : ((b.model as string | null) ?? "Vélo")}
                      </div>

                      {/* Stats: km + coût/km */}
                      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <BiLabel>Kilométrage</BiLabel>
                          <div style={{ marginTop: 4 }}>
                            <Mono style={{ fontSize: 18, fontWeight: 500 }}>{((b.total_km as number) ?? 0).toLocaleString("fr")}</Mono>
                            <span style={{ fontSize: 11, color: "var(--bi-muted)" }}> km</span>
                          </div>
                        </div>
                        <div>
                          <BiLabel>Coût/km</BiLabel>
                          <div style={{ marginTop: 4 }}>
                            {costPerKm !== null && costPerKm !== undefined ? (
                              <>
                                <Mono style={{ fontSize: 18, fontWeight: 500 }}>{(costPerKm as number).toFixed(2)}</Mono>
                                <span style={{ fontSize: 11, color: "var(--bi-muted)" }}> €</span>
                              </>
                            ) : (
                              <Mono style={{ fontSize: 18, fontWeight: 500, color: "var(--bi-muted)" }}>—</Mono>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status strip */}
                      <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--bi-bg)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          {badCount > 0 && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--bi-bad)" }}>
                              <Dot color="var(--bi-bad)" size={6} />{badCount}
                            </span>
                          )}
                          {warnCount > 0 && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--bi-warn)" }}>
                              <Dot color="var(--bi-warn)" size={6} />{warnCount}
                            </span>
                          )}
                          {badCount === 0 && warnCount === 0 && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--bi-ok)" }}>
                              <Dot color="var(--bi-ok)" size={6} />Tout OK
                            </span>
                          )}
                        </div>
                        <Mono style={{ fontSize: 10.5, color: "var(--bi-muted)" }}>
                          {stats.rides} sortie{stats.rides !== 1 ? "s" : ""}
                        </Mono>
                      </div>

                      {/* Footer */}
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, color: "var(--bi-muted)" }}>
                          {formatLastRide(stats.lastDate)}
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
            <div style={{ borderRadius: 18, border: "1px dashed var(--bi-line)", minHeight: 320, overflow: "hidden" }}>
              <AddBikeButton />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
