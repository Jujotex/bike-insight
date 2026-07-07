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

  const [{ data: bikes }, { data: yearActivities }, { data: profile }, { data: configuredBikes }, { data: maintLogs }] = await Promise.all([
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
    supabase
      .from("components")
      .select("bike_id")
      .eq("user_id", user.id)
      .eq("is_active", true),
    // Dépense d'entretien réelle (remplacements + entretiens) — tous vélos
    supabase
      .from("maintenance_logs")
      .select("cost")
      .eq("user_id", user.id)
      .not("cost", "is", null),
  ]);

  const configuredBikeIds = new Set((configuredBikes ?? []).map(c => c.bike_id as string));

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
  const totalCost = Math.round((maintLogs ?? []).reduce((s, l) => s + ((l.cost as number) ?? 0), 0));

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
            ["Dépensé en entretien", `${totalCost.toLocaleString("fr-FR")} €`],
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
              const isStrava = !!(b.strava_gear_id as string | null);
              const isConfigured = configuredBikeIds.has(b.id as string);

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
                      {/* SVG vélo cartoon « Chunky » — traits épais, arrondis */}
                      <svg width="140" height="94" viewBox="0 0 150 100" fill="none">
                        <g stroke={bikeColor} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
                          {/* Roues (fond = hero sombre) */}
                          <circle cx="34" cy="66" r="22" fill="#14141A"/>
                          <circle cx="116" cy="66" r="22" fill="#14141A"/>
                          {/* Cadre losange + fourche */}
                          <path d="M34 66 L70 66 L58 34 L92 34 M70 66 L92 34 M92 34 L116 66"/>
                          {/* Tige de selle + selle */}
                          <path d="M58 34 L54 24 M46 24 L64 24"/>
                          {/* Potence + cintre */}
                          <path d="M92 34 L92 24 M85 22 L99 22"/>
                        </g>
                        {/* Moyeux + pédalier pleins */}
                        <circle cx="34" cy="66" r="5" fill={bikeColor}/>
                        <circle cx="116" cy="66" r="5" fill={bikeColor}/>
                        <circle cx="70" cy="66" r="6" fill={bikeColor}/>
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

                      {/* Badge non configuré */}
                      {!isConfigured && (
                        <Link
                          href={`/onboarding?bike_id=${b.id}`}
                          style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, background: "rgba(199,255,63,0.08)", border: "1px solid rgba(199,255,63,0.25)", textDecoration: "none" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--bi-ok)" }}>Configurer le matériel</span>
                        </Link>
                      )}

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
