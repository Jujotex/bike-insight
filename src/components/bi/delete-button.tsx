"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface DeleteButtonProps {
  componentId: string;
  componentName: string;
  bikeId: string;
}

export function DeleteButton({ componentId, componentName, bikeId }: DeleteButtonProps) {
  const [step, setStep] = useState<"idle" | "confirm" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleDelete() {
    setStep("loading");
    setError(null);

    const { error: err } = await supabase
      .from("components")
      .delete()
      .eq("id", componentId);

    if (err) {
      setError("Erreur lors de la suppression.");
      setStep("confirm");
      return;
    }

    router.push(`/bikes/${bikeId}`);
    router.refresh();
  }

  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("confirm")}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          border: "1px solid var(--bi-bad)",
          background: "transparent",
          color: "var(--bi-bad)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Supprimer
      </button>
    );
  }

  if (step === "confirm") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
        <div style={{ fontSize: 13, color: "var(--bi-bad)", fontWeight: 500, textAlign: "right", maxWidth: 220 }}>
          Supprimer définitivement <strong>{componentName}</strong> ?<br />
          <span style={{ color: "var(--bi-muted)", fontWeight: 400 }}>Cette action est irréversible.</span>
        </div>
        {error && <div style={{ fontSize: 12, color: "var(--bi-bad)" }}>{error}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setStep("idle")}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--bi-line)",
              background: "transparent",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "var(--bi-bad)",
              color: "var(--bi-white)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Confirmer
          </button>
        </div>
      </div>
    );
  }

  return (
    <button disabled style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid var(--bi-line)", background: "transparent", color: "var(--bi-muted)", fontSize: 13 }}>
      Suppression…
    </button>
  );
}
