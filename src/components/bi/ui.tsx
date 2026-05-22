/**
 * Bike Insight shared UI primitives
 * Mirrors the design tokens from the Pulse maquettes.
 */
import React from "react";

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
export function BiCard({
  children,
  pad = 18,
  style = {},
  className = "",
}: {
  children: React.ReactNode;
  pad?: number;
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
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "var(--bi-muted)",
        ...style,
      }}
    >
      {children}
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
        padding: "4px 9px",
        borderRadius: 999,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
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
        fontSize: 14.5,
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
            fontSize: 11.5,
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
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 24,
        }}
      >
        <div>
          <div
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
