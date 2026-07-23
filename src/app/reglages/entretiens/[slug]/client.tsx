"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BiCard, BiLabel, Mono } from "@/components/bi/ui";
import { showToast } from "@/components/bi/toast";
import { findMaintenanceTuto } from "@/lib/maintenance-tutos";
import { DIFFICULTY_LABELS, DIFFICULTY_LEVEL, DIFFICULTY_COLOR, formatRepairTime } from "@/lib/repair-guides";

export type EditType = {
  id: string;
  bike_id: string;
  slug: string;
  label: string;
  sub: string | null;
  interval_km: number | null;
  interval_months: number | null;
  default_cost: number | null;
} | null;

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
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--bi-muted)",
  marginBottom: 6,
  display: "block",
};

export function MaintenanceEditClient({
  userId,
  bikeId,
  type,
}: {
  userId: string;
  bikeId: string;
  type: EditType;
}) {
  const router = useRouter();
  const isNew = !type;

  const [fLabel, setFLabel] = useState(type?.label ?? "");
  const [fSub, setFSub] = useState(type?.sub ?? "");
  const [fKm, setFKm] = useState(type?.interval_km?.toString() ?? "");
  const [fMonths, setFMonths] = useState(type?.interval_months?.toString() ?? "");
  const [fCost, setFCost] = useState(type?.default_cost?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const backHref = `/reglages/entretiens?bike=${bikeId}`;
  const tuto = type ? findMaintenanceTuto(type.slug) : null;

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

    if (isNew) {
      const { data: last } = await supabase
        .from("maintenance_types")
        .select("sort_order")
        .eq("bike_id", bikeId)
        .order("sort_order", { ascending: false })
        .limit(1);
      const maxSort = (last?.[0]?.sort_order as number) ?? 100;
      const slug = `custom-${crypto.randomUUID().slice(0, 8)}`;
      const { error: e } = await supabase.from("maintenance_types").insert({
        user_id: userId,
        bike_id: bikeId,
        slug,
        sort_order: maxSort + 10,
        ...payload,
      });
      if (e) { setError(e.message); setSaving(false); return; }
      showToast("Entretien ajouté");
    } else {
      const { error: e } = await supabase
        .from("maintenance_types")
        .update(payload)
        .eq("id", type!.id);
      if (e) { setError(e.message); setSaving(false); return; }
      showToast("Entretien mis à jour");
    }

    router.push(backHref);
    router.refresh();
  }

  async function remove() {
    if (!type) return;
    if (!confirm(`Supprimer « ${type.label} » ? L'historique déjà enregistré est conservé.`)) return;
    const { error: e } = await supabase.from("maintenance_types").delete().eq("id", type.id);
    if (e) { showToast("Erreur : " + e.message); return; }
    showToast("Entretien supprimé");
    router.push(backHref);
    router.refresh();
  }

  return (
    <>
    <BiCard pad={24} style={{ maxWidth: 620 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Nom de l&apos;entretien *</label>
          <input
            type="text"
            value={fLabel}
            onChange={(e) => setFLabel(e.target.value)}
            placeholder="Ex : Lubrifier la chaîne"
            style={{ ...inputStyle, border: "1.5px solid var(--bi-ink)" }}
            autoFocus={isNew}
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
        <div style={{ fontSize: 11, color: "var(--bi-muted)", lineHeight: 1.5 }}>
          La première échéance atteinte (km ou temps) déclenche l&apos;entretien. Renseigne au moins l&apos;une des deux.
        </div>
        {error && <div style={{ fontSize: 13, color: "var(--bi-bad)" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, paddingTop: 6, borderTop: "1px solid var(--bi-line)", marginTop: 2 }}>
          {!isNew ? (
            <button
              onClick={remove}
              style={{ padding: "10px 14px", background: "transparent", border: "none", borderRadius: 10, fontSize: 13, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-bad)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H6a1 1 0 01-1-1V6" /><path d="M10 11v6M14 11v6" /></svg>
              Supprimer
            </button>
          ) : <span />}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { router.push(backHref); }}
              style={{ padding: "10px 16px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 13, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}
            >
              Annuler
            </button>
            <button
              onClick={save}
              disabled={saving || !fLabel.trim()}
              style={{ padding: "10px 18px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer", opacity: !fLabel.trim() ? 0.5 : 1 }}
            >
              {saving ? "Enregistrement…" : isNew ? "Créer l'entretien" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </BiCard>

    {tuto && (
      <BiCard pad={22} style={{ maxWidth: 620, marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <BiLabel>Comment le faire</BiLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ display: "flex", gap: 2 }}>
                  {[1, 2, 3].map((n) => (
                    <span key={n} style={{ width: 12, height: 4, borderRadius: 2, background: n <= DIFFICULTY_LEVEL[tuto.difficulty] ? DIFFICULTY_COLOR[tuto.difficulty] : "var(--bi-line)" }} />
                  ))}
                </span>
                <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>{DIFFICULTY_LABELS[tuto.difficulty]}</span>
              </span>
              {tuto.timeMax > 0 && (
                <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>Soi-même : <Mono style={{ fontSize: 12 }}>{formatRepairTime(tuto.timeMin, tuto.timeMax)}</Mono></span>
              )}
              {tuto.shopOnly && (
                <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>Plutôt en atelier</span>
              )}
            </div>
          </div>
          <a
            href={tuto.tutorialUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
            Voir le tuto ({tuto.tutorialSource})
          </a>
        </div>
      </BiCard>
    )}
    </>
  );
}
