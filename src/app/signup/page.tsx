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

    // Voir `login/page.tsx` : un rechargement complet servirait la racine en
    // natif, à cause de `trailingSlash`.
    router.replace("/connect/strava");
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

      <div style={{ marginTop: 32, fontSize: 13, color: "var(--bi-muted)", textAlign: "center" }}>
        Déjà inscrit ?{" "}
        <Link href="/login" style={{ color: "var(--bi-ink)", fontWeight: 600, borderBottom: "1px solid var(--bi-ink)", textDecoration: "none" }}>
          Se connecter
        </Link>
      </div>
      {/* Ces mentions étaient de faux liens (<span> stylés) pointant vers des documents
          inexistants : on faisait accepter des textes introuvables. La politique de
          confidentialité est un vrai lien depuis le 12/08 (API Policy Strava §7.3 :
          lien « reasonably prominent »), et les CGU depuis le 03/09 (§9.2). */}
      <div style={{ marginTop: 16, fontSize: 11, color: "var(--bi-muted)", textAlign: "center", lineHeight: 1.5 }}>
        En continuant, tu acceptes nos{" "}
        <Link href="/cgu" style={{ color: "var(--bi-ink)", textDecoration: "underline" }}>
          conditions d&apos;utilisation
        </Link>{" "}
        et notre{" "}
        <Link href="/confidentialite" style={{ color: "var(--bi-ink)", textDecoration: "underline" }}>
          politique de confidentialité
        </Link>.
      </div>
    </AuthShell>
  );
}
