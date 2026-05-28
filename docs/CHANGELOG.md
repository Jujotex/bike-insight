# Changelog

> Règle : ajouter une entrée à chaque changement de fonctionnalité. Ne jamais modifier les releases passées, seulement ajouter.
> Format : Added / Changed / Fixed / Removed

---

## [Unreleased]

## [Unreleased] — Redesign pages Mes Vélos + Détail composant

### Changed
- `src/app/bikes/page.tsx` : grille fixe 3 colonnes, hero neutre avec icône vélo simplifiée + badge ACTIF (lime) sur le vélo le plus récent + badge type (Route/VTT), stat Coût/km à la place de Sorties·12m, strip statut avec compteurs bad/warn + sorties, `ManualRideButton` dans le header, texte empty slot "Ajouter un vélo manuel"
- `src/app/components/[id]/page.tsx` : ajout section "Usure dans le temps" (graphique SVG linéaire depuis l'installation), section "Historique" (timeline depuis `maintenance_logs` avec dots colorés + badge raison), stats refaites (Intensité + Vie restante à la place de Km parcourus/restants), carte Recommandation avec icône alerte

## [Unreleased] — Dashboard v2 (en cours — UI à venir)

### Changed
- `SideNav` : suppression de la liste déroulante des vélos individuels et du lien Analyse — nav simplifiée à 4 items (Dashboard, Mes vélos, Composants, Sync Strava)
- `src/app/analysis/page.tsx` : redirige vers `/dashboard`
- `getDashboardData()` : ajout `readinessScore` (composants 60% + régularité 20% + maintenance 20%), `attentionItems` (composants bad/warn tous vélos, triés par urgence), `bikeStatus` (statut + badCount/warnCount + lastRideAt par vélo), `predictions` (remplacements estimés avec weeksUntil + coût), `budget12m` (répartition par catégorie)
- `getDashboardData()` : ajout `readinessByBike` (score readiness calculé individuellement par vélo) — suppression du slice(0,5) sur attentionItems pour permettre le filtrage client-side
- `src/app/dashboard/page.tsx` : refonte complète — readiness hero avec décomposition du score, zone "Ce qui nécessite ton attention", prévisions avec timeline 3 mois, statut par vélo, activité 30j + budget par poste
- `src/app/dashboard/page.tsx` : simplifié en Server Component pur — passe toutes les données à `DashboardClient`

### Added
- `src/app/dashboard/client.tsx` : nouveau `DashboardClient` ("use client") — pills de sélection de vélo en haut de page (visible si ≥ 2 vélos), readiness / attention / prévisions filtrées par vélo sélectionné
- `globals.css` : classes `bi-grid-readiness` (1fr 1.4fr → stack mobile), `bi-grid-bikes` (3 cols → 1 col mobile), `bi-readiness-divider` (border-right → border-bottom mobile) — responsive complet du dashboard

---

## [Unreleased] — Saisie manuelle de sortie

### Added
- `ManualRideButton` : bouton + modal pour ajouter une sortie sans Strava (vélo, distance, date, nom optionnel) — insère dans `activities` avec `strava_id = null`, déclenche le recalcul d'usure
- Page détail vélo `/bikes/[id]` : bouton "Sortie manuelle" dans les actions du header
- Page sync : bouton "Sortie manuelle" à côté du bouton Resynchroniser
- Migration `20260527000002_activities_strava_id_nullable.sql` : `strava_id` passe de `NOT NULL` à nullable pour autoriser les activités manuelles

---

## [Unreleased] — Fix bouton resynchronisation Strava

### Fixed
- `SyncButton` : affichage d'un message d'erreur détaillé en cas d'échec (token expiré, erreur réseau)
- `SyncButton` : nouveau prop `stravaConnected` — bouton désactivé si Strava non connecté, lien "Connecter Strava" affiché à la place
- `api/strava/import/route.ts` : message 401 explicite ("Token Strava invalide ou expiré — reconnecte ton compte Strava") + `console.error` sur chaque point d'échec pour traçabilité dans les logs Vercel
- `sync/page.tsx` : prop `stravaConnected` passé au `SyncButton`
- `login/page.tsx` : import Strava déclenché automatiquement en arrière-plan à chaque connexion à BikeInsight
- Migration `20260527000001_activities_update_policy.sql` : ajout policy RLS `UPDATE` sur `activities` — le upsert Strava (INSERT + UPDATE on conflict) échouait sans cette policy

---

## [Unreleased] — Redesign page Composants

### Added
- `src/app/components/client.tsx` — nouveau composant client `ComponentsClient` qui gère toute la UI de la page
- **KPI strip** (4 cellules) : composants actifs, remplacés 12 mois, coût total, durée de vie moy. vs estimation
- **Tabs client-side** : Actifs / Historique des remplacements / Tous — sans rechargement de page
- **Filtre vélo** (pills) dans l'onglet Actifs quand plusieurs vélos détectés
- **Table active** redesignée : barre verticale colorée par statut, colonne Installé, barre d'usure + % inline
- **Table historique** : Date, Composant, Vélo, Durée de vie (km + mini-barre + cible), Vs prévu (± km coloré), Coût, badge Raison, chevron vers le détail
- **Footer insight** dynamique : lime icon box + texte calculé sur la durée de vie moyenne vs estimation + lien Analyse

### Changed
- `src/app/components/page.tsx` — simplifié en pur Server Component qui passe les données à `ComponentsClient`
- `src/lib/data.ts` — `getComponentsData` remplace les deux queries composants actifs/archivés par une query actifs + une query `maintenance_logs` (jointure `components`) avec calcul KPIs (activeCount, replacedCount, totalCost, avgBeat)

---

## [Unreleased] — Raison de remplacement

### Added
- Colonne `reason` sur `maintenance_logs` (valeurs : `usure`, `crevaison`, `casse`, `anticipé`) — migration `20260524000003_maintenance_logs_reason.sql`
- `ReplaceButton` : flow en 2 étapes — choix de la raison (modal avec radio-pills colorés) puis confirmation — la raison est enregistrée dans `maintenance_logs`

---

## [Unreleased] — Phase 9 : Suppression de composant

### Added
- `DeleteButton` : bouton client avec étape de confirmation — supprime définitivement un composant (tous statuts)
- Page détail composant : bouton **Supprimer** ajouté dans les actions du PageHead
- Migration SQL `20260524000002_maintenance_logs_set_null.sql` : `component_id` dans `maintenance_logs` passe de `NOT NULL / ON DELETE CASCADE` à nullable `ON DELETE SET NULL` — les logs sont conservés même après suppression du composant

---

## [Unreleased] — Phase 8 : Historique de maintenance

### Added
- `ReplaceButton` : lors du remplacement, insère automatiquement une ligne dans `maintenance_logs` (action="Remplacement", km_at_action, cost, performed_at)
- Page détail vélo `/bikes/[id]` : section **Historique de maintenance** — timeline des remplacements avec icône, nom du composant, catégorie, date, km vélo au moment de l'action, coût
- Migration SQL `20260524000001_bike_stats_total_cost.sql` : recalcul de la vue `bike_stats` pour inclure les composants archivés dans le coût total (historique réel du vélo)

### Fixed
- `bike_stats` view : le coût total d'un vélo excluait les composants archivés — corrigé, le coût affiché reflète désormais l'intégralité des composants installés historiquement

---

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
