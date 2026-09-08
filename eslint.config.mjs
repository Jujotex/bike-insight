import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  /**
   * Interdit les liens internes écrits en dur.
   *
   * Le 03/09/2026, cinq navigations cassées dans l'app native avaient toutes la
   * même origine : `window.location.href = "/dashboard"` et `<a href="/…">`.
   * L'export utilise `trailingSlash: true`, donc la page vit à
   * `/dashboard/index.html` ; le serveur local de Capacitor ne trouve rien à
   * `/dashboard` sans slash et sert la racine. Symptôme : après une connexion
   * réussie, l'utilisateur se retrouvait sur la page d'accueil.
   *
   * Ces bugs sont invisibles sur le web, où les deux formes fonctionnent. Ils
   * n'apparaissent qu'après un build natif et un test sur appareil — le cycle le
   * plus lent du projet. Une règle qui les refuse à la compilation coûte moins
   * cher qu'une seule de ces découvertes.
   *
   * `<Link>` de Next fait de la navigation côté client et n'a pas ce problème.
   */
  {
    files: ["src/**/*.tsx", "src/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "AssignmentExpression[left.property.name='href'][right.type='Literal'][right.value=/^\\//]",
          message:
            "Navigation interne en dur : utilise `router.push()` ou `router.replace()`. " +
            "Une affectation de `location.href` recharge la page et, en natif, sert la " +
            "racine à cause de `trailingSlash` (cf. eslint.config.mjs).",
        },
        {
          selector:
            "JSXOpeningElement[name.name='a'] > JSXAttribute[name.name='href'][value.type='Literal'][value.value=/^\\/(?!api\\/)/]",
          message:
            "Lien interne en `<a>` : utilise `<Link>` de next/link. Une ancre nue " +
            "déclenche une navigation complète que Next n'intercepte pas, et qui sert " +
            "la racine en natif (cf. eslint.config.mjs).",
        },
      ],
    },
  },
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
