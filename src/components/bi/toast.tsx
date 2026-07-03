"use client";

// Toasts de confirmation — feedback léger après chaque action d'écriture.
// Usage : import { showToast } puis showToast("Entretien enregistré").
// Le <Toaster /> est monté par AppShell. Si aucun Toaster n'est monté au
// moment de l'appel (navigation en cours), le message est mis en attente
// dans sessionStorage et affiché au montage suivant.

import { useEffect, useState } from "react";

const PENDING_KEY = "bi_toast_pending";
let toasterMounted = false;

export function showToast(msg: string) {
  if (typeof window === "undefined") return;
  if (toasterMounted) {
    window.dispatchEvent(new CustomEvent("bi-toast", { detail: msg }));
  } else {
    sessionStorage.setItem(PENDING_KEY, msg);
  }
}

type Toast = { id: number; msg: string };

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toasterMounted = true;

    function push(msg: string) {
      const id = Date.now() + Math.random();
      setToasts(t => [...t, { id, msg }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
    }

    function onToast(e: Event) {
      push((e as CustomEvent).detail as string);
    }

    // Message en attente d'une navigation précédente
    const pending = sessionStorage.getItem(PENDING_KEY);
    if (pending) {
      sessionStorage.removeItem(PENDING_KEY);
      push(pending);
    }

    window.addEventListener("bi-toast", onToast);
    return () => {
      toasterMounted = false;
      window.removeEventListener("bi-toast", onToast);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 300, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "11px 20px", borderRadius: 999,
            background: "var(--bi-ink)", color: "var(--bi-bg)",
            fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            animation: "bi-toast-in 0.2s ease-out",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bi-accent)" strokeWidth="3" strokeLinecap="round"><path d="M4 12l5 5L20 7" /></svg>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
