"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SideNavBike {
  id: string;
  name: string;
  is_active: boolean;
  most_critical_component: string | null;
}

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Vue d'ensemble",
    href: "/dashboard",
    icon: "M3 12L12 4l9 8M5 10v10h14V10",
  },
  {
    id: "bikes",
    label: "Mes vélos",
    href: "/bikes",
    icon: "M5 18a4 4 0 100-8 4 4 0 000 8zM19 18a4 4 0 100-8 4 4 0 000 8zM12 7l-3 7h6l-3-7zM12 7V4h3",
  },
  {
    id: "parts",
    label: "Composants",
    href: "/components",
    icon: "M12 4v4M12 16v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8M12 9a3 3 0 100 6 3 3 0 000-6z",
  },
  {
    id: "analysis",
    label: "Analyse",
    href: "/analysis",
    icon: "M4 20V10M10 20V4M16 20v-6M22 20H2",
  },
  {
    id: "sync",
    label: "Sync Strava",
    href: "/sync",
    icon: "M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-3M20 14a8 8 0 01-14 3",
  },
];

interface SideNavProps {
  bikes?: SideNavBike[];
  userInitials?: string;
  userName?: string;
  bikeCount?: number;
}

export function SideNav({ bikes = [], userInitials = "?", userName = "Utilisateur", bikeCount }: SideNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      style={{
        width: 240,
        flexShrink: 0,
        height: "100%",
        background: "var(--bi-bg)",
        borderRight: "1px solid var(--bi-line)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 16px",
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "4px 10px 28px",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--bi-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--bi-accent-ink)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 18l4-8 4 6 4-10 4 8" />
          </svg>
        </div>
        <span
          style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}
        >
          Bike Insight
        </span>
      </div>

      {/* Nav items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const on = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                textDecoration: "none",
                background: on ? "rgba(14,14,16,0.05)" : "transparent",
                color: on ? "var(--bi-ink)" : "var(--bi-muted)",
                fontSize: 13.5,
                fontWeight: on ? 600 : 500,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.icon} />
              </svg>
              <span style={{ flex: 1 }}>{item.label}</span>
              {on && (
                <span
                  style={{
                    display: "inline-block",
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: "var(--bi-accent)",
                    flexShrink: 0,
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Mes vélos section */}
      <div style={{ marginTop: 28, padding: "0 12px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--bi-muted)",
          }}
        >
          Mes vélos
        </div>
        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {bikes.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--bi-muted)", padding: "6px 0" }}>Aucun vélo connecté</div>
          ) : (
            bikes.map((b) => (
              <Link
                key={b.id}
                href={`/bikes/${b.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 0",
                  fontSize: 12.5,
                  color: b.is_active ? "var(--bi-ink)" : "var(--bi-muted)",
                  fontWeight: b.is_active ? 500 : 400,
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: b.most_critical_component
                      ? "var(--bi-bad)"
                      : b.is_active
                      ? "var(--bi-accent)"
                      : "var(--bi-muted)",
                    flexShrink: 0,
                  }}
                />
                {b.name}
              </Link>
            ))
          )}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* User footer */}
      <div
        style={{
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: "var(--bi-card)",
            border: "1px solid var(--bi-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {userInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
          <div style={{ fontSize: 10.5, color: "var(--bi-muted)" }}>
            {bikeCount !== undefined ? `${bikeCount} vélo${bikeCount !== 1 ? "s" : ""} actif${bikeCount !== 1 ? "s" : ""}` : ""}
          </div>
        </div>
      </div>
    </nav>
  );
}
