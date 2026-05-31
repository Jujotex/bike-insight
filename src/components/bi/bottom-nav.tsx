"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
    icon: "M12 4v4M12 16v4M4 12h4M16 12h4M12 9a3 3 0 100 6 3 3 0 000-6z",
  },
  {
    id: "notifications",
    label: "Alertes",
    href: "/notifications",
    icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  },
  {
    id: "account",
    label: "Compte",
    href: "/account",
    icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count ?? 0);
    }
    fetchUnread();
  }, [pathname]); // re-fetch quand on navigue

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      style={{
        flexShrink: 0,
        padding: "12px 8px 28px",
        background: "var(--bi-bg)",
        borderTop: "1px solid var(--bi-line)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const isNotif = item.id === "notifications";
        const badge = isNotif && unreadCount > 0 ? unreadCount : 0;

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
              position: "relative",
            }}
          >
            <div style={{ position: "relative" }}>
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
              {badge > 0 && (
                <span style={{
                  position: "absolute",
                  top: -4, right: -6,
                  fontSize: 9, fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: 999,
                  background: "var(--bi-bad)",
                  color: "#fff",
                  lineHeight: 1.4,
                  fontFamily: "var(--bi-font-mono)",
                }}>
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>
            <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 500, letterSpacing: 0.2 }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
