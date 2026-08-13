"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) { setError("Entre ton email."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(
        error.message === "Too many requests"
          ? "Trop de tentatives. Réessaie dans quelques minutes."
          : error.message
      );
      return;
    }
    // Toujours confirmer, même si l'email n'existe pas (pas d'énumération de comptes).
    setSent(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  if (sent) {
    return (
      <AuthShell
        eyebrow="Mot de passe oublié"
        headline={<>Vérifie<br />ton email.</>}
        sub="Un lien de réinitialisation t'a été envoyé. Il est valable une heure."
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
          Mot de passe oublié
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 6 }}>Email envoyé</div>
        <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 8, lineHeight: 1.55 }}>
          Si un compte existe pour <strong style={{ color: "var(--bi-ink)" }}>{email}</strong>, un lien de
          réinitialisation vient d&apos;être envoyé.
        </div>
        <div style={{ marginTop: 28, padding: 20, borderRadius: 14, background: "var(--bi-ok-soft)", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--bi-ok)", fontWeight: 600 }}>Lien de réinitialisation envoyé</div>
          <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 6 }}>Vérifie aussi tes spams si tu ne le vois pas.</div>
        </div>
        <div style={{ marginTop: 24, fontSize: 13, color: "var(--bi-muted)", textAlign: "center" }}>
          Mauvaise adresse ?{" "}
          <button onClick={() => setSent(false)} style={{ background: "none", border: "none", color: "var(--bi-ink)", fontWeight: 600, fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--bi-ink)", padding: 0 }}>
            Recommencer
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Mot de passe oublié"
      headline={<>Ça arrive.</>}
      sub="Entre ton email, on t'envoie un lien pour définir un nouveau mot de passe."
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
        Mot de passe oublié
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 6 }}>Réinitialiser</div>
      <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 8, lineHeight: 1.55 }}>
        On t&apos;envoie un lien valable une heure.
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bi-muted)", marginBottom: 8 }}>Email</div>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} placeholder="ton@email.com" autoFocus style={inputStyle} />
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "var(--bi-bad-soft)", color: "var(--bi-bad)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <button onClick={handleSend} disabled={loading} style={{ marginTop: 18, width: "100%", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Envoi…" : "Envoyer le lien"}
      </button>

      <div style={{ marginTop: 32, fontSize: 13, color: "var(--bi-muted)", textAlign: "center" }}>
        <Link href="/login" style={{ color: "var(--bi-ink)", fontWeight: 600, borderBottom: "1px solid var(--bi-ink)", textDecoration: "none" }}>
          Retour à la connexion
        </Link>
      </div>
    </AuthShell>
  );
}
