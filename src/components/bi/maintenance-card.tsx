"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BiCard, Mono, ProgressBar } from "@/components/bi/ui";
import { showToast } from "@/components/bi/toast";
import {
  MAINTENANCE_TYPES,
  computeMaintenanceStatus,
  type MaintenanceDef,
  type MaintenanceLast,
} from "@/lib/maintenance-catalog";

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

function nextDueLabel(dueInKm: number | null, dueInWeeks: number | null): string {
  const parts: string[] = [];
  if (dueInKm !== null) parts.push(`~${dueInKm.toLocaleString("fr")} km`);
  if (dueInWeeks !== null) parts.push(dueInWeeks >= 5 ? `${Math.round(dueInWeeks / 4)} mois` : `${dueInWeeks} sem.`);
  return parts.length > 0 ? `dans ${parts.join(" ou ")}` : "";
}

export function MaintenanceCard({
  bikeId,
  bikeKm,
  isVtt,
  hasRimBrakes,
  lastByType,
}: {
  bikeId: string;
  bikeKm: number;
  isVtt: boolean;
  hasRimBrakes: boolean;
  lastByType: Record<string, MaintenanceLast>;
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [cost, setCost] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const rows = MAINTENANCE_TYPES
    .filter(t => (!t.vttOnly || isVtt) && (!t.discOnly || !hasRimBrakes))
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
      <div style={{ padding: "20px 22px 12px" }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Entretien · {rows.length}</div>
        <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>Trié par échéance — enregistre en un clic, on suit le reste</div>
      </div>

      {/* En-têtes de colonnes, comme le tableau des pièces */}
      <div className="bi-maint-header-row">
        <span>Entretien</span>
        <span className="bi-maint-col-last">Dernier</span>
        <span>Échéance</span>
        <span style={{ textAlign: "right" }}></span>
      </div>

      {rows.map(({ def: t, last, status }) => {
        const ui = STATE_UI[status.state];
        const isOpen = openId === t.id;
        const lastDate = last
          ? new Date(last.performed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
          : "—";
        const lastSub = status.state === "never"
          ? "jamais"
          : status.kmSince !== null
            ? `il y a ${status.kmSince.toLocaleString("fr")} km`
            : `il y a ${status.weeksSince} sem.`;

        return (
          <div key={t.id} style={{ borderTop: "1px solid var(--bi-line)" }}>
            <div className="bi-maint-row">
              {/* Entretien */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ width: 4, height: 28, background: ui.color, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.sub}</div>
                </div>
              </div>

              {/* Dernier */}
              <div className="bi-maint-col-last">
                <Mono style={{ fontSize: 11.5, color: "var(--bi-muted)", display: "block" }}>{lastDate}</Mono>
                <span style={{ fontSize: 10.5, color: "var(--bi-muted)" }}>{lastSub}</span>
              </div>

              {/* Échéance : progression + % */}
              {status.state === "never" ? (
                <div style={{ fontSize: 11.5, color: "var(--bi-muted)" }}>Jamais enregistré</div>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <ProgressBar value={Math.min(status.pct / 100, 1)} color={ui.color} height={3} />
                    </div>
                    <Mono style={{ fontSize: 11, color: "var(--bi-muted)", width: 32, textAlign: "right" }}>
                      {status.pct}%
                    </Mono>
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: ui.color, marginTop: 4 }}>
                    {status.state === "ok"
                      ? nextDueLabel(status.dueInKm, status.dueInWeeks)
                      : ui.label}
                  </div>
                </div>
              )}

              {/* Action */}
              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => isOpen ? setOpenId(null) : openForm(t)}
                  style={{
                    padding: "7px 13px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                    fontFamily: "inherit", cursor: "pointer",
                    background: isOpen ? "transparent" : status.state === "due" ? "var(--bi-ink)" : "transparent",
                    color: isOpen ? "var(--bi-muted)" : status.state === "due" ? "var(--bi-bg)" : "var(--bi-ink)",
                    border: isOpen ? "1px solid var(--bi-line)" : status.state === "due" ? "none" : "1px solid var(--bi-line)",
                  }}
                >
                  {isOpen ? "Annuler" : "Fait ✓"}
                </button>
              </div>
            </div>

            {isOpen && (
              <div style={{ padding: "0 22px 16px", display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--bi-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>Date</div>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid var(--bi-line)", background: "var(--bi-bg)", fontSize: 13, fontFamily: "inherit", color: "var(--bi-ink)" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: "var(--bi-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>Coût (€) — optionnel</div>
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
                  style={{ padding: "9px 18px", borderRadius: 10, background: "var(--bi-ok)", color: "#fff", border: "none", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer", opacity: saving || !date ? 0.6 : 1 }}
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
                {error && <div style={{ fontSize: 12, color: "var(--bi-bad)" }}>{error}</div>}
                <div style={{ flexBasis: "100%", fontSize: 11, color: "var(--bi-muted)" }}>
                  Enregistré au kilométrage actuel du vélo (<Mono style={{ fontSize: 11 }}>{bikeKm.toLocaleString("fr")} km</Mono>).
                </div>
              </div>
            )}
          </div>
        );
      })}
    </BiCard>
  );
}
