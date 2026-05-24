# Changelog

> Règle : ajouter une entrée à chaque changement de fonctionnalité. Ne jamais modifier les releases passées, seulement ajouter.
> Format : Added / Changed / Fixed / Removed

---

## [Unreleased]

## [Unreleased] — Phase 7 : Édition et remplacement de composants

### Added
- `EditComponentForm` : formulaire client pré-rempli pour modifier un composant existant (brand, prix, date install, km install, km_max)
- Page `/components/[id]/edit` : page d'édition server-side qui fetch les données et passe au formulaire
- `ReplaceButton` : bouton client avec confirmation — archive le composant actuel et redirige vers le formulaire de création pré-rempli (même type, même vélo, km actuels du vélo)
- `NewComponentForm` : support des query params `?bike_id`, `?type`, `?category`, `?installed_km` pour pré-remplissage depuis le flow de remplacement
- Page `/components/new` : wrappé dans `<Suspense>` requis par `useSearchParams`
- Page détail composant : ajout boutons **Modifier** (lien vers edit) et **Remplacer** (ReplaceButton) dans le PageHead

### Changed
- Page `/components/[id]` : fetch `total_km` du vélo en plus du `name` pour alimenter le ReplaceButton

---


### Added
- Phase 5 — Polish web
- `/components/new` : formulaire fonctionnel câblé sur Supabase (sélecteur de vélos réels, catégorie auto, durée de vie par type, enregistrement + recalcul usure)
- `NewComponentForm` : client component séparé, props `bikes` passées depuis Server Component
- `ArchiveButton` : client component pour archiver/réactiver un composant
- `/components/[id]` : page détail composant avec vraies données (usure, km, statut, infos)
- `/bikes` : page liste vélos avec vraies données (km, sorties 12m, alertes, dernière sortie)
- Migration SQL `20260523000004` : ajout de `installed_km` dans la vue `component_stats`
- `SideNavLoader` câblé sur toutes les pages manquantes (bikes, components/new, components/[id])
- Page sync avec données réelles : vélos détectés, activités importées, statut connexion Strava
- `getSyncData()` dans `data.ts` : récupère bikes, activités récentes (10 dernières) et profil utilisateur
- `SyncButton` câblé sur la page sync — appelle `POST /api/strava/import`, affiche le compteur importé, recharge la page
- Phase 4b — Pages restantes avec données réelles
- `data.ts` : `getComponentsData()` et `getAnalysisData()` (requêtes parallèles via Promise.all)
- `/bikes/[id]` : stats héros réelles, tableau composants, graphique 30j, analyse intelligente dynamique
- `/components` : liste tous les composants actifs multi-vélos, badges alertes bad/warn, empty state
- `/analysis` : KPIs agrégés tous vélos, répartition coût par catégorie, insights calculés dynamiquement
- Fix callback Strava : fetch `/api/v3/athlete` dédié pour récupérer les vélos (plus fiable)

### Added (Phase 4a)
- Phase 4a — Dashboard avec données réelles : `src/lib/data.ts` (`getDashboardData`, `getBikeData`)
- Dashboard page rewritten as async Server Component, reads `bike_stats` + `component_stats` views
- KPIs réels : coût total composants, coût/km, km 12 mois, nombre de sorties, usure moyenne, alertes critiques
- Graphique activité 30j dynamique avec max normalisé et labels de dates réels
- Répartition coût par catégorie dynamique depuis `costByCategory`
- Carte "Action prioritaire" basée sur `mostCritical` composant réel
- Insights générés dynamiquement depuis les données (composants critiques, usure, budget)
- `AppShell` devient async Server Component : fetch vélos réels pour la SideNav
- `SideNav` : accepte props `bikes`, `userInitials`, `userName`, `bikeCount` — indicateur rouge si composant critique
- Vélos cliquables dans la SideNav (lien vers `/bikes/[id]`)

### Added (Phase 3)
- Moteur usure : fonction SQL `recalculate_component_km` (km_used = bike.total_km - installed_km)
- Trigger automatique statut ok/warn/bad à chaque recalcul
- Vue `component_stats` : wear_pct, cost_per_km, km_remaining par composant
- Vue `bike_stats` : coût total, coût/km, composant le plus critique par vélo
- Import activités Strava : route `/api/strava/import` (90 derniers jours, paginé, upsert sur strava_id)
- Recalcul automatique `total_km` des vélos après chaque import
- Helper `getValidStravaToken` : refresh automatique du token Strava si expiré
- Import déclenché automatiquement après la connexion OAuth Strava (non-bloquant)
- OAuth Strava réel : route `/api/strava/auth` (redirect) + `/api/strava/callback` (échange tokens, création vélos)
- Tokens Strava stockés dans `profiles` (access_token, refresh_token, expires_at, athlete_id)
- Vélos Strava auto-créés dans `bikes` à la connexion (upsert sur strava_gear_id)
- Gestion des erreurs OAuth (access_denied, token_exchange, db_error) avec écran dédié
- Formulaire login fonctionnel : signInWithPassword, messages d'erreur en français, touche Entrée, redirection post-login
- Formulaire signup fonctionnel : signUp, gestion confirmation email (écran dédié), messages d'erreur en français, touche Entrée
- Schéma SQL Supabase complet : tables `profiles`, `bikes`, `components`, `activities`, `maintenance_logs`
- Enums `component_status` (ok/warn/bad/archived) et `component_category`
- Triggers automatiques : statut composant (ok/warn/bad), updated_at, création profil à l'inscription
- Politiques RLS sur toutes les tables — isolation complète par utilisateur
- Middleware Next.js auth : routes protégées redirigent vers `/login`, routes auth redirigent vers `/dashboard` si connecté
- Dépendance `@supabase/ssr` pour la gestion des cookies Supabase côté serveur

### Changed

### Fixed

### Removed

---

## [0.1.0] — 2026-05-23

### Added
- Landing page avec hero, feature strip et footer
- Page login avec AuthShell (panneau gauche metric + formulaire droit)
- Page signup avec AuthShell (étape 1/3)
- Flow connexion Strava en 4 écrans : intro, auth OAuth simulée, import en cours, succès
- Dashboard principal : KPIs, tableau composants avec barre d'usure, graphique activité 30j, répartition coûts
- Page détail vélo `/bikes/[id]` : stats héros, composants, analyse intelligente
- Page gestion composants
- Page analyse avec tableau d'insights par catégorie
- Page sync
- Navigation latérale avec liste des vélos et indicateurs d'usure
- Design system Pulse : tokens CSS `--bi-*` complets dans `globals.css`
- Typographies Geist + JetBrains Mono
- Composant partagé `AuthShell` pour toutes les pages auth
- Composants UI : `BrandMark`, `SideNav`, `AppShell`, `BottomNav`
- Déploiement Vercel sur `bike-insight-wheat.vercel.app`
- Workflow Git : branche protégée `main`, preview deployments automatiques
