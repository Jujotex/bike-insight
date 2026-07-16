// Repères de référence statiques : donner à l'utilisateur de quoi « se situer »
// à côté de ses propres chiffres (coût d'entretien, kilométrage).
// Données 100 % statiques, à visée indicative — ce sont des ordres de grandeur
// communément admis pour un cycliste route régulier, pas une vérité individuelle.
//
// Sources (ordres de grandeur, juillet 2026) :
// - Coût d'entretien courant route : ~0,03–0,08 €/km, hors gros achats et hors
//   valeur du vélo (consommables : chaîne, cassette, pneus, plaquettes, câbles…).
// - Kilométrage annuel d'un cycliste régulier : ~3 000–8 000 km/an.

export type Benchmark = {
  min: number;
  max: number;
  unit: string;
  label: string; // profil de référence, ex. « un routier régulier »
};

// Coût d'entretien courant d'un vélo de route (€/km).
export const MAINTENANCE_COST_PER_KM: Benchmark = {
  min: 0.03,
  max: 0.08,
  unit: "€/km",
  label: "un routier régulier",
};

// Kilométrage annuel d'un cycliste régulier (km/an).
export const KM_PER_YEAR: Benchmark = {
  min: 3000,
  max: 8000,
  unit: "km/an",
  label: "un routier régulier",
};

export type BenchmarkVerdict = "below" | "within" | "above";

// Situe une valeur par rapport à une fourchette de référence.
export function benchmarkVerdict(value: number, b: Benchmark): BenchmarkVerdict {
  if (value < b.min) return "below";
  if (value > b.max) return "above";
  return "within";
}
