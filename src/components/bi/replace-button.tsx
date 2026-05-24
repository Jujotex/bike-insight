"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Props {
  componentId: string;
  bikeId: string;
  componentName: string;
  componentCategory: string;
  currentBikeKm: number;
  componentPrice?: number | null;
}

export function ReplaceButton({
  componentId,
  bikeId,
  componentName,
  componentCategory,
  currentBikeKm,
  componentPrice,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleReplace() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // 1. Archiver le composant
    const { error: archiveErr } = await supabase
      .from("components")
      .update({ status: "archived", is_active: false })
      .eq("id", componentId);

    if (archiveErr) { setLoading(false); return; }

    // 2. Insérer un log de maintenance
    await supabase.from("maintenance_logs").insert({
      component_id: componentId,
      user_id:      user.id,
      action:       "Remplacement",
      km_at_action: currentBikeKm,
      cost:         componentPrice ?? null,
      performed_at: new Date().toISOString().slice(0, 10),
    });

    // 3. Recalculer l'usure
    await fetch("/api/components/recalculate", { method: "POST" }).catch(() => {});

    // 4. Rediriger vers le formulaire pré-rempli
    const params = new URLSearchParams({
      bike_id:      bikeId,
      type:         componentName.split(" · ")[0],
      category:     componentCategory,
      installed_km: String(Math.round(currentBikeKm)),
    });

    router.push(`/components/new?${params.toString()}`);
    router.refresh();
  }

  if (confirm) {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setConfirm(false)}
          style={{ padding: "9px 14px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}
        >
          Annuler
        </button>
        <button
          onClick={handleReplace}
          disabled={loading}
          style={{ padding: "9px 16px", background: "var(--bi-bad)", color: "#fff", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "…" : "Confirmer le remplacement"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      style={{ padding: "9px 16px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-ink)", display: "flex", alignItems: "center", gap: 6 }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
      </svg>
      Remplacer
    </button>
  );
}
