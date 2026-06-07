"use client";

import { useState } from "react";
import Link from "next/link";
import { BiCard, Mono } from "@/components/bi/ui";
import { OnboardingOverlay } from "@/components/bi/onboarding-overlay";

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
  readinessByBike: Record<string, { value: number; components: number }>;
  attentionItems: AttentionItem[];
  predictions: Prediction[];
  budgetByBike: Record<string, Record<string, number>>;
  wearByCategoryByBike: Record<string, Record<string, { avgWear: number; count: number; worstStatus: string }>>;
}

export function DashboardClient({
  userName, todayCap, bikes,
  attentionItems, predictions,
}: DashboardClientProps) {
  const primaryBikeId = (bikes[0]?.id as string) ?? "";
  const [selectedBikeId, setSelectedBikeId] = useState(primaryBikeId);
  const selectedBike = bikes.find(b => (b.id as string) === selectedBikeId) ?? bikes[0] ?? null;

  const filteredAttention = attentionItems.filter(a => a.bikeId === selectedBikeId);
  const filteredPredictions = predictions.filter(p => p.bikeId === selectedBikeId);

  const badItems = filteredAttention.filter(a => a.status === "bad");
  const warnItems = filteredAttention.filter(a => a.status === "warn");

  const budget3m = filteredPredictions
    .filter(p => p.weeksUntil !== null && p.weeksUntil <= 13)
    .reduce((s, p) => s + (p.cost ?? 0), 0);

  const hasNoComponents = filteredAttention.length === 0 && filteredPredictions.length === 0;

  const statusColor = badItems.length > 0 ? "var(--bi-bad)"
    : warnItems.length > 0 ? "var(--bi-warn)"
    : "var(--bi-ok)";
  const statusBg = badItems.length > 0 ? "rgba(200,54,46,0.06)"
    : warnItems.length > 0 ? "rgba(208,132,21,0.06)"
    : "rgba(14,143,90,0.06)";
  const statusBorder = badItems.length > 0 ? "rgba(200,54,46,0.18)"
    : warnItems.length > 0 ? "rgba(208,132,21,0.18)"
    : "rgba(14,143,90,0.18)";
  const statusMsg = badItems.length > 0
    ? `${badItems.length} composant${badItems.length > 1 ? "s" : ""} à remplacer`
    : warnItems.length > 0
    ? `${warnItems.length} composant${warnItems.length > 1 ? "s" : ""} à surveiller`
    : "Prêt à rouler";
  const statusSub = badItems.length === 0 && warnItems.length === 0 && filteredPredictions.length > 0
    ? `Prochain remplacement : ${CATEGORY_LABELS[filteredPredictions[0].category] ?? filteredPredictions[0].componentName} · ${formatWeeks(filteredPredictions[0].weeksUntil)}`
    : badItems.length > 0 ? "Remplace ce composant avant de rouler."
    : null;

  return (
    <>
      <OnboardingOverlay />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {todayCap}{selectedBike ? ` · ${selectedBike.name as string}` : ""}
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1, marginTop: 4 }}>
            Bonjour, {userName}
          </div>
        </div>
        <Link href="/components/new" className="bi-desktop">
          <button style={{ padding: "8px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            Composant
          </button>
        </Link>
      </div>

      {/* Bike selector */}
      {bikes.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {bikes.map(b => {
            const bid = b.id as string;
            const isSelected = bid === selectedBikeId;
            const bikeItems = attentionItems.filter(a => a.bikeId === bid);
            const bikeStatus = bikeItems.some(a => a.status === "bad") ? "bad" : bikeItems.some(a => a.status === "warn") ? "warn" : "ok";
            const dotColor = bikeStatus === "bad" ? "var(--bi-bad)" : bikeStatus === "warn" ? "var(--bi-warn)" : "var(--bi-ok)";
            return (
              <button key={bid} onClick={() => setSelectedBikeId(bid)} style={{
                padding: "7px 16px", borderRadius: 999,
                border: isSelected ? "1.5px solid var(--bi-ink)" : "1px solid var(--bi-line)",
                background: isSelected ? "var(--bi-ink)" : "var(--bi-card)",
                color: isSelected ? "var(--bi-bg)" : "var(--bi-ink)",
                fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 7, transition: "all 0.12s",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: isSelected ? "var(--bi-bg)" : dotColor, flexShrink: 0, display: "inline-block", opacity: 0.85 }} />
                {b.name as string}
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {hasNoComponents && (
        <BiCard pad={0} style={{ marginBottom: 14 }}>
          <div style={{ padding: "32px 28px", display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Aucun composant configuré</div>
              <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 4 }}>Ajoute tes composants pour suivre l&apos;usure et recevoir des alertes.</div>
            </div>
            <Link href="/components/new">
              <button style={{ padding: "9px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}>
                Ajouter
              </button>
            </Link>
          </div>
        </BiCard>
      )}

      {/* Status banner */}
      {!hasNoComponents && (
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "18px 22px", borderRadius: 16,
          background: statusBg, border: `1px solid ${statusBorder}`,
          marginBottom: 14,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: badItems.length > 0 ? "rgba(200,54,46,0.12)" : warnItems.length > 0 ? "rgba(208,132,21,0.12)" : "rgba(14,143,90,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {badItems.length === 0 && warnItems.length === 0 ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12l5 5L20 7" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={statusColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: statusColor }}>{statusMsg}</div>
            {statusSub && <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 3 }}>{statusSub}</div>}
          </div>
          {(badItems.length > 0 || warnItems.length > 0) && (
            <div style={{ fontSize: 22, fontWeight: 700, color: statusColor, fontFamily: "var(--font-jetbrains-mono)", flexShrink: 0 }}>
              {badItems.length + warnItems.length}
            </div>
          )}
        </div>
      )}

      {/* Main grid */}
      <div className="bi-grid-split" style={{ marginBottom: 14 }}>

        {/* À traiter */}
        <BiCard pad={0}>
          <div style={{ padding: "20px 22px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {filteredAttention.length > 0 && (
                  <div style={{ width: 22, height: 22, borderRadius: 999, background: "var(--bi-bad)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-jetbrains-mono)" }}>
                    {filteredAttention.length}
                  </div>
                )}
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>À traiter</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4, marginLeft: filteredAttention.length > 0 ? 30 : 0 }}>
                {filteredAttention.length === 0
                  ? "Tous tes composants sont OK"
                  : `${badItems.length} à remplacer · ${warnItems.length} à surveiller`}
              </div>
            </div>
            {filteredAttention.length > 0 && (
              <Link href="/bikes" style={{ fontSize: 11.5, color: "var(--bi-muted)", textDecoration: "none", flexShrink: 0 }}>
                Voir tout →
              </Link>
            )}
          </div>

          {filteredAttention.length === 0 ? (
            <div style={{ padding: "8px 22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}>
                <div style={{ width: 34, height: 34, borderRadius: 999, background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 7" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--bi-ok)" }}>Tout est en ordre.</div>
                  <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>Aucun composant ne nécessite d&apos;attention.</div>
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
                <div key={c.id} className="bi-attention-row" style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, borderTop: "1px solid var(--bi-line)" }}>
                  <div style={{ width: 4, height: 52, background: color, borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{CATEGORY_LABELS[c.category] ?? c.name}</span>
                      <span style={{ fontSize: 9.5, padding: "2px 7px", borderRadius: 999, background: isBad ? "rgba(200,54,46,0.1)" : "rgba(208,132,21,0.1)", color, fontWeight: 700 }}>
                        {isBad ? "CRITIQUE" : "SURVEILLER"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>{c.name}</div>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ flex: 1, maxWidth: 180, height: 3, background: "var(--bi-line)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${c.wearPct}%`, height: "100%", background: color, borderRadius: 999 }} />
                      </div>
                      <Mono style={{ fontSize: 11, color }}>{c.wearPct}%</Mono>
                    </div>
                    <div style={{ fontSize: 11.5, color, fontWeight: 500, marginTop: 4 }}>{urgencyLine}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    {c.cost !== null && <Mono style={{ fontSize: 12, color: "var(--bi-muted)" }}>~{c.cost} €</Mono>}
                    <Link href={isBad ? `/components/${c.id}/compare` : `/components/${c.id}`}>
                      <button style={{
                        padding: "8px 14px",
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
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </BiCard>

        {/* Prochains remplacements */}
        <BiCard pad={0}>
          <div style={{ padding: "20px 22px 14px" }}>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>Prochains remplacements</div>
            <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>
              {budget3m > 0
                ? <>Budget estimé 3 mois · <Mono style={{ fontWeight: 600, color: "var(--bi-ink)" }}>{Math.round(budget3m)} €</Mono></>
                : "Basé sur ton rythme actuel"}
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--bi-line)" }}>
            {filteredPredictions.length === 0 ? (
              <div style={{ padding: "16px 22px 20px", fontSize: 13, color: "var(--bi-muted)" }}>
                Aucun remplacement prévu prochainement.
              </div>
            ) : (
              filteredPredictions.slice(0, 5).map((p, i, arr) => {
                const dotColor = p.urgency === "now" ? "var(--bi-bad)" : p.urgency === "soon" ? "var(--bi-warn)" : "var(--bi-muted)";
                const timeLabel = p.weeksUntil !== null
                  ? p.weeksUntil <= 0 ? "Maintenant" : `Dans ${formatWeeks(p.weeksUntil)}`
                  : null;
                return (
                  <Link key={i} href={`/components/${p.componentId}`} style={{
                    padding: "13px 22px", display: "flex", alignItems: "center", gap: 12,
                    borderBottom: i === arr.length - 1 ? "none" : "1px solid var(--bi-line)",
                    textDecoration: "none", color: "inherit",
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: dotColor, flexShrink: 0, display: "inline-block" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {CATEGORY_LABELS[p.category] ?? p.componentName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.componentName}
                        {timeLabel && <span style={{ color: dotColor }}> · {timeLabel}</span>}
                      </div>
                    </div>
                    {p.cost !== null && <Mono style={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{p.cost} €</Mono>}
                  </Link>
                );
              })
            )}
          </div>
        </BiCard>

      </div>
    </>
  );
}
