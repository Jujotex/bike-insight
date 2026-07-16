"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const ERROR_MESSAGES: Record<string, string> = {
  "User already registered": "Un compte existe déjà avec cet email.",
  "Password should be at least 6 characters": "Le mot de passe doit faire au moins 8 caractères.",
  "Unable to validate email address: invalid format": "Adresse email invalide.",
  "Too many requests": "Trop de tentatives. Réessaie dans quelques minutes.",
};

function translateError(msg: string): string {
  return ERROR_MESSAGES[msg] ?? msg;
}

function validatePassword(p: string): string | null {
  if (p.length < 8) return "Au moins 8 caractères requis.";
  if (!/[0-9]/.test(p)) return "Au moins un chiffre requis.";
  if (!/[A-Z]/.test(p)) return "Au moins une majuscule requise.";
  if (!/[^a-zA-Z0-9]/.test(p)) return "Au moins un caractère spécial requis.";
  return null;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.87-3.04.87a5.27 5.27 0 01-4.96-3.65H.96v2.34A9 9 0 009 18z" fill="#34A853" />
      <path d="M4.04 10.78A5.4 5.4 0 013.76 9c0-.62.1-1.22.28-1.78V4.88H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.05l3.08-2.27z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 009 0 9 9 0 00.96 4.88l3.08 2.34A5.27 5.27 0 019 3.58z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 12.04c-.03-2.74 2.24-4.06 2.34-4.13-1.28-1.87-3.26-2.13-3.96-2.16-1.69-.17-3.3 1-4.16 1-.87 0-2.19-.97-3.59-.95-1.85.03-3.55 1.07-4.5 2.72-1.92 3.32-.49 8.24 1.39 10.94.92 1.32 2.01 2.81 3.44 2.75 1.38-.06 1.91-.89 3.58-.89 1.67 0 2.14.89 3.6.86 1.49-.02 2.43-1.34 3.34-2.67 1.05-1.53 1.49-3.01 1.51-3.09-.03-.01-2.91-1.11-2.99-4.38zM14.5 4.05c.76-.92 1.27-2.2 1.13-3.48-1.09.04-2.42.73-3.21 1.65-.71.81-1.33 2.11-1.16 3.37 1.22.09 2.47-.62 3.24-1.54z" />
    </svg>
  );
}

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.includes("@") &&
    validatePassword(password) === null;

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim()) { setError("Prénom et nom requis."); return; }
    if (!email) { setError("Email requis."); return; }
    const pwdError = validatePassword(password);
    if (pwdError) { setError(pwdError); return; }

    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/connect/strava`,
        data: {
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        },
      },
    });

    if (error) {
      setError(translateError(error.message));
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      setEmailSent(true);
      setLoading(false);
      return;
    }

    window.location.href = "/connect/strava";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignup();
  };

  if (emailSent) {
    return (
      <AuthShell step={1} total={3} eyebrow="Inscription"
        headline={<>Vérifie<br />ton email.</>}
        sub="Un lien de confirmation t'a été envoyé. Clique dessus pour activer ton compte et continuer.">
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Étape 1 · 3</div>
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 6 }}>Email envoyé</div>
        <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 8, lineHeight: 1.55 }}>
          On a envoyé un lien à <strong style={{ color: "var(--bi-ink)" }}>{email}</strong>.<br />Clique dessus pour activer ton compte.
        </div>
        <div style={{ marginTop: 28, padding: "20px", borderRadius: 14, background: "var(--bi-ok-soft)", border: "1px solid rgba(14,143,90,0.15)", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📬</div>
          <div style={{ fontSize: 13, color: "var(--bi-ok)", fontWeight: 600 }}>Email de confirmation envoyé</div>
          <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 6 }}>Vérifie aussi tes spams si tu ne le vois pas.</div>
        </div>
        <div style={{ marginTop: 24, fontSize: 13, color: "var(--bi-muted)", textAlign: "center" }}>
          Mauvaise adresse ?{" "}
          <button onClick={() => setEmailSent(false)} style={{ background: "none", border: "none", color: "var(--bi-ink)", fontWeight: 600, fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--bi-ink)", padding: 0 }}>
            Recommencer
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell step={1} total={3} eyebrow="Inscription"
      headline={<>Comprends enfin<br />combien te coûte<br />ton vélo.</>}
      sub="Connecte ton compte Strava une fois. On calcule l'usure réelle, le coût par km et te dit quand changer chaque pièce.">

      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>Étape 1 · 3</div>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 6 }}>Crée ton compte</div>
      <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 8, lineHeight: 1.55 }}>
        Gratuit pendant la beta. Pas de carte bancaire requise.
      </div>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Prénom + Nom */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={labelStyle}>Prénom</div>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Léo"
              style={{ ...inputStyle, border: firstName ? "1.5px solid var(--bi-ink)" : "1px solid var(--bi-line)" }}
              autoFocus
            />
          </div>
          <div>
            <div style={labelStyle}>Nom</div>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Martin"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <div style={labelStyle}>Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ton@email.com"
            style={inputStyle}
          />
        </div>

        {/* Mot de passe */}
        <div>
          <div style={labelStyle}>Mot de passe</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Au moins 8 caractères"
            style={inputStyle}
          />
          <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 6 }}>
            Un chiffre, une majuscule, un caractère spécial
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "var(--bi-bad-soft)", color: "var(--bi-bad)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSignup}
        disabled={loading}
        style={{ marginTop: 22, width: "100%", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
      >
        {loading ? "Création…" : "Créer mon compte"}
        {!loading && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>}
      </button>

      <div style={{ margin: "22px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: "var(--bi-line)" }} />
        <span style={{ fontSize: 11, color: "var(--bi-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>ou</span>
        <div style={{ flex: 1, height: 1, background: "var(--bi-line)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button style={{ background: "transparent", color: "var(--bi-ink)", border: "1px solid var(--bi-line)", borderRadius: 14, padding: "12px 0", fontSize: 13, fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
          <GoogleIcon /> Google
        </button>
        <button style={{ background: "transparent", color: "var(--bi-ink)", border: "1px solid var(--bi-line)", borderRadius: 14, padding: "12px 0", fontSize: 13, fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
          <AppleIcon /> Apple
        </button>
      </div>

      <div style={{ marginTop: 32, fontSize: 13, color: "var(--bi-muted)", textAlign: "center" }}>
        Déjà inscrit ?{" "}
        <Link href="/login" style={{ color: "var(--bi-ink)", fontWeight: 600, borderBottom: "1px solid var(--bi-ink)", textDecoration: "none" }}>
          Se connecter
        </Link>
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: "var(--bi-muted)", textAlign: "center", lineHeight: 1.5 }}>
        En continuant, tu acceptes nos{" "}
        <span style={{ color: "var(--bi-ink)", textDecoration: "underline", cursor: "pointer" }}>Conditions</span>
        {" "}et notre{" "}
        <span style={{ color: "var(--bi-ink)", textDecoration: "underline", cursor: "pointer" }}>Politique de confidentialité</span>.
      </div>
    </AuthShell>
  );
}
