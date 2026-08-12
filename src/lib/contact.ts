/**
 * Coordonnées de support et liens légaux.
 *
 * L'API Policy Strava §2.4 impose une information de contact « easily accessible »
 * pour le support utilisateur, et des liens clairs vers le compte Strava de
 * l'utilisateur. La §7.3 impose une politique de confidentialité accessible par un
 * lien « reasonably prominent ».
 *
 * Adresse personnelle assumée en attendant un domaine : mieux vaut une boîte réellement
 * relevée qu'un `support@bikeinsight.app` qui ne reçoit rien — un reviewer peut la tester.
 * À remplacer par une adresse de domaine le jour où `bikeinsight.app` est exploité
 * (les fiches store gagneront aussi à ne pas afficher une adresse Gmail personnelle).
 */
export const SUPPORT_EMAIL = 'tang.dietsch@gmail.com'

/** Page Strava où l'utilisateur révoque l'accès des applications tierces (§2.4, §7.4). */
export const STRAVA_APPS_SETTINGS_URL = 'https://www.strava.com/settings/apps'

/**
 * Politique de confidentialité — requise par l'API Policy §7.3.
 * Page publique (accessible sans compte) : `src/app/confidentialite/page.tsx`.
 * Liée depuis le pied de page de la landing, l'inscription et la page Compte.
 */
export const PRIVACY_POLICY_PATH = '/confidentialite'
