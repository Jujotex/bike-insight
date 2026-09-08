import * as Sentry from '@sentry/nextjs'

/**
 * Runtime « edge » de Vercel.
 *
 * Le projet n'y exécute rien aujourd'hui — aucune route ni middleware n'est
 * déclaré en edge. Le fichier existe parce que le SDK le charge
 * inconditionnellement : son absence produit un avertissement au build.
 *
 * Mêmes réglages que le serveur ; voir `instrumentation-client.ts` pour le
 * raisonnement sur la confidentialité.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
})
