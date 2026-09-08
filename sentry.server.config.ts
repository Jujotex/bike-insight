import * as Sentry from '@sentry/nextjs'

/**
 * Surveillance des routes API, côté serveur Vercel.
 *
 * Moins critique que le client — ces erreurs apparaissent déjà dans les journaux
 * Vercel — mais Sentry les regroupe, les date et les relie à l'utilisateur, ce
 * qu'une console de journaux ne fait pas.
 *
 * Sans objet dans le build Capacitor : les routes API en sont écartées, ce
 * fichier n'y est jamais chargé.
 *
 * Mêmes réglages de confidentialité que le client — voir
 * `instrumentation-client.ts` pour le raisonnement.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
})
