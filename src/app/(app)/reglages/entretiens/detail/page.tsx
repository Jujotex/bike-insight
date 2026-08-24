"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState, PageHead } from "@/components/bi/ui";
import { SkelCard } from "@/components/bi/skeleton";
import { supabase } from "@/lib/supabase";
import { useAsyncData } from "@/lib/use-async-data";
import { computeMaintenanceStatus, formatNextDue, type MaintenanceStatus } from "@/lib/maintenance-catalog";
import { MaintenanceEditClient, type EditType } from "./client";

/**
 * Fiche d'un type d'entretien — converti en composant client (phase 2.1, lot 3).
 *
 * Page à deux modes : création (`slug === "new"`) ou édition. La chaîne de
 * redirections d'origine est conservée à l'identique — vers la liste si le type
 * n'existe pas, vers la liste si aucun vélo n'est sélectionnable.
 */
function MaintenanceTypeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // `slug` passe par un paramètre d'URL et non par un segment dynamique
  // (voir `lib/routes.ts`). « new » reste la valeur qui déclenche le mode création.
  const slug = searchParams.get("slug") ?? "new";
  const bike = searchParams.get("bike");

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return null;
    }

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
      if (!data) {
        router.replace(`/reglages/entretiens${bike ? `?bike=${bike}` : ""}`);
        return null;
      }
      type = data as EditType;
      bikeId = (data as { bike_id: string }).bike_id;
    }

    if (!bikeId) {
      router.replace("/reglages/entretiens");
      return null;
    }

    const bikeName = bikeList.find((b) => b.id === bikeId)?.name ?? "";
    const bikeKm = ((bikes ?? []).find((b) => b.id === bikeId)?.total_km as number | null) ?? 0;

    // État de l'entretien : couleur vive si une action est requise, discrète sinon.
    let urgent = false;
    let status: MaintenanceStatus | null = null;

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
        status = computeMaintenanceStatus(
          {
            id: slug,
            label: type.label,
            sub: type.sub ?? "",
            intervalKm: type.interval_km ?? undefined,
            intervalMonths: type.interval_months ?? undefined,
          },
          {
            performed_at: lastLog.performed_at as string,
            km_at_action: (lastLog.km_at_action as number | null) ?? null,
          },
          bikeKm,
        );
        urgent = status.state === "due" || status.state === "soon";
      }
    }

    return { userId: user.id, isNew, type, bikeId, bikeName, urgent, status };
  }, [slug, bike, router]);

  const { data, loading, error } = useAsyncData(load, [slug, bike]);

  if (loading && !data) {
    return (
      <div className="bi-page">
        <PageHead title="Entretien" sub="" breadcrumb={["Réglages", "Entretiens"]} />
        <SkelCard h={140} style={{ marginBottom: 14 }} />
        <SkelCard h={320} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bi-page">
        <PageHead title="Entretien" sub="" breadcrumb={["Réglages", "Entretiens"]} />
        <EmptyState
          title="Chargement impossible"
          text="Cet entretien n'a pas pu être récupéré. Vérifie ta connexion et réessaie."
        />
      </div>
    );
  }

  if (!data) return null; // redirection en cours

  const { userId, isNew, type, bikeId, bikeName, urgent, status } = data;

  return (
    <div className="bi-page">
      <PageHead
        title={isNew ? "Nouvel entretien" : type?.label ?? "Entretien"}
        sub={bikeName ? `Vélo : ${bikeName}` : undefined}
        breadcrumb={["Réglages", "Entretiens", isNew ? "Nouveau" : type?.label ?? ""]}
      />
      {!isNew && type && (
        <MaintenanceProgress
          status={status}
          intervalKm={type.interval_km ?? null}
          intervalMonths={type.interval_months ?? null}
        />
      )}
      <MaintenanceEditClient userId={userId} bikeId={bikeId} type={type} urgent={urgent} />
    </div>
  );
}

export default function MaintenanceTypePage() {
  return (
    <Suspense fallback={null}>
      <MaintenanceTypeContent />
    </Suspense>
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
