"use client";

// La démo rend le vrai dashboard : tous ses liens internes pointent vers des
// pages protégées, qui redirigeraient le visiteur vers /login — exactement le
// problème que la démo est censée régler. On intercepte donc le clic au niveau
// du conteneur plutôt que de dénaturer le dashboard avec un mode « démo ».
//
// Deux liens restent vivants : l'inscription et la connexion.

import { showToast } from "@/components/bi/toast";

const ALLOWED = ["/signup", "/login", "/confidentialite", "/"];

export function DemoGuard({ children }: { children: React.ReactNode }) {
  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    const link = (e.target as HTMLElement).closest("a");
    if (!link) return;

    const href = link.getAttribute("href") ?? "";
    // Liens externes (attribution Strava…) et sorties autorisées : on laisse faire.
    if (!href.startsWith("/") || ALLOWED.includes(href)) return;

    e.preventDefault();
    showToast("Démo en lecture seule — crée ton compte pour tes vraies données");
  }

  return <div onClick={onClick}>{children}</div>;
}
