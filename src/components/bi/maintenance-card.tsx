"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BiCard, Mono } from "@/components/bi/ui";
import {
  MAINTENANCE_TYPES,
  computeMaintenanceStatus,
  type MaintenanceDef,
  type MaintenanceLast,
} from "@/lib/maintenance-catalog";

const STATE_UI: Record<string, { label: string; color: string }> = {
  due: { label: "À faire", color: "var(--bi-bad)" },
  soon: { label: "Bientôt", color: "var(--bi-warn)" },
  ok: { label: "OK", color: "var(--bi-ok)" },
  never: { label: "Jamais enregistré", color: "var(--bi-muted)" },
};

function nextDueLabel(def: MaintenanceDef, dueInKm: number | null, dueInWeeks: number | null): string {
  const parts: string[] = [];
  if (dueInKm !== null) parts.push(`~${dueInKm.toLocaleString("fr")} km`);
  if (dueInWeeks !== null) parts.push(dueInWeeks >= 5 ? `${Math.round(dueInWeeks / 4)} mois` : `${dueInWeeks} sem.`);
  return parts.length > 0 ? `prochaine dans ${parts.join(" ou ")}` : "";
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

  const types = MAINTENANCE_TYPES.filter(t =>
    (!t.vttOnly || isVtt) && (!t.discOnly || !hasRimBrakes)
  );

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
    router.refresh();
  }

  return (
    <BiCard pad={0} style={{ marginTop: 14 }}>
      <div style={{ padding: "18px 22px 12px", borderBottom: "1px solid var(--bi-line)" }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Entretien courant</div>
        <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>
          Lubrification, purge, révision — enregistre en un clic, on suit les échéances pour toi.
        </div>
      </div>

      {types.map((t, i) => {
        const last = lastByType[t.id] ?? null;
        const status = computeMaintenanceStatus(t, last, bikeKm);
        const ui = STATE_UI[status.state];
        const isOpen = openId === t.id;

        return (
          <div key={t.id} style={{ borderTop: i > 0 ? "1px solid var(--bi-line)" : "none" }}>
            <div style={{ padding: "13px 22px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: ui.color, flexShrink: 0, display: "inline-block" }} />
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 1 }}>{t.sub}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: ui.color }}>{ui.label}</div>
                <div style={{ fontSize: 10.5, color: "var(--bi-muted)", marginTop: 1 }}>
                  {status.state === "never"
                    ? "—"
                    : status.state === "ok"
                      ? nextDueLabel(t, status.dueInKm, status.dueInWeeks)
                      : status.kmSince !== null
                        ? `il y a ${status.kmSince.toLocaleString("fr")} km`
                        : `il y a ${status.weeksSince} sem.`}
                </div>
              </div>
              <button
                onClick={() => isOpen ? setOpenId(null) : openForm(t)}
                style={{
                  padding: "7px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                  fontFamily: "inherit", cursor: "pointer", flexShrink: 0,
                  background: isOpen ? "transparent" : "var(--bi-ink)",
                  color: isOpen ? "var(--bi-muted)" : "var(--bi-bg)",
                  border: isOpen ? "1px solid var(--bi-line)" : "none",
                }}
              >
                {isOpen ? "Annuler" : "Fait ✓"}
              </button>
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
