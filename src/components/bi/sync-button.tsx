"use client";

import { useState } from "react";

interface Props {
  stravaConnected: boolean;
}

export function SyncButton({ stravaConnected }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ imported: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSync() {
    setStatus("loading");
    setResult(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/strava/import", { method: "POST" });
      let body: { imported?: number; error?: string } = {};
      try { body = await res.json() } catch { /* empty body */ }

      if (res.ok) {
        setResult({ imported: body.imported ?? 0 });
        setStatus("done");
        setTimeout(() => window.location.reload(), 2000);
      } else if (res.status === 401) {
        setErrorMsg("Token Strava expiré — reconnecte ton compte");
        setStatus("error");
      } else {
        setErrorMsg(body.error ?? "Erreur serveur");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Impossible de joindre le serveur");
      setStatus("error");
    }
  }

  if (!stravaConnected) {
    return (
      <a href="/connect/strava" style={{ textDecoration: "none" }}>
        <button style={{
          padding: "10px 16px", background: "var(--bi-strava)", color: "var(--bi-white)", border: "none",
          borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bi-white)" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Connecter Strava
        </button>
      </a>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {status === "done" && result && (
        <span style={{ fontSize: 12, color: "var(--bi-ok)", fontWeight: 500 }}>
          ✓ {result.imported} activité{result.imported !== 1 ? "s" : ""} importée{result.imported !== 1 ? "s" : ""}
        </span>
      )}
      {status === "error" && errorMsg && (
        <span style={{ fontSize: 12, color: "var(--bi-bad)", fontWeight: 500, maxWidth: 220 }}>
          {errorMsg}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={status === "loading"}
        style={{
          padding: "10px 16px",
          background: status === "loading" ? "rgba(252,76,2,0.6)" : "var(--bi-strava)",
          color: "var(--bi-white)", border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 600, fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 6,
          cursor: status === "loading" ? "not-allowed" : "pointer",
        }}
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="var(--bi-white)" strokeWidth="2" strokeLinecap="round"
          style={{ animation: status === "loading" ? "spin 1s linear infinite" : "none" }}
        >
          <path d="M4 4v6h6M20 20v-6h-6M4 10a8 8 0 0114-3M20 14a8 8 0 01-14 3" />
        </svg>
        {status === "loading" ? "Sync en cours…" : "Resynchroniser"}
      </button>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
