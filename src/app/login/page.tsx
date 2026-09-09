"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
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

const ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Email ou mot de passe incorrect.",
  "Email not confirmed": "Confirme ton email avant de te connecter.",
  "Too many requests": "Trop de tentatives. Réessaie dans quelques minutes.",
};

function translateError(msg: string): string {
  return ERROR_MESSAGES[msg] ?? msg;
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
      apiFetch("/api/strava/import", { method: "POST" }).catch(() => {});
      const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

      // `router.replace` et non `window.location.href`.
      //
      // Le rechargement complet existait pour que le middleware relise les
      // cookies de session. Il n'a plus d'objet : les pages sont devenues
      // clientes (phase 2.1) et lisent la session directement.
      //
      // Surtout, il **cassait la connexion en natif**. L'export utilise
      // `trailingSlash: true`, donc la page vit à `/dashboard/index.html` ;
      // le serveur local de Capacitor ne trouvait rien à `/dashboard` sans
      // slash et servait la racine — l'utilisateur atterrissait sur la page
      // d'accueil après une connexion pourtant réussie.
      //
      // `replace` plutôt que `push` : revenir sur l'écran de connexion une
      // fois connecté n'a pas de sens, et le bouton retour d'Android y
      // ramènerait.
      router.replace(redirectTo);
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
      <div style={{ fontSize: 13, color: "var(--bi-muted)", marginTop: 8, lineHeight: 1.55 }}>
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
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "var(--bi-bad-soft)", color: "var(--bi-bad)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <button onClick={handleLogin} disabled={loading} style={{ marginTop: 18, width: "100%", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      <div style={{ marginTop: 32, fontSize: 13, color: "var(--bi-muted)", textAlign: "center" }}>
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
