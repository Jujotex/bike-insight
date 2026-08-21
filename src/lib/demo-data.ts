// Jeu de données de démonstration — 100 % fictif, aucune donnée utilisateur ni
// Strava. Sert uniquement à la route publique `/demo`, qui rend le vrai
// dashboard sans session.
//
// Volontairement calé sur l'aperçu du héros de la landing (Canyon Aeroad,
// chaîne Ultegra à 94 %, pneus GP5000 à 71 %, score 62/100) : le visiteur qui
// clique « Voir une démo » doit retrouver exactement ce qu'on lui a montré.
// Le score 62 n'est pas écrit en dur, il tombe du calcul du dashboard :
// 0,65 × 52 (pièces) + 0,35 × 80 (entretien) = 62.
//
// ⚠️ Le type vient du dashboard lui-même : si les props changent, le typecheck
// casse ici et la démo ne peut pas diverger silencieusement du produit.

import type { DashboardClientProps } from "@/app/(app)/dashboard/client";

const ROUTE = "demo-bike-route";
const GRAVEL = "demo-bike-gravel";

const BIKE_ROUTE_NAME = "Canyon Aeroad";
const BIKE_GRAVEL_NAME = "Specialized Diverge";

export const DEMO_BIKES = [
  { id: ROUTE, name: BIKE_ROUTE_NAME, is_active: true },
  { id: GRAVEL, name: BIKE_GRAVEL_NAME, is_active: true },
];

export const DEMO_DASHBOARD: Omit<DashboardClientProps, "todayCap"> = {
  userName: "Léo",

  bikes: DEMO_BIKES.map((b) => ({ ...b, total_km: b.id === ROUTE ? 12480 : 3260 })),

  // pièces : 52 sur le vélo de route (deux pièces en alerte), 88 sur le gravel
  readinessByBike: {
    [ROUTE]: { value: 52, components: 5 },
    [GRAVEL]: { value: 88, components: 3 },
  },

  attentionItems: [
    {
      id: "demo-chaine",
      name: "Chaîne",
      brand: "Shimano Ultegra HG701",
      category: "transmission",
      bikeName: BIKE_ROUTE_NAME,
      bikeId: ROUTE,
      status: "bad",
      wearPct: 94,
      kmRemaining: 160,
      weeksUntil: 3,
      cost: 38,
    },
    {
      id: "demo-pneu-ar",
      name: "Pneu arrière",
      brand: "Continental GP5000",
      category: "roues",
      bikeName: BIKE_ROUTE_NAME,
      bikeId: ROUTE,
      status: "warn",
      wearPct: 71,
      kmRemaining: 1160,
      weeksUntil: 10,
      cost: 52,
    },
    {
      id: "demo-plaquettes-gravel",
      name: "Plaquettes avant",
      brand: "Shimano L03A",
      category: "freinage",
      bikeName: BIKE_GRAVEL_NAME,
      bikeId: GRAVEL,
      status: "warn",
      wearPct: 68,
      kmRemaining: 640,
      weeksUntil: 11,
      cost: 24,
    },
  ],

  okItems: [
    {
      id: "demo-cassette",
      name: "Cassette",
      brand: "Ultegra 11-30",
      category: "transmission",
      bikeName: BIKE_ROUTE_NAME,
      bikeId: ROUTE,
      status: "ok",
      wearPct: 44,
      kmRemaining: 5600,
      weeksUntil: 48,
      cost: 85,
    },
    {
      id: "demo-plaquettes",
      name: "Plaquettes arrière",
      brand: "Shimano L03A",
      category: "freinage",
      bikeName: BIKE_ROUTE_NAME,
      bikeId: ROUTE,
      status: "ok",
      wearPct: 31,
      kmRemaining: 2760,
      weeksUntil: 24,
      cost: 24,
    },
    {
      id: "demo-pneu-av",
      name: "Pneu avant",
      brand: "Continental GP5000",
      category: "roues",
      bikeName: BIKE_ROUTE_NAME,
      bikeId: ROUTE,
      status: "ok",
      wearPct: 38,
      kmRemaining: 3100,
      weeksUntil: 27,
      cost: 52,
    },
  ],

  predictions: [
    {
      componentId: "demo-chaine",
      componentName: "Chaîne",
      category: "transmission",
      bikeName: BIKE_ROUTE_NAME,
      bikeId: ROUTE,
      kmRemaining: 160,
      weeksUntil: 3,
      cost: 38,
      urgency: "now",
    },
    {
      componentId: "demo-pneu-ar",
      componentName: "Pneu arrière",
      category: "roues",
      bikeName: BIKE_ROUTE_NAME,
      bikeId: ROUTE,
      kmRemaining: 1160,
      weeksUntil: 10,
      cost: 52,
      urgency: "soon",
    },
    {
      componentId: "demo-cassette",
      componentName: "Cassette",
      category: "transmission",
      bikeName: BIKE_ROUTE_NAME,
      bikeId: ROUTE,
      kmRemaining: 5600,
      weeksUntil: 48,
      cost: 85,
      urgency: "later",
    },
    {
      componentId: "demo-plaquettes-gravel",
      componentName: "Plaquettes avant",
      category: "freinage",
      bikeName: BIKE_GRAVEL_NAME,
      bikeId: GRAVEL,
      kmRemaining: 640,
      weeksUntil: 11,
      cost: 24,
      urgency: "soon",
    },
  ],

  maintenanceAlerts: [
    {
      bikeId: ROUTE,
      bikeName: BIKE_ROUTE_NAME,
      typeId: "lubrification-chaine",
      label: "Lubrification de la chaîne",
      state: "due",
      detail: "Dernière il y a 340 km · tous les 250 km",
    },
    {
      bikeId: ROUTE,
      bikeName: BIKE_ROUTE_NAME,
      typeId: "purge-freins",
      label: "Purge des freins",
      state: "soon",
      detail: "Dernière il y a 10 mois · tous les 12 mois",
    },
  ],

  // 1 « à faire » + 1 « bientôt » → score entretien 100 − 15 − 5 = 80
  maintenanceSummaryByBike: {
    [ROUTE]: {
      counts: { due: 1, soon: 1, ok: 1 },
      items: [
        {
          typeId: "lubrification-chaine",
          label: "Lubrification de la chaîne",
          state: "due",
          pct: 136,
          statusLabel: "En retard de 90 km",
          detail: "Dernière il y a 340 km · tous les 250 km",
        },
        {
          typeId: "purge-freins",
          label: "Purge des freins",
          state: "soon",
          pct: 83,
          statusLabel: "Dans environ 2 mois",
          detail: "Dernière il y a 10 mois · tous les 12 mois",
        },
        {
          typeId: "controle-serrages",
          label: "Contrôle des serrages",
          state: "ok",
          pct: 28,
          statusLabel: "À jour",
          detail: "Dernier il y a 3 semaines · tous les 3 mois",
        },
      ],
    },
    [GRAVEL]: {
      counts: { due: 0, soon: 0, ok: 2 },
      items: [
        {
          typeId: "nettoyage-transmission",
          label: "Nettoyage de la transmission",
          state: "ok",
          pct: 41,
          statusLabel: "À jour",
          detail: "Dernier il y a 210 km · tous les 500 km",
        },
        {
          typeId: "controle-serrages",
          label: "Contrôle des serrages",
          state: "ok",
          pct: 19,
          statusLabel: "À jour",
          detail: "Dernier il y a 2 semaines · tous les 3 mois",
        },
      ],
    },
  },

  km12mByBike: { [ROUTE]: 4500, [GRAVEL]: 980 },
  rides12mByBike: { [ROUTE]: 142, [GRAVEL]: 26 },
};
