"use client";

import { useState } from "react";
import { Bars, BiCard, CardHead, Metric, Mono, ProgressBar } from "@/components/bi/ui";
import { fmtNum } from "@/lib/format";
import type { HistoryItem } from "./history-log";

export function HistoryCharts({ items }: { items: HistoryItem[] }) {
  const totalCost = items.reduce((s, i) => s + (i.cost ?? 0), 0);

  // ── Dépenses par mois (12 derniers mois) ──
  const now = new Date();
  const buckets: { label: string; value: number }[] = [];
  const idxByKey = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    idxByKey.set(`${d.getFullYear()}-${d.getMonth()}`, buckets.length);
    buckets.push({ label: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }), value: 0 });
  }
  for (const it of items) {
    if (!it.cost) continue;
    const [y, m] = it.dateISO.split("-");
    const idx = idxByKey.get(`${Number(y)}-${Number(m) - 1}`);
    if (idx != null) buckets[idx].value += it.cost;
  }
  const lastNonZero = (() => { for (let i = buckets.length - 1; i >= 0; i--) if (buckets[i].value > 0) return i; return buckets.length - 1; })();

  // ── Subi ou choisi ? (par nature) ──
  const nat = [
    { label: "Entretien planifié", sub: "Révisions, purge, nettoyage…", color: "var(--bi-ink)", value: 0 },
    { label: "Usure normale", sub: "Remplacements liés à l'usure", color: "var(--bi-accent)", value: 0 },
    { label: "Incident", sub: "Crevaison, casse — évitable ?", color: "var(--bi-warn)", value: 0 },
    { label: "Anticipé", sub: "Changé en avance, par choix", color: "var(--bi-muted)", value: 0 },
  ];
  for (const it of items) {
    if (!it.cost) continue;
    if (it.kind === "maint") nat[0].value += it.cost;
    else if (it.reason === "crevaison" || it.reason === "casse") nat[2].value += it.cost;
    else if (it.reason === "anticipé") nat[3].value += it.cost;
    else nat[1].value += it.cost;
  }
  const natShown = nat.filter((n) => n.value > 0).sort((a, b) => b.value - a.value);
  const natTotal = natShown.reduce((s, n) => s + n.value, 0);

  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? lastNonZero;

  if (totalCost === 0) return null;

  return (
    <>
      {/* Dépenses par mois */}
      <BiCard pad={0}>
        <CardHead
          title="Dépenses par mois"
          sub="Sur les 12 derniers mois"
          right={
            <>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", textTransform: "capitalize" }}>{buckets[active].label}</div>
              <Metric value={fmtNum(Math.round(buckets[active].value))} unit="€" size="sm" align="right" />
            </>
          }
        />
        <div style={{ padding: "20px 22px" }}>
          <Bars
            values={buckets.map((b) => b.value)}
            height={110}
            gap={6}
            hovered={hover}
            onHover={setHover}
          />
          <div className="bi-chart-labels" style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {buckets.map((b, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "var(--bi-muted)" }}>{b.label.charAt(0).toUpperCase()}</div>
            ))}
          </div>
        </div>
      </BiCard>

      {/* Subi ou choisi ? */}
      <BiCard pad={0}>
        <CardHead title="Subi ou choisi ?" sub="Répartition de tes dépenses par nature" />
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          {natShown.map((n) => {
            const pct = Math.round((n.value / natTotal) * 100);
            return (
              <div key={n.label}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{n.label}</span>
                  <Mono style={{ fontSize: 13, fontWeight: 600 }}>{fmtNum(Math.round(n.value))} € · {pct}%</Mono>
                </div>
                <div style={{ fontSize: 11, color: "var(--bi-muted)", margin: "2px 0 6px" }}>{n.sub}</div>
                <ProgressBar value={pct / 100} color={n.color} height={8} />
              </div>
            );
          })}
        </div>
      </BiCard>
    </>
  );
}
