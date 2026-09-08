"use client";

import { useEffect, useState } from "react";

/**
 * Écran affiché quand un rendu a levé.
 *
 * ## Pourquoi ça existe
 *
 * Sans barrière d'erreur, React démonte l'arbre et l'utilisateur voit une **page
 * blanche**. Sur le web c'est déjà mauvais ; dans une application installée c'est
 * une impasse totale — pas de console, pas de barre d'adresse, rien à raconter au
 * support. Et côté éditeur, on ne l'apprend jamais : les journaux Vercel ne voient
 * que les routes API, pas ce qui se passe dans la WebView.
 *
 * ## Ce que l'écran doit fournir
 *
 * Un **recours** — `reset()` retente le rendu, ce qui suffit pour une erreur
 * transitoire — et une **sortie** vers un écran sain, pour ne pas laisser
 * quelqu'un coincé.
 *
 * Et un **identifiant**. C'est le détail qui change tout en support : « ça
 * plante » est indébogable, « erreur a3f9c2 sur la fiche pièce » se retrouve dans
 * les journaux en quelques secondes. Next fournit `digest` pour les erreurs
 * serveur ; côté client il n'y en a pas, on en fabrique un à partir du message.
 */

/**
 * Empreinte courte et stable d'un message d'erreur.
 *
 * Deux utilisateurs qui rencontrent le même bug citent le même code, ce qui
 * permet de les regrouper sans outil. Volontairement non cryptographique : il
 * s'agit d'un repère de conversation, pas d'un secret.
 */
function empreinte(texte: string): string {
  let h = 0;
  for (let i = 0; i < texte.length; i++) {
    h = (h << 5) - h + texte.charCodeAt(i);
    h |= 0; // repasse en entier 32 bits
  }
  return Math.abs(h).toString(16).slice(0, 6).padStart(6, "0");
}

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  /** Où renvoyer l'utilisateur. Le tableau de bord n'existe pas hors connexion. */
  accueil?: string;
}

export function ErrorScreen({ error, reset, accueil = "/" }: Props) {
  const [code] = useState(() => error.digest ?? empreinte(error.message || "inconnue"));

  useEffect(() => {
    // La console reste utile en développement et sur le web. En natif elle ne
    // mène nulle part — c'est la collecte distante qui prend le relais.
    console.error("[erreur]", code, error);
  }, [code, error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bi-bg)",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            margin: "0 auto 20px",
            background: "var(--bi-bad-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--bi-bad)"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 8v5M12 17h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>

        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.4, color: "var(--bi-ink)" }}>
          Quelque chose s&apos;est mal passé
        </div>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--bi-muted)",
            marginTop: 10,
            marginBottom: 24,
          }}
        >
          Cet écran n&apos;a pas pu s&apos;afficher. Tes données ne sont pas affectées — réessaie,
          ou reviens à l&apos;accueil.
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              padding: "12px 20px",
              background: "var(--bi-ink)",
              color: "var(--bi-bg)",
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
          {/* `<a>` et non `<Link>` : on sort d'un arbre React en erreur, et un
              rechargement complet repart d'un état propre. Le slash final est
              indispensable — `trailingSlash: true` fait vivre les pages dans un
              dossier, et une URL sans slash sert la racine en natif. */}
          <a
            href={accueil.endsWith("/") ? accueil : `${accueil}/`}
            style={{
              padding: "12px 20px",
              background: "transparent",
              color: "var(--bi-ink)",
              border: "1px solid var(--bi-line)",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Retour à l&apos;accueil
          </a>
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 11,
            color: "var(--bi-muted)",
            fontFamily: "var(--bi-font-mono)",
          }}
        >
          Code d&apos;erreur : {code}
        </div>
      </div>
    </div>
  );
}
