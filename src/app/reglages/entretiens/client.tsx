"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BiCard } from "@/components/bi/ui";
import { showToast } from "@/components/bi/toast";

export type MaintenanceTypeRow = {
  id: string;
  bike_id: string;
  slug: string;
  label: string;
  sub: string | null;
  interval_km: number | null;
  interval_months: number | null;
  default_cost: number | null;
  sort_order: number;
};

type Bike = { id: string; name: string };

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--bi-line)",
  background: "var(--bi-bg)",
  fontSize: 13.5,
  color: "var(--bi-ink)",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--bi-muted)",
  marginBottom: 6,
  display: "block",
};

export function MaintenanceSettingsClient({
  userId,
  bikes,
  types,
  initialBikeId,
}: {
  userId: string;
  bikes: Bike[];
  types: MaintenanceTypeRow[];
  initialBikeId: string;
}) {
  const router = useRouter();
  const [bikeId, setBikeId] = useState(initialBikeId);
  const [editing, setEditing] = useState<string | null>(null); // id d'un type, ou "new"

  // Champs du formulaire
  const [fLabel, setFLabel] = useState("");
  const [fSub, setFSub] = useState("");
  const [fKm, setFKm] = useState("");
  const [fMonths, setFMonths] = useState("");
  const [fCost, setFCost] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const bikeTypes = types.filter((t) => t.bike_id === bikeId);

  function openNew() {
    setEditing("new");
    setFLabel(""); setFSub(""); setFKm(""); setFMonths(""); setFCost("");
    setError("");
  }
  function openEdit(t: MaintenanceTypeRow) {
    setEditing(t.id);
    setFLabel(t.label);
    setFSub(t.sub ?? "");
    setFKm(t.interval_km?.toString() ?? "");
    setFMonths(t.interval_months?.toString() ?? "");
    setFCost(t.default_cost?.toString() ?? "");
    setError("");
  }
  function cancel() {
    setEditing(null);
    setError("");
  }

  async function save() {
    if (!fLabel.trim()) { setError("Le nom est requis."); return; }
    if (!fKm && !fMonths) { setError("Renseigne au moins une échéance (km ou mois)."); return; }
    setSaving(true);
    setError("");

    const payload = {
      label: fLabel.trim(),
      sub: fSub.trim() || null,
      interval_km: fKm ? Math.round(parseFloat(fKm.replace(",", "."))) : null,
      interval_months: fMonths ? Math.round(parseFloat(fMonths.replace(",", "."))) : null,
      default_cost: fCost ? parseFloat(fCost.replace(",", ".")) : null,
    };

    if (editing === "new") {
      const slug = `custom-${crypto.randomUUID().slice(0, 8)}`;
      const maxSort = bikeTypes.reduce((m, t) => Math.max(m, t.sort_order), 100);
      const { error: e } = await supabase.from("maintenance_types").insert({
        user_id: userId,
        bike_id: bikeId,
        slug,
        sort_order: maxSort + 10,
        ...payload,
      });
      if (e) { setError(e.message); setSaving(false); return; }
      showToast("Entretien ajouté");
    } else if (editing) {
      const { error: e } = await supabase
        .from("maintenance_types")
        .update(payload)
        .eq("id", editing);
      if (e) { setError(e.message); setSaving(false); return; }
      showToast("Entretien mis à jour");
    }

    setSaving(false);
    setEditing(null);
    router.refresh();
  }

  async function remove(t: MaintenanceTypeRow) {
    if (!confirm(`Supprimer « ${t.label} » ? L'historique déjà enregistré est conservé.`)) return;
    const { error: e } = await supabase.from("maintenance_types").delete().eq("id", t.id);
    if (e) { showToast("Erreur : " + e.message); return; }
    showToast("Entretien supprimé");
    router.refresh();
  }

  if (bikes.length === 0) {
    return (
      <BiCard pad={28} style={{ textAlign: "center", color: "var(--bi-muted)", fontSize: 13.5 }}>
        Ajoute d&apos;abord un vélo pour configurer ses entretiens.
      </BiCard>
    );
  }

  const form = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "4px 2px" }}>
      <div>
        <label style={labelStyle}>Nom de l&apos;entretien *</label>
        <input
          type="text"
          value={fLabel}
          onChange={(e) => setFLabel(e.target.value)}
          placeholder="Ex : Lubrifier la chaîne"
          style={{ ...inputStyle, border: "1.5px solid var(--bi-ink)" }}
          autoFocus
        />
      </div>
      <div>
        <label style={labelStyle}>Description (optionnel)</label>
        <input
          type="text"
          value={fSub}
          onChange={(e) => setFSub(e.target.value)}
          placeholder="Ex : Plus souvent sous la pluie ou en hiver"
          style={inputStyle}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Échéance (km)</label>
          <input type="number" min="1" value={fKm} onChange={(e) => setFKm(e.target.value)} placeholder="250" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Échéance (mois)</label>
          <input type="number" min="1" value={fMonths} onChange={(e) => setFMonths(e.target.value)} placeholder="1" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Coût indicatif (€)</label>
          <input type="number" min="0" value={fCost} onChange={(e) => setFCost(e.target.value)} placeholder="—" style={inputStyle} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--bi-muted)" }}>
        La première échéance atteinte (km ou temps) déclenche l&apos;entretien. Renseigne au moins l&apos;une des deux.
      </div>
      {error && <div style={{ fontSize: 12.5, color: "var(--bi-bad)" }}>{error}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={cancel}
          style={{ padding: "9px 16px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 13, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}
        >
          Annuler
        </button>
        <button
          onClick={save}
          disabled={saving || !fLabel.trim()}
          style={{ padding: "9px 18px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer", opacity: !fLabel.trim() ? 0.5 : 1 }}
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Sélecteur de vélo */}
      {bikes.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {bikes.map((b) => {
            const on = b.id === bikeId;
            return (
              <button
                key={b.id}
                onClick={() => { setBikeId(b.id); setEditing(null); }}
                style={{
                  padding: "8px 14px", borderRadius: 999, fontSize: 13, fontFamily: "inherit", cursor: "pointer",
                  border: `1.5px solid ${on ? "var(--bi-ink)" : "var(--bi-line)"}`,
                  background: on ? "var(--bi-ink)" : "transparent",
                  color: on ? "var(--bi-bg)" : "var(--bi-ink)",
                  fontWeight: on ? 600 : 500,
                }}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      )}

      <BiCard pad={0} style={{ overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {bikeTypes.length} entretien{bikeTypes.length !== 1 ? "s" : ""}
          </div>
          {editing !== "new" && (
            <button
              onClick={openNew}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Ajouter
            </button>
          )}
        </div>

        {editing === "new" && (
          <div style={{ padding: "4px 20px 20px", borderTop: "1px solid var(--bi-line)" }}>{form}</div>
        )}

        {bikeTypes.length === 0 && editing !== "new" && (
          <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--bi-muted)", fontSize: 13, borderTop: "1px solid var(--bi-line)" }}>
            Aucun entretien pour ce vélo. Clique sur « Ajouter » pour en créer un.
          </div>
        )}

        {bikeTypes.map((t) => (
          <div key={t.id} style={{ borderTop: "1px solid var(--bi-line)" }}>
            {editing === t.id ? (
              <div style={{ padding: "16px 20px" }}>{form}</div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.label}</div>
                  {t.sub && <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 1 }}>{t.sub}</div>}
                  <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                    {t.interval_km !== null && (
                      <span style={badgeStyle}>{t.interval_km.toLocaleString("fr")} km</span>
                    )}
                    {t.interval_months !== null && (
                      <span style={badgeStyle}>{t.interval_months} mois</span>
                    )}
                    {t.default_cost !== null && (
                      <span style={badgeStyle}>{t.default_cost} €</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(t)}
                    style={{ padding: "7px 13px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 999, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-ink)" }}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => remove(t)}
                    style={{ padding: "7px 13px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 999, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-bad)" }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </BiCard>
    </>
  );
}

const badgeStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 600,
  padding: "2px 8px",
  borderRadius: 999,
  background: "var(--bi-bg)",
  border: "1px solid var(--bi-line)",
  color: "var(--bi-muted)",
  fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace",
};
