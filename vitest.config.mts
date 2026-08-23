import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Tests unitaires — logique métier pure uniquement.
 *
 * Périmètre volontairement restreint : calculs d'usure, de coût et d'échéances,
 * catalogues et repères. Pas de test de composant, pas de base de données, pas de
 * réseau. Ce sont des fonctions pures, donc aucun mock — ce qui les rend rapides à
 * écrire et rapides à exécuter.
 *
 * Pourquoi ce périmètre : c'est là que vit la valeur du produit, et c'est là que le
 * mode de panne est le plus insidieux. Un calcul faux ne lève pas d'erreur, il
 * affiche un mauvais chiffre — sur une app qui vend de la précision d'usure, c'est
 * la pire des régressions. Les deux bugs kilométriques trouvés le 12/08/2026
 * étaient exactement de ce type.
 *
 * Extension `.mts` et non `.ts` : le fichier utilise la syntaxe ESM
 * (`import.meta.url`), or `package.json` ne déclare pas `"type": "module"`. Vite le
 * chargerait donc comme du CommonJS et émettrait un avertissement à chaque
 * exécution. L'alternative — passer tout le projet en ESM — toucherait la
 * configuration de Next et d'ESLint pour rien.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
