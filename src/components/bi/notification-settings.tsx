"use client";

// Réglages des alertes (seuils d'usure) — extrait de l'ancienne page
// /notifications, désormais intégré à la page Compte. Auto-save avec
// debounce, chargement des réglages via l'API.

import { useEffect, useRef, useState } from "react";
import { Mono } from "@/components/bi/ui";

type Settings = {
  notify_warn: boolean;
  notify_bad: boolean;
  warn_threshold: number;
  bad_threshold: number;
  strava_wear_comment: boolean;
};

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 999,
        background: enabled ? "var(--bi-ok)" : "var(--bi-line)",
        border: "none", cursor: "pointer", position: "relative",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: enabled ? 21 : 3,
        width: 16, height: 16, borderRadius: 999,
        background: "#fff",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function ThresholdSlider({
  value, min, max, defaultVal, color, onChange,
}: {
  value: number; min: number; max: number; defaultVal: number;
  color: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
      <div style={{ flex: 1, position: "relative" }}>
        <div style={{ height: 4, borderRadius: 999, background: "var(--bi-line)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.1s" }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={5}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: "absolute", top: "50%", left: 0, width: "100%",
            transform: "translateY(-50%)",
            opacity: 0, cursor: "pointer", height: 20, margin: 0,
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <Mono style={{ fontSize: 15, fontWeight: 700, color, minWidth: 36, textAlign: "right" }}>
          {value}%
        </Mono>
        {value !== defaultVal && (
          <button
            onClick={() => onChange(defaultVal)}
            title="Remettre par défaut"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--bi-muted)", padding: 0, fontSize: 10 }}
          >
            ↩
          </button>
        )}
      </div>
    </div>
  );
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/notifications/settings")
      .then(r => r.json())
      .then(data => setSettings({
        notify_warn: data.notify_warn ?? true,
        notify_bad: data.notify_bad ?? true,
        warn_threshold: data.warn_threshold ?? 80,
        bad_threshold: data.bad_threshold ?? 100,
        strava_wear_comment: data.strava_wear_comment ?? false,
      }))
      .catch(() => setSettings({ notify_warn: true, notify_bad: true, warn_threshold: 80, bad_threshold: 100, strava_wear_comment: false }));
  }, []);

  // Sauvegarde avec debounce 600 ms
  function save(next: Settings) {
    setSettings(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 600);
  }

  return (
    <div style={{ background: "var(--bi-card)", borderRadius: 18, border: "1px solid var(--bi-line)", overflow: "hidden" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Alertes</div>
          <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 1 }}>Activer et régler les seuils d&apos;alerte d&apos;usure</div>
        </div>
        {saved && (
          <span style={{ fontSize: 11, color: "var(--bi-ok)", fontWeight: 600 }}>✓ Sauvegardé</span>
        )}
      </div>

      {settings === null ? (
        <div style={{ padding: "24px", fontSize: 12.5, color: "var(--bi-muted)" }}>Chargement des réglages…</div>
      ) : (
        <>
          {/* Alerte "À remplacer" — bad */}
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--bi-line)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--bi-bad)", flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>À remplacer</span>
                  <Toggle
                    enabled={settings.notify_bad}
                    onChange={() => save({ ...settings, notify_bad: !settings.notify_bad })}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: "var(--bi-muted)" }}>Alerte critique — défaut</span>
                  <span style={{ fontSize: 9.5, padding: "2px 7px", borderRadius: 999, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", color: "var(--bi-muted)", fontWeight: 600 }}>100%</span>
                </div>
              </div>
            </div>
            {settings.notify_bad && (
              <ThresholdSlider
                value={settings.bad_threshold}
                min={80} max={120} defaultVal={100}
                color="var(--bi-bad)"
                onChange={v => save({ ...settings, bad_threshold: v })}
              />
            )}
          </div>

          {/* Alerte "À surveiller" — warn */}
          <div style={{ padding: "18px 24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--bi-warn)", flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>À surveiller</span>
                  <Toggle
                    enabled={settings.notify_warn}
                    onChange={() => save({ ...settings, notify_warn: !settings.notify_warn })}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <span style={{ fontSize: 11, color: "var(--bi-muted)" }}>Alerte préventive — défaut</span>
                  <span style={{ fontSize: 9.5, padding: "2px 7px", borderRadius: 999, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", color: "var(--bi-muted)", fontWeight: 600 }}>80%</span>
                </div>
              </div>
            </div>
            {settings.notify_warn && (
              <ThresholdSlider
                value={settings.warn_threshold}
                min={50} max={95} defaultVal={80}
                color="var(--bi-warn)"
                onChange={v => save({ ...settings, warn_threshold: v })}
              />
            )}
          </div>

          {/* Commentaire d'usure sur Strava */}
          <div style={{ padding: "18px 24px", borderTop: "1px solid var(--bi-line)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "#FC4C02", flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>Alerte dans la description Strava</span>
                  <Toggle
                    enabled={settings.strava_wear_comment}
                    onChange={() => save({ ...settings, strava_wear_comment: !settings.strava_wear_comment })}
                  />
                </div>
                <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 3, lineHeight: 1.5 }}>
                  Quand une pièce atteint l&apos;usure critique, ajoute une phrase d&apos;alerte à la description de tes nouvelles sorties Strava. Nécessite de reconnecter Strava (droit d&apos;écriture). Ta description existante est conservée.
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "12px 24px 16px", fontSize: 11, color: "var(--bi-muted)", borderTop: "1px solid var(--bi-line)" }}>
            Ces seuils s&apos;appliquent aussi aux alertes d&apos;entretien (bientôt / à faire).
          </div>
        </>
      )}
    </div>
  );
}
