"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "bi_onboarding_done";

const STEPS = [
  {
    n: 1,
    eyebrow: "Bienvenue sur Bike Insight",
    title: "Ton Strava est connecté.\nVoici comment ça marche.",
    body: "On va analyser tes sorties en temps réel et calculer l'usure de chaque pièce. En 2 minutes, tu auras une vision complète de l'état de ton vélo.",
    visual: (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[
          { icon: "M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-3M20 14a8 8 0 01-14 3", label: "Sync Strava", sub: "Activités importées automatiquement", done: true },
          { icon: "M12 4v4M12 16v4M4 12h4M16 12h4M12 9a3 3 0 100 6 3 3 0 000-6z", label: "Déclare ton matériel", sub: "Chaîne, pneus, cassette…", done: false },
          { icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9", label: "Reçois les alertes", sub: "On te dit quand agir", done: false },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, background: s.done ? "rgba(199,255,63,0.06)" : "rgba(255,255,255,0.04)", border: `1px solid ${s.done ? "rgba(199,255,63,0.2)" : "rgba(255,255,255,0.08)"}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.done ? "var(--bi-accent)" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.done ? "#0E0E10" : "rgba(255,255,255,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon} />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}>{s.label}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{s.sub}</div>
            </div>
            {s.done && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bi-accent)" strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
            )}
          </div>
        ))}
      </div>
    ),
    cta: "Suivant →",
    skip: true,
  },
  {
    n: 2,
    eyebrow: "Étape 2 · 3",
    title: "Déclare ton\npremier composant.",
    body: "Pour calculer l'usure, on a besoin de savoir ce qui est installé sur ton vélo. Commence par la chaîne — c'est le composant qui s'use le plus vite.",
    visual: (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { n: "Chaîne", m: "Ex : Shimano Ultegra HG701", p: "~38 €", prio: true },
          { n: "Pneus", m: "Ex : Continental GP5000", p: "~52 €", prio: false },
          { n: "Cassette", m: "Ex : Ultegra 11-30", p: "~85 €", prio: false },
        ].map((c, i) => (
          <div key={i} style={{ padding: "11px 14px", borderRadius: 10, background: c.prio ? "rgba(199,255,63,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${c.prio ? "rgba(199,255,63,0.25)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: 999, background: c.prio ? "var(--bi-accent)" : "rgba(255,255,255,0.2)", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{c.n}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{c.m}</div>
            </div>
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--bi-font-mono)" }}>{c.p}</span>
          </div>
        ))}
        <div style={{ marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
          Tu peux en ajouter autant que tu veux
        </div>
      </div>
    ),
    cta: "Ajouter mon premier composant",
    ctaHref: "/components/new",
    skip: true,
  },
  {
    n: 3,
    eyebrow: "Étape 3 · 3",
    title: "C'est parti.",
    body: "Après chaque sortie Strava, Bike Insight recalcule automatiquement l'usure. Tu reçois une alerte dès qu'un composant approche de sa limite.",
    visual: (
      <div style={{ padding: "18px 20px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--bi-accent)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Ce qui t'attend</div>
        {[
          "Score de prêt à rouler mis à jour après chaque sortie",
          "Alertes quand une pièce dépasse 80% d'usure",
          "Prévision de coût sur les 3 prochains mois",
          "Comparateur pour choisir le bon remplacement",
        ].map((l, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < 3 ? 12 : 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bi-accent)" strokeWidth="3" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M4 12l5 5L20 7"/></svg>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{l}</span>
          </div>
        ))}
      </div>
    ),
    cta: "Accéder au dashboard",
    skip: false,
  },
];

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const s = STEPS[step];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(14,14,16,0.92)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 520,
        background: "#0E0E10",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 24,
        padding: 36,
        boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
        position: "relative",
      }}>
        {/* Progress dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ height: 3, borderRadius: 999, flex: i === step ? 2 : 1, background: i === step ? "var(--bi-accent)" : i < step ? "rgba(199,255,63,0.3)" : "rgba(255,255,255,0.12)", transition: "all 0.3s" }} />
          ))}
        </div>

        {/* Eyebrow */}
        <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--bi-accent)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>
          {s.eyebrow}
        </div>

        {/* Title */}
        <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.8, lineHeight: 1.15, color: "#fff", marginBottom: 14, whiteSpace: "pre-line" }}>
          {s.title}
        </div>

        {/* Body */}
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 28 }}>
          {s.body}
        </div>

        {/* Visual */}
        <div style={{ marginBottom: 28 }}>
          {s.visual}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          {s.skip && (
            <button
              onClick={dismiss}
              style={{ flex: 1, padding: "12px 0", background: "transparent", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}
            >
              Passer
            </button>
          )}
          {s.ctaHref ? (
            <Link href={s.ctaHref} onClick={dismiss} style={{ flex: 2, textDecoration: "none" }}>
              <button style={{ width: "100%", padding: "13px 0", background: "var(--bi-accent)", color: "#0E0E10", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {s.cta}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </button>
            </Link>
          ) : (
            <button
              onClick={next}
              style={{ flex: s.skip ? 2 : 1, padding: "13px 0", background: "var(--bi-accent)", color: "#0E0E10", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {s.cta}
              {step < STEPS.length - 1 && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
