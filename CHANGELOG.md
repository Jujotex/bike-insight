# Changelog

## [Non publié] — Remplacement de pièce : process continu

### Modifié
- **`replace-button.tsx`** : le remplacement enchaîne désormais directement sur le formulaire d'ajout pré-rempli (raison → confirmation → ajout du remplaçant), au lieu d'archiver puis proposer un ajout séparé.

## [Non publié] — Ajout pièce : suggestion sélectionnée visible

### Modifié
- **`new-component-form.tsx`** : la suggestion choisie est surlignée (bordure, fond, coche verte, « Sélectionné ») au lieu de ne rien montrer.

## [Non publié] — Page Coût : activité et dépenses côte à côte

### Modifié
- **`cout/page.tsx`** : « Où part ton argent » et « Activité · 3 mois » sont deux cartes distinctes côte à côte (2 colonnes desktop, empilées sur mobile) — plus de graphes empilés dans la même carte.

## [Non publié] — Ajout pièce : grille de types épurée

### Modifié
- **`new-component-form.tsx`** : suppression des icônes « i » par bouton. L'explication du type sélectionné s'affiche d'office sous la grille (plus lisible, moins chargé).

## [Non publié] — Onboarding : pièces classiques cochées par défaut

### Modifié
- **`onboarding/client.tsx`** : Plateaux, Boîtier de pédalier, Roulements de roues, Galets de dérailleur (+ Guidoline hors VTT) sont maintenant cochés par défaut à la création d'un vélo, donc créés d'office. On peut toujours les décocher. Avant : présents mais décochés.

## [Non publié] — Page Coût : répartition des dépenses en tête + km 3 mois

### Modifié
- **`cout/page.tsx`** : « Où part ton argent » remonté juste après les 2 chiffres clés. Le km des 3 derniers mois passe en en-tête du bloc et le mini-graphe d'activité y est intégré ; la carte « Activité · 3 mois » séparée est retirée (fusionnée).

## [Non publié] — feat : liste des pièces par type (fiche vélo)

### Modifié
- **`bikes/[id]/page.tsx`** : la liste des pièces montre le type de pièce (Chaîne, Cassette, Pneus…) plutôt que le nom complet du modèle. Marque toujours en sous-titre ; le modèle exact reste sur la fiche pièce.
- **`components-catalog.ts`** : helper `getComponentType(name)` pour déduire le type depuis le nom.

## [Non publié] — fix : « Vie restante » de la fiche pièce

### Corrigé
- **`components/[id]/page.tsx`** : le chiffre « Vie restante » restait « - » dès qu'une pièce n'avait pas de date d'installation (pièces « d'origine » / « je ne sais pas »). Il est désormais estimé sur le rythme réel du vélo (km/jour, 180 derniers jours), repli sur le rythme depuis l'installation, et affiché en jours/semaines/mois/années.

## [Non publié] — feat : types de pièce complets + info par pièce (ajout d'une pièce)

### Ajouté
- **`new-component-form.tsx`** : sélecteur de type complété (Patins, Galets, Boîtier, Roulements, Guidoline) pour couvrir tout le catalogue, et un « i » par type ouvrant une explication courte (rôle de la pièce + quand la changer) pour les non-initiés.

### Corrigé
- **`getCatalogForTemplate`** : « Disque » (rotor) proposait des plaquettes — corrigé vers les rotors.

## [Non publié] — feat : catalogue complet sur toutes les catégories

### Ajouté
- **`src/lib/components-catalog.ts`** : +44 références réelles sur l'ensemble des familles (chaînes, cassettes, plaquettes/patins, rotors, câbles, plateaux, boîtiers, roulements, galets, guidoline) — ~180 produits au total. Marques ajoutées : KMC X11EL, Wippermann, YBN, SRAM Eagle X01/XX1 et PC-Force22, Shimano CN-M7100/M9100 et N03A, SunRace, Galfer, SwissStop, Jagwire, Kool-Stop Salmon, Wolf Tooth, Praxis, CeramicSpeed, SKF, Kogel, Supacaz, Fizik, Silca…
- Objectif : que l'autocomplétion du champ modèle propose une référence pertinente quelle que soit la pièce.

## [Non publié] — feat : catalogue enrichi (pneus, GRX 10v/12v)

### Ajouté
- **Pneus** (`components-catalog.ts`) : gravel (Schwalbe G-One Allround/R, WTB Riddler, Vittoria Terreno Dry, Continental Terra Speed), route (Schwalbe Pro One, GP5000 S TR, Pirelli P Zero Race), VTT 29/27,5 (Maxxis Rekon, Schwalbe Nobby Nic, Continental Cross King).
- **Groupes GRX manquants** (`bike-templates.ts`) : `shimano-grx-10v` (RX400) et `shimano-grx-12v` (RX820) — seul le 11v existait.

### Corrigé
- **`getCatalogForTemplate`** : la suggestion de pneus était toujours « route ». Elle suit désormais le type de vélo (gravel/VTT/route). Un gravel voit enfin ses pneus gravel.

### Modifié
- Panneau « Suggestions compatibles » limité à 6 entrées sur les deux formulaires ; tout le catalogue reste trouvable via l'autocomplétion.

## [Non publié] — feat : autocomplétion du modèle depuis le catalogue

### Ajouté
- **`src/lib/components-catalog.ts`** (`searchCatalog`) : recherche libre dans tout le catalogue par mots (nom + marque + référence), dédupliquée. On tape « gp 5000 » ou « conti gp » et le produit remonte. Quelques pneus Michelin ajoutés au catalogue route (Lithion 3, Power Cup).
- **`src/components/bi/catalog-autocomplete.tsx`** : champ de saisie avec suggestions catalogue. La sélection pré-remplit marque/modèle, prix et durée de vie estimée.

### Modifié
- **Création d'une pièce** (`new-component-form.tsx`) et **création/configuration d'un vélo** (`onboarding/client.tsx`) : les champs libres de modèle proposent le catalogue en direct pendant la frappe, en complément des suggestions déjà filtrées par groupe.

## [Non publié] — feat : arbitrage « je le fais » vs « vélociste » sur le dashboard

### Ajouté
- **`src/app/dashboard/client.tsx`** : les lignes de la carte **« À traiter »** affichent désormais, sous l'urgence, de quoi trancher entre le faire soi-même et passer à l'atelier — jauge de difficulté (1–3), temps indicatif en autonomie, fourchette de main-d'œuvre. Données issues de `findRepairGuide` (statiques, fonction pure) : **aucune requête ajoutée**.
- L'intérêt est d'avoir cet arbitrage **en liste** et non sur une page isolée : on compare les pièces entre elles et on groupe une session d'entretien (« les plaquettes 15 min, les pneus 10 min, je fais les deux samedi »).

### Choix de conception
- **Écarté : une page « Tutos »** centralisant les guides de remplacement. Le contenu de `repair-guides.ts` est fait de **liens sortants** (Alltricks, Probikeshop) — 10 URLs réelles, le reste pointant vers un hub générique. Un index en navigation principale aurait promu du contenu tiers au rang de fonctionnalité, et perdu le contexte (« ta chaîne est à 94 % ») qui fait la valeur de la donnée.
- **Écarté aussi : une page « À prévoir »** dédiée (construite puis retirée avant publication). Elle faisait doublon avec la carte « À traiter » du dashboard — mêmes `attentionItems`, même filtrage par vélo — et avec la liste « Pièces » de `/bikes/[id]`. Trois écrans listant des pièces. Seule la ligne d'arbitrage apportait quelque chose de neuf : elle a été déplacée sur le dashboard, la page supprimée.

## [Non publié] — refactor : sélecteur de vélo unifié, trié, sans « tous les vélos »

### Modifié
- **Ordre** : les pastilles sont classées par **kilométrage sur 12 mois, décroissant** — le vélo le plus roulé en premier — sur le dashboard et la page Coût. Auparavant l'ordre venait de la base (`total_km` cumulé côté dashboard, aucun ordre garanti côté Coût), ce qui plaçait parfois en tête un vélo peu utilisé sur l'année.
- **Plus d'option « Tous les vélos »** sur la page Coût : un vélo est toujours sélectionné, comme sur le dashboard. Cohérent avec l'audit de fiabilité — un agrégat tous-vélos mêle des chiffres qui ne se comparent pas (usure, coût et échéances dépendent du vélo).
- **`src/lib/data.ts` (`getCostData`)** : résout elle-même le vélo par défaut (le plus roulé sur 12 mois). Un `?bike=` absent, inconnu ou pointant sur un vélo archivé retombe sur ce défaut au lieu d'afficher une page vide.
  - ⚠️ **Conséquence** : la fonction fait désormais **deux allers-retours séquentiels** au lieu d'un. Il faut connaître la liste des vélos et leur ordre avant de lancer les requêtes filtrées — trois requêtes « tous vélos » (liste, états, distances 12 mois) puis six requêtes filtrées.
- Le dashboard réutilise `km12mByBike`, déjà calculé par `getDashboardData` : aucune requête ajoutée de ce côté.

## [Non publié] — suppression : carte « Où tu te situes » (page Coût)

### Supprimé
- **`src/app/cout/page.tsx`** : carte « Où tu te situes » — comparaison du coût/km et du kilométrage annuel à des fourchettes de référence (0,03–0,08 €/km, 3000–8000 km/an). Repères génériques, non actionnables : savoir qu'on est « dans la moyenne » ne déclenche aucune décision d'entretien. Helper `fmtPerKm` et calculs `costVerdict`/`costColor`/`costWord` retirés avec elle.
- **`src/lib/benchmarks.ts`** — n'était consommé que par cette carte.

### À noter
- `kpis.costPerKm` reste calculé dans `getCostData` mais n'est plus affiché nulle part. Conservé (simple division, aucune requête supplémentaire) ; à supprimer si aucun écran ne le reprend.

## [Non publié] — fix : recherche de vélocistes (miroirs Overpass + repli Photon)

### Corrigé
- La recherche de vélocistes renvoyait « Recherche indisponible pour le moment » sur des adresses valides. Deux fragilités, toutes deux sur des services publics gratuits :
  - **`src/lib/velocistes.ts` (`findVelocistes`)** : un seul serveur Overpass (`overpass-api.de`), régulièrement saturé (429 / 504) ou en maintenance → échec immédiat. La recherche essaie maintenant **trois miroirs** dans l'ordre et ne remonte l'erreur que si tous échouent.
  - **`src/lib/velocistes.ts` (`geocodeAddress`)** : Nominatim bloque volontiers les IP de datacenter (Vercel). **Repli sur Photon**, déjà utilisé pour l'autocomplétion — aucune dépendance en plus.

### Modifié
- **`src/app/api/velocistes/route.ts`** : les deux `catch {}` avalaient l'erreur sans trace. Elles sont désormais **loguées** côté serveur, et les deux échecs ne partagent plus le même message opaque — « Impossible de localiser cette adresse » (géocodage) vs « L'annuaire des magasins ne répond pas » (Overpass). Diagnostic possible depuis les logs Vercel.

## [Non publié] — fix : état des pièces lisible sur les cartes vélo

### Corrigé
- **`src/app/bikes/page.tsx`** — la bande d'état affichait un compteur nu (« ● 2 ● 1 ») quand des pièces demandaient une action, alors que le cas sain affichait « Tout OK » en toutes lettres : **l'état urgent était le moins lisible des deux**. Les trois états sont désormais des badges nommés sur fond teinté (`--bi-bad-soft` / `--bi-warn-soft` / `--bi-ok-soft`) — « 2 à remplacer », « 1 à surveiller », « Tout OK ».

## [Non publié] — refactor : sélecteur de vélo unifié (dashboard = Coût)

### Corrigé
- Le sélecteur de vélo de la page **Coût** n'affichait pas la **pastille d'état** (vert / orange / rouge) présente sur le dashboard — deux composants distincts avaient divergé visuellement.

### Modifié
- **Nouveau `src/components/bi/bike-picker.tsx`** : composant `<BikePicker>` unique, utilisé par le dashboard **et** la page Coût. Deux modes de navigation (`onSelect` pour l'état client du dashboard, `hrefFor` pour le filtrage serveur `?bike=` de la page Coût), un seul rendu. Les deux ne peuvent plus diverger.
- **`bike-picker.tsx` — prop `hrefFor` (fonction) remplacée par `basePath` (chaîne).** La première version prenait une fonction de construction d'URL ; passée depuis un composant serveur (`/cout`, `/a-prevoir`) vers ce composant client, elle n'est pas sérialisable et faisait **planter la page en 500**. Les URLs sont maintenant assemblées dans le composant. L'ancien `CostBikePicker` n'avait pas ce défaut car il construisait ses liens en interne — régression introduite par l'unification, corrigée.
- **`src/lib/data.ts` (`getCostData`)** : `allBikes` renvoie désormais un `status` par vélo (pire état de ses pièces actives — même règle que le dashboard), calculé sur **tous** les vélos et non sur la sélection courante, pour que les pastilles restent justes quand la page est filtrée.
- **`src/app/dashboard/client.tsx`** + **`src/app/cout/page.tsx`** : consomment le composant partagé. Le garde `bikes.length > 1` vit maintenant dans `<BikePicker>`.

### Supprimé
- **`src/components/bi/cost-bike-picker.tsx`** — remplacé par `<BikePicker>`.

## [Non publié] — fix : stats pièce lisibles (« 0 j » trompeur, Intensité inutile)

### Corrigé
- **`src/app/components/[id]/page.tsx`** — « Vie restante » affichait **`0 j`** dès que `km_used >= km_max`, ce qui se lisait « il reste zéro jour » alors que ça veut dire « limite d'usure déjà dépassée ». Affiche désormais **`Dépassé`**.
- Même carte : le calcul de vie restante est réécrit en cas explicites (dépassé / estimable / non estimable) au lieu d'une condition composite dont le repli `-` était silencieux.
- **Unité recollée au ratio d'usure** : le bloc affichait `5 917 / 8 000` puis, à la ligne, `km - 2 083 km restants` — le `km` qualifiait le ratio du dessus mais se lisait comme un préfixe orphelin. Devient `5 917 / 8 000 km` / `2 083 km restants`.
- **`~` retiré des « km restants »** (page pièce + page « Remplacer ») : c'est une soustraction exacte (`km_max - km_used`), pas une estimation — le tilde suggérait à tort une incertitude. Il reste sur « Vie restante », qui est bien une extrapolation.

### Supprimé
- Stat **« Intensité »** (km/mois classé Faible/Modérée/Élevée) : non actionnable — elle décrit l'usage du cycliste, pas l'état de la pièce — et affichait `-` sans explication sur toute pièce sans `installed_at` (pièces d'origine, date inconnue).

### Ajouté
- Stat **« Coût / 1000 km »** (`prix d'achat ÷ km parcourus × 1000`) à sa place : rattachée au suivi de coût, elle permet de comparer une pièce chère qui dure à une pièce bon marché remplacée souvent. Affiche `-` si le prix d'achat ou le kilométrage manque.

## [Non publié] — fix : audit de fiabilité des chiffres (un vélo ≠ tous les vélos)

### Corrigé
- **`src/app/bikes/page.tsx`** : les cartes vélo lisaient `bad_count`/`warn_count`, colonnes **inexistantes** dans la vue `bike_stats` → toutes les cartes affichaient « Tout OK » même avec des pièces à remplacer. Les compteurs sont désormais calculés depuis les composants actifs.
- **`src/lib/data.ts` (`getBikeData`)** : les stats « Sorties · 12 m » et « Moy. par sortie » de la page vélo étaient calculées sur les **90 dernières activités** (`limit(90)`) → sorties plafonnées à 90 et km sous-comptés. La requête couvre maintenant les 12 derniers mois sans limite.
- **`src/app/dashboard/client.tsx`** : un vélo sans sortie sur 12 mois affichait le total **tous vélos** en repli (`?? kpis.totalKm12m`). Repli sur 0 : un chiffre affiché sous le nom d'un vélo appartient toujours à ce vélo.

### Supprimé (chiffres jamais affichés ou trompeurs)
- **`getDashboardData`** allégé : suppression de `budget12m`/`budget12mTotal` (rien de « 12 mois » — c'était la somme des prix des pièces actives), `costByCategory` et `kpis` mixtes (vélo principal et global mélangés), `bikeStatus`, `readinessScore` global, `activityChart` 30 j — aucun n'était affiché. 3 requêtes Supabase en moins ; ne restent que des chiffres rattachés à un vélo précis.
- **`getComponentsData`** + **`src/app/components/client.tsx`** : code mort (la page `/components` redirige vers `/bikes`) dont le KPI « Coût composants » additionnait valeur des pièces actives et dépenses 12 mois — deux notions incomparables.

## [Non publié] — fix : dashboard « 12 mois » par vélo (cohérent avec compare)

### Corrigé
- Le dashboard affichait la distance/sorties « 12 mois » **tous vélos confondus** (`kpis.totalKm12m` global), non filtré par le sélecteur de vélo → incohérent avec la page compare qui est par vélo (ex. dashboard 4689 km tous vélos vs 3363 km pour le seul Scott).
- **`src/lib/data.ts`** : `getDashboardData` calcule et expose `km12mByBike` / `rides12mByBike` (12 mois par vélo).
- **`src/app/dashboard/page.tsx`** + **`client.tsx`** : la carte « 12 mois » (km + sorties) reflète désormais le **vélo sélectionné**, comme le reste du dashboard. Elle correspond au chiffre de la page compare.

## [Non publié] — fix : km/an = vraie distance 12 mois + repli odomètre

### Corrigé
- Le « km/an » de la page « Remplacer » affichait un chiffre faux/instable (5839 → 7048 → 1895) car il sommait les activités Strava, souvent **incomplètes** (historique partiel, sorties non taguées à ce vélo).
- **`src/app/components/[id]/compare/page.tsx`** : le km/an vise la **vraie distance des 12 derniers mois** (ce que l'utilisateur attend pour le coût annuel). Garde-fou : si cette distance est manifestement sous-comptée (bien en dessous de ce que l'odomètre implique), bascule sur **total ÷ âge du vélo** (âge planché à 1 an → jamais > total). Ex. Scott Addict 5839 km / 1,5 an → ~3893 km/an au lieu de 1895.

### ⚠️ Prérequis
- Nécessite l'historique Strava complet : cliquer **« Tout réimporter »** (page Vélos) pour que la distance 12 mois et l'âge du vélo soient exacts.

## [Non publié] — feat : sélecteur de vélo sur la page Coût

### Ajouté
- **`src/components/bi/cost-bike-picker.tsx`** : sélecteur d'onglets « Tous les vélos » + un onglet par vélo (même style que le dashboard). Filtrage côté serveur via `?bike=<id>`.

### Modifié
- **`src/lib/data.ts`** : `getCostData(bikeId?)` filtre désormais toutes ses requêtes (composants, activités, entretiens, remplacements) par vélo quand un id est fourni ; renvoie `allBikes` (liste complète pour le sélecteur) et `selectedBikeId`. Sans id → agrégat de tous les vélos (comportement actuel).
- **`src/app/cout/page.tsx`** : lit `?bike=`, passe l'id à `getCostData`, et affiche le sélecteur en haut (si plus d'un vélo). Toute la page (chiffres, répartition, projection) reflète le vélo choisi.

## [Non publié] — style : largeur de page unique sur toute l'app

### Modifié
- Les pages posaient chacune leur `maxWidth` en inline (6 valeurs différentes : 700, 820, 900, 1100, 1200, et le détail vélo en pleine largeur) → incohérence visuelle.
- **`src/app/globals.css`** : `.bi-page` définit désormais **une largeur unique (1120px, centrée)** appliquée à **toutes** les pages de l'app. Une seule source, fini les nombres au hasard.
- `maxWidth` inline retiré partout (dashboard, vélos, détail vélo, composant, comparer, coûts, entretiens, tuto, ajout, édition, compte).

## [Non publié] — style : échéance d'entretien = une seule dimension (km OU temps)

### Modifié
- Les échéances d'entretien affichaient « Dans ~158 km **ou** 3 sem. » — les deux, ce qui alourdissait sans aider (seule la première atteinte déclenche).
- **`src/lib/maintenance-catalog.ts`** : `computeMaintenanceStatus` expose `dueKind` (`km`/`time`) = l'échéance **la plus proche** (ratio d'usure le plus avancé). Nouveau helper `formatNextDue(status)` qui ne renvoie que cette dimension.
- **`src/components/bi/maintenance-card.tsx`** et **`src/lib/data.ts`** (dashboard) : n'affichent plus qu'une seule échéance via `formatNextDue`.

## [Non publié] — feat : « Ce qui t'attend » cliquable + entretiens à venir

### Modifié
- **`src/lib/data.ts`** : la projection `getCostData` inclut désormais les **entretiens à venir** qui ont un coût atelier (purge, révision, suspension…) en plus des pièces à remplacer, via `computeMaintenanceStatus` — donc le total « à prévoir · 12 mois » reflète aussi les entretiens. Chaque élément porte un `href` (pièce → `/components/[id]`, entretien → `/bikes/[id]`). Liste passée à 6 éléments.
- **`src/app/cout/page.tsx`** : les lignes de « Ce qui t'attend » sont **cliquables** (survol + chevron) et renvoient vers la pièce ou le vélo concerné. Badge « Entretien » sur les lignes d'entretien, libellé « à faire » adapté.

## [Non publié] 