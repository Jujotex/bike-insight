/**
 * Bike Insight shared UI primitives
 * Mirrors the design tokens from the Pulse maquettes.
 */
import React from "react";
import Link from "next/link";

// ── Status dot ────────────────────────────────────────────────
export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: 999,
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

// ── Progress bar ──────────────────────────────────────────────
export function ProgressBar({
  value,
  color,
  height = 4,
}: {
  value: number; // 0–1
  color: string;
  height?: number;
}) {
  return (
    <div
      style={{
        height,
        borderRadius: 999,
        background: "var(--bi-line)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(100, value * 100)}%`,
          height: "100%",
          background: color,
          borderRadius: 999,
        }}
      />
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────
// `pad` : trois usages seulement.
//   défaut ("20px 22px") → carte normale
//   0                    → carte à sections (CardHead + .bi-rows)
//   40                   → état vide (voir EmptyState)
export function BiCard({
  children,
  pad = "20px 22px",
  style = {},
  className = "",
}: {
  children: React.ReactNode;
  pad?: number | string;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: "var(--bi-card)",
        borderRadius: 18,
        border: "1px solid var(--bi-line)",
        padding: pad,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────
export function BiLabel({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: "var(--bi-muted)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Card header ───────────────────────────────────────────────
// En-tête des cartes CONTENEUR (liste, graphe, tableau).
// Les cartes MÉTRIQUE (un chiffre et rien d'autre) utilisent <BiLabel>.
export function CardHead({
  title,
  sub,
  right,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "20px 22px 14px",
        borderBottom: "1px solid var(--bi-line)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        {sub && (
          <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      {right && <div style={{ textAlign: "right", flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

// ── Metric ────────────────────────────────────────────────────
// Chiffre + unité. Deux tailles, pas plus :
//   lg → chiffre principal d'une carte métrique
//   sm → chiffre secondaire (en-tête de carte, colonne)
// L'unité est toujours détachée, en 12px muted mono, alignée sur la baseline.
export function Metric({
  value,
  unit,
  size = "lg",
  color,
  align = "left",
}: {
  value: React.ReactNode;
  unit?: string;
  size?: "lg" | "sm";
  color?: string;
  align?: "left" | "right";
}) {
  const scale =
    size === "lg"
      ? { fontSize: 28, fontWeight: 500, letterSpacing: -0.8 }
      : { fontSize: 20, fontWeight: 600, letterSpacing: -0.4 };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 6,
        justifyContent: align === "right" ? "flex-end" : "flex-start",
      }}
    >
      <Mono style={{ ...scale, color: color ?? "var(--bi-ink)" }}>{value}</Mono>
      {unit && (
        <span
          style={{
            fontSize: 12,
            color: "var(--bi-muted)",
            fontFamily: "var(--bi-font-mono)",
          }}
        >
          {unit}
        </span>
      )}
    </div>
  );
}

// ── Chevron ───────────────────────────────────────────────────
// Une seule taille pour les lignes cliquables : 14.
// (Le chevron de fil d'ariane de PageHead est un cas à part, il reste à 9.)
export function Chevron({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--bi-muted)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// ── List row ──────────────────────────────────────────────────
// Ligne de liste dans une carte `pad={0}`. À placer dans un
// conteneur .bi-rows, qui gère les filets entre lignes.
//   accent  → barre latérale colorée (statut, catégorie)
//   leading → pastille / avatar (événement)
export function ListRow({
  href,
  accent,
  leading,
  title,
  sub,
  trailing,
  chevron,
}: {
  href?: string;
  accent?: string;
  leading?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
}) {
  const showChevron = chevron ?? !!href;
  const style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 22px",
    textDecoration: "none",
    color: "inherit",
  };

  const inner = (
    <>
      {accent && (
        <div
          style={{
            width: 4,
            height: 26,
            background: accent,
            borderRadius: 2,
            flexShrink: 0,
          }}
        />
      )}
      {leading}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </span>
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      {trailing}
      {showChevron && <Chevron />}
    </>
  );

  return href ? (
    <Link href={href} className="bi-row bi-component-row" style={style}>
      {inner}
    </Link>
  ) : (
    <div className="bi-row" style={style}>
      {inner}
    </div>
  );
}

// ── Chip (filtre cliquable) ───────────────────────────────────
// Deux tailles : md pour un sélecteur de page (BikePicker),
// sm pour un filtre à l'intérieur d'une carte.
export function chipStyle(active: boolean, size: "md" | "sm" = "sm"): React.CSSProperties {
  const scale =
    size === "md"
      ? { padding: "7px 16px", fontSize: 13 }
      : { padding: "5px 12px", fontSize: 12 };
  return {
    ...scale,
    borderRadius: 999,
    border: `1px solid ${active ? "var(--bi-ink)" : "var(--bi-line)"}`,
    background: active ? "var(--bi-ink)" : "transparent",
    color: active ? "var(--bi-bg)" : "var(--bi-muted)",
    fontWeight: active ? 600 : 500,
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

export function Chip({
  active,
  onClick,
  size = "sm",
  children,
}: {
  active: boolean;
  onClick: () => void;
  size?: "md" | "sm";
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={chipStyle(active, size)}>
      {children}
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────
export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <BiCard pad={40} style={{ textAlign: "center" }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--bi-muted)" }}>{text}</div>
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </BiCard>
  );
}

// ── Bars (mini histogramme) ───────────────────────────────────
// Barres verticales : h90, gap 4, radius 2.
// accent au-dessus du seuil · --bi-bar-idle en dessous · --bi-line si zéro.
// `onHover` n'est passé que depuis un composant client.
export function Bars({
  values,
  height = 90,
  gap = 4,
  hovered = null,
  onHover,
}: {
  values: number[];
  height?: number;
  gap?: number;
  hovered?: number | null;
  onHover?: (i: number | null) => void;
}) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap, height }}>
      {values.map((v, i) => (
        <div
          key={i}
          // Les handlers ne sont attachés que si `onHover` est fourni :
          // sans ça, un composant serveur poserait une prop d'événement.
          {...(onHover
            ? { onMouseEnter: () => onHover(i), onMouseLeave: () => onHover(null) }
            : {})}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
            height: "100%",
            cursor: "default",
          }}
        >
          <div
            style={{
              width: "100%",
              height: `${v > 0 ? Math.max(4, Math.round((v / max) * 100)) : 2}%`,
              minHeight: 2,
              borderRadius: 2,
              background:
                v <= 0
                  ? "var(--bi-line)"
                  : v > max * 0.6
                    ? "var(--bi-accent)"
                    : "var(--bi-bar-idle)",
              opacity: hovered === i ? 0.7 : 1,
              transition: "opacity 0.1s",
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Monospace span ────────────────────────────────────────────
export function Mono({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
        fontFeatureSettings: '"tnum"',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ── Status pill ───────────────────────────────────────────────
export type StatusKind = "ok" | "warn" | "bad";

const STATUS_COLORS: Record<StatusKind, string> = {
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
};

// Fonds doux : tokens du design system (~0.08) plutot qu'un color-mix inline.
const STATUS_SOFT: Record<StatusKind, string> = {
  ok: "var(--bi-ok-soft)",
  warn: "var(--bi-warn-soft)",
  bad: "var(--bi-bad-soft)",
};

export function StatusPill({
  kind,
  label,
}: {
  kind: StatusKind;
  label: string;
}) {
  const color = STATUS_COLORS[kind];
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        borderRadius: 999,
        background: STATUS_SOFT[kind],
        color,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.2,
      }}
    >
      <Dot color={color} size={6} />
      {label}
    </div>
  );
}

// ── Primary button ────────────────────────────────────────────
export function PrimaryBtn({
  children,
  onClick,
  style = {},
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        background: "var(--bi-ink)",
        color: "var(--bi-bg)",
        border: "none",
        borderRadius: 14,
        padding: "16px 0",
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: "pointer",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Page header (web) ─────────────────────────────────────────
export function PageHead({
  title,
  sub,
  breadcrumb,
  actions,
}: {
  title: string;
  sub?: string;
  breadcrumb?: string[];
  actions?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      {breadcrumb && breadcrumb.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "var(--bi-muted)",
            marginBottom: 10,
          }}
        >
          {breadcrumb.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              )}
              <span
                style={{
                  color:
                    i === breadcrumb.length - 1
                      ? "var(--bi-ink)"
                      : "var(--bi-muted)",
                }}
              >
                {b}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div
        className="bi-pagehead-row"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            className="bi-pagehead-title"
            style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1 }}
          >
            {title}
          </div>
          {sub && (
            <div
              style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 6 }}
            >
              {sub}
            </div>
          )}
        </div>
        {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
      </div>
    </div>
  );
}
