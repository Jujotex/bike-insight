import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Code généré, pas le nôtre. Sans ces exclusions, `npm run lint` noyait les
    // vrais avertissements sous une quarantaine d'entrées provenant du pont natif
    // de Capacitor et des artefacts Gradle — au point de rendre la sortie
    // inutilisable, donc ignorée.
    "android/**",
    "ios/**",
    ".agents/**",
  ]),
]);

export default eslintConfig;
