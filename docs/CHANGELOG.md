# Changelog

> Règle : ajouter une entrée à chaque changement de fonctionnalité. Ne jamais modifier les releases passées, seulement ajouter.
> Format : Added / Changed / Fixed / Removed

---

## [Unreleased]

### Added
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
