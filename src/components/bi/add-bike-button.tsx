"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BIKE_TYPES = [
  { value: "route", label: "Route", emoji: "🚴" },
  { value: "vtt", label: "VTT", emoji: "🚵" },
  { value: "gravel", label: "Gravel", emoji: "🚵‍♂️" },
  { value: "autre", label: "Autre", emoji: "🚲" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--bi-line)",
  background: "var(--bi-bg)",
  fontSize: 14,
  color: "var(--bi-ink)",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--bi-muted)",
  marginBottom: 7,
  display: "block",
};

export function AddBikeButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState("route");
  const [totalKm, setTotalKm] = useState("");
  const [year, setYear] = useState("");

  function reset() {
    setName(""); setBrand(""); setModel("");
    setType("route"); setTotalKm(""); setYear("");
    setError("");
  }

  function close() { setOpen(false); reset(); }

  async function handleSubmit() {
    if (!name.trim()) { setError("Le nom du vélo est requis."); return; }
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Construire le nom complet avec le type si pas de marque
    const fullName = name.trim();
    // Intégrer le type dans le nom/modèle pour la détection emoji
    const modelValue = model.trim()
      ? `${model.trim()}${type !== "route" ? ` · ${type}` : ""}`
      : type !== "route" ? type : undefined;

    const { error: insertError } = await supabase.from("bikes").insert({
      user_id:    user.id,
      name:       fullName,
      brand:      brand.trim() || null,
      model:      modelValue ?? null,
      year:       year ? parseInt(year) : null,
      total_km:   totalKm ? parseFloat(totalKm.replace(",", ".")) : 0,
      is_active:  true,
    });

    if (insertError) {
      setError("Erreur lors de l'ajout du vélo.");
      setLoading(false);
      return;
    }

    await fetch("/api/components/recalculate", { method: "POST" }).catch(() => {});
    setLoading(false);
    close();
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%", height: "100%", minHeight: 320,
          background: "transparent", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 10, padding: "40px 20px",
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--bi-card)", border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--bi-ink)" }}>Ajouter un vélo manuel</div>
        <div style={{ fontSize: 11.5, color: "var(--bi-muted)", maxWidth: 200, lineHeight: 1.45, textAlign: "center" }}>
          Pour suivre un vélo qui n&apos;apparaît pas dans ton Strava.
        </div>
      </button>
    );
  }

  return (
    <>
      {/* Trigger visible (slot reste affiché) */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%", height: "100%", minHeight: 320,
          background: "transparent", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 10, padding: "40px 20px",
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--bi-card)", border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--bi-ink)" }}>Ajouter un vélo manuel</div>
        <div style={{ fontSize: 11.5, color: "var(--bi-muted)", maxWidth: 200, lineHeight: 1.45, textAlign: "center" }}>
          Pour suivre un vélo qui n&apos;apparaît pas dans ton Strava.
        </div>
      </button>

      {/* Modal */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "var(--bi-card)", borderRadius: 20, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.2)", maxHeight: "90dvh", overflowY: "auto" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Ajouter un vélo</div>
              <div style={{ fontSize: 12.5, color: "var(--bi-muted)", marginTop: 2 }}>Sans Strava, suivi manuel</div>
            </div>
            <button onClick={close} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--bi-muted)", padding: 4 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Type */}
            <div>
              <label style={labelStyle}>Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {BIKE_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    style={{
                      padding: "10px 6px",
                      borderRadius: 10,
                      border: `1.5px solid ${type === t.value ? "var(--bi-ink)" : "var(--bi-line)"}`,
                      background: type === t.value ? "var(--bi-bg)" : "transparent",
                      cursor: "pointer", fontFamily: "inherit",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{t.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: type === t.value ? 600 : 400, color: type === t.value ? "var(--bi-ink)" : "var(--bi-muted)" }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nom */}
            <div>
              <label style={labelStyle}>Nom du vélo *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex : Canyon Aeroad, Trek Emonda…"
                style={{ ...inputStyle, border: "1.5px solid var(--bi-ink)" }}
                autoFocus
              />
            </div>

            {/* Marque + Modèle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Marque</label>
                <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Canyon" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Modèle</label>
                <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="Aeroad CF SLX" style={inputStyle} />
              </div>
            </div>

            {/* Km + Année */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Kilométrage actuel</label>
                <input
                  type="number"
                  value={totalKm}
                  onChange={e => setTotalKm(e.target.value)}
                  placeholder="0"
                  min="0"
                  style={inputStyle}
                />
                <div style={{ fontSize: 10.5, color: "var(--bi-muted)", marginTop: 5 }}>km au compteur</div>
              </div>
              <div>
                <label style={labelStyle}>Année</label>
                <input
                  type="number"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  placeholder="2023"
                  min="2000" max="2030"
                  style={inputStyle}
                />
              </div>
            </div>

          </div>

          {error && (
            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "rgba(200,54,46,0.08)", color: "var(--bi-bad)", fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button
              onClick={close}
              style={{ flex: 1, padding: "12px 0", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 12, fontSize: 13.5, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !name.trim()}
              style={{ flex: 2, padding: "12px 0", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 12, fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", cursor: loading || !name.trim() ? "not-allowed" : "pointer", opacity: !name.trim() ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {loading ? "Ajout…" : "Ajouter le vélo"}
              {!loadi