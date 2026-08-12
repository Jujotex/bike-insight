"use client";

import { useState } from "react";

/**
 * Composants de marque Strava — conformes aux Brand Guidelines.
 * https://developers.strava.com/guidelines/ (révision du 29 septembre 2025)
 *
 * Les visuels officiels sont versionnés dans `public/strava/` (voir le README du
 * dossier). Un repli **texte** — lui aussi conforme (section 4 : « Powered by Strava »
 * en clair) — protège l'affichage si un asset venait à manquer du build.
 *
 * Règles appliquées ici :
 * - section 1.1 : le bouton officiel mesure 48px de haut @1x ;
 * - section 1.2 : le logo « Powered by Strava » n'est ni modifié ni animé ;
 * - section 2   : le logo reste séparé et jamais plus proéminent que la marque
 *                 Bike Insight, et n'est jamais utilisé comme icône d'app.
 */

const CONNECT_BTN_SRC = "/strava/connect-with-strava-orange.svg";
const POWERED_BY_SRC = "/strava/powered-by-strava-horizontal-orange.svg";

/** Section 1.1 — hauteur imposée du bouton officiel. */
const CONNECT_BTN_HEIGHT = 48;

interface ConnectProps {
  /** Route serveur qui redirige vers https://www.strava.com/oauth/authorize (section 1.1). */
  href?: string;
  /** Libellé du repli texte, si l'asset officiel n'est pas déposé. */
  label?: string;
  style?: React.CSSProperties;
}

/**
 * Bouton « Connect with Strava » officiel.
 * Le repli est volontairement **neutre** (encre, pas d'orange Strava) : reprendre
 * la couleur de marque sans utiliser l'asset officiel est précisément ce que les
 * guidelines proscrivent.
 */
export function StravaConnectButton({
  href = "/api/strava/auth",
  label = "Se connecter avec Strava",
  style,
}: ConnectProps) {
  const [assetMissing, setAssetMissing] = useState(false);

  if (assetMissing) {
    return (
      <a
        href={href}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: CONNECT_BTN_HEIGHT,
          padding: "10px 16px",
          background: "var(--bi-ink)",
          color: "var(--bi-bg)",
          borderRadius: 10,
          fontWeight: 600,
          textDecoration: "none",
          ...style,
        }}
        className="bi-text-md"
      >
        {label}
      </a>
    );
  }

  return (
    <a
      href={href}
      style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", ...style }}
      aria-label={label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- asset de marque déposé tel quel,
          l'optimiseur Next ne doit ni redimensionner ni recompresser un logo sous guidelines. */}
      <img
        src={CONNECT_BTN_SRC}
        alt={label}
        height={CONNECT_BTN_HEIGHT}
        style={{ height: CONNECT_BTN_HEIGHT, width: "auto", display: "block" }}
        onError={() => setAssetMissing(true)}
      />
    </a>
  );
}

interface PoweredByProps {
  /** Hauteur du logo. Rester discret : il ne doit jamais dominer la marque Bike Insight. */
  height?: number;
  style?: React.CSSProperties;
}

/** Attribution « Powered by Strava » — obligatoire sur les écrans affichant des données Strava. */
export function PoweredByStrava({ height = 20, style }: PoweredByProps) {
  const [assetMissing, setAssetMissing] = useState(false);

  if (assetMissing) {
    return (
      <span
        className="bi-text-xs"
        style={{ color: "var(--bi-muted)", fontWeight: 500, ...style }}
      >
        Powered by Strava
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- voir commentaire ci-dessus.
    <img
      src={POWERED_BY_SRC}
      alt="Powered by Strava"
      height={height}
      style={{ height, width: "auto", display: "block", ...style }}
      onError={() => setAssetMissing(true)}
    />
  );
}

/** Bandeau d'attribution discret, placé en fin de contenu des pages de l'app. */
export function StravaAttributionFooter() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "20px 22px 28px",
      }}
    >
      <PoweredByStrava />
    </div>
  );
}

/*
 * Pas de composant « View on Strava » ici : la section 3 des guidelines est
 * *conditionnelle* (« if you choose to link back to any original Strava data
 * sources »), et l'app n'affiche aujourd'hui aucune sortie individuelle — que des
 * agrégats (graphiques, totaux km). Ajouter une liste de sorties dans le seul but
 * d'afficher un lien serait de la fonctionnalité de complaisance.
 *
 * Si une liste de sorties apparaît un jour : libellé **exactement** « View on Strava »,
 * lien identifiable (gras, souligné, ou orange #FC5200 → `var(--bi-strava)`),
 * vers `https://www.strava.com/activities/<strava_id>`.
 */
