# Changelog

> Règle : ajouter une entrée à chaque changement de fonctionnalité. Ne jamais modifier les releases passées, seulement ajouter.
> Format : Added / Changed / Fixed / Removed

---

## [Unreleased] — Remplacement : enchaînement direct sur l'ajout du remplaçant

### Changed
- `src/components/bi/replace-button.tsx` : après confirmation (raison + archivage + log d'entretien), on est redirigé directement vers le formulaire d'ajout pré-rempli (vélo, type, km d'installation) au lieu de la modale « Composant archivé — créer le remplacement ? ». Le remplacement devient un vrai enchaînement plutôt qu'une suppression suivie d'un ajout séparé. Étape/état « done » supprimés.

## [Unreleased] — Ajout pièce : état sélectionné sur les suggestions

### Changed
- `src/components/bi/new-component-form.tsx` : la suggestion cliquée est mise en évidence (bordure foncée, fond teinté, coche verte, libellé « Sélectionné »). Le clic renseigne le champ modèle complet, l'état reste synchronisé avec l'autocomplétion.

## [Unreleased] — Page Coût : activité et dépenses côte à côte

### Changed
- `src/app/cout/page.tsx` : « Où part ton argent » et « Activité · 3 mois » repassent en deux cartes distinctes affichées côte à côte (2 colonnes sur desktop, empilées sur mobile), au lieu des deux graphes empilés dans une même carte.

## [Unreleased] — Ajout pièce : sélecteur de type épuré (explication auto)

### Changed
- `src/components/bi/new-component-form.tsx` : retrait des petits « i » dans chaque bouton de type (trop chargé). La grille est propre ; l'explication du type sélectionné s'affiche automatiquement dans une barre sous la grille (état `infoOpen` supprimé).

## [Unreleased] — Onboarding : pièces classiques créées par défaut

### Changed
- `src/app/onboarding/client.tsx` (`buildComponents`) : les pièces à usure lente (Plateaux, Boîtier de pédalier, Roulements de roues, Galets de dérailleur, et Guidoline en route/gravel) sont désormais **cochées par défaut** — elles étaient présentes mais décochées, donc jamais créées. La guidoline est exclue pour un VTT. Libellé de section ajusté (« cochées par défaut, décoche celles que tu ne veux pas suivre »).

## [Unreleased] — Page Coût : « Où part ton argent » remonté en tête, km 3 mois fusionné

### Changed
- `src/app/cout/page.tsx` : le bloc « Où part ton argent » est déplacé juste après les deux chiffres clés (tout en haut). Le kilométrage des 3 derniers mois est affiché dans son en-tête et le graphe d'activité mensuel y est intégré ; l'ancienne carte séparée « Activité · 3 mois » est supprimée (fusionnée).

## [Unreleased] — Fiche vélo : liste des pièces par type

### Changed
- `src/app/bikes/[id]/page.tsx` : la liste des pièces affiche désormais le **type** (Chaîne, Cassette, Pneus, Plaquettes…) au lieu du nom complet du modèle. La marque reste en sous-titre, le modèle exact reste sur la fiche de la pièce.
- `src/lib/components-catalog.ts` : nouveau helper `getComponentType(name)` qui déduit le type d'une pièce depuis son nom (repli : nom conservé si le type n'est pas reconnu).

## [Unreleased] — Fiche pièce : « Vie restante » calculée sur le rythme réel

### Fixed
- `src/app/components/[id]/page.tsx` : « Vie restante » affichait « - » pour toute pièce sans date d'installation (cas « d'origine » et « je ne sais pas », majoritaires). Le temps restant est maintenant estimé à partir du rythme réel du vélo (km/jour sur les 180 derniers jours d'activités), avec repli sur le rythme depuis l'installation. Format élargi (jours → semaines → mois → années).

## [Unreleased] — Ajout pièce : liste complète des types + info par pièce

### Added
- `src/components/bi/new-component-form.tsx` : le sélecteur « Type de composant » couvre désormais toutes les familles du catalogue — ajout de Patins (frein jante), Galets, Boîtier (de pédalier), Roulements et Guidoline (avant on ne pouvait pas les créer depuis ce formulaire). Chaque type porte un bouton « i » qui ouvre une explication courte (à quoi sert la pièce et quand la remplacer).

### Fixed
- `src/lib/components-catalog.ts` (`getCatalogForTemplate`) : le type « Disque » (le rotor) renvoyait les plaquettes. Il renvoie maintenant les rotors (`rotor-disc`) ; « Plaquettes » et « Patins » inchangés.

## [Unreleased] — Catalogue : enrichissement de toutes les catégories

### Added
- `src/lib/components-catalog.ts` : +44 références réparties sur toutes les familles (~180 produits au total). Chaînes 8→12v (KMC X11EL, Wippermann Connex, Shimano CN-M7100/M9100, SRAM X01/XX1 Eagle, PC-Force22, YBN, PowerLock SRAM 8/9/10v), cassettes (SunRace CSMS8/CSMZ90/CSM55, Shimano XTR CS-M9100, SRAM XX1 XG-1299, PG-1050), freins disque et patins (Galfer, SwissStop Disc/BXP, Shimano N03A 4 pistons, Jagwire, Kool-Stop Salmon), rotors (SRAM Centerline, Galfer Fixe), câbles (Jagwire Sport, Shimano OT-RS900), plateaux (SRAM Rival, Wolf Tooth 1x, Praxis), boîtiers (SRAM DUB, Praxis, CeramicSpeed), roulements (SKF), galets (SRAM, Kogel céramique), guidoline (Supacaz, Fizik, Silca).

## [Unreleased] — Catalogue : plus de références (pneus, GRX 10v/12v)

### Added
- `src/lib/components-catalog.ts` : pneus ajoutés — gravel (Schwalbe G-One Allround & G-One R, WTB Riddler, Vittoria Terreno Dry, Continental Terra Speed), route (Schwalbe Pro One, Continental GP5000 S TR, Pirelli P Zero Race), VTT 29 & 27,5 (Maxxis Rekon, Schwalbe Nobby Nic, Continental Cross King).
- `src/lib/bike-templates.ts` : groupes `shimano-grx-10v` (GRX RX400) et `shimano-grx-12v` (GRX RX820), absents jusqu'ici (seul GRX 11v existait).

### Fixed
- `src/lib/components-catalog.ts` (`getCatalogForTemplate`) : la branche pneus renvoyait toujours `tire-road-700c`. Elle dépend maintenant du type de vélo — gravel → `tire-gravel`, VTT → `tire-mtb-29`, sinon route. Un gravel voit enfin ses pneus gravel en suggestion.

### Changed
- `new-component-form.tsx` et `onboarding/client.tsx` : le panneau « Suggestions compatibles » est limité à 6 entrées (les catégories s'étant allongées) ; le reste du catalogue reste accessible via l'autocomplétion du champ modèle.

## [Unreleased] — Catalogue : autocomplétion du modèle à la saisie

### Added
- `src/lib/components-catalog.ts` : `searchCatalog(query, limit)` — recherche libre dans tout le catalogue (dédupliqué), par mots sur nom + marque + référence. Ex. « gp 5000 » → Continental GP5000. Ajout de quelques pneus Michelin (Lithion 3, Power Cup) au catalogue route.
- `src/components/bi/catalog-autocomplete.tsx` : champ texte réutilisable avec liste de suggestions ; à la sélection, pré-remplit nom/marque, prix et durée de vie.

### Changed
- `src/components/bi/new-component-form.tsx` : le champ « Modèle / marque » propose désormais les produits du catalogue en direct pendant la frappe.
- `src/app/onboarding/client.tsx` : le champ « Nom » (personnalisation d'une pièce) propose les produits du catalogue en direct pendant la frappe.

## [Unreleased] — Design : convention de tableaux unifiée

### Changed
- `src/app/globals.css` : en-têtes des trois tableaux (`.bi-comp-table-header-row`, `.bi-maint-header-row`) passés de 10,5 px à 11 px (aligné sur `.bi-label`) ; `.bi-maint-row` : padding de ligne 13 → 14 px 22 px (même valeur que `.bi-comp-table-data-row`). Hover `var(--bi-bg)` déjà commun aux trois tables.
- `src/app/bikes/[id]/page.tsx` : colonne « Installé » (date) alignée à droite pour homogénéiser les colonnes numériques.
- `src/components/bi/maintenance-card.tsx` : colonnes « Dernier » (date) et « Depuis » (km) alignées à droite en `Mono`.
- `src/app/reglages/entretiens/client.tsx` : en-tête du tableau des types passé à 11 px, padding de ligne harmonisé à `14px 22px` (colonnes numériques déjà à droite en `Mono`).

## [Unreleased] — Landing : contenu réaligné sur l'app

### Changed
- `src/app/page.tsx` : contenu de la page d'accueil remis en cohérence avec l'app (design inchangé) — mockup héro passe de « Prêt à rouler » à « Score de forme » (sous-scores Pièces/Entretien) et « Ce qui t'attend », tableau comparatif mis à jour (retrait « coût/km », ajout Score de forme, Alerte d'usure Strava, Projection des dépenses, Suivi de la dépense d'entretien) et ré-activé dans le rendu, accents corrigés partout, version footer → v0.5.

## [Unreleased] — Page Coût : détail des prix par catégorie

### Added
- `src/lib/data.ts` (`getCostData`) : le `breakdown` remonte désormais le détail par opération (`items: [{ label, total }]`) — remplacements groupés par pièce, entretien courant groupé par type (champ `action`).
- `src/app/cout/page.tsx` : « Où part ton argent » affiche le détail (opération + prix) sous chaque catégorie.

## [Unreleased] — Carte Entretien : ordre des colonnes + échéance au survol

### Changed
- `src/components/bi/maintenance-card.tsx` + `globals.css` : colonnes réordonnées (Entretien · Dernier · Échéance · Depuis) pour coller au tableau des composants (km en dernière colonne). Le détail d'échéance (« dans ~X km ou Y sem. ») n'est plus affiché sous la barre — il passe en info-bulle au survol de la barre.

## [Unreleased] — Dashboard : score de forme du vélo

### Added
- `src/app/dashboard/client.tsx` : « Score de forme » /100 par vélo, jauge circulaire ludique. Composite pièces (~65%, usure des composants via `readinessByBike`) + entretien (~35%, malus par entretien dû/à surveiller). Étiquette (Impeccable / En forme / À surveiller / Négligé), couleur, et ligne d'action (ce qui fait baisser le score).

### Removed
- `src/app/dashboard/client.tsx` : l'ancien bandeau de statut est remplacé par la carte score (mêmes infos, en mieux) ; variables `status*` retirées.

## [Unreleased] — Graphe « Activité · 30 j » déplacé vers la page Coût

### Changed
- `src/app/bikes/[id]/page.tsx` : suppression de la carte « Activité · 30 j » ; le tableau des pièces passe en pleine largeur (calculs locaux retirés).
- `src/lib/data.ts` (`getCostData`) : calcule le graphe d'activité 30 j (tous vélos) à partir des activités déjà chargées → `activity.chart` + `activity.total30d`.
- `src/app/cout/page.tsx` : carte « Activité · 30 j » ajoutée en bas de page comme contexte d'usage.

## [Unreleased] — Page Coût : info-bulle explicative « bilan chaîne »

### Added
- `src/app/cout/page.tsx` + `globals.css` : petit « i » à côté de « Bilan entretien chaîne » qui explique en langage simple pourquoi changer sa chaîne à temps protège cassette et plateaux. Info-bulle en CSS pur (survol desktop + tap mobile via `:focus-within`), classes `.bi-info` / `.bi-info-btn` / `.bi-info-pop`.

## [Unreleased] — Correctifs responsive mobile

### Fixed
- `src/app/reglages/entretiens/client.tsx` + `globals.css` : suppression du scroll horizontal du tableau des entretiens sur mobile — les colonnes chiffrées se replient (`.bi-mt-num`) et réapparaissent en badges (`.bi-mt-badges`) sous le nom.
- `src/components/bi/maintenance-card.tsx` + `globals.css` : carte Entretien lisible sur mobile — bouton « Marquer comme fait » raccourci en « Marquer fait » (spans `.bi-inline-desktop/.bi-inline-mobile`), colonne d'action et padding ajustés, nom tronqué proprement.
- `src/app/cout/page.tsx` : les deux chiffres clés s'empilent sur mobile (retrait d'un `grid-template-columns` inline qui bloquait le responsive) ; en-tête de la projection en `flex-wrap`.

## [Unreleased] — Page Coût : bloc « Bilan entretien chaîne » (fusion)

### Changed
- `src/app/cout/page.tsx` : les cartes « Économisé grâce à l'entretien » et « Coût du non-entretien » sont fusionnées en un seul bloc compact « Bilan entretien chaîne » à deux colonnes (Économisé vert / Gaspillé ambre), pour alléger la page sans perdre le message d'incitation.

## [Unreleased] — Page Coût : coût du non-entretien

### Added
- `src/lib/data.ts` (`getCostData`) : `insights.wastedTransmission` + `lateChains` — miroir de l'économie : chaînes remplacées EN RETARD (au-delà de leur durée de vie) qui ont usé prématurément cassette/plateaux, dépense évitable (même unité que l'économie).
- `src/app/cout/page.tsx` : carte « Coût du non-entretien » (accent ambre), affichée uniquement s'il y a eu des changements de chaîne tardifs, pour inciter à entretenir à temps.

## [Unreleased] — Page Coût : projection « Ce qui t'attend »

### Added
- `src/lib/data.ts` (`getCostData`) : projection des dépenses à venir — rythme km/semaine par vélo (90 j, repli 12 mois) × pièces actives approchant leur fin de vie × leur prix estimé. Retourne `projection.total12m` (à prévoir sur 12 mois) et `projection.upcoming` (prochaines pièces à remplacer, délai + coût estimé).
- `src/app/cout/page.tsx` : carte « Ce qui t'attend » (montant à prévoir sur 12 mois + liste des prochains remplacements avec délai et coût estimé), avec mention d'hypothèse.

## [Unreleased] — Modèle de coût = dépense d'entretien réelle

### Changed
- `src/lib/data.ts` (`getCostData`) : le coût ne compte plus la somme des prix catalogue des pièces, mais uniquement l'argent réellement déboursé — remplacements (`maintenance_logs` action `Remplacement`) + entretiens (avec `maintenance_type`). Nouveaux champs : `spendTotal`, `spend12m`, `breakdown` (par catégorie de remplacement + poste « entretien courant »), `byBike.spend`. Les prix catalogue des pièces d'origine ne sont plus comptés comme dépense (référence uniquement pour l'économie transmission).
- `src/app/cout/page.tsx` : reformulée autour de la dépense d'entretien (« Dépensé en entretien », « cette année », « où part ton argent », dépense par vélo). Un vélo sans remplacement affiche 0 € (honnête).
- `src/app/bikes/[id]/page.tsx` : la stat hero « Coût total » devient « Dépensé en entretien » pour ce vélo (entretiens + remplacements réels), calculée via `maintenance_logs`. Le prix d'achat du vélo n'est jamais affiché.
- `src/app/bikes/page.tsx` : la stat « Coût des pièces » (somme des prix catalogue) devient « Dépensé en entretien » (somme réelle des coûts `maintenance_logs`, tous vélos).

## [Unreleased] — Entretien : bouton « Marquer comme fait »

### Changed
- `src/components/bi/maintenance-card.tsx` + `src/app/globals.css` : le bouton « Fait ✓ » devient « Marquer comme fait » (la coche laissait croire que l'entretien était déjà fait, alors que c'est une action pour l'enregistrer). Colonne d'action élargie (en-tête + mobile) pour accueillir le libellé.

## [Unreleased] — Fiche vélo : retrait du bloc « Analyse »

### Removed
- `src/app/bikes/[id]/page.tsx` : suppression de la carte « Analyse » (Pièce critique + Poste le plus coûteux + Répartition coûts). Les infos coût vivent sur la page Coût, et l'usure est déjà visible dans le tableau des pièces. Calculs et constante `CATEGORY_COLORS` associés retirés.

## [Unreleased] — Coût simplifié et lisible pour tous

### Changed
- `src/app/cout/page.tsx` : page Coût réécrite en version essentielle et lisible pour un non-connaisseur — coût total, dépensé cette année, « économisé grâce à l'entretien » (héro), « où part ton argent » (répartition par catégorie), coût par vélo. Retrait du classement technique €/km, des cartes longévité/prévention et du coût/1000 km.

### Removed
- Suppression de la notion « Coût / km » (et /1000 km) partout où elle était affichée, jugée non parlante : fiche vélo (hero → 4 stats), fiche composant (remplacé par « Km parcourus »), formulaires d'ajout/édition de pièce, comparateur (on garde prix + coût annuel), et reformulation de la landing (« coût réel » au lieu de « €/km »).

## [Unreleased] — Page Coût : bénéfices d'entretien + coût / 1000 km

### Added
- `src/lib/data.ts` (`getCostData`) : nouveaux indicateurs — économie transmission (chaînes remplacées à temps × cassette réelle/défaut + plateaux, ÷ ~2 chaînes par cassette), longévité gagnée (km tenus au-delà de l'estimation, via le `beat` des remplacements), prévention vs réparation (coût entretien courant vs remplacements). Requête remplacements ajoutée.
- `src/app/cout/page.tsx` : section « bénéfices d'entretien » (3 cartes) + note d'hypothèse pour l'estimation transmission.

### Changed
- `src/app/cout/page.tsx` : le coût au kilomètre est exprimé en **€ / 1000 km** (KPI, coût par vélo, classement des pièces) — plus lisible que le €/km.

## [Unreleased] — Coût sorti des vues de gestion (suite)

### Changed
- `src/app/bikes/[id]/page.tsx`, `src/app/components/client.tsx`, `src/app/globals.css` : retrait de la colonne « Coût » (prix d'achat) des tableaux de pièces (fiche vélo + page Pièces, desktop et cartes mobiles). Le prix reste sur la fiche détail d'une pièce ; le KPI « Coût composants » de la page Pièces est conservé.
- `src/app/dashboard/client.tsx` : retrait de la stat « Coût / km » du bandeau (passe de 3 à 2 tuiles). Le coût/km vit désormais sur la page Coût et la fiche vélo. Variable `costPerKmFormatted` supprimée.

## [Unreleased] — Page Coût dédiée + allègement des vues

### Added
- `src/lib/data.ts` : `getCostData()` — agrège coût total (pièces + entretien courant), coût/km moyen, dépense 12 mois, coût par vélo, classement des pièces par €/km, répartition par catégorie.
- Page `src/app/cout/page.tsx` : analyse coût (bandeau KPIs, pièces les plus coûteuses au km, coût par vélo, répartition par catégorie). Entrée « Coût » ajoutée dans la nav latérale.

### Changed
- `src/app/bikes/[id]/page.tsx` + `src/app/globals.css` : retrait de la colonne €/km du tableau des pièces (l'analyse coût est désormais sur la page Coût dédiée). La table de gestion se concentre sur usure / km / état ; le coût/km au niveau du vélo reste dans les stats de la fiche.

## [Unreleased] — Dashboard : lignes « À traiter » cliquables avec surbrillance

### Changed
- `src/app/dashboard/client.tsx` : chaque ligne de la carte « À traiter » devient un `<Link>` cliquable vers le détail de la pièce (`/components/<id>`), avec surbrillance au survol (`bi-component-row`). Le bouton d'action (« Remplacer » / « Planifier ») conserve sa destination propre (comparateur pour les pièces critiques) via un `onClick` avec `stopPropagation`, pour éviter deux liens imbriqués. Import `useRouter` ajouté.

## [Unreleased] — Dashboard : entretiens cliquables avec surbrillance

### Changed
- `src/app/dashboard/client.tsx` : les lignes de la carte « Entretien » deviennent des `<Link>` cliquables vers la modification de l'entretien (`/reglages/entretiens?bike=<id>&edit=<typeId>`), avec la classe `bi-component-row` pour la même surbrillance au survol que les lignes de la page vélo.

## [Unreleased] — Compte : retrait du bloc « Navigation »

### Removed
- `src/app/account/client.tsx` : suppression du bloc de liens rapides « Navigation » (Mes vélos / Pièces / Alertes), redondant avec la nav latérale (desktop) et la nav du bas (mobile). Import `Link` devenu inutile retiré.

## [Unreleased] — Dashboard : cohérence visuelle Entretien / À traiter

### Changed
- `src/app/dashboard/client.tsx` : la carte « Entretien » adopte le même langage visuel que la carte « À traiter » — en-tête avec badge compteur (nombre d'entretiens à faire/à surveiller) et sous-titre de statut, lignes avec barre colorée à gauche, pastille de statut (À FAIRE / BIENTÔT / À JOUR), barre de progression + pourcentage (`pct`) et ligne d'échéance. Données inchangées.

### Fixed
- `src/app/dashboard/client.tsx` : le lien « Voir tout » de la carte « À traiter » renvoyait vers la liste des vélos (`/bikes`) au lieu de la fiche du vélo sélectionné (`/bikes/<id>`, détail des composants). Corrigé pour être cohérent avec la carte « Entretien ».

## [Unreleased] — Page Entretiens présentée comme les Composants

### Changed
- `src/app/reglages/entretiens/client.tsx` : la liste des entretiens adopte le rendu tableau de la page Composants (en-têtes de colonnes Entretien / Échéance km / Échéance temps / Coût, lignes cliquables avec survol pour modifier, icône corbeille pour supprimer, bouton Ajouter). Logique inchangée.

## [Unreleased] — Entretien cliquable → modification directe

### Changed
- `src/components/bi/maintenance-card.tsx` : le nom de chaque entretien est cliquable et renvoie vers sa modification (`/reglages/entretiens?bike=<id>&edit=<slug>`). Le bouton « Fait ✓ » reste pour l'enregistrement rapide.
- `src/app/reglages/entretiens/` (page + client) : lecture du paramètre `edit` pour ouvrir directement le bon entretien en mode édition à l'arrivée.

## [Unreleased] — Alerte d'usure dans la description Strava

### Added
- Migration `supabase/migrations/20260705000002_strava_wear_comment.sql` : colonne `strava_wear_comment` (bool, défaut false) sur `notification_settings`.
- `src/lib/strava-comment.ts` : `commentWearOnActivities` ajoute une phrase d'alerte d'usure critique à la description des sorties Strava (pièces au statut `bad`), idempotent (marqueur « Bike Insight »), sans écraser la description existante.
- Réglage « Alerte dans la description Strava » (opt-in) dans `notification-settings.tsx` + API `notifications/settings` (GET/POST).

### Changed
- `src/app/api/strava/auth/route.ts` : scope OAuth élargi à `activity:write` (reconnexion Strava requise).
- `src/app/api/strava/import/route.ts` : après le recalcul d'usure, annote les nouvelles sorties (imports incrémentaux uniquement) si le réglage est actif.

## [Unreleased] — Retrait bloc « Prochains remplacements »

### Removed
- `src/app/dashboard/client.tsx` : suppression de la carte « Prochains remplacements » (doublon avec « À traiter » pour les pièces critiques). La carte « À traiter » passe en pleine largeur. Variable `budget3m` supprimée (devenue inutile).

## [Unreleased] — Entretiens personnalisables (par vélo)

### Added
- Migration `supabase/migrations/20260705000001_maintenance_types.sql` : table `maintenance_types` (par vélo, RLS complète), fonction `default_maintenance_types()` (les 7 entretiens historiques), trigger `seed_bike_maintenance_types` qui équipe chaque nouveau vélo, et backfill des vélos existants. Le lien avec l'historique se fait via `slug` (= `maintenance_logs.maintenance_type`).
- `src/lib/maintenance-types.ts` : lecture des types depuis la base (`fetchBikeMaintenanceDefs`, `fetchUserMaintenanceDefsByBike`, `mapRowToDef`).
- Page `src/app/reglages/entretiens/` (page serveur + client) : sélecteur de vélo, ajout / modification (nom, description, échéance km, échéance mois, coût) / suppression des entretiens. Entrée « Entretiens » dans la nav latérale + bouton « Gérer » sur la carte Entretien de la page vélo.

### Changed
- `src/components/bi/maintenance-card.tsx`, `src/lib/data.ts`, `src/lib/notifications-helper.ts`, `src/app/bikes/[id]/page.tsx` : les entretiens sont désormais lus depuis `maintenance_types` (par vélo) au lieu du tableau en dur `MAINTENANCE_TYPES`. Le filtrage automatique VTT / freins à patins est remplacé par la liste explicite propre à chaque vélo.

## [Unreleased] — Retrait bloc Historique de maintenance

### Removed
- `src/app/bikes/[id]/page.tsx` : suppression de la carte « Historique de maintenance » de la page vélo, ainsi que la requête `maintenance_logs` (composants) et la construction `history`/`logs` devenues inutiles.

## [Unreleased] — Fix kilométrage sorties manuelles

### Fixed
- `src/components/bi/manual-ride-button.tsx` : une sortie manuelle incrémente désormais `bikes.total_km` (odomètre à vie) en plus d'insérer l'activité. Avant, `total_km` n'était mis à jour que par la synchro Strava (`gear.distance`), donc les sorties manuelles ne faisaient jamais bouger le compteur — l'usure et le « depuis dernier entretien » (ex. « il y a 0 km ») restaient figés. L'incrément est fait avant le recalcul d'usure, qui lit `total_km`.

## [Unreleased] — Ajout vélo manuel

### Added
- `src/components/bi/add-bike-button.tsx` : modal d'ajout de vélo manuel — sélecteur de type (Route/VTT/Gravel/Autre avec emojis), nom, marque, modèle, kilométrage actuel, année. Insert dans `bikes` + recalcul usure + refresh page.
- `src/app/bikes/page.tsx` : slot "Ajouter un vélo manuel" branché sur `AddBikeButton`

---

## [Unreleased] — Page compte + Signup Prénom/Nom

### Added
- `src/app/account/page.tsx` + `client.tsx` : page compte — avatar avec initiales, stats (vélos, composants, alertes), profil (prénom/nom/email), statut Strava, navigation rapide, déconnexion, suppression compte (via support)
- `SideNav` : avatar utilisateur en bas cliquable → `/account`

### Changed
- `src/app/signup/page.tsx` : ajout champs Prénom + Nom (2 colonnes), validation mot de passe renforcée (8 car. min, chiffre, majuscule, spécial), stockage `first_name`/`last_name`/`full_name` dans les métadonnées Supabase

---

## [Unreleased] — Notifications in-app

### Added
- Migration `20260531000001_notifications.sql` : table `notifications` (component_id, bike_id, component_name, bike_name, type warn/bad, read, created_at) + RLS
- `/api/components/recalculate` : après recalcul, insère des notifs pour les composants warn/bad sans doublon (évite les doublons sur notifs non lues)
- `/api/notifications/read` : route POST pour marquer une ou toutes les notifs comme lues
- `SideNavLoader` : fetch du count non lu en parallèle des vélos — passé à `SideNav`
- `SideNav` : item "Alertes" avec icône cloche et badge rouge (count non lues)
- `src/app/notifications/page.tsx` + `client.tsx` : page liste des alertes — marquer une/toutes comme lues, lien vers le composant concerné

---

## [Unreleased] — Page comparateur de remplacement

### Added
- `src/app/components/[id]/compare/page.tsx` : nouvelle page comparateur — carte contexte (usure actuelle / vie restante), 3 options de remplacement générées dynamiquement (Budget / Recommandé / Premium) basées sur le prix et km_max du composant, tableau comparatif détaillé (6 lignes × 3 options), carte raisonnement + prochaines étapes numérotées
- `ReplaceButton` : nouveaux props `label`, `fullWidth`, `variant` — permettent l'intégration dans le comparateur (bouton pleine largeur avec libellé personnalisé et variante accent)
- Lien "Voir les options" dans la page détail composant → `/components/[id]/compare`

---

## [Unreleased] — Landing page

### Changed
- `src/app/page.tsx` : refonte complète selon maquette `web-landing.jsx` — nav avec liens + BETA badge, hero 2 colonnes (headline highlight + mini-dashboard preview animé), metrics strip (4 chiffres clés), section "Comment ça marche" (3 étapes avec visuels), insights réels (3 cartes), tableau comparatif (Bike Insight vs Strava / ProBikeGarage / tableur), CTA dark avec fond radial lime, footer 4 colonnes

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
- Page signup avec AuthShell (ét