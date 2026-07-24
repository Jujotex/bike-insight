"use client";

import { useState } from "react";
import { BiCard, Mono } from "@/components/bi/ui";

export type HistoryItem = {
  id: string;
  kind: "repl" | "maint";
  title: string;
  dateISO: string;
  km: number | null;
  reason: string | null;
  cost: number | null;
};

const REASON_LABELS: Record<string, string> = {
  usure: "Usure",
  crevaison: "Crevaison",
  casse: "Casse",
  "anticipé": "Anticipé",
};

const CHIPS: [("all" | "repl" | "maint"), string][] = [
  ["all", "Tout"],
  ["repl", "Remplacements"],
  ["maint", "Entretiens"],
];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function CostHistory({ items }: { items: HistoryItem[] }) {
  const [filter, setFilter] = useState<"all" | "repl" | "maint">("all");
  const [showAll, setShowAll] = useState(false);

  if (items.length === 0) return null;

  const filtered = items.filter((i) => filter === "all" || i.kind === filter);
  const shown = showAll ? filtered : filtered.slice(0, 20);
  const total = Math.round(filtered.reduce((s, i) => s + (i.cost ?? 0), 0));

  return (
    <BiCard pad={0} style={{ marginTop: 14, overflow: "hidden" }}>
      <div style={{ padding: "20px 22px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--bi-line)" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Historique</div>
          <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>Tes remplacements et entretiens, du plus récent au plus ancien</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CHIPS.map(([v, label]) => {
            const on = filter === v;
            return (
              <button
                key={v}
                onClick={() => { setFilter(v); setShowAll(false); }}
                style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, border: `1px solid ${on ? "var(--bi-ink)" : "var(--bi-line)"}`, background: on ? "var(--bi-ink)" : "transparent", color: on ? "var(--bi-bg)" : "var(--bi-muted)", fontFamily: "inherit", fontWeight: on ? 600 : 500, cursor: "pointer" }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {shown.map((it) => (
        <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderTop: "1px solid var(--bi-line)" }}>
          <div style={{ width: 34, height: 34, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: it.kind === "maint" ? "var(--bi-accent)" : "var(--bi-ink)", color: it.kind === "maint" ? "var(--bi-accent-ink)" : "var(--bi-bg)" }}>
            {it.kind === "maint" ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.kind === "repl" ? "Remplacement · " : ""}{it.title}</div>
            <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>
              {fmtDate(it.dateISO)}
              {it.km != null ? ` · ${it.km.toLocaleString("fr")} km` : ""}
              {it.reason ? ` · ${REASON_LABELS[it.reason] ?? it.reason}` : ""}
            </div>
          </div>
          <Mono style={{ fontSize: 14, fontWeight: 600, flexShrink: 0, color: it.cost != null ? "var(--bi-ink)" : "var(--bi-muted)" }}>{it.cost != null ? `${it.cost} €` : "—"}</Mono>
        </div>
      ))}

      <div style={{ padding: "12px 22px", borderTop: "1px solid var(--bi-line)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--bi-muted)" }}>
        {filtered.length > 20 ? (
          <button onClick={() => setShowAll((v) => !v)} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: "var(--bi-ink)" }}>
            {showAll ? "Réduire" : `Voir tout (${filtered.length})`}
          </button>
        ) : (
          <span>{filtered.length} événement{filtered.length > 1 ? "s" : ""}</span>
        )}
        <span>Total · <Mono style={{ color: "var(--bi-ink)", fontWeight: 600 }}>{total} €</Mono></span>
      </div>
    </BiCard>
  );
}
