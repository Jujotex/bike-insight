import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Identifiant unique de l'app sur les stores (reverse-DNS).
  // ⚠️ Définitif après la première soumission — ne plus changer ensuite.
  //
  // Délibérément détaché de la marque (03/09/2026). « Bike Insight » est déjà
  // déposé à l'INPI : le nom commercial va changer, et un identifiant qui le
  // reprendrait imposerait de régénérer les deux projets natifs — en refaisant au
  // passage la configuration du push, qui s'y adosse. Comme cet identifiant n'est
  // jamais montré à l'utilisateur, rien n'obligeait à ce qu'il ressemble au nom.
  appId: 'com.dietsch.bikeapp',

  // Nom affiché sous l'icône. Celui-ci suivra la marque : il est modifiable à
  // tout moment, y compris après publication.
  appName: 'Bike Insight',

  // Interface embarquée dans le binaire, produite par `npm run build:app`.
  //
  // Remplace le mode « remote URL » (`server.url`), qui chargeait le site distant
  // dans une WebView. Deux raisons de l'avoir abandonné : `server.url` est
  // documenté par Capacitor comme réservé au développement, et une app dont
  // l'interface entière est téléchargée au lancement tombe sous la guideline 4.2
  // d'Apple — « repackaged website ».
  //
  // Les routes API restent sur Vercel : l'app les appelle en absolu via
  // NEXT_PUBLIC_API_BASE_URL (cf. `lib/api.ts`). Une app native qui interroge une
  // API distante est parfaitement normale ; ce que la 4.2 sanctionne, c'est
  // l'interface téléchargée, pas les données.
  webDir: 'out',

  plugins: {
    SplashScreen: {
      // Masquage confié au code (`components/bi/native-shell.tsx`), qui attend
      // que l'interface soit montée. En automatique, l'écran disparaît dès que
      // l'activité dessine — donc avant le premier rendu de la WebView, ce qui
      // laisse un éclair blanc entre les deux.
      launchAutoHide: false,
      backgroundColor: '#F4F4EF', // = --bi-bg
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
