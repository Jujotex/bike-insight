"use client";

import { ErrorScreen } from "@/components/bi/error-screen";

/**
 * Barrière d'erreur du segment racine.
 *
 * Attrape tout ce qui lève dans une page, y compris les écrans publics —
 * accueil, connexion, inscription, mentions légales. Sans elle, l'utilisateur
 * voyait une page blanche.
 *
 * Ne couvre **pas** les erreurs du layout racine lui-même : c'est le rôle de
 * `global-error.tsx`, qui vit à côté.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen error={error} reset={reset} />;
}
