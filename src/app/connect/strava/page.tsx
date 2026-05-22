"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/bi/auth-shell";
import { Mono } from "@/components/bi/ui";

type Step = "intro" | "auth" | "importing" | "success";
const STEP_ORDER: Step[] = ["intro", "auth", "importing", "success"];

// ── Step 1: Intro ──────────────────────────────────────────────
function StepIntro({ onNext }: { onNext: () => void }) {
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

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={onNext}
          style={{ background: "#FC4C02", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-3M20 14a8 8 0 01-14 3" /></svg>
          Se connecter avec Strava
        </button>
        <button style={{ background: "transparent", color: "var(--bi-muted)", border: "none", padding: "8px 0", fontSize: 12.5, fontFamily: "inherit", cursor: "pointer" }}>
          Continuer sans Strava
        </button>
      </div>
    </AuthShell>
  );
}

// ── Step 2: Authorize (browser-frame mock) ─────────────────────
function StepAuth({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ width: "100%", height: "100dvh", background: "#1a1a1c", color: "var(--bi-ink)", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
      {/* Simulated browser chrome bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 44, background: "#0E0E10", display: "flex", alignItems: "center", padding: "0 20px", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 11, height: 11, borderRadius: 999, background: "#FF5F57" }} />
          <div style={{ width: 11, height: 11, borderRadius: 999, background: "#FEBC2E" }} />
          <div style={{ width: 11, height: 11, borderRadius: 999, background: "#28C840" }} />
        </div>
        <div style={{ flex: 1, maxWidth: 600, margin: "0 auto", background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "5px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7a7a85" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <Mono style={{ fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>strava.com/oauth/authorize?client_id=bike-insight&...</Mono>
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Modal card */}
      <div style={{ width: 520, background: "#fff", color: "#0E0E10", borderRadius: 20, boxShadow: "0 40px 80px -20px rgba(0,0,0,0.6)", overflow: "hidden", border: "1px solid rgba(14,14,16,0.08)" }}>
        {/* Orange header strip */}
        <div style={{ padding: "20px 28px", background: "#FC4C02", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.3 }}>St</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Strava</div>
              <div style={{ fontSize: 10.5, opacity: 0.8 }}>Page d&apos;autorisation (logo officiel à intégrer)</div>
            </div>
          </div>
          <Mono style={{ fontSize: 11, opacity: 0.7 }}>oauth/v2</Mono>
        </div>

        <div style={{ padding: "32px 32px 28px" }}>
          {/* App pair icons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 24 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--bi-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bi-accent-ink)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l4-8 4 6 4-10 4 8" /></svg>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map((i) => <div key={i} style={{ width: 4, height: 4, borderRadius: 999, background: "#6B6B72" }} />)}
            </div>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#FC4C02", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: -0.6 }}>St</span>
            </div>
          </div>

          <div style={{ textAlign: "center", fontSize: 20, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.3 }}>
            Bike Insight souhaite accéder<br />à ton compte Strava
          </div>
          <div style={{ textAlign: "center", fontSize: 12.5, color: "#6B6B72", marginTop: 8, lineHeight: 1.5 }}>
            Connecté en tant que <Mono style={{ color: "#0E0E10", fontWeight: 600 }}>leo.martin@strava</Mono>
          </div>

          {/* Permissions */}
          <div style={{ marginTop: 26, padding: 18, border: "1px solid rgba(14,14,16,0.08)", borderRadius: 12, background: "var(--bi-bg)" }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#6B6B72", marginBottom: 14 }}>
              Permissions demandées
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["Lecture de toutes tes activités", "activity:read_all"],
                ["Liste de tes vélos et profil", "profile:read_all"],
              ].map(([k, v]) => (
                <div key={String(k)} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 999, border: "1.5px solid var(--bi-ok)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 7" /></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{k}</div>
                    <Mono style={{ fontSize: 10.5, color: "#6B6B72", display: "block", marginTop: 2 }}>{String(v)}</Mono>
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingTop: 8, borderTop: "1px solid rgba(14,14,16,0.04)" }}>
                <div style={{ width: 18, height: 18, borderRadius: 999, border: "1.5px solid rgba(14,14,16,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B6B72" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#6B6B72", textDecoration: "line-through" }}>Écriture sur tes activités</div>
                  <div style={{ fontSize: 11, color: "#6B6B72", marginTop: 2 }}>Jamais demandé — lecture seule</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10 }}>
            <button style={{ background: "transparent", color: "#0E0E10", border: "1px solid rgba(14,14,16,0.08)", borderRadius: 12, padding: "13px 0", fontSize: 13.5, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
              Refuser
            </button>
            <button
              onClick={onNext}
              style={{ background: "#FC4C02", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              Autoriser
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </button>
          </div>

          <div style={{ marginTop: 18, fontSize: 11, color: "#6B6B72", textAlign: "center", lineHeight: 1.5 }}>
            Tu pourras révoquer cette autorisation à tout moment depuis<br />
            <Mono style={{ color: "#0E0E10" }}>strava.com/settings/apps</Mono>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Importing ──────────────────────────────────────────
function StepImporting({ onNext }: { onNext: () => void }) {
  const progress = 0.68;
  return (
    <AuthShell
      step={3}
      total={3}
      eyebrow="Import en cours"
      headline={<>On récupère<br />tes 18 derniers<br />mois d&apos;activité.</>}
      sub="Ça prend généralement moins d'une minute. Tu peux fermer cet onglet, on continue en arrière-plan et on t'envoie un email quand c'est fini."
    >
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bi-muted)" }}>
        Progression
      </div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <Mono style={{ fontSize: 56, fontWeight: 500, letterSpacing: -2, lineHeight: 1 }}>{Math.round(progress * 100)}</Mono>
          <Mono style={{ fontSize: 22, color: "var(--bi-muted)" }}>%</Mono>
        </div>
        <Mono style={{ fontSize: 12, color: "var(--bi-muted)" }}>{Math.round(142 * progress)} / 142 activités</Mono>
      </div>
      <div style={{ marginTop: 14, height: 6, borderRadius: 999, background: "var(--bi-line)", overflow: "hidden" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: "var(--bi-accent)", borderRadius: 999 }} />
      </div>

      <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          ["Authentification Strava", "done", "OK"],
          ["Détection des vélos", "done", "3 trouvés"],
          ["Import des activités · 18 mois", "doing", "97 / 142"],
          ["Calcul de l'usure", "pending", "—"],
          ["Génération des insights", "pending", "—"],
        ].map(([k, state, v]) => {
          const isDone = state === "done";
          const isDoing = state === "doing";
          const color = isDone ? "var(--bi-ok)" : isDoing ? "var(--bi-accent)" : "var(--bi-line)";
          return (
            <div key={String(k)} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 22, height: 22, borderRadius: 999, border: isDone ? "none" : `1.5px solid ${color}`, background: isDone ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {isDone && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--bi-bg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 7" /></svg>
                )}
                {isDoing && <div style={{ width: 8, height: 8, borderRadius: 999, background: color }} />}
              </div>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: isDoing ? 600 : 500, color: state === "pending" ? "var(--bi-muted)" : "var(--bi-ink)" }}>{String(k)}</span>
              <Mono style={{ fontSize: 11.5, color: isDoing ? "var(--bi-ink)" : "var(--bi-muted)", fontWeight: isDoing ? 600 : 400 }}>{String(v)}</Mono>
            </div>
          );
        })}
      </div>
    </AuthShell>
  );
}

// ── Step 4: Success ────────────────────────────────────────────
function StepSuccess() {
  const bikes = [
    { name: "Canyon Aeroad", model: "CF SLX 8", sorties: 87, km: 2840 },
    { name: "Specialized Tarmac", model: "SL7 Comp", sorties: 38, km: 1120 },
    { name: "Cube Reaction", model: "Hardtail C:62", sorties: 17, km: 540 },
  ];

  return (
    <AuthShell
      step={3}
      total={3}
      eyebrow="Import terminé"
      headline={<>3 vélos.<br />142 sorties.<br />4 500 km.</>}
      sub="Tout ton historique Strava est synchronisé. Prochaine étape : déclare le matériel installé sur ton vélo principal pour démarrer le suivi d'usure."
    >
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--bi-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--bi-accent-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 7" /></svg>
      </div>

      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, marginTop: 18 }}>
        C&apos;est prêt.
      </div>
      <div style={{ fontSize: 13.5, color: "var(--bi-muted)", marginTop: 8, lineHeight: 1.55 }}>
        On a détecté 3 vélos. Vérifie qu&apos;ils sont corrects avant de déclarer ton matériel.
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--bi-muted)", marginTop: 26, marginBottom: 10 }}>
        Vélos importés
      </div>
      <div style={{ background: "var(--bi-card)", borderRadius: 14, border: "1px solid var(--bi-line)", overflow: "hidden" }}>
        {bikes.map((b, i) => (
          <div key={b.name} style={{ padding: "14px 18px", borderTop: i > 0 ? "1px solid rgba(14,14,16,0.04)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#F0EFEA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="17" r="3" /><circle cx="19" cy="17" r="3" /><path d="M12 7l-3 10h6l-3-10zM12 7V4h3" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{b.name}</div>
              <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>{b.model} · {b.sorties} sorties</div>
            </div>
            <Mono style={{ fontSize: 12.5, fontWeight: 500 }}>{b.km.toLocaleString("fr")} km</Mono>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/components/new" style={{ textDecoration: "none" }}>
          <button style={{ width: "100%", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            Déclarer mon matériel
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
          </button>
        </Link>
      </div>
    </AuthShell>
  );
}

// ── Router ─────────────────────────────────────────────────────
export default function StravaConnectPage() {
  const [step, setStep] = useState<Step>("intro");
  const stepIndex = STEP_ORDER.indexOf(step);

  const next = () => {
    const nextStep = STEP_ORDER[stepIndex + 1];
    if (nextStep) setStep(nextStep);
  };

  if (step === "intro") return <StepIntro onNext={next} />;
  if (step === "auth") return <StepAuth onNext={next} />;
  if (step === "importing") return <StepImporting onNext={next} />;
  return <StepSuccess />;
}
