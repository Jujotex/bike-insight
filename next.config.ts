import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * Deux sorties de build depuis un seul dépôt.
 *
 * **Vercel** (par défaut) : rendu serveur + routes API. Rien ne change.
 *
 * **Capacitor** (`CAPACITOR_BUILD=1`) : export statique de l'interface seule, dans
 * `out/`, pour être embarqué dans le binaire mobile. Les routes API restent sur
 * Vercel et sont appelées à distance — c'est `NEXT_PUBLIC_API_BASE_URL` qui leur
 * donne une adresse absolue (cf. `lib/api.ts`).
 *
 * Next refuse `output: "export"` en présence de route handlers : le script
 * `scripts/build-capacitor.mjs` écarte temporairement `src/app/api` pendant ce
 * build. Ne pas lancer `CAPACITOR_BUILD=1 next build` à la main sans lui.
 */
const isCapacitorBuild = process.env.CAPACITOR_BUILD === "1";

const nextConfig: NextConfig = isCapacitorBuild
  ? {
      output: "export",
      // Génère `/bikes/detail/index.html` plutôt que `/bikes/detail.html` :
      // une WebView qui sert des fichiers locaux résout mieux les dossiers.
      trailingSlash: true,
      // Requis en mode export — l'optimiseur d'images a besoin d'un serveur.
      images: { unoptimized: true },
    }
  : {
      /**
       * CORS sur les routes API, pour l'app native.
       *
       * L'app embarquée appelle le backend depuis `capacitor://localhost` : c'est
       * une autre origine, donc le navigateur exige une autorisation explicite.
       * Sans ces en-têtes, la requête préalable `OPTIONS` — déclenchée par
       * l'en-tête `Authorization` — échoue et l'appel n'est jamais envoyé.
       *
       * **Pourquoi `*` est ici le choix sûr, et pas un relâchement.** Le navigateur
       * **interdit** de combiner `Access-Control-Allow-Origin: *` avec l'envoi
       * d'identifiants. Un site malveillant ne peut donc pas exploiter le cookie de
       * session d'un utilisateur connecté : sa requête serait bloquée. Et il ne
       * peut pas non plus obtenir le jeton, rangé dans le stockage de l'app,
       * inaccessible depuis une autre origine.
       *
       * Nommer explicitement les origines Capacitor serait plus restrictif en
       * apparence, mais obligerait à autoriser les identifiants — donc à rouvrir la
       * porte que `*` ferme. C'est pour cette raison que `lib/api.ts` n'envoie
       * délibérément pas `credentials: 'include'`.
       *
       * Next implémente `OPTIONS` automatiquement pour les route handlers : la
       * réponse préalable portera ces en-têtes sans code supplémentaire.
       */
      async headers() {
        return [
          {
            source: "/api/:path*",
            headers: [
              { key: "Access-Control-Allow-Origin", value: "*" },
              { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
              { key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type" },
              // Évite de refaire une requête préalable à chaque appel.
              { key: "Access-Control-Max-Age", value: "86400" },
            ],
          },
        ];
      },
    };

/**
 * Enveloppe Sentry.
 *
 * Elle fait deux choses : téléverser les *source maps* au build, et instrumenter
 * le code serveur.
 *
 * **Le téléversement des source maps est l'intérêt principal.** Sans lui, une
 * erreur de production ressemble à `a is not a function, ligne 1 colonne 48312`
 * — le code est minifié, la trace ne désigne rien. Avec, Sentry pointe le
 * fichier et la ligne d'origine. C'est la différence entre un rapport
 * exploitable et une curiosité.
 *
 * Il faut pour cela `SENTRY_AUTH_TOKEN` dans l'environnement de build (Vercel).
 * Absent, le téléversement est simplement ignoré avec un avertissement : le
 * build local ne casse pas.
 *
 * `widenClientFileUpload` couvre les fichiers que Next sert depuis `_next/static`
 * sans les rattacher à une page — sinon une partie des traces reste minifiée.
 */
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Pas de bruit de l'outil Sentry dans les journaux de build, sauf en CI où
  // c'est le seul endroit où lire ce qui s'est passé.
  silent: !process.env.CI,

  widenClientFileUpload: true,

  // Les source maps sont téléversées à Sentry puis **retirées du bundle public**.
  // Les laisser exposerait le code source original à qui ouvre les outils de
  // développement.
  sourcemaps: { deleteSourcemapsAfterUpload: true },

  // Le bloqueur de publicités du navigateur bloque les requêtes vers Sentry :
  // sans tunnel, les erreurs des utilisateurs qui en ont un ne remonteraient
  // jamais — soit une part importante, et pas la moins avertie. Le tunnel les
  // fait transiter par notre propre domaine.
  //
  // ⚠️ Uniquement sur le build Vercel : `tunnelRoute` **crée une route API**, ce
  // que `output: "export"` refuse. Et l'option n'aurait aucun objet en natif —
  // il n'y a pas de bloqueur de publicité dans une WebView.
  ...(isCapacitorBuild ? {} : { tunnelRoute: "/monitoring" }),
});
