"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
    id: "a-prevoir",
    label: "À prévoir",
    href: "/a-prevoir",
    icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  },
  {
    id: "cout",
    label: "Coût",
    href: "/cout",
    icon: "M3 3v18h18M7 15l4-4 3 3 5-6",
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
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      style={{
        flexShrink: 0,
        padding: "12px 8px calc(14px + env(safe-area-inset-bottom, 14px))",
        background: "var(--bi-bg)",
        borderTop: "1px solid var(--bi-line)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const isDashboard = item.id === "dashboard";
        const badge = isDashboard && unreadCount > 0 ? unreadCount : 0;

        return (
          <Link
            key={item.id}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              // 5 entrées : padding resserré et libellé non coupé, sinon la
              // barre déborde sur les écrans étroits (< 360 px).
              padding: "6px 10px",
              minWidth: 0,
              flex: 1,
              borderRadius: 14,
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
                  color: "var(--bi-white)",
                  lineHeight: 1.4,
                  fontFamily: "var(--bi-font-mono)",
                }}>
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>
            <span style={{ fontSize: 11, fontWeight: active ? 600 : 500, letterSpacing: 0.2, whiteSpace: "nowrap" }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
