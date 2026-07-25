import { PageHead } from "@/components/bi/ui";
import { createSupabaseServerClient, getCachedUser } from "@/lib/supabase-server";
import { computeMaintenanceStatus, formatNextDue, type MaintenanceStatus } from "@/lib/maintenance-catalog";
import { redirect } from "next/navigation";
import { MaintenanceEditClient, type EditType } from "./client";

export default async function MaintenanceTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ bike?: string }>;
}) {
  const { slug } = await params;
  const { bike } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const isNew = slug === "new";

  const { data: bikes } = await supabase
    .from("bikes")
    .select("id, name, total_km")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("total_km", { ascending: false });
  const bikeList = (bikes ?? []).map((b) => ({ id: b.id as string, name: b.name as string }));

  let bikeId = bike && bikeList.some((b) => b.id === bike) ? bike : bikeList[0]?.id ?? "";
  let type: EditType = null;

  if (!isNew) {
    let q = supabase
      .from("maintenance_types")
      .select("id, bike_id, slug, label, sub, interval_km, interval_months, default_cost")
      .eq("user_id", user.id)
      .eq("slug", slug);
    if (bike) q = q.eq("bike_id", bike);
    const { data } = await q.limit(1).maybeSingle();
    if (!data) redirect(`/reglages/entretiens${bike ? `?bike=${bike}` : ""}`);
    type = data as EditType;
    bikeId = (data as { bike_id: string }).bike_id;
  }

  if (!bikeId) redirect("/reglages/entretiens");
  const bikeName = bikeList.find((b) => b.id === bikeId)?.name ?? "";

  // État de l'entretien (comme les pièces : couleur vive si action requise, sinon discrète)
  const bikeKm = ((bikes ?? []).find((b) => b.id === bikeId)?.total_km as number | null) ?? 0;
  let urgent = false;
  let status: MaintenanceStatus | null = null;
  let lastPerformedAt: string | null = null;
  if (!isNew && type) {
    const { data: lastLog } = await supabase
      .from("maintenance_logs")
      .select("performed_at, km_at_action")
      .eq("bike_id", bikeId)
      .eq("maintenance_type", slug)
      .order("performed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastLog) {
      lastPerformedAt = lastLog.performed_at as string;
      status = computeMaintenanceStatus(
        { id: slug, label: type.label, sub: type.sub ?? "", intervalKm: type.interval_km ?? undefined, intervalMonths: type.interval_months ?? undefined },
        { performed_at: lastPerformedAt, km_at_action: (lastLog.km_at_action as number | null) ?? null },
        bikeKm,
      );
      urgent = status.state === "due" || status.state === "soon";
    }
  }

  return (
    <>
      <div className="bi-page">
        <PageHead
          title={isNew ? "Nouvel entretien" : (type?.label ?? "Entretien")}
          sub={bikeName ? `Vélo : ${bikeName}` : undefined}
          breadcrumb={["Réglages", "Entretiens", isNew ? "Nouveau" : (type?.label ?? "")]}
        />
        {!isNew && type && (
          <MaintenanceProgress
            status={status}
            intervalKm={type.interval_km ?? null}
            intervalMonths={type.interval_months ?? null}
          />
        )}
        <MaintenanceEditClient userId={user.id} bikeId={bikeId} type={type} urgent={urgent} />
      </div>
    </>
  );
}

// ── Carte « Où tu en es » ────────────────────────────────────
// Jauge de progression vers la prochaine échéance (km ou temps), basée sur le
// dernier entretien enregistré et le kilométrage actuel du vélo.
const progressCardStyle: React.CSSProperties = {
  background: "var(--bi-white)",
  border: "1px solid var(--bi-line)",
  borderRadius: 18,
  padding: "20px 22px",
  marginBottom: 14,
};
const progressLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "var(--bi-muted)",
};

function MaintenanceProgress({
  status,
  intervalKm,
  intervalMonths,
}: {
  status: MaintenanceStatus | null;
  intervalKm: number | null;
  intervalMonths: number | null;
}) {
  const intervalLabel = [
    intervalKm ? `${intervalKm.toLocaleString("fr")} km` : null,
    intervalMonths ? `${intervalMonths} mois` : null,
  ]
    .filter(Boolean)
    .join(" ou ");

  // Jamais enregistré → pas de progression calculable.
  if (!status || status.state === "never") {
    return (
      <div style={progressCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={progressLabelStyle}>Où tu en es</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--bi-muted)" }}>Jamais enregistré</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 8, lineHeight: 1.5 }}>
          Enregistre cet entretien une première fois pour suivre sa progression.
          {intervalLabel ? ` Échéance : tous les ${intervalLabel}.` : ""}
        </div>
      </div>
    );
  }

  const color =
    status.state === "due" ? "var(--bi-bad)" : status.state === "soon" ? "var(--bi-warn)" : "var(--bi-ok)";
  const stateLabel = status.state === "due" ? "À faire" : status.state === "soon" ? "Bientôt" : "À jour";

  const sinceParts: string[] = [];
  if (status.kmSince !== null) sinceParts.push(`${status.kmSince.toLocaleString("fr")} km`);
  sinceParts.push(status.weeksSince >= 5 ? `${Math.round(status.weeksSince / 4)} mois` : `${status.weeksSince} sem.`);
  const sinceLabel = sinceParts.join(" · ");

  const due = formatNextDue(status);
  const nextLabel = status.state === "due" ? "À faire maintenant" : due ? `Dans ${due}` : "—";

  return (
    <div style={progressCardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={progressLabelStyle}>Où tu en es</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: 0.3 }}>{stateLabel}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 10 }}>
        <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5, color: "var(--bi-ink)", fontFamily: "var(--bi-font-mono)" }}>
          {status.pct}%
        </span>
        <span style={{ fontSize: 13, color: "var(--bi-muted)" }}>de l&apos;intervalle écoulé</span>
      </div>
      <div style={{ height: 8, background: "var(--bi-line)", borderRadius: 2, marginTop: 12, overflow: "hidden" }}>
        <div style={{ width: `${status.pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12, color: "var(--bi-muted)" }}>
        <span>Dernier : il y a {sinceLabel}</span>
        <span style={{ color: "var(--bi-ink)", fontWeight: 600 }}>{nextLabel}</span>
      </div>
    </div>
  );
}
