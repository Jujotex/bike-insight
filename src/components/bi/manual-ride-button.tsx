"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Bike {
  id: string;
  name: string;
}

interface Props {
  bikes: Bike[];
  defaultBikeId?: string;
}

export function ManualRideButton({ bikes, defaultBikeId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const [bikeId, setBikeId] = useState(defaultBikeId ?? bikes[0]?.id ?? "");
  const [distance, setDistance] = useState("");
  const [date, setDate] = useState(today);
  const [name, setName] = useState("");

  function reset() {
    setBikeId(defaultBikeId ?? bikes[0]?.id ?? "");
    setDistance("");
    setDate(today);
    setName("");
    setError("");
  }

  async function handleSubmit() {
    const km = parseFloat(distance);
    if (!bikeId) { setError("Sélectionne un vélo."); return; }
    if (!km || km <= 0) { setError("Distance invalide."); return; }
    if (!date) { setError("Sélectionne une date."); return; }

    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Non authentifié."); setLoading(false); return; }

    const { error: insertErr } = await supabase.from("activities").insert({
      user_id: user.id,
      bike_id: bikeId,
      name: name.trim() || "Sortie manuelle",
      distance_km: Math.round(km * 10) / 10,
      started_at: new Date(date).toISOString(),
      strava_id: null,
    });

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }

    // Recalcule l'usure des composants
    await fetch("/api/components/recalculate", { method: "POST" }).catch(() => {});

    setOpen(false);
    reset();
    setLoading(false);
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 13px",
    borderRadius: 10,
    border: "1px solid var(--bi-line)",
    background: "var(--bi-bg)",
    fontSize: 13,
    color: "var(--bi-ink)",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "var(--bi-muted)",
    marginBottom: 6,
    display: "block",
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { reset(); setOpen(true); }}
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
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Sortie manuelle
      </button>

      {/* Modal */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{
            background: "var(--bi-card)", borderRadius: 18, padding: 28,
            width: "100%", maxWidth: 400, boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Ajouter une sortie</div>
            <div style={{ fontSize: 13, color: "var(--bi-muted)", marginBottom: 22 }}>
              Saisis une sortie non enregistrée sur Strava.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Vélo */}
              {bikes.length > 1 && (
                <div>
                  <label style={labelStyle}>Vélo</label>
                  <select
                    value={bikeId}
                    onChange={e => setBikeId(e.target.value)}
                    style={{ ...inputStyle, appearance: "none" as const }}
                  >
                    {bikes.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Distance */}
              <div>
                <label style={labelStyle}>Distance (km)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="45.0"
                  value={distance}
                  onChange={e => setDistance(e.target.value)}
                  style={inputStyle}
                  autoFocus
                />
              </div>

              {/* Date */}
              <div>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  value={date}
                  max={today}
                  onChange={e => setDate(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Nom (optionnel) */}
              <div>
                <label style={labelStyle}>Nom <span style={{ fontWeight: 400, textTransform: "none" as const }}>(optionnel)</span></label>
                <input
                  type="text"
                  placeholder="Sortie du dimanche"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 14, padding: "10px 13px", borderRadius: 9, background: "rgba(200,54,46,0.08)", color: "var(--bi-bad)", fontSize: 12.5 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
              <button
                onClick={() => { setOpen(false); reset(); }}
                style={{ flex: 1, padding: "10px 14px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 13, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ flex: 2, padding: "10px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Enregistrement…" : "Ajouter la sortie"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
