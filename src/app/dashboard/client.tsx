"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BiCard, Mono } from "@/components/bi/ui";
import { BikePicker } from "@/components/bi/bike-picker";
import {
  findRepairGuide,
  DIFFICULTY_LABELS,
  DIFFICULTY_LEVEL,
  DIFFICULTY_COLOR,
  formatRepairTime,
} from "@/lib/repair-guides";

function formatWeeks(w: number | null): string {
  if (w === null) return "—";
  if (w <= 0) return "maintenant";
  if (w === 1) return "1 sem.";
  if (w < 5) return `${w} sem.`;
  return `${Math.round(w / 4)} mois`;
}

const CATEGORY_LABELS: Record<string, string> = {
  transmission: "Transmission",
  freinage: "Freinage",
  suspension: "Suspension",
  roues: "Pneumatiques",
  cockpit: "Cockpit",
  eclairage: "Éclairage",
  autre: "Autre",
};

interface AttentionItem {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  bikeName: string;
  bikeId: string;
  status: string;
  wearPct: number;
  kmRemaining: number;
  weeksUntil: number | null;
  cost: number | null;
}

interface MaintenanceAlert {
  bikeId: string;
  bikeName: string;
  typeId: string;
  label: string;
  state: "due" | "soon";
  detail: string;
}

interface Prediction {
  componentId: string;
  componentName: string;
  category: string;
  bikeName: string;
  bikeId: string;
  kmRemaining: number;
  weeksUntil: number | null;
  cost: number | null;
  urgency: "now" | "soon" | "later";
}

interface MaintenanceSummaryItem {
  typeId: string;
  label: string;
  state: "due" | "soon" | "ok";
  pct: number;
  statusLabel: string;
  detail: string;
}

interface MaintenanceSummary {
  counts: { due: number; soon: number; ok: number };
  items: MaintenanceSummaryItem[];
}

export interface DashboardClientProps {
  userName: string;
  todayCap: string;
  bikes: Array<Record<string, unknown>>;
  readinessByBike: Record<string, { value: number; components: number }>;
  attentionItems: AttentionItem[];
  predictions: Prediction[];
  maintenanceAlerts: MaintenanceAlert[];
  maintenanceSummaryByBike: Record<string, MaintenanceSummary>;
  km12mByBike: Record<string, number>;
  rides12mByBike: Record<string, number>;
}

export function DashboardClient({
  userName, todayCap, bikes,
  attentionItems, predictions, maintenanceAlerts, maintenanceSummaryByBike, readinessByBike,
  km12mByBike, rides12mByBike,
}: DashboardClientProps) {
  const router = useRouter();
  const primaryBikeId = (bikes[0]?.id as string) ?? "";
  const [selectedBikeId, setSelectedBikeId] = useState(primaryBikeId);
  const selectedBike = bikes.find(b => (b.id as string) === selectedBikeId) ?? bikes[0] ?? null;

  const filteredAttention = attentionItems.filter(a => a.bikeId === selectedBikeId);
  const filteredPredictions = predictions.filter(p => p.bikeId === selectedBikeId);
  const filteredMaintenance = maintenanceAlerts.filter(m => m.bikeId === selectedBikeId);
  const maintenanceSummary = maintenanceSummaryByBike[selectedBikeId] ?? { counts: { due: 0, soon: 0, ok: 0 }, items: [] };

  const badItems = filteredAttention.filter(a => a.status === "bad");
  const warnItems = filteredAttention.filter(a => a.status === "warn");

  // Vrai « vélo non configuré » = aucune pièce suivie. Avant on se basait sur
  // l'absence d'alerte/prédiction : après un remplacement qui remet tout au vert,
  // le vélo semblait vide alors que les pièces existent toujours.
  const hasNoComponents = (readinessByBike[selectedBikeId]?.components ?? 0) === 0;

  // Les entretiens dus comptent dans le statut global du vélo
  const dueMaint = filteredMaintenance.filter(m => m.state === "due");
  // ── Score de forme du vélo (pièces ~65% + entretien ~35%) ──
  const pieceScore = readinessByBike[selectedBikeId]?.value ?? 100;
  const maintScore = Math.max(0, 100 - 15 * maintenanceSummary.counts.due - 5 * maintenanceSummary.counts.soon);
  const formeScore = Math.round(0.65 * pieceScore + 0.35 * maintScore);
  const formeBand = formeScore >= 85 ? { label: "Impeccable", color: "var(--bi-ok)" }
    : formeScore >= 70 ? { label: "En forme", color: "var(--bi-ok)" }
    : formeScore >= 50 ? { label: "À surveiller", color: "var(--bi-warn)" }
    : { label: "Négligé", color: "var(--bi-bad)" };
  const formeReason = badItems.length > 0
    ? `${CATEGORY_LABELS[badItems[0].category] ?? badItems[0].name} à ${badItems[0].wearPct} % — à remplacer`
    : dueMaint.length > 0
    ? `Entretien à faire : ${dueMaint[0].label.toLowerCase()}`
    : warnItems.length > 0
    ? `${CATEGORY_LABELS[warnItems[0].category] ?? warnItems[0].name} à surveiller (${warnItems[0].wearPct} %)`
    : filteredPredictions.length > 0
    ? `Prochain remplacement : ${CATEGORY_LABELS[filteredPredictions[0].category] ?? filteredPredictions[0].componentName} dans ${formatWeeks(filteredPredictions[0].weeksUntil)}`
    : "Tout est au vert, continue comme ça !";

  // Le dashboard est la surface des alertes : marque les notifications comme lues
  useEffect(() => {
    fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => {});
  }, []);

  // 12 mois du vélo sélectionné UNIQUEMENT. Pas de repli sur le total tous
  // vélos : un vélo sans sortie affiche 0, jamais le chiffre d'un autre vélo.
  const km12mSelected = km12mByBike[selectedBikeId] ?? 0;
  const rides12mSelected = rides12mByBike[selectedBikeId] ?? 0;
  const kmFormatted = km12mSelected.toLocaleString("fr-FR");

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {todayCap}{selectedBike ? ` - ${selectedBike.name as string}` : ""}
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1, marginTop: 4 }}>
            Bonjour, {userName}
          </div>
        </div>
        <Link href={hasNoComponents ? (selectedBikeId ? `/onboarding?bike_id=${selectedBikeId}` : "/onboarding") : `/components/new?bike_id=${selectedBikeId}`} className="bi-desktop">
          <button style={{ padding: "10px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            Ajouter une pièce
          </button>
        </Link>
      </div>

      {/* Bike selector */}
      <BikePicker
        bikes={bikes
          .map(b => {
            const bid = b.id as string;
            const items = attentionItems.filter(a => a.bikeId === bid);
            return {
              id: bid,
              name: b.name as string,
              status: items.some(a => a.status === "bad")
                ? "bad" as const
                : items.some(a => a.status === "warn")
                  ? "warn" as const
                  : "ok" as const,
              km12m: km12mByBike[bid] ?? 0,
            };
          })
          // Même ordre que sur la page Coût : le vélo le plus roulé sur
          // 12 mois en premier.
          .sort((a, b) => b.km12m - a.km12m)}
        selected={selectedBikeId}
        onSelect={setSelectedBikeId}
      />

      {/* Score de forme + Chiffres 12 mois (même rangée) */}
      <div className={hasNoComponents ? undefined : "bi-grid-2"} style={{ marginBottom: 14, alignItems: "stretch" }}>
        {/* Score de forme */}
        {!hasNoComponents && (
          <BiCard pad={24}>
            <div style={{ display: "flex", alignItems: "center", gap: 24, height: "100%" }}>
              <div style={{ position: "relative", width: 118, height: 118, flexShrink: 0 }}>
                <svg width="118" height="118" viewBox="0 0 118 118">
                  <circle cx="59" cy="59" r="51" fill="none" stroke="var(--bi-line)" strokeWidth="9" />
                  <circle
                    cx="59" cy="59" r="51" fill="none"
                    stroke={formeBand.color} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 51}
                    strokeDashoffset={2 * Math.PI * 51 * (1 - formeScore / 100)}
                    transform="rotate(-90 59 59)"
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 38, fontWeight: 700, fontFamily: "var(--font-jetbrains-mono)", lineHeight: 1, color: formeBand.color }}>{formeScore}</span>
                  <span style={{ fontSize: 10, color: "var(--bi-muted)", marginTop: 3 }}>/ 100</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--bi-muted)" }}>Santé du vélo</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: formeBand.color, marginTop: 5, letterSpacing: -0.4 }}>{formeBand.label}</div>
                <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 5, lineHeight: 1.5 }}>{formeReason}</div>
              </div>
            </div>
          </BiCard>
        )}

        {/* Chiffres 12 mois */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, background: "var(--bi-line)", borderRadius: 18, overflow: "hidden" }}>
          <div style={{ background: "var(--bi-card)", padding: "22px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bi-muted)" }}>12 mois</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 8 }}>
              <span style={{ fontSize: 27, fontWeight: 600, letterSpacing: -0.6, fontFamily: "var(--font-jetbrains-mono)" }}>{kmFormatted}</span>
              <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>km</span>
            </div>
          </div>
          <div style={{ background: "var(--bi-card)", padding: "22px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bi-muted)" }}>12 mois</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 8 }}>
              <span style={{ fontSize: 27, fontWeight: 600, letterSpacing: -0.6, fontFamily: "var(--font-jetbrains-mono)" }}>{rides12mSelected}</span>
              <span style={{ fontSize: 12, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>sorties</span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {hasNoComponents && (
        <BiCard pad={0} style={{ marginBottom: 14 }}>
          <div style={{ padding: "32px 28px", display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Aucune pièce configurée</div>
              <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 4 }}>Configure ton vélo en 2 minutes pour suivre l&apos;usure et recevoir des alertes.</div>
            </div>
            <Link href={selectedBikeId ? `/onboarding?bike_id=${selectedBikeId}` : "/onboarding"}>
              <button style={{ padding: "10px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}>
                Ajouter
              </button>
            </Link>
          </div>
        </BiCard>
      )}

      {/* Entretien — résumé compact toujours visible */}
      {!hasNoComponents && (() => {
        const { counts, items } = maintenanceSummary;
        const maintStatusColor = counts.due > 0 ? "var(--bi-bad)" : counts.soon > 0 ? "var(--bi-warn)" : "var(--bi-ok)";
        const maintStatusMsg = items.length === 0
          ? "Aucun entretien enregistré"
          : counts.due > 0
          ? `${counts.due} entretien${counts.due > 1 ? "s" : ""} à faire`
          : counts.soon > 0
          ? `${counts.soon} entretien${counts.soon > 1 ? "s" : ""} à surveiller`
          : "Tout est à jour";
        const dotColor = (s: string) => s === "due" ? "var(--bi-bad)" : s === "soon" ? "var(--bi-warn)" : "var(--bi-ok)";
        const attentionCount = counts.due + counts.soon;
        return (
          <BiCard pad={0} style={{ marginBottom: 14 }}>
            <div style={{ padding: "20px 22px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {attentionCount > 0 && (
                    <div style={{ width: 22, height: 22, borderRadius: 999, background: maintStatusColor, color: "var(--bi-white)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-jetbrains-mono)" }}>
                      {attentionCount}
                    </div>
                  )}
                  <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>Entretien</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4, marginLeft: attentionCount > 0 ? 30 : 0 }}>
                  {maintStatusMsg}
                </div>
              </div>
              {selectedBikeId && (
                <Link href={`/bikes/${selectedBikeId}`} style={{ fontSize: 12, color: "var(--bi-muted)", textDecoration: "none", flexShrink: 0 }}>
                  Voir tout
                </Link>
              )}
            </div>

            {items.length === 0 ? (
              <div style={{ padding: "8px 22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(0,0,0,0.02)", border: "1px solid var(--bi-line)" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 999, background: "var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l2.5 2.5" /><circle cx="12" cy="12" r="9" /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Aucun entretien enregistré</div>
                    <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>Enregistre un entretien pour suivre tes échéances (lubrification, purge, révision…).</div>
                  </div>
                </div>
              </div>
            ) : (
              items.slice(0, 3).map(m => {
                const color = dotColor(m.state);
                const pill = m.state === "due" ? "À FAIRE" : m.state === "soon" ? "BIENTÔT" : "À JOUR";
                const pillBg = m.state === "due" ? "var(--bi-bad-soft)" : m.state === "soon" ? "var(--bi-warn-soft)" : "var(--bi-ok-soft)";
                return (
                  <Link key={m.typeId} href={`/reglages/entretiens/${m.typeId}?bike=${selectedBikeId}`} className="bi-attention-row bi-component-row" style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 16, borderTop: "1px solid var(--bi-line)", textDecoration: "none", color: "inherit", cursor: "pointer" }}>
                    <div style={{ width: 4, height: 52, background: color, borderRadius: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</span>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: pillBg, color, fontWeight: 700 }}>
                          {pill}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>{m.detail}</div>
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, maxWidth: 180, height: 3, background: "var(--bi-line)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(m.pct, 100)}%`, height: "100%", background: color, borderRadius: 999 }} />
                        </div>
                        <Mono style={{ fontSize: 11, color }}>{Math.round(m.pct)}%</Mono>
                      </div>
                      <div style={{ fontSize: 12, color, fontWeight: 500, marginTop: 4 }}>{m.statusLabel}</div>
                    </div>
                  </Link>
                );
              })
            )}
          </BiCard>
        );
      })()}

      {/* Main grid */}
      <div style={{ marginBottom: 14 }}>

        {/* A traiter */}
        <BiCard pad={0}>
          <div style={{ padding: "20px 22px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {filteredAttention.length > 0 && (
                  <div style={{ width: 22, height: 22, borderRadius: 999, background: "var(--bi-bad)", color: "var(--bi-white)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-jetbrains-mono)" }}>
                    {filteredAttention.length}
                  </div>
                )}
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>À traiter</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4, marginLeft: filteredAttention.length > 0 ? 30 : 0 }}>
                {filteredAttention.length === 0
                  ? "Toutes tes pièces sont OK"
                  : `${badItems.length} à remplacer · ${warnItems.length} à surveiller`}
              </div>
            </div>
            {filteredAttention.length > 0 && selectedBikeId && (
              <Link href={`/bikes/${selectedBikeId}`} style={{ fontSize: 12, color: "var(--bi-muted)", textDecoration: "none", flexShrink: 0 }}>
                Voir tout
              </Link>
            )}
          </div>

          {filteredAttention.length === 0 ? (
            <div style={{ padding: "8px 22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}>
                <div style={{ width: 34, height: 34, borderRadius: 999, background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 7" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bi-ok)" }}>Tout est en ordre.</div>
                  <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>Aucune pièce ne nécessite d&apos;attention.</div>
                </div>
              </div>
            </div>
          ) : (
            filteredAttention.map((c, i) => {
              const color = c.status === "bad" ? "var(--bi-bad)" : "var(--bi-warn)";
              const isBad = c.status === "bad";
              const urgencyLine = c.weeksUntil !== null && c.weeksUntil <= 0 ? "Dépassé"
                : c.weeksUntil !== null ? `Dans ${formatWeeks(c.weeksUntil)}`
                : `~${c.kmRemaining.toLocaleString("fr")} km`;
              return (
                <Link key={c.id} href={`/components/${c.id}`} className="bi-attention-row bi-component-row" style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 16, borderTop: "1px solid var(--bi-line)", textDecoration: "none", color: "inherit", cursor: "pointer" }}>
                  <div style={{ width: 4, height: 52, background: color, borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{CATEGORY_LABELS[c.category] ?? c.name}</span>
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: isBad ? "var(--bi-bad-soft)" : "var(--bi-warn-soft)", color, fontWeight: 700 }}>
                        {isBad ? "CRITIQUE" : "SURVEILLER"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>{c.name}</div>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, maxWidth: 180, height: 3, background: "var(--bi-line)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${c.wearPct}%`, height: "100%", background: color, borderRadius: 999 }} />
                      </div>
                      <Mono style={{ fontSize: 11, color }}>{c.wearPct}%</Mono>
                    </div>
                    <div style={{ fontSize: 12, color, fontWeight: 500, marginTop: 4 }}>{urgencyLine}</div>

                    {/* Arbitrage « je le fais » vs « vélociste ». En liste, il
                        permet de comparer les pièces entre elles et de grouper
                        une session — impossible depuis une page pièce isolée. */}
                    {(() => {
                      const g = findRepairGuide(c.name, c.category);
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ display: "flex", gap: 2 }}>
                              {[1, 2, 3].map(n => (
                                <span key={n} style={{
                                  width: 12, height: 4, borderRadius: 2,
                                  background: n <= DIFFICULTY_LEVEL[g.difficulty]
                                    ? DIFFICULTY_COLOR[g.difficulty]
                                    : "var(--bi-line)",
                                }} />
                              ))}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--bi-muted)" }}>
                              {DIFFICULTY_LABELS[g.difficulty]}
                            </span>
                          </span>
                          <span style={{ fontSize: 11, color: "var(--bi-muted)" }}>
                            Soi-même : <Mono>{formatRepairTime(g.timeMin, g.timeMax)}</Mono>
                          </span>
                          <span style={{ fontSize: 11, color: "var(--bi-muted)" }}>
                            Atelier : <Mono>{g.laborMin}–{g.laborMax} €</Mono>
                          </span>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/components/${c.id}/tuto`); }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--bi-accent-ink)", background: "var(--bi-accent)", border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", padding: "4px 11px" }}
                          >
                            Voir le tuto
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    {c.cost !== null && <Mono style={{ fontSize: 12, color: "var(--bi-muted)" }}>{c.cost} €</Mono>}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(isBad ? `/components/${c.id}/compare` : `/components/${c.id}`);
                      }}
                      style={{
                        padding: "10px 16px",
                        background: i === 0 ? "var(--bi-ink)" : "transparent",
                        color: i === 0 ? "var(--bi-bg)" : "var(--bi-ink)",
                        border: i === 0 ? "none" : "1px solid var(--bi-line)",
                        borderRadius: 999, fontSize: 12, fontWeight: 600,
                        fontFamily: "inherit", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                      {isBad ? "Remplacer" : "Planifier"}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </Link>
              );
            })
          )}
        </BiCard>

      </div>
    </>
  );
}
