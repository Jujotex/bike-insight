"use client";

import Link from "next/link";
import { routes } from "@/lib/routes";

export type HubTab = "apercu" | "pieces" | "entretien" | "cout" | "historique";

const TABS: { id: HubTab; label: string }[] = [
  { id: "apercu", label: "Aperçu" },
  { id: "pieces", label: "Pièces" },
  { id: "entretien", label: "Entretien" },
  { id: "cout", label: "Coût" },
  { id: "historique", label: "Historique" },
];

/**
 * Bande d'onglets du Hub vélo. Pensée pour vivre au bas du héros sombre
 * (fond hérité, pas le sien) : c'est ce qui garde le vélo identifié pendant
 * qu'on change d'onglet, plutôt que de le faire disparaître comme le
 * ferait un changement de page.
 */
export function HubTabs({ bikeId, active }: { bikeId: string; active: HubTab }) {
  return (
    <div
      className="bi-scroll-x"
      style={{
        position: "relative",
        display: "flex",
        gap: 6,
        overflowX: "auto",
        marginTop: 18,
        paddingTop: 16,
        borderTop: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {TABS.map((t) => {
        const isActive = t.id === active;
        return (
          <Link
            key={t.id}
            href={routes.bikeTab(bikeId, t.id)}
            style={{
              flexShrink: 0,
              padding: "10px 16px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: isActive ? 700 : 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
              background: isActive ? "var(--bi-accent)" : "transparent",
              color: isActive ? "var(--bi-accent-ink)" : "var(--bi-on-dark-muted)",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
