"use client";

import { useState } from "react";
import { AppShell } from "@/components/bi/app-shell";
import { BiCard, BiLabel, Mono, Dot, PageHead } from "@/components/bi/ui";

const TYPES = ["Chaîne", "Pneus", "Cassette", "Plateaux", "Plaquettes", "Disque", "Câble", "Autre"];
const LIFETIMES = [
  { km: "2 000", label: "Conservateur" },
  { km: "3 000", label: "Recommandé", default: true },
  { km: "4 500", label: "Optimiste" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 10,
  border: "1px solid var(--bi-line)",
  background: "var(--bi-bg)",
  fontSize: 13.5,
  fontWeight: 500,
  color: "var(--bi-ink)",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

export default function NewComponentPage() {
  const [selectedType, setSelectedType] = useState("Chaîne");
  const [selectedLifetime, setSelectedLifetime] = useState("3 000");

  return (
    <AppShell>
      <div style={{ padding: "24px 28px 40px", maxWidth: 900 }}>
        <PageHead
          title="Déclarer un composant"
          breadcrumb={["Composants", "Nouveau"]}
          sub="Toutes les données suivantes sont calculées automatiquement à partir de tes sorties Strava."
        />

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
          {/* Form */}
          <BiCard pad={28}>
            <BiLabel style={{ marginBottom: 12 }}>Type de composant</BiLabel>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 24 }}>
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 10,
                    textAlign: "center",
                    background: selectedType === t ? "var(--bi-ink)" : "var(--bi-card)",
                    color: selectedType === t ? "var(--bi-bg)" : "var(--bi-ink)",
                    border: `1px solid ${selectedType === t ? "var(--bi-ink)" : "var(--bi-line)"}`,
                    fontSize: 12.5,
                    fontWeight: selectedType === t ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <div>
                <BiLabel style={{ marginBottom: 8 }}>Vélo</BiLabel>
                <div style={{ ...inputStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Canyon Aeroad</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="2" strokeLinecap="round"><path d="M7 10l5 5 5-5" /></svg>
                </div>
              </div>
              <div>
                <BiLabel style={{ marginBottom: 8 }}>Modèle (optionnel)</BiLabel>
                <input style={inputStyle} defaultValue="Shimano Ultegra CN-HG701" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div>
                <BiLabel style={{ marginBottom: 8 }}>Prix d&apos;achat</BiLabel>
                <div style={{ ...inputStyle, border: "1.5px solid var(--bi-ink)", display: "flex", alignItems: "baseline", gap: 4 }}>
                  <Mono style={{ fontSize: 15, fontWeight: 500 }}>38</Mono>
                  <span style={{ color: "var(--bi-muted)", fontSize: 12 }}>€</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ width: 2, height: 16, background: "var(--bi-ink)", animation: "blink 1s infinite" }} />
                </div>
              </div>
              <div>
                <BiLabel style={{ marginBottom: 8 }}>Date d&apos;installation</BiLabel>
                <div style={{ ...inputStyle, display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>
                  <Mono style={{ fontSize: 13, fontWeight: 500 }}>14/09/24</Mono>
                </div>
              </div>
              <div>
                <BiLabel style={{ marginBottom: 8 }}>Km à l&apos;installation</BiLabel>
                <div style={{ ...inputStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Mono style={{ fontSize: 13, fontWeight: 500 }}>0 km</Mono>
                  <Mono style={{ fontSize: 10, color: "var(--bi-muted)" }}>via Strava</Mono>
                </div>
              </div>
            </div>

            <BiLabel style={{ marginBottom: 12 }}>Durée de vie estimée</BiLabel>
            <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
              {LIFETIMES.map((l) => (
                <button
                  key={l.km}
                  onClick={() => setSelectedLifetime(l.km)}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: selectedLifetime === l.km ? "var(--bi-ink)" : "var(--bi-card)",
                    color: selectedLifetime === l.km ? "var(--bi-bg)" : "var(--bi-ink)",
                    border: `1px solid ${selectedLifetime === l.km ? "var(--bi-ink)" : "var(--bi-line)"}`,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                  }}
                >
                  <Mono style={{ display: "block", fontSize: 16, fontWeight: 500 }}>{l.km} km</Mono>
                  <div style={{ fontSize: 10.5, color: selectedLifetime === l.km ? "rgba(255,255,255,0.6)" : "var(--bi-muted)", marginTop: 2 }}>{l.label}</div>
                </button>
              ))}
            </div>

            <div style={{ paddingTop: 20, borderTop: "1px solid var(--bi-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button style={{ background: "transparent", color: "var(--bi-muted)", border: "none", padding: "10px 0", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>Annuler</button>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "12px 18px", background: "transparent", color: "var(--bi-ink)", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
                  Enregistrer brouillon
                </button>
                <button style={{ padding: "12px 22px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  Enregistrer
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </BiCard>

          {/* Live preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <BiCard pad={22} style={{ border: "1px solid var(--bi-accent)", background: "rgba(199,255,63,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <Dot color="var(--bi-accent)" />
                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>Estimation en direct</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.3 }}>
                À ton rythme, cette chaîne durera{" "}
                <Mono style={{ color: "var(--bi-ink)" }}>~5 mois</Mono>.
              </div>
              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--bi-line)", borderRadius: 10, overflow: "hidden" }}>
                {[["Fin estimée", "14 fév. 2026"], ["Coût/km", "0,013 €"]].map(([k, v]) => (
                  <div key={k} style={{ background: "var(--bi-card)", padding: "12px 14px" }}>
                    <BiLabel style={{ fontSize: 10 }}>{k}</BiLabel>
                    <Mono style={{ display: "block", fontSize: 14, fontWeight: 500, marginTop: 4 }}>{v}</Mono>
                  </div>
                ))}
              </div>
            </BiCard>

            <BiCard pad={22}>
              <BiLabel style={{ marginBottom: 10 }}>Pourquoi ces estimations ?</BiLabel>
              <div style={{ fontSize: 12.5, color: "var(--bi-muted)", lineHeight: 1.55 }}>
                On combine ton rythme Strava (<Mono style={{ color: "var(--bi-ink)", fontWeight: 600 }}>148 km/sem.</Mono>), ton style (route, terrain plat) et la durée typique du modèle.
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--bi-line)", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                Voir la méthode complète
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M7 7h10v10" /></svg>
              </div>
            </BiCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
