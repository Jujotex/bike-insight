# Setup mobile (Capacitor — mode remote URL)

L'app native iOS/Android est une coquille Capacitor qui charge le site en production
(`https://bike-insight-wheat.vercel.app`) dans une WebView. Aucun changement
d'architecture Next.js : la version web reste déployée sur Vercel comme avant.

Fichiers concernés : `capacitor.config.ts` (config, URL distante), `capacitor-shell/`
(coquille requise par Capacitor, jamais affichée), dépendances `@capacitor/*` dans
`package.json`.

## 1. Générer les projets natifs (une seule fois, sur ta machine)

```bash
npm install
npx cap add ios
npx cap add android
```

Cela crée les dossiers `ios/` et `android/` → **à committer dans git** (convention
Capacitor : les projets natifs font partie du repo).

Après tout changement de `capacitor.config.ts` : `npx cap sync`.

## 2. Tester

- **Android** : installer Android Studio, puis `npx cap open android` → Run sur un
  émulateur ou un téléphone en USB.
- **iOS sans Mac** : impossible de tester en local. Options :
  - **Codemagic** (codemagic.io) : CI qui builde iOS dans le cloud et envoie sur
    TestFlight — la voie recommandée sans Mac (offre gratuite suffisante au début).
  - Mac cloud à l'heure (MacStadium, Scaleway Mac mini) si besoin de Xcode ponctuel.

## 3. Comptes et soumission

1. **Google Play Console** : 25 $ une fois → build AAB via Android Studio ou CI.
2. **Apple Developer Program** : 99 $/an (inscription 24-48 h). Sans Mac, la
   signature + upload TestFlight passent par Codemagic.
3. À préparer pour les deux stores : icône 1024×1024, splash screen, captures
   d'écran par taille d'appareil, texte de présentation, **politique de
   confidentialité** (URL publique obligatoire).

## 4. Risque Apple guideline 4.2 (« simple site web emballé »)

Pour maximiser les chances d'acceptation, prévoir avant la soumission App Store :

- **Notifications push natives** (rappels d'entretien — le cas d'usage parfait) :
  plugin `@capacitor/push-notifications` + envoi via Supabase Edge Function.
- Icône + splash screen soignés (`@capacitor/splash-screen`).
- Gestion du bouton retour Android (`@capacitor/app`).

Si refus malgré tout : plan B documenté = migration vers un export statique
(`output: 'export'`, auth client-side) — chantier plus lourd, à ne lancer que si
nécessaire.

## Limites connues du mode remote URL

- Pas de mode hors-ligne : sans réseau, l'app affiche la coquille `capacitor-shell`.
- Le contenu de l'app suit chaque déploiement Vercel (pas de re-soumission store
  nécessaire pour les changements web — c'est aussi un avantage).
