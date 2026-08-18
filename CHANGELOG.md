# Changelog

## [Non publié] — 🔴 Landing : le tableau comparatif positionnait Strava en concurrent

*Audit déclenché par une question simple — pourquoi pas d'attribution « Powered by Strava » avant
connexion. Le problème principal était ailleurs. Détail dans `audit-landing-conformite.md`.*

**Cette page est l'URL du site déclarée sur l'app Strava : un reviewer l'ouvre avant les captures.**

### Corrigé
- **Tableau comparatif : section entièrement supprimée.** La colonne « Strava » affichait six croix sur sept lignes, sous le titre « Pourquoi pas Strava, ProBikeGarage ou un tableur ? — Ils tracent. On décide. ». Trois clauses en cause : l'accord API (« may not create applications that compete with or replicate Strava functionality »), le §5.2 (usage concurrentiel de l'API) et le §5.12 (contenu « detrimental, disparaging, or harmful to Strava »). Une version intermédiaire sans colonne Strava a existé, puis la section a été retirée entièrement : le positionnement **à côté de Strava, pas en face** se défend mieux en montrant ce que l'app fait qu'en montrant ce que les autres ne font pas. Un commentaire subsiste à l'emplacement pour empêcher la réintroduction.
- **Ligne « Alerte d'usure écrite sur Strava »** : disparaît avec le tableau. Elle mettait en avant, comme différenciateur exclusif, une fonctionnalité que le §5.12 interdit et qui est désactivée depuis.
- **Attribution manquante** : `PoweredByStrava` ajouté au pied de page. La section 4 s'applique dès qu'on référence l'interopérabilité, ce que la landing fait une dizaine de fois.
- **Faux logo Strava** : la tuile 40 px « St » en blanc sur l'orange de marque était un logo inventé (section 2). Remplacée par une tuile neutre portant le pictogramme Bike Insight.
- **Statistiques sans source** : « 180 € évités en moyenne », « 2,1x de durée de vie », « 142 sorties Strava analysées en moyenne par cycliste ». La dernière supposait une moyenne calculée sur les données Strava des utilisateurs, interdite même anonymisée (§5.4) ; les autres tombaient sous l'article 11.1(d) (pratiques trompeuses). Reformulées en fourchettes assumées, reprises de `lib/benchmarks.ts` — la vitrine dit désormais la même chose que le produit.
- **« Conçu pour cyclistes Strava »** → « Compatible avec Strava », formulation explicitement autorisée par la section 4.

- **Pied de page** : les trois colonnes de liens (Produit / Ressources / Legal) sont supprimées — douze `<span>` non cliquables vers des pages inexistantes. Deux dépassaient le cosmétique : **« API »** laissait entendre que Bike Insight expose sa propre API alors que le **§5.16** interdit toute couche réexposant les données Strava à des tiers, et **« Tarifs »** contredisait le bandeau « Beta · accès libre ». Ne restent que les liens réels dans la barre du bas : politique de confidentialité et contact.

## [Non publié] — Webhooks Strava (API Policy §6.3 et §7.4)

*Mise en service : voir `runbook-webhooks-strava.md` dans le dossier projet — trois variables
d'environnement puis une souscription à créer en ligne de commande.*

### Ajouté
- **`api/strava/webhook/[secret]/route.ts`** (nouveau) : handshake de validation en GET, traitement des événements en POST. Gère la **création** et la **modification** d'activité (dont le retypage en non-vélo, qui sort la sortie de nos données), la **suppression** (§6.3) et la **désautorisation** (§7.4).
- **`lib/supabase-admin.ts`** (nouveau) : client à clé de service.
- **`lib/strava.ts`** : `getValidStravaToken` accepte désormais un client Supabase injecté.

### Choix de conception
- **Clé de service assumée, cantonnée à cette route.** Elle avait été délibérément évitée pour la suppression de compte, où une session utilisateur permettait une fonction `security definer` bornée par `auth.uid()`. Un webhook arrive **sans session** : une fonction équivalente devrait être ouverte au rôle `anon`, et quiconque dispose de la clé anon publique pourrait purger le compte d'un tiers en devinant un identifiant d'athlète. Le module admin documente cette contrainte et se veut à appelant unique.
- **Secret dans le chemin de l'URL.** Strava **ne signe pas** ses webhooks — le `verify_token` n'intervient qu'au handshake, jamais sur les POST. L'endpoint est donc intrinsèquement non authentifié : un secret de chemin est la meilleure protection disponible. Dans le chemin et non en query string, moins exposé aux troncatures et aux journaux.
- **Toujours répondre 200**, même en cas d'erreur métier. Strava réessaie sur non-200 ; un bug de notre côté ne doit pas déclencher une tempête de réessais.
- **Le polling manuel est conservé** comme filet : un webhook peut se perdre, Strava ne garantit pas la livraison. « Tout réimporter » reste indispensable pour reconstruire un historique.
- **Désautorisation : on supprime les données Strava, pas le compte.** L'utilisateur a révoqué un accès, il n'a pas demandé la suppression de son compte. Vélos et composants sont conservés mais détachés de leur `strava_gear_id`, sinon une reconnexion créerait des doublons.

### Notes
- ⚠️ L'URL de callback contient le domaine : la bascule vers `bikeinsight.app` imposera de **supprimer et recréer** la souscription.
- Coût en quota : 2 à 3 appels par événement. Négligeable face aux 400 requêtes / 15 min disponibles.

## [Non publié] — 🔴 Les sorties manuelles étaient effacées par la synchro Strava

*Trouvé en préparant les webhooks. Migration `20260812000004_bikes_manual_km.sql`.*

### Le problème
`bikes.total_km` avait deux écrivains qui se contredisaient : `manual-ride-button.tsx`
l'incrémentait à chaque saisie manuelle, et l'import Strava l'**écrasait** ensuite avec
l'odomètre du gear (`round(g.distance / 1000)`), sans condition.

Résultat : sur un vélo relié à Strava, **toute sortie saisie à la main disparaissait à la
synchronisation suivante**. La ligne survivait dans `activities`, mais `total_km` — qui pilote
tout le calcul d'usure — revenait à la valeur Strava. D'autant plus gênant que la saisie manuelle
doit devenir un chemin de première classe, c'est ce qui permet à l'app de valoir quelque chose
sans Strava.

### Correctif
- Nouvelle colonne `bikes.manual_km`, qui accumule les kilomètres inconnus de Strava.
- L'import calcule désormais `total_km = odomètre du gear + manual_km`.
- `manual-ride-button.tsx` incrémente les deux colonnes.
- **Backfill** depuis `activities where strava_id is null` : les kilomètres déjà perdus sont
  restaurés et réapparaîtront à la prochaine synchronisation.

**Colonne dédiée plutôt que somme calculée depuis `activities`** : si la question de rétention
(§6.2 de l'API Policy) imposait un jour de purger les anciennes activités, une somme calculée
disparaîtrait avec elles. Une colonne survit à la purge.

Les vélos sans `strava_gear_id` ne sont pas concernés — l'import ne les touche pas, `total_km`
y reste la seule source de vérité.

### Au passage — correction d'un diagnostic erroné
Il avait été écrit plus tôt qu'une sortie supprimée sur Strava gonflait les kilomètres « pour
toujours ». C'est faux : `total_km` étant repris de l'odomètre Strava à chaque synchronisation,
et Strava recalculant la distance d'un gear après suppression, le compteur se répare seul. Ce
qui reste réellement faux, c'est la **ligne orpheline dans `activities`** — elle fausse les
graphiques 12 mois, la « vie restante » par pièce et les dénominateurs de coût au km. Les
webhooks restent justifiés (§6.3, §7.4, synchro réellement automatique), mais pas par cet
argument.

## [Non publié] — 🔴 Faille RLS : vues sans `security_invoker`

*Trouvée pendant l'audit RLS. Correctif : migration `20260812000003_views_security_invoker.sql`,
**à appliquer en priorité**.*

### Le problème
Les vues `component_stats` et `bike_stats` ont été créées sans `security_invoker`. Une vue
PostgreSQL s'exécute par défaut avec les droits de son propriétaire — `postgres`, qui possède
BYPASSRLS — donc **la RLS des tables sous-jacentes ne s'appliquait pas**. Tout utilisateur
authentifié pouvait lire, avec la clé anon publique du bundle client, les vélos, composants,
coûts et kilomètres de **tous** les autres utilisateurs :

```js
supabase.from('bike_stats').select('*')   // sans filtre user_id
```

Le cloisonnement ne reposait que sur les `.eq('user_id', …)` du code applicatif. C'est aussi une
violation de l'accord API Strava (§2.3, §6.1 : données affichées au seul propriétaire) —
`bike_stats` expose `total_km` et `strava_gear_id`.

### Correctif
`alter view … set (security_invoker = true)` sur les deux vues, plutôt qu'un
`create or replace view` : leur définition a été modifiée par plusieurs migrations successives
(`20260523000004`, `20260524000001`), réécrire le corps risquerait de revenir à une version
antérieure. Commentaires SQL ajoutés sur les deux vues pour que l'option ne se reperde pas.

Aucun impact fonctionnel : les requêtes légitimes filtrent déjà par utilisateur.

### Reste de l'audit — conforme
- Les 8 tables ont bien la RLS activée (`profiles`, `bikes`, `components`, `activities`, `maintenance_logs`, `notifications`, `notification_settings`, `maintenance_types`).
- Toutes les policies filtrent sur `auth.uid()`. Celle nommée « Service can insert notifications » est correctement bornée (`with check (auth.uid() = user_id)`) malgré son nom trompeur.
- `activity_bike_stats` (migration `20260725000001`) avait déjà `security_invoker = true` — seules les deux vues d'origine étaient concernées.

## [Non publié] — Uniformisation du design (Coût & Historique)

*Ces deux pages ré-implémentaient en inline ce qui existait déjà dans `components/bi/ui.tsx` :
l'en-tête de carte existait en 3 variantes (dont deux sur la seule page Coût), le chiffre héros
en 5 tailles, la ligne de liste en 4 versions. Aucun changement de logique métier.*

### Ajouté
- **`components/bi/ui.tsx`** — six primitives qui n'existaient pas et que chaque page réécrivait :
  - `CardHead` : en-tête des cartes **conteneur** (liste, graphe). Titre 14px/600 + sous-titre 12px muted + slot `right`. Les cartes **métrique** (un chiffre et rien d'autre) gardent `BiLabel`. Ça remplace les `fontSize: 15` inline — 15 n'était pas dans l'échelle `bi-text-*`.
  - `Metric` : chiffre + unité, **deux tailles seulement** (`lg` 28/500 pour le chiffre principal d'une carte, `sm` 20/600 pour un chiffre secondaire). L'unité est toujours détachée en 12px muted mono sur la baseline — c'était le rendu le plus soigné des trois qui coexistaient, il devient la règle.
  - `ListRow` : ligne de liste, avec `accent` (barre latérale colorée) ou `leading` (pastille). Sous-titre toujours 12px, chevron toujours 14px.
  - `Chip` / `chipStyle` : filtre cliquable, tailles `md` (sélecteur de page) et `sm` (filtre dans une carte).
  - `EmptyState` : état vide, sur le modèle déjà utilisé par Coût et Historique.
  - `Bars` : mini-histogramme (h90, gap 4, radius 2, accent au-dessus du seuil).
- **`lib/format.ts`** : `fmtNum`, `fmtDate`, `fmtDelay`. Trois variantes du même `toLocaleString` traînaient dans les pages, dont un `"fr"` au lieu de `"fr-FR"` dans le journal d'historique.
- **`lib/design/categories.ts`** + tokens `--bi-cat-*` : palette des catégories de pièces. `cockpit`, `eclairage` et `autre` étaient mappées **toutes les trois** sur `--bi-muted` — dans la barre segmentée « Où part ton argent », ces trois catégories fusionnaient en un seul bloc gris.
- **`globals.css`** : `--bi-bar-idle` (remplace `#D9D8D2` écrit en dur à deux endroits), `.bi-stack` (rythme vertical unique de 14px), `.bi-rows` (filets entre lignes), `.bi-split-2` / `.bi-split-divider`, et le bloc `@media (max-width: 768px)` qui manquait pour ces deux pages.

### Modifié
- **`cout/page.tsx`** : 6 en-têtes, 4 chiffres héros et 3 listes passés par les primitives. Le graphe d'activité inline est remplacé par `Bars`. Les `marginBottom: 14` posés carte par carte laissent place à `.bi-stack`.
- **`historique/history-charts.tsx`** : idem, plus les barres horizontales de « Subi ou choisi ? » qui utilisent maintenant `ProgressBar` (leur piste était `--bi-bg`, celle de `ProgressBar` `--bi-line`).
- **`historique/history-log.tsx`** (ex-`cout/history-client.tsx`, déplacé) : le fichier vivait dans `cout/` alors que seul `historique/` l'importait. Renommé `HistoryLog`. Corrige au passage un **double filet de 2px sous l'en-tête du Journal** — toutes les lignes portaient un `borderTop`, y compris la première, qui suivait déjà un `borderBottom`.
- **`components/bi/ui.tsx`** : `BiCard` a désormais `20px 22px` par défaut (la valeur du design system) au lieu de `18` — aucun appelant n'utilisait le défaut. `BiLabel` passe en `letter-spacing: 0.07em` pour s'aligner sur `.bi-label` ; il y avait 4 valeurs en circulation (0.03 / 0.04 / 0.06 / 0.07).
- **`components/bi/bike-picker.tsx`** : reprend `chipStyle`. La bordure active passe de `1.5px` à `1px` (1.5 n'existait nulle part ailleurs et décalait le contenu d'un demi-pixel par rapport aux pilules inactives). `marginBottom` 20 → 14, aligné sur le rythme de page.
- **`components/bi/activity-chart.tsx`** : utilise `Bars` et `Chip`. Ce composant n'est **importé nulle part** — il était mort, et la page Coût en recopiait le graphe (et le `#D9D8D2`) en inline. À rebrancher ou à supprimer.

### Corrigé (lint — préexistant, révélé par le premier passage du CI)
*Le workflow CI a été ajouté le 12/08/2026 : son premier run a fait remonter 12 erreurs ESLint qui dormaient sur `main`, dans trois fichiers sans rapport avec le design.*
- **`bikes/page.tsx`, `components/[id]/page.tsx`, `components/[id]/compare/page.tsx`** : 7 erreurs `react-hooks/purity` sur des `Date.now()` appelés pendant le rendu. La règle vise les composants clients, que React Compiler peut re-rendre ; ici ce sont des composants serveur, rendus une fois par requête. Plutôt que sept dérogations éparpillées, l'horloge est **lue une seule fois en tête de composant** (`const nowMs = Date.now()`) avec une dérogation commentée — ce qui corrige au passage un vrai défaut : `components/[id]/page.tsx` appelait `Date.now()` à quatre endroits d'un même calcul de rythme, donc sur quatre instants légèrement différents.
- 5 erreurs `react/no-unescaped-entities` : apostrophes échappées en `&apos;`.

### Notes
- `npm run typecheck`, `npm run lint` et `next build` passent. Il reste 11 warnings (variables inutilisées), non bloquants pour le CI.
- ⚠️ `components/[id]/compare/page.tsx` utilise encore `toLocaleString("fr")` au lieu de `"fr-FR"` — laissé tel quel pour ne pas élargir ce commit, à basculer sur `fmtNum` de `lib/format.ts`.
- ⚠️ **Reste à faire** : rétro-appliquer les primitives à `bikes/page.tsx` (bandeau de stats → `Metric`, état vide → `EmptyState`, 6 hex de couleurs de vélo en dur → tokens) et au dashboard.
- ⚠️ Hex en dur restants hors tokens : `bikes/page.tsx:147` (palette des vélos), `connect/strava/page.tsx:149`, et les couleurs de marque Google sur login/signup (exception assumée par le design system).

## [Non publié] — Chiffrement des tokens Strava (accord API art. 6, API Policy §8.1)

*`profiles.strava_access_token` et `strava_refresh_token` étaient stockés **en clair**. Un token
Strava donne accès aux données personnelles d'un athlète — et il n'y a pas que les miennes en
base : 4 athlètes sont connectés.*

### Ajouté
- **`lib/token-crypto.ts`** (nouveau) : AES-256-GCM via le module `crypto` de Node, **sans nouvelle dépendance**. Format `v1:<iv>:<tag>:<chiffré>` en base64, préfixe de version pour permettre une rotation d'algorithme.

### Modifié
- **`lib/strava.ts`** : déchiffrement en lecture, chiffrement à l'écriture lors du refresh.
- **`api/strava/callback/route.ts`** : chiffrement à l'autorisation initiale.
- **`api/account/delete/route.ts`** : déchiffrement pour la déautorisation, avec repli silencieux — un token illisible ne doit pas empêcher une suppression de compte.

### Choix de conception
- **Chiffrement applicatif plutôt que pgcrypto ou Supabase Vault.** Le modèle de menace est ce qui décide : la clé vit dans une variable d'environnement, donc **hors de la base**. Un dump qui fuite, une policy RLS trop large ou une lecture via le dashboard ne donnent plus rien. Avec pgcrypto la clé serait à côté des données ; avec Vault il aurait fallu passer par des fonctions `security definer` et réécrire les chemins de lecture.
- **GCM et non CBC** : mode authentifié, une valeur altérée est détectée au lieu de produire une sortie silencieusement fausse.
- **Migration auto-cicatrisante** : les valeurs en clair héritées sont tolérées en lecture et réécrites chiffrées au premier refresh de token (quelques heures). Aucune reconnexion imposée aux 4 utilisateurs connectés, aucune migration SQL.

### Notes
- ⚠️ **Variable `STRAVA_TOKEN_ENC_KEY` à définir avant déploiement** (Vercel + `.env.local`) : `openssl rand -base64 32`. Sans elle, toute écriture de token lève une erreur explicite — délibérément, pour ne jamais retomber en silence sur du stockage en clair.
- ⚠️ **Sauvegarder la clé hors de Vercel** (gestionnaire de mots de passe). Sa perte rend les tokens irrécupérables ; les utilisateurs devraient reconnecter Strava — gênant, pas catastrophique.
- Contrôle de fin de migration : `select count(*) from profiles where strava_access_token is not null and strava_access_token not like 'v1:%';` doit tomber à 0. Le repli sur le clair de `decryptToken` pourra alors être retiré.

## [Non publié] — Intégration continue

### Ajouté
- **`.github/workflows/ci.yml`** (nouveau) : `tsc --noEmit` + `eslint` sur chaque pull request et chaque push sur `main`. Déclenché par l'incident du 12/08 — une erreur de type (classe CSS passée à `Mono`, qui n'accepte pas `className`) est passée jusqu'au build Vercel, donc après commit et push.
- **`package.json`** : script `typecheck`.

### Notes
- Périmètre réduit à typecheck + lint, moins d'une minute d'exécution. Le `next build` complet reste couvert par les previews Vercel — inutile de le payer deux fois. Les tests unitaires du moteur d'usure viendront s'ajouter à ce workflow.
- ⚠️ La version Node du workflow (22) doit rester alignée avec celle de Vercel (Project Settings → General → Node.js Version).

## [Non publié] — Politique de confidentialité (API Policy §7.3, §6.5, §7.7)

### Ajouté
- **`app/confidentialite/page.tsx`** (nouveau) : page publique, accessible **sans compte** — Strava comme les stores exigent une URL consultable par un reviewer non connecté. Couvre le §7.3 (conformité RGPD : responsable de traitement, finalités et bases légales, durées de conservation, droits, recours CNIL), le §6.5 (mention obligatoire des Usage Data collectées par Strava et primauté de sa politique en cas de contradiction) et le §7.7 (sous-traitants : Supabase, Vercel, Strava). Détaille ce qui est récupéré sur Strava — identifiant de sortie, vélo, distance, date — et surtout ce qui ne l'est **pas** : tracés GPS, noms de sorties, fréquence cardiaque, puissance, photos, données d'autres athlètes.
- Lien vers la page dans le **pied de page de la landing** (l'endroit qu'un reviewer regarde en premier), en plus de la page Compte.

### Corrigé
- **`app/signup/page.tsx`** : « Conditions » et « Politique de confidentialité » étaient de **faux liens** (`<span>` stylés en liens, sans destination) — on faisait accepter à l'inscription des documents introuvables. Le lien confidentialité est désormais réel ; la mention des CGU est retirée en attendant qu'elles existent, plutôt que de promettre un document inexistant.

### Notes
- ⚠️ **Trois constantes à renseigner en tête de la page avant publication** : statut juridique du responsable de traitement (particulier / micro-entreprise + SIRET) et **région d'hébergement Supabase** — cette dernière détermine s'il y a un transfert hors UE à déclarer.
- ⚠️ Texte rédigé à partir du code et des obligations contractuelles, **non relu par un juriste**.
- CGU toujours à écrire (§9.2). Non bloquant pour la demande Strava, bloquant pour les stores.

## [Non publié] — Suppression de compte réelle (Apple + API Policy §2.5/§7.4)

*Le bouton « Supprimer mon compte » ouvrait un `mailto` : rien n'était supprimé. Non conforme à
l'exigence Apple de suppression déclenchable dans l'app (ferme depuis 2022, motif de rejet direct)
et aux §2.5/§7.4 de l'API Policy Strava.*

### Ajouté
- **`supabase/migrations/20260812000002_delete_own_account.sql`** : fonction `delete_own_account()` en `security definer`, qui supprime `auth.users` où `id = auth.uid()`. **Choix assumé plutôt qu'une route utilisant la clé de service** : pas de `SUPABASE_SERVICE_ROLE_KEY` introduite dans l'application, donc pas de secret tout-puissant supplémentaire à protéger. `search_path` vide et identifiants pleinement qualifiés (une fonction `security definer` ne doit pas être détournable via le search_path) ; `execute` révoqué à `public`/`anon`, accordé au seul rôle `authenticated`. L'identifiant vient d'`auth.uid()`, jamais d'un paramètre : un utilisateur ne peut supprimer que lui-même.
- **`api/account/delete/route.ts`** (nouveau) : révoque d'abord l'autorisation chez Strava (`POST /oauth/deauthorize`, best effort — supprimer nos copies ne suffit pas si l'accès reste ouvert chez eux), appelle la fonction, puis vide la session locale (`signOut({ scope: 'local' })`, un signOut global échouerait sur un compte déjà supprimé).

### Modifié
- **`account/client.tsx`** : le bouton déclenche la vraie suppression, avec état de chargement, gestion d'erreur, et un **écran de confirmation** qui tient lieu de trace écrite immédiate (§2.5).

### Notes
- Cascades vérifiées migration par migration : `auth.users` → `profiles` → `bikes` → `components`/`maintenance_types`, plus `activities`, `maintenance_logs`, `notifications`, `notification_settings`. Aucune table orpheline.
- ⚠️ **Migration à appliquer manuellement sur Supabase.**
- ⚠️ **Reste à faire** : la confirmation écrite par **email** (§2.5). L'écran de confirmation est un premier niveau ; un email est plus solide, mais aucun fournisseur d'envoi n'est branché. Marqué en commentaire dans la route.
- ⚠️ **À tester sur un compte jetable avant tout** — l'opération est irréversible.

## [Non publié] — Consentement, support et liens légaux (API Policy §2.1, §2.4, §7.2, §7.3)

### Modifié
- **`connect/strava/page.tsx`** : l'écran d'autorisation portait une liste de bénéfices produit (« Import en une fois », « Auto-détection »…). Remplacée par les **divulgations de consentement exigées avant toute autorisation** : types de données récupérées, ce qui n'est explicitement **pas** récupéré (GPS, noms de sorties, fréquence cardiaque, données d'autres athlètes), méthode de collecte, finalité — plus le retrait du consentement (lien direct vers `strava.com/settings/apps`) et la demande de suppression avec confirmation écrite. C'est l'écran que Strava examinera en capture.
- **`account/client.tsx`** : nouvelle carte « Aide et confidentialité » (contact support, politique de confidentialité, révocation de l'accès Strava) et lien « Gérer sur Strava » dans la carte Connexions.

### Ajouté
- **`lib/contact.ts`** (nouveau) : centralise l'adresse de support, l'URL de révocation Strava et le chemin de la politique de confidentialité.

### Notes
- Adresse de support : `tang.dietsch@gmail.com`. Adresse personnelle assumée en attendant un domaine — une boîte réellement relevée vaut mieux qu'un `support@bikeinsight.app` qui ne reçoit rien et qu'un reviewer peut tester. À repasser sur une adresse de domaine avant les fiches store.
- ⚠️ **`/confidentialite` n'existe pas encore** : le lien pointe dans le vide. Page à créer avant la demande de capacité (§7.3).
- 🔴 **Trouvaille : « Supprimer mon compte » ne supprime rien** — le bouton ouvre un `mailto`. Non conforme à l'exigence Apple de suppression in-app (ferme depuis 2022) **et** aux §2.5/§7.4 (suppression sous 30 jours + confirmation écrite). Piste documentée en commentaire dans le code : fonction Postgres `delete_own_account()` en `security definer`, qui évite d'introduire un `SUPABASE_SERVICE_ROLE_KEY`. Non implémentée.

## [Non publié] — Minimisation des données Strava conservées (API Policy §6.2/6.4)

*Suite de la passe de conformité. L'[API Policy](https://www.strava.com/legal/api_policy)
limite la rétention aux données nécessaires à la finalité. Analyse complète dans
`retention-donnees-strava.md` (dossier projet).*

### Constat
`activities.name`, `.moving_time_s` et `.elevation_m` étaient écrits par l'import Strava et lus
par la seule fonction `getSyncData` — **orpheline, importée nulle part**. Du contenu d'athlète
conservé indéfiniment sans jamais être affiché : le seul point de non-conformité indiscutable de
l'audit. À l'inverse, le moteur d'usure ne lit **pas** cette table (il calcule
`bikes.total_km - components.installed_km`), donc usure, statuts et coûts ne sont pas concernés.

### Modifié
- **`api/strava/import/route.ts`** : l'import ne conserve plus que `strava_id`, `bike_id`, `distance_km`, `started_at`. `strava_id` est gardé délibérément — il assure l'idempotence de l'upsert (sinon double comptage des km à chaque resync) et il est **nécessaire pour honorer le §6.3** : sans lui, impossible de retirer la contribution d'une sortie que l'athlète supprimerait sur Strava.
- **`lib/data.ts`** : `getSyncData` supprimée (code mort, seul consommateur des colonnes purgées).

### Ajouté
- **`supabase/migrations/20260812000001_minimize_strava_activity_data.sql`** : purge des trois colonnes sur les lignes d'origine Strava + contrainte `activities_no_strava_content` empêchant toute réintroduction. `name` reste autorisé sur les **sorties manuelles** (`strava_id is null`) : donnée de l'utilisateur, affichée dans l'app, hors périmètre de la Policy.

### Notes
- ⚠️ **Migration destructive** : à appliquer manuellement sur Supabase après sauvegarde.
- Question sur l'interprétation du §6.2 (limite de 7 jours) à poser par écrit à Strava dans la demande de capacité — formulation prête dans `retention-donnees-strava.md`. Plan de repli chiffré si Strava tranche strictement ; dans tous les cas le produit reste entier, seule la granularité d'historique serait affectée.

## [Non publié] — Conformité Brand Guidelines Strava (avant demande de capacité)

*Passe de conformité préalable à la demande d'augmentation de capacité auprès de Strava
(l'app est en « Single Player Mode », capacité 1 athlète). Référence :
<https://developers.strava.com/guidelines/>, révision du 29 septembre 2025.*

### Ajouté
- **`components/bi/strava-brand.tsx`** (nouveau) : `StravaConnectButton` (bouton officiel, hauteur 48px imposée par la section 1.1), `PoweredByStrava` (attribution, section 4) et `StravaAttributionFooter`. Les deux composants basculent sur un **repli texte conforme** tant que les assets officiels ne sont pas déposés — le repli du bouton est volontairement neutre (encre), reprendre l'orange de marque sans l'asset officiel étant précisément ce que les guidelines proscrivent.
- **`public/strava/`** (nouveau) : les deux SVG officiels, déposés tels quels et **versionnés** (sans eux dans le build, la prod retomberait sur le repli texte) — `connect-with-strava-orange.svg` (237×48) et `powered-by-strava-horizontal-orange.svg` (365×37) — plus un README traçant leur origine exacte dans les archives Strava.
- **`components/bi/app-shell.tsx`** : attribution « Powered by Strava » en fin de flux de contenu (et non en barre fixe, pour ne pas réduire la hauteur utile sur mobile).

### Modifié
- **`connect/strava/page.tsx`** : la pastille « STRAVA » maison (orange de marque hors guidelines) est remplacée par l'attribution officielle ; les deux boutons de connexion maison passent au bouton officiel.
- **`components/bi/sync-button.tsx`** : le bouton « Connecter Strava » perd l'orange de marque et passe en neutre (encre). Il **ne déclenche pas OAuth** — il navigue vers `/connect/strava` — donc l'asset officiel n'y a pas sa place : il laisserait croire que le clic connecte, en plus d'être visuellement disproportionné (237×48) dans une barre d'actions. Le bouton officiel reste au vrai point d'entrée OAuth. Le bouton « Resynchroniser » conserve l'orange : c'est un accent de couleur sur une action Strava, pas une imitation du bouton officiel.
- **`api/strava/auth/route.ts`** : scope réduit à `activity:read_all,profile:read_all`. **`activity:write` retiré** — permission élevée, et écrire marque + lien dans la description publique d'une sortie s'apparente à de la promotion via le contenu des utilisateurs. Une demande à périmètre restreint passe plus facilement.
- **`lib/strava-comment.ts`** : coupe-circuit `ENABLED = false` (les appels d'écriture échoueraient en 401/403 sans le scope) et **retrait de l'URL de l'app** du message. C'est le lien qui faisait basculer le message d'information vers promotion ; le marqueur de marque reste, il sert à l'idempotence.
- **`components/bi/notification-settings.tsx`** : réglage « Alerte dans la description Strava » retiré de l'interface (fonctionnalité désactivée). Il portait en outre un **logo Strava redessiné en SVG inline**, interdit par la section 2 (« never modify or alter »).

### Notes
- Section 3 (« View on Strava ») **non applicable** : elle est conditionnelle et l'app n'affiche aucune sortie individuelle, seulement des agrégats. La règle est documentée dans `strava-brand.tsx` si une liste apparaît un jour.
- ⚠️ Le retrait de `activity:write` n'est pas rétroactif : les utilisateurs déjà connectés conservent leur scope jusqu'à révocation/reconnexion.
- ⚠️ `npx tsc --noEmit` et `npm run lint` **non exécutés** (mount du sandbox trop lent : `du` sur `node_modules` expire). Diffs relus manuellement, équilibrage JSX et imports vérifiés — à relancer en local.

## [Non publié] — Historique : cohérence graphique

### Modifié
- **`historique/page.tsx`** : pastilles de statut colorées sur le sélecteur de vélo (comme dashboard/Coût), fil d'Ariane retiré du PageHead.
- **`cout/history-client.tsx`** : carte liste renommée « Journal » (évite le doublon avec le titre « Historique »).
## [Non publié] — Historique : deux graphes

### Ajouté
- **`historique/history-charts.tsx`** : histogramme des dépenses par mois + répartition « subi vs choisi » (par nature), au-dessus du journal. Calculés côté client depuis les logs déjà chargés.
## [Non publié] — perf : nav plus légère (partout)

### Corrigé
- **`side-nav-loader.tsx`** : la nav (toutes les pages) lit la table `bikes` au lieu de la vue `bike_stats` (qui recalculait coûts + pièce critique à chaque chargement). Idem sur la page historique.
## [Non publié] — perf : fiche composant

### Corrigé
- **`components/[id]/page.tsx`** : suppression d'une requête `activities` en double (la « vie restante » réutilise maintenant les données du graphe).
## [Non publié] — Historique déplacé sur sa propre page

### Ajouté
- **`app/historique/page.tsx`** + entrée nav « Historique » (desktop + mobile) : journal complet (remplacements + entretiens) avec sélecteur de vélo et filtres.

### Modifié
- **`cout/page.tsx`** : historique retiré (page trop chargée), remplacé par un lien vers `/historique`.
## [Non publié] — fix : les remplacements manquaient dans l'historique Coût

### Corrigé
- **`replace-button.tsx`** : le log de remplacement enregistre `bike_id` (manquant avant).
- **`cout/page.tsx`** : les remplacements existants (sans `bike_id`) sont rattachés au vélo via le composant, donc ils apparaissent bien dans l'historique.
## [Non publié] — Création vélo : description sous un « (i) »

### Modifié
- **`onboarding/client.tsx`** : la description par composant passe derrière un « (i) » cliquable (au lieu d'être toujours visible) pour désencombrer la liste.
## [Non publié] — Page Coût : historique unifié

### Ajouté
- **`cout/page.tsx` + `cout/history-client.tsx`** : carte « Historique » (remplacements + entretiens) en bas de la page Coût — chronologique, filtrable (Tout / Remplacements / Entretiens), 20 derniers + « Voir tout », date/km/raison/coût. Source : `maintenance_logs` du vélo sélectionné.
## [Non publié] — Bouton retour des tutos : vrai retour

### Corrigé
- **`back-button.tsx`** (nouveau) sur les pages tuto (composant + entretien) : « Retour » suit l'historique (`router.back()`) — depuis le dashboard, on revient au dashboard, plus vers une page fixe.
## [Non publié] — Création vélo : descriptif par composant

### Ajouté
- **`components-catalog.ts`** : `getComponentDescription(name)` (description courte par type).
- **`onboarding/client.tsx`** : chaque composant affiche une phrase « à quoi ça sert » pendant la création du vélo, pour les débutants.
## [Non publié] — Tutos entretien : page intermédiaire (tuto + vélociste)

### Ajouté
- **`reglages/entretiens/[slug]/tuto`** : page tuto d'entretien avec « je le fais moi-même » (tuto Alltricks) et « je passe chez le vélociste » (recherche), comme les pièces.

### Modifié
- Les « Voir le tuto » des entretiens (dashboard, cartes, fiche) ouvrent cette page au lieu d'aller direct sur Alltricks.
## [Non publié] — Carte tuto entretien : couleur selon l'état

### Modifié
- **`reglages/entretiens/[slug]`** : la carte tuto passe en lime vif (bouton sombre) quand l'entretien est dû/bientôt, et en lime pâle (lien discret) quand il est à jour — comme les pièces.
## [Non publié] — Dashboard : infos DIY/atelier + tuto sur les entretiens

### Ajouté
- **`dashboard/client.tsx`** : ligne difficulté · temps DIY · coût atelier · pastille « Voir le tuto » sous chaque entretien (comme les pièces).
- **`maintenance-tutos.ts`** : coût atelier indicatif ajouté.
## [Non publié] — Page entretien : carte tuto riche (façon « Et maintenant ? »)

### Modifié
- **`reglages/entretiens/[slug]/client.tsx`** : carte tuto au format des pièces (bandeau lime, difficulté/temps DIY vs coût vélociste, bouton « Voir le tuto »).
## [Non publié] — Tutos pour les entretiens

### Ajouté
- **`maintenance-tutos.ts`** : tutos par type d'entretien (difficulté, temps, lien Alltricks), calqués sur les guides de réparation des pièces.
- **Page entretien** (`[slug]`) : carte « Comment le faire » ; **carte entretien** : lien « Voir le tuto » dans le formulaire de suivi.
## [Non publié] — Dashboard : « Voir le tuto » sur les pièces à traiter

### Ajouté
- **`dashboard/client.tsx`** : lien « Voir le tuto » sur chaque ligne « À traiter » (à côté de la difficulté/temps/atelier) → page tuto du composant.

## [Non publié] — Carte entretien : bouton « Gérer » retiré

### Supprimé
- **`maintenance-card.tsx`** : bouton « Gérer » de l'en-tête retiré. Les lignes mènent toujours à la page de chaque entretien.

## [Non publié] — fix : dashboard affichait « non configuré » après un remplacement

### Corrigé
- **`dashboard/client.tsx`** : le vélo semblait vide sur le dashboard après un remplacement qui remettait tout au vert (plus d'alerte ⇒ écran « Aucune pièce configurée »). `hasNoComponents` se base maintenant sur le nombre réel de pièces suivies, plus sur la présence d'alertes.

## [Non publié] — Entretiens : gestion par page dédiée

### Modifié
- **`reglages/entretiens/`** : la gestion passe d'un tableau à édition en ligne à un index + une page par entretien (`[slug]`) pour ses réglages et sa suppression ; création via `/new`. La carte entretien pointe désormais vers la page de l'entretien.
## [Non publié] — Ajout pièce : sélection uniforme

### Modifié
- **`new-component-form.tsx`** : la suggestion sélectionnée utilise le même style de remplissage foncé que les boutons Type et Durée de vie — état sélectionné uniforme sur tout le formulaire.

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