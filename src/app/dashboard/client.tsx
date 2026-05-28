"use client";

import { useState } from "react";
import Link from "next/link";
import { BiCard, Mono } from "@/components/bi/ui";

// ── Helpers ───────────────────────────────────────────────────

function formatLastRide(iso: string | null): string {
  if (!iso) return "Aucune sortie";
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  return d.toLocaleDateString("fr-FR", { month: "long" });
}

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
  regularity: number;
  maintenance: number;
}

interface AttentionItem {
  id: string;
  name: string;
  brand: string | null;
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
  bikeName: string;
  bikeId: string;
  kmRemaining: number;
  weeksUntil: number | null;
  cost: number | null;
  urgency: "now" | "soon" | "later";
}

interface BikeStatusItem {
  id: string;
  name: string;
  totalKm: number;
  lastRideAt: string | null;
  status: string;
  badCount: number;
  warnCount: number;
  isActive: boolean;
}

export interface DashboardClientProps {
  userName: string;
  todayCap: string;
  bikes: Array<Record<string, unknown>>;
  activityChart: number[];
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
  bikeStatus: BikeStatusItem[];
  predictions: Prediction[];
  budget12m: Record<string, number>;
  budget12mTotal: number;
}

// ── Component ─────────────────────────────────────────────────

export function DashboardClient({
  userName, todayCap, bikes, activityChart, kpis,
  readinessByBike, attentionItems, bikeStatus,
  predictions, budget12m, budget12mTotal,
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
  const scoreIfFixed = topCritical
    ? Math.min(100, currentReadiness.value + Math.round((100 - currentReadiness.components) * 0.4))
    : null;

  const budget3m = filteredPredictions
    .filter(p => p.weeksUntil !== null && p.weeksUntil <= 13)
    .reduce((s, p) => s + (p.cost ?? 0), 0);

  const maxChart = Math.max(...activityChart, 1);

  const budgetEntries = (Object.entries(budget12m) as [string, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {todayCap}{selectedBike ? ` · ${selectedBike.name as string} · vélo actif` : ""}
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
            const bikeS = bikeStatus.find(s => s.id === bid);
            const dotColor = bikeS?.status === "bad" ? "var(--bi-bad)" : bikeS?.status === "warn" ? "var(--bi-warn)" : "var(--bi-ok)";
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
                {topCritical && <> Ta {topCritical.name.toLowerCase()} approche du seuil critique.</>}
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--bi-muted)" }}>Décomposition du score</span>
              <span style={{ fontSize: 11, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>pondéré 60/20/20</span>
            </div>
            {([
              ["Composants", currentReadiness.components, filteredAttention.length > 0 ? `${filteredAttention.filter(a => a.status === "bad").length} critique · ${filteredAttention.filter(a => a.status === "warn").length} à surveiller` : "Tout est OK"],
              ["Régularité", currentReadiness.regularity, `${kpis.totalRides12m} sortie${kpis.totalRides12m !== 1 ? "s" : ""} · 12 mois`],
              ["Maintenance", currentReadiness.maintenance, "Suivi actif"],
            ] as [string, number, string][]).map(([label, score, detail]) => {
              const c = score >= 80 ? "var(--bi-ok)" : score >= 55 ? "var(--bi-warn)" : "var(--bi-bad)";
              return (
                <div key={label}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, width: 110, flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, height: 4, background: "var(--bi-line)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${score}%`, height: "100%", background: c, borderRadius: 999 }} />
                    </div>
                    <Mono style={{ fontSize: 12.5, fontWeight: 600, width: 38, textAlign: "right" }}>{score}</Mono>
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--bi-muted)", marginTop: 4, marginLeft: 120 }}>{detail}</div>
                </div>
              );
            })}
            {topCritical && scoreIfFixed !== null && (
              <div style={{ marginTop: 6, paddingTop: 12, borderTop: "1px solid var(--bi-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11.5, color: "var(--bi-muted)" }}>
                  Remplacer la {topCritical.name.toLowerCase()} ferait passer le score à{" "}
                  <Mono style={{ color: "var(--bi-ink)", fontWeight: 600 }}>{scoreIfFixed}</Mono>
                </span>
                <Link href={`/components/${topCritical.id}`} style={{ fontSize: 12, color: "var(--bi-ink)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                  Voir les options
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                </Link>
              </div>
            )}
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
            <div style={{ padding: "24px 22px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 7" /></svg>
              </div>
              <span style={{ fontSize: 13, color: "var(--bi-muted)" }}>Aucune action requise pour le moment.</span>
            </div>
          ) : (
            filteredAttention.map((c, i) => {
              const color = c.status === "bad" ? "var(--bi-bad)" : "var(--bi-warn)";
              const label = c.status === "bad" ? "CRITIQUE" : "À SURVEILLER";
              const remain = c.weeksUntil !== null
                ? `reste ~${c.kmRemaining.toLocaleString("fr")} km · ${formatWeeks(c.weeksUntil)}`
                : `reste ~${c.kmRemaining.toLocaleString("fr")} km`;
              return (
                <div key={c.id} style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 18, borderTop: "1px solid var(--bi-line)" }}>
                  <div style={{ width: 4, height: 56, background: color, borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600 }}>{c.name}</span>
                      <span style={{ fontSize: 9.5, padding: "3px 8px", borderRadius: 999, background: `${color === "var(--bi-bad)" ? "rgba(200,54,46,0.1)" : "rgba(208,132,21,0.1)"}`, color, fontWeight: 700, letterSpacing: 0.5 }}>{label}</span>
                    </div>
                    {c.brand && <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 3 }}>{c.brand}</div>}
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, maxWidth: 200, height: 3, background: "var(--bi-line)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${c.wearPct}%`, height: "100%", background: color, borderRadius: 999 }} />
                      </div>
                      <Mono style={{ fontSize: 11, color: "var(--bi-muted)" }}>{c.wearPct} % · {remain}</Mono>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    {c.cost !== null && <Mono style={{ fontSize: 13, color: "var(--bi-muted)" }}>~ {c.cost} €</Mono>}
                    <Link href={`/components/${c.id}`}>
                      <button style={{ padding: "8px 14px", background: i === 0 ? "var(--bi-ink)" : "transparent", color: i === 0 ? "var(--bi-bg)" : "var(--bi-ink)", border: i === 0 ? "none" : "1px solid var(--bi-line)", borderRadius: 999, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        {c.status === "bad" ? "Voir options" : "Planifier"}
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
            {budget12mTotal > 0 && (
              <span style={{ fontSize: 11.5, color: "var(--bi-muted)" }}>{budget12mTotal} € total</span>
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
                const isBeyond = p.weeksUntil !== null && p.weeksUntil > 13;
                return (
                  <div key={i} style={{ padding: "12px 22px", display: "flex", alignItems: "center", gap: 14, borderBottom: i === arr.length - 1 ? "none" : "1px solid var(--bi-line)", opacity: isBeyond ? 0.6 : 1 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, flexShrink: 0, display: "inline-block" }} />
                    <Mono style={{ fontSize: 11, color: "var(--bi-muted)", width: 60, flexShrink: 0 }}>~{formatWeeks(p.weeksUntil)}</Mono>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.componentName}</div>
                      <div style={{ fontSize: 10.5, color: "var(--bi-muted)", marginTop: 1 }}>{p.urgency === "now" ? "à remplacer" : "fin de cycle"}</div>
                    </div>
                    {p.cost !== null && <Mono style={{ fontSize: 13, fontWeight: 500 }}>{p.cost} €</Mono>}
                  </div>
                );
              })
            )}
          </div>
        </BiCard>
      </div>

      {/* ── Statut par vélo ─────────────────────────────────────── */}
      {bikeStatus.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3 }}>Statut par vélo</span>
            <span style={{ fontSize: 11.5, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>
              {bikeStatus.length} vélo{bikeStatus.length !== 1 ? "s" : ""} · {bikeStatus.reduce((s, b) => s + b.totalKm, 0).toLocaleString("fr")} km cumulés
            </span>
          </div>
          <div className="bi-grid-bikes">
            {bikeStatus.map(b => {
              const sc = b.status === "bad" ? "var(--bi-bad)" : b.status === "warn" ? "var(--bi-warn)" : "var(--bi-ok)";
              const statusLabel = b.status === "bad" ? "Action requise" : b.status === "warn" ? "À surveiller" : "Tout OK";
              return (
                <Link key={b.id} href={`/bikes/${b.id}`} style={{ textDecoration: "none" }}>
                  <BiCard pad={18} style={{ border: b.isActive ? "1.5px solid var(--bi-ink)" : "1px solid var(--bi-line)", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{b.name}</span>
                          {b.isActive && (
                            <span style={{ fontSize: 9, padding: "3px 7px", background: "var(--bi-accent)", color: "var(--bi-accent-ink)", borderRadius: 999, fontWeight: 700, letterSpacing: 0.4 }}>ACTIF</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 3 }}>
                          {b.totalKm.toLocaleString("fr")} km
                        </div>
                      </div>
                      <div style={{ width: 14, height: 14, borderRadius: 999, background: sc, flexShrink: 0, marginTop: 4, boxShadow: `0 0 0 4px ${sc === "var(--bi-bad)" ? "rgba(200,54,46,0.15)" : sc === "var(--bi-warn)" ? "rgba(208,132,21,0.15)" : "rgba(52,211,153,0.15)"}` }} />
                    </div>
                    <div style={{ marginTop: 14, padding: "8px 12px", background: "var(--bi-bg)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: sc }}>{statusLabel}</span>
                      <div style={{ display: "flex", gap: 8, fontSize: 11, fontFamily: "var(--font-jetbrains-mono)" }}>
                        {b.badCount > 0 && <span style={{ color: "var(--bi-bad)", fontWeight: 600 }}>● {b.badCount}</span>}
                        {b.warnCount > 0 && <span style={{ color: "var(--bi-warn)", fontWeight: 600 }}>● {b.warnCount}</span>}
                      </div>
                    </div>
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5, color: "var(--bi-muted)" }}>
                      <span>Dernière sortie : {formatLastRide(b.lastRideAt)}</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                    </div>
                  </BiCard>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Activité + Budget ───────────────────────────────────── */}
      <div className="bi-grid-split-lg">
        <BiCard pad={22}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Activité · 30 derniers jours</div>
              <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>
                {kpis.totalKm12m.toLocaleString("fr")} km · {kpis.totalRides12m} sortie{kpis.totalRides12m !== 1 ? "s" : ""} · 12 mois
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18, height: 80, display: "flex", alignItems: "flex-end", gap: 3 }}>
            {activityChart.map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${Math.max(2, Math.round((h / maxChart) * 100))}%`, background: h > maxChart * 0.6 ? "var(--bi-accent)" : h > 0 ? "var(--bi-line)" : "transparent", borderRadius: 2, minHeight: h > 0 ? 3 : 0 }} />
            ))}
          </div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>
            {[0, 9, 19, 29].map(i => {
              const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);
              return <span key={i}>{d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>;
            })}
          </div>
        </BiCard>

        <BiCard pad={22}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Budget · composants actifs</div>
              <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>{budget12mTotal} € · par poste</div>
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
            <div style={{ marginTop: 18, fontSize: 13, color: "var(--bi-muted)" }}>Ajoute des composants pour voir la répartition.</div>
          )}
        </BiCard>
      </div>
    </>
  );
}
