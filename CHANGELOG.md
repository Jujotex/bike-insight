# Changelog

## [Non publié] — audit UX P1 : CTA contextuels

### Modifié
- Tous les CTA « ajouter un composant » deviennent contextuels : tant que le vélo n'a aucun composant, ils mènent au wizard guidé (`/onboarding?bike_id=…`) au lieu du formulaire technique. Concerné : bouton header du dashboard, bouton header et empty state du détail vélo, CTA de la page Composants. Les CTA passent aussi le `bike_id` au formulaire quand le vélo est déjà configuré.

## [Non publié] — enrichissement des données composants

### Ajouté
- **10 nouveaux groupes** dans `bike-templates.ts` (25 au total) : Shimano 105 12v mécanique, Ultegra Di2 12v, Dura-Ace Di2 12v, SLX 12v, CUES 10v ; SRAM Red AXS, Apex AXS, X01 Eagle ; Campagnolo Chorus 12v et Ekar 13v.
- **16 nouvelles entrées catalogue** dans `components-catalog.ts` (34 au total) : chaînes 8/9/10v et Flattop SRAM AXS, chaînes/cassettes Campagnolo 12v et 13v, cassettes route 12v Shimano/SRAM, cassettes 8/9/10v, rotors de disque, plaquettes Campagnolo, câbles/gaines, pneus VTT 27,5".
- **Base de modèles de vélos** (`bike-models.ts`, ~38 modèles populaires) : le wizard d'onboarding pré-remplit type / groupe / freins d'après le nom du vélo Strava, avec bannière « Pré-rempli d'après ton vélo » que l'utilisateur peut corriger.

### Modifié
- `getCatalogForTemplate` : les chaînes Flattop (SRAM AXS route) sont désormais correctement distinguées des chaînes Eagle VTT.

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
