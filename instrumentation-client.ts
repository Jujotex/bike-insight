import * as Sentry from '@sentry/nextjs'

/**
 * Surveillance des erreurs côté client — navigateur **et** app native.
 *
 * C'est le fichier qui compte le plus des trois : dans une application
 * installée, il n'y a pas de console, pas de barre d'adresse, et les journaux
 * Vercel ne voient que les routes API. Sans remontée, une panne chez un
 * utilisateur reste inconnue indéfiniment.
 *
 * ## Réglages choisis, et pourquoi
 *
 * **`sendDefaultPii: false`.** Par défaut, Sentry joint l'adresse IP et les
 * en-têtes de requête. On les coupe : ce sont des données personnelles au sens du
 * RGPD, elles n'aident en rien à corriger un bug de rendu, et les collecter
 * obligerait à une base légale et à une mention supplémentaire. Le principe de
 * minimisation s'applique aussi aux outils de développement.
 *
 * **Pas de `replayIntegration`.** L'enregistrement de session filmerait l'écran
 * de l'utilisateur, donc ses vélos, ses dépenses et son e-mail. Disproportionné
 * pour le bénéfice.
 *
 * **Un DSN absent est toléré.** `Sentry.init` sans DSN est inerte : le
 * développement local et les contributions extérieures fonctionnent sans compte
 * Sentry, et un oubli de variable d'environnement ne fait pas échouer le build.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Aucune donnée personnelle : ni IP, ni en-têtes, ni cookies.
  sendDefaultPii: false,

  // Traces de performance échantillonnées à 10 % en production. On cherche des
  // erreurs, pas un profilage fin ; le quota gratuit se remplit très vite sinon.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Distingue les rapports venant de l'app installée de ceux du site : le même
  // code s'y exécute, mais les pannes n'y sont pas les mêmes — la WebView a ses
  // propres limites, et c'est là qu'on est aveugle.
  environment: process.env.NODE_ENV,

  // Bruit de fond des navigateurs et des extensions, sans rapport avec le code.
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Requête interrompue par une navigation : attendu, pas une panne.
    'AbortError',
    'The operation was aborted',
  ],

  // Volontairement absent en développement, où la console suffit et où le bruit
  // masquerait les vrais rapports.
  enabled: process.env.NODE_ENV === 'production',
})

/**
 * Requis par le SDK pour rattacher les erreurs à la bonne navigation dans l'App
 * Router. Sans cet export, les rapports arrivent sans le contexte de la page.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
