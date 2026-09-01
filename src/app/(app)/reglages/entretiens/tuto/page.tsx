"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState, Mono, PageHead } from "@/components/bi/ui";
import { SkelCard } from "@/components/bi/skeleton";
import { VelocisteFinder } from "@/components/bi/velociste-finder";
import Link from "next/link";
import { BackButton } from "@/components/bi/back-button";
import { supabase } from "@/lib/supabase";
import { useAsyncData } from "@/lib/use-async-data";
import { routes } from "@/lib/routes";
import { findMaintenanceTuto } from "@/lib/maintenance-tutos";
import { DIFFICULTY_LABELS, DIFFICULTY_LEVEL, DIFFICULTY_COLOR, formatRepairTime } from "@/lib/repair-guides";

/**
 * Tuto d'un entretien — converti en composant client (phase 2.1, lot 3).
 *
 * Le tuto lui-même est statique (`lib/maintenance-tutos.ts`) ; seuls le libellé
 * personnalisé de l'entretien, son coût atelier et le nom du vélo viennent de la
 * base. Sans tuto dédié — cas d'un entretien créé sur mesure — on renvoie sur la
 * fiche de l'entretien.
 */
function MaintenanceTutoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // `slug` par paramètre d'URL, pas par segment dynamique — voir `lib/routes.ts`.
  const slug = searchParams.get("slug") ?? "";
  const bike = searchParams.get("bike");

  const backHref = routes.maintenanceType(slug, bike ?? undefined);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return null;
    }

    const tuto = findMaintenanceTuto(slug);
    if (!tuto) {
      router.replace(backHref);
      return null;
    }

    let q = supabase
      .from("maintenance_types")
      .select("bike_id, slug, label, default_cost")
      .eq("user_id", user.id)
      .eq("slug", slug);
    if (bike) q = q.eq("bike_id", bike);
    const { data: type } = await q.limit(1).maybeSingle();

    const bikeId = (type as { bike_id?: string } | null)?.bike_id ?? bike ?? "";
    const { data: bikeRow } = bikeId
      ? await supabase.from("bikes").select("name").eq("id", bikeId).single()
      : { data: null };

    return {
      tuto,
      label: (type as { label?: string } | null)?.label ?? "Entretien",
      defaultCost: (type as { default_cost?: number | null } | null)?.default_cost ?? null,
      bikeName: (bikeRow as { name?: string } | null)?.name ?? "Ton vélo",
    };
  }, [slug, bike, backHref, router]);

  const { data, loading, error } = useAsyncData(load, [slug, bike]);

  if (loading && !data) {
    return (
      <div className="bi-page">
        <PageHead title="Tuto" sub="" />
        <SkelCard h={160} style={{ marginBottom: 14 }} />
        <SkelCard h={300} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bi-page">
        <PageHead title="Tuto" sub="" />
        <EmptyState
          title="Chargement impossible"
          text="Le guide n'a pas pu être récupéré. Vérifie ta connexion et réessaie."
        />
      </div>
    );
  }

  if (!data) return null; // redirection en cours

  const { tuto, label, defaultCost, bikeName } = data;

  const diffColor = DIFFICULTY_COLOR[tuto.difficulty];
  const diffLevel = DIFFICULTY_LEVEL[tuto.difficulty];
  const labor = tuto.laborMin != null && tuto.laborMax != null
    ? `${tuto.laborMin}–${tuto.laborMax}`
    : (defaultCost != null ? `${defaultCost}` : null);

  return (
    <>
      <div className="bi-page">
        {/* Retour + fil d'ariane */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div className="bi-tuto-crumb" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--bi-muted)" }}>
            <Link href={routes.maintenanceSettings(bike ?? undefined)} style={{ color: "var(--bi-muted)", textDecoration: "none" }}>Entretiens</Link>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
            <Link href={backHref} style={{ color: "var(--bi-muted)", textDecoration: "none" }}>{label}</Link>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
            <span style={{ color: "var(--bi-ink)" }}>Tuto</span>
          </div>
          <BackButton fallback={backHref} />
        </div>

        {/* Héros */}
        <div className="bi-tuto-hero" style={{ background: "var(--bi-ink)", color: "var(--bi-white)", borderRadius: 18, padding: 28, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--bi-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--bi-accent-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--bi-accent)" }}>Comment le faire</div>
              <div className="bi-tuto-hero-title" style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, marginTop: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: "var(--bi-white)", opacity: 0.6, marginTop: 4 }}>{bikeName} · Entretien</div>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--bi-white)", opacity: 0.5 }}>Difficulté</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} style={{ width: 22, height: 6, borderRadius: 999, background: n <= diffLevel ? diffColor : "var(--bi-white)", opacity: n <= diffLevel ? 1 : 0.18 }} />
                ))}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: diffColor }}>{DIFFICULTY_LABELS[tuto.difficulty]}</span>
            </div>
          </div>
        </div>

        {/* Deux options */}
        <div className="bi-grid-2" style={{ marginBottom: 22 }}>
          {/* DIY */}
          <div style={{ background: "var(--bi-card)", borderRadius: 18, border: "1px solid var(--bi-line)", padding: "22px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--bi-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Je le fais moi-même</div>
                <div style={{ fontSize: 12, color: "var(--bi-muted)" }}>Ton temps, ton matériel</div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--bi-muted)", marginBottom: 2 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                Temps
              </div>
              <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.6 }}>{tuto.timeMax > 0 ? formatRepairTime(tuto.timeMin, tuto.timeMax) : "En atelier"}</Mono>
            </div>

            <div style={{ marginTop: "auto" }}>
              <a
                href={tuto.tutorialUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--bi-accent)", color: "var(--bi-accent-ink)", borderRadius: 14, padding: "12px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none", width: "100%", boxSizing: "border-box" }}
              >
                Voir le tuto sur {tuto.tutorialSource}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>
              </a>
            </div>
          </div>

          {/* Vélociste */}
          <div style={{ background: "var(--bi-card)", borderRadius: 18, border: "1px solid var(--bi-line)", padding: "22px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--bi-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M3 9h18"/><path d="M9 9v3a3 3 0 0 1-6 0"/><path d="M15 9v3a3 3 0 0 1-6 0"/><path d="M21 9v3a3 3 0 0 1-6 0"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Je passe chez le vélociste</div>
                <div style={{ fontSize: 12, color: "var(--bi-muted)" }}>Rapide et sans matériel</div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--bi-muted)", marginBottom: 2 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.2 7a6 7 0 1 0 0 10"/><path d="M13 10H5"/><path d="M13 14H5"/></svg>
                Main-d&apos;œuvre
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.6 }}>{labor ?? "—"}</Mono>
                {labor && <span style={{ fontSize: 15, color: "var(--bi-muted)" }}>€</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>{labor ? "Indicatif, hors pièces" : "Généralement fait soi-même"}</div>
            </div>

            <div style={{ borderTop: "1px solid var(--bi-line)", paddingTop: 18 }}>
              <VelocisteFinder />
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ fontSize: 11, color: "var(--bi-muted)", lineHeight: 1.6 }}>
          Temps et prix sont des ordres de grandeur pour t&apos;aider à décider — pas un devis ni un tutoriel officiel.
          Le tuto est hébergé par {tuto.tutorialSource}.
        </div>
      </div>
    </>
  );
}

export default function MaintenanceTutoPage() {
  return (
    <Suspense fallback={null}>
      <MaintenanceTutoContent />
    </Suspense>
  );
}
