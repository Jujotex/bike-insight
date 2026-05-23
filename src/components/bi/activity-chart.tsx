"use client";

import { useState, useMemo } from "react";
import { Mono } from "@/components/bi/ui";

type Period = "30j" | "90j" | "12m";

interface Activity {
  started_at: string;
  distance_km: number;
}

interface ActivityChartProps {
  activities: Activity[];
}

function buildChart(activities: Activity[], period: Period): { bars: number[]; labels: string[] } {
  const now = new Date();

  if (period === "30j" || period === "90j") {
    const days = period === "30j" ? 30 : 90;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const bars = Array(days).fill(0);

    for (const a of activities) {
      const d = new Date(a.started_at);
      const diffDays = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      if (diffDays >= 0 && diffDays < days) {
        bars[diffDays] += a.distance_km;
      }
    }

    const labelCount = period === "30j" ? 4 : 4;
    const step = Math.floor(days / (labelCount - 1));
    const labels = Array.from({ length: labelCount }, (_, i) => {
      const offset = i === labelCount - 1 ? 0 : -(days - 1 - i * step);
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    });

    return { bars: bars.map(v => Math.round(v)), labels };
  }

  // 12 months — 12 monthly buckets
  const bars: number[] = Array(12).fill(0);
  const labels: string[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString("fr-FR", { month: "short" }));
  }

  for (const a of activities) {
    const d = new Date(a.started_at);
    const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    const idx = 11 - monthsAgo;
    if (idx >= 0 && idx < 12) {
      bars[idx] += a.distance_km;
    }
  }

  return { bars: bars.map(v => Math.round(v)), labels };
}

export function ActivityChart({ activities }: ActivityChartProps) {
  const [period, setPeriod] = useState<Period>("30j");

  const { bars, labels } = useMemo(() => buildChart(activities, period), [activities, period]);

  const maxVal = Math.max(...bars, 1);
  const totalKm = bars.reduce((s, v) => s + v, 0);
  const totalRides = bars.filter(v => v > 0).length;
  const avgKm = totalRides > 0 ? Math.round(totalKm / totalRides) : 0;

  const PERIODS: Period[] = ["30j", "90j", "12m"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            Activité · {period === "30j" ? "30 derniers jours" : period === "90j" ? "90 derniers jours" : "12 derniers mois"}
          </div>
          <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>
            {totalKm.toLocaleString("fr-FR")} km · {totalRides} sortie{totalRides !== 1 ? "s" : ""} · moyenne {avgKm} km
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 999,
                border: period === p ? "none" : "1px solid var(--bi-line)",
                background: period === p ? "var(--bi-ink)" : "transparent",
                color: period === p ? "var(--bi-bg)" : "var(--bi-muted)",
                fontWeight: period === p ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 18, height: 80, display: "flex", alignItems: "flex-end", gap: period === "12m" ? 6 : 4 }}>
        {bars.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(2, Math.round((h / maxVal) * 100))}%`,
              background: h > maxVal * 0.6 ? "var(--bi-accent)" : h > 0 ? "#D9D8D2" : "var(--bi-line)",
              borderRadius: 2,
              minHeight: 2,
            }}
          />
        ))}
      </div>

      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--bi-muted)", fontFamily: "var(--font-jetbrains-mono)" }}>
        {labels.map((l, i) => (
          <Mono key={i} style={{ fontSize: 10.5, color: "var(--bi-muted)" }}>{l}</Mono>
        ))}
      </div>
    </div>
  );
}
