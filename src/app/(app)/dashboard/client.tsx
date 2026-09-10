"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BiCard, Mono, Dot } from "@/components/bi/ui";
import { BikePicker } from "@/components/bi/bike-picker";
import {
  findRepairGuide,
  DIFFICULTY_LABELS,
  DIFFICULTY_LEVEL,
  DIFFICULTY_COLOR,
  formatRepairTime,
} from "@/lib/repair-guides";
import { findMaintenanceTuto } from "@/lib/maintenance-tutos";
import { routes } from "@/lib/routes";
import { apiFetch } from "@/lib/api";

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
  okItems: AttentionItem[];
  predictions: Prediction[];
  maintenanceAlerts: MaintenanceAlert[];
  maintenanceSummaryByBike: Record<string, MaintenanceSummary>;
  km12mByBike: Record<string, number>;
  rides12mByBike: Record<string, number>;
}

export function DashboardClient({
  userName, todayCap, bikes,
  attentionItems, okItems, predictions, maintenanceAlerts, maintenanceSummaryByBike, readinessByBike,
  km12mByBike, rides12mByBike,
}: DashboardClientProps) {
  const router = useRouter();
  const primaryBikeId = (bikes[0]?.id as string) ?? "";
  const [selectedBikeId, setSelectedBikeId] = useState(primaryBikeId);
  const selectedBike = bikes.find(b => (b.id as string) === selectedBikeId) ?? bikes[0] ?? null;

  const filteredAttention = attentionItems.filter(a => a.bikeId === selectedBikeId);
  const filteredOk = okItems.filter(a => a.bikeId === selectedBikeId);
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

  // Carte décision : la pièce (ou l'entretien) le plus urgent, mis en avant
  // en tête de page plutôt que noyé dans « À traiter ». Même cascade de
  // priorité que `formeReason` ci-dessus, juste mise en scène différemment —
  // aucun nouveau calcul, aucune nouvelle donnée.
  const decision = (() => {
    if (badItems.length > 0) {
      const item = badItems[0];
      const urgency = item.weeksUntil !== null && item.weeksUntil <= 0
        ? "Dépassé"
        : item.weeksUntil !== null
        ? formatWeeks(item.weeksUntil)
        : `${item.kmRemaining.toLocaleString("fr")} km`;
      return {
        tone: "bad" as const,
        eyebrow: "Prochaine décision",
        headline: formeReason,
        // Le chiffre qui domine la carte : le % d'usure de la pièce en cause,
        // même geste que le héros de la fiche pièce (bi-wear-num) — juste à
        // une échelle qui tient dans la carte plutôt qu'en pleine largeur.
        bigNumber: { value: String(item.wearPct), unit: "%" },
        stat1: { value: urgency, label: "avant le seuil critique" },
        stat2: item.cost !== null ? { value: `${item.cost} €`, label: "coût du remplacement" } : null,
        primary: { label: "Voir mes options", href: routes.componentCompare(item.id) },
        secondary: { label: "Elle tient encore", href: routes.componentCheck(item.id) },
      };
    }
    if (dueMaint.length > 0) {
      const m = dueMaint[0];
      return {
        tone: "bad" as const,
        eyebrow: "Prochaine décision",
        headline: formeReason,
        // Pas de pièce précise ici (c'est un entretien, pas un composant) :
        // le score de forme du vélo prend la place du chiffre dominant.
        bigNumber: { value: String(formeScore), unit: "/100" },
        stat1: null,
        stat2: null,
        primary: { label: "Marquer comme fait", href: routes.maintenanceType(m.typeId, selectedBikeId) },
        secondary: null,
      };
    }
    if (warnItems.length > 0) {
      const item = warnItems[0];
      const urgency = item.weeksUntil !== null && item.weeksUntil <= 0
        ? "Dépassé"
        : item.weeksUntil !== null
        ? formatWeeks(item.weeksUntil)
        : `${item.kmRemaining.toLocaleString("fr")} km`;
      return {
        tone: "warn" as const,
        eyebrow: "À surveiller",
        headline: formeReason,
        bigNumber: { value: String(item.wearPct), unit: "%" },
        stat1: { value: urgency, label: "km restants" },
        stat2: item.cost !== null ? { value: `${item.cost} €`, label: "coût du remplacement" } : null,
        primary: { label: "Voir mes options", href: routes.componentCompare(item.id) },
        secondary: { label: "Elle tient encore", href: routes.componentCheck(item.id) },
      };
    }
    return {
      tone: "ok" as const,
      eyebrow: "Aujourd'hui",
      headline: formeReason,
      bigNumber: { value: String(formeScore), unit: "/100" },
      stat1: null,
      stat2: null,
      primary: null,
      secondary: null,
    };
  })();

  const DECISION_TONE: Record<"bad" | "warn" | "ok", { dot: string; stat: string }> = {
    bad: { dot: "var(--bi-bad)", stat: "var(--bi-bad)" },
    warn: { dot: "var(--bi-warn)", stat: "var(--bi-warn)" },
    ok: { dot: "var(--bi-ok)", stat: "var(--bi-ok)" },
  };

  // Le dashboard est la surface des alertes : marque les notifications comme lues
  useEffect(() => {
    apiFetch("/api/notifications/read", {
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
          <div className="bi-pagehead-title" style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1, marginTop: 4 }}>
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

      {/* Décision du jour — la promesse de la landing (« une décision, pas un
          tableau de bord ») remontée en tête d'écran plutôt que sur /cout. */}
      {!hasNoComponents && (
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: "var(--bi-ink)",
            // Même quadrillage à points que le héros des cartes vélo (bikes/page.tsx) —
            // de la matière derrière le glow plutôt qu'un aplat plat.
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            color: "var(--bi-white)",
            borderRadius: 18,
            padding: 24,
            marginBottom: 14,
            boxShadow: "0 20px 40px -20px rgba(14,14,16,0.35)",
          }}
        >
          <div
            style={{
              position: "absolute", top: -55, right: -55, width: 200, height: 200,
              borderRadius: 999,
              background: "radial-gradient(circle, rgba(199,255,63,0.32), transparent 65%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Dot color={DECISION_TONE[decision.tone].dot} size={6} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--bi-on-dark-muted)", fontFamily: "var(--bi-font-mono)" }}>
                {decision.eyebrow}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginTop: 14 }}>
              <Mono style={{ fontSize: 64, fontWeight: 700, letterSpacing: -3, lineHeight: 0.85 }}>{decision.bigNumber.value}</Mono>
              <Mono style={{ fontSize: 18, fontWeight: 600, color: "var(--bi-on-dark-muted)", marginBottom: 5 }}>{decision.bigNumber.unit}</Mono>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.4, marginTop: 14, maxWidth: 480, color: "rgba(255,255,255,0.92)" }}>
              {decision.headline}
            </div>
            {(decision.stat1 || decision.stat2) && (
              <div style={{ display: "flex", gap: 28, marginTop: 18, flexWrap: "wrap" }}>
                {decision.stat1 && (
                  <div>
                    <Mono style={{ display: "block", fontSize: 24, fontWeight: 500, letterSpacing: -0.6, color: DECISION_TONE[decision.tone].stat }}>
                      {decision.stat1.value}
                    </Mono>
                    <div style={{ fontSize: 10, color: "var(--bi-on-dark-muted)", marginTop: 3 }}>{decision.stat1.label}</div>
                  </div>
                )}
                {decision.stat2 && (
                  <div>
                    <Mono style={{ display: "block", fontSize: 24, fontWeight: 500, letterSpacing: -0.6 }}>{decision.stat2.value}</Mono>
                    <div style={{ fontSize: 10, color: "var(--bi-on-dark-muted)", marginTop: 3 }}>{decision.stat2.label}</div>
                  </div>
                )}
              </div>
            )}
            {(decision.primary || decision.secondary) && (
              <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
                {decision.primary && (
                  <Link href={decision.primary.href} style={{ textDecoration: "none" }}>
                    <button style={{ padding: "11px 18px", background: "var(--bi-accent)", color: "var(--bi-accent-ink)", border: "none", borderRadius: 999, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                      {decision.primary.label}
                    </button>
                  </Link>
                )}
                {decision.secondary && (
                  <Link href={decision.secondary.href} style={{ textDecoration: "none" }}>
                    <button style={{ padding: "11px 18px", background: "rgba(255,255,255,0.08)", color: "var(--bi-white)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 999, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                      {decision.secondary.label}
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score de forme — la jauge et les deux chiffres 12 mois vivaient dans
          trois blocs séparés (empilés en 3 lignes sur mobile) pour une info
          qui se lit d'un coup d'œil. Un seul BiCard, plus dense, plus
          éditorial : la jauge domine, les deux chiffres l'accompagnent au
          lieu de rivaliser avec elle en pleine largeur. */}
      {!hasNoComponents && (
        <BiCard style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="38" fill="none" stroke="var(--bi-line)" strokeWidth="7" />
                <circle
                  cx="44" cy="44" r="38" fill="none"
                  stroke={formeBand.color} strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 38}
                  strokeDashoffset={2 * Math.PI * 38 * (1 - formeScore / 100)}
                  transform="rotate(-90 44 44)"
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-jetbrains-mono)", lineHeight: 1, color: formeBand.color }}>{formeScore}</span>
                <span style={{ fontSize: 9, color: "var(--bi-muted)", marginTop: 2 }}>/ 100</span>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--bi-muted)" }}>Santé du vélo</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: formeBand.color, marginTop: 4, letterSpacing: -0.3 }}>{formeBand.label}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--bi-line)" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bi-muted)" }}>12 mois</div>
              <Mono style={{ display: "block", fontSize: 16, fontWeight: 700, letterSpacing: -0.3, marginTop: 4 }}>{kmFormatted} km</Mono>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bi-muted)" }}>Sorties</div>
              <Mono style={{ display: "block", fontSize: 16, fontWeight: 700, letterSpacing: -0.3, marginTop: 4 }}>{rides12mSelected}</Mono>
            </div>
          </div>
        </BiCard>
      )}

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
                <Link href={routes.bike(selectedBikeId)} style={{ fontSize: 12, color: "var(--bi-muted)", textDecoration: "none", flexShrink: 0 }}>
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
                  <Link key={m.typeId} href={routes.maintenanceType(m.typeId, selectedBikeId)} className="bi-attention-row bi-component-row" style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, borderTop: "1px solid var(--bi-line)", textDecoration: "none", color: "inherit", cursor: "pointer" }}>
                    <div style={{ width: 5, height: 56, background: color, borderRadius: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</span>
                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: pillBg, color, fontWeight: 700 }}>
                          {pill}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>{m.detail}</div>
                      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1, maxWidth: 180, height: 4, background: "var(--bi-line)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(m.pct, 100)}%`, height: "100%", background: color, borderRadius: 999 }} />
                        </div>
                        <Mono style={{ fontSize: 16, fontWeight: 700, color, letterSpacing: -0.3 }}>{Math.round(m.pct)}%</Mono>
                      </div>
                      <div style={{ fontSize: 12, color, fontWeight: 500, marginTop: 4 }}>{m.statusLabel}</div>
                      {/* Détail tuto/atelier réservé aux entretiens dus ou à surveiller —
                          sur un entretien à jour, l'info « comment le faire » n'est pas
                          utile tout de suite et alourdit une carte censée rester un
                          coup d'œil. Le Hub du vélo (onglet Entretien) garde le détail
                          complet pour tous les états. */}
                      {(() => {
                        if (m.state === "ok") return null;
                        const mt = findMaintenanceTuto(m.typeId);
                        if (!mt) return null;
                        return (
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <span style={{ display: "flex", gap: 2 }}>
                                {[1, 2, 3].map(n => (
                                  <span key={n} style={{ width: 12, height: 4, borderRadius: 2, background: n <= DIFFICULTY_LEVEL[mt.difficulty] ? DIFFICULTY_COLOR[mt.difficulty] : "var(--bi-line)" }} />
                                ))}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--bi-muted)" }}>{DIFFICULTY_LABELS[mt.difficulty]}</span>
                            </span>
                            {mt.timeMax > 0 && (
                              <span style={{ fontSize: 11, color: "var(--bi-muted)" }}>Soi-même : <Mono>{formatRepairTime(mt.timeMin, mt.timeMax)}</Mono></span>
                            )}
                            {mt.laborMin != null && mt.laborMax != null && (
                              <span style={{ fontSize: 11, color: "var(--bi-muted)" }}>Atelier : <Mono>{mt.laborMin}–{mt.laborMax} €</Mono></span>
                            )}
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(routes.maintenanceTuto(m.typeId, selectedBikeId)); }}
                              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--bi-accent-ink)", background: "var(--bi-accent)", border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "inherit", padding: "4px 11px" }}
                            >
                              Voir le tuto
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                            </button>
                          </div>
                        );
                      })()}
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
              <Link href={routes.bike(selectedBikeId)} style={{ fontSize: 12, color: "var(--bi-muted)", textDecoration: "none", flexShrink: 0 }}>
                Voir tout
              </Link>
            )}
          </div>

          {filteredAttention.length === 0 ? (
            filteredOk.length === 0 ? (
              <div style={{ padding: "8px 22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 999, background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 7" /></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bi-ok)" }}>Tout est en ordre.</div>
                    <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>Aucune pièce suivie sur ce vélo.</div>
                  </div>
                </div>
              </div>
            ) : (
              // Rien à traiter : on affiche quand même chaque pièce avec son usure
              // et ses km restants — le dashboard reste informatif dans tous les cas.
              filteredOk.map((c) => (
                <Link key={c.id} href={routes.component(c.id)} className="bi-attention-row bi-component-row" style={{ padding: "16px 22px", display: "flex", alignItems: "center", gap: 16, borderTop: "1px solid var(--bi-line)", textDecoration: "none", color: "inherit", cursor: "pointer" }}>
                  <div style={{ width: 5, height: 42, background: "var(--bi-ok)", borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{CATEGORY_LABELS[c.category] ?? c.name}</span>
                    <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>{c.name}</div>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, maxWidth: 180, height: 4, background: "var(--bi-line)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${c.wearPct}%`, height: "100%", background: "var(--bi-ok)", borderRadius: 999 }} />
                      </div>
                      <Mono style={{ fontSize: 15, fontWeight: 700, color: "var(--bi-ok)", letterSpacing: -0.2 }}>{c.wearPct}%</Mono>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <Mono style={{ fontSize: 14, fontWeight: 600 }}>{c.kmRemaining.toLocaleString("fr")}</Mono>
                    <div style={{ fontSize: 11, color: "var(--bi-muted)" }}>km restants</div>
                  </div>
                </Link>
              ))
            )
          ) : (
            filteredAttention.map((c, i) => {
              const color = c.status === "bad" ? "var(--bi-bad)" : "var(--bi-warn)";
              const isBad = c.status === "bad";
              const urgencyLine = c.weeksUntil !== null && c.weeksUntil <= 0 ? "Dépassé"
                : c.weeksUntil !== null ? `Dans ${formatWeeks(c.weeksUntil)}`
                : `~${c.kmRemaining.toLocaleString("fr")} km`;
              return (
                <Link key={c.id} href={routes.component(c.id)} className="bi-attention-row bi-component-row" style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, borderTop: "1px solid var(--bi-line)", textDecoration: "none", color: "inherit", cursor: "pointer" }}>
                  <div style={{ width: 5, height: 56, background: color, borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{CATEGORY_LABELS[c.category] ?? c.name}</span>
                      <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: isBad ? "var(--bi-bad-soft)" : "var(--bi-warn-soft)", color, fontWeight: 700 }}>
                        {isBad ? "CRITIQUE" : "SURVEILLER"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>{c.name}</div>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, maxWidth: 180, height: 4, background: "var(--bi-line)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ width: `${c.wearPct}%`, height: "100%", background: color, borderRadius: 999 }} />
                      </div>
                      <Mono style={{ fontSize: 16, fontWeight: 700, color, letterSpacing: -0.3 }}>{c.wearPct}%</Mono>
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
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(routes.componentTuto(c.id)); }}
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
                        router.push(isBad ? routes.componentCompare(c.id) : routes.component(c.id));
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
