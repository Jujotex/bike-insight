"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

export type BikePickerStatus = "ok" | "warn" | "bad";

export type BikePickerItem = {
  id: string;
  name: string;
  status?: BikePickerStatus;
};

const DOT_COLORS: Record<BikePickerStatus, string> = {
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
};

function pillStyle(active: boolean): CSSProperties {
  return {
    padding: "7px 16px",
    borderRadius: 999,
    border: active ? "1.5px solid var(--bi-ink)" : "1px solid var(--bi-line)",
    background: active ? "var(--bi-ink)" : "var(--bi-card)",
    color: active ? "var(--bi-bg)" : "var(--bi-ink)",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 7,
    transition: "all 0.12s",
  };
}

function Dot({ status, active }: { status: BikePickerStatus; active: boolean }) {
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: 999,
        background: active ? "var(--bi-bg)" : DOT_COLORS[status],
        flexShrink: 0,
        display: "inline-block",
        opacity: 0.85,
      }}
    />
  );
}

/**
 * Sélecteur de vélo — source unique pour le dashboard et la page Coût.
 *
 * Deux modes de navigation, même rendu :
 *  - `onSelect` : sélection en mémoire (dashboard, état client).
 *  - `hrefFor`  : navigation par lien (page Coût, filtrage serveur via ?bike=).
 *
 * `allLabel` ajoute une pastille « tous les vélos » en tête (page Coût
 * uniquement — le dashboard a toujours un vélo sélectionné).
 */
export function BikePicker({
  bikes,
  selected,
  onSelect,
  hrefFor,
  allLabel,
  allHref,
}: {
  bikes: BikePickerItem[];
  selected: string | null;
  onSelect?: (id: string) => void;
  hrefFor?: (id: string) => string;
  allLabel?: string;
  allHref?: string;
}) {
  if (bikes.length <= 1) return null;

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      {allLabel && allHref && (
        <Link href={allHref} style={pillStyle(selected === null)}>
          {allLabel}
        </Link>
      )}
      {bikes.map((b) => {
        const active = b.id === selected;
        const content = (
          <>
            {b.status && <Dot status={b.status} active={active} />}
            {b.name}
          </>
        );
        return hrefFor ? (
          <Link key={b.id} href={hrefFor(b.id)} style={pillStyle(active)}>
            {content}
          </Link>
        ) : (
          <button key={b.id} onClick={() => onSelect?.(b.id)} style={pillStyle(active)}>
            {content}
          </button>
        );
      })}
    </div>
  );
}
