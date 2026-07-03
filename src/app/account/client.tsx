"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Mono } from "@/components/bi/ui";
import { ManualRideButton } from "@/components/bi/manual-ride-button";
import { SyncButton } from "@/components/bi/sync-button";
import { NotificationSettings } from "@/components/bi/notification-settings";

interface Props {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  initials: string;
  bikes: { id: string; name: string }[];
  stravaConnected: boolean;
  bikeCount: number;
  componentCount: number;
  unreadNotifCount: number;
  memberSince: string;
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "var(--bi-muted)",
  marginBottom: 12,
};

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 0",
  borderBottom: "1px solid var(--bi-line)",
};

export function AccountClient({
  firstName: initialFirstName, lastName: initialLastName, email, initials: initialInitials,
  bikes, stravaConnected, bikeCount, componentCount,
  unreadNotifCount, memberSince,
}: Props) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSaveProfile() {
    if (!firstName.trim() && !lastName.trim()) return;
    setSaving(true);
    setSaveError("");
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      },
    });
    setSaving(false);
    if (error) { setSaveError("Erreur lors de la sauvegarde."); return; }
    setSaveSuccess(true);
    setEditingProfile(false);
    setTimeout(() => setSaveSuccess(false), 3000);
    router.refresh();
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "—";
  const initials = fullName !== "—"
    ? fullName.split(/[\s.]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("")
    : initialInitials;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Avatar + résumé */}
      <div style={{ background: "var(--bi-card)", borderRadius: 18, padding: 24, border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 999,
          background: "var(--bi-ink)", color: "var(--bi-bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.5 }}>{fullName}</div>
          <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 2 }}>{email}</div>
          <div style={{ marginTop: 10, display: "flex", gap: 16 }}>
            <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>
              <Mono style={{ color: "var(--bi-ink)", fontWeight: 600 }}>{bikeCount}</Mono> vélo{bikeCount !== 1 ? "s" : ""}
            </span>
            <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>
              <Mono style={{ color: "var(--bi-ink)", fontWeight: 600 }}>{componentCount}</Mono> pièce{componentCount !== 1 ? "s" : ""}
            </span>
            {unreadNotifCount > 0 && (
              <span style={{ fontSize: 12, color: "var(--bi-bad)", fontWeight: 600 }}>
                <Mono>{unreadNotifCount}</Mono> alerte{unreadNotifCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Profil */}
      <div style={{ background: "var(--bi-card)", borderRadius: 18, padding: "20px 24px", border: "1px solid var(--bi-line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={sectionTitle as React.CSSProperties}>Profil</div>
          {!editingProfile ? (
            <button
              onClick={() => setEditingProfile(true)}
              style={{ fontSize: 12, color: "var(--bi-ink)", fontWeight: 600, background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}
            >
              Modifier
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setEditingProfile(false); setFirstName(initialFirstName); setLastName(initialLastName); setSaveError(""); }}
                style={{ fontSize: 12, color: "var(--bi-muted)", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                style={{ fontSize: 12, color: "var(--bi-bg)", fontWeight: 600, background: "var(--bi-ink)", border: "none", borderRadius: 8, padding: "5px 14px", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "…" : "Enregistrer"}
              </button>
            </div>
          )}
        </div>

        {saveSuccess && (
          <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(14,143,90,0.08)", color: "var(--bi-ok)", fontSize: 12.5, fontWeight: 500 }}>
            ✓ Profil mis à jour
          </div>
        )}
        {saveError && (
          <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(200,54,46,0.08)", color: "var(--bi-bad)", fontSize: 12.5 }}>
            {saveError}
          </div>
        )}

        {/* Prénom */}
        <div style={{ ...row }}>
          <span style={{ fontSize: 13, color: "var(--bi-muted)", flexShrink: 0 }}>Prénom</span>
          {editingProfile ? (
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSaveProfile()}
              placeholder="Prénom"
              style={{ fontSize: 13.5, fontWeight: 500, color: "var(--bi-ink)", background: "var(--bi-bg)", border: "1.5px solid var(--bi-ink)", borderRadius: 8, padding: "6px 10px", fontFamily: "inherit", outline: "none", textAlign: "right", width: 200 }}
              autoFocus
            />
          ) : (
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>{firstName || "—"}</span>
          )}
        </div>

        {/* Nom */}
        <div style={{ ...row }}>
          <span style={{ fontSize: 13, color: "var(--bi-muted)", flexShrink: 0 }}>Nom</span>
          {editingProfile ? (
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSaveProfile()}
              placeholder="Nom"
              style={{ fontSize: 13.5, fontWeight: 500, color: "var(--bi-ink)", background: "var(--bi-bg)", border: "1px solid var(--bi-line)", borderRadius: 8, padding: "6px 10px", fontFamily: "inherit", outline: "none", textAlign: "right", width: 200 }}
            />
          ) : (
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>{lastName || "—"}</span>
          )}
        </div>

        {/* Email — toujours lecture seule */}
        <div style={{ ...row, borderBottom: "none" }}>
          <span style={{ fontSize: 13, color: "var(--bi-muted)" }}>Email</span>
          <Mono style={{ fontSize: 12.5 }}>{email}</Mono>
        </div>
      </div>

      {/* Connexions */}
      <div style={{ background: "var(--bi-card)", borderRadius: 18, padding: "20px 24px", border: "1px solid var(--bi-line)" }}>
        <div style={sectionTitle}>Connexions</div>

        {/* Strava */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FC4C02", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-3M20 14a8 8 0 01-14 3"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Strava</div>
              <div style={{ fontSize: 11.5, color: stravaConnected ? "var(--bi-ok)" : "var(--bi-muted)", marginTop: 1 }}>
                {stravaConnected ? "● Connecté" : "Non connecté"}
              </div>
            </div>
          </div>
          {stravaConnected ? null : (
            <a href="/api/strava/auth" style={{ fontSize: 12, color: "#fff", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#FC4C02", border: "none", borderRadius: 8 }}>
              Connecter
            </a>
          )}
        </div>

        {/* Sorties */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: "1px solid var(--bi-line)" }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Sorties</div>
            <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 1 }}>Ajouter ou synchroniser des activités</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {stravaConnected && <SyncButton stravaConnected={stravaConnected} />}
            <ManualRideButton bikes={bikes} />
          </div>
        </div>
      </div>

      {/* Réglages des alertes (ex-page /notifications) */}
      <NotificationSettings />

      {/* Liens rapides */}
      <div style={{ background: "var(--bi-card)", borderRadius: 18, padding: "20px 24px", border: "1px solid var(--bi-line)" }}>
        <div style={sectionTitle}>Navigation</div>
        {[
          { label: "Mes vélos", href: "/bikes", icon: "M5 18a4 4 0 100-8 4 4 0 000 8zM19 18a4 4 0 100-8 4 4 0 000 8zM12 7l-3 7h6l-3-7zM12 7V4h3" },
          { label: "Pièces", href: "/components", icon: "M12 4v4M12 16v4M4 12h4M16 12h4M12 9a3 3 0 100 6 3 3 0 000-6z" },
          { label: "Alertes", href: "/dashboard", icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0", badge: unreadNotifCount },
        ].map((item, i, arr) => (
          <Link key={item.href} href={item.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--bi-line)" : "none", textDecoration: "none", color: "var(--bi-ink)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            <span style={{ flex: 1, fontSize: 13.5 }}>{item.label}</span>
            {item.badge ? (
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999, background: "var(--bi-bad)", color: "#fff" }}>{item.badge}</span>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="2"><path d="M9 6l6 6-6 6" /></svg>
            )}
          </Link>
        ))}
      </div>

      {/* Actions compte */}
      <div style={{ background: "var(--bi-card)", borderRadius: 18, padding: "20px 24px", border: "1px solid var(--bi-line)" }}>
        <div style={sectionTitle}>Compte</div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 0", background: "transparent", border: "none", borderBottom: "1px solid var(--bi-line)", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, color: "var(--bi-ink)", textAlign: "left" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          {signingOut ? "Déconnexion…" : "Se déconnecter"}
        </button>

        <button
          onClick={() => setConfirmDelete(!confirmDelete)}
          style={{ marginTop: 14, width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "4px 0", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--bi-muted)", textAlign: "left" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
          </svg>
          Supprimer mon compte
        </button>

        {confirmDelete && (
          <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 10, background: "rgba(200,54,46,0.06)", border: "1px solid rgba(200,54,46,0.2)" }}>
            <div style={{ fontSize: 13, color: "var(--bi-bad)", fontWeight: 600, marginBottom: 6 }}>Cette action est irréversible.</div>
            <div style={{ fontSize: 12, color: "var(--bi-muted)", marginBottom: 12 }}>Toutes tes données (vélos, pièces, historique) seront supprimées définitivement.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: "8px 0", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}>Annuler</button>
              <a href="mailto:support@bikeinsight.app?subject=Suppression de compte" style={{ flex: 2, padding: "8px 0", background: "var(--bi-bad)", color: "#fff", border: "none", borderRadius: 8, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer", fontWeight: 600, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                Contacter le support
              </a>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
