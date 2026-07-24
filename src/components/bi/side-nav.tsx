"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SideNavBike {
  id: string;
  name: string;
  is_active: boolean;
}

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Accueil",
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
    id: "cout",
    label: "Coût",
    href: "/cout",
    icon: "M3 3v18h18M7 15l4-4 3 3 5-6",
  },
  {
    id: "historique",
    label: "Historique",
    href: "/historique",
    icon: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 8v4l3 2",
  },
];

interface SideNavProps {
  bikes?: SideNavBike[];
  userInitials?: string;
  userName?: string;
  bikeCount?: number;
  unreadCount?: number;
}

export function SideNav({ bikes = [], userInitials = "?", userName = "Utilisateur", bikeCount, unreadCount = 0 }: SideNavProps) {
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
      <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 10px 28px", textDecoration: "none", color: "inherit" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--bi-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bi-accent-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 18l4-8 4 6 4-10 4 8" />
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>Bike Insight</span>
      </Link>

      {/* Nav items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const on = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 10, textDecoration: "none",
                background: on ? "rgba(14,14,16,0.05)" : "transparent",
                color: on ? "var(--bi-ink)" : "var(--bi-muted)",
                fontSize: 13, fontWeight: on ? 600 : 500,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span style={{ flex: 1 }}>{item.label}</span>
              {on && (
                <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: 999, background: "var(--bi-accent)", flexShrink: 0 }} />
              )}
            </Link>
          );
        })}

      </div>

      <div style={{ flex: 1 }} />

      {/* User footer */}
      <Link href="/account" style={{ padding: "0 12px", display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit", borderRadius: 10, marginLeft: -12, marginRight: -12, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: isActive("/account") ? "rgba(14,14,16,0.05)" : "transparent" }}>
        <div style={{ width: 32, height: 32, borderRadius: 999, background: "var(--bi-card)", border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
          {userInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
          <div style={{ fontSize: 11, color: "var(--bi-muted)" }}>
            {bikeCount !== undefined ? `${bikeCount} vélo${bikeCount !== 1 ? "s" : ""} actif${bikeCount !== 1 ? "s" : ""}` : ""}
          </div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
      </Link>
    </nav>
  );
}
