# Changelog

## [Non publié] — suivi des pièces à usure lente

### Ajouté
- **5 pièces optionnelles** proposées décochées dans le wizard : plateaux (~30 000 km), boîtier de pédalier (~15 000 km), roulements de roues (~18 000 km), galets de dérailleur (~10 000 km), guidoline (~8 000 km). Durées indicatives issues de recherches (retours d'usage route ; réduites sous la pluie).
- **5 entrées catalogue** correspondantes (3 gammes chacune) pour les suggestions du wizard et la page Remplacer, avec notes de compatibilité (BCD, standard de boîtier, référence de roulement…).

### Corrigé
- `getCatalogForTemplate` : la catégorie « roues » n'est plus assimilée d'office à un pneu (les roulements de roues obtenaient des suggestions de pneus).

## [Non publié] — fix : vélos non détectés à la première connexion Strava

### Corrigé
- **Callback Strava** : si l'appel `/athlete` échoue (rate limit…), fallback sur les vélos renvoyés par le token exchange — avant, `allBikes` restait vide sans erreur visible.
- **Import** (`/api/strava/import`) : crée désormais les vélos Strava manquants **avant** de rattacher les activités (avant, il ne faisait que mettre à jour les km des vélos existants → activités orphelines `bike_id = null` si le callback avait échoué). Couvre aussi les vélos ajoutés sur Strava après la connexion.
- **Écran de succès** (`/connect/strava?success=true`) : déclenche l'import depuis le client et attend sa fin avant d'afficher les vélos — le déclenchement fire-and-forget depuis le callback n'est pas garanti sur Vercel (fonction gelée au retour).

## [Non publié] — entretiens courants (nouvelle fonctionnalité)

### Ajouté
- **Dashboard** : carte « Entretien à prévoir » sous le bandeau de statut, listant les entretiens dus ou bientôt dus du vélo sélectionné avec lien direct vers l'enregistrement. Alerte uniquement sur les entretiens déjà enregistrés au moins une fois (pas de fausses alertes).
- **Historique unifié** sur le détail vélo : les entretiens vélo apparaissent dans l'historique de maintenance aux côtés des opérations par composant, et leurs coûts alimentent le graphe de dépenses mensuelles.
- **Suivi des entretiens** au niveau vélo : lubrification de la chaîne, nettoyage/dégraissage de la transmission, purge des freins hydrauliques, préventif tubeless, contrôle des serrages, entretien fourche/suspension (VTT), révision complète. Catalogue et intervalles recommandés (km et/ou mois) dans `src/lib/maintenance-catalog.ts`.
- **Carte « Entretien courant »** sur la page détail vélo : statut par entretien (OK / Bientôt / À faire / Jamais enregistré), prochaine échéance estimée, enregistrement en un clic (date + coût optionnel, km du vélo capturé automatiquement). Les entretiens non pertinents sont masqués (purge si freins à patins, suspension si pas VTT).
- **Migration** `20260702000001_maintenance_bike_level.sql` : colonnes `bike_id` et `maintenance_type` sur `maintenance_logs` (la table existante d'historique par composant est réutilisée, pas de nouvelle table). ⚠️ À appliquer sur Supabase avant déploiement.

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
