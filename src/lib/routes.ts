/**
 * Construction centralisée des URL internes.
 *
 * Créé le 24/08/2026 pour le passage des segments dynamiques aux paramètres
 * d'URL (phase 2.1, prérequis de l'export statique Capacitor).
 *
 * **Pourquoi ce fichier plutôt que des gabarits dispersés.** Les liens vers les
 * fiches vélo et pièce étaient écrits en dur à vingt-cinq endroits, dans douze
 * fichiers. Changer la forme des URL imposait de tous les retrouver — et un oubli
 * ne se voit qu'au clic, en production. Désormais la forme vit ici : la prochaine
 * évolution ne touchera qu'un fichier.
 *
 * **Pourquoi des paramètres et non des segments.** Next ne peut pas pré-générer
 * `/bikes/[id]` sans connaître les identifiants au moment du build. Or ils sont
 * propres à chaque utilisateur. En segment dynamique, ces routes restent rendues
 * à la demande et interdisent l'export statique dont dépend l'app Capacitor.
 * Avec un paramètre, la page est une coquille statique unique qui lit son
 * identifiant côté client — et un rechargement direct fonctionne, contrairement
 * aux contournements par coquille factice.
 *
 * Les URL sont moins jolies sur le web. Dans une app native, personne ne les voit.
 */

export const routes = {
  dashboard: () => '/dashboard',
  bikes: () => '/bikes',
  cost: () => '/cout',
  history: (bikeId?: string) => (bikeId ? `/historique?bike=${bikeId}` : '/historique'),
  account: () => '/account',
  onboarding: (bikeId?: string) => (bikeId ? `/onboarding?bike_id=${bikeId}` : '/onboarding'),

  /** Fiche d'un vélo. */
  bike: (id: string) => `/bikes/detail?id=${id}`,

  /** Fiche d'une pièce. */
  component: (id: string) => `/components/detail?id=${id}`,
  componentEdit: (id: string) => `/components/edit?id=${id}`,
  componentCompare: (id: string) => `/components/compare?id=${id}`,
  componentTuto: (id: string) => `/components/tuto?id=${id}`,
  componentNew: (bikeId?: string) =>
    bikeId ? `/components/new?bike_id=${bikeId}` : '/components/new',

  /** Réglages d'entretien. */
  maintenanceSettings: (bikeId?: string) =>
    bikeId ? `/reglages/entretiens?bike=${bikeId}` : '/reglages/entretiens',
  maintenanceType: (slug: string, bikeId?: string) =>
    `/reglages/entretiens/detail?slug=${slug}${bikeId ? `&bike=${bikeId}` : ''}`,
  maintenanceTuto: (slug: string, bikeId?: string) =>
    `/reglages/entretiens/tuto?slug=${slug}${bikeId ? `&bike=${bikeId}` : ''}`,
} as const
