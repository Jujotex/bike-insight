"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/bi/auth-shell";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid var(--bi-line)",
  background: "var(--bi-card)",
  fontSize: 14,
  fontWeight: 500,
  color: "var(--bi-ink)",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--bi-muted)",
  marginBottom: 8,
};

// Mêmes règles que l'inscription
function validatePassword(p: string): string | null {
  if (p.length < 8) return "Au moins 8 caractères requis.";
  if (!/[0-9]/.test(p)) return "Au moins un chiffre requis.";
  if (!/[A-Z]/.test(p)) return "Au moins une majuscule requise.";
  if (!/[^a-zA-Z0-9]/.test(p)) return "Au moins un caractère spécial requis.";
  return null;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Le lien de l'email renvoie ici avec un `code` (PKCE) à échanger contre une session,
  // ou pose directement la session via un fragment `#access_token=…` (ancien format).
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const code = searchParams.get("code");
      const errorDescription = searchParams.get("error_description");

      if (errorDescription) {
        if (!cancelled) setLinkError("Ce lien est invalide ou a expiré. Demande-en un nouveau.");
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!cancelled) {
          if (error) setLinkError("Ce lien est invalide ou a expiré. Demande-en un nouveau.");
          else setReady(true);
        }
        return;
      }

      // Pas de code : la session a peut-être déjà été posée (fragment traité par le client).
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) setReady(true);
      else setLinkError("Lien de réinitialisation manquant ou expiré. Demande-en un nouveau.");
    }

    init();
    return () => { cancelled = true; };
  }, [searchParams]);

  const handleSubmit = async () => {
    const invalid = validatePassword(password);
    if (invalid) { setError(invalid); return; }
    if (password !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return; }

    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(
        error.message === "New password should be different from the old password."
          ? "Choisis un mot de passe différent de l'ancien."
          : error.message
      );
      return;
    }
    setDone(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  if (done) {
    return (
      <>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Mot de passe
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 6 }}>C&apos;est fait</div>
        <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 8, lineHeight: 1.55 }}>
          Ton mot de passe a été mis à jour.
        </div>
        <button
          onClick={() => { window.location.href = "/dashboard"; }}
          style={{ marginTop: 24, width: "100%", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
        >
          Aller au dashboard
        </button>
      </>
    );
  }

  if (linkError) {
    return (
      <>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Mot de passe
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 6 }}>Lien expiré</div>
        <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "var(--bi-bad-soft)", color: "var(--bi-bad)", fontSize: 13 }}>
          {linkError}
        </div>
        <Link
          href="/forgot-password"
          style={{ display: "block", marginTop: 20, width: "100%", background: "var(--bi-ink)", color: "var(--bi-bg)", borderRadius: 14, padding: "14px 0", fontSize: 14, fontWeight: 600, textAlign: "center", textDecoration: "none" }}
        >
          Demander un nouveau lien
        </Link>
      </>
    );
  }

  if (!ready) {
    return (
      <div style={{ fontSize: 13, color: "var(--bi-muted)" }}>Vérification du lien…</div>
    );
  }

  return (
    <>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
        Mot de passe
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 6 }}>Nouveau mot de passe</div>
      <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 8, lineHeight: 1.55 }}>
        8 caractères minimum, une majuscule, un chiffre, un caractère spécial.
      </div>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={labelStyle}>Nouveau mot de passe</div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} placeholder="••••••••••" autoFocus style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Confirmation</div>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={handleKeyDown} placeholder="••••••••••" style={inputStyle} />
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "var(--bi-bad-soft)", color: "var(--bi-bad)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading} style={{ marginTop: 18, width: "100%", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Enregistrement…" : "Enregistrer"}
      </button>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Mot de passe"
      headline={<>Nouveau départ.</>}
      sub="Choisis un nouveau mot de passe pour ton compte."
    >
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
