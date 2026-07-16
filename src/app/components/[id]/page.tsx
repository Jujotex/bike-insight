import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, Dot, PageHead } from "@/components/bi/ui";
import { ArchiveButton } from "@/components/bi/archive-button";
import { ReplaceButton } from "@/components/bi/replace-button";
import { DeleteButton } from "@/components/bi/delete-button";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { findRepairGuide } from "@/lib/repair-guides";
import { redirect } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
  archived: "var(--bi-muted)",
};

const STATUS_LABELS: Record<string, string> = {
  ok: "En bon état",
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

  if (!comp) redirect("/bikes");

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
    if (kmPerMonth > 400) intensity = "Élevée";
    else if (kmPerMonth > 150) intensity = "Modérée";
    else intensity = "Faible";
  }

  const installedMs = comp.installed_at ? new Date(comp.installed_at as string).getTime() : null;
  const chartH = 180;
  const rawWearPct = Math.round((comp.wear_pct as number) ?? 0);
  const chartMaxPct = Math.max(rawWearPct, 100);
  const toY = (pct: number) => chartH - 10 - (pct / chartMaxPct) * (chartH - 20);
  const chartPoints: Array<{ x: number; pct: number; label: string }> = [];

  // Vraies activités Strava — endpoint épinglé sur le wear réel pour cohérence.
  // Si la date d'installation est inconnue (pièces "d'origine du vélo" ou
  // "je ne sais pas"), le graphe démarre à la première activité connue du vélo,
  // avec l'usure déjà accumulée à ce moment-là comme point de départ.
  if (kmMax > 0 && comp.bike_id) {
    let ridesQuery = supabase
      .from("activities")
      .select("started_at, distance_km")
      .eq("bike_id", comp.bike_id as string);
    if (comp.installed_at) ridesQuery = ridesQuery.gte("started_at", comp.installed_at as string);
    const { data: rideActivities } = await ridesQuery.order("started_at", { ascending: true });

    const rides = rideActivities ?? [];
    const chartStartMs = installedMs
      ?? (rides.length > 0 ? new Date(rides[0].started_at as string).getTime() : null);

    if (chartStartMs) {
      const nowMs = Date.now();
      const totalMs = Math.max(1, nowMs - chartStartMs);
      const NUM_POINTS = 20;

      const activityTotalKm = rides.reduce((s, a) => s + ((a.distance_km as number) ?? 0), 0);
      // Usure déjà accumulée avant la première donnée disponible
      const startPct = Math.max(0, rawWearPct - (activityTotalKm / kmMax) * 100);

      for (let i = 0; i <= NUM_POINTS; i++) {
        const t = i / NUM_POINTS;
        const targetMs = chartStartMs + totalMs * t;
        const label = new Date(targetMs).toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
        let pct: number;
        if (i === NUM_POINTS) {
          pct = rawWearPct;
        } else if (activityTotalKm > 0) {
          const cumKm = rides
            .filter(a => new Date(a.started_at as string).getTime() <= targetMs)
            .reduce((s, a) => s + ((a.distance_km as number) ?? 0), 0);
          pct = Math.round(Math.min(rawWearPct, startPct + (cumKm / kmMax) * 100));
        } else {
          pct = Math.round(rawWearPct * t);
        }
        chartPoints.push({ x: t * 560 + 20, pct, label });
      }
    }
  }
  const pathD = chartPoints.map((p, i) => (i === 0 ? "M" : "L") + p.x + "," + toY(p.pct)).join(" ");
  const fillD = pathD && chartPoints.length > 0
    ? pathD + " L" + chartPoints[chartPoints.length - 1].x + "," + chartH + " L" + chartPoints[0].x + "," + chartH + " Z"
    : "";

  const maintenanceLogs = logs ?? [];

  const repairGuide = findRepairGuide(comp.name as string, comp.category as string);

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
          sub={(CATEGORY_LABELS[comp.category as string] ?? String(comp.category)) + " · installé le " + installedDate}
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={"/components/" + id + "/edit"}>
                <button style={{ padding: "10px 16px", background: "var(--bi-card)", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-ink)", display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Modifier
                </button>
              </Link>
              {(comp.status as string) !== "archived" && (
                <Link href={"/components/" + id + "/compare"}>
                  <button style={{ padding: "10px 16px", background: "var(--bi-accent)", color: "var(--bi-accent-ink)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
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
          <div className="bi-comp-hero" style={{ background: "var(--bi-ink)", color: "var(--bi-white)", borderRadius: 18, padding: 32, position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: statusColor, letterSpacing: "0.07em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                  <Dot color={statusColor} size={6} /> {statusLabel}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                  {bike?.name ?? "Vélo inconnu"}
                </div>
              </div>
              <Mono style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                {CATEGORY_LABELS[comp.category as string] ?? String(comp.category)}
              </Mono>
            </div>
            <div className="bi-wear-hero" style={{ marginTop: 32, display: "flex", alignItems: "baseline", gap: 10 }}>
              <span className="bi-wear-num" style={{ fontSize: 100, fontWeight: 300, letterSpacing: -5, lineHeight: 1, fontFamily: "var(--bi-font-ui)" }}>
                {kmMax > 0 ? wearPct : "-"}
              </span>
              {kmMax > 0 && <Mono style={{ fontSize: 28, color: "rgba(255,255,255,0.45)" }}>%</Mono>}
              <div style={{ flex: 1 }} />
              {kmMax > 0 && (
                <div className="bi-wear-side" style={{ textAlign: "right" }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-jetbrains-mono)" }}>
                  <span>0 km</span>
                  <span>{Math.round(kmMax / 3).toLocaleString("fr")}</span>
                  <span>{Math.round(kmMax * 2 / 3).toLocaleString("fr")}</span>
                  <span>{kmMax.toLocaleString("fr")} km</span>
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: 22, border: "1.5px solid " + statusColor, borderRadius: 18, background: statusBgColor }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v4M12 17h.01M3 12a9 9 0 1018 0 9 9 0 00-18 0z"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  Recommandation
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35, marginBottom: 6 }}>
                {(comp.status as string) === "bad" && "Remplacer maintenant."}
                {(comp.status as string) === "warn" && "À surveiller de près."}
                {(comp.status as string) === "ok" && "Pièce en bon état."}
                {(comp.status as string) === "archived" && "Pièce archivée."}
              </div>
              <div style={{ fontSize: 13, color: "var(--bi-muted)", lineHeight: 1.5 }}>
                {(comp.status as string) === "bad" && "Continuer risque d'endommager les pièces adjacentes."}
                {(comp.status as string) === "warn" && "Surveille cette pièce — elle approche de sa limite."}
                {(comp.status as string) === "ok" && "Aucune action requise pour l'instant."}
                {(comp.status as string) === "archived" && "Cette pièce a été retirée du suivi actif."}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--bi-line)", borderRadius: 14, overflow: "hidden" }}>
              {[
                ["Prix achat", comp.purchase_price !== null ? comp.purchase_price + " €" : "-"],
                ["Km parcourus", ((comp.km_used as number) ?? 0).toLocaleString("fr-FR") + " km"],
                ["Intensité", intensity],
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
                <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>Modélisation depuis l'installation</div>
              </div>
              <Mono style={{ fontSize: 11, color: "var(--bi-muted)" }}>% usure</Mono>
            </div>
            {kmMax > 0 && chartPoints.length > 0 ? (
              <>
                <div style={{ position: "relative" }}>
                  <svg viewBox={"0 0 600 " + chartH} style={{ width: "100%", display: "block" }}>
                    <defs>
                      <linearGradient id={"wg-" + id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={statusColor} stopOpacity="0.18"/>
                        <stop offset="100%" stopColor={statusColor} stopOpacity="0"/>
                      </linearGradient>
                    </defs>

                    {/* Zone critique au-dessus du seuil */}
                    <rect x="0" y="0" width="600" height={toY(80)} fill={statusColor} opacity="0.04"/>

                    {/* Ligne de seuil 80% */}
                    <line x1="0" y1={toY(80)} x2="600" y2={toY(80)} stroke={statusColor} strokeWidth="1" strokeDasharray="4 4" opacity="0.4"/>
                    <text x="8" y={toY(80) - 5} textAnchor="start" fontSize="9" fill={statusColor} fontFamily="var(--font-jetbrains-mono)" fontWeight="700" opacity="0.7">80%</text>

                    {/* Ligne de référence 0% */}
                    <line x1="0" y1={toY(0)} x2="600" y2={toY(0)} stroke="var(--bi-line)" strokeWidth="1"/>

                    {/* Remplissage gradient */}
                    {fillD && <path d={fillD} fill={"url(#wg-" + id + ")"}/>}

                    {/* Courbe principale */}
                    {pathD && <path d={pathD} stroke={statusColor} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}

                    {/* Point final avec label % */}
                    {chartPoints.length > 0 && (() => {
                      const last = chartPoints[chartPoints.length - 1];
                      const ly = toY(last.pct);
                      const labelY = ly < 20 ? ly + 18 : ly - 8;
                      return (
                        <>
                          <circle cx={last.x} cy={ly} r="5" fill={statusColor}/>
                          <circle cx={last.x} cy={ly} r="10" fill="none" stroke={statusColor} strokeWidth="1.5" opacity="0.25"/>
                          <text x={last.x - 6} y={labelY} textAnchor="end" fontSize="9" fill={statusColor} fontFamily="var(--font-jetbrains-mono)" fontWeight="700">{rawWearPct}%</text>
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, padding: "0 24px 16px", fontSize: 11, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>
                  {[chartPoints[0], chartPoints[Math.floor(chartPoints.length / 2)], chartPoints[chartPoints.length - 1]].map((p, i) => (
                    <span key={i}>{p.label}</span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ height: 200, padding: "0 24px 20px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--bi-muted)", fontSize: 13 }}>
                Données insuffisantes
              </div>
            )}
          </BiCard>

          {maintenanceLogs.length > 0 && (
          <BiCard pad={0}>
            <div style={{ padding: "22px 22px 12px" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Historique</div>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>
                {maintenanceLogs.length + " événement" + (maintenanceLogs.length !== 1 ? "s" : "")}
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
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{log.action as string}</div>
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

        {(comp.status as string) !== "archived" && (
          <BiCard pad={0} style={{ marginBottom: 14, overflow: "hidden" }}>
            <div style={{ padding: "22px 22px 12px" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Et maintenant ?</div>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>{repairGuide.operation}</div>
            </div>
            <div className="bi-grid-2" style={{ gap: 1, background: "var(--bi-line)", borderTop: "1px solid var(--bi-line)" }}>
              <a href={repairGuide.tutorialUrl} target="_blank" rel="noopener noreferrer" style={{ background: "var(--bi-card)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8, textDecoration: "none", color: "var(--bi-ink)" }}>
                <BiLabel style={{ fontSize: 10 }}>Je le fais moi-même</BiLabel>
                <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  Voir le tuto
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>
                </div>
                <div style={{ fontSize: 12, color: "var(--bi-muted)" }}>
                  Niveau {repairGuide.difficulty} · {repairGuide.tutorialSource}
                </div>
              </a>
              <div style={{ background: "var(--bi-card)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
                <BiLabel style={{ fontSize: 10 }}>Je passe chez le vélociste</BiLabel>
                <Mono style={{ fontSize: 16, fontWeight: 500 }}>{repairGuide.laborMin}–{repairGuide.laborMax} €</Mono>
                <div style={{ fontSize: 12, color: "var(--bi-muted)" }}>Main-d&apos;œuvre indicative, hors pièces</div>
              </div>
            </div>
          </BiCard>
        )}

        <BiCard pad={24}>
          <BiLabel style={{ marginBottom: 14 }}>Informations</BiLabel>
          <div className="bi-stats-4" style={{ gap: 20, background: "transparent", borderRadius: 0 }}>
            {[
              ["Vélo", bike?.name ?? "-"],
              ["Categorie", CATEGORY_LABELS[comp.category as string] ?? String(comp.category)],
              ["Installe le", installedDate],
              ["Km vélo à la pose", comp.installed_km !== null ? Math.round(comp.installed_km as number).toLocaleString("fr") + " km" : "-"],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <BiLabel style={{ fontSize: 10 }}>{k}</BiLabel>
                <div style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}>{v as string}</div>
              </div>
            ))}
          </div>
        </BiCard>

      </div>
    </AppShell>
  );
}
