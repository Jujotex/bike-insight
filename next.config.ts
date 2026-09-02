import type { NextConfig } from "next";

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
  : {};

export default nextConfig;
