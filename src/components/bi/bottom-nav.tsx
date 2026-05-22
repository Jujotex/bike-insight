"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Vue",
    href: "/dashboard",
    icon: "M3 12L12 4l9 8M5 10v10h14V10",
  },
  {
    id: "bikes",
    label: "Vélos",
    href: "/bikes",
    icon: "M5 18a4 4 0 100-8 4 4 0 000 8zM19 18a4 4 0 100-8 4 4 0 000 8zM12 7l-3 7h6l-3-7zM12 7V4h3",
  },
  {
    id: "parts",
    label: "Pièces",
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
    label: "Sync",
    href: "/sync",
    icon: "M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-3M20 14a8 8 0 01-14 3",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      style={{
        flexShrink: 0,
        padding: "12px 12px 28px",
        background: "var(--bi-bg)",
        borderTop: "1px solid var(--bi-line)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 10px",
              borderRadius: 12,
              textDecoration: "none",
              color: active ? "var(--bi-ink)" : "var(--bi-muted)",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.6"
            >
              <path d={item.icon} />
            </svg>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: active ? 600 : 500,
                letterSpacing: 0.2,
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
