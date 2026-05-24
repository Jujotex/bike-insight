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
}

export function ReplaceButton({ componentId, bikeId, componentName, componentCategory, currentBikeKm }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function handleReplace() {
    setLoading(true);

    const { error } = await supabase
      .from("components")
      .update({ status: "archived", is_active: false })
      .eq("id", componentId);

    if (error) { setLoading(false); return; }

    await fetch("/api/components/recalculate", { method: "POST" }).catch(() => {});

    const params = new URLSearchParams({
      bike_id:      bikeId,
      type:         componentName,
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
      style={{
        padding: "9px 16px",
        background: "transparent",
        border: "1px solid var(--bi-line)",
        borderRadius: 10,
        fontSize: 12.5,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: "pointer",
        color: "var(--bi-ink)",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
      </svg>
      Remplacer
    </button>
  );
}
