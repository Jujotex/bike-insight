"use client";

import { useRouter } from "next/navigation";

// Vrai retour navigateur : ramène là d'où l'utilisateur vient (dashboard, fiche…),
// pas vers une page fixe. Repli sur `fallback` si pas d'historique.
export function BackButton({ label = "← Retour", fallback }: { label?: string; fallback?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.back();
        else if (fallback) router.push(fallback);
        else router.back();
      }}
      style={{ padding: "10px 16px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}
    >
      {label}
    </button>
  );
}
