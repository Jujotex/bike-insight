# Changelog

> Règle : ajouter une entrée à chaque changement de fonctionnalité. Ne jamais modifier les releases passées, seulement ajouter.
> Format : Added / Changed / Fixed / Removed

---

## [Unreleased]

### Added
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
