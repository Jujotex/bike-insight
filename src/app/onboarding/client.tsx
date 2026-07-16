"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BIKE_TEMPLATES, getTemplatesForType, BIKE_TYPE_LABELS, OPTIONAL_COMPONENTS, type TemplateComponent } from "@/lib/bike-templates";
import { getCatalogForTemplate, TIER_LABELS, type CatalogEntry } from "@/lib/components-catalog";
import { matchBikeModel } from "@/lib/bike-models";

type Bike = {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  totalKm: number;
  isStrava: boolean;
  isConfigured: boolean;
};

type ComponentRow = TemplateComponent & {
  enabled: boolean;
  optional?: boolean;
};

// État initial des pièces — une seule question globale au lieu de km/date par pièce
type WearState = "new" | "original" | "unknown";

const STEPS = ["Vélo & groupe", "Pièces", "Confirmation"] as const;

const WEAR_OPTIONS: { value: WearState; label: string; sub: string }[] = [
  { value: "new", label: "Neuves", sub: "Posées récemment — usure zéro" },
  { value: "original", label: "D'origine du vélo", sub: "Jamais changées depuis l'achat" },
  { value: "unknown", label: "Je ne sais pas", sub: "On part sur une usure moyenne (50 %), tu pourras affiner" },
];

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
  fontSize: 13,
  color: "var(--bi-ink)",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
};

const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--bi-muted)",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  marginBottom: 10,
};

export function OnboardingWizard({
  userId,
  bikes,
  preselectedBikeId,
}: {
  userId: string;
  bikes: Bike[];
  preselectedBikeId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"wizard" | "done">("wizard");

  const [selectedBikeId, setSelectedBikeId] = useState(
    preselectedBikeId ?? bikes.find(b => !b.isConfigured)?.id ?? bikes[0]?.id ?? ""
  );
  const [bikeType, setBikeType] = useState<"route" | "gravel" | "vtt">("route");
  const [templateId, setTemplateId] = useState("");
  const [brakeType, setBrakeType] = useState<"disc" | "rim">("disc");
  const [wearState, setWearState] = useState<WearState | null>(null);
  const [components, setComponents] = useState<ComponentRow[]>([]);
  const [swappingIdx, setSwappingIdx] = useState<number | null>(null);
  const [modelHint, setModelHint] = useState("");

  const selectedBike = bikes.find(b => b.id === selectedBikeId);
  const availableTemplates = getTemplatesForType(bikeType);
  const selectedTemplate = BIKE_TEMPLATES.find(t => t.id === templateId);
  const showBikePicker = !preselectedBikeId && bikes.filter(b => !b.isConfigured).length > 1;

  // Pré-remplissage automatique d'après le modèle du vélo (base bike-models)
  useEffect(() => {
    const b = bikes.find(x => x.id === selectedBikeId);
    if (!b) return;
    const m = matchBikeModel(`${b.brand ?? ""} ${b.model ?? ""} ${b.name}`);
    if (m && !templateId) {
      setBikeType(m.bikeType);
      setTemplateId(m.templateId);
      setBrakeType(m.brakeType);
      setModelHint(m.label);
    } else if (!m) {
      setModelHint("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBikeId]);

  function buildComponents(tmplId: string, brake: "disc" | "rim"): ComponentRow[] {
    const tmpl = BIKE_TEMPLATES.find(t => t.id === tmplId);
    if (!tmpl) return [];
    return [
      ...tmpl.components[brake].map(c => ({ ...c, enabled: true })),
      // Pièces à usure lente (plateaux, roulements, ...) — décochées par défaut
      ...OPTIONAL_COMPONENTS.map(c => ({ ...c, enabled: false, optional: true })),
    ];
  }

  // Traduit la réponse globale "état des pièces" en km d'installation par pièce
  function computeInstall(c: ComponentRow): { installedKm: number; installedDate: string | null } {
    const bikeKm = selectedBike?.totalKm ?? 0;
    if (wearState === "new") {
      return { installedKm: bikeKm, installedDate: new Date().toISOString().slice(0, 10) };
    }
    if (wearState === "original") {
      return { installedKm: 0, installedDate: null };
    }
    // unknown → usure moyenne : la pièce a déjà consommé ~50% de sa vie
    return { installedKm: Math.max(0, bikeKm - Math.round(c.km_max / 2)), installedDate: null };
  }

  function initialWearPct(c: ComponentRow): number {
    const bikeKm = selectedBike?.totalKm ?? 0;
    const { installedKm } = computeInstall(c);
    if (c.km_max <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round(((bikeKm - installedKm) / c.km_max) * 100)));
  }

  function goNext() {
    if (step === 0) setComponents(buildComponents(templateId, brakeType));
    setStep(s => s + 1);
    setSwappingIdx(null);
  }

  function updateComponent(idx: number, field: keyof ComponentRow, value: unknown) {
    setComponents(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }

  async function handleConfirm() {
    const toCreate = components.filter(c => c.enabled);
    if (toCreate.length === 0) { setError("Sélectionne au moins une pièce."); return; }
    setSaving(true);
    setError("");

    const rows = toCreate.map(c => {
      const { installedKm, installedDate } = computeInstall(c);
      return {
        user_id: userId, bike_id: selectedBikeId, name: c.name,
        category: c.category, brand: c.brand || null,
        purchase_price: c.purchase_price, km_max: c.km_max,
        installed_km: installedKm, installed_at: installedDate,
        is_active: true, status: "ok",
      };
    });

    const { error: insertErr } = await supabase.from("components").insert(rows);
    if (insertErr) { setError("Erreur : " + insertErr.message); setSaving(false); return; }

    // Save groupset template on bike
    if (templateId && templateId !== "custom") {
      await supabase.from("bikes").update({ groupset_template_id: templateId }).eq("id", selectedBikeId).eq("user_id", userId);
    }

    await fetch("/api/components/recalculate", { method: "POST" }).catch(() => {});
    setSaving(false);
    setPhase("done");
  }

  // ── Écran de succès ──────────────────────────────────────
  if (phase === "done") {
    // On ne pousse plus à configurer les autres vélos à la chaîne :
    // le dashboard d'abord, les autres vélos se configurent depuis Mes vélos.
    const remaining = bikes.filter(b => !b.isConfigured && b.id !== selectedBikeId);

    return (
      <div style={{ minHeight: "100dvh", background: T.bg, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 16px" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{selectedBike?.name} est configuré !</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 8, lineHeight: 1.55 }}>
              L&apos;usure de tes pièces évolue maintenant automatiquement avec tes sorties Strava.
              {remaining.length > 0 && (
                <> Tu pourras configurer {remaining.length > 1 ? `tes ${remaining.length} autres vélos` : "ton autre vélo"} plus tard depuis Mes vélos.</>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            style={{ width: "100%", padding: "14px 0", background: T.ink, color: T.bg, border: "none", borderRadius: 14, fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
          >
            Accéder au dashboard →
          </button>

          {remaining.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button
                onClick={() => router.push("/bikes")}
                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: T.muted, fontFamily: "inherit" }}
              >
                Configurer un autre vélo maintenant
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Wizard ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", background: T.bg, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 16px 40px" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l4-8 4 6 4-10 4 8"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Bike Insight</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6 }}>Configure ton vélo</div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>3 étapes, 2 minutes</div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= step ? T.accent : T.line, transition: "background 0.3s" }} />
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
          Étape {step + 1} · {STEPS[step]}
        </div>

        {/* ÉTAPE 0 — Vélo & groupe */}
        {step === 0 && (
          <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 28 }}>

            {showBikePicker ? (
              <div style={{ marginBottom: 24 }}>
                <div style={sectionLabel}>Quel vélo ?</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {bikes.map(b => (
                    <button key={b.id} onClick={() => !b.isConfigured && setSelectedBikeId(b.id)} disabled={b.isConfigured}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${selectedBikeId === b.id ? T.ink : T.line}`, background: b.isConfigured ? "rgba(14,14,16,0.02)" : selectedBikeId === b.id ? "rgba(14,14,16,0.04)" : "transparent", cursor: b.isConfigured ? "default" : "pointer", textAlign: "left", fontFamily: "inherit", opacity: b.isConfigured ? 0.6 : 1 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{b.name}</div>
                        <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>{b.totalKm.toLocaleString("fr")} km · {b.isStrava ? "Strava" : "Manuel"}</div>
                      </div>
                      {b.isConfigured
                        ? <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: "var(--bi-ok-soft)", color: "var(--bi-ok)", fontWeight: 600 }}>Configuré</span>
                        : selectedBikeId === b.id
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
                          : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 18 }}>
                Vélo : <strong style={{ color: T.ink }}>{selectedBike?.name}</strong> · {selectedBike?.totalKm.toLocaleString("fr")} km
              </div>
            )}

            {modelHint && (
              <div style={{ marginBottom: 18, padding: "10px 14px", borderRadius: 10, background: "var(--bi-accent-soft)", border: "1px solid rgba(199,255,63,0.35)", fontSize: 13, color: T.ink }}>
                Pré-rempli d&apos;après ton vélo (<strong>{modelHint}</strong>) — vérifie que ça correspond à ta monte réelle.
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <div style={sectionLabel}>Type de vélo</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(["route", "gravel", "vtt"] as const).map(type => (
                  <button key={type} onClick={() => { setBikeType(type); setTemplateId(""); }}
                    style={{ flex: "1 1 80px", padding: "10px 14px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", border: `1.5px solid ${bikeType === type ? T.ink : T.line}`, background: bikeType === type ? "rgba(14,14,16,0.04)" : "transparent", fontSize: 13, fontWeight: bikeType === type ? 600 : 400 }}>
                    {bikeType === type ? "✓ " : ""}{BIKE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={sectionLabel}>Quel groupe as-tu ? <span style={{ textTransform: "none", fontWeight: 400 }}>(regarde sur ta manette ou ton dérailleur)</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {availableTemplates.map(tmpl => (
                  <button key={tmpl.id} onClick={() => setTemplateId(tmpl.id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 14, cursor: "pointer", fontFamily: "inherit", textAlign: "left", border: `1.5px solid ${templateId === tmpl.id ? T.ink : T.line}`, background: templateId === tmpl.id ? "rgba(14,14,16,0.04)" : "transparent" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{tmpl.label}</div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>{tmpl.level} · {tmpl.speeds} vitesses</div>
                    </div>
                    {templateId === tmpl.id && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>}
                  </button>
                ))}
                <button onClick={() => setTemplateId("custom")}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 14, cursor: "pointer", fontFamily: "inherit", textAlign: "left", border: `1.5px solid ${templateId === "custom" ? T.ink : T.line}`, background: templateId === "custom" ? "rgba(14,14,16,0.04)" : "transparent" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Je ne sais pas / Autre</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>Pièces génériques proposées</div>
                  </div>
                  {templateId === "custom" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>}
                </button>
              </div>
            </div>

            <div>
              <div style={sectionLabel}>Type de freins</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {([{ value: "disc", label: "Disque", sub: "Métal au centre de la roue" }, { value: "rim", label: "Patins", sub: "Caoutchouc sur la jante" }] as const).map(opt => (
                  <button key={opt.value} onClick={() => setBrakeType(opt.value)}
                    style={{ padding: "12px 14px", borderRadius: 14, cursor: "pointer", fontFamily: "inherit", textAlign: "left", border: `1.5px solid ${brakeType === opt.value ? T.ink : T.line}`, background: brakeType === opt.value ? "rgba(14,14,16,0.04)" : "transparent", display: "flex", alignItems: "center", gap: 10 }}>
                    {brakeType === opt.value && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="3" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M4 12l5 5L20 7"/></svg>}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{opt.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 1 — Pièces */}
        {step === 1 && (
          <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 28 }}>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>Vélo : <strong style={{ color: T.ink }}>{selectedBike?.name}</strong></div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Ces pièces sont-elles neuves ?</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>Une seule question pour calibrer l&apos;usure de départ — pas de saisie de km.</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {WEAR_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setWearState(opt.value)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 14, cursor: "pointer", fontFamily: "inherit", textAlign: "left", border: `1.5px solid ${wearState === opt.value ? T.ink : T.line}`, background: wearState === opt.value ? "rgba(14,14,16,0.04)" : "transparent" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>{opt.sub}</div>
                  </div>
                  {wearState === opt.value && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>}
                </button>
              ))}
            </div>

            <div style={sectionLabel}>Pièces suivies <span style={{ textTransform: "none", fontWeight: 400 }}>— basées sur {selectedTemplate?.label ?? "ton groupe"}</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {components.map((c, idx) => {
                const catalogEntry: CatalogEntry | null = (selectedTemplate && selectedTemplate.id !== "custom")
                  ? getCatalogForTemplate(c.name, c.category, selectedTemplate.brand, selectedTemplate.speeds, selectedTemplate.bikeTypes, selectedTemplate.id)
                  : null;
                const isFirstOptional = !!c.optional && (idx === 0 || !components[idx - 1].optional);
                return (
                  <Fragment key={idx}>
                  {isFirstOptional && (
                    <div style={{ ...sectionLabel, marginTop: 10, marginBottom: 0 }}>
                      Optionnel <span style={{ textTransform: "none", fontWeight: 400 }}>— pièces à usure lente, coche ce que tu veux suivre</span>
                    </div>
                  )}
                  <div style={{ borderRadius: 14, border: `1px solid ${c.enabled ? T.line : "rgba(14,14,16,0.06)"}`, background: c.enabled ? T.bg : "rgba(14,14,16,0.02)", overflow: "hidden", opacity: c.enabled ? 1 : 0.5 }}>
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
                      <button onClick={() => { updateComponent(idx, "enabled", !c.enabled); if (!c.enabled) setSwappingIdx(null); }}
                        style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `2px solid ${c.enabled ? T.ink : T.line}`, background: c.enabled ? T.ink : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        {c.enabled && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bi-white)" strokeWidth="3.5" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{c.brand} · {c.km_max.toLocaleString("fr")} km · {c.purchase_price} €</div>
                      </div>
                      {c.enabled && (
                        <button
                          onClick={() => setSwappingIdx(swappingIdx === idx ? null : idx)}
                          style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, border: `1px solid ${swappingIdx === idx ? T.ink : T.line}`, background: swappingIdx === idx ? T.ink : "transparent", color: swappingIdx === idx ? T.bg : T.muted, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, flexShrink: 0 }}
                        >
                          {swappingIdx === idx ? "Fermer" : "Modifier"}
                        </button>
                      )}
                    </div>

                    {/* Panel Modifier */}
                    {c.enabled && swappingIdx === idx && (
                      <div style={{ borderTop: `1px solid ${T.line}`, padding: "14px 14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

                        {/* Alternatives catalogue */}
                        {catalogEntry && (
                          <div>
                            <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                              Suggestions compatibles
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {catalogEntry.products.map((p, pi) => {
                                const isActive = c.name === p.name;
                                return (
                                  <button key={pi} onClick={() => {
                                    updateComponent(idx, "name", p.name);
                                    updateComponent(idx, "brand", p.brand);
                                    updateComponent(idx, "purchase_price", p.price);
                                    updateComponent(idx, "km_max", p.lifeKm);
                                  }} style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    width: "100%", padding: "10px 12px", borderRadius: 10,
                                    border: `1.5px solid ${isActive ? T.ink : T.line}`,
                                    background: isActive ? "rgba(14,14,16,0.04)" : "transparent",
                                    cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                                  }}>
                                    {isActive && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{p.name}</div>
                                      <div style={{ fontSize: 11, color: T.muted }}>{p.brand} · {p.lifeKm.toLocaleString("fr")} km · {p.note}</div>
                                    </div>
                                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--bi-font-mono)" }}>{p.price} €</div>
                                      <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase" as const, letterSpacing: 0.4 }}>{TIER_LABELS[p.tier]}</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Separateur */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 1, background: T.line }} />
                          <span style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" }}>Personnaliser</span>
                          <div style={{ flex: 1, height: 1, background: T.line }} />
                        </div>

                        {/* Champs libres */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 11, color: T.muted, marginBottom: 5, fontWeight: 600, textTransform: "uppercase" }}>Nom</div>
                            <input value={c.name} onChange={e => updateComponent(idx, "name", e.target.value)} style={{ ...inputStyle, fontSize: 13 }} placeholder="ex. Shimano HG601" />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: T.muted, marginBottom: 5, fontWeight: 600, textTransform: "uppercase" }}>Marque</div>
                            <input value={c.brand} onChange={e => updateComponent(idx, "brand", e.target.value)} style={{ ...inputStyle, fontSize: 13 }} placeholder="ex. Shimano" />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <div>
                            <div style={{ fontSize: 11, color: T.muted, marginBottom: 5, fontWeight: 600, textTransform: "uppercase" }}>Prix (€)</div>
                            <input type="number" value={c.purchase_price} onChange={e => updateComponent(idx, "purchase_price", Number(e.target.value))} style={{ ...inputStyle, fontSize: 13 }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: T.muted, marginBottom: 5, fontWeight: 600, textTransform: "uppercase" }}>Km max</div>
                            <input type="number" value={c.km_max} onChange={e => updateComponent(idx, "km_max", Number(e.target.value))} style={{ ...inputStyle, fontSize: 13 }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  </Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ÉTAPE 2 — Confirmation */}
        {step === 2 && (
          <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 28 }}>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>Vélo : <strong style={{ color: T.ink }}>{selectedBike?.name}</strong></div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Tout est prêt !</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              {components.filter(c => c.enabled).length} pièce{components.filter(c => c.enabled).length > 1 ? "s" : ""} suivie{components.filter(c => c.enabled).length > 1 ? "s" : ""} — l&apos;usure évoluera automatiquement avec tes sorties Strava.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {components.filter(c => c.enabled).map((c, i) => {
                const wear = initialWearPct(c);
                const wearColor = wear >= 80 ? "var(--bi-bad)" : wear >= 50 ? "var(--bi-warn)" : "var(--bi-ok)";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: T.bg }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: wearColor, fontWeight: 600 }}>usure {wear} %</span>
                    <span style={{ fontSize: 12, color: T.muted, fontFamily: "var(--bi-font-mono)" }}>{c.purchase_price} €</span>
                  </div>
                );
              })}
            </div>
            {error && <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "var(--bi-bad-soft)", color: "var(--bi-bad)", fontSize: 13 }}>{error}</div>}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ flex: 1, padding: "13px 0", background: "transparent", border: `1px solid ${T.line}`, borderRadius: 14, fontSize: 13, fontFamily: "inherit", cursor: "pointer", color: T.muted }}>
              ← Retour
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={goNext}
              disabled={(step === 0 && (!selectedBikeId || !templateId)) || (step === 1 && !wearState)}
              style={{ flex: 2, padding: "13px 0", background: T.ink, color: T.bg, border: "none", borderRadius: 14, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", opacity: ((step === 0 && (!selectedBikeId || !templateId)) || (step === 1 && !wearState)) ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              Continuer
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          ) : (
            <button onClick={handleConfirm} disabled={saving}
              style={{ flex: 2, padding: "13px 0", background: "var(--bi-ok)", color: "var(--bi-white)", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {saving ? "Création en cours…" : "Démarrer le suivi"}
              {!saving && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>}
            </button>
          )}
        </div>

        {step < STEPS.length - 1 && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button onClick={() => router.push("/dashboard")}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: T.muted, fontFamily: "inherit" }}>
              Passer et configurer plus tard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
