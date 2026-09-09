"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/current-user";

/**
 * Remplace l'onglet Compte du dock mobile (bottom-nav.tsx), retiré pour ne
 * garder que 4 items. Prend sa propre place dans le flux (pas de `position:
 * fixed`) : un avatar flottant par-dessus le contenu risquerait de chevaucher
 * un titre de page long, chose que je ne peux pas vérifier visuellement ici.
 *
 * Auto-chargé côté client, comme le compteur non lus de BottomNav — même
 * pattern, pas de prop à faire remonter depuis chaque page.
 */
export function MobileAccountBar() {
  const [initials, setInitials] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (!user || cancelled) return;
        const displayName =
          (user.user_metadata?.full_name as string | undefined) ??
          user.email?.split("@")[0] ??
          "";
        const computed =
          displayName
            .split(/[\s.]+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w: string) => w[0].toUpperCase())
            .join("") ||
          user.email?.[0]?.toUpperCase() ||
          "?";
        if (!cancelled) setInitials(computed);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      style={{
        flexShrink: 0,
        display: "flex",
        justifyContent: "flex-end",
        padding:
          "calc(12px + env(safe-area-inset-top, 0px)) calc(16px + env(safe-area-inset-right, 0px)) 4px calc(16px + env(safe-area-inset-left, 0px))",
      }}
    >
      <Link
        href="/account"
        aria-label="Mon compte"
        style={{
          width: 34,
          height: 34,
          borderRadius: 999,
          background: "var(--bi-ink)",
          color: "var(--bi-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "var(--bi-font-ui)",
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        {initials ?? "·"}
      </Link>
    </div>
  );
}
