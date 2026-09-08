"use client";

import { ErrorScreen } from "@/components/bi/error-screen";

/**
 * Barrière d'erreur des écrans authentifiés.
 *
 * Distincte de celle du segment racine pour une seule raison, mais elle compte :
 * la sortie de secours renvoie ici vers le **tableau de bord**, pas vers la page
 * d'accueil. Quelqu'un de connecté qui rencontre une erreur sur la fiche d'une
 * pièce n'a rien à faire sur la landing commerciale ; il veut revenir dans son
 * application.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen error={error} reset={reset} accueil="/dashboard" />;
}
