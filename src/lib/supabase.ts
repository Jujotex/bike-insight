import { createBrowserClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

/**
 * Client Supabase du navigateur — deux stockages de session selon le contexte.
 *
 * **Web** : `createBrowserClient` de `@supabase/ssr`, qui range la session dans des
 * **cookies**. C'est indispensable et non négociable ici — les routes API les
 * lisent, et surtout le callback OAuth Strava, appelé par Strava lui-même, n'a que
 * ça pour savoir qui est l'utilisateur.
 *
 * **Natif** : les cookies d'une WebView Capacitor sont peu fiables — origine
 * `capacitor://localhost`, effacement variable selon les versions d'iOS et
 * d'Android, et pas de garantie de survie au redémarrage de l'app. On range donc
 * la session dans `@capacitor/preferences`, qui s'appuie sur UserDefaults (iOS) et
 * SharedPreferences (Android) : du stockage système, persistant par construction.
 *
 * `Capacitor.isNativePlatform()` renvoie `false` dans un navigateur : le web n'est
 * pas affecté par ce fichier, seul le chemin d'exécution change.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Adaptateur de stockage pour Supabase, adossé aux préférences natives.
 * L'API est asynchrone — Supabase le gère, contrairement à `localStorage`.
 */
const nativeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key })
    return value
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await Preferences.set({ key, value })
  },
  removeItem: async (key: string): Promise<void> => {
    await Preferences.remove({ key })
  },
}

export const supabase: SupabaseClient = Capacitor.isNativePlatform()
  ? createClient(url, anonKey, {
      auth: {
        storage: nativeStorage,
        persistSession: true,
        autoRefreshToken: true,
        // Aucune session n'arrive par l'URL en natif : l'app démarre toujours sur
        // son propre bundle. Laisser la détection active ferait analyser
        // inutilement chaque URL au démarrage.
        detectSessionInUrl: false,
      },
    })
  : createBrowserClient(url, anonKey)

/**
 * Purge du cache hors-ligne au changement d'utilisateur.
 *
 * Le cache de consultation (`offline-cache.ts`) est stocké par appareil, pas par
 * compte. Sans cette purge, se déconnecter puis se reconnecter avec un autre
 * compte afficherait brièvement les vélos du précédent — le temps que le réseau
 * réponde et remplace l'affichage. Sur un téléphone partagé, ou simplement en
 * démonstration, c'est une fuite de données visible.
 *
 * L'écoute est posée ici plutôt que dans le bouton de déconnexion parce qu'elle
 * doit couvrir tous les chemins : déconnexion volontaire, suppression de compte,
 * session expirée, ou connexion d'un autre utilisateur. Un seul point de sortie
 * oublié suffirait à rendre la garantie fausse.
 *
 * `syncCacheOwner` compare le propriétaire enregistré : le rafraîchissement
 * périodique du jeton émet lui aussi un événement, et purger à chaque fois
 * viderait le cache toutes les heures sans raison.
 */
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    void import('./offline-cache').then(({ syncCacheOwner }) =>
      syncCacheOwner(session?.user?.id ?? null)
    )
  })
}
