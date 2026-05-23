# Architecture — Bike Insight

> Règle : mettre à jour ce fichier à chaque nouvelle feature, changement d'architecture, intégration ou modification de logique métier.

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16 App Router + TypeScript |
| Styling | Tailwind CSS + design system Pulse (tokens `--bi-*`) |
| Composants UI | shadcn/ui + composants custom dans `src/components/bi/` |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Supabase Auth (email/password + OAuth) |
| API externe | Strava OAuth 2.0 |
| Déploiement | Vercel (prod: `main`, preview: chaque branche) |

## Design system Pulse

Tokens définis dans `src/app/globals.css` :

- `--bi-bg` #F4F4EF — fond général
- `--bi-card` #FFFFFF — fond des cartes
- `--bi-ink` #0E0E10 — texte principal
- `--bi-muted` #6B6B72 — texte secondaire
- `--bi-accent` #C7FF3F — lime accent
- `--bi-ok` #0E8F5A — statut bon (<70% usure)
- `--bi-warn` #D08415 — statut attention (<90% usure)
- `--bi-bad` #C8362E — statut critique (≥90% usure)

Typographies : Geist (UI) + JetBrains Mono (données chiffrées), chargées via Next.js.

## Structure des dossiers

```
src/
  app/
    globals.css          — tokens Pulse, styles globaux
    layout.tsx           — root layout, fonts
    page.tsx             — landing page
    login/               — page connexion
    signup/              — page inscription
    dashboard/           — tableau de bord principal
    bikes/[id]/          — détail d'un vélo
    components/          — gestion des composants (pièces)
    analysis/            — page insights
    connect/strava/      — flow OAuth Strava (4 écrans)
    sync/                — page synchronisation
    lib/                 — clients Supabase
  components/
    bi/                  — composants Bike Insight
      side-nav.tsx       — navigation latérale
      auth-shell.tsx     — shell partagé pages auth
      brand-mark.tsx     — logo
      ui.tsx             — primitives (Mono, etc.)
      app-shell.tsx      — shell app connectée
      bottom-nav.tsx     — nav mobile
    ui/                  — composants shadcn
docs/
  architecture.md        — ce fichier
  CHANGELOG.md           — historique des changements
```

## État actuel (Phase 0 — UI complète)

Toutes les pages sont implémentées avec des **données statiques**. Aucune requête Supabase réelle n'est effectuée. L'auth Supabase est partiellement câblée (client initialisé, formulaires non branchés).

## Schéma base de données

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | Données utilisateur, 1:1 avec `auth.users`. Contient les tokens Strava. |
| `bikes` | Vélos de l'utilisateur. Lié à Strava via `strava_gear_id`. |
| `components` | Composants installés sur un vélo. Suivi `km_used` / `km_max`. |
| `activities` | Activités Strava importées. Source de vérité pour les km. |
| `maintenance_logs` | Historique des opérations de maintenance. |

### Logique automatique (triggers)

- `update_component_status()` — recalcule `ok/warn/bad` à chaque update de `km_used` ou `km_max`
- `handle_new_user()` — crée automatiquement un profil à l'inscription
- `set_updated_at()` — met à jour `updated_at` sur profiles, bikes, components

### Fichiers migrations

- `supabase/migrations/20260523000001_initial_schema.sql` — schéma complet
- `supabase/migrations/20260523000002_rls_policies.sql` — politiques RLS

## Middleware auth

Fichier : `src/middleware.ts`

Routes protégées (redirect `/login` si non authentifié) : `/dashboard`, `/bikes`, `/components`, `/analysis`, `/sync`

Routes auth (redirect `/dashboard` si déjà connecté) : `/login`, `/signup`

Dépendance : `@supabase/ssr` (package Supabase officiel pour Next.js SSR)

## Roadmap des phases

| Phase | Contenu | État |
|-------|---------|------|
| 0 | UI complète 13 écrans, données statiques | ✅ Terminé |
| 1 | Schéma Supabase, RLS, auth middleware | ✅ Terminé |
| 2 | Strava OAuth réel, import activités | ✅ Terminé |
| 3 | Moteur usure & coûts | ✅ Terminé |
| 4 | Pages web avec données réelles | 🔜 À faire |
| 5 | Polish web | 🔜 À faire |
| 6 | Mobile | 🔜 À faire |
| 7 | Déploiement final | 🔜 À faire |

## Décisions techniques importantes

- **App Router uniquement** — pas de `pages/`, pas de `getServerSideProps`
- **Supabase JS v2** côté client via `src/lib/supabase.ts`
- **RLS obligatoire** sur toutes les tables — un user ne voit que ses données
- **Pas de nouveau framework** sans décision explicite (règle CLAUDE.md)
- **Workflow Git** — branche feature → PR → merge `main` → déploiement prod auto Vercel
