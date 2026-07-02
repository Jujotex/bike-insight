# Changelog

## [Non publié] — simplification gestion des composants

### Modifié
- **Wizard onboarding réduit à 3 écrans** (au lieu de 5) : ① vélo + type + groupe + freins, ② état des pièces, ③ confirmation.
- **Fin de la saisie km/date par pièce** : remplacée par une question globale « Ces pièces sont-elles neuves ? » (neuves / d'origine du vélo / je ne sais pas). L'usure de départ est calculée automatiquement (je ne sais pas → 50 % prudent). La confirmation affiche l'usure initiale estimée par pièce.
- **Page Remplacer** : la compatibilité s'appuie d'abord sur le groupe enregistré du vélo (`groupset_template_id`) via `getCatalogForTemplate`, avec fallback sur la détection par mots-clés. Bannière « Basé sur ton groupe {label} ».

## [Non publié] — branche `ux/p0-onboarding`

### Modifié
- **Flux Strava** (`/connect/strava`) : suppression des écrans de démo simulés (fausse page OAuth, import à progression fictive). Le flux réel est désormais le seul : intro → OAuth Strava → succès/erreur.
- **Onboarding unifié** : suppression de l'overlay d'onboarding du dashboard. Le wizard `/onboarding` est le chemin d'accueil unique.
- **Source de vérité onboarding** : plus de clé `localStorage` (`bi_onboarding_done`). Un utilisateur est considéré onboardé s'il a au moins un composant actif (état dérivé de la base).
- **Dashboard** : l'empty state "Aucun composant configuré" renvoie vers le wizard guidé (`/onboarding?bike_id=…`) au lieu du formulaire technique. Corrections d'orthographe (accents) et "eu/km" → "€/km".

### Supprimé
- Bouton "Continuer sans Strava" (sans action — cul-de-sac).
- `src/components/bi/onboarding-overlay.tsx` (vidé, à retirer via `git rm`).
