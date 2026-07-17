# Changelog

## [Non publié] — fix : km/an réel sur la page « Remplacer »

### Corrigé
- Le « km/an » (et le « coût annuel » qui en découle) affichait le kilométrage **total** (ex. 5 839 km/an) : quand la date d'installation était inconnue, le code supposait « 1 an » d'âge → km/an = km cumulés.
- **`src/app/components/[id]/compare/page.tsx`** : le km/an est désormais calculé à partir des **sorties Strava réelles** du vélo, annualisées sur la période effectivement couverte (juste même si l'historique est partiel). Replis : estimation via l'usage réel de la pièce, sinon défaut prudent (3 000 km/an). Plafonné à 30 000 km/an. Se fiabilise encore après « Tout réimporter ».

## [Non publié] — fix : compteur de sorties à vie (cohérent avec les km)

### Corrigé
- Le nombre de « sorties » sur les cartes vélo était compté sur ~90 j (fenêtre du premier import Strava) alors que les km affichés sont ceux de l'odomètre Strava (à vie) — d'où des incohérences (ex. 268 km mais 0 sortie).

### Modifié
- **`src/app/api/strava/import/route.ts`** : le **premier import récupère désormais tout l'historique** Strava (`after=0`) au lieu des 90 derniers jours. Nouveau flag `?full=1` pour **réimporter tout l'historique** d'un compte déjà synchronisé (backfill). `PAGE_SIZE` porté à 200 (max Strava) pour limiter les pages. L'annotation Strava reste désactivée sur les imports complets.
- **`src/app/bikes/page.tsx`** : les cartes comptent les sorties **à vie** (et la dernière sortie sur tout l'historique), cohérent avec les km à vie. Le KPI « Sorties · 12 m » du bandeau reste calculé sur 12 mois (sur la même passe).
- **`src/components/bi/sync-button.tsx`** : bouton secondaire « Tout réimporter » (déclenche `?full=1`).

### À noter
- Les vélos déjà importés doivent cliquer **« Tout réimporter »** une fois pour récupérer l'historique complet. Les nouveaux comptes l'ont d'office.

## [Non publié] — feat : identification modèle précise + confiance (Phases 2 & 3)

### Ajouté
- **`src/lib/bike-models.ts`** (Phase 2) : les familles peuvent porter des **finitions** (`trims`) avec **année** (ex. « Addict 30 » 105 11v ≤2021 / 105 12v ≥2022). Nouveau `resolveBikeModel(text)` qui renvoie le groupe **+ un niveau de confiance** (`high` finition+année, `medium` finition seule, `low` famille seule) et une note honnête. `matchBikeModel` conservé pour compat.

### Modifié
- **`src/app/onboarding/client.tsx`** (Phase 3) : le pré-remplissage utilise `resolveBikeModel` et affiche un **badge de confiance** (Confiance élevée / À confirmer / Groupe supposé) + la note. Fini le « pré-rempli » présenté comme certain.
- **`src/app/components/[id]/compare/page.tsx`** (Phase 3) : encart honnête pour les freins — « le modèle exact dépend de ton étrier, vérifie le code gravé (L03A/K02S = route, M06/B01S = VTT), sinon ton vélociste ». Ancre la reco sur la vraie pièce pour un client non-mécano.

### Reste à faire
- La table des finitions est **amorcée** (Scott Addict, Canyon Endurace/Ultimate, Trek Domane…) et doit grandir dans le temps (ou être alimentée par une source externe plus tard).
- Split route/VTT côté SRAM (plaquettes) encore ouvert.

## [Non publié] — feat : moteur de règles de compatibilité (source de vérité) — Phase 1

### Ajouté
- **`src/lib/groupsets.ts`** : **source de vérité** de la compatibilité. Registre typé des 25 groupes (`GROUPSETS`) décrivant discipline, vitesses et **type d'étrier → type de plaquette** de façon déterministe. `resolvePadCatalogId(groupsetId)` remplace la déduction par mots-clés. `findBikeDataIssues()` audite les templates et remonte toute incohérence (ex. plaquette VTT sur groupe route).
- **`src/instrumentation.ts`** : hook de démarrage Next qui exécute `findBikeDataIssues()` et logue les incohérences — filet anti-régression, sans nouvelle dépendance.

### Modifié
- **`src/lib/components-catalog.ts`** : `getCatalogForTemplate` reçoit l'`id` du groupe et route les plaquettes disque via `resolvePadCatalogId` (déterministe) ; les anciens replis marque/type de vélo restent en secours si le groupe est inconnu.
- **`src/lib/bike-templates.ts`** : Sora, Tiagra et Claris route corrigés (plaquettes `M04`/génériques VTT → `L03A` route type L), pour que les données passent le validateur.
- **`compare/page.tsx`**, **`new-component-form.tsx`**, **`onboarding/client.tsx`** : passent l'`id` du groupe à `getCatalogForTemplate`.

### Reste à faire (prochaines phases)
- Le split route/VTT côté **SRAM** (les plaquettes route SRAM pointent encore l'entrée VTT) est désormais trivial à corriger via la source de vérité.
- Phase 2 : base modèles avec finition + année (lever l'ambiguïté « Addict » vs « Addict 30 »). Phase 3 : niveaux de confiance + repli honnête.

## [Non publié] — fix : compatibilité plaquettes route vs VTT (M06)

### Corrigé
- Les groupes route Shimano proposaient des plaquettes **M06**, qui sont des plaquettes **VTT** (étriers Deore 2 pistons) — incompatibles avec un 105 route à disque (étriers flat-mount type L/K).
- **`src/lib/bike-templates.ts`** : les templates route (105 11v, 105 12v, Ultegra 11v) installent désormais les bonnes plaquettes — `L03A` (type L, 11v) et `K02S` (type K, 12v) — au lieu de M06.
- **`src/lib/components-catalog.ts`** : ajout de deux entrées catalogue `brake-disc-shimano-road-11v` (type L : L03A/L04C) et `-12v` (type K : K02S). `getCatalogForTemplate` reçoit désormais le type de vélo et route route/gravel Shimano vers les plaquettes flat-mount ; le VTT garde M06. L'entrée VTT est reclassée « Shimano VTT » pour lever l'ambiguïté.
- **`src/app/components/[id]/compare/page.tsx`**, **`src/components/bi/new-component-form.tsx`**, **`src/app/onboarding/client.tsx`** : passent le `bikeTypes` du template à `getCatalogForTemplate`.

### À noter
- Les vélos déjà créés gardent en base le nom « Plaquettes disque Shimano M06 » (donnée historique) ; la recommandation de remplacement, elle, propose désormais les bonnes plaquettes route. Renommer la pièce via « Modifier » si besoin d'exactitude.

### Supprimé
- **`src/app/components/[id]/page.tsx`** : carte « Informations » (Vélo / Catégorie / Installé le / Km vélo à la pose) retirée — redondante avec l'en-tête (vélo, catégorie) et le sous-titre (date d'installation).

## [Non publié] — style : alignement du héros composant (colonne de droite)

### Modifié
- **`src/app/components/[id]/page.tsx`** : dans le bloc héros de la page composant, la colonne de droite (recommandation + stats) laissait un vide en bas car plus courte que la carte d'usure de gauche. La grille de stats prend désormais `flex: 1` pour combler l'espace et aligner le bas des deux colonnes ; le contenu des cellules est centré verticalement.

## [Non publié] — style : page tuto responsive (mobile)

### Modifié
- **`src/app/globals.css`** + **`src/app/components/[id]/tuto/page.tsx`** : ajout de règles responsive pour la page tuto (les bouts en styles inline ne réagissaient pas aux media queries). Sous 768 px : le fil d'ariane est masqué (le bouton Retour suffit, évite le débordement avec un nom de pièce long), et le héros est plus compact (padding réduit, titre 22 px). Le reste était déjà responsive : les deux cartes DIY/vélociste passent en 1 colonne via `bi-grid-2`, et le finder (champ, chips, liste scrollable) s'adapte en flex.

## [Non publié] — style : cartes DIY / vélociste à hauteur égale

### Modifié
- **`src/app/components/[id]/tuto/page.tsx`** : retour à `align-items: stretch` (par défaut) sur la grille des deux options — les cartes « Je le fais moi-même » et « Je passe chez le vélociste » ont à nouveau la même hauteur (bouton DIY calé en bas). C'est possible sans risque puisque la liste des vélocistes scrolle désormais à hauteur fixe et ne fait plus grandir la carte.

## [Non publié] — fix : plus d'infos vélocistes via clés OSM alternatives

### Modifié
- **`src/lib/velocistes.ts`** : les infos affichées (téléphone, site) proviennent d'OpenStreetMap, où les contributeurs utilisent des clés variées. On tente désormais plusieurs variantes — téléphone (`phone`, `contact:phone`, `contact:mobile`, `phone:mobile`), site (`website`, `contact:website`, `url`, `contact:url`) — pour surfacer l'info quand elle existe sous une autre clé. Les champs restent affichés seulement s'ils existent (données OSM par nature inégales).

## [Non publié] — style : liste des vélocistes retravaillée (pastilles + scroll)

### Modifié
- **`src/components/bi/velociste-finder.tsx`** : refonte visuelle de la liste des résultats. Chaque vélociste a une pastille générée (initiale du nom sur fond encre + accent — visuel sans requête, OSM ne fournissant pas de photos fiables), un badge de distance, l'adresse, les horaires si disponibles, et des chips d'action (Itinéraire / Site / Appeler). La liste est désormais **scrollable à hauteur fixe** (`max-height` + `overflow-y`) avec un en-tête de comptage, pour ne plus allonger la page. Ajout d'un `chipStyle` réutilisable.

## [Non publié] — feat : autocomplétion d'adresse dans la recherche de vélocistes

### Ajouté
- **`src/lib/velocistes.ts`** : `suggestAddresses` (type-ahead) via **Photon (Komoot)** — moteur de géocodage OSM conçu pour l'autocomplétion, contrairement à Nominatim qui l'interdit sur son serveur public. Gratuit, sans clé. Renvoie label + coordonnées, dédupliqué.
- **`src/app/api/velocistes/suggest/route.ts`** : route handler `GET` authentifiée renvoyant les suggestions d'adresse (min. 3 caractères).

### Modifié
- **`src/components/bi/velociste-finder.tsx`** : le champ adresse propose une liste de suggestions au fil de la frappe (debounce 250 ms, dropdown). Sélectionner une suggestion lance directement la recherche avec ses coordonnées (plus précis, pas de second géocodage). Le bouton « Chercher » reste un repli si l'utilisateur ne pique pas de suggestion.

## [Non publié] — feat : recherche de vélocistes par adresse (page tuto)

### Ajouté
- **`src/lib/velocistes.ts`** : logique de recherche 100 % OpenStreetMap, sans clé API ni dépendance. `geocodeAddress` (Nominatim) transforme une adresse en point ; `findVelocistes` (Overpass, `shop=bicycle`) renvoie les magasins vélo dans un rayon de 15 km, triés par distance (Haversine), avec nom, adresse, téléphone/site/horaires si dispo et un lien itinéraire externe. `fetchWithTimeout` pour ne pas laisser pendre les requêtes.
- **`src/app/api/velocistes/route.ts`** : route handler `GET` authentifiée. Deux modes — `?q=adresse` (géocodage) ou `?lat=&lon=` (géolocalisation). Gère les erreurs (adresse introuvable → 404, service indispo → 502).
- **`src/components/bi/velociste-finder.tsx`** : composant client. Champ adresse + bouton « Utiliser ma position » (géolocalisation navigateur), résultats rendus **en liste** (pas de carte, app légère) avec distance, itinéraire, site et appel. États chargement / erreur / vide gérés.

### Modifié
- **`src/app/components/[id]/tuto/page.tsx`** : le finder est intégré dans la carte « Je passe chez le vélociste ». Grille des deux options alignée en haut (`align-items: start`) pour que la carte DIY ne s'étire pas quand la liste s'allonge.

## [Non publié] — fix : tutos de réparation pointant au bon endroit

### Corrigé
- **`src/lib/repair-guides.ts`** : deux bugs de mapping des tutos.
  - **Collision de mots-clés** : « Boîtier de pédalier » était capté par le guide « plateaux » (mot-clé « pédalier ») et proposait le mauvais tuto. Ajout d'un guide `boitier` dédié, placé **avant** `plateaux` dans l'ordre de priorité, avec son propre tuto (roulements de pédalier externes).
  - **Replis génériques** : plusieurs pièces tombaient sur le hub d'entretien générique faute de guide. Ajout de guides dédiés `derailleur` (galets/dérailleur), `roulements` (roulements de roue) et `chambre` (chambre à air), pointant vers les vrais tutos Alltricks correspondants.
  - **URLs** : toutes les URLs Alltricks re-vérifiées (juillet 2026) contre le hub d'entretien officiel ; `chaine` → URL canonique `remplacer-sa-chaine`, `cable` → `remplacementdescables_v2`, `cat-transmission` → `entretien-transmission-velo`.
  - **Flag `generic`** : les guides sans tuto dédié (plateaux, disque, catégories freinage/roues/cockpit, repli générique) sont marqués `generic: true` — ils pointent honnêtement le hub d'entretien.
- **`src/app/components/[id]/tuto/page.tsx`** : quand `guide.generic`, le CTA affiche « Voir les tutos d'entretien » (au lieu de « Voir le tuto ») avec une note « Pas de tuto dédié pour cette pièce » — plus de fausse promesse de tuto précis.

## [Non publié] — feat : lien « Prochaines étapes » → page tuto (compare)

### Modifié
- **`src/app/components/[id]/compare/page.tsx`** : l'étape 2 de « Prochaines étapes » (« Fais-la poser ou installe-la toi-même ») faisait doublon avec la nouvelle page tuto. Elle pointe désormais vers `/components/[id]/tuto` via un lien « Voir le tuto et les options », reliant le cycle de remplacement (commander → poser → marquer → suivi) au détail DIY vs vélociste au lieu de le répéter. Tableau des étapes typé explicitement (`href`/`linkLabel` optionnels).

## [Non publié] — fix : alignement des tableaux Pièces et Entretien (détail vélo)

### Modifié
- **`src/app/globals.css`** : les tableaux « Pièces » (`.bi-comp-table-*`) et « Entretien » (`.bi-maint-*`) utilisaient des grilles différentes (`1.5fr 1fr 1.4fr 0.6fr` vs `1.6fr 0.9fr 1.1fr 0.9fr 52px`), d'où des barres d'usure, pourcentages et colonnes km/date jamais alignés d'un tableau à l'autre. Les deux partagent désormais **la même géométrie** — desktop `1.6fr 0.9fr 1.3fr 0.9fr 52px`, mobile `1.7fr 1.3fr 44px`.
- **`src/app/bikes/[id]/page.tsx`** : le tableau Pièces gagne une 5e colonne (span d'en-tête vide + chevron `›` discret par ligne) pour matcher la colonne d'action de l'Entretien et signaler que la ligne est cliquable. Colonnes désormais parfaitement alignées entre les deux tableaux.

## [Non publié] — style : carte « Et maintenant ? » proportionnelle à l'urgence

### Modifié
- **`src/app/components/[id]/page.tsx`** : ajout de `nextStepUrgent` (`status` = `bad`/`warn`). L'en-tête de la carte « Et maintenant ? » n'affiche le traitement fort (accent lime plein + pastille sombre + bouton d'action sombre) que lorsqu'une action est requise ; sur une pièce en bon état il repasse en version discrète (accent doux + lien texte). Évite de « crier » la prochaine étape sur une pièce neuve.

## [Non publié] — style : carte « Et maintenant ? » remontée et mise en évidence

### Modifié
- **`src/app/components/[id]/page.tsx`** : la carte « Et maintenant ? » était placée en avant-dernier (après le graphe d'usure et l'historique) — trop bas, facile à manquer. Elle est **remontée juste sous le bloc Recommandation du statut**, pour enchaîner directement « à remplacer » → « voici comment ». En-tête passé en **accent lime plein** (`--bi-accent`) avec pastille outil sombre et un vrai bouton d'action sombre « Voir le détail » (au lieu du simple lien texte sur fond lime doux), pour un contraste fort avec le bloc de recommandation coloré au-dessus (rouge/ambre = problème, lime = action).

## [Non publié] — style : relief visuel de la page tuto + carte « Et maintenant ? »

### Modifié
- **`src/lib/repair-guides.ts`** : ajout de `DIFFICULTY_LEVEL` (1–3, pour jauge) et `DIFFICULTY_COLOR` (tokens `--bi-ok`/`--bi-warn`/`--bi-bad`) pour coder visuellement la difficulté.
- **`src/app/components/[id]/tuto/page.tsx`** : refonte visuelle. Héros contrasté `--bi-ink` avec eyebrow et pastille outil en accent lime (`--bi-accent`), titre d'opération en display 28px, et jauge de difficulté (3 segments colorés). Les deux options deviennent deux cartes distinctes avec icônes en pastille (clé pour DIY, devanture pour vélociste), chiffres clés en display 28px (temps / main-d'œuvre), et CTA lime signature vers le tuto externe côté DIY. Couleurs 100 % via tokens (opacité pour le texte sur fond sombre, pas de nouvelle couleur), tailles d'affichage documentées, radius autorisés.
- **`src/app/components/[id]/page.tsx`** : la carte « Et maintenant ? » reçoit une pastille outil accent dans l'en-tête et une jauge de difficulté colorée côté DIY, pour aligner le langage visuel avec la page tuto.

## [Non publié] — feat : page tuto dédiée + carte « Et maintenant ? » renforcée

### Ajouté
- **`src/app/components/[id]/tuto/page.tsx`** : nouvelle page hub contextuelle par composant. Reprend le modèle de `/compare` (Server Component, auth, `component_stats` + `bikes`, `PageHead` avec bouton Retour). Affiche l'opération de réparation, un bandeau difficulté (libellé + description) et temps DIY indicatif, puis un arbitrage détaillé « je le fais moi-même » (temps, niveau, outils indicatifs sous forme de pills, bouton vers le tuto externe hébergé par la source) vs « je passe chez le vélociste » (fourchette main-d'œuvre). Note de prudence en pied (ordres de grandeur, pas un devis, vérifier la compatibilité). Zéro contenu maison : la page agrège du contexte + un lien tuto externe, conforme à la vision (aide à la décision, pas producteur de tutos).

### Modifié
- **`src/lib/repair-guides.ts`** : le type `RepairGuide` gagne trois champs indicatifs — `timeMin`/`timeMax` (temps DIY en minutes) et `tools` (outils indicatifs) — renseignés sur chaque guide et le repli générique. Ajout des helpers exportés `DIFFICULTY_LABELS`, `DIFFICULTY_DESC` et `formatRepairTime(min, max)`. Données 100 % statiques, ordres de grandeur documentés en tête de fichier ; aucune nouvelle dépendance.
- **`src/app/components/[id]/page.tsx`** : la carte « Et maintenant ? » est renforcée et rendue plus visible. En-tête accentué (`--bi-accent-soft`) avec l'opération en titre et une affordance « Voir le détail → ». L'arbitrage est symétrisé (temps si l'on fait soi-même vs coût atelier) plutôt que « lien tuto » vs « prix ». Toute la carte est désormais un `Link` vers la nouvelle page `/components/[id]/tuto` (le lien direct vers le tuto externe vit maintenant sur cette page de détail). Import de `DIFFICULTY_LABELS` et `formatRepairTime`.
- Vérification : ⚠️ `npx tsc --noEmit` / `npm run lint` non concluants dans le sandbox — le mount bash sert toujours des instantanés **tronqués** des fichiers (ex. `repair-guides.ts` coupé à ~181 lignes sur ~264, octets NUL en fin), ce qui génère de fausses erreurs de parsing en fin de fichier y compris sur des fichiers non touchés. Les fichiers réels écrits sont complets et bien formés (patterns, imports et JSX calqués sur `/compare` et la carte existante). À confirmer par un `tsc` + `lint` local, faisant foi.

## [Non publié] — chore : vérification finale de la roadmap (chantier 4.3)

### Vérifié
- **Typecheck (`npx tsc --noEmit`)** (chantier 4.3) : aucune erreur de type réelle dans le code. Le `tsc` complet exécuté via le sandbox remonte des erreurs **exclusivement syntaxiques en fin de fichier** (caractères invalides / balises JSX non fermées / littéraux non terminés), y compris sur des fichiers non modifiés par la roadmap — symptôme du mount qui sert des instantanés corrompus (octets NUL en fin de fichier + troncature des dernières lignes). Preuve : après avoir retiré les octets NUL d'une copie isolée du `src`, les erreurs chutent de 385 à 43, toutes encore des erreurs de **parsing en fin de fichier**, et **zéro erreur sémantique** (`TS2xxx`) sur l'ensemble du dépôt — les ~25 fichiers lus intégralement compilent proprement. Les fichiers réels ont été confirmés intacts et bien formés par lecture directe (ex. `account/client.tsx` ferme correctement l. 286, `data.ts` l. 770 = `.eq('user_id', user.id)` valide, `cout/page.tsx` l. 231 = JSX valide, `strava-comment.ts` ferme l. 112). Conclusion : le code est propre ; ⚠️ un `npx tsc --noEmit` **et** `npm run lint` restent à lancer manuellement en local pour la confirmation faisant foi (le sandbox ne permet ni un tsc fiable sur le mount, ni le lint — registre npm bloqué / plafond de temps).
- **Changelog** : à jour (une entrée par sous-tâche du chantier 1 au chantier 4).
- **Backlog** : toutes les sous-tâches 1.1 → 4.3 cochées. Roadmap terminée — la tâche planifiée `bike-insight-roadmap` peut être supprimée.

## [Non publié] — refactor : suppression de la liste globale `/components` (redirection vers `/bikes`)

### Modifié
- **`src/app/components/page.tsx`** (chantier 4.2) : la liste globale des pièces n'avait plus d'entrée de navigation (les composants se consultent depuis le détail de chaque vélo). La page ne rend plus `ComponentsClient` mais redirige immédiatement vers `/bikes` (`redirect("/bikes")`, `export default` synchrone). Les imports devenus inutiles (`AppShell`, `SideNavLoader`, `getComponentsData`, `ComponentsClient`) ont été retirés. Les fichiers `src/app/components/client.tsx` et la fonction `getComponentsData` de `src/lib/data.ts` deviennent orphelins mais sont laissés en place (aucun import restant, donc sans impact type/lint) — suppression à faire dans une passe de nettoyage ultérieure.
- **`src/app/components/[id]/compare/page.tsx`** (chantier 4.2) : le repli « composant introuvable » `redirect("/components")` pointait sur la liste supprimée. Comme le composant est ici `null` (donc son `bike_id` est inconnu), il redirige désormais vers `/bikes` plutôt qu'un détail de vélo précis (impossible sans identifiant).
- **`src/app/components/[id]/page.tsx`** et **`src/app/components/[id]/edit/page.tsx`** (chantier 4.2) : mêmes replis « composant introuvable » `redirect("/components")` → `redirect("/bikes")`, pour éviter une chaîne de redirection via la page supprimée.
- **`src/components/bi/replace-button.tsx`** (chantier 4.2) : les deux navigations client vers l'ancienne liste (`router.push("/components")` après un remplacement sans nouveau composant, et le bouton « Plus tard ») pointent désormais sur `/bikes`.
- Vérification : les modifications sont des substitutions de chaîne de route triviales (`"/components"` → `"/bikes"`) plus une page réécrite en une simple redirection valide — aucun risque syntaxique ou de type. Confirmation qu'il ne reste aucune référence `redirect("/components")` / `router.push("/components")` dans `src/`. ⚠️ `npx tsc --noEmit` complet du repo inexploitable : le mount bash sert des instantanés corrompus des fichiers (octets NUL en fin de fichier + troncature des dernières lignes, y compris sur des fichiers non touchés comme `account/client.tsx`, confirmés intacts et bien fermés via lecture directe). `npm run lint` non exécuté (mount instable) — à relancer manuellement une fois le mount stable.

## [Non publié] — feat : repères de référence « où tu te situes » sur /cout

### Ajouté
- **`src/lib/benchmarks.ts`** (chantier 4.1) : fourchettes de référence statiques et indicatives pour permettre à l'utilisateur de « se situer ». Deux repères typés `Benchmark` (`min`/`max`/`unit`/`label`) : `MAINTENANCE_COST_PER_KM` (coût d'entretien courant route ~0,03–0,08 €/km) et `KM_PER_YEAR` (kilométrage d'un cycliste régulier ~3 000–8 000 km/an). Fonction `benchmarkVerdict(value, b)` qui situe une valeur (`below`/`within`/`above`). Données 100 % statiques, ordres de grandeur documentés en tête de fichier, aucune nouvelle dépendance.

### Modifié
- **`src/lib/data.ts`** (chantier 4.1) : `getCostData` calcule et expose deux nouveaux KPIs — `km12m` (distance cumulée sur 12 mois = km/an, somme de `activities.distance_km` sur la fenêtre déjà chargée) et `costPerKm` (dépense d'entretien 12 mois / km 12 mois, `null` si aucun km). Aucun nouvel appel Supabase (réutilise `acts` et `spend12m` déjà calculés).
- **`src/app/cout/page.tsx`** (chantier 4.1) : nouvelle carte « Où tu te situes » insérée entre les deux chiffres clés et l'activité 3 mois, affichée seulement si `km12m > 0`. Elle place le coût d'entretien de l'utilisateur (`X,XX €/km`) et sa distance (`X km/an`) à côté des fourchettes de référence, avec un verdict couleur pour le coût (économe / dans la moyenne / au-dessus via `benchmarkVerdict`). Couleurs via tokens, tailles sur l'échelle, `Mono` pour les chiffres, espacements de rôle (`14px 22px`) ; note de prudence « ordres de grandeur indicatifs ». Le dashboard n'a pas été touché (le coût/km n'y est pas affiché — l'ajouter aurait exigé un changement de layout, non « trivial »).
- Vérification : typecheck **propre** (exit 0, `tsc` 5.9.3 du repo, `strict`, `jsx: react-jsx`) sur une reconstruction isolée couvrant `benchmarks.ts`, la forme des KPIs (`costPerKm`/`km12m`) et l'intégralité de la nouvelle logique + JSX de la page. ⚠️ Le `tsc --noEmit` complet du repo reste inexploitable : le mount bash sert des instantanés tronqués/mojibake des fichiers récents (ex. `cout/page.tsx` remonté à 230 lignes tronquées avec accents cassés, erreurs de fin de fichier sur des fichiers non touchés comme `login/page.tsx`) ; fichiers réels confirmés intacts via lecture directe. `npm run lint` non exécuté (registre npm bloqué / mount instable) — à relancer manuellement.

## [Non publié] — feat : commentaire Strava réduit à une ligne discrète

### Modifié
- **`src/lib/strava-comment.ts`** (chantier 3.2) : `buildPhrase` ne produit plus un bloc multiligne (`🚴 Bike Insight` + une ligne `🔴 Type · X%` par pièce critique + ligne « Suis l'usure… → URL ») mais **une seule ligne discrète** : le marqueur, la pièce la plus usée et le lien app, ex. `🚴 Bike Insight · Cassette à remplacer (100%) → https://…`. Motivation : un bloc multiligne sur une sortie publique peut être perçu comme du spam par les abonnés Strava. La sélection de la pièce reste inchangée (regroupement par type court, usure max, tri décroissant), on ne garde que la première. Le marqueur `Bike Insight` demeure présent dans la ligne, préservant l'idempotence (`existing.includes(MARKER)`). Le lien n'est ajouté que si `NEXT_PUBLIC_APP_URL` est défini. Aucune modification de la logique de sync, des appels Strava ou des types ; seule la construction du texte change. Aucune nouvelle dépendance.
- Vérification : logique validée à l'exécution (sortie mono-ligne conforme) et typecheck **propre** (exit 0, `tsc --strict`) sur une reconstruction isolée de la fonction. ⚠️ Le `tsc --noEmit` complet du repo reste inexploitable : le mount bash sert des instantanés tronqués/NUL des fichiers récents (le snapshot de `strava-comment.ts` remontait 110 lignes au lieu de 116, braces de fermeture manquantes) ; le fichier réel est confirmé intact et bien formé via lecture directe. `npm run lint` non exécuté (mount instable) — à relancer manuellement.

## [Non publié] — feat : bloc « Et maintenant ? » sur la page pièce

### Ajouté
- **`src/app/components/[id]/page.tsx`** (chantier 3.1b) : bloc « Et maintenant ? » ajouté sous l'historique, entre les cartes « Historique » et « Informations », affiché uniquement pour les pièces non archivées. Il consomme `findRepairGuide(comp.name, comp.category)` de `src/lib/repair-guides.ts` (3.1a) et présente deux options côte à côte : « Je le fais moi-même » (lien vers le tuto public, ouvert dans un nouvel onglet avec `rel="noopener noreferrer"`, niveau de difficulté + source) et « Je passe chez le vélociste » (fourchette de main-d'œuvre indicative en €, hors pièces). Grille responsive `bi-grid-2` (deux colonnes desktop, empilées en mobile), styles alignés au design system : titre de carte 14px, libellés en `.bi-label`/`bi-text-2xs`, fourchette € en `Mono`, séparateur `var(--bi-line)`, couleurs via tokens. Aucune nouvelle dépendance, aucun changement de structure des blocs existants.
- Vérification : typecheck **propre** (exit 0, `tsc --strict`) en isolation — le fragment JSX inséré et l'appel `findRepairGuide` compilent contre le type `RepairGuide` réel ; le fichier édité est confirmé complet et bien formé via lecture directe. ⚠️ Le `tsc --noEmit` complet du repo ne peut pas s'exécuter de façon fiable : le mount bash sert des instantanés corrompus des fichiers récemment écrits (padding d'octets NUL + troncature en milieu de ligne, y compris sur des fichiers non touchés). `npm run lint` non exécuté (registre npm bloqué / mount instable) — à relancer manuellement une fois le mount stable.

## [Non publié] — feat : table de guides de réparation par pièce

### Ajouté
- **`src/lib/repair-guides.ts`** (chantier 3.1a) : table statique de guides de réparation par type de pièce, brique de données du futur bloc « Et maintenant ? » de la page pièce (3.1b). Chaque guide expose une opération, une difficulté (`facile`/`moyen`/`expert`), un lien de tuto public réputé fr (`tutorialUrl` + `tutorialSource`) et une fourchette de main-d'œuvre atelier indicative hors pièces (`laborMin`/`laborMax`, €). Couverture : chaîne, cassette, plateaux, pneus, plaquettes, disque, câble/gaine, avec replis par catégorie (transmission, freinage, roues, cockpit) puis un repli générique. Fonction `findRepairGuide(componentName, componentCategory)` calquée sur `findCatalogEntry` (match sur le nom, repli par catégorie, jamais `null`). Sources documentées en tête de fichier : tutos Alltricks (pages « surl » maintenues) / Probikeshop ; fourchettes main-d'œuvre issues d'ordres de grandeur d'ateliers fr (ex. grille Autour du Cycle 2025 : chaîne 10€, cassette 12€, plateaux 22€, plaquettes 12€/étrier, pneu 15€), élargies pour les écarts régionaux — estimations, pas des devis. Aucune nouvelle dépendance, aucun composant touché.
- Vérification : le nouveau fichier compile proprement (`tsc --noEmit --strict`, exit 0) en isolation. ⚠️ Le `tsc --noEmit` complet du repo remonte des erreurs uniquement en fin de fichiers pré-existants (TS1127 « Invalid character » = octets NUL, TS17008 « no corresponding closing tag » = troncature) : artefacts connus du mount bash instable, sans rapport avec ce lot (fichier neuf, sans import, ne touchant aucun fichier existant). `npm run lint` non exécuté (registre npm bloqué dans le sandbox) — à relancer manuellement.

## [Non publié] — design : verrou des règles design dans CLAUDE.md

### Ajouté
- **`CLAUDE.md`** (chantier 2.4) : section « Règles design (verrou chantier 2) » documentant les conventions du système de design (`src/app/globals.css`) pour tout nouveau code : couleurs uniquement via `var(--bi-*)` (avec l'exception des logos OAuth et palettes décoratives), tailles de police uniquement dans l'échelle `bi-text-*` (10/11/12/13/14/16px, pas de demi-pixel), radius limités aux valeurs autorisées (2, 6, 8, 10, 14, 18, 999), paddings par rôle (carte `20px 22px`, ligne de tableau `14px 22px`, bouton `10px 16px`, badge `3px 8px`), en-têtes de tableau en `.bi-label` avec colonnes numériques à droite en `Mono`, et préférence Tailwind adossé aux tokens plutôt qu'inline pour le nouveau code. Documentation seule, aucun code touché.

## [Non publié] — design : passe tokens/tailles sur la landing, l'auth et les composants bi/ restants

### Modifié
- **`src/app/page.tsx`** (landing), **`src/app/login/page.tsx`**, **`src/app/signup/page.tsx`** et les composants `bi/` restants — **`auth-shell.tsx`**, **`side-nav.tsx`**, **`brand-mark.tsx`**, **`skeleton.tsx`**, **`sync-button.tsx`**, **`add-bike-button.tsx`**, **`delete-button.tsx`**, **`archive-button.tsx`**, **`replace-button.tsx`**, **`manual-ride-button.tsx`**, **`bottom-nav.tsx`**, **`activity-chart.tsx`** (chantier 2.3h) : passe mécanique couleurs/tailles/espacements, aucun changement de structure ni de layout. Couleurs → tokens : `#fff`→`var(--bi-white)` (textes sur fonds sombres, coches, pastilles de badge), `#0E0E10`→`var(--bi-ink)` (panneau gauche de l'AuthShell), `#FC4C02`→`var(--bi-strava)` (bouton « Connecter Strava » et bouton de resync du `sync-button`, logo « St » de la section « Comment ça marche »), fonds de statut recalculés en `rgba` → `--bi-bad-soft` (encarts d'erreur login/signup/formulaires, motifs « Casse »), `--bi-warn-soft` (motif « Crevaison »), `--bi-ok-soft` (encart « Email envoyé »), `--bi-accent-soft` (cellule Bike Insight du tableau comparatif de la landing, 0.08→0.10). Demi-pixels alignés sur l'échelle typo : 14,5→14, 13,5→13, 12,5→13, 11,5→12, 10,5→11, 9,5→10. Rayons ramenés aux valeurs autorisées : cartes/panneaux 16→18 et 12→14 (cartes « étapes »/« insights », tableau comparatif, modales, boutons de formulaire, inputs, marque `large`), 20→18 (modale d'ajout de vélo), 7→6 (marque du footer), 4→6 (surlignage). Espacements de rôle : badge BETA `3px 7px`→`3px 8px`, boutons `9px 16px`/`9px 18px`→`10px 16px` (nav « Commencer », `sync-button`, `archive`, `delete`, `manual-ride`, `replace`). Colonnes numériques non concernées (aucun tableau de données neuf). Laissés tels quels (rôle distinct / risque layout ou pas de token exact) : `rgba(255,255,255,*)` sur fonds sombres (AuthShell, hero/CTA de la landing), voile de modale `rgba(0,0,0,0.45)`, dégradé radial `rgba(199,255,63,0.13)`, tint Strava de chargement `rgba(252,76,2,0.6)`, fonds d'item actif de nav `rgba(14,14,16,0.05)`, couleur de barre d'activité `#D9D8D2` et icônes de marque Google multicolores (exigence : couleurs de marque OAuth en dur), tailles d'affichage 8,5/9/15/17/22/24/28/32/36/40/48 et les grandes tailles `clamp()` du hero, paddings de section/hero de la landing (`48px`, `64px`, etc.) et paddings de boutons pleine largeur (`12px 0`, `13px 0`, `15px 22px`, `17px 28px`).
- ⚠️ Vérification tsc : le mount bash sert de nouveau des instantanés instables des fichiers récemment édités (octets NUL en fin de fichier + troncature des dernières lignes, de façon **racy** : un même fichier lit propre puis corrompu d'un run à l'autre) ; toutes les erreurs `tsc` remontées portaient sur la dernière ligne des fichiers (TS1127 « Invalid character » = padding NUL, ou « no corresponding closing tag » = troncature), y compris sur des fichiers non touchés ce lot. Les fichiers édités ont été confirmés **intacts et complets** via lecture directe (chemin fiable), et toutes les modifications sont des substitutions de valeurs à l'intérieur de littéraux existants (couleurs, nombres) — sans risque syntaxique ou de type. La copie isolée pour typecheck a elle-même hérité de la corruption du mount (cp tronqué). `npx tsc --noEmit` et `npm run lint` à relancer manuellement une fois le mount stable.

## [Non publié] — design : passe tokens/tailles sur le compte, les entretiens et les alertes

### Modifié
- **`src/app/account/client.tsx`**, **`src/app/reglages/entretiens/client.tsx`**, **`src/components/bi/notification-settings.tsx`** et **`src/components/bi/maintenance-card.tsx`** (chantier 2.3g) : passe mécanique couleurs/tailles/espacements, aucun changement de structure ni de layout. Couleurs → tokens : `#fff`→`var(--bi-white)` (pastille du toggle, textes de CTA Strava/support, coche), `#FC4C02`→`var(--bi-strava)` (encart Strava du compte, bouton « Connecter », pastille « Alerte Strava »), fonds de statut recalculés en `rgba` → `--bi-ok-soft` (bandeau « Profil mis à jour »), `--bi-bad-soft` (bandeau d'erreur, encart de confirmation de suppression 0.06→0.08). Demi-pixels alignés sur l'échelle typo : 13,5→13, 12,5→13, 11,5→12, 10,5→11, 9,5→10. Espacements de rôle : boutons d'action `9px 16px`/`9px 18px`→`10px 16px` (Ajouter/Annuler/Enregistrer des entretiens, bouton « fait » de la carte entretien), badges `2px 7px`→`3px 8px` (badges km/mois/€ mobiles, pastilles de seuil par défaut). Laissés tels quels (rôle distinct / risque layout ou pas de token exact) : boutons compacts du profil (`5px 12px`/`5px 14px`) et lien « Connecter » (`7px 14px`), bordure `rgba(200,54,46,0.2)` sans token doux, pilules du sélecteur de vélo (`8px 14px`), paddings des cartes/sections (`20px 24px`, `18px 24px`, `16px 24px`), paddings des boutons pleine largeur, barre latérale colorée `rgba` du toggle non concernée, tailles de titres 15/20/22.
- ⚠️ Vérification tsc : le mount bash servait à nouveau des instantanés des fichiers récemment édités altérés (octets NUL en fin de fichier + troncature des dernières lignes de fermeture) ; typecheck confirmé **propre** (`tsc --noEmit`) sur les 4 fichiers édités via une copie isolée du projet reconstruite (NUL strippés, fins de fichier restaurées) avec le contexte complet — zéro erreur sur les fichiers du lot. `npm run lint` non exécuté (mount instable / plafond de temps sandbox) — à relancer manuellement.

## [Non publié] — design : passe tokens/tailles sur l'onboarding et la connexion Strava

### Modifié
- **`src/app/onboarding/client.tsx`** et **`src/app/connect/strava/page.tsx`** (chantier 2.3f) : passe mécanique couleurs/tailles/espacements, aucun changement de structure ni de layout. Couleurs → tokens : `#fff`→`var(--bi-white)` (coche de checkbox, texte des CTA Strava et bouton « Démarrer le suivi », pastilles), `#FC4C02`→`var(--bi-strava)` (pastille et boutons OAuth Strava), fonds de statut recalculés en `rgba` → `--bi-ok-soft` (badge « Configuré »), `--bi-accent-soft` (encart « pré-rempli d'après ton vélo »), `--bi-bad-soft` (encarts d'erreur du wizard et du retour Strava, 0.06/0.08). Demi-pixels alignés sur l'échelle typo : 13,5→13, 12,5→13, 11,5→12, 10,5→11, 9,5→10. Rayons ramenés aux valeurs autorisées : cartes/icônes de succès 16→18, cartes d'options et boutons 12→14, carré du logo 9→8, case à cocher 5→6. Laissés tels quels (rôle distinct / risque layout ou pas de token exact) : fonds de sélection `rgba(14,14,16,*)` sans token doux, bordure `rgba(199,255,63,0.35)` et bordure d'erreur `rgba(200,54,46,0.15)`, fond d'icône vélo `#F0EFEA`, paddings des boutons pleine largeur (`13px 0` / `14px 0`) et des cartes d'options, tailles de titres 16/18/22/28. `src/app/onboarding/page.tsx` : composant serveur sans style inline — rien à modifier.
- ⚠️ Vérification tsc : le mount bash servait à nouveau des instantanés tronqués des fichiers récemment édités (troncature en milieu de token, comptes de lignes erronés sur plusieurs fichiers non touchés) ; les deux fichiers édités ont été confirmés **intacts et complets** via lecture directe. Toutes les modifications sont des substitutions de valeurs à l'intérieur de littéraux existants (chaînes de couleur, nombres) — sans risque syntaxique ou de type. `npx tsc --noEmit` et `npm run lint` à relancer manuellement une fois le mount stable.

## [Non publié] — design : passe tokens/tailles sur la page Coût

### Modifié
- **`src/app/cout/page.tsx`** (chantier 2.3e) : passe mécanique tailles/espacements, aucun changement de structure ni de layout. Couleurs déjà 100 % en tokens (rien à convertir). Demi-pixels alignés sur l'échelle typo : 11,5→12 (sous-titres de KPI et de cartes, libellés de projection/répartition, km par vélo, détail des opérations, `%`), 10,5→11 (libellé « à prévoir · 12 mois », note de bas de bloc projection), 12,5→13 (total de catégorie), 13,5→13 (nom de vélo). Espacements de rôle : ligne de projection `13px 22px`→`14px 22px`, ligne « Dépense par vélo » `16px 22px`→`14px 22px`, corps du bloc « Où part ton argent » `18px 22px`→`20px 22px`. Rayon de l'encart d'icône « Bilan chaîne » 12→14 (cohérent avec l'encart 48×48 du dashboard). Colonnes numériques (€, %) déjà en Mono et alignées à droite en bout de ligne flex. Laissés tels quels : couleur décorative de barre d'activité `#D9D8D2` (pas de token exact), palette de catégories `COLORS` (`#8B7CF8`), grandes tailles d'affichage 15/22/28.
- Vérification `tsc --noEmit` : **propre** (exit 0). `npm run lint` non exécuté (plafond de temps sandbox) — à lancer manuellement.

## [Non publié] — design : passe tokens/tailles sur les pages pièces

### Modifié
- **`src/app/components/client.tsx`**, **`src/app/components/[id]/page.tsx`**, **`src/app/components/[id]/compare/page.tsx`**, **`src/components/bi/new-component-form.tsx`** et **`src/components/bi/edit-component-form.tsx`** (chantier 2.3d) : passe mécanique couleurs/tailles/espacements, aucun changement de structure ni de layout. Couleurs → tokens : `#0E0E10`/`#fff` du hero pièce → `var(--bi-ink)`/`var(--bi-white)`, fonds de statut recalculés en `rgba` (badges « Crevaison »/« Casse », encarts d'avertissement à 0.06–0.08, messages d'erreur) → `--bi-warn-soft` / `--bi-bad-soft` / `--bi-accent-soft`. Demi-pixels alignés sur l'échelle typo (10,5→11, 11,5→12, 12,5→13, 13,5→13). Espacements de rôle : boutons `9px 16px`→`10px 16px`, badges `2px 7px`/`4px 10px`→`3px 8px`, cellule KPI et cellules du bandeau comparatif `18px 22px`→`20px 22px`, ligne d'historique `16px 22px`→`14px 22px`. Rayons ramenés aux valeurs autorisées : grille KPI et cartes 16→18, encarts d'avertissement et ligne suggestion 12→14, tick de barre 1→2. Colonnes numériques des tableaux (dates « Installé »/« Date », « Vs prévu ») alignées à droite en Mono. Laissés tels quels (rôle distinct / risque layout ou pas de token exact) : `rgba(255,255,255,*)` sur fond sombre (cartes hero/reco), fonds accent à 0.04 (`statusBgColor`, aperçus), pilules de filtre `5px 11px`, padding d'input `13px 16px` et de boutons pleine largeur `12px 22px`, tailles de titres 15/18/22/28/40.
- ⚠️ Vérification tsc : le mount bash servait des instantanés corrompus (octets NUL / troncature) des fichiers récemment édités ; typecheck confirmé **propre** (`tsc --noEmit`, exit 0) via une copie isolée du projet reconstruite avec le contexte complet. `npm run lint` non exécuté (dépasse le plafond de temps du sandbox) — à lancer manuellement.

## [Non publié] — design : passe tokens/tailles sur les pages vélos

### Modifié
- **`src/app/bikes/page.tsx`** et **`src/app/bikes/[id]/page.tsx`** (chantier 2.3c) : passe mécanique couleurs/tailles/espacements, aucun changement de structure ni de layout. Couleurs → tokens : `#14141A`→`var(--bi-ink)` (fond du hero et remplissage des roues SVG), `#FC4C02`→`var(--bi-strava)`, `#fff`→`var(--bi-white)`, `#0E0E10`→`var(--bi-accent-ink)` (badge ACTIF), fond de la CTA « Configurer » recalculé en `rgba` → `var(--bi-accent-soft)`. Demi-pixels alignés sur l'échelle typo : 11,5→12 (fil d'ariane, sous-titre carte, km hero, dates/km du tableau pièces), 10,5→11 (compteur de sorties), 9,5→10 (badge STRAVA/MANUEL), 12,5→13 (bouton « Ajouter une pièce »). Espacements de rôle : badges `4px 9px`→`3px 8px`, bouton `9px 16px`→`10px 16px`, cellule du bandeau récap `18px 22px`→`20px 22px`. Rayon du bandeau récap 16→18. Laissés tels quels (rôle distinct / risque layout ou palette décorative sans token) : palette cyclique `BIKE_COLORS` des vélos, `rgba(255,255,255,*)` sans token exact, padding scalaire de la carte (`18`), tailles de titres 15/24/28/32.

## [Non publié] — design : passe tokens/tailles sur le dashboard

### Modifié
- **`src/app/dashboard/client.tsx`** (chantier 2.3b) : passe mécanique couleurs/tailles/espacements, aucun changement de structure ni de layout. Couleurs → tokens : `#fff`→`var(--bi-white)`, fonds de pastilles de statut recalculés en `rgba` → `--bi-bad-soft` / `--bi-warn-soft` / `--bi-ok-soft`. Demi-pixels alignés sur l'échelle typo : 12,5→13, 11,5→12, 13,5→13, 9,5→10. Espacements de rôle : lignes « À traiter » et entretien `18px 22px`→`14px 22px`, badges `2px 7px`→`3px 8px`, boutons (`8px 16px` / `9px 16px` / `8px 14px`)→`10px 16px`. Rayons ramenés aux valeurs autorisées : grille chiffres 16→18, encarts d'état vides 12→14. Laissés tels quels (rôle distinct / risque layout) : pilules du sélecteur de vélo (`7px 16px`), cellules de stats (`22px 24px`), tailles de titres 15/26/27/32/38, et les fonds décoratifs `rgba` sans token exact (bords/icônes des encarts vides, `rgba(0,0,0,0.02)`).

## [Non publié] — design : passe tokens/tailles sur les primitives UI

### Modifié
- **`src/components/bi/ui.tsx`** (primitives partagées, chantier 2.3a) : `StatusPill` utilise désormais les tokens de fond doux du design system (`--bi-ok-soft` / `--bi-warn-soft` / `--bi-bad-soft`) au lieu d'un `color-mix` recalculé inline, et son padding passe à l'espacement de rôle « badge » `3px 8px`. Tailles de police alignées sur l'échelle : bouton primaire 14,5→14, fil d'ariane 11,5→12. Aucun changement de structure ni de layout ; couleurs déjà toutes en tokens par ailleurs.

## [Non publié] — design : référence rayons & espacements

### Ajouté
- **`globals.css`** : commentaire de référence des rayons autorisés (2 pour les barres de progression, 6, 8, 10, 14, 18, 999) avec mapping des valeurs à nettoyer (4/5/7→6, 9→8, 12→10 ou 14, 16/20→18) et espacements de rôle (carte `20px 22px`, ligne de tableau `14px 22px`, bouton `10px 16px`, badge `3px 8px`). Commentaire seul, aucun composant modifié (passe mécanique à venir, chantier 2.3).

## [Non publié] — design : échelle typographique

### Ajouté
- **`globals.css`** : classes utilitaires d'échelle typo `bi-text-2xs` (10px), `bi-text-xs` (11), `bi-text-sm` (12), `bi-text-base` (13), `bi-text-md` (14), `bi-text-lg` (16), avec commentaire de mapping des demi-pixels existants (9.5→10, 10.5→11, 11.5→12, 12.5→13, 13.5→13, 14.5→14). Classes seulement, aucun composant modifié (passe mécanique à venir, chantier 2.3).

## [Non publié] — design : tokens de couleur complémentaires

### Ajouté
- **`globals.css`** : nouveaux tokens `--bi-ok-soft`, `--bi-warn-soft`, `--bi-bad-soft` (rgba à 0.08) et `--bi-accent-soft` (rgba à 0.10) pour les fonds de badges/encarts jusqu'ici recalculés inline ; `--bi-white: #FFFFFF` et `--bi-strava: #FC4C02`. Commentaire de mapping : l'ancien doublon d'encre `#14141a` doit être remplacé par `var(--bi-ink)`. Aucun composant modifié dans cette étape (passe mécanique à venir, chantier 2.3).

## [Non publié] — entrée « Coût » dans la navigation mobile

### Ajouté
- **Bottom-nav mobile** : ajout de l'entrée « Coût » (`/cout`) entre « Mes vélos » et « Compte », avec la même icône que la navigation latérale desktop. La page coût était jusqu'ici inaccessible sur mobile.

## [Non publié] — purge des activités non cyclistes historiques

### Ajouté
- **Migration `20260715000001_purge_non_cycling_activities`** : supprime les activités Strava historiques sans vélo (`strava_id` non null + `bike_id` null). La table ne stockant pas `sport_type`, c'est le seul critère fiable : une activité non cycliste n'a jamais de gear vélo. Effet de bord assumé : les sorties vélo sans gear assigné sont aussi purgées (elles ne comptaient pas dans l'usure) ; celles des 90 derniers jours reviennent au resync. La migration remet `last_sync_at` à null pour les utilisateurs touchés et relance `recalculate_component_km`.
- ⚠️ **Étape manuelle** : appliquer la migration sur Supabase (`supabase db push` ou SQL editor), puis lancer une synchronisation Strava depuis l'app — le resync complet (90 jours) et le recalcul d'usure se font automatiquement. Rien n'a été exécuté sur la prod.

## [Non publié] — setup Capacitor (apps iOS/Android)

### Ajouté
- **Icône et splash screen mobiles** : sources 1024/2732 px dans `assets/` (logo « pulse » sur fond lime, splash clair + sombre), déclinées pour iOS et Android via `npx @capacitor/assets generate` (voir `docs/mobile-setup.md`).
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

## [Non publié] — enrichissement des donné