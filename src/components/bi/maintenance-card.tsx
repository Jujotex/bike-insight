"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BiCard, Mono, ProgressBar } from "@/components/bi/ui";
import { showToast } from "@/components/bi/toast";
import {
  computeMaintenanceStatus,
  formatNextDue,
  type MaintenanceDef,
  type MaintenanceLast,
} from "@/lib/maintenance-catalog";
import { findMaintenanceTuto } from "@/lib/maintenance-tutos";

// Même langage visuel que le tableau des pièces :
// barre latérale colorée, barre de progression vers l'échéance + %,
// colonnes en grille, tri par urgence.

const STATE_UI: Record<string, { label: string; color: string }> = {
  due: { label: "À faire", color: "var(--bi-bad)" },
  soon: { label: "Bientôt", color: "var(--bi-warn)" },
  ok: { label: "OK", color: "var(--bi-ok)" },
  never: { label: "Jamais enregistré", color: "var(--bi-muted)" },
};

const STATE_ORDER: Record<string, number> = { due: 0, soon: 1, ok: 2, never: 3 };


export function MaintenanceCard({
  bikeId,
  bikeKm,
  types,
  lastByType,
}: {
  bikeId: string;
  bikeKm: number;
  types: MaintenanceDef[];
  lastByType: Record<string, MaintenanceLast>;
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [cost, setCost] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const rows = types
    .map(t => {
      const last = lastByType[t.id] ?? null;
      const status = computeMaintenanceStatus(t, last, bikeKm);
      return { def: t, last, status };
    })
    .sort((a, b) => {
      const so = STATE_ORDER[a.status.state] - STATE_ORDER[b.status.state];
      if (so !== 0) return so;
      const pa = a.status.state === "never" ? 0 : a.status.pct;
      const pb = b.status.state === "never" ? 0 : b.status.pct;
      return pb - pa;
    });

  function openForm(t: MaintenanceDef) {
    setOpenId(t.id);
    setDate(new Date().toISOString().slice(0, 10));
    setCost(t.defaultCost ? String(t.defaultCost) : "");
    setError("");
  }

  async function save(t: MaintenanceDef) {
    setSaving(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Non connecté."); setSaving(false); return; }

    const { error: err } = await supabase.from("maintenance_logs").insert({
      user_id: user.id,
      bike_id: bikeId,
      component_id: null,
      maintenance_type: t.id,
      action: t.label,
      km_at_action: bikeKm,
      performed_at: date,
      cost: cost !== "" ? Number(cost) : null,
    });
    if (err) { setError("Erreur : " + err.message); setSaving(false); return; }

    setSaving(false);
    setOpenId(null);
    showToast("Entretien enregistré");
    router.refresh();
  }

  return (
    <BiCard pad={0} style={{ marginTop: 14, overflow: "hidden" }}>
      <div style={{ padding: "20px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Entretien · {rows.length}</div>
          <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>Trié par échéance</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: "28px 22px", textAlign: "center", color: "var(--bi-muted)", fontSize: 13, borderTop: "1px solid var(--bi-line)" }}>
          Aucun entretien pour ce vélo — <Link href={`/reglages/entretiens?bike=${bikeId}`} style={{ color: "var(--bi-ink)", fontWeight: 600 }}>en ajouter</Link>
        </div>
      ) : (
      <div className="bi-maint-header-row">
        <span>Entretien</span>
        <span className="bi-maint-col-last" style={{ textAlign: "right" }}>Dernier</span>
        <span>Échéance</span>
        <span className="bi-maint-col-last" style={{ textAlign: "right" }}>Depuis</span>
        <span style={{ textAlign: "right" }}></span>
      </div>
      )}

      {rows.map(({ def: t, last, status }) => {
        const ui = STATE_UI[status.state];
        const isOpen = openId === t.id;
        const lastDate = last
          ? new Date(last.performed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
          : "—";
        const lastSince = status.state === "never"
          ? "jamais"
          : status.kmSince !== null
            ? `${status.kmSince.toLocaleString("fr")} km`
            : `${status.weeksSince} sem.`;
        const nextDue = formatNextDue(status);
        const echeanceDetail = status.state === "ok"
          ? (nextDue ? `dans ${nextDue}` : ui.label)
          : ui.label;

        return (
          <div key={t.id} style={{ borderTop: "1px solid var(--bi-line)" }}>
            <div className="bi-maint-row">
              {/* Entretien — cliquable pour modifier ce type */}
              <Link
                href={`/reglages/entretiens/${t.id}?bike=${bikeId}`}
                title="Modifier cet entretien"
                style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, textDecoration: "none", color: "inherit" }}
              >
                <div style={{ width: 4, height: 28, background: ui.color, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.sub}</div>
                </div>
              </Link>

              {/* Dernier (date) */}
              <div className="bi-maint-col-last" style={{ textAlign: "right" }}>
                <Mono style={{ fontSize: 12, color: "var(--bi-muted)" }}>{lastDate}</Mono>
              </div>

              {/* Échéance : progression + % (détail au survol) */}
              {status.state === "never" ? (
                <div style={{ fontSize: 12, color: "var(--bi-muted)" }}>Jamais enregistré</div>
              ) : (
                <div title={echeanceDetail} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "default" }}>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={Math.min(status.pct / 100, 1)} color={ui.color} height={3} />
                  </div>
                  <Mono style={{ fontSize: 11, color: "var(--bi-muted)", width: 32, textAlign: "right" }}>
                    {status.pct}%
                  </Mono>
                </div>
              )}

              {/* Depuis */}
              <div className="bi-maint-col-last" style={{ textAlign: "right" }}>
                <Mono style={{ fontSize: 12, color: "var(--bi-muted)" }}>{lastSince}</Mono>
              </div>

              {/* Action — petit bouton icône (survol = intitulé) */}
              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => isOpen ? setOpenId(null) : openForm(t)}
                  title={isOpen ? "Annuler" : "Marquer comme fait"}
                  aria-label={isOpen ? "Annuler" : "Marquer comme fait"}
                  style={{
                    width: 34, height: 34, borderRadius: 999, flexShrink: 0,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontFamily: "inherit",
                    background: isOpen ? "transparent" : status.state === "due" ? "var(--bi-ink)" : "transparent",
                    color: isOpen ? "var(--bi-muted)" : status.state === "due" ? "var(--bi-bg)" : "var(--bi-ink)",
                    border: (!isOpen && status.state === "due") ? "none" : "1px solid var(--bi-line)",
                  }}
                >
                  {isOpen ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  )}
                </button>
              </div>
            </div>

            {isOpen && (
              <div style={{ padding: "0 22px 16px", display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--bi-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>Date</div>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--bi-line)", background: "var(--bi-bg)", fontSize: 13, fontFamily: "inherit", color: "var(--bi-ink)" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--bi-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>Coût (€) — optionnel</div>
                  <input
                    type="number"
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                    placeholder="0"
                    style={{ width: 120, padding: "8px 12px", borderRadius: 10, border: "1px solid var(--bi-line)", background: "var(--bi-bg)", fontSize: 13, fontFamily: "inherit", color: "var(--bi-ink)" }}
                  />
                </div>
                <button
                  onClick={() => save(t)}
                  disabled={saving || !date}
                  style={{ padding: "10px 16px", borderRadius: 10, background: "var(--bi-ok)", color: "var(--bi-white)", border: "none", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer", opacity: saving || !date ? 0.6 : 1 }}
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
                {error && <div style={{ fontSize: 12, color: "var(--bi-bad)" }}>{error}</div>}
                <div style={{ flexBasis: "100%", fontSize: 11, color: "var(--bi-muted)" }}>
                  Enregistré au kilométrage actuel du vélo (<Mono style={{ fontSize: 11 }}>{bikeKm.toLocaleString("fr")} km</Mono>).
                </div>
                {(() => { const tuto = findMaintenanceTuto(t.id); return tuto ? (
                  <a href={tuto.tutorialUrl} target="_blank" rel="noopener noreferrer" style={{ flexBasis: "100%", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "var(--bi-ink)", textDecoration: "none" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                    Voir le tuto ({tuto.tutorialSource})
                  </a>
                ) : null; })()}
              </div>
            )}
          </div>
        );
      })}
    </BiCard>
  );
}
