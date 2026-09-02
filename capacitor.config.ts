import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Identifiant unique de l'app sur les stores (reverse-DNS).
  // ⚠️ Définitif après la première soumission — ne plus changer ensuite.
  //
  // ⏳ À TRANCHER AVANT `npx cap add` : garder un identifiant calqué sur la marque,
  // ou le découpler (`com.dietsch.bikeapp`) pour qu'un futur changement de nom
  // n'ait aucune conséquence. « Bike Insight » étant déjà déposé à l'INPI, la
  // question n'est pas théorique. Voir `plan-app-native.md`, chapitre 0.
  appId: 'com.bikeinsight.app',
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
};

export default config;
