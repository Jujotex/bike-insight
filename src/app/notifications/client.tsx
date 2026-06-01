"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mono } from "@/components/bi/ui";

type Notif = {
  id: string;
  component_id: string | null;
  bike_id: string;
  component_name: string;
  bike_name: string;
  type: "warn" | "bad";
  read: boolean;
  created_at: string;
};

type Settings = {
  notify_warn: boolean;
  notify_bad: boolean;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `Il y a ${Math.floor(diff / 86400)} j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

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

export function NotificationsClient({
  notifications,
  initialSettings,
}: {
  notifications: Notif[];
  initialSettings: Settings;
}) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);
  const [markingAll, setMarkingAll] = useState(false);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const unread = items.filter(n => !n.read);

  async function markOne(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  async function markAll() {
    setMarkingAll(true);
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setMarkingAll(false);
    router.refresh();
  }

  async function updateSetting(key: keyof Settings, value: boolean) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSavingSettings(true);
    await fetch("/api/notifications/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }

  const SETTING_ROWS = [
    {
      key: "notify_bad" as keyof Settings,
      label: "Composant à remplacer",
      sub: "Quand l'usure dépasse 100% — action urgente",
      color: "var(--bi-bad)",
      defaultOn: true,
    },
    {
      key: "notify_warn" as keyof Settings,
      label: "Composant à surveiller",
      sub: "Quand l'usure dépasse 80% — à planifier",
      color: "var(--bi-warn)",
      defaultOn: true,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Paramètres ── */}
      <div style={{ background: "var(--bi-card)", borderRadius: 18, border: "1px solid var(--bi-line)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Paramètres</div>
            <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 1 }}>Choisir quelles alertes recevoir</div>
          </div>
          {savingSettings && <span style={{ fontSize: 11, color: "var(--bi-muted)" }}>Sauvegarde…</span>}
          {settingsSaved && <span style={{ fontSize: 11, color: "var(--bi-ok)", fontWeight: 600 }}>✓ Sauvegardé</span>}
        </div>

        {SETTING_ROWS.map((row, i) => (
          <div key={row.key} style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "16px 20px",
            borderBottom: i < SETTING_ROWS.length - 1 ? "1px solid var(--bi-line)" : "none",
          }}>
            {/* Dot couleur */}
            <div style={{ width: 8, height: 8, borderRadius: 999, background: row.color, flexShrink: 0 }} />

            {/* Label */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{row.label}</span>
                {row.defaultOn && (
                  <span style={{ fontSize: 9.5, padding: "2px 7px", borderRadius: 999, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", color: "var(--bi-muted)", fontWeight: 600, letterSpacing: 0.4 }}>
                    PAR DÉFAUT
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>{row.sub}</div>
            </div>

            {/* Toggle */}
            <Toggle
              enabled={settings[row.key]}
              onChange={() => updateSetting(row.key, !settings[row.key])}
            />
          </div>
        ))}
      </div>

      {/* ── Liste des alertes ── */}
      <div>
        {unread.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <button
              onClick={markAll}
              disabled={markingAll}
              style={{ fontSize: 12, color: "var(--bi-muted)", background: "transparent", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: "inherit" }}
            >
              Tout marquer comme lu
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--bi-muted)" }}>
            <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.25 }}>🔔</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--bi-ink)" }}>Aucune alerte</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Tes composants sont tous en bon état.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--bi-line)", borderRadius: 16, overflow: "hidden" }}>
            {items.map((n) => {
              const isBad = n.type === "bad";
              const color = isBad ? "var(--bi-bad)" : "var(--bi-warn)";
              const label = isBad ? "À remplacer" : "À surveiller";
              const msg = isBad
                ? `${n.component_name} a dépassé sa durée de vie estimée`
                : `${n.component_name} approche de sa limite d'usure`;

              return (
                <div
                  key={n.id}
                  style={{
                    background: n.read ? "var(--bi-card)" : "var(--bi-bg)",
                    padding: "16px 20px",
                    display: "flex", alignItems: "flex-start", gap: 14,
                  }}
                >
                  <div style={{ marginTop: 3, width: 8, height: 8, borderRadius: 999, background: n.read ? "var(--bi-line)" : color, flexShrink: 0 }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12.5, fontWeight: n.read ? 400 : 600, color: "var(--bi-ink)" }}>{msg}</span>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: isBad ? "rgba(200,54,46,0.1)" : "rgba(208,132,21,0.1)", color, fontWeight: 700, flexShrink: 0 }}>
                        {label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--bi-muted)" }}>
                      {n.bike_name} · <Mono style={{ fontSize: 11 }}>{formatDate(n.created_at)}</Mono>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    {n.component_id && (
                      <Link href={`/components/${n.component_id}`} style={{ fontSize: 11.5, color: "var(--bi-ink)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                        Voir
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
                      </Link>
                    )}
                    {!n.read && (
                      <button
                        onClick={() => markOne(n.id)}
                        title="Marquer comme lu"
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--bi-muted)", padding: 0, display: "flex", alignItems: "center" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
