"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/bi/auth-shell";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid var(--bi-line)",
  background: "var(--bi-card)",
  fontSize: 14,
  fontWeight: 500,
  color: "var(--bi-ink)",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Email ou mot de passe incorrect.",
  "Email not confirmed": "Confirme ton email avant de te connecter.",
  "Too many requests": "Trop de tentatives. Réessaie dans quelques minutes.",
};

function translateError(msg: string): string {
  return ERROR_MESSAGES[msg] ?? msg;
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

// Composant isolé pour useSearchParams (requis par Next.js dans un Suspense)
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async () => {
    if (!email || !password) { setError("Remplis tous les champs."); return; }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(translateError(error.message));
      setLoading(false);
    } else {
      // Sync Strava en arrière-plan dès la connexion
      fetch("/api/strava/import", { method: "POST" }).catch(() => {});
      const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
      // Hard reload pour que le middleware lise les cookies de session
      window.location.href = redirectTo;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--bi-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
        Connexion
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 6 }}>
        Connecte-toi
      </div>
      <div style={{ fontSize: 13.5, color: "var(--bi-muted)", marginTop: 8, lineHeight: 1.55 }}>
        Reprends là où tu t&apos;étais arrêté.
      </div>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bi-muted)", marginBottom: 8 }}>Email</div>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} placeholder="ton@email.com" autoFocus style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bi-muted)", marginBottom: 8 }}>Mot de passe</div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} placeholder="••••••••••" style={{ ...inputStyle, border: "1.5px solid var(--bi-ink)" }} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--bi-muted)", textDecoration: "underline" }}>
          Mot de passe oublié ?
        </Link>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "rgba(200,54,46,0.08)", color: "var(--bi-bad)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <button onClick={handleLogin} disabled={loading} style={{ marginTop: 18, width: "100%", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      <div style={{ margin: "22px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: "var(--bi-line)" }} />
        <span style={{ fontSize: 11, color: "var(--bi-muted)", letterSpacing: "0.07em", textTransform: "uppercase" }}>ou</span>
        <div style={{ flex: 1, height: 1, background: "var(--bi-line)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button style={{ background: "transparent", color: "var(--bi-ink)", border: "1px solid var(--bi-line)", borderRadius: 12, padding: "12px 0", fontSize: 13.5, fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
          <GoogleIcon /> Google
        </button>
        <button style={{ background: "transparent", color: "var(--bi-ink)", border: "1px solid var(--bi-line)", borderRadius: 12, padding: "12px 0", fontSize: 13.5, fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer" }}>
          <AppleIcon /> Apple
        </button>
      </div>

      <div style={{ marginTop: 32, fontSize: 12.5, color: "var(--bi-muted)", textAlign: "center" }}>
        Pas encore inscrit ?{" "}
        <Link href="/signup" style={{ color: "var(--bi-ink)", fontWeight: 600, borderBottom: "1px solid var(--bi-ink)", textDecoration: "none" }}>
          Créer un compte
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Connexion"
      headline={<>Bon retour.</>}
      sub="Reprends le suivi de ton matériel là où tu t'étais arrêté."
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
