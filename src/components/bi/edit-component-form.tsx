"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BiCard, BiLabel, Mono } from "@/components/bi/ui";

const LIFESPAN_OPTIONS = [
  { label: "Conservateur", factor: 0.7 },
  { label: "Recommandé",   factor: 1.0 },
  { label: "Optimiste",    factor: 1.5 },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 10,
  border: "1px solid var(--bi-line)",
  background: "var(--bi-bg)",
  fontSize: 13.5,
  fontWeight: 500,
  color: "var(--bi-ink)",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

export interface EditableComponent {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  purchase_price: number | null;
  installed_at: string | null;
  installed_km: number | null;
  km_max: number | null;
  bike_name?: string | null;
}

export function EditComponentForm({ component }: { component: EditableComponent }) {
  const router = useRouter();
  const defaultKmMax = component.km_max ?? 3000;

  const [brand, setBrand]           = useState(component.brand ?? "");
  const [price, setPrice]           = useState(component.purchase_price !== null ? String(component.purchase_price) : "");
  const [installedAt, setInstalledAt] = useState(
    component.installed_at ? component.installed_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [installedKm, setInstalledKm] = useState(String(component.installed_km ?? 0));
  const [kmMax, setKmMax]           = useState(String(defaultKmMax));
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const lifespanButtons = LIFESPAN_OPTIONS.map(o => ({
    ...o,
    km: Math.round(defaultKmMax * o.factor),
  }));

  async function handleSave() {
    setSaving(true);
    setError(null);

    const { error: err } = await supabase
      .from("components")
      .update({
        brand: brand || null,
        purchase_price: price ? parseFloat(price) : null,
        installed_at: installedAt || null,
        installed_km: parseFloat(installedKm) || 0,
        km_max: parseFloat(kmMax) || defaultKmMax,
      })
      .eq("id", component.id);

    if (err) { setError(err.message); setSaving(false); return; }

    await fetch("/api/components/recalculate", { method: "POST" }).catch(() => {});
    router.push(`/components/${component.id}`);
    router.refresh();
  }

  const priceNum    = parseFloat(price) || 0;
  const kmMaxNum    = parseFloat(kmMax) || defaultKmMax;
  const costPerKm   = priceNum > 0 && kmMaxNum > 0 ? (priceNum / kmMaxNum).toFixed(3) : null;

  return (
    <div className="bi-grid-form">
      {/* Formulaire */}
      <BiCard pad={28}>
        {/* Infos fixes */}
        <div style={{ marginBottom: 24, padding: "14px 16px", borderRadius: 10, background: "var(--bi-bg)", border: "1px solid var(--bi-line)" }}>
          <BiLabel style={{ fontSize: 10 }}>Composant</BiLabel>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{component.name}</div>
          {component.bike_name && (
            <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>{component.bike_name}</div>
          )}
        </div>

        {/* Modèle / marque */}
        <div style={{ marginBottom: 18 }}>
          <BiLabel style={{ marginBottom: 8 }}>Modèle / marque (optionnel)</BiLabel>
          <input
            style={inputStyle}
            value={brand}
            onChange={e => setBrand(e.target.value)}
            placeholder="ex. Shimano Ultegra"
          />
        </div>

        {/* Prix + Date + Km installation */}
        <div className="bi-grid-3" style={{ marginBottom: 24 }}>
          <div>
            <BiLabel style={{ marginBottom: 8 }}>Prix d&apos;achat (€)</BiLabel>
            <input
              type="number" min="0" step="0.01"
              style={inputStyle}
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="38"
            />
          </div>
          <div>
            <BiLabel style={{ marginBottom: 8 }}>Date d&apos;installation</BiLabel>
            <input
              type="date"
              style={inputStyle}
              value={installedAt}
              onChange={e => setInstalledAt(e.target.value)}
            />
          </div>
          <div>
            <BiLabel style={{ marginBottom: 8 }}>Km vélo à l&apos;installation</BiLabel>
            <input
              type="number" min="0"
              style={inputStyle}
              value={installedKm}
              onChange={e => setInstalledKm(e.target.value)}
            />
          </div>
        </div>

        {/* Durée de vie */}
        <BiLabel style={{ marginBottom: 12 }}>Durée de vie estimée</BiLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {lifespanButtons.map(l => (
            <button
              key={l.km}
              onClick={() => setKmMax(String(l.km))}
              style={{
                flex: 1, padding: "12px 14px", borderRadius: 10,
                background: kmMax === String(l.km) ? "var(--bi-ink)" : "var(--bi-card)",
                color: kmMax === String(l.km) ? "var(--bi-bg)" : "var(--bi-ink)",
                border: `1px solid ${kmMax === String(l.km) ? "var(--bi-ink)" : "var(--bi-line)"}`,
                cursor: "pointer", textAlign: "left", fontFamily: "inherit",
              }}
            >
              <Mono style={{ display: "block", fontSize: 16, fontWeight: 500 }}>
                {l.km.toLocaleString("fr")} km
              </Mono>
              <div style={{
                fontSize: 10.5,
                color: kmMax === String(l.km) ? "rgba(255,255,255,0.6)" : "var(--bi-muted)",
                marginTop: 2,
              }}>{l.label}</div>
            </button>
          ))}
        </div>

        {/* Saisie manuelle km_max */}
        <div style={{ marginBottom: 28 }}>
          <BiLabel style={{ marginBottom: 8 }}>Ou saisir manuellement (km)</BiLabel>
          <input
            type="number" min="0"
            style={inputStyle}
            value={kmMax}
            onChange={e => setKmMax(e.target.value)}
          />
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(200,54,46,0.08)", color: "var(--bi-bad)", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ paddingTop: 20, borderTop: "1px solid var(--bi-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => router.back()}
            style={{ background: "transparent", color: "var(--bi-muted)", border: "none", padding: "10px 0", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "12px 22px",
              background: saving ? "rgba(14,14,16,0.5)" : "var(--bi-ink)",
              color: "var(--bi-bg)", border: "none", borderRadius: 10,
              fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
            {!saving && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </BiCard>

      {/* Aperçu */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <BiCard pad={22} style={{ border: "1px solid var(--bi-accent)", background: "rgba(199,255,63,0.04)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--bi-muted)", marginBottom: 14 }}>
            Aperçu
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.5 }}>
            {component.name}
            {brand && <span style={{ color: "var(--bi-muted)", fontWeight: 400 }}> · {brand}</span>}
          </div>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--bi-line)", borderRadius: 10, overflow: "hidden" }}>
            {[
              ["Durée de vie", `${parseInt(kmMax).toLocaleString("fr")} km`],
              ["Coût / km",   costPerKm ? `${costPerKm} €` : "—"],
              ["Km install.", `${parseInt(installedKm).toLocaleString("fr")} km`],
              ["Prix",        price ? `${price} €` : "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "var(--bi-card)", padding: "12px 14px" }}>
                <BiLabel style={{ fontSize: 10 }}>{k}</BiLabel>
                <Mono style={{ display: "block", fontSize: 14, fontWeight: 500, marginTop: 4 }}>{v}</Mono>
              </div>
            ))}
          </div>
        </BiCard>
      </div>
    </div>
  );
}
