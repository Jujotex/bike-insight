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
      <BiCard pad={0} style={{ maxWidth: 620, marginTop: 14, overflow: "hidden" }}>
        <a href={tuto.tutorialUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", color: "var(--bi-ink)" }}>
          {/* En-tête lime */}
          <div style={{ padding: "18px 22px", background: "var(--bi-accent)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--bi-ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bi-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--bi-accent-ink)" }}>Comment le faire</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 3, color: "var(--bi-accent-ink)" }}>{type?.label}</div>
              </div>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, flexShrink: 0, color: "var(--bi-white)", background: "var(--bi-ink)", padding: "10px 16px", borderRadius: 999 }}>
              Voir le tuto
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
            </div>
          </div>
          {/* Arbitrage : temps (soi-même) vs coût (vélociste) */}
          <div className="bi-grid-2" style={{ gap: 1, background: "var(--bi-line)", borderTop: "1px solid var(--bi-line)" }}>
            <div style={{ background: "var(--bi-card)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
              <BiLabel style={{ fontSize: 10 }}>Je le fais moi-même</BiLabel>
              <Mono style={{ fontSize: 16, fontWeight: 500 }}>{tuto.timeMax > 0 ? formatRepairTime(tuto.timeMin, tuto.timeMax) : "En atelier"}</Mono>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 3 }}>
                  {[1, 2, 3].map((n) => (
                    <div key={n} style={{ width: 16, height: 5, borderRadius: 999, background: n <= DIFFICULTY_LEVEL[tuto.difficulty] ? DIFFICULTY_COLOR[tuto.difficulty] : "var(--bi-line)" }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>{DIFFICULTY_LABELS[tuto.difficulty]}</span>
              </div>
            </div>
            <div style={{ background: "var(--bi-card)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
              <BiLabel style={{ fontSize: 10 }}>Je passe chez le vélociste</BiLabel>
              <Mono style={{ fontSize: 16, fontWeight: 500 }}>{type?.default_cost != null ? `${type?.default_cost} €` : "—"}</Mono>
              <div style={{ fontSize: 12, color: "var(--bi-muted)" }}>{type?.default_cost != null ? "Coût indicatif, hors pièces" : "Généralement fait soi-même"}</div>
            </div>
          </div>
        </a>
      </BiCard>
    )}
    </>
  );
}
