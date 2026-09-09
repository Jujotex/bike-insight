"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";
import { routes } from "@/lib/routes";
import { apiFetch } from "@/lib/api";
import { showToast } from "@/components/bi/toast";
import { BiCard, BiLabel, Dot, Mono } from "@/components/bi/ui";
import {
  WEAR_BAD_RATIO,
  extensionSuggestions,
  minKmExtensionFor,
  statusFromKm,
  wearPctOf,
} from "@/lib/wear-math";

const STATUS_COLORS: Record<string, string> = {
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
  archived: "var(--bi-muted)",
};

const STATUS_LABELS: Record<string, string> = {
  ok: "En bon état",
  warn: "À surveiller",
  bad: "À remplacer",
  archived: "Archivée",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 10,
  border: "1px solid var(--bi-line)",
  background: "var(--bi-bg)",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--bi-ink)",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

export interface CheckableComponent {
  id: string;
  name: string;
  bike_id: string;
  bike_name: string | null;
  bike_total_km: number;
  km_used: number;
  km_max: number | null;
}

/**
 * Déclaration d'un contrôle sur une pièce.
 *
 * L'utilisateur a mis les mains dessus — jauge d'usure, pied à coulisse, œil
 * exercé — et sait mieux que le compteur ce qu'il reste à vivre à la pièce. Cet
 * écran lui laisse réviser l'estimation à la hausse, sans toucher aux
 * kilomètres réellement parcourus : `km_used` reste la vérité Strava,
 * `km_max` redevient ce qu'il est — une estimation.
 */
export function ComponentCheckForm({ component }: { component: CheckableComponent }) {
  const router = useRouter();

  const kmUsed = Math.round(component.km_used);
  const kmMax = Math.round(component.km_max ?? 0);

  const [kmAdded, setKmAdded] = useState("");
  const [performedAt, setPerformedAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const added = Math.max(0, Math.round(parseFloat(kmAdded) || 0));

  const preview = useMemo(() => {
    const kmMaxAfter = kmMax + added;
    return {
      kmMaxAfter,
      pctBefore: wearPctOf(kmUsed, kmMax),
      pctAfter: wearPctOf(kmUsed, kmMaxAfter),
      statusBefore: statusFromKm(kmUsed, kmMax),
      statusAfter: statusFromKm(kmUsed, kmMaxAfter),
      kmRemainingAfter: Math.max(0, kmMaxAfter - kmUsed),
      // Ce qu'il faudrait ajouter pour que la pastille rouge disparaisse.
      // Sans ce chiffre, l'utilisateur ajoute 250 km à une chaîne à 100 %,
      // ne voit rien changer, et croit la fonction cassée.
      minToLeaveRed: minKmExtensionFor(kmUsed, kmMax, WEAR_BAD_RATIO),
    };
  }, [kmUsed, kmMax, added]);

  const suggestions = useMemo(() => {
    const base = extensionSuggestions(kmMax);
    // Le « juste ce qu'il faut » n'a de sens que s'il sort réellement du rouge
    // et qu'aucune suggestion standard ne le fait déjà.
    const min = preview.minToLeaveRed;
    if (min > 0 && !base.some(v => v >= min)) return [...base, min].sort((a, b) => a - b);
    return base;
  }, [kmMax, preview.minToLeaveRed]);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const userId = await getCurrentUserId();
    if (!userId) { setSaving(false); return; }

    // 1. Révision de la durée de vie. Le trigger `trg_component_status`
    //    recalcule le statut tout seul sur update de `km_max`.
    if (added > 0) {
      const { error: updErr } = await supabase
        .from("components")
        .update({ km_max: preview.kmMaxAfter })
        .eq("id", component.id);

      if (updErr) { setError(updErr.message); setSaving(false); return; }
    }

    // 2. Trace du contrôle — c'est elle qui garde l'estimation d'origine.
    const { error: logErr } = await supabase.from("maintenance_logs").insert({
      component_id:  component.id,
      bike_id:       component.bike_id,
      user_id:       userId,
      action:        "Contrôle",
      km_at_action:  component.bike_total_km,
      km_added:      added,
      km_max_before: kmMax || null,
      km_max_after:  preview.kmMaxAfter || null,
      notes:         notes.trim() || null,
      performed_at:  performedAt,
    });

    if (logErr) { setError(logErr.message); setSaving(false); return; }

    // 3. L'alerte en cours a été traitée — l'utilisateur vient de regarder la
    //    pièce. On solde les notifications non lues avant le recalcul : s'il
    //    reste au-dessus du seuil, `recalculate` en recréera une, à jour.
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("component_id", component.id)
      .eq("read", false);

    await apiFetch("/api/components/recalculate", { method: "POST" }).catch(() => {});

    showToast(
      added > 0
        ? `Contrôle enregistré — durée de vie portée à ${preview.kmMaxAfter.toLocaleString("fr")} km`
        : "Contrôle enregistré"
    );
    router.push(routes.component(component.id));
    router.refresh();
  }

  const colorBefore = STATUS_COLORS[preview.statusBefore];
  const colorAfter = STATUS_COLORS[preview.statusAfter];
  const stillBad = added > 0 && preview.statusAfter === "bad";

  return (
    <div className="bi-grid-form">
      {/* ── Saisie ─────────────────────────────────────────────── */}
      <BiCard pad={28}>
        <div style={{ marginBottom: 24, padding: "14px 16px", borderRadius: 10, background: "var(--bi-bg)", border: "1px solid var(--bi-line)" }}>
          <BiLabel style={{ fontSize: 10 }}>Pièce contrôlée</BiLabel>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{component.name}</div>
          <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>
            {component.bike_name ?? "Vélo inconnu"} · {kmUsed.toLocaleString("fr")} km parcourus
            {kmMax > 0 && ` sur ${kmMax.toLocaleString("fr")} km estimés`}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <BiLabel style={{ marginBottom: 8 }}>Date du contrôle</BiLabel>
          <input
            type="date"
            style={{ ...inputStyle, maxWidth: 220 }}
            value={performedAt}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => setPerformedAt(e.target.value)}
          />
        </div>

        <BiLabel style={{ marginBottom: 4 }}>Combien de km lui reste-t-il ?</BiLabel>
        <div style={{ fontSize: 12, color: "var(--bi-muted)", marginBottom: 12, lineHeight: 1.5 }}>
          Ces kilomètres s&apos;ajoutent à la durée de vie estimée. Les km déjà parcourus, eux, ne bougent pas.
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {suggestions.map(km => {
            const active = added === km;
            const isMin = km === preview.minToLeaveRed && preview.minToLeaveRed > 0;
            return (
              <button
                key={km}
                onClick={() => setKmAdded(String(km))}
                style={{
                  padding: "10px 16px", borderRadius: 10,
                  background: active ? "var(--bi-ink)" : "var(--bi-card)",
                  color: active ? "var(--bi-bg)" : "var(--bi-ink)",
                  border: `1px solid ${active ? "var(--bi-ink)" : "var(--bi-line)"}`,
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                }}
              >
                <Mono style={{ display: "block", fontSize: 14, fontWeight: 500 }}>
                  +{km.toLocaleString("fr")} km
                </Mono>
                {isMin && (
                  <div style={{ fontSize: 10, marginTop: 2, color: active ? "var(--bi-on-dark-muted)" : "var(--bi-muted)" }}>
                    sort de l&apos;alerte
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom: 24 }}>
          <BiLabel style={{ marginBottom: 8 }}>Ou saisir le nombre de km</BiLabel>
          <input
            type="number" min="0" step="10"
            style={{ ...inputStyle, maxWidth: 220 }}
            value={kmAdded}
            onChange={e => setKmAdded(e.target.value)}
            placeholder="250"
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <BiLabel style={{ marginBottom: 8 }}>Note (optionnel)</BiLabel>
          <textarea
            style={{ ...inputStyle, minHeight: 72, resize: "vertical", lineHeight: 1.5 }}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="ex. jauge d'usure 0,5 — encore de la marge"
          />
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "var(--bi-bad-soft)", color: "var(--bi-bad)", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ paddingTop: 20, borderTop: "1px solid var(--bi-line)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
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
            {saving ? "Enregistrement…" : added > 0 ? "Valider le contrôle" : "Enregistrer le contrôle"}
            {!saving && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: "var(--bi-muted)", lineHeight: 1.5 }}>
          La pièce est en fait hors d&apos;usage ?{" "}
          <Link href={routes.component(component.id)} style={{ color: "var(--bi-ink)", fontWeight: 600 }}>
            Remplace-la depuis sa fiche
          </Link>
          .
        </div>
      </BiCard>

      {/* ── Aperçu ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <BiCard pad={22}>
          <BiLabel style={{ marginBottom: 16 }}>Après ce contrôle</BiLabel>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ opacity: added > 0 ? 0.4 : 1 }}>
              <Mono style={{ display: "block", fontSize: 16, fontWeight: 500, color: colorBefore }}>
                {preview.pctBefore !== null ? `${Math.round(preview.pctBefore)} %` : "—"}
              </Mono>
              <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>Aujourd&apos;hui</div>
            </div>

            {added > 0 && (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
                <div>
                  <Mono style={{ display: "block", fontSize: 16, fontWeight: 500, color: colorAfter }}>
                    {preview.pctAfter !== null ? `${Math.round(preview.pctAfter)} %` : "—"}
                  </Mono>
                  <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>Après</div>
                </div>
              </>
            )}

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <Dot color={colorAfter} size={6} />
              <span style={{ fontSize: 11, fontWeight: 600, color: colorAfter, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                {STATUS_LABELS[preview.statusAfter]}
              </span>
            </div>
          </div>

          {kmMax > 0 && (
            <div style={{ marginTop: 18, height: 5, borderRadius: 999, background: "var(--bi-line)", overflow: "hidden" }}>
              <div style={{
                width: Math.min(100, preview.pctAfter ?? 0) + "%",
                height: "100%", background: colorAfter, borderRadius: 999,
              }} />
            </div>
          )}

          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--bi-line)", borderRadius: 10, overflow: "hidden" }}>
            {[
              ["Durée de vie", `${preview.kmMaxAfter.toLocaleString("fr")} km`],
              ["Km restants", `${preview.kmRemainingAfter.toLocaleString("fr")} km`],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "var(--bi-card)", padding: "12px 14px" }}>
                <BiLabel style={{ fontSize: 10 }}>{k}</BiLabel>
                <Mono style={{ display: "block", fontSize: 14, fontWeight: 500, marginTop: 4 }}>{v}</Mono>
              </div>
            ))}
          </div>
        </BiCard>

        {stillBad && (
          <BiCard pad={22} style={{ border: "1.5px solid var(--bi-warn)", background: "var(--bi-warn-soft)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              L&apos;alerte ne disparaîtra pas
            </div>
            <div style={{ fontSize: 13, color: "var(--bi-muted)", lineHeight: 1.5 }}>
              À {Math.round(preview.pctAfter ?? 0)} % la pièce reste au-dessus du seuil de remplacement.
              Il faudrait au moins{" "}
              <strong style={{ color: "var(--bi-ink)" }}>
                +{preview.minToLeaveRed.toLocaleString("fr")} km
              </strong>{" "}
              pour repasser en orange.
            </div>
          </BiCard>
        )}

        {added === 0 && (
          <BiCard pad={22} style={{ border: "1px solid var(--bi-line)" }}>
            <div style={{ fontSize: 13, color: "var(--bi-muted)", lineHeight: 1.5 }}>
              Sans kilomètres ajoutés, le contrôle est simplement noté dans l&apos;historique :
              l&apos;estimation actuelle est confirmée, l&apos;usure ne bouge pas.
            </div>
          </BiCard>
        )}
      </div>
    </div>
  );
}
