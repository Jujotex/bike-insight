"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

// Sélecteur de vélo pour la page Coût — même esprit que le dashboard.
// Filtrage côté serveur via ?bike=<id> (« Tous les vélos » = sans paramètre).
export function CostBikePicker({
  bikes,
  selected,
}: {
  bikes: { id: string; name: string }[];
  selected: string | null;
}) {
  const pill = (active: boolean): CSSProperties => ({
    padding: "7px 16px",
    borderRadius: 999,
    border: active ? "1.5px solid var(--bi-ink)" : "1px solid var(--bi-line)",
    background: active ? "var(--bi-ink)" : "var(--bi-card)",
    color: active ? "var(--bi-bg)" : "var(--bi-ink)",
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      <Link href="/cout" style={pill(selected === null)}>Tous les vélos</Link>
      {bikes.map((b) => (
        <Link key={b.id} href={`/cout?bike=${b.id}`} style={pill(selected === b.id)}>
          {b.name}
        </Link>
      ))}
    </div>
  );
}
