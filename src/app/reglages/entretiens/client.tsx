"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BiCard, Mono } from "@/components/bi/ui";
import { showToast } from "@/components/bi/toast";

// Badge compact (visible seulement sur mobile, quand les colonnes se replient)
const mtBadge: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  padding: "3px 8px",
  borderRadius: 999,
  background: "var(--bi-bg)",
  border: "1px solid var(--bi-line)",
  color: "var(--bi-muted)",
  fontFamily: "var(--bi-font-mono)",
};

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
  fontSize: 13,
  color: "var(--bi-ink)",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
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
  initialEditSlug = null,
}: {
  userId: string;
  bikes: Bike[];
  types: MaintenanceTypeRow[];
  initialBikeId: string;
  initialEditSlug?: string | null;
}) {
  const router = useRouter();
  const [bikeId, setBikeId] = useState(initialBikeId);

  // Ouverture directe en édition si on arrive via un lien ?edit=<slug>
  const initialType = initialEditSlug
    ? types.find((t) => t.bike_id === initialBikeId && t.slug === initialEditSlug) ?? null
    : null;

  const [editing, setEditing] = useState<string | null>(initialType?.id ?? null); // id d'un type, ou "new"

  // Champs du formulaire
  const [fLabel, setFLabel] = useState(initialType?.label ?? "");
  const [fSub, setFSub] = useState(initialType?.sub ?? "");
  const [fKm, setFKm] = useState(initialType?.interval_km?.toString() ?? "");
  const [fMonths, setFMonths] = useState(initialType?.interval_months?.toString() ?? "");
  const [fCost, setFCost] = useState(initialType?.default_cost?.toString() ?? "");
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
      <BiCard pad={28} style={{ textAlign: "center", color: "var(--bi-muted)", fontSize: 13 }}>
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
      {error && <div style={{ fontSize: 13, color: "var(--bi-bad)" }}>{error}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={cancel}
          style={{ padding: "10px 16px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 13, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}
        >
          Annuler
        </button>
        <button
          onClick={save}
          disabled={saving || !fLabel.trim()}
          style={{ padding: "10px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer", opacity: !fLabel.trim() ? 0.5 : 1 }}
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
        {/* Sous-en-tête + Ajouter (comme la page Composants) */}
        <div style={{ padding: "20px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderBottom: "1px solid var(--bi-line)" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Entretiens</div>
            <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>
              {bikeTypes.length} entretien{bikeTypes.length !== 1 ? "s" : ""} · clique une ligne pour la modifier
            </div>
          </div>
          {editing !== "new" && (
            <button
              onClick={openNew}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Ajouter
            </button>
          )}
        </div>

        {/* Formulaire d'ajout */}
        {editing === "new" && (
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--bi-line)" }}>{form}</div>
        )}

        {/* Empty state */}
        {bikeTypes.length === 0 && editing !== "new" && (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--bi-muted)", fontSize: 13 }}>
            Aucun entretien pour ce vélo. Clique sur « Ajouter » pour en créer un.
          </div>
        )}

        {/* Tableau */}
        {bikeTypes.length > 0 && (
          <>
            {/* En-têtes de colonnes */}
            <div className="bi-mt-row" style={{ padding: "8px 22px", fontSize: 11, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--bi-line)" }}>
              <span>Entretien</span>
              <span className="bi-mt-num" style={{ textAlign: "right" }}>Échéance km</span>
              <span className="bi-mt-num" style={{ textAlign: "right" }}>Échéance temps</span>
              <span className="bi-mt-num" style={{ textAlign: "right" }}>Coût</span>
              <span />
            </div>

            {bikeTypes.map((t) => (
              editing === t.id ? (
                <div key={t.id} style={{ padding: "16px 20px", borderBottom: "1px solid var(--bi-line)" }}>{form}</div>
              ) : (
                <div
                  key={t.id}
                  className="bi-component-row bi-mt-row"
                  onClick={() => openEdit(t)}
                  style={{ padding: "14px 22px", alignItems: "center", borderBottom: "1px solid var(--bi-line)", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ width: 4, height: 28, background: "var(--bi-muted)", borderRadius: 2, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                      {t.sub && <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.sub}</div>}
                      {/* Détails repliés en badges sur mobile */}
                      <div className="bi-mt-badges">
                        {t.interval_km !== null && <span style={mtBadge}>{t.interval_km.toLocaleString("fr")} km</span>}
                        {t.interval_months !== null && <span style={mtBadge}>{t.interval_months} mois</span>}
                        {t.default_cost !== null && <span style={mtBadge}>{t.default_cost} €</span>}
                      </div>
                    </div>
                  </div>
                  <div className="bi-mt-num" style={{ textAlign: "right" }}>
                    <Mono style={{ fontSize: 12, color: t.interval_km !== null ? "var(--bi-ink)" : "var(--bi-muted)" }}>
                      {t.interval_km !== null ? `${t.interval_km.toLocaleString("fr")} km` : "—"}
                    </Mono>
                  </div>
                  <div className="bi-mt-num" style={{ textAlign: "right" }}>
                    <Mono style={{ fontSize: 12, color: t.interval_months !== null ? "var(--bi-ink)" : "var(--bi-muted)" }}>
                      {t.interval_months !== null ? `${t.interval_months} mois` : "—"}
                    </Mono>
                  </div>
                  <div className="bi-mt-num" style={{ textAlign: "right" }}>
                    <Mono style={{ fontSize: 12, fontWeight: 500, color: t.default_cost !== null ? "var(--bi-ink)" : "var(--bi-muted)" }}>
                      {t.default_cost !== null ? `${t.default_cost} €` : "—"}
                    </Mono>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(t); }}
                    title="Supprimer"
                    style={{ justifySelf: "end", padding: 6, background: "transparent", border: "none", cursor: "pointer", color: "var(--bi-muted)", display: "flex", alignItems: "center" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H6a1 1 0 01-1-1V6" /><path d="M10 11v6M14 11v6" /></svg>
                  </button>
                </div>
              )
            ))}
          </>
        )}
      </BiCard>
    </>
  );
}
