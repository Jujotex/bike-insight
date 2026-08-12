# Assets de marque Strava

Visuels officiels issus des archives Strava, déposés **tels quels** : la section 2 des
[Brand Guidelines](https://developers.strava.com/guidelines/) interdit de modifier, altérer
ou animer un logo Strava. Ne pas les recolorer, recadrer, ni les redessiner en SVG inline.

Ces fichiers **sont versionnés** dans le repo : sans eux dans le build, la version déployée
retomberait sur le repli texte de `src/components/bi/strava-brand.tsx`.

## Fichiers présents

| Fichier | Origine | Dimensions |
|---|---|---|
| `connect-with-strava-orange.svg` | [1.1-Connect-with-Strava-Buttons.zip](https://developers.strava.com/downloads/1.1-Connect-with-Strava-Buttons.zip) → `Connect with Strava Orange/btn_strava_connect_with_orange.svg` | 237 × 48 |
| `powered-by-strava-horizontal-orange.svg` | [1.2-Strava-API-Logos.zip](https://developers.strava.com/downloads/1.2-Strava-API-Logos.zip) → `Powered by Strava/pwrdBy_strava_orange/api_logo_pwrdBy_strava_horiz_orange.svg` | 365 × 37 |

Les archives contiennent d'autres déclinaisons (orange / blanc / noir, EPS / SVG / PNG,
horizontal / empilé, ainsi que « Compatible with Strava »). Pour basculer sur une variante
blanche si un fond sombre l'exige, déposer le fichier ici et mettre à jour les constantes
`CONNECT_BTN_SRC` / `POWERED_BY_SRC` dans `strava-brand.tsx`.

## Rappel des contraintes

- Bouton « Connect with Strava » : hauteur **48 px @1x** (section 1.1) — l'asset fait
  nativement 48 px de haut, le composant le rend à cette taille sans le déformer.
- Le bouton doit mener à `https://www.strava.com/oauth/authorize`
  (ou `/oauth/mobile/authorize` en contexte natif) — assuré par la redirection de
  `src/app/api/strava/auth/route.ts`.
- Le logo Strava reste séparé de la marque Bike Insight et **jamais plus proéminent**.
- Ne jamais utiliser un logo Strava comme icône de l'application.
