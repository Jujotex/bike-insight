/**
 * Contrôle des erreurs Supabase dans les chargeurs de page.
 *
 * ## Le problème que ça règle
 *
 * Le client Supabase ne lève jamais : il rend `{ data, error }`. Les chargeurs
 * écrits pour le rendu serveur déstructuraient `{ data }` seul, et absorbaient
 * l'absence par un `?? []`. Conséquence : une requête en échec produisait la même
 * chose qu'une requête sans résultat — une page vide, sans le moindre signal.
 *
 * C'est le mode de panne le plus trompeur qui soit sur cette application. « Zéro
 * vélo, 0 km » est une phrase parfaitement plausible pour un nouvel utilisateur ;
 * rien ne distingue un compte neuf d'une base injoignable.
 *
 * Le passage en composants clients (phase 2.1) a aggravé la chose, puisque les
 * requêtes partent désormais du téléphone, sur un réseau qui n'est plus celui
 * d'un centre de données. Et le cache hors-ligne (phase 2.3) en dépend
 * entièrement : il ne se déclenche que sur une exception, et il écrirait sinon la
 * page vide par-dessus la bonne copie.
 *
 * ## L'usage
 *
 * ```ts
 * const results = await Promise.all([ … ])
 * assertNoError(results, 'bikes')
 * const [{ data: bikes }, { data: profile }] = results
 * ```
 *
 * ⚠️ Utiliser `.maybeSingle()` et non `.single()` quand l'absence de ligne est un
 * cas normal : `.single()` traite « aucune ligne » comme une erreur, et ferait
 * ici échouer le chargement d'un profil simplement incomplet.
 */

interface SupabaseResult {
  error: { message: string } | null
}

/**
 * Lève si l'une des requêtes a échoué.
 *
 * On s'arrête à la première : les suivantes ont presque toujours la même cause,
 * et un message unique est plus utile qu'une liste qui dit cinq fois « fetch
 * failed ».
 *
 * @param context nom de l'écran, pour situer l'erreur dans la console.
 */
export function assertNoError(results: SupabaseResult[], context: string): void {
  const failed = results.find(r => r.error)
  if (!failed?.error) return

  throw new Error(`[${context}] ${failed.error.message}`)
}
