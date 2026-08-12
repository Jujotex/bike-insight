"use client";

import { useState } from "react";
import { BiCard, CardHead, Chip, ListRow, Mono } from "@/components/bi/ui";
import { fmtDate, fmtNum } from "@/lib/format";

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

// Pastille d'événement : accent + clé pour un entretien, encre + flèches
// de cycle pour un remplacement.
function EventDot({ kind }: { kind: HistoryItem["kind"] }) {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: kind === "maint" ? "var(--bi-accent)" : "var(--bi-ink)",
        color: kind === "maint" ? "var(--bi-accent-ink)" : "var(--bi-bg)",
      }}
    >
      {kind === "maint" ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
      )}
    </div>
  );
}

export function HistoryLog({ items }: { items: HistoryItem[] }) {
  const [filter, setFilter] = useState<"all" | "repl" | "maint">("all");
  const [showAll, setShowAll] = useState(false);

  if (items.length === 0) return null;

  const filtered = items.filter((i) => filter === "all" || i.kind === filter);
  const shown = showAll ? filtered : filtered.slice(0, 20);
  const total = Math.round(filtered.reduce((s, i) => s + (i.cost ?? 0), 0));

  return (
    <BiCard pad={0} style={{ overflow: "hidden" }}>
      <CardHead
        title="Journal"
        sub="Tes remplacements et entretiens, du plus récent au plus ancien"
        right={
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CHIPS.map(([v, label]) => (
              <Chip
                key={v}
                active={filter === v}
                onClick={() => { setFilter(v); setShowAll(false); }}
              >
                {label}
              </Chip>
            ))}
          </div>
        }
      />

      <div className="bi-rows">
        {shown.map((it) => (
          <ListRow
            key={it.id}
            leading={<EventDot kind={it.kind} />}
            title={`${it.kind === "repl" ? "Remplacement · " : ""}${it.title}`}
            sub={
              fmtDate(it.dateISO)
              + (it.km != null ? ` · ${fmtNum(it.km)} km` : "")
              + (it.reason ? ` · ${REASON_LABELS[it.reason] ?? it.reason}` : "")
            }
            trailing={
              <Mono style={{ fontSize: 14, fontWeight: 600, flexShrink: 0, color: it.cost != null ? "var(--bi-ink)" : "var(--bi-muted)" }}>
                {it.cost != null ? `${fmtNum(it.cost)} €` : "—"}
              </Mono>
            }
          />
        ))}
      </div>

      <div style={{ padding: "12px 22px", borderTop: "1px solid var(--bi-line)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--bi-muted)" }}>
        {filtered.length > 20 ? (
          <button onClick={() => setShowAll((v) => !v)} style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, color: "var(--bi-ink)" }}>
            {showAll ? "Réduire" : `Voir tout (${filtered.length})`}
          </button>
        ) : (
          <span>{filtered.length} événement{filtered.length > 1 ? "s" : ""}</span>
        )}
        <span>Total · <Mono style={{ color: "var(--bi-ink)", fontWeight: 600 }}>{fmtNum(total)} €</Mono></span>
      </div>
    </BiCard>
  );
}
