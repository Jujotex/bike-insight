"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BiCard, BiLabel, CardHead, Dot, EmptyState, ListRow, Metric, Mono, PageHead, ProgressBar } from "@/components/bi/ui";
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
import { HubTabs, type HubTab } from "@/components/bi/hub-tabs";
import { computeMaintenanceStatus } from "@/lib/maintenance-catalog";
import { getCostData } from "@/lib/data";
import { loadHistoryData } from "@/app/(app)/historique/history-data";
import { HistoryLog } from "@/app/(app)/historique/history-log";
import { categoryColor, categoryLabel } from "@/lib/design/categories";
import { fmtDelay, fmtNum } from "@/lib/format";

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

const DECISION_TONE: Record<"bad" | "warn" | "ok", { dot: string; text: string }> = {
  bad: { dot: "var(--bi-bad)", text: "var(--bi-bad)" },
  warn: { dot: "var(--bi-warn)", text: "var(--bi-warn)" },
  ok: { dot: "var(--bi-ok)", text: "var(--bi-ok)" },
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

const VALID_TABS: HubTab[] = ["apercu", "pieces", "entretien", "cout", "historique"];

/**
 * Hub vélo. L'identifiant passe par `?id=` (cf. routes.ts) et l'onglet actif
 * par `?tab=` — même logique, pour la même raison : pas de segment
 * dynamique, l'app doit rester exportable en statique pour Capacitor.
 *
 * Coût et Historique de CE vélo réutilisent tels quels `getCostData` et
 * `loadHistoryData` (déjà filtrables par vélo) : aucune nouvelle requête,
 * seulement chargées à la demande — quand l'onglet devient actif — pour ne
 * pas payer leur coût réseau sur une visite qui reste sur Aperçu ou Pièces.
 */
function BikeDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const tabParam = searchParams.get("tab") ?? "apercu";
  const tab: HubTab = (VALID_TABS as string[]).includes(tabParam) ? (tabParam as HubTab) : "apercu";

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

  const loadCout = useCallback(async () => {
    if (tab !== "cout") return null;
    const userId = await getCurrentUserId();
    if (!userId) return null;
    return getCostData(supabase, userId, id);
  }, [tab, id]);
  const { data: coutData, loading: coutLoading } = useAsyncData(
    loadCout,
    [tab, id],
    tab === "cout" ? `hub-cout:${id}` : undefined
  );

  const loadHistorique = useCallback(async () => {
    if (tab !== "historique") return null;
    const userId = await getCurrentUserId();
    if (!userId) return null;
    return loadHistoryData(supabase, userId, id);
  }, [tab, id]);
  const { data: historiqueData, loading: historiqueLoading } = useAsyncData(
    loadHistorique,
    [tab, id],
    tab === "historique" ? `hub-historique:${id}` : undefined
  );

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
    maintenanceDefs,
    maintenanceSpend,
    lastByType,
    totalRides12m,
    avgKmPerRide,
  } = data;

  const bikeKm = (bike.total_km as number) ?? 0;

  // ── Décision d'aperçu : même cascade de priorité que le dashboard
  // (pièce en mauvais état > entretien dû > pièce à surveiller > tout va
  // bien), mais recalculée à partir des seules données déjà chargées ici —
  // pas de score de forme (0-100), qui vit côté serveur du dashboard.
  const dueMaintenance = maintenanceDefs
    .map((def) => ({ def, status: computeMaintenanceStatus(def, lastByType[def.id] ?? null, bikeKm) }))
    .filter((m) => m.status.state === "due");

  const worstComponent = components[0] ?? null;
  const worstStatus = worstComponent ? (worstComponent.status as string) : null;

  const decision = worstStatus === "bad"
    ? {
        tone: "bad" as const,
        eyebrow: "À traiter",
        headline: `${getComponentType(worstComponent!.name as string)} à ${Math.round((worstComponent!.wear_pct as number) ?? 0)} % d'usure`,
        href: routes.componentCompare(worstComponent!.id as string),
        actionLabel: "Voir mes options",
      }
    : dueMaintenance.length > 0
    ? {
        tone: "bad" as const,
        eyebrow: "Entretien à faire",
        headline: dueMaintenance[0].def.label,
        href: routes.maintenanceType(dueMaintenance[0].def.id, bike.id as string),
        actionLabel: "Marquer comme fait",
      }
    : worstStatus === "warn"
    ? {
        tone: "warn" as const,
        eyebrow: "À surveiller",
        headline: `${getComponentType(worstComponent!.name as string)} à ${Math.round((worstComponent!.wear_pct as number) ?? 0)} % d'usure`,
        href: routes.componentCompare(worstComponent!.id as string),
        actionLabel: "Voir mes options",
      }
    : {
        tone: "ok" as const,
        eyebrow: "Aujourd'hui",
        headline: "Tout est en ordre sur ce vélo",
        href: null as string | null,
        actionLabel: null as string | null,
      };

  // Le reste à surveiller, une fois la décision principale retirée — jusqu'à
  // 3 lignes, pour qu'Aperçu reste un coup d'œil et non une redite de Pièces.
  const watchlist = components
    .filter((c) => c.id !== worstComponent?.id && c.status !== "ok")
    .slice(0, 3);

  return (
    <>
      <div className="bi-page">
        <OfflineBanner cachedAt={cachedAt} />

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--bi-muted)", marginBottom: 10 }}>
          <Link href="/bikes" style={{ textDecoration: "none", color: "var(--bi-muted)" }}>Mes vélos</Link>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
          <span style={{ color: "var(--bi-ink)" }}>{bike.name as string}</span>
        </div>

        {/* Header */}
        <div className="bi-bike-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="bi-bike-title" style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1 }}>{bike.name as string}</span>
              {bike.is_active ? (
                <span style={{ fontSize: 10, padding: "3px 8px", background: "var(--bi-accent)", color: "var(--bi-accent-ink)", borderRadius: 999, fontWeight: 700, letterSpacing: 0.5 }}>ACTIF</span>
              ) : null}
            </div>
            {(bike.brand || bike.model) ? (
              <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 6 }}>
                {[bike.brand, bike.model].filter(Boolean).join(" · ")}
              </div>
            ) : null}
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

        {/* Héros — reste identique quel que soit l'onglet : c'est ce qui dit
            en permanence sur quel vélo on se trouve. Les onglets vivent à
            son pied, sur le même fond sombre. */}
        <div
          style={{
            position: "relative", overflow: "hidden",
            background: "var(--bi-ink)",
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            color: "var(--bi-white)",
            borderRadius: 18, padding: "28px 28px 14px",
            marginBottom: 18,
            boxShadow: "0 20px 40px -20px rgba(14,14,16,0.35)",
          }}
        >
          <div style={{ position: "absolute", top: -55, right: -55, width: 200, height: 200, borderRadius: 999, background: "radial-gradient(circle, rgba(199,255,63,0.32), transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <BiLabel style={{ color: "var(--bi-on-dark-muted)" }}>Kilométrage total</BiLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
              <Mono style={{ fontSize: 64, fontWeight: 700, letterSpacing: -3, lineHeight: 0.9 }}>{fmt(bikeKm)}</Mono>
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
            <HubTabs bikeId={bike.id as string} active={tab} />
          </div>
        </div>

        {/* ── Aperçu ────────────────────────────────────────── */}
        {tab === "apercu" && (
          <div className="bi-stack">
            <BiCard>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ marginTop: 4 }}><Dot color={DECISION_TONE[decision.tone].dot} size={9} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <BiLabel style={{ color: DECISION_TONE[decision.tone].text }}>{decision.eyebrow}</BiLabel>
                  <div style={{ fontSize: 17, fontWeight: 600, marginTop: 6, lineHeight: 1.4 }}>{decision.headline}</div>
                </div>
              </div>
              {decision.href && decision.actionLabel && (
                <Link href={decision.href} style={{ marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, background: "var(--bi-ink)", color: "var(--bi-bg)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                  {decision.actionLabel}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </Link>
              )}
            </BiCard>

            {watchlist.length > 0 && (
              <BiCard pad={0} style={{ overflow: "hidden" }}>
                <CardHead title="Aussi à surveiller" />
                <div className="bi-rows">
                  {watchlist.map((c) => {
                    const color = STATUS_COLORS[c.status as string] ?? "var(--bi-muted)";
                    const wearPct = (c.wear_pct as number) ?? 0;
                    return (
                      <ListRow
                        key={c.id as string}
                        href={routes.component(c.id as string)}
                        leading={<Dot color={color} size={8} />}
                        title={getComponentType(c.name as string)}
                        sub={(c.brand as string | null) ?? CATEGORY_LABELS[c.category as string] ?? "—"}
                        trailing={<Mono style={{ fontSize: 15, fontWeight: 700, color }}>{Math.round(wearPct)}%</Mono>}
                      />
                    );
                  })}
                </div>
              </BiCard>
            )}
          </div>
        )}

        {/* ── Pièces ────────────────────────────────────────── */}
        {tab === "pieces" && (
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
                  const color = STATUS_COLORS[c.status as string] ?? "var(--bi-muted)";
                  const wearPct = (c.wear_pct as number) ?? 0;
                  const installedDate = c.installed_at
                    ? new Date(c.installed_at as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                    : "—";
                  return (
                    <Link
                      key={c.id as string}
                      href={routes.component(c.id as string)}
                      className="bi-component-row bi-comp-table-data-row"
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
                        <Mono style={{ fontSize: 13, color: "var(--bi-muted)" }}>{fmt((c.km_used as number) ?? 0)} km</Mono>
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
        )}

        {/* ── Entretien ─────────────────────────────────────── */}
        {tab === "entretien" && (
          <MaintenanceCard
            bikeId={bike.id as string}
            bikeKm={bikeKm}
            types={maintenanceDefs}
            lastByType={lastByType}
          />
        )}

        {/* ── Coût ──────────────────────────────────────────── */}
        {tab === "cout" && (
          coutLoading && !coutData ? (
            <div className="bi-stack">
              <SkelCard h={90} />
              <SkelCard h={220} />
            </div>
          ) : !coutData || !coutData.hasData ? (
            <EmptyState
              title="Pas encore de dépense d'entretien"
              text="Enregistre un remplacement de pièce ou un entretien, et tu verras ici ce que ce vélo te coûte au fil du temps."
            />
          ) : (
            <div className="bi-stack">
              <BiCard>
                <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                  <div>
                    <BiLabel>Dépensé au total</BiLabel>
                    <Metric value={fmtNum(coutData.kpis.spendTotal)} unit="€" />
                  </div>
                  <div>
                    <BiLabel>Cette année · 12 mois</BiLabel>
                    <Metric value={fmtNum(coutData.kpis.spend12m)} unit="€" />
                  </div>
                </div>
              </BiCard>

              {coutData.breakdown.length > 0 && (
                <BiCard pad={0}>
                  <CardHead title="Où part l'argent" sub="Répartition de tes dépenses d'entretien" />
                  <div style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", gap: 2, marginBottom: 16 }}>
                      {coutData.breakdown.filter(b => b.pct > 0).map(({ key, pct }) => (
                        <div key={key} style={{ width: `${pct}%`, background: categoryColor(key) }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {coutData.breakdown.map(({ key, pct, total }) => (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Dot color={categoryColor(key)} size={8} />
                          <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{categoryLabel(key)}</span>
                          <Mono style={{ fontSize: 13, color: "var(--bi-muted)" }}>{fmtNum(total)} €</Mono>
                          <Mono style={{ fontSize: 14, fontWeight: 600, width: 34, textAlign: "right" }}>{pct}%</Mono>
                        </div>
                      ))}
                    </div>
                  </div>
                </BiCard>
              )}

              {coutData.projection.upcoming.length > 0 && (
                <BiCard pad={0} style={{ overflow: "hidden" }}>
                  <CardHead
                    title="Ce qui t'attend"
                    sub="D'après ton rythme actuel"
                    right={
                      <>
                        <Metric value={fmtNum(coutData.projection.total12m)} unit="€" size="sm" align="right" />
                        <BiLabel style={{ marginTop: 2 }}>à prévoir · 12 mois</BiLabel>
                      </>
                    }
                  />
                  <div className="bi-rows">
                    {coutData.projection.upcoming.map((u, i) => (
                      <ListRow
                        key={i}
                        href={u.href}
                        accent={categoryColor(u.key)}
                        title={u.name}
                        sub={u.key === "entretien" && u.weeksUntil <= 0 ? "à faire" : fmtDelay(u.weeksUntil)}
                        trailing={<Mono style={{ fontSize: 15, fontWeight: 700, color: "var(--bi-ink)" }}>{fmtNum(u.cost)} €</Mono>}
                      />
                    ))}
                  </div>
                </BiCard>
              )}
            </div>
          )
        )}

        {/* ── Historique ────────────────────────────────────── */}
        {tab === "historique" && (
          historiqueLoading && !historiqueData ? (
            <SkelCard h={320} />
          ) : !historiqueData || historiqueData.items.length === 0 ? (
            <EmptyState
              title="Rien à afficher pour l'instant"
              text="Dès que tu remplaces une pièce ou que tu enregistres un entretien sur ce vélo, l'événement apparaît ici, daté et chiffré."
            />
          ) : (
            <HistoryLog items={historiqueData.items} />
          )
        )}
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
