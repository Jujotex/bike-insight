"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/bi/toast";

type Reason = "usure" | "crevaison" | "casse" | "anticipé";

const REASONS: { value: Reason; label: string; color: string; bg: string }[] = [
  { value: "usure",     label: "Usure normale", color: "var(--bi-muted)",       bg: "transparent" },
  { value: "crevaison", label: "Crevaison",      color: "var(--bi-warn)",        bg: "var(--bi-warn-soft)" },
  { value: "casse",     label: "Casse",          color: "var(--bi-bad)",         bg: "var(--bi-bad-soft)" },
  { value: "anticipé",  label: "Anticipé",       color: "var(--bi-accent-ink)",  bg: "var(--bi-accent)" },
];

interface Props {
  componentId: string;
  bikeId: string;
  componentName: string;
  componentCategory: string;
  currentBikeKm: number;
  componentPrice?: number | null;
  label?: string;
  fullWidth?: boolean;
  variant?: "default" | "accent";
  // Données du nouveau composant (depuis le comparateur)
  // Si présentes → création automatique sans passer par /components/new
  newComponentName?: string;
  newComponentBrand?: string;
  newComponentKmMax?: number;
}

export function ReplaceButton({
  componentId,
  bikeId,
  componentName,
  componentCategory,
  currentBikeKm,
  componentPrice,
  label,
  fullWidth,
  variant = "default",
  newComponentName,
  newComponentBrand,
  newComponentKmMax,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "reason" | "confirm">("idle");
  const [reason, setReason] = useState<Reason>("usure");

  async function handleReplace() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error: archiveErr } = await supabase
      .from("components")
      .update({ status: "archived", is_active: false })
      .eq("id", componentId);

    if (archiveErr) { setLoading(false); return; }

    await supabase.from("maintenance_logs").insert({
      component_id: componentId,
      user_id:      user.id,
      action:       "Remplacement",
      km_at_action: currentBikeKm,
      cost:         componentPrice ?? null,
      performed_at: new Date().toISOString().slice(0, 10),
      reason,
    });

    // Si les données du nouveau composant sont fournies → création automatique
    if (newComponentName && newComponentKmMax) {
      const { data: newComp } = await supabase.from("components").insert({
        user_id:        user.id,
        bike_id:        bikeId,
        name:           newComponentName,
        brand:          newComponentBrand ?? null,
        category:       componentCategory,
        purchase_price: componentPrice ?? null,
        km_max:         newComponentKmMax,
        installed_km:   Math.round(currentBikeKm),
        installed_at:   new Date().toISOString().slice(0, 10),
        is_active:      true,
        status:         "ok",
      }).select("id").single();

      await fetch("/api/components/recalculate", { method: "POST" }).catch(() => {});

      showToast("Pièce remplacée — le suivi repart de zéro");
      if (newComp?.id) {
        router.push(`/components/${newComp.id}`);
      } else {
        router.push(`/bikes`);
      }
      router.refresh();
      return;
    }

    // Sinon → on enchaîne directement sur l'ajout du remplaçant (formulaire pré-rempli)
    await fetch("/api/components/recalculate", { method: "POST" }).catch(() => {});

    const params = new URLSearchParams({
      bike_id:      bikeId,
      type:         componentName.split(" · ")[0],
      category:     componentCategory,
      installed_km: String(Math.round(currentBikeKm)),
    });

    showToast("Ancienne pièce archivée — ajoute la nouvelle");
    router.push(`/components/new?${params.toString()}`);
    router.refresh();
  }

  // ── Step 1: choose reason ──────────────────────────────────────
  if (step === "reason") {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20
      }}>
        <div style={{
          background: "var(--bi-card)", borderRadius: 18, padding: 28,
          width: "100%", maxWidth: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.18)"
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Remplacer ce composant</div>
          <div style={{ fontSize: 13, color: "var(--bi-muted)", marginBottom: 20 }}>
            Pourquoi remplacez-vous ce composant ?
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 14px",
                  background: reason === r.value ? r.bg : "transparent",
                  border: `1.5px solid ${reason === r.value ? r.color : "var(--bi-line)"}`,
                  borderRadius: 10, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: `2px solid ${r.color}`,
                  background: reason === r.value ? r.color : "transparent",
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 13,
                  fontWeight: reason === r.value ? 600 : 400,
                  color: reason === r.value ? r.color : "var(--bi-ink)",
                }}>
                  {r.label}
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setStep("idle")}
              style={{ flex: 1, padding: "10px 14px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 13, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}
            >
              Annuler
            </button>
            <button
              onClick={() => setStep("confirm")}
              style={{ flex: 2, padding: "10px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
            >
              Continuer →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: confirm ────────────────────────────────────────────
  if (step === "confirm") {
    const selected = REASONS.find((r) => r.value === reason)!;
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20
      }}>
        <div style={{
          background: "var(--bi-card)", borderRadius: 18, padding: 28,
          width: "100%", maxWidth: 380, boxShadow: "0 8px 40px rgba(0,0,0,0.18)"
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Confirmer le remplacement</div>
          <div style={{ fontSize: 13, color: "var(--bi-muted)", marginBottom: 20 }}>
            Le composant sera archivé et un log de maintenance sera enregistré.
          </div>

          <div style={{ padding: "12px 14px", background: "var(--bi-bg)", borderRadius: 10, marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "var(--bi-muted)" }}>Raison</div>
            <div style={{
              marginLeft: "auto", fontSize: 12, fontWeight: 600, color: selected.color,
              padding: "3px 10px", border: `1px solid ${selected.color}`,
              borderRadius: 999, background: selected.bg,
            }}>
              {selected.label}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setStep("reason")}
              style={{ flex: 1, padding: "10px 14px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 13, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}
            >
              ← Retour
            </button>
            <button
              onClick={handleReplace}
              disabled={loading}
              style={{ flex: 2, padding: "10px 16px", background: "var(--bi-bad)", color: "var(--bi-white)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "…" : "Confirmer le remplacement"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Idle ───────────────────────────────────────────────────────
  const isAccent = variant === "accent";
  const btnLabel = label ?? "Remplacer";
  return (
    <button
      onClick={() => setStep("reason")}
      style={{
        padding: label ? "13px 0" : "10px 16px",
        width: fullWidth ? "100%" : undefined,
        background: isAccent ? "var(--bi-accent)" : "transparent",
        color: isAccent ? "var(--bi-accent-ink)" : "var(--bi-ink)",
        border: isAccent ? "none" : "1px solid var(--bi-line)",
        borderRadius: 10,
        fontSize: 13, fontWeight: 600, fontFamily: "inherit",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}
    >
      {!label && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>
      )}
      {btnLabel}
      {label && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      )}
    </button>
  );
}
