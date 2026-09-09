"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";

// 4 items : Compte est passé dans l'avatar du header mobile (mobile-account-bar.tsx).
// Un 5e item ne tenait pas sur 375px sans tronquer un libellé.
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

/**
 * Dock flottant plutôt que barre bord-à-bord : `position: fixed`, retiré du flux.
 * `.bi-page` réserve l'espace en bas (voir globals.css) puisque le dock ne pousse
 * plus le contenu comme le faisait l'ancienne barre statique.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      const userId = await getCurrentUserId();
      if (!userId) return;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
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
        position: "fixed",
        left: 14,
        right: 14,
        bottom: "calc(14px + env(safe-area-inset-bottom, 14px))",
        zIndex: 60,
        background: "var(--bi-ink)",
        borderRadius: 999,
        boxShadow: "0 16px 40px -14px rgba(14,14,16,0.4)",
        padding: "8px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
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
              alignItems: "center",
              gap: 7,
              padding: active ? "11px 15px" : "11px 12px",
              borderRadius: 999,
              textDecoration: "none",
              background: active ? "var(--bi-accent)" : "transparent",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            <div style={{ position: "relative", display: "flex" }}>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke={active ? "var(--bi-accent-ink)" : "rgba(255,255,255,0.55)"}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
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
            {active && (
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--bi-accent-ink)", whiteSpace: "nowrap" }}>
                {item.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
