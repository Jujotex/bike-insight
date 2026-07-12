# Changelog

## [Non publié] — setup Capacitor (apps iOS/Android)

### Ajouté
- **Capacitor 8 en mode remote URL** : `capacitor.config.ts` (appId `com.bikeinsight.app`, WebView pointant vers la prod Vercel), coquille `capacitor-shell/`, dépendances `@capacitor/{core,ios,android,cli}`. La version web est inchangée. Voir `docs/mobile-setup.md` pour générer les projets natifs (`npx cap add ios android`) et la marche à suivre stores (Codemagic pour iOS sans Mac).

## [Non publié] — icône vélo cartoon

### Modifié (visuel)
- L'illustration du vélo sur les cartes (`bikes`) passe d'un trait technique fin à un style cartoon « Chunky » : traits épais et arrondis, moyeux et pédalier pleins. Conserve la couleur dynamique `bikeColor`.

## [Non publié] — carte Entretien sur le dashboard

### Ajouté
- **Carte « Entretien » compacte** sur le dashboard, toujours visible (avant, le bloc « Entretien à prévoir » disparaissait quand rien n'était en retard). Elle affiche le statut global (à faire / à surveiller / à jour) et les prochaines échéances du vélo sélectionné, y compris les entretiens « OK », avec un lien « Voir tout » vers la page vélo. Si aucun entretien n'a encore été enregistré, un message d'invite s'affiche.
- `getDashboardData` expose `maintenanceSummaryByBike` : par vélo, les compteurs due/soon/ok et les entretiens triés par urgence (label, statut, échéance formatée). Contrairement à `maintenanceAlerts`, ce résumé inclut aussi les entretiens à jour.

## [Non publié] — suppression du graphe « Dépenses · 12 mois »

### Supprimé
- Le bloc **« Dépenses · 12 mois »** (histogramme des remplacements par mois) sur la page vélo (`bikes/[id]`) est retiré, avec l'agrégation mensuelle et la requête `spendingLogs` associées désormais inutiles.

## [Non publié] — fix : import Strava limité aux activités vélo

### Corrigé
- L'import Strava (`api/strava/import`) enregistrait **toutes** les activités (course à pied, marche, natation…) dans `activities`, qui est la source de vérité des km. Résultat : les KPI « 12 mois » du dashboard (km + sorties) étaient gonflés par des activités non cyclistes. L'import ne conserve désormais que les types vélo (`Ride`, `MountainBikeRide`, `GravelRide`, `EBikeRide`, `EMountainBikeRide`, `VirtualRide`, `Handcycle`, `Velomobile`), via `sport_type` (avec repli sur `type`).
- ⚠️ Les activités non cyclistes déjà importées restent en base (pas de `sport_type` stocké pour les distinguer) : un nettoyage + resync complet est nécessaire pour corriger les chiffres historiques.

## [Non publié] — fix : réglages d'alertes restaurés dans Compte

### Corrigé
- La fusion de `/notifications` dans le dashboard avait fait disparaître les **réglages d'alertes** (activation + seuils À surveiller / À remplacer). Ils sont restaurés dans la page Compte, section « Alertes » (`notification-settings.tsx`) : toggles, sliders de seuils, sauvegarde automatique avec confirmation « ✓ Sauvegardé ». Ces seuils gouvernent aussi les notifications d'entretien.

## [Non publié] — entretiens dans le statut global et les notifications

### Modifié (visuel)
- **Carte Entretien** alignée sur le langage visuel du tableau des pièces : lignes en grille (Entretien / Dernier / Échéance / action), barre latérale colorée par statut, barre de progression vers l'échéance avec pourcentage, tri par urgence (à faire → bientôt → OK → jamais enregistré). Le bouton « Fait ✓ » n'est plein que pour les entretiens dus. Colonne « Dernier » masquée sur mobile.
- `computeMaintenanceStatus` expose désormais `pct` (progression 0-100 vers l'échéance).

### Ajouté
- **Notifications d'entretien** : `createMaintenanceNotifications` génère des notifications (warn = bientôt, bad = à faire) pour les entretiens en retard, avec dédoublonnage par vélo + type tant que la notification n'est pas lue. Déclenchée après chaque sync Strava et chaque recalcul d'usure, comme les notifications d'usure. Respecte les réglages notify_warn/notify_bad.
- **Migration** `20260703000001_notifications_maintenance.sql` : colonne `maintenance_type` sur `notifications`. ⚠️ À appliquer sur Supabase avant déploiement.

### Modifié
- **Bandeau de statut du dashboard** : les entretiens dus comptent dans l'état global — « Prêt à rouler » devient orange « 1 entretien à faire » (avec le libellé en sous-titre), et le compteur du bandeau inclut les entretiens.
- **Badge notifications** : le dashboard marque les notifications comme lues à l'affichage (c'est désormais la surface des alertes depuis la suppression de `/notifications`) — le badge se vide en visitant l'accueil.

## [Non publié] — passe responsive mobile

### Corrigé
- **Filet global** : `overflow-x: hidden` sur le body (fin du scroll horizontal parasite).
- **Page pièce** : le « 100 % » géant du héros d'usure (100px) passait hors écran — réduit à 56px sur mobile, bloc km repositionné, padding resserré.
- **Landing** : héros 2 colonnes, grilles 3-4 colonnes, footer et paddings 48px adaptés au mobile ; tableau comparatif en scroll horizontal contenu. Accents corrigés au passage (Chaîne, Prévision, Régularité, € au lieu de EUR…).
- **Toasts** : ne débordent plus sur petit écran (largeur max = écran − 32px, retour à la ligne).
- **Barre de navigation mobile** : respecte la safe area iOS (`env(safe-area-inset-bottom)`) au lieu d'un padding fixe.

## [Non publié] — fin de la boucle multi-vélos + pages orphelines

### Modifié
- **Wizard** : après la configuration du vélo, écran de succès simple avec CTA unique vers le dashboard (fin de la boucle « vélo suivant » qui poussait à tout configurer d'affilée). Les autres vélos se configurent depuis Mes vélos (lien discret « Configurer un autre vélo maintenant »).

### Supprimé
- **`/sync`** → redirige vers Compte (statut Strava + synchronisation y vivent déjà) ; lien « Gérer » du compte retiré.
- **`/notifications`** → redirige vers le dashboard (les alertes vivent dans « À traiter » et « Entretien à prévoir ») ; le lien « Alertes » du compte pointe vers le dashboard. `notifications/client.tsx` vidé (à `git rm`).

## [Non publié] — fluidité et polissage UX

### Ajouté
- **Skeletons de chargement** (`loading.tsx`) sur les 5 routes principales (dashboard, vélos, détail vélo, pièces, détail pièce) : plus d'écran figé pendant les requêtes serveur.
- **Toasts de confirmation** après chaque écriture (entretien enregistré, pièce remplacée/ajoutée/modifiée), avec relais via sessionStorage pour survivre aux navigations. Monté dans `AppShell`.

### Modifié
- **Requêtes parallélisées** : `getBikeData` (3 requêtes) et la page détail vélo (4 requêtes) passent en `Promise.all` — temps de chargement divisé d'autant.
- **Vocabulaire** : « composant » → « pièce » et « Déclarer » → « Ajouter » dans toute l'interface (dashboard, listes, formulaires, wizard, compte, notifications).
- **Accents** : passe complète sur la page détail pièce (état, intensité, événements…) et remplacement des « EUR » restants par €.

## [Non publié] — fix : graphe « Usure dans le temps » vide

### Corrigé
- Le graphe de la page composant affichait « Données insuffisantes » pour les pièces sans date d'installation (créées via le wizard avec « d'origine du vélo » ou « je ne sais pas »). Il démarre désormais à la première activité connue du vélo, avec l'usure déjà accumulée comme point de départ de la courbe (fin de l'étirement artificiel depuis 0 %).

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
