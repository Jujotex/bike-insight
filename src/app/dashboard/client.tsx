"use client";

import { useState } from "react";
import Link from "next/link";
import { BiCard, Mono } from "@/components/bi/ui";
import { OnboardingOverlay } from "@/components/bi/onboarding-overlay";

// ── Helpers ───────────────────────────────────────────────────

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

const CATEGORY_COLORS: Record<string, string> = {
  transmission: "var(--bi-accent)",
  roues: "var(--bi-warn)",
  freinage: "var(--bi-ok)",
  suspension: "#8B7CF8",
  cockpit: "var(--bi-muted)",
  eclairage: "var(--bi-muted)",
  autre: "var(--bi-muted)",
};

// ── Types ─────────────────────────────────────────────────────

interface ReadinessScore {
  value: number;
  components: number;
}

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

export interface DashboardClientProps {
  userName: string;
  todayCap: string;
  bikes: Array<Record<string, unknown>>;
  kpis: {
    totalKm12m: number;
    totalRides12m: number;
    totalComponentCost: number;
    criticalCount: number;
    avgWear: number | null;
    costPerKm: number | null;
  };
  readinessByBike: Record<string, ReadinessScore>;
  attentionItems: AttentionItem[];
  predictions: Prediction[];
  budgetByBike: Record<string, Record<string, number>>;
  wearByCategoryByBike: Record<string, Record<string, { avgWear: number; count: number; worstStatus: string }>>;
}

// ── Component ─────────────────────────────────────────────────

export function DashboardClient({
  userName, todayCap, bikes, kpis,
  readinessByBike, attentionItems,
  predictions, budgetByBike, wearByCategoryByBike,
}: DashboardClientProps) {
  const primaryBikeId = (bikes[0]?.id as string) ?? "";
  const [selectedBikeId, setSelectedBikeId] = useState(primaryBikeId);

  const selectedBike = bikes.find(b => (b.id as string) === selectedBikeId) ?? bikes[0] ?? null;
  const currentReadiness = readinessByBike[selectedBikeId] ?? { value: 0, components: 0, regularity: 0, maintenance: 80 };

  // Filter per selected bike
  const filteredAttention = attentionItems.filter(a => a.bikeId === selectedBikeId);
  const filteredPredictions = predictions.filter(p => p.bikeId === selectedBikeId);

  const readinessColor =
    currentReadiness.value >= 80 ? "var(--bi-ok)"
    : currentReadiness.value >= 55 ? "var(--bi-warn)"
    : "var(--bi-bad)";

  const readinessLabel =
    currentReadiness.value >= 80 ? "Prêt à rouler."
    : currentReadiness.value >= 55 ? "Sors avec précaution."
    : "Action requise avant de partir.";

  const topCritical = filteredAttention[0] ?? null;

  const budget3m = filteredPredictions
    .filter(p => p.weeksUntil !== null && p.weeksUntil <= 13)
    .reduce((s, p) => s + (p.cost ?? 0), 0);

  const selectedBudget = budgetByBike[selectedBikeId] ?? {};
  const selectedBudgetTotal = Object.values(selectedBudget).reduce((s, v) => s + v, 0);
  const budgetEntries = (Object.entries(selectedBudget) as [string, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <>
      <OnboardingOverlay />
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {todayCap}{selectedBike ? ` · ${selectedBike.name as string}` : ""}
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1, marginTop: 4 }}>
            Bonjour, {userName}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <div className="bi-desktop" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 12.5, color: "var(--bi-muted)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--bi-ok)", display: "inline-block" }} />
            {bikes.length} vélo{bikes.length !== 1 ? "s" : ""} · {kpis.totalKm12m.toLocaleString("fr")} km / 12 m
          </div>
          <Link href="/components/new">
            <button style={{ padding: "8px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              Composant
            </button>
          </Link>
        </div>
      </div>

      {/* ── Bike selector pills ────────────────────────────────── */}
      {bikes.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {bikes.map(b => {
            const bid = b.id as string;
            const bname = b.name as string;
            const isSelected = bid === selectedBikeId;
            const bikeItems = attentionItems.filter(a => a.bikeId === bid);
            const bikeStatusDerived = bikeItems.some(a => a.status === "bad") ? "bad" : bikeItems.some(a => a.status === "warn") ? "warn" : "ok";
            const dotColor = bikeStatusDerived === "bad" ? "var(--bi-bad)" : bikeStatusDerived === "warn" ? "var(--bi-warn)" : "var(--bi-ok)";
            return (
              <button
                key={bid}
                onClick={() => setSelectedBikeId(bid)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 999,
                  border: isSelected ? "1.5px solid var(--bi-ink)" : "1px solid var(--bi-line)",
                  background: isSelected ? "var(--bi-ink)" : "var(--bi-card)",
                  color: isSelected ? "var(--bi-bg)" : "var(--bi-ink)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  transition: "all 0.12s",
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 999, background: isSelected ? "var(--bi-bg)" : dotColor, flexShrink: 0, display: "inline-block", opacity: 0.85 }} />
                {bname}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Readiness hero ──────────────────────────────────────── */}
      <BiCard pad={0} style={{ marginBottom: 14, overflow: "hidden" }}>
        <div className="bi-grid-readiness">
          {/* Score */}
          <div className="bi-readiness-divider" style={{ padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: readinessColor, display: "inline-block" }} />
              <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--bi-muted)" }}>
                Prêt à rouler · {todayCap.split(" ").slice(1).join(" ")}
              </span>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
                <Mono style={{ fontSize: 88, fontWeight: 400, letterSpacing: -3, lineHeight: 1, color: readinessColor }}>{currentReadiness.value}</Mono>
                <span style={{ fontSize: 22, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>/100</span>
              </div>
              <div style={{ marginTop: 14, height: 6, borderRadius: 999, background: "var(--bi-line)", overflow: "hidden" }}>
                <div style={{ width: `${currentReadiness.value}%`, height: "100%", background: readinessColor, borderRadius: 999 }} />
              </div>
              <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>
                <span style={{ color: readinessColor, fontWeight: 600 }}>{readinessLabel}</span>
                {topCritical && <> {CATEGORY_LABELS[topCritical.category] ?? topCritical.name} à surveiller.</>}
              </div>
            </div>
          </div>

          {/* Breakdown — une ligne par catégorie */}
          <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--bi-muted)" }}>État des composants</span>
            {(() => {
              const CAT_LABELS: Record<string, string> = {
                transmission: "Transmission", freinage: "Freinage", roues: "Pneumatiques",
                suspension: "Suspension", cockpit: "Cockpit", eclairage: "Éclairage", autre: "Autre",
              };
              const CAT_ORDER = ["transmission", "freinage", "roues", "suspension", "cockpit", "eclairage", "autre"];
              const byCat = wearByCategoryByBike[selectedBikeId] ?? {};
              const entries = CAT_ORDER.filter(k => byCat[k]).map(k => ({ key: k, ...byCat[k] }));
              if (entries.length === 0) return (
                <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>Aucun composant suivi</span>
              );
              return entries.map(({ key, avgWear, worstStatus }) => {
                const barColor = worstStatus === "bad" ? "var(--bi-bad)" : worstStatus === "warn" ? "var(--bi-warn)" : "var(--bi-ok)";
                const pct = Math.min(Math.round(avgWear), 100);
                return (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <span style={{ fontSize: 11.5, color: "var(--bi-ink)", fontWeight: worstStatus !== "ok" ? 600 : 400 }}>
                        {CAT_LABELS[key] ?? key}
                      </span>
                      <Mono style={{ fontSize: 11, color: barColor, fontWeight: 600 }}>{pct}%</Mono>
                    </div>
                    <div style={{ height: 4, background: "var(--bi-line)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 999 }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </BiCard>

      {/* ── Attention + Prévisions ──────────────────────────────── */}
      <div className="bi-grid-split" style={{ marginBottom: 14 }}>

        {/* Attention */}
        <BiCard pad={0}>
          <div style={{ padding: "20px 22px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {filteredAttention.length > 0 && (
                  <div style={{ width: 22, height: 22, borderRadius: 999, background: "var(--bi-bad)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-jetbrains-mono)" }}>
                    {filteredAttention.length}
                  </div>
                )}
                <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3 }}>Ce qui nécessite ton attention</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4, marginLeft: filteredAttention.length > 0 ? 30 : 0 }}>
                {filteredAttention.length === 0
                  ? "Tous tes composants sont en bon état"
                  : `${filteredAttention.filter(a => a.status === "bad").length} à remplacer · ${filteredAttention.filter(a => a.status === "warn").length} à surveiller`}
              </div>
            </div>
            {filteredAttention.length > 0 && (
              <Link href="/components" style={{ fontSize: 11.5, color: "var(--bi-muted)", textDecoration: "none", flexShrink: 0 }}>
                Voir tout →
              </Link>
            )}
          </div>

          {filteredAttention.length === 0 ? (
            <div style={{ padding: "20px 22px 24px" }}>
              {/* Bannière verte */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}>
                <div style={{ width: 34, height: 34, borderRadius: 999, background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 7" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--bi-ok)" }}>Tout est en ordre — roule sereinement.</div>
                  <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>Aucun composant ne nécessite d'attention actuellement.</div>
                </div>
              </div>

              {/* Prochaine échéance */}
              {filteredPredictions.length > 0 && (() => {
                const next = filteredPredictions.sort((a, b) => (a.weeksUntil ?? 999) - (b.weeksUntil ?? 999))[0];
                const weeksLabel = next.weeksUntil !== null
                  ? next.weeksUntil <= 4 ? `dans ${next.weeksUntil} semaine${next.weeksUntil > 1 ? "s" : ""}`
                  : `dans ${Math.round(next.weeksUntil / 4)} mois`
                  : "à surveiller";
                return (
                  <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 10, background: "var(--bi-bg)", border: "1px solid var(--bi-line)" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>Prochaine révision</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{CATEGORY_LABELS[next.category] ?? next.componentName}</div>
                      <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>{next.componentName}</div>
                      <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 1 }}>
                        {weeksLabel}{next.cost ? ` · ~${next.cost} €` : ""}
                      </div>
                    </div>
                    <Link href={`/components`} style={{ fontSize: 12, color: "var(--bi-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                      Voir
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
                    </Link>
                  </div>
                );
              })()}
            </div>
          ) : (
            filteredAttention.map((c, i) => {
              const color = c.status === "bad" ? "var(--bi-bad)" : "var(--bi-warn)";
              const label = c.status === "bad" ? "CRITIQUE" : "À SURVEILLER";
              const isBad = c.status === "bad";

              const urgencyLine = (() => {
                if (isBad) {
                  if (c.weeksUntil !== null && c.weeksUntil <= 0) return "Dépassé";
                  if (c.weeksUntil !== null && c.weeksUntil <= 1) return "Cette semaine";
                  if (c.weeksUntil !== null) return `Dans ${formatWeeks(c.weeksUntil)}`;
                  return `~${c.kmRemaining.toLocaleString("fr")} km`;
                } else {
                  if (c.weeksUntil !== null) return `Dans ${formatWeeks(c.weeksUntil)}`;
                  return `~${c.kmRemaining.toLocaleString("fr")} km`;
                }
              })();

              const href = isBad ? `/components/${c.id}/compare` : `/components/${c.id}`;
              const btnLabel = isBad ? "Voir options" : "Planifier";

              return (
                <div key={c.id} style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 18, borderTop: "1px solid var(--bi-line)" }}>
                  <div style={{ width: 4, height: 56, background: color, borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{CATEGORY_LABELS[c.category] ?? c.name}</span>
                      <span style={{ fontSize: 9.5, padding: "3px 8px", borderRadius: 999, background: isBad ? "rgba(200,54,46,0.1)" : "rgba(208,132,21,0.1)", color, fontWeight: 700, letterSpacing: 0.5 }}>{label}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color, fontWeight: 500, marginTop: 4 }}>{urgencyLine}</div>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, maxWidth: 200, height: 3, background: "var(--bi-line)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${c.wearPct}%`, height: "100%", background: color, borderRadius: 999 }} />
                      </div>
                      <Mono style={{ fontSize: 11, color: "var(--bi-muted)" }}>{c.wearPct}%</Mono>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    {c.cost !== null && <Mono style={{ fontSize: 13, color: "var(--bi-muted)" }}>~ {c.cost} €</Mono>}
                    <Link href={href}>
                      <button style={{ padding: "8px 14px", background: i === 0 ? "var(--bi-ink)" : "transparent", color: i === 0 ? "var(--bi-bg)" : "var(--bi-ink)", border: i === 0 ? "none" : "1px solid var(--bi-line)", borderRadius: 999, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        {btnLabel}
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </BiCard>

        {/* Prévisions */}
        <BiCard pad={0}>
          <div style={{ padding: "20px 22px 14px" }}>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3 }}>Prévisions</div>
            <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>Budget estimé sur les 3 prochains mois</div>
          </div>
          <div style={{ padding: "0 22px 14px", display: "flex", alignItems: "baseline", gap: 6 }}>
            <Mono style={{ fontSize: 38, fontWeight: 500, letterSpacing: -1.2, lineHeight: 1 }}>{Math.round(budget3m)}</Mono>
            <span style={{ fontSize: 16, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>€</span>
            <span style={{ flex: 1 }} />
            {selectedBudgetTotal > 0 && (
              <span style={{ fontSize: 11.5, color: "var(--bi-muted)" }}>{Math.round(selectedBudgetTotal)} € total</span>
            )}
          </div>

          {/* Timeline */}
          <div style={{ padding: "0 22px 24px" }}>
            <div style={{ position: "relative", height: 4, background: "var(--bi-line)", borderRadius: 999, marginBottom: 28 }}>
              {[{ left: 8, label: "Maintenant" }, { left: 33, label: "1 mois" }, { left: 66, label: "2 mois" }, { left: 95, label: "3 mois" }].map(m => (
                <div key={m.label} style={{ position: "absolute", left: `${m.left}%`, top: -3, transform: "translateX(-50%)" }}>
                  <div style={{ width: 1, height: 10, background: "var(--bi-muted)", opacity: 0.4 }} />
                  <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", fontSize: 9.5, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)", whiteSpace: "nowrap" }}>{m.label}</div>
                </div>
              ))}
              {filteredPredictions.filter(p => p.weeksUntil !== null && p.weeksUntil <= 13).map((p, i) => {
                const leftPct = Math.min(93, Math.round(((p.weeksUntil ?? 0) / 13) * 85) + 8);
                const dotColor = p.urgency === "now" ? "var(--bi-bad)" : "var(--bi-warn)";
                return (
                  <div key={i} style={{ position: "absolute", left: `${leftPct}%`, top: -4, transform: "translateX(-50%)", width: 12, height: 12, borderRadius: 999, background: dotColor, border: "2px solid var(--bi-card)", boxShadow: `0 0 0 1.5px ${dotColor}` }} />
                );
              })}
            </div>
          </div>

          {/* Event list */}
          <div style={{ borderTop: "1px solid var(--bi-line)" }}>
            {filteredPredictions.length === 0 ? (
              <div style={{ padding: "16px 22px", fontSize: 13, color: "var(--bi-muted)" }}>Aucun remplacement prévu prochainement.</div>
            ) : (
              filteredPredictions.slice(0, 4).map((p, i, arr) => {
                const dotColor = p.urgency === "now" ? "var(--bi-bad)" : p.urgency === "soon" ? "var(--bi-warn)" : "var(--bi-muted)";
                const timeLabel = p.urgency === "now"
                  ? "Maintenant"
                  : p.weeksUntil !== null ? `Dans ${formatWeeks(p.weeksUntil)}` : null;
                return (
                  <div key={i} style={{ padding: "13px 22px", display: "flex", alignItems: "center", gap: 12, borderBottom: i === arr.length - 1 ? "none" : "1px solid var(--bi-line)" }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: dotColor, flexShrink: 0, display: "inline-block" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{CATEGORY_LABELS[p.category] ?? p.componentName}</div>
                      <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.componentName}
                        {timeLabel && <span style={{ color: dotColor }}> · {timeLabel}</span>}
                      </div>
                    </div>
                    {p.cost !== null && <Mono style={{ fontSize: 13, fontWeight: 600 }}>{p.cost} €</Mono>}
                  </div>
                );
              })
            )}
          </div>
        </BiCard>
      </div>

      {/* ── Budget composants ───────────────────────────────────── */}
      <BiCard pad={22}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Budget · composants actifs</div>
            <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>{Math.round(selectedBudgetTotal)} € · par poste</div>
          </div>
        </div>
        {budgetEntries.length > 0 ? (
          <>
            <div style={{ marginTop: 18, display: "flex", height: 8, borderRadius: 999, overflow: "hidden", gap: 2 }}>
              {budgetEntries.map(([cat, val]) => (
                <div key={cat} style={{ flex: val, background: CATEGORY_COLORS[cat] ?? "var(--bi-muted)" }} />
              ))}
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {budgetEntries.map(([cat, val]) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: CATEGORY_COLORS[cat] ?? "var(--bi-muted)", flexShrink: 0, display: "inline-block" }} />
                  <span style={{ flex: 1 }}>{CATEGORY_LABELS[cat] ?? cat}</span>
                  <Mono style={{ fontWeight: 500 }}>{Math.round(val)} €</Mono>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ marginTop: 18, fontSize: 13, color: "var(--bi-muted)" }}>Ajoute des composants pourvoir la répartition.</div>
        )}
      </BiCard>
    </>
  );
}
