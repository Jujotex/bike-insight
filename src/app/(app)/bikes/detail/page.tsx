"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BiCard, BiLabel, Mono, ProgressBar, EmptyState, PageHead } from "@/components/bi/ui";
import { SkelCard } from "@/components/bi/skeleton";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";
import { useAsyncData } from "@/lib/use-async-data";
import { OfflineBanner } from "@/components/bi/offline-banner";
import { routes } from "@/lib/routes";
import { loadBikeDetailData } from "./bike-detail-data";
import { ManualRideButton } from "@/components/bi/manual-ride-button";
import { MaintenanceCard } from "@/components/bi/maintenance-card";
import { getComponentType } from "@/lib/components-catalog";

const STATUS_COLORS: Record<string, string> = {
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
};

const CATEGORY_LABELS: Record<string, string> = {
  transmission: "Transmission",
  freinage: "Freinage",
  suspension: "Suspension",
  roues: "Roues",
  cockpit: "Cockpit",
  eclairage: "Éclairage",
  autre: "Autre",
};


function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

/**
 * Fiche vélo. L'identifiant passe par `?id=` et non par un segment dynamique :
 * Next ne peut pas pré-générer `/bikes/[id]` sans connaître les identifiants au
 * build, ce qui interdisait l'export statique dont dépend l'app Capacitor.
 * Construction des liens : `lib/routes.ts`.
 */
function BikeDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const load = useCallback(async () => {
    const userId = await getCurrentUserId();
    if (!userId) {
      router.replace("/login");
      return null;
    }
    const result = await loadBikeDetailData(supabase, userId, id);
    if (!result) {
      // Vélo introuvable ou n'appartenant pas à l'utilisateur.
      router.replace("/bikes");
      return null;
    }
    return result;
  }, [id, router]);

  const { data, loading, error, cachedAt } = useAsyncData(load, [id], `bike:${id}`);

  if (loading && !data) {
    return (
      <div className="bi-page">
        <PageHead title="Chargement…" sub="" />
        <SkelCard h={120} style={{ marginBottom: 14 }} />
        <SkelCard h={280} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bi-page">
        <PageHead title="Vélo" sub="" />
        <EmptyState
          title="Chargement impossible"
          text="Les données n'ont pas pu être récupérées. Vérifie ta connexion et réessaie."
        />
      </div>
    );
  }

  if (!data) return null; // redirection en cours

  const {
    bike,
    components,
    activities,
    bikeMaintLogs,
    maintenanceDefs,
    maintenanceSpend,
    lastByType,
    totalRides12m,
    totalKm12m,
    avgKmPerRide,
  } = data;

  return (
    <>
      <div className="bi-page">
        <OfflineBanner cachedAt={cachedAt} />

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--bi-muted)", marginBottom: 10 }}>
          <Link href="/bikes" style={{ textDecoration: "none", color: "var(--bi-muted)" }}>Mes vélos</Link>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
          <span style={{ color: "var(--bi-ink)" }}>{bike.name}</span>
        </div>

        {/* Header */}
        <div className="bi-bike-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="bi-bike-title" style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1 }}>{bike.name}</span>
              {bike.is_active && (
                <span style={{ fontSize: 10, padding: "3px 8px", background: "var(--bi-accent)", color: "var(--bi-accent-ink)", borderRadius: 999, fontWeight: 700, letterSpacing: 0.5 }}>ACTIF</span>
              )}
            </div>
            {(bike.brand || bike.model) && (
              <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 6 }}>
                {[bike.brand, bike.model].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
          <div className="bi-bike-header-actions">
            <ManualRideButton bikes={[{ id: bike.id as string, name: bike.name as string }]} defaultBikeId={bike.id as string} />
            <Link href={components.length === 0 ? `/onboarding?bike_id=${bike.id}` : `/components/new?bike_id=${bike.id}`}>
              <button style={{ padding: "10px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                Ajouter une pièce
              </button>
            </Link>
          </div>
        </div>

        {/* Hero vélo — même geste que la carte décision du dashboard et le
            héros de la fiche pièce : un chiffre qui domine (le kilométrage,
            la donnée qu'on vient chercher sur cette page), le reste en
            contexte plutôt que quatre cases de poids égal. */}
        <div
          style={{
            position: "relative", overflow: "hidden",
            background: "var(--bi-ink)",
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            color: "var(--bi-white)",
            borderRadius: 18, padding: 28, marginBottom: 14,
            boxShadow: "0 20px 40px -20px rgba(14,14,16,0.35)",
          }}
        >
          <div style={{ position: "absolute", top: -55, right: -55, width: 200, height: 200, borderRadius: 999, background: "radial-gradient(circle, rgba(199,255,63,0.32), transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <BiLabel style={{ color: "var(--bi-on-dark-muted)" }}>Kilométrage total</BiLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
              <Mono style={{ fontSize: 64, fontWeight: 700, letterSpacing: -3, lineHeight: 0.9 }}>{fmt(bike.total_km ?? 0)}</Mono>
              <Mono style={{ fontSize: 18, color: "var(--bi-on-dark-muted)" }}>km</Mono>
            </div>
            <div style={{ display: "flex", gap: 28, marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.1)", flexWrap: "wrap" }}>
              {[
                [fmt(maintenanceSpend) + " €", "DÉPENSÉ ENTRETIEN"],
                [String(totalRides12m), "SORTIES · 12 M"],
                [String(avgKmPerRide) + " km", "MOY. PAR SORTIE"],
              ].map(([v, l]) => (
                <div key={l}>
                  <Mono style={{ display: "block", fontSize: 20, fontWeight: 600, letterSpacing: -0.4 }}>{v}</Mono>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", color: "var(--bi-on-dark-muted)", marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pièces (pleine largeur) */}
        <div>

          {/* Components table */}
          <BiCard pad={0}>
            <div className="bi-comp-table-inner">
            <div style={{ padding: "20px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Pièces · {components.length}</div>
                <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>Trié par taux d&apos;usure</div>
              </div>
            </div>
            <div className="bi-comp-table-header-row">
              <span>Pièce</span>
              <span className="bi-comp-col-installed" style={{ textAlign: "right" }}>Installé</span>
              <span>Usure</span>
              <span className="bi-comp-col-km" style={{ textAlign: "right" }}>Km</span>
              <span></span>
            </div>
            {components.length === 0 ? (
              <div style={{ padding: "32px 22px", textAlign: "center", color: "var(--bi-muted)", fontSize: 13 }}>
                Aucune pièce — <Link href={`/onboarding?bike_id=${bike.id}`} style={{ color: "var(--bi-ink)", fontWeight: 600 }}>configurer ce vélo en 2 min</Link>
              </div>
            ) : (
              components.map((c) => {
                const color = STATUS_COLORS[c.status] ?? "var(--bi-muted)";
                const wearPct = (c.wear_pct as number) ?? 0;
                const installedDate = c.installed_at
                  ? new Date(c.installed_at as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                  : "—";
                return (
                  <Link
                    key={c.id}
                    href={routes.component(c.id as string)}
                    className="bi-component-row bi-comp-table-data-row"
                    // Ligne un peu plus respirée et le chiffre qui compte le
                    // plus sur cette table (l'usure) remonté en taille et en
                    // couleur de statut plutôt qu'un mono gris de 11px — même
                    // logique que les héros : le chiffre clé porte le poids.
                    style={{ padding: "17px 22px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 5, height: 34, background: color, borderRadius: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{getComponentType(c.name as string)}</div>
                        <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>{c.brand ?? CATEGORY_LABELS[c.category as string] ?? "—"}</div>
                      </div>
                    </div>
                    <div className="bi-comp-col-installed" style={{ textAlign: "right" }}>
                      <Mono style={{ fontSize: 12, color: "var(--bi-muted)" }}>{installedDate}</Mono>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={Math.min(wearPct / 100, 1)} color={color} height={4} />
                      </div>
                      <Mono style={{ fontSize: 16, fontWeight: 700, color, width: 42, textAlign: "right", letterSpacing: -0.3 }}>
                        {c.wear_pct !== null ? `${Math.round(wearPct)}%` : "—"}
                      </Mono>
                    </div>
                    <div className="bi-comp-col-km" style={{ textAlign: "right" }}>
                      <Mono style={{ fontSize: 13, color: "var(--bi-muted)" }}>{fmt(c.km_used ?? 0)} km</Mono>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", color: "var(--bi-muted)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                    </div>
                  </Link>
                );
              })
            )}
            </div>
          </BiCard>
        </div>
      {/* ── Entretien courant ───────────────────────────── */}
      <MaintenanceCard
        bikeId={bike.id as string}
        bikeKm={(bike.total_km as number) ?? 0}
        types={maintenanceDefs}
        lastByType={lastByType}
      />

      </div>
    </>
  );
}

export default function BikeDetailPage() {
  return (
    <Suspense fallback={null}>
      <BikeDetailContent />
    </Suspense>
  );
}
