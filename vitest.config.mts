import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Tests unitaires — logique métier pure uniquement.
 *
 * Périmètre volontairement restreint : calculs d'usure, de coût et d'échéances,
 * catalogues et repères. Pas de test de composant, pas de base de données, pas de
 * réseau. Ce sont des fonctions pures, donc aucun mock — rapides à écrire, rapides
 * à exécuter.
 *
 * Pourquoi ce périmètre : c'est là que vit la valeur du produit, et c'est là que le
 * mode de panne est le plus insidieux. Un calcul faux ne lève pas d'erreur, il
 * affiche un mauvais chiffre — sur une app qui vend de la précision d'usure, c'est
 * la pire des régressions.
 *
 * Extension `.mts` et non `.ts` : le fichier utilise `import.meta.url`, donc de
 * l'ESM, alors que `package.json` ne déclare pas `"type": "module"`. Vite le
 * chargerait en CommonJS et émettrait un avertissement à chaque exécution.
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
