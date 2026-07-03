"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/bi/auth-shell";
import { Mono } from "@/components/bi/ui";
import { supabase } from "@/lib/supabase";

// ── Step 1: Intro ──────────────────────────────────────────────
function StepIntro() {
  return (
    <AuthShell
      step={2}
      total={3}
      eyebrow="Connexion Strava"
      headline={<>Sans Strava,<br />pas de calcul<br />d&apos;usure.</>}
      sub="Ton historique Strava est la matière première qui rend cette app possible. Chaque km roulé alimente automatiquement l'usure et le coût de tes composants."
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "#FC4C02", color: "#fff", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", alignSelf: "flex-start" }}>
        <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: 999, background: "#fff" }} />
        STRAVA
      </div>

      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 14 }}>
        Connecte ton compte Strava
      </div>
      <div style={{ fontSize: 13.5, color: "var(--bi-muted)", marginTop: 8, lineHeight: 1.55 }}>
        Accès en lecture seule. Tu peux révoquer l&apos;autorisation à tout moment depuis tes réglages Strava.
      </div>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          ["Activités passées", "Import en une fois"],
          ["Vélos Strava", "Auto-détection"],
          ["Nouvelles sorties", "Synchro temps réel"],
          ["Données privées", "Jamais partagé"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", border: "1px solid var(--bi-line)", borderRadius: 12, background: "var(--bi-card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: 999, background: "var(--bi-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--bi-accent-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 7" /></svg>
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{k}</span>
            </div>
            <Mono style={{ fontSize: 11, color: "var(--bi-muted)" }}>{v}</Mono>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <a
          href="/api/strava/auth"
          style={{ background: "#FC4C02", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, textDecoration: "none" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-3M20 14a8 8 0 01-14 3" /></svg>
          Se connecter avec Strava
        </a>
      </div>
    </AuthShell>
  );
}

// ── Step 2: Success (retour du callback Strava) ────────────────
function StepSuccess() {
  const [bikes, setBikes] = useState<{ id: string; name: string; model: string | null; total_km: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function importAndFetchBikes() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      // Import idempotent déclenché depuis le client : le déclenchement en
      // arrière-plan depuis le callback n'est pas garanti sur Vercel.
      // Il crée aussi les vélos manquants avant de rattacher les activités.
      await fetch("/api/strava/import", { method: "POST" }).catch(() => {});
      const { data } = await supabase
        .from("bikes")
        .select("id, name, model, total_km")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("total_km", { ascending: false });
      setBikes(data ?? []);
      setLoading(false);
    }
    importAndFetchBikes();
  }, []);

  const totalKm = bikes.reduce((s, b) => s + (b.total_km ?? 0), 0);

  return (
    <AuthShell
      step={3}
      total={3}
      eyebrow="Import terminé"
      headline={
        loading ? <>C&apos;est prêt.</> :
        bikes.length > 0
          ? <>{bikes.length} vélo{bikes.length > 1 ? "s" : ""}.<br />{totalKm.toLocaleString("fr")} km.</>
          : <>C&apos;est prêt.</>
      }
      sub="Tout ton historique Strava est synchronisé. Prochaine étape : configure ton matériel pour démarrer le suivi d'usure."
    >
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--bi-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bi-accent-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 7" /></svg>
      </div>

      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 18 }}>
        C&apos;est prêt.
      </div>
      <div style={{ fontSize: 13.5, color: "var(--bi-muted)", marginTop: 8, lineHeight: 1.55 }}>
        {loading ? "Synchronisation de tes activités Strava… (moins d\u2019une minute)" : `On a détecté ${bikes.length} vélo${bikes.length > 1 ? "s" : ""}. Vérifie qu'ils sont corrects avant de configurer ton matériel.`}
      </div>

      {!loading && bikes.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bi-muted)", marginTop: 26, marginBottom: 10 }}>
            Vélos importés
          </div>
          <div style={{ background: "var(--bi-card)", borderRadius: 14, border: "1px solid var(--bi-line)", overflow: "hidden" }}>
            {bikes.map((b, i) => (
              <div key={b.id} style={{ padding: "14px 18px", borderTop: i > 0 ? "1px solid rgba(14,14,16,0.04)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#F0EFEA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" /><path d="M12 7l-3 10h6l-3-10zM12 7V4h3" /></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{b.name}</div>
                  {b.model && <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>{b.model}</div>}
                </div>
                <Mono style={{ fontSize: 12.5, fontWeight: 500 }}>{(b.total_km ?? 0).toLocaleString("fr")} km</Mono>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <Link href="/onboarding" style={{ textDecoration: "none" }}>
          <button style={{ width: "100%", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            Configurer mon matériel
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </button>
        </Link>
      </div>
    </AuthShell>
  );
}

// ── Router ─────────────────────────────────────────────────────
function StravaConnectRouter() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  // Retour du callback Strava avec succès
  if (success === "true") return <StepSuccess />;

  // Retour avec erreur
  if (error) {
    const errorMessages: Record<string, string> = {
      access_denied: "Tu as refusé l'accès à Strava. Tu peux réessayer quand tu veux.",
      token_exchange: "Erreur lors de la connexion à Strava. Réessaie.",
      db_error: "Erreur lors de la sauvegarde. Contacte le support.",
    };
    return (
      <AuthShell step={2} total={3} eyebrow="Erreur" headline={<>Connexion<br />échouée.</>} sub="">
        <div style={{ padding: "20px", borderRadius: 14, background: "rgba(200,54,46,0.06)", border: "1px solid rgba(200,54,46,0.15)", marginTop: 24 }}>
          <div style={{ fontSize: 14, color: "var(--bi-bad)", fontWeight: 600, marginBottom: 8 }}>Erreur de connexion</div>
          <div style={{ fontSize: 13, color: "var(--bi-muted)" }}>{errorMessages[error] ?? "Une erreur est survenue."}</div>
        </div>
        <a href="/api/strava/auth" style={{ marginTop: 20, display: "block", width: "100%", background: "#FC4C02", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", textAlign: "center", textDecoration: "none" }}>
          Réessayer
        </a>
      </AuthShell>
    );
  }

  return <StepIntro />;
}

export default function StravaConnectPage() {
  return (
    <Suspense fallback={null}>
      <StravaConnectRouter />
    </Suspense>
  );
}
