"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { BiCard, BiLabel, Mono, Dot, PageHead, EmptyState } from "@/components/bi/ui";
import { SkelCard } from "@/components/bi/skeleton";
import { SyncButton } from "@/components/bi/sync-button";
import { ManualRideButton } from "@/components/bi/manual-ride-button";
import { AddBikeButton } from "@/components/bi/add-bike-button";
import { OfflineBanner } from "@/components/bi/offline-banner";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";
import { useAsyncData } from "@/lib/use-async-data";
import { routes } from "@/lib/routes";
import { loadBikesData } from "./bikes-data";
import { getComponentType } from "@/lib/components-catalog";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
};

export default function BikesPage() {
  const router = useRouter();

  const load = useCallback(async () => {
    const userId = await getCurrentUserId();
    if (!userId) {
      router.replace("/login");
      return null;
    }
    return loadBikesData(supabase, userId);
  }, [router]);

  // La clé n'a pas besoin de l'identifiant utilisateur : le cache est purgé au
  // changement de compte (cf. `supabase.ts`).
  const { data, loading, error, cachedAt } = useAsyncData(load, [], "bikes");

  // Horloge lue une seule fois par montage, hors du rendu.
  //
  // `Date.now()` appelé pendant le rendu est signalé par React : deux rendus
  // successifs donneraient deux instants différents, et des calculs censés
  // s'accorder — vie restante, points d'un graphe, dates relatives —
  // divergeraient. L'initialisation paresseuse d'un état fige la valeur.
  //
  // Placé avant les retours anticipés : c'est un hook, il ne peut pas être
  // conditionnel.
  const [nowMs] = useState(() => Date.now());

  if (loading && !data) {
    return (
      <div className="bi-page">
        <PageHead title="Mes vélos" sub="Chargement…" />
        <SkelCard h={96} style={{ marginBottom: 22 }} />
        <div className="bi-grid-bikes">
          <SkelCard h={320} />
          <SkelCard h={320} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bi-page">
        <PageHead title="Mes vélos" sub="" />
        <EmptyState
          title="Chargement impossible"
          text="Les données n'ont pas pu être récupérées. Vérifie ta connexion et réessaie."
        />
      </div>
    );
  }

  if (!data) return null; // redirection vers /login en cours

  const {
    bikeList,
    bikeStats,
    statusCounts,
    worstComponentByBike,
    configuredBikeIds,
    activeBikeId,
    stravaConnected,
    totalKm,
    totalRides,
    totalCost,
    bikesMini,
  } = data;


  function formatLastRide(iso: string | null): string {
    if (!iso) return "Aucune sortie";
    const d = new Date(iso);
    const diffDays = Math.floor((nowMs - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
    return d.toLocaleDateString("fr-FR", { month: "long" });
  }

  return (
    <>
      <div className="bi-page" style={{ opacity: loading ? 0.6 : 1, transition: "opacity 120ms" }}>
        <OfflineBanner cachedAt={cachedAt} />
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

        {/* Summary strip — chiffres à l'échelle du reste de l'app (dashboard,
            fiche pièce) plutôt que des labels discrets de 24px. */}
        <div className="bi-grid-4" style={{ gap: 1, background: "var(--bi-line)", borderRadius: 18, overflow: "hidden", marginBottom: 22, boxShadow: "var(--bi-shadow-card)" }}>
          {[
            ["Vélos", String(bikeList.length)],
            ["Sorties · 12 m", String(totalRides)],
            ["Distance totale", `${totalKm.toLocaleString("fr-FR")} km`],
            ["Dépensé en entretien", `${totalCost.toLocaleString("fr-FR")} €`],
          ].map(([k, v]) => (
            <div key={String(k)} style={{ background: "var(--bi-card)", padding: "22px 22px" }}>
              <BiLabel>{k}</BiLabel>
              <Mono style={{ display: "block", fontSize: 34, fontWeight: 600, letterSpacing: -1.4, marginTop: 9, lineHeight: 1 }}>{v}</Mono>
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
              const stats = bikeStats.get(b.id) ?? { rides: 0, lastDate: null };
              const isActive = b.id === activeBikeId;
              const badCount = statusCounts.get(b.id as string)?.bad ?? 0;
              const warnCount = statusCounts.get(b.id as string)?.warn ?? 0;
              const worst = worstComponentByBike.get(b.id as string) ?? null;
              const otherIssues = badCount + warnCount - 1;
              const isStrava = !!(b.strava_gear_id as string | null);
              const isConfigured = configuredBikeIds.has(b.id as string);

              // Couleur cyclique par index — comme l'ancienne version
              const BIKE_COLORS = ["#F97316", "#8B5CF6", "#84CC16", "#06B6D4", "#F43F5E", "#A78BFA"];
              const bikeColor = BIKE_COLORS[bikeIdx % BIKE_COLORS.length];

              return (
                <Link key={b.id} href={routes.bike(b.id)} style={{ textDecoration: "none" }}>
                  <BiCard
                    pad={0}
                    style={{
                      overflow: "hidden",
                      cursor: "pointer",
                      border: isActive ? "1.5px solid var(--bi-ink)" : "1px solid var(--bi-line)",
                      // Le vélo actif se détache par la lumière plutôt que par
                      // une bordure 0.5px plus épaisse — halo lime en plus de
                      // l'ombre de carte standard.
                      boxShadow: isActive
                        ? "0 22px 44px -22px rgba(199,255,63,0.45), var(--bi-shadow-card)"
                        : "var(--bi-shadow-card)",
                    }}
                  >
                    {/* Hero — fond sombre + quadrillage + SVG coloré. Le kilométrage,
                        avant un petit label mono de 12px en coin, devient le second
                        événement visuel de la carte après l'illustration — même
                        échelle de geste que la carte décision et la fiche pièce. */}
                    <div style={{
                      height: 176,
                      background: "var(--bi-ink)",
                      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}>
                      {isActive && (
                        <div style={{
                          position: "absolute", top: -50, right: -50, width: 180, height: 180,
                          borderRadius: 999,
                          background: "radial-gradient(circle, rgba(199,255,63,0.32), transparent 65%)",
                          pointerEvents: "none",
                        }} />
                      )}

                      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {/* SVG vélo cartoon « Chunky » — traits épais, arrondis */}
                        <svg width="118" height="80" viewBox="0 0 150 100" fill="none">
                          <g stroke={bikeColor} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round">
                            {/* Roues (fond = hero sombre) */}
                            <circle cx="34" cy="66" r="22" fill="var(--bi-ink)"/>
                            <circle cx="116" cy="66" r="22" fill="var(--bi-ink)"/>
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
                          fontSize: 10, padding: "3px 8px",
                          background: isStrava ? "var(--bi-strava)" : "rgba(255,255,255,0.12)",
                          color: "var(--bi-white)",
                          borderRadius: 999, fontWeight: 700, letterSpacing: 0.8,
                        }}>
                          {isStrava ? "STRAVA" : "MANUEL"}
                        </span>

                        {/* ACTIF badge */}
                        {isActive && (
                          <span style={{
                            position: "absolute", top: 12, right: 12,
                            fontSize: 10, padding: "3px 8px",
                            background: "var(--bi-accent)", color: "var(--bi-accent-ink)",
                            borderRadius: 999, fontWeight: 700, letterSpacing: 0.5,
                          }}>
                            ACTIF
                          </span>
                        )}
                      </div>

                      {/* Kilométrage — grand, en bas de héros */}
                      <div style={{ position: "relative", padding: "0 16px 14px", display: "flex", alignItems: "baseline", gap: 6 }}>
                        <Mono style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1.3, lineHeight: 1, color: bikeColor }}>
                          {((b.total_km as number) ?? 0).toLocaleString("fr-FR")}
                        </Mono>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--bi-on-dark-muted)", fontFamily: "var(--bi-font-mono)" }}>km</span>
                      </div>
                    </div>


                    <div style={{ padding: 18 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{b.name as string}</div>
                      <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>
                        {(b.brand as string | null) ? `${b.brand}${(b.model as string | null) ? ` · ${b.model}` : ""}` : ((b.model as string | null) ?? "Vélo")}
                      </div>

                      {/* Status strip — la pièce la plus urgente, nommée, plutôt
                          qu'un compteur nu (« 2 à remplacer ») qui forçait à
                          ouvrir la carte pour savoir laquelle. Un vélo sans
                          pièce déclarée n'affiche jamais « à jour » — le vert
                          n'est pas l'état d'une donnée absente. */}
                      <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--bi-bg)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        {worst ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                            <Dot color={STATUS_COLORS[worst.status] ?? "var(--bi-muted)"} size={7} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLORS[worst.status] ?? "var(--bi-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {getComponentType(worst.name)} à {Math.round(worst.wearPct)}%
                            </span>
                            {otherIssues > 0 && (
                              <span style={{ fontSize: 11, color: "var(--bi-muted)", flexShrink: 0 }}>+{otherIssues}</span>
                            )}
                          </div>
                        ) : isConfigured ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <Dot color="var(--bi-ok)" size={7} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--bi-muted)" }}>Tout est à jour</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--bi-muted)" }}>Non configuré</span>
                        )}
                        <Mono style={{ fontSize: 11, color: "var(--bi-muted)", flexShrink: 0 }}>
                          {stats.rides} sortie{stats.rides !== 1 ? "s" : ""}
                        </Mono>
                      </div>

                      {/* Badge non configuré — bouton et non Link : la carte entière
                          est déjà un <a> (routes.bike), et un <a> dans un <a> est un
                          HTML invalide qui casse l'hydratation React. */}
                      {!isConfigured && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); router.push(routes.onboarding(b.id)); }}
                          style={{ marginTop: 10, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, background: "var(--bi-accent-soft)", border: "1px solid rgba(199,255,63,0.25)", cursor: "pointer", fontFamily: "inherit" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--bi-ok)" }}>Configurer le matériel</span>
                        </button>
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
    </>
  );
}
