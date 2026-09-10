"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { routes } from "@/lib/routes";

interface ArchiveButtonProps {
  componentId: string;
  isArchived: boolean;
  bikeId: string;
}

export function ArchiveButton({ componentId, isArchived, bikeId }: ArchiveButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleArchive() {
    if (!confirm(isArchived ? "Réactiver ce composant ?" : "Marquer ce composant comme remplacé ? Il sera archivé.")) return;
    setLoading(true);

    await supabase
      .from("components")
      .update({
        status: isArchived ? "ok" : "archived",
        is_active: isArchived ? true : false,
      })
      .eq("id", componentId);

    // Retour vers le vélo (onglet Pièces), pas vers /components : cette
    // route n'existe plus comme destination, elle redirige déjà vers /bikes
    // (voir components/page.tsx) — un détour inutile depuis ici, qui a
    // directement le bon vélo sous la main.
    router.push(routes.bikeTab(bikeId, "pieces"));
    router.refresh();
  }

  return (
    <button
      onClick={handleArchive}
      disabled={loading}
      style={{
        padding: "10px 16px",
        background: isArchived ? "var(--bi-ink)" : "transparent",
        color: isArchived ? "var(--bi-bg)" : "var(--bi-ink)",
        border: "1px solid var(--bi-line)",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? "…" : isArchived ? "Réactiver" : "Marquer remplacé"}
    </button>
  );
}
