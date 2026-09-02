"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mono } from "@/components/bi/ui";
import { ManualRideButton } from "@/components/bi/manual-ride-button";
import { SyncButton } from "@/components/bi/sync-button";
import { NotificationSettings } from "@/components/bi/notification-settings";
import { PRIVACY_POLICY_PATH, STRAVA_APPS_SETTINGS_URL, SUPPORT_EMAIL } from "@/lib/contact";
import { apiFetch } from "@/lib/api";

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
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  // Suppression définitive du compte (exigence Apple : déclenchable dans l'app ;
  // API Policy Strava §2.5/§7.4 : suppression des données + confirmation écrite).
  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setDeleteError(body.error ?? "La suppression a échoué. Réessaie ou contacte le support.");
        setDeleting(false);
        return;
      }
      // Écran de confirmation : c'est la trace écrite immédiate exigée par le §2.5.
      setDeleted(true);
    } catch {
      setDeleteError("Impossible de joindre le serveur.");
      setDeleting(false);
    }
  }

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
          <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: "var(--bi-ok-soft)", color: "var(--bi-ok)", fontSize: 13, fontWeight: 500 }}>
            ✓ Profil mis à jour
          </div>
        )}
        {saveError && (
          <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: "var(--bi-bad-soft)", color: "var(--bi-bad)", fontSize: 13 }}>
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
              style={{ fontSize: 13, fontWeight: 500, color: "var(--bi-ink)", background: "var(--bi-bg)", border: "1.5px solid var(--bi-ink)", borderRadius: 8, padding: "6px 10px", fontFamily: "inherit", outline: "none", textAlign: "right", width: 200 }}
              autoFocus
            />
          ) : (
            <span style={{ fontSize: 13, fontWeight: 500 }}>{firstName || "—"}</span>
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
              style={{ fontSize: 13, fontWeight: 500, color: "var(--bi-ink)", background: "var(--bi-bg)", border: "1px solid var(--bi-line)", borderRadius: 8, padding: "6px 10px", fontFamily: "inherit", outline: "none", textAlign: "right", width: 200 }}
            />
          ) : (
            <span style={{ fontSize: 13, fontWeight: 500 }}>{lastName || "—"}</span>
          )}
        </div>

        {/* Email — toujours lecture seule */}
        <div style={{ ...row, borderBottom: "none" }}>
          <span style={{ fontSize: 13, color: "var(--bi-muted)" }}>Email</span>
          <Mono style={{ fontSize: 13 }}>{email}</Mono>
        </div>
      </div>

      {/* Connexions */}
      <div style={{ background: "var(--bi-card)", borderRadius: 18, padding: "20px 24px", border: "1px solid var(--bi-line)" }}>
        <div style={sectionTitle}>Connexions</div>

        {/* Strava */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bi-strava)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bi-white)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-3M20 14a8 8 0 01-14 3"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Strava</div>
              <div style={{ fontSize: 12, color: stravaConnected ? "var(--bi-ok)" : "var(--bi-muted)", marginTop: 1 }}>
                {stravaConnected ? "● Connecté" : "Non connecté"}
              </div>
            </div>
          </div>
          {stravaConnected ? (
            // API Policy §2.4 : lien clair vers le compte Strava de l'utilisateur,
            // qui est aussi le point de révocation de l'autorisation (§7.4).
            <a href={STRAVA_APPS_SETTINGS_URL} target="_blank" rel="noopener noreferrer" className="bi-text-sm" style={{ color: "var(--bi-muted)", fontWeight: 600, textDecoration: "underline", whiteSpace: "nowrap" }}>
              Gérer sur Strava
            </a>
          ) : (
            <a href="/api/strava/auth" style={{ fontSize: 12, color: "var(--bi-white)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--bi-strava)", border: "none", borderRadius: 8 }}>
              Connecter
            </a>
          )}
        </div>

        {/* Sorties */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: "1px solid var(--bi-line)" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Sorties</div>
            <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 1 }}>Ajouter ou synchroniser des activités</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {stravaConnected && <SyncButton stravaConnected={stravaConnected} />}
            <ManualRideButton bikes={bikes} />
          </div>
        </div>
      </div>

      {/* Réglages des alertes (ex-page /notifications) */}
      <NotificationSettings />

      {/* Aide et confidentialité — API Policy Strava §2.4 (contact support « easily
          accessible ») et §7.3 (politique de confidentialité par lien proéminent). */}
      <div style={{ background: "var(--bi-card)", borderRadius: 18, padding: "20px 24px", border: "1px solid var(--bi-line)" }}>
        <div style={sectionTitle}>Aide et confidentialité</div>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="bi-text-base"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 0", borderBottom: "1px solid var(--bi-line)", textDecoration: "none", color: "var(--bi-ink)" }}
        >
          <span style={{ fontWeight: 600 }}>Contacter le support</span>
          <Mono style={{ fontSize: 12, color: "var(--bi-muted)" }}>{SUPPORT_EMAIL}</Mono>
        </a>

        <a
          href={PRIVACY_POLICY_PATH}
          className="bi-text-base"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 0", borderBottom: "1px solid var(--bi-line)", textDecoration: "none", color: "var(--bi-ink)" }}
        >
          <span style={{ fontWeight: 600 }}>Politique de confidentialité</span>
          <span className="bi-text-sm" style={{ color: "var(--bi-muted)" }}>Voir</span>
        </a>

        <a
          href={STRAVA_APPS_SETTINGS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bi-text-base"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 0", textDecoration: "none", color: "var(--bi-ink)" }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>Révoquer l&apos;accès Strava</div>
            <div className="bi-text-sm" style={{ color: "var(--bi-muted)", marginTop: 2, lineHeight: 1.5 }}>
              Depuis tes réglages Strava. Tes sorties importées sont alors supprimées de Bike Insight.
            </div>
          </div>
          <span className="bi-text-sm" style={{ color: "var(--bi-muted)", whiteSpace: "nowrap" }}>Ouvrir</span>
        </a>
      </div>

      {/* Actions compte */}
      <div style={{ background: "var(--bi-card)", borderRadius: 18, padding: "20px 24px", border: "1px solid var(--bi-line)" }}>
        <div style={sectionTitle}>Compte</div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 0", background: "transparent", border: "none", borderBottom: "1px solid var(--bi-line)", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--bi-ink)", textAlign: "left" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          {signingOut ? "Déconnexion…" : "Se déconnecter"}
        </button>

        {!deleted && (
          <button
            onClick={() => setConfirmDelete(!confirmDelete)}
            style={{ marginTop: 14, width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "4px 0", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--bi-muted)", textAlign: "left" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
            </svg>
            Supprimer mon compte
          </button>
        )}

        {confirmDelete && !deleted && (
          <div style={{ marginTop: 12, padding: "14px 16px", borderRadius: 10, background: "var(--bi-bad-soft)", border: "1px solid rgba(200,54,46,0.2)" }}>
            <div style={{ fontSize: 13, color: "var(--bi-bad)", fontWeight: 600, marginBottom: 6 }}>Cette action est irréversible.</div>
            <div style={{ fontSize: 12, color: "var(--bi-muted)", marginBottom: 12, lineHeight: 1.5 }}>
              Toutes tes données seront supprimées définitivement : vélos, pièces, entretiens,
              historique de coût et sorties importées de Strava. L&apos;autorisation accordée à
              Bike Insight sur ton compte Strava sera également révoquée.
            </div>
            {deleteError && (
              <div style={{ fontSize: 12, color: "var(--bi-bad)", fontWeight: 500, marginBottom: 10 }}>{deleteError}</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setConfirmDelete(false); setDeleteError(null); }}
                disabled={deleting}
                style={{ flex: 1, padding: "8px 0", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: deleting ? "not-allowed" : "pointer", color: "var(--bi-muted)" }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{ flex: 2, padding: "8px 0", background: "var(--bi-bad)", color: "var(--bi-white)", border: "none", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: deleting ? "not-allowed" : "pointer", fontWeight: 600, opacity: deleting ? 0.7 : 1 }}
              >
                {deleting ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        )}

        {/* Confirmation écrite immédiate (API Policy §2.5). La session est déjà
            invalidée côté serveur : on ne propose qu'une sortie vers l'accueil. */}
        {deleted && (
          <div style={{ marginTop: 12, padding: "16px 18px", borderRadius: 10, background: "var(--bi-ok-soft)", border: "1px solid var(--bi-line)" }}>
            <div style={{ fontSize: 13, color: "var(--bi-ok)", fontWeight: 600, marginBottom: 6 }}>Compte supprimé.</div>
            <div style={{ fontSize: 12, color: "var(--bi-muted)", marginBottom: 12, lineHeight: 1.5 }}>
              Toutes tes données ont été effacées définitivement, y compris les sorties importées
              de Strava, et l&apos;autorisation Strava a été révoquée. Merci d&apos;avoir utilisé
              Bike Insight.
            </div>
            <button
              onClick={() => { window.location.href = "/"; }}
              style={{ width: "100%", padding: "10px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 8, fontSize: 13, fontFamily: "inherit", cursor: "pointer", fontWeight: 600 }}
            >
              Retour à l&apos;accueil
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
