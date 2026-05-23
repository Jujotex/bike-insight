"use client";

import { useState } from "react";

export function SyncButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ imported: number } | null>(null);

  async function handleSync() {
    setStatus("loading");
    setResult(null);
    try {
      const res = await fetch("/api/strava/import", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        setStatus("done");
        // Recharge la page pour afficher les nouvelles données
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {status === "done" && result && (
        <span style={{ fontSize: 12, color: "var(--bi-ok)", fontWeight: 500 }}>
          ✓ {result.imported} activité{result.imported !== 1 ? "s" : ""} importée{result.imported !== 1 ? "s" : ""}
        </span>
      )}
      {status === "error" && (
        <span style={{ fontSize: 12, color: "var(--bi-bad)", fontWeight: 500 }}>Erreur — réessaie</span>
      )}
      <button
        onClick={handleSync}
        disabled={status === "loading"}
        style={{
          padding: "9px 16px",
          background: status === "loading" ? "rgba(252,76,2,0.6)" : "#FC4C02",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontSize: 12.5,
          fontWeight: 600,
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: status === "loading" ? "not-allowed" : "pointer",
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
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
