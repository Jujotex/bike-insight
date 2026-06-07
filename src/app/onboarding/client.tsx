"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BIKE_TEMPLATES, getTemplatesForType, BIKE_TYPE_LABELS, type TemplateComponent } from "@/lib/bike-templates";
import { getCatalogForTemplate, TIER_LABELS, type CatalogEntry } from "@/lib/components-catalog";

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
  const [step, setStep] = useState(preselectedBikeId ? 1 : 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"wizard" | "next-bike">("wizard");

  const [skippedBikeIds, setSkippedBikeIds] = useState<Set<string>>(new Set());
  const [configuredThisSession, setConfiguredThisSession] = useState<string[]>([]);

  const [selectedBikeId, setSelectedBikeId] = useState(
    preselectedBikeId ?? bikes.find(b => !b.isConfigured)?.id ?? bikes[0]?.id ?? ""
  );
  const [bikeType, setBikeType] = useState<"route" | "gravel" | "vtt">("route");
  const [templateId, setTemplateId] = useState("");
  const [brakeType, setBrakeType] = useState<"disc" | "rim">("disc");
  const [components, setComponents] = useState<ComponentRow[]>([]);
  const [swappingIdx, setSwappingIdx] = useState<number | null>(null);

  const selectedBike = bikes.find(b => b.id === selectedBikeId);
  const availableTemplates = getTemplatesForType(bikeType);
  const selectedTemplate = BIKE_TEMPLATES.find(t => t.id === templateId);

  function buildComponents(tmplId: string, brake: "disc" | "rim", bikeKm: number): ComponentRow[] {
    const tmpl = BIKE_TEMPLATES.find(t => t.id === tmplId);
    if (!tmpl) return [];
    const today = new Date().toISOString().slice(0, 10);
    return tmpl.components[brake].map(c => ({
      ...c, enabled: true, installedKm: bikeKm, installedDate: today,
    }));
  }

  function goNext() {
    if (step === 2) setComponents(buildComponents(templateId, brakeType, selectedBike?.totalKm ?? 0));
    setStep(s => s + 1);
  }

  function updateComponent(idx: number, field: keyof ComponentRow, value: unknown) {
    setComponents(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }

  function resetForNextBike(bikeId: string) {
    setSelectedBikeId(bikeId);
    setBikeType("route");
    setTemplateId("");
    setBrakeType("disc");
    setComponents([]);
    setError("");
    setStep(1);
    setPhase("wizard");
  }

  async function handleConfirm() {
    const toCreate = components.filter(c => c.enabled);
    if (toCreate.length === 0) { setError("Sélectionne au moins un composant."); return; }
    setSaving(true);
    setError("");

    const rows = toCreate.map(c => ({
      user_id: userId, bike_id: selectedBikeId, name: c.name,
      category: c.category, brand: c.brand || null,
      purchase_price: c.purchase_price, km_max: c.km_max,
      installed_km: c.installedKm, installed_at: c.installedDate || null,
      is_active: true, status: "ok",
    }));

    const { error: insertErr } = await supabase.from("components").insert(rows);
    if (insertErr) { setError("Erreur : " + insertErr.message); setSaving(false); return; }

    // Save groupset template on bike
    if (templateId && templateId !== "custom") {
      await supabase.from("bikes").update({ groupset_template_id: templateId }).eq("id", selectedBikeId).eq("user_id", userId);
    }

    await fetch("/api/components/recalculate", { method: "POST" }).catch(() => {});
    const newConfigured = [...configuredThisSession, selectedBikeId];
    setConfiguredThisSession(newConfigured);
    setSaving(false);

    const remaining = bikes.filter(b =>
      !b.isConfigured && !skippedBikeIds.has(b.id) &&
      b.id !== selectedBikeId && !newConfigured.includes(b.id)
    );

    if (remaining.length > 0) {
      setPhase("next-bike");
    } else {
      localStorage.setItem("bi_onboarding_done", "1");
      router.push("/dashboard");
    }
  }

  // ── Écran "vélo suivant" ──────────────────────────────────────
  if (phase === "next-bike") {
    const remaining = bikes.filter(b =>
      !b.isConfigured && !skippedBikeIds.has(b.id) && !configuredThisSession.includes(b.id)
    );
    const totalConfigured = configuredThisSession.length + bikes.filter(b => b.isConfigured).length;

    return (
      <div style={{ minHeight: "100dvh", background: T.bg, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ width: "100%", maxWidth: 560 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{selectedBike?.name} est configuré !</div>
            <div style={{ fontSize: 13.5, color: T.muted, marginTop: 6 }}>
              {totalConfigured} vélo{totalConfigured > 1 ? "s" : ""} configuré{totalConfigured > 1 ? "s" : ""} au total
            </div>
          </div>

          {remaining.length > 0 && (
            <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 24, marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Tu as encore {remaining.length} vélo{remaining.length > 1 ? "s" : ""} à configurer</div>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 18 }}>Tu peux le faire maintenant ou plus tard depuis la page Mes Vélos.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {remaining.map(b => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: T.bg, border: `1px solid ${T.line}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{b.name}</div>
                      <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{b.totalKm.toLocaleString("fr")} km</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => setSkippedBikeIds(prev => new Set([...prev, b.id]))}
                        style={{ fontSize: 12, color: T.muted, background: "transparent", border: `1px solid ${T.line}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Passer
                      </button>
                      <button
                        onClick={() => resetForNextBike(b.id)}
                        style={{ fontSize: 12, color: T.bg, fontWeight: 600, background: T.ink, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Configurer →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => { localStorage.setItem("bi_onboarding_done", "1"); router.push("/dashboard"); }}
            style={{ width: "100%", padding: "13px 0", background: remaining.length > 0 ? "transparent" : T.ink, color: remaining.length > 0 ? T.muted : T.bg, border: `1px solid ${T.line}`, borderRadius: 12, fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
          >
            {remaining.length > 0 ? "Terminer et aller au dashboard" : "Accéder au dashboard →"}
          </button>
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
            <div style={{ width: 32, height: 32, borderRadius: 9, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l4-8 4 6 4-10 4 8"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Bike Insight</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.6 }}>Configure ton vélo</div>
          <div style={{ fontSize: 13.5, color: T.muted, marginTop: 6 }}>2 minutes et tout est prêt</div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= step ? T.accent : T.line, transition: "background 0.3s" }} />
          ))}
        </div>

        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.accent, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
          Étape {step + 1} · {STEPS[step]}
        </div>

        {/* ÉTAPE 0 */}
        {step === 0 && (
          <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Quel vélo tu veux configurer ?</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Tu pourras configurer les autres ensuite.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bikes.map(b => (
                <button key={b.id} onClick={() => !b.isConfigured && setSelectedBikeId(b.id)} disabled={b.isConfigured}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${selectedBikeId === b.id ? T.ink : T.line}`, background: b.isConfigured ? "rgba(14,14,16,0.02)" : selectedBikeId === b.id ? "rgba(14,14,16,0.04)" : "transparent", cursor: b.isConfigured ? "default" : "pointer", textAlign: "left", fontFamily: "inherit", opacity: b.isConfigured ? 0.6 : 1 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{b.name}</div>
                    <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{b.totalKm.toLocaleString("fr")} km · {b.isStrava ? "Strava" : "Manuel"}</div>
                  </div>
                  {b.isConfigured
                    ? <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: "rgba(14,143,90,0.1)", color: "var(--bi-ok)", fontWeight: 600 }}>Configuré</span>
                    : selectedBikeId === b.id
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
                      : null}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Type de vélo</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(["route", "gravel", "vtt"] as const).map(type => (
                  <button key={type} onClick={() => setBikeType(type)}
                    style={{ flex: "1 1 80px", padding: "11px 14px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", border: `1.5px solid ${bikeType === type ? T.ink : T.line}`, background: bikeType === type ? "rgba(14,14,16,0.04)" : "transparent", fontSize: 13, fontWeight: bikeType === type ? 600 : 400 }}>
                    {bikeType === type ? "✓ " : ""}{BIKE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ÉTAPE 1 */}
        {step === 1 && (
          <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 28 }}>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>Vélo : <strong style={{ color: T.ink }}>{selectedBike?.name}</strong></div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Quel groupe as-tu ?</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Regarde sur ta manette ou ton dérailleur.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {availableTemplates.map(tmpl => (
                <button key={tmpl.id} onClick={() => setTemplateId(tmpl.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left", border: `1.5px solid ${templateId === tmpl.id ? T.ink : T.line}`, background: templateId === tmpl.id ? "rgba(14,14,16,0.04)" : "transparent" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{tmpl.label}</div>
                    <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{tmpl.level} · {tmpl.speeds} vitesses</div>
                  </div>
                  {templateId === tmpl.id && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>}
                </button>
              ))}
              <button onClick={() => setTemplateId("custom")}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left", border: `1.5px solid ${templateId === "custom" ? T.ink : T.line}`, background: templateId === "custom" ? "rgba(14,14,16,0.04)" : "transparent" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Je ne sais pas / Autre</div>
                  <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>Composants génériques proposés</div>
                </div>
                {templateId === "custom" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.ok} strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>}
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 */}
        {step === 2 && (
          <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 28 }}>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>Vélo : <strong style={{ color: T.ink }}>{selectedBike?.name}</strong></div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Quel type de freins ?</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Disque = métal au centre de la roue. Patins = caoutchouc sur la jante.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {([{ value: "disc", label: "Freins à disque", sub: "Disque sur la roue", emoji: "💿" }, { value: "rim", label: "Freins à patins", sub: "Patins sur la jante", emoji: "⭕" }] as const).map(opt => (
                <button key={opt.value} onClick={() => setBrakeType(opt.value)}
                  style={{ padding: "18px 14px", borderRadius: 14, cursor: "pointer", fontFamily: "inherit", textAlign: "center", border: `1.5px solid ${brakeType === opt.value ? T.ink : T.line}`, background: brakeType === opt.value ? "rgba(14,14,16,0.04)" : "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 28 }}>{opt.emoji}</span>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</div>
                  <div style={{ fontSize: 11.5, color: T.muted }}>{opt.sub}</div>
                  {brakeType === opt.value && <div style={{ width: 20, height: 20, borderRadius: 999, background: T.ok, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg></div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 3 */}
        {step === 3 && (
          <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 28 }}>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>Vélo : <strong style={{ color: T.ink }}>{selectedBike?.name}</strong></div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Vérifie les composants</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>Basé sur <strong style={{ color: T.ink }}>{selectedTemplate?.label ?? "ton groupe"}</strong>.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {components.map((c, idx) => (
                <div key={idx} style={{ borderRadius: 12, border: `1px solid ${c.enabled ? T.line : "rgba(14,14,16,0.06)"}`, background: c.enabled ? T.bg : "rgba(14,14,16,0.02)", overflow: "hidden", opacity: c.enabled ? 1 : 0.5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
                    <button onClick={() => updateComponent(idx, "enabled", !c.enabled)}
                      style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, border: `2px solid ${c.enabled ? T.ink : T.line}`, background: c.enabled ? T.ink : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      {c.enabled && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{c.brand} · {c.km_max.toLocaleString("fr")} km max</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: T.muted, fontFamily: "var(--bi-font-mono)" }}>{c.purchase_price} €</div>
                      {c.enabled && selectedTemplate && selectedTemplate.id !== "custom" && (() => {
                        const entry: CatalogEntry | null = getCatalogForTemplate(c.name, c.category, selectedTemplate.brand, selectedTemplate.speeds);
                        if (!entry) return null;
                        return (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSwappingIdx(swappingIdx === idx ? null : idx); }}
                            style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, border: `1px solid ${swappingIdx === idx ? T.ink : T.line}`, background: swappingIdx === idx ? T.ink : "transparent", color: swappingIdx === idx ? T.bg : T.muted, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
                          >
                            Changer
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                  {c.enabled && swappingIdx === idx && selectedTemplate && (() => {
                    const entry: CatalogEntry | null = getCatalogForTemplate(c.name, c.category, selectedTemplate.brand, selectedTemplate.speeds);
                    if (!entry) return null;
                    return (
                      <div style={{ padding: "0 14px 12px" }}>
                        <div style={{ fontSize: 10.5, color: T.muted, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                          Alternatives compatibles
                        </div>
                        {entry.products.map((p, pi) => (
                          <button key={pi} onClick={() => {
                            updateComponent(idx, "name", p.name);
                            updateComponent(idx, "brand", p.brand);
                            updateComponent(idx, "purchase_price", p.price);
                            updateComponent(idx, "km_max", p.lifeKm);
                            setSwappingIdx(null);
                          }} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            width: "100%", padding: "10px 12px", borderRadius: 10,
                            border: `1.5px solid ${T.line}`,
                            background: "transparent",
                            cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                            marginBottom: pi < entry.products.length - 1 ? 6 : 0,
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: T.muted }}>{p.brand} · {p.lifeKm.toLocaleString("fr")} km</div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--bi-font-mono)" }}>{p.price} €</div>
                              <div style={{ fontSize: 9.5, color: T.muted, textTransform: "uppercase" as const, letterSpacing: 0.4 }}>{TIER_LABELS[p.tier]}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                  {c.enabled && (
                    <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 5, fontWeight: 600, textTransform: "uppercase" }}>Km installé</div>
                          <input type="number" value={c.installedKm} onChange={e => updateComponent(idx, "installedKm", Number(e.target.value))} style={{ ...inputStyle, fontSize: 13 }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 5, fontWeight: 600, textTransform: "uppercase" }}>Prix (€)</div>
                          <input type="number" value={c.purchase_price} onChange={e => updateComponent(idx, "purchase_price", Number(e.target.value))} style={{ ...inputStyle, fontSize: 13 }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10.5, color: T.muted, marginBottom: 5, fontWeight: 600, textTransform: "uppercase" }}>Date d&apos;installation</div>
                        <input type="date" value={c.installedDate} onChange={e => updateComponent(idx, "installedDate", e.target.value)} style={{ ...inputStyle, fontSize: 13 }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(14,14,16,0.03)", fontSize: 12, color: T.muted }}>
              💡 Km installé = kilométrage actuel de ton vélo ({selectedBike?.totalKm.toLocaleString("fr")} km)
            </div>
          </div>
        )}

        {/* ÉTAPE 4 */}
        {step === 4 && (
          <div style={{ background: T.card, borderRadius: 18, border: `1px solid ${T.line}`, padding: 28 }}>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>Vélo : <strong style={{ color: T.ink }}>{selectedBike?.name}</strong></div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Tout est prêt !</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>{components.filter(c => c.enabled).length} composant{components.filter(c => c.enabled).length > 1 ? "s" : ""} vont être créés.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {components.filter(c => c.enabled).map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: T.bg }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: T.muted, fontFamily: "var(--bi-font-mono)" }}>{c.purchase_price} €</span>
                </div>
              ))}
            </div>
            {error && <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(200,54,46,0.08)", color: "var(--bi-bad)", fontSize: 13 }}>{error}</div>}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ flex: 1, padding: "13px 0", background: "transparent", border: `1px solid ${T.line}`, borderRadius: 12, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer", color: T.muted }}>
              ← Retour
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={goNext}
              disabled={(step === 0 && !selectedBikeId) || (step === 1 && !templateId)}
              style={{ flex: 2, padding: "13px 0", background: T.ink, color: T.bg, border: "none", borderRadius: 12, fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", opacity: ((step === 0 && !selectedBikeId) || (step === 1 && !templateId)) ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              Continuer
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          ) : (
            <button onClick={handleConfirm} disabled={saving}
              style={{ flex: 2, padding: "13px 0", background: "var(--bi-ok)", color: "#fff", border: "none", borderRadius: 12, fontSize: 13.5, fontWeight: 700, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {saving ? "Création en cours…" : "Créer mes composants"}
              {!saving && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>}
            </button>
          )}
        </div>

        {step < 4 && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <button onClick={() => { localStorage.setItem("bi_onboarding_done", "1"); router.push("/dashboard"); }}
              style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 12, color: T.muted, fontFamily: "inherit" }}>
              Passer et configurer plus tard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
