"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BIKE_TEMPLATES, getTemplatesForType, BIKE_TYPE_LABELS, type TemplateComponent } from "@/lib/bike-templates";

type Bike = { id: string; name: string; brand?: string; model?: string; totalKm: number; isStrava: boolean };

type ComponentRow = TemplateComponent & {
  enabled: boolean;
  installedKm: number;
  installedDate: string;
};

const STEPS = ["Vélo", "Groupe", "Freins", "Composants", "Confirmation"] as const;

const T = {
  card: "var(--bi-card)",
  bg: "var(--bi-bg)",
  ink: "var(--bi-ink)",
  muted: "var(--bi-muted)",
  line: "var(--bi-line)",
  accent: "var(--bi-accent)",
  accentInk: "var(--bi-accent-ink)",
  ok: "var(--bi-ok)",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--bi-line)",
  background: "var(--bi-bg)",
  fontSize: 13.5,
  color: "var(--bi-ink)",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
};

export function OnboardingWizard({ userId, bikes }: { userId: string; bikes: Bike[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sélections
  const [selectedBikeId, setSelectedBikeId] = useState(bikes[0]?.id ?? "");
  const [bikeType, setBikeType] = useState<"route" | "gravel" | "vtt">("route");
  const [templateId, setTemplateId] = useState("");
  const [brakeType, setBrakeType] = useState<"disc" | "rim">("disc");
  const [components, setComponents] = useState<ComponentRow[]>([]);

  const selectedBike = bikes.find(b => b.id === selectedBikeId);
  const availableTemplates = getTemplatesForType(bikeType);
  const selectedTemplate = BIKE_TEMPLATES.find(t => t.id === templateId);

  function buildComponents(tmplId: string, brake: "disc" | "rim", bikeKm: number): ComponentRow[] {
    const tmpl = BIKE_TEMPLATES.find(t => t.id === tmplId);
    if (!tmpl) return [];
    const today = new Date().toISOString().slice(0, 10);
    return tmpl.components[brake].map(c => ({
      ...c,
      enabled: true,
      installedKm: bikeKm,
      installedDate: today,
    }));
  }

  function goNext() {
    if (step === 0 && !selectedBikeId) return;
    if (step === 1) {
      if (!templateId) return;
      // Pré-charger les composants si on saute l'étape freins
    }
    if (step === 2) {
      // Génère les composants depuis le template
      setComponents(buildComponents(templateId, brakeType, selectedBike?.totalKm ?? 0));
    }
    setStep(s => s + 1);
  }

  function updateComponent(idx: number, field: keyof ComponentRow, value: unknown) {
    setComponents(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }

  async function handleConfirm() {
    const toCreate = components.filter(c => c.enabled);
    if (toCreate.length === 0) { setError("Sélectionne au moins un composant."); return; }

    setSaving(true);
    setError("");

    const rows = toCreate.map(c => ({
      user_id:        userId,
      bike_id:        selectedBikeId,
      name:           c.name,
      category:       c.category,
      brand:          c.brand || null,
      purchase_price: c.purchase_price,
      km_max:         c.km_max,
      installed_km:   c.installedKm,
      installed_at:   c.installedDate || null,
      is_active:      true,
      status:         "ok",
    }));

    const { error: insertErr } = await supabase.from("components").insert(rows);
    if (insertErr) {
      setError("Erreur lors de l'enregistrement : " + insertErr.message);
      setSaving(false);
      return;
    }

    await fetch("/api/components/recalculate", { method: "POST" }).catch(() => {});
    localStorage.setItem("bi_onboarding_done", "1");
    router.push("/dashboard");
  }

  // ── Rendu des étapes ─────────────────────────────────────────

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 16px 40px" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l4-8 4 6 4-10 4 8"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Bike Insight</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6 }}>Configure ton vélo</div>
          <div style={{ fontSize: 13.5, color: T.muted, marginTop: 6 }}>2 minutes et tout est prêt à l'utilisation</div>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= step ? T.accent : T.line, transition: "background 0.3s" }} />
          ))}
        </div>

        {/* Étape label */}
        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.accent, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
          Étape {step + 1} · {STEPS[step]}
        </div>

        {/* ── ÉTAPE 0 : Choisir le vélo ── */}
        {step === 0 && (
          <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Quel vélo tu veux configurer ?</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Tu pourras configurer les autres ensuite.</div>

            {bikes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: T.muted }}>
                <div style={{ fontSize: 13 }}>Aucun vélo trouvé. Connecte Strava d'abord.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {bikes.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBikeId(b.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "14px 16px", borderRadius: 12,
                      border: `1.5px solid ${selectedBikeId === b.id ? T.ink : T.line}`,
                      background: selectedBikeId === b.id ? "rgba(14,14,16,0.04)" : "transparent",
                      cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: T.bg, border: `1px solid ${T.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="14" viewBox="0 0 90 70" fill="none" stroke={T.ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="52" r="14"/><circle cx="72" cy="52" r="14"/>
                        <path d="M18 52L42 22L72 52"/><path d="M42 22L54 52"/><path d="M42 22L32 22"/>
                        <path d="M72 52L66 30L72 24"/><path d="M62 24L80 22"/><path d="M72 24L72 18"/>
                        <path d="M36 22L48 22"/><path d="M42 22L42 16"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</div>
                      <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>
                        {b.totalKm.toLocaleString("fr")} km · {b.isStrava ? "Strava" : "Manuel"}
                      </div>
                    </div>
                    {selectedBikeId === b.id && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Type de vélo */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Type de vélo</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(["route", "gravel", "vtt"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setBikeType(type)}
                    style={{
                      flex: "1 1 80px", padding: "11px 14px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                      border: `1.5px solid ${bikeType === type ? T.ink : T.line}`,
                      background: bikeType === type ? "rgba(14,14,16,0.04)" : "transparent",
                      fontSize: 13, fontWeight: bikeType === type ? 600 : 400,
                    }}
                  >
                    {bikeType === type ? "✓ " : ""}{BIKE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 1 : Choisir le groupe ── */}
        {step === 1 && (
          <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Quel groupe as-tu ?</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              Le groupe = l'ensemble dérailleur/manettes/freins de ton vélo. Regarde sur ta manette ou ton dérailleur.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {availableTemplates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => setTemplateId(tmpl.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "13px 16px", borderRadius: 12, cursor: "pointer",
                    fontFamily: "inherit", textAlign: "left",
                    border: `1.5px solid ${templateId === tmpl.id ? T.ink : T.line}`,
                    background: templateId === tmpl.id ? "rgba(14,14,16,0.04)" : "transparent",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{tmpl.label}</div>
                    <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{tmpl.level} · {tmpl.speeds} vitesses</div>
                  </div>
                  {templateId === tmpl.id && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
                  )}
                </button>
              ))}

              <button
                onClick={() => { setTemplateId("custom"); }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "13px 16px", borderRadius: 12, cursor: "pointer",
                  fontFamily: "inherit", textAlign: "left",
                  border: `1.5px solid ${templateId === "custom" ? T.ink : T.line}`,
                  background: templateId === "custom" ? "rgba(14,14,16,0.04)" : "transparent",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Je ne sais pas / Autre</div>
                  <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>On te propose des composants génériques</div>
                </div>
                {templateId === "custom" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 : Type de freins ── */}
        {step === 2 && (
          <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Quel type de freins ?</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              Regarde sur ton vélo : as-tu un disque métallique au centre de ta roue (frein à disque) ou des plaquettes qui frottent sur la jante (frein patins) ?
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {([
                { value: "disc", label: "Freins à disque", sub: "Disque métallique sur la roue", emoji: "💿" },
                { value: "rim", label: "Freins à patins", sub: "Patins sur la jante", emoji: "⭕" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setBrakeType(opt.value)}
                  style={{
                    padding: "18px 14px", borderRadius: 14, cursor: "pointer",
                    fontFamily: "inherit", textAlign: "center",
                    border: `1.5px solid ${brakeType === opt.value ? T.ink : T.line}`,
                    background: brakeType === opt.value ? "rgba(14,14,16,0.04)" : "transparent",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{opt.emoji}</span>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
                  <div style={{ fontSize: 11.5, color: T.muted }}>{opt.sub}</div>
                  {brakeType === opt.value && (
                    <div style={{ marginTop: 4, width: 20, height: 20, borderRadius: 999, background: T.ok, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Réviser les composants ── */}
        {step === 3 && (
          <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Vérife les composants proposés</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              Basé sur <strong style={{ color: T.ink }}>{selectedTemplate?.label ?? "ton groupe"}</strong>. Ajuste si besoin — tu pourras modifier à tout moment.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {components.map((c, idx) => (
                <div key={idx} style={{
                  borderRadius: 12,
                  border: `1px solid ${c.enabled ? T.line : "rgba(14,14,16,0.06)"}`,
                  background: c.enabled ? T.bg : "rgba(14,14,16,0.02)",
                  overflow: "hidden",
                  opacity: c.enabled ? 1 : 0.5,
                }}>
                  {/* Header composant */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
                    <button
                      onClick={() => updateComponent(idx, "enabled", !c.enabled)}
                      style={{
                        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                        border: `2px solid ${c.enabled ? T.ink : T.line}`,
                        background: c.enabled ? T.ink : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      {c.enabled && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{c.brand} · {c.km_max.toLocaleString("fr")} km max</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.muted, fontFamily: "var(--bi-font-mono)", flexShrink: 0 }}>
                      {c.purchase_price} €
                    </div>
                  </div>

                  {/* Détails éditables */}
                  {c.enabled && (
                    <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Km installé</div>
                          <input
                            type="number"
                            value={c.installedKm}
                            onChange={e => updateComponent(idx, "installedKm", Number(e.target.value))}
                            style={{ ...inputStyle, fontSize: 13 }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Prix (€)</div>
                          <input
                            type="number"
                            value={c.purchase_price}
                            onChange={e => updateComponent(idx, "purchase_price", Number(e.target.value))}
                            style={{ ...inputStyle, fontSize: 13 }}
                          />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Date d'installation</div>
                        <input
                          type="date"
                          value={c.installedDate}
                          onChange={e => updateComponent(idx, "installedDate", e.target.value)}
                          style={{ ...inputStyle, fontSize: 13 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(14,14,16,0.03)", fontSize: 12, color: T.muted }}>
              💡 Les km installés correspondent au kilométrage actuel de ton vélo ({selectedBike?.totalKm.toLocaleString("fr")} km). Ajuste si le composant a été changé avant.
            </div>
          </div>
        )}

        {/* ── ÉTAPE 4 : Confirmation ── */}
        {step === 4 && (
          <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Tout est prêt !</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              Voici ce qui va être créé pour <strong style={{ color: T.ink }}>{selectedBike?.name}</strong>.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {components.filter(c => c.enabled).map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: T.bg }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: T.muted, fontFamily: "var(--bi-font-mono)" }}>{c.purchase_price} €</span>
                </div>
              ))}
            </div>

            {error && (
              <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(200,54,46,0.08)", color: "var(--bi-bad)", fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{ flex: 1, padding: "13px 0", background: "transparent", border: `1px solid ${T.line}`, borderRadius: 12, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer", color: T.muted }}
            >
              ← Retour
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              disabled={
                (step === 0 && !selectedBikeId) ||
                (step === 1 && !templateId)
              }
              style={{
                flex: 2, padding: "13px 0",
                background: T.ink, color: T.bg, border: "none",
                borderRadius: 12, fontSize: 13.5, fontWeight: 600,
                fontFamily: "inherit", cursor: "pointer",
                opacity: ((step === 0 && !selectedBikeId) || (step === 1 && !templateId)) ? 0.4 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              Continuer
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={saving}
              style={{
                flex: 2, padding: "13px 0",
                background: "var(--bi-ok)", color: "#fff", border: "none",
                borderRadius: 12, fontSize: 13.5, fontWeight: 700,
                fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {saving ? "Création en cours…" : "Créer mes composants"}
              {!saving && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>}
            </button>
          )}
        </div>

        {/* Skip */}
        {step < 4 && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button
              onClick={() => router.push("/dashboard")}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: T.muted, fontFamily: "inherit" }}
            >
              Passer et configurer plus tard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
