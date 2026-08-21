// Démo publique — le vrai dashboard, rendu sans session, sur un jeu de données
// fictives (`lib/demo-data.ts`).
//
// Pourquoi cette page existe : le héros de la landing proposait « Voir une
// démo » vers /dashboard, qui redirige vers /login dès qu'on n'a pas de
// session. La promesse était donc cassée pour tout visiteur non connecté —
// c'est-à-dire exactement la cible du bouton.
//
// Pourquoi le vrai composant plutôt qu'une maquette : une maquette diverge du
// produit à la première évolution. Ici le typecheck casse si les props du
// dashboard changent, et ce qu'on montre est ce qu'on livre.
//
// Cette page vit hors du groupe (app) : pas de layout authentifié, donc aucun
// appel Supabase. La nav latérale reçoit ses props en dur.

import Link from "next/link";
import { AppShell } from "@/components/bi/app-shell";
import { SideNav } from "@/components/bi/side-nav";
import { DashboardClient } from "@/app/(app)/dashboard/client";
import { DEMO_BIKES, DEMO_DASHBOARD } from "@/lib/demo-data";
import { DemoGuard } from "./demo-guard";

export const metadata = {
  title: "Démo — Bike Insight",
  description: "Le tableau de bord Bike Insight sur un vélo d'exemple, sans compte.",
};

// ⚠️ Sans ceci, la page serait figée à la date du BUILD.
// Elle n'appelle aucune API dynamique (pas de session, pas de base) : Next la
// prérend donc au build, `new Date()` compris. En dev on ne voit rien — tout
// est re-rendu à chaque requête —, mais en production l'en-tête afficherait
// éternellement le jour du déploiement. Une heure de fraîcheur suffit pour un
// libellé de date, et la page reste servie depuis le cache.
export const revalidate = 3600;

function DemoBanner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
        padding: "10px 16px",
        borderRadius: 14,
        background: "var(--bi-accent-soft)",
        border: "1px solid var(--bi-line)",
        marginBottom: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.6,
            padding: "3px 8px",
            borderRadius: 999,
            background: "var(--bi-ink)",
            color: "var(--bi-bg)",
            flexShrink: 0,
          }}
        >
          DÉMO
        </span>
        {/* Mention explicite : la page affiche l'attribution « Powered by Strava »
            en pied de contenu (obligatoire dans l'app), et rien ne doit laisser
            croire que ces chiffres viennent d'un compte Strava réel. */}
        <span style={{ fontSize: 13, color: "var(--bi-ink)" }}>
          Vélo et chiffres fictifs. Aucune donnée réelle, aucun compte nécessaire.
        </span>
      </div>
      <Link href="/signup" style={{ textDecoration: "none", flexShrink: 0 }}>
        <button
          style={{
            padding: "10px 16px",
            background: "var(--bi-ink)",
            color: "var(--bi-bg)",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Connecter mon Strava
        </button>
      </Link>
    </div>
  );
}

export default function DemoPage() {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <DemoGuard>
      <AppShell
        nav={
          <SideNav
            bikes={DEMO_BIKES}
            userInitials="LD"
            userName="Léo (démo)"
            bikeCount={DEMO_BIKES.length}
            unreadCount={0}
          />
        }
      >
        <div className="bi-page">
          <DemoBanner />
          <DashboardClient todayCap={todayCap} {...DEMO_DASHBOARD} />
        </div>
      </AppShell>
    </DemoGuard>
  );
}
