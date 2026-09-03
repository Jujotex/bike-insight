#!/usr/bin/env node
/**
 * Build de l'interface pour Capacitor : export statique dans `out/`.
 *
 * **Pourquoi un script et pas une simple variable d'environnement.** Next refuse
 * `output: "export"` dès qu'il existe un route handler — or l'app en a neuf, qui
 * doivent rester déployés sur Vercel. On écarte donc `src/app/api` le temps du
 * build, puis on le remet.
 *
 * Le `finally` n'est pas décoratif : sans lui, un build interrompu (Ctrl+C, erreur
 * de compilation) laisserait le dossier `api` hors de l'arborescence, et le dépôt
 * dans un état où `git status` montre neuf routes supprimées. C'est le genre de
 * script qui, mal écrit, fait perdre une heure à comprendre ce qui s'est passé.
 *
 * ⚠ **Arrête le serveur de dev avant de lancer ce script.** Les deux se disputent
 * `src/app/api` : `next dev` le surveille, ce script le déplace. Un build lancé
 * pendant que le dev tourne échoue, ou pire, réussit sur un état incohérent.
 *
 * Usage : npm run build:app
 */
import { execSync } from 'node:child_process'
import { existsSync, renameSync, rmSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const apiDir = path.join(root, 'src', 'app', 'api')
const asideDir = path.join(root, '.api-build-aside')
const outDir = path.join(root, 'out')

// Node ne charge pas `.env.local` — c'est Next qui le fait, au moment du build.
// Sans ce chargement explicite, le contrôle ci-dessous verrait un environnement
// vide et refuserait de construire alors que la variable est bien définie.
try {
  process.loadEnvFile(path.join(root, '.env.local'))
} catch {
  // Pas de fichier : la variable peut venir de l'environnement (CI, Vercel).
}

// Sans adresse de backend, l'app embarquée appellerait `/api/…` en relatif — donc
// le système de fichiers de l'appareil. Chaque appel échouerait silencieusement,
// et le symptôme (écrans vides, synchro qui ne fait rien) ne pointerait vers rien.
// Mieux vaut refuser de construire.
if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.error(
    '\nNEXT_PUBLIC_API_BASE_URL est absente.\n' +
      "L'app embarquée doit connaître l'adresse absolue du backend, sinon ses appels\n" +
      "API pointeraient vers le système de fichiers de l'appareil.\n\n" +
      'À définir dans .env.local, par exemple :\n' +
      '  NEXT_PUBLIC_API_BASE_URL=https://bike-insight-wheat.vercel.app\n'
  )
  process.exit(1)
}

if (existsSync(asideDir)) {
  console.error(
    "\n.api-build-aside existe déjà : un build précédent s'est interrompu.\n" +
      'Remets le dossier en place avant de relancer :\n' +
      `  Move-Item "${asideDir}" "${apiDir}"\n`
  )
  process.exit(1)
}

let moved = false
try {
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })

  // `tsconfig.json` inclut `.next/dev/types/**` : des validateurs de types générés
  // par `next dev`, un par route API. Comme ce build écarte justement `src/app/api`,
  // la vérification de types échouerait sur dix modules introuvables — un message
  // qui accuse le code alors que le vrai sujet est un reliquat du serveur de dev.
  // On les supprime ; `next dev` les régénérera à son prochain démarrage.
  const devTypesDir = path.join(root, '.next', 'dev', 'types')
  if (existsSync(devTypesDir)) rmSync(devTypesDir, { recursive: true, force: true })

  if (existsSync(apiDir)) {
    renameSync(apiDir, asideDir)
    moved = true
  }

  console.log('→ Export statique de l’interface (routes API écartées)…\n')
  execSync('npx next build', {
    stdio: 'inherit',
    env: { ...process.env, CAPACITOR_BUILD: '1' },
  })

  console.log('\n✓ Interface exportée dans out/')
  console.log('  Étape suivante : npx cap sync\n')
} finally {
  if (moved && existsSync(asideDir)) {
    renameSync(asideDir, apiDir)
  }
}
