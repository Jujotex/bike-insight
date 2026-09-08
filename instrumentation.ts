import * as Sentry from '@sentry/nextjs'

/**
 * Point d'entrée d'instrumentation de Next.
 *
 * Charge la configuration Sentry correspondant au runtime réellement en cours.
 * L'import est dynamique et conditionnel à dessein : importer la configuration
 * « edge » dans le runtime Node — ou l'inverse — casse le build.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

/**
 * Remonte les erreurs levées pendant le rendu serveur ou dans une route API.
 * Sans ce branchement, elles n'apparaissent que dans les journaux Vercel.
 */
export const onRequestError = Sentry.captureRequestError
