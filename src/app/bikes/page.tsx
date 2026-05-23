import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, Dot, PageHead, StatusPill } from "@/components/bi/ui";
import { SyncButton } from "@/components/bi/sync-button";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

// Palette de fonds pour les cartes vélos
const BIKE_PALETTES = [
  { bg: "#1A1A2E", accent: "#C7FF3F", stroke: "rgba(199,255,63,0.6)" },
  { bg: "#0F2027", accent: "#FC4C02", stroke: "rgba(252,76,2,0.6)"  },
  { bg: "#1C1C1C", accent: "#A78BFA", stroke: "rgba(167,139,250,0.6)" },
  { bg: "#0D1F12", accent: "#34D399", stroke: "rgba(52,211,153,0.6)" },
  { bg: "#1E1B2E", accent: "#F59E0B", stroke: "rgba(245,158,11,0.6)" },
];

function bikeColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return BIKE_PALETTES[hash % BIKE_PALETTES.length];
}

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
      <div className="bi-page" style={{ maxWidth: 1100 }}>
        <PageHead
          title="Mes vélos"
          sub={`${bikeList.length} vélo${bikeList.length !== 1 ? "s" : ""} importé${bikeList.length !== 1 ? "s" : ""} depuis Strava · ${totalKm.toLocaleString("fr-FR")} km cumulés`}
          actions={<SyncButton />}
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {bikeList.map((b) => {
              const stats = bikeStats12m.get(b.id) ?? { km: 0, rides: 0, lastDate: null };
              const palette = bikeColor(b.name as string);
              return (
                <Link key={b.id} href={`/bikes/${b.id}`} style={{ textDecoration: "none" }}>
                  <BiCard pad={0} style={{ overflow: "hidden", cursor: "pointer" }}>
                    {/* Hero illustration */}
                    <div style={{ height: 150, background: palette.bg, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {/* Subtle grid */}
                      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07 }} xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id={`grid-${b.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
                            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="white" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#grid-${b.id})`} />
                      </svg>
                      {/* Bike SVG illustration */}
                      <svg width="110" height="80" viewBox="0 0 110 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Rear wheel */}
                        <circle cx="22" cy="54" r="18" stroke={palette.stroke} strokeWidth="3"/>
                        <circle cx="22" cy="54" r="3" fill={palette.accent}/>
                        {/* Front wheel */}
                        <circle cx="88" cy="54" r="18" stroke={palette.stroke} strokeWidth="3"/>
                        <circle cx="88" cy="54" r="3" fill={palette.accent}/>
                        {/* Frame */}
                        <path d="M22 54 L50 20 L78 54" stroke={palette.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M50 20 L88 54" stroke={palette.stroke} strokeWidth="2.5" strokeLinecap="round"/>
                        <path d="M22 54 L65 54" stroke={palette.stroke} strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Seat post */}
                        <path d="M50 20 L48 8" stroke={palette.stroke} strokeWidth="2" strokeLinecap="round"/>
                        <path d="M42 8 L56 8" stroke={palette.accent} strokeWidth="2.5" strokeLinecap="round"/>
                        {/* Fork */}
                        <path d="M78 54 L82 30" stroke={palette.stroke} strokeWidth="2" strokeLinecap="round"/>
                        {/* Handlebar */}
                        <path d="M78 26 L90 24" stroke={palette.accent} strokeWidth="2.5" strokeLinecap="round"/>
                        <circle cx="82" cy="30" r="2" fill={palette.accent}/>
                        {/* Spokes rear */}
                        <line x1="22" y1="36" x2="22" y2="54" stroke={palette.stroke} strokeWidth="1" opacity="0.5"/>
                        <line x1="8" y1="48" x2="22" y2="54" stroke={palette.stroke} strokeWidth="1" opacity="0.5"/>
                        <line x1="36" y1="48" x2="22" y2="54" stroke={palette.stroke} strokeWidth="1" opacity="0.5"/>
                        {/* Spokes front */}
                        <line x1="88" y1="36" x2="88" y2="54" stroke={palette.stroke} strokeWidth="1" opacity="0.5"/>
                        <line x1="74" y1="48" x2="88" y