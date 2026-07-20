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
 *  - `onSelect` : sélection en mémoire, depuis un composant client (dashboard).
 *  - `basePath` : navigation par lien, filtrage serveur via `?bike=`
 *    (page Coût, qui est un composant serveur).
 *
 * ⚠️ `basePath` est une CHAÎNE, pas une fonction qui construirait l'URL.
 * Un composant serveur ne peut passer que des props sérialisables à un
 * composant client : une prop fonction fait échouer le rendu (erreur 500).
 * Les URLs sont donc assemblées ici.
 *
 * Il n'y a délibérément PAS d'option « tous les vélos » : un vélo est
 * toujours sélectionné, sur toutes les pages. Un agrégat tous-vélos mêlerait
 * des chiffres qui ne se comparent pas (usure, coût, échéances d'entretien
 * dépendent du vélo). Les pages serveur résolvent un vélo par défaut.
 */
export function BikePicker({
  bikes,
  selected,
  onSelect,
  basePath,
}: {
  bikes: BikePickerItem[];
  selected: string | null;
  onSelect?: (id: string) => void;
  basePath?: string;
}) {
  if (bikes.length <= 1) return null;

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      {bikes.map((b) => {
        const active = b.id === selected;
        const content = (
          <>
            {b.status && <Dot status={b.status} active={active} />}
            {b.name}
          </>
        );
        return basePath ? (
          <Link
            key={b.id}
            href={`${basePath}?bike=${encodeURIComponent(b.id)}`}
            style={pillStyle(active)}
          >
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
