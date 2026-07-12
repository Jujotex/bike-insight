import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Identifiant unique de l'app sur les stores (reverse-DNS).
  // ⚠️ Définitif après la première soumission — ne plus changer ensuite.
  appId: 'com.bikeinsight.app',
  appName: 'Bike Insight',

  // Mode "remote URL" : la WebView charge directement le site en production.
  // Le webDir ne sert que de coquille requise par Capacitor (jamais affiché).
  webDir: 'capacitor-shell',
  server: {
    url: 'https://bike-insight-wheat.vercel.app',
  },
};

export default config;
