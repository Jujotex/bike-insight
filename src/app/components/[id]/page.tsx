import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, Dot, PageHead } from "@/components/bi/ui";
import { ArchiveButton } from "@/components/bi/archive-button";
import { ReplaceButton } from "@/components/bi/replace-button";
import { DeleteButton } from "@/components/bi/delete-button";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
  archived: "var(--bi-muted)",
};

const STATUS_LABELS: Record<string, string> = {
  ok: "En bon etat",
  warn: "A surveiller",
  bad: "A remplacer",
  archived: "Archive",
};

const CATEGORY_LABELS: Record<string, string> = {
  transmission: "Transmission",
  freinage: "Freinage",
  suspension: "Suspension",
  roues: "Roues",
  cockpit: "Cockpit",
  eclairage: "Eclairage",
  autre: "Autre",
};

const REASON_LABELS: Record<string, string> = {
  usure: "Usure",
  crevaison: "Crevaison",
  casse: "Casse",
  "anticipe": "Anticipe",
};

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: comp }, { data: logs }] = await Promise.all([
    supabase
      .from("component_stats")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("maintenance_logs")
      .select("action, performed_at, km_at_action, cost, reason")
      .eq("component_id", id)
      .order("performed_at", { ascending: true }),
  ]);

  if (!comp) redirect("/components");

  const { data: bike } = await supabase
    .from("bikes")
    .select("name, total_km")
    .eq("id", comp.bike_id)
    .single();

  const wearPct = Math.min(Math.round((comp.wear_pct as number) ?? 0), 100);
  const statusColor = STATUS_COLORS[comp.status as string] ?? "var(--bi-muted)";
  const statusLabel = STATUS_LABELS[comp.status as string] ?? String(comp.status);
  const kmUsed = Math.round((comp.km_used as number) ?? 0);
  const kmMax = Math.round((comp.km_max as number) ?? 0);
  const kmRemaining = Math.max(0, kmMax - kmUsed);
  const installedDate = comp.installed_at
    ? new Date(comp.installed_at as string).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "-";
  const costPerKm = (comp.cost_per_km as number | null);

  let daysRemaining = "-";
  if (kmMax > 0 && kmRemaining > 0 && kmUsed > 0 && comp.installed_at) {
    const ageDays = (Date.now() - new Date(comp.installed_at as string).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > 0) {
      const kmPerDay = kmUsed / ageDays;
      const daysLeft = Math.round(kmRemaining / kmPerDay);
      if (daysLeft < 7) daysRemaining = "~ " + daysLeft + " j";
      else if (daysLeft < 60) daysRemaining = "~ " + Math.round(daysLeft / 7) + " sem.";
      else daysRemaining = "~ " + Math.round(daysLeft / 30) + " mois";
    }
  } else if (kmRemaining === 0 && kmMax > 0) {
    daysRemaining = "0 j";
  }

  let intensity = "-";
  if (kmUsed > 0 && comp.installed_at) {
    const ageDays = (Date.now() - new Date(comp.installed_at as string).getTime()) / (1000 * 60 * 60 * 24);
    const kmPerMonth = (kmUsed / ageDays) * 30;
    if (kmPerMonth > 400) intensity = "Elevee";
    else if (kmPerMonth > 150) intensity = "Moderee";
    else intensity = "Faible";
  }

  const installedMs = comp.installed_at ? new Date(comp.installed_at as string).getTime() : null;
  const chartH = 180;
  const rawWearPct = Math.round((comp.wear_pct as number) ?? 0);
  const chartMaxPct = Math.max(rawWearPct, 100);
  const toY = (pct: number) => chartH - 10 - (pct / chartMaxPct) * (chartH - 20);
  const chartPoints: Array<{ x: number; pct: number; label: string }> = [];

  // Fetch real activity data to build the curve
  if (installedMs && kmMax > 0 && comp.bike_id && comp.installed_at) {
    const { data: rideActivities } = await supabase
      .from("activities")
      .select("started_at, distance_km")
      .eq("bike_id", comp.bike_id as string)
      .gte("started_at", comp.installed_at as string)
      .order("started_at", { ascending: true });

    const rides = rideActivities ?? [];
    const nowMs = Date.now();
    const totalMs = nowMs - installedMs;
    const NUM_POINTS = 14; // plus de points = courbe plus lisse

    // Calculer le total des activités pour calibrer sur le wear réel
    const activityTotalKm = rides.reduce((s, a) => s + ((a.distance_km as number) ?? 0), 0);
    const actualKmUsed = (kmMax * rawWearPct) / 100;
    // Facteur de calibration : ramène le cumul activités sur le km_used réel
    const scale = activityTotalKm > 0 ? actualKmUsed / activityTotalKm : 1;

    for (let i = 0; i <= NUM_POINTS; i++) {
      const t = i / NUM_POINTS;
      const targetMs = installedMs + totalMs * t;
      const label = new Date(targetMs).toLocaleDateString("fr-FR", { month: "short", day: "numeric" });

      let pct: number;
      if (i === NUM_POINTS) {
        // Dernier point toujours épinglé sur le wear réel
        pct = rawWearPct;
      } else if (activityTotalKm > 0) {
        // Points intermédiaires calibrés
        const cumKm = rides
          .filter(a => new Date(a.started_at as string).getTime() <= targetMs)
          .reduce((s, a) => s + ((a.distance_km as number) ?? 0), 0);
        pct = Math.round((cumKm * scale / kmMax) * 100);
      } else {
        // Fallback linéaire si pas d'activités
        pct = Math.round(rawWearPct * t);
      }

      chartPoints.push({ x: t * 560 + 20, pct, label });
    }
  }
  const pathD = chartPoints.map((p, i) => (i === 0 ? "M" : "L") + p.x + "," + toY(p.pct)).join(" ");
  const fillD = pathD && chartPoints.length > 0
    ? pathD + " L" + chartPoints[chartPoints.length - 1].x + "," + chartH + " L" + chartPoints[0].x + "," + chartH + " Z"
    : "";

  const maintenanceLogs = logs ?? [];

  const statusBgColor = (comp.status as string) === "bad"
    ? "rgba(200,54,46,0.04)"
    : (comp.status as string) === "warn"
    ? "rgba(208,132,21,0.04)"
    : "rgba(14,143,90,0.04)";

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 1100 }}>
        <PageHead
          title={comp.name as string}
          breadcrumb={["Composants", comp.name as string]}
          sub={(CATEGORY_LABELS[comp.category as string] ?? String(comp.category)) + " - installe le " + installedDate}
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={"/components/" + id + "/edit"}>
                <button style={{ padding: "9px 16px", background: "var(--bi-card)", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-ink)", display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Modifier
                </button>
              </Link>
              {(comp.status as string) !== "archived" && (
                <Link href={"/components/" + id + "/compare"}>
                  <button style={{ padding: "9px 16px", background: "var(--bi-accent)", color: "var(--bi-accent-ink)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    Voir les options
                  </button>
                </Link>
              )}
              {(comp.status as string) !== "archived" && (
                <ReplaceButton
                  componentId={id}
                  bikeId={comp.bike_id as string}
                  componentName={(comp.name as string).split(" - ")[0]}
                  componentCategory={comp.category as string}
                  currentBikeKm={bike?.total_km ?? 0}
                  componentPrice={comp.purchase_price as number | null}
                />
              )}
              {(comp.status as string) === "archived" && (
                <ArchiveButton componentId={id} isArchived={true} />
              )}
              <DeleteButton componentId={id} componentName={comp.name as string} bikeId={comp.bike_id as string} />
            </div>
          }
        />

        <div className="bi-grid-split" style={{ marginBottom: 14 }}>
          <div style={{ background: "#0E0E10", color: "#fff", borderRadius: 18, padding: 32, position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: statusColor, letterSpacing: "0.07em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                  <Dot color={statusColor} size={6} /> {statusLabel}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                  {bike?.name ?? "Velo inconnu"}
                </div>
              </div>
              <Mono style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                {CATEGORY_LABELS[comp.category as string] ?? String(comp.category)}
              </Mono>
            </div>
            <div style={{ marginTop: 32, display: "flex", alignItems: "baseline", gap: 10 }}>
              <Mono style={{ fontSize: 100, fontWeight: 400, letterSpacing: -4, lineHeight: 1 }}>
                {kmMax > 0 ? wearPct : "-"}
              </Mono>
              {kmMax > 0 && <Mono style={{ fontSize: 28, color: "rgba(255,255,255,0.45)" }}>%</Mono>}
              <div style={{ flex: 1 }} />
              {kmMax > 0 && (
                <div style={{ textAlign: "right" }}>
                  <Mono style={{ display: "block", fontSize: 20, fontWeight: 500 }}>
                    {kmUsed.toLocaleString("fr")} / {kmMax.toLocaleString("fr")}
                  </Mono>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                    km - ~{kmRemaining.toLocaleString("fr")} km restants
                  </span>
                </div>
              )}
            </div>
            {kmMax > 0 && (
              <>
                <div style={{ marginTop: 22, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ width: wearPct + "%", height: "100%", background: statusColor, borderRadius: 999 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-jetbrains-mono)" }}>
                  <span>0 km</span>
                  <span>{Math.round(kmMax / 3).toLocaleString("fr")}</span>
                  <span>{Math.round(kmMax * 2 / 3).toLocaleString("fr")}</span>
                  <span>{kmMax.toLocaleString("fr")} km</span>
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: 22, border: "1.5px solid " + statusColor, borderRadius: 16, background: statusBgColor }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v4M12 17h.01M3 12a9 9 0 1018 0 9 9 0 00-18 0z"/>
                </svg>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: statusColor, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  Recommandation
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35, marginBottom: 6 }}>
                {(comp.status as string) === "bad" && "Remplacer maintenant."}
                {(comp.status as string) === "warn" && "A surveiller de pres."}
                {(comp.status as string) === "ok" && "Composant en bon etat."}
                {(comp.status as string) === "archived" && "Composant archive."}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--bi-muted)", lineHeight: 1.5 }}>
                {(comp.status as string) === "bad" && "Continuer risque d'endommager les pieces adjacentes."}
                {(comp.status as string) === "warn" && "Surveille ce composant - il approche de sa limite."}
                {(comp.status as string) === "ok" && "Aucune action requise pour l'instant."}
                {(comp.status as string) === "archived" && "Ce composant a ete retire du suivi actif."}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--bi-line)", borderRadius: 14, overflow: "hidden" }}>
              {[
                ["Prix achat", comp.purchase_price !== null ? comp.purchase_price + " EUR" : "-"],
                ["Cout / km", costPerKm !== null ? (costPerKm as number).toFixed(3) + " EUR" : "-"],
                ["Intensite", intensity],
                ["Vie restante", daysRemaining],
              ].map(([k, v]) => (
                <div key={String(k)} style={{ background: "var(--bi-card)", padding: "14px 16px" }}>
                  <BiLabel style={{ fontSize: 10 }}>{k}</BiLabel>
                  <Mono style={{ display: "block", fontSize: 16, fontWeight: 500, marginTop: 4 }}>{v as string}</Mono>
                </div>
              ))}
            </div>
          </div>
        </div>

        <BiCard pad={0} style={{ marginBottom: 14, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Usure dans le temps</div>
                <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>Modelisation depuis l'installation</div>
              </div>
              <Mono style={{ fontSize: 11, color: "var(--bi-muted)" }}>% usure</Mono>
            </div>
            {kmMax > 0 && chartPoints.length > 0 ? (
              <>
                <div style={{ position: "relative", height: 200 }}>
                  <svg viewBox={"0 0 600 " + chartH} style={{ width: "100%", height: "100%" }} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={"wg-" + id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={statusColor} stopOpacity="0.25"/>
                        <stop offset="100%" stopColor={statusColor} stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    {[25, 50, 75, 100].map(pct => (
                      <line key={pct} x1="0" y1={toY(pct)} x2="600" y2={toY(pct)} stroke="var(--bi-line)" strokeDasharray="3 3"/>
                    ))}
                    <rect x="0" y="0" width="600" height={toY(80)} fill={statusColor} opacity="0.05"/>
                    <text x="8" y={toY(80) - 4} textAnchor="start" fontSize="9" fill={statusColor} fontFamily="var(--font-jetbrains-mono)" fontWeight="600">SEUIL 80%</text>
                    {fillD && <path d={fillD} fill={"url(#wg-" + id + ")"}/>}
                    {pathD && <path d={pathD} stroke={statusColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
                    {chartPoints.length > 0 && (
                      <>
                        <circle cx={chartPoints[chartPoints.length - 1].x} cy={toY(chartPoints[chartPoints.length - 1].pct)} r="5" fill={statusColor}/>
                        <circle cx={chartPoints[chartPoints.length - 1].x} cy={toY(chartPoints[chartPoints.length - 1].pct)} r="10" fill="none" stroke={statusColor} strokeWidth="1.5" opacity="0.3"/>
                      </>
                    )}
                  </svg>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, padding: "0 24px 16px", fontSize: 10.5, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>
                  {[chartPoints[0], chartPoints[Math.floor(chartPoints.length / 2)], chartPoints[chartPoints.length - 1]].map((p, i) => (
                    <span key={i}>{p.label}</span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ height: 200, padding: "0 24px 20px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--bi-muted)", fontSize: 13 }}>
                Donnees insuffisantes
              </div>
            )}
          </BiCard>

          {maintenanceLogs.length > 0 && (
          <BiCard pad={0}>
            <div style={{ padding: "22px 22px 12px" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Historique</div>
              <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>
                {maintenanceLogs.length + " evenement" + (maintenanceLogs.length !== 1 ? "s" : "")}
              </div>
            </div>
            {(
              maintenanceLogs.map((log, i) => {
                const logDate = log.performed_at
                  ? new Date(log.performed_at as string).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                  : "-";
                const logKm = log.km_at_action !== null ? Math.round(log.km_at_action as number).toLocaleString("fr") + " km" : null;
                const reason = (log.reason as string | null);
                const dotColor = reason === "casse" || reason === "usure" ? "var(--bi-bad)"
                  : reason === "crevaison" ? "var(--bi-warn)"
                  : "var(--bi-muted)";
                return (
                  <div key={i} style={{ padding: "14px 22px", borderTop: i === 0 ? "none" : "1px solid var(--bi-line)", display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, flexShrink: 0, marginTop: 4 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{log.action as string}</div>
                      <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>
                        {logDate}{logKm ? " - " + logKm : ""}
                      </div>
                    </div>
                    {reason && (
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: "var(--bi-bg)", color: "var(--bi-muted)", border: "1px solid var(--bi-line)", fontWeight: 600, flexShrink: 0 }}>
                        {REASON_LABELS[reason] ?? reason}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </BiCard>
          )}

        <BiCard pad={24}>
          <BiLabel style={{ marginBottom: 14 }}>Informations</BiLabel>
          <div className="bi-stats-4" style={{ gap: 20, background: "transparent", borderRadius: 0 }}>
            {[
              ["Velo", bike?.name ?? "-"],
              ["Categorie", CATEGORY_LABELS[comp.category as string] ?? String(comp.category)],
              ["Installe le", installedDate],
              ["Km velo install.", comp.installed_km !== null ? Math.round(comp.installed_km as number).toLocaleString("fr") + " km" : "-"],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <BiLabel style={{ fontSize: 10 }}>{k}</BiLabel>
                <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 6 }}>{v as string}</div>
              </div>
            ))}
          </div>
        </BiCard>

      </div>
    </AppShell>
  );
}
