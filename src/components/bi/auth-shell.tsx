import React from "react";
import { Mono } from "./ui";

interface AuthShellProps {
  step?: number;
  total?: number;
  eyebrow: string;
  headline: React.ReactNode;
  sub: string;
  children: React.ReactNode;
}

const METRICS = [
  ["12 €", "économie mensuelle moyenne"],
  ["2,1×", "durée de vie composant"],
  ["142", "pièces suivies"],
];

export function AuthShell({ step, total, eyebrow, headline, sub, children }: AuthShellProps) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bi-bg)",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {/* LEFT panel — brand + value */}
      <div
        className="hidden md:flex"
        style={{
          width: 600,
          flexShrink: 0,
          background: "var(--bi-ink)",
          color: "var(--bi-white)",
          padding: "40px 56px",
          flexDirection: "column",
        }}
      >
        {/* Brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "var(--bi-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--bi-ink)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 18l4-8 4 6 4-10 4 8" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3 }}>
            Bike Insight
          </span>
        </div>

        {/* Main copy — centered vertically */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: 440,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--bi-accent)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 600,
              letterSpacing: -1.8,
              lineHeight: 1.05,
              marginTop: 16,
            }}
          >
            {headline}
          </div>
          <div
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.6)",
              marginTop: 18,
              lineHeight: 1.55,
            }}
          >
            {sub}
          </div>

          {/* Metric strip */}
          <div style={{ marginTop: 56, display: "flex", gap: 36 }}>
            {METRICS.map(([v, k]) => (
              <div key={k}>
                <Mono
                  style={{
                    display: "block",
                    fontSize: 28,
                    fontWeight: 500,
                    letterSpacing: -0.8,
                  }}
                >
                  {v}
                </Mono>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                    marginTop: 4,
                    maxWidth: 110,
                    lineHeight: 1.4,
                  }}
                >
                  {k}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: version + step indicator */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          <Mono>v 0.4.2 · beta</Mono>
          {step && total && (
            <Mono>
              Étape {step} / {total}
            </Mono>
          )}
        </div>
      </div>

      {/* RIGHT panel — form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          overflow: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
