"use client";

import { ErrorScreen } from "@/components/bi/error-screen";

/**
 * Dernier filet : erreurs survenues dans le **layout racine** lui-même.
 *
 * `error.tsx` vit à l'intérieur du layout ; si c'est le layout qui lève, il ne
 * peut rien attraper. `global-error.tsx` le remplace entièrement — d'où les
 * balises `<html>` et `<body>` écrites ici, qu'aucun autre fichier de
 * l'application ne porte.
 *
 * Conséquence à connaître : les polices et les variables de thème, chargées par
 * le layout racine, ne sont pas disponibles à ce niveau. L'écran s'affichera donc
 * avec les valeurs de repli déclarées ci-dessous plutôt qu'avec la charte. C'est
 * volontaire — un écran laid mais lisible vaut mieux qu'une page blanche, et ce
 * cas ne doit jamais se produire en production.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          // Le layout racine n'ayant pas tourné, les tokens `--bi-*` ne sont pas
          // définis : on donne une valeur de repli à chacun.
          ["--bi-bg" as string]: "#F4F4EF",
          ["--bi-ink" as string]: "#0E0E10",
          ["--bi-muted" as string]: "#6B6B70",
          ["--bi-line" as string]: "#E3E3DC",
          ["--bi-bad" as string]: "#C2410C",
          ["--bi-bad-soft" as string]: "#FDE7DC",
          ["--bi-font-mono" as string]: "ui-monospace, monospace",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <ErrorScreen error={error} reset={reset} />
      </body>
    </html>
  );
}
