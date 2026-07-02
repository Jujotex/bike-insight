// Base de modèles de vélos connus → configuration par défaut du wizard
// Utilisé pour pré-remplir type / groupe / freins d'après le nom du vélo Strava.
// C'est une SUGGESTION (la monte varie selon l'année et la finition) :
// l'utilisateur doit toujours pouvoir corriger dans le wizard.

export type BikeModelMatch = {
  match: string[];                       // tous les mots doivent apparaître (insensible à la casse)
  label: string;                         // ex: "Canyon Grizl"
  bikeType: "route" | "gravel" | "vtt";
  templateId: string;                    // id dans BIKE_TEMPLATES
  brakeType: "disc" | "rim";
};

export const BIKE_MODELS: BikeModelMatch[] = [
  // ── Canyon ──────────────────────────────────────────────────
  { match: ["canyon", "aeroad"], label: "Canyon Aeroad", bikeType: "route", templateId: "shimano-ultegra-di2-12v", brakeType: "disc" },
  { match: ["canyon", "ultimate"], label: "Canyon Ultimate", bikeType: "route", templateId: "shimano-105-12v", brakeType: "disc" },
  { match: ["canyon", "endurace"], label: "Canyon Endurace", bikeType: "route", templateId: "shimano-105-11v", brakeType: "disc" },
  { match: ["canyon", "grizl"], label: "Canyon Grizl", bikeType: "gravel", templateId: "shimano-grx-11v", brakeType: "disc" },
  { match: ["canyon", "grail"], label: "Canyon Grail", bikeType: "gravel", templateId: "shimano-grx-11v", brakeType: "disc" },
  { match: ["canyon", "spectral"], label: "Canyon Spectral", bikeType: "vtt", templateId: "sram-gx-eagle-12v", brakeType: "disc" },

  // ── Specialized ─────────────────────────────────────────────
  { match: ["specialized", "tarmac"], label: "Specialized Tarmac", bikeType: "route", templateId: "shimano-ultegra-di2-12v", brakeType: "disc" },
  { match: ["specialized", "allez"], label: "Specialized Allez", bikeType: "route", templateId: "shimano-tiagra-10v", brakeType: "rim" },
  { match: ["specialized", "roubaix"], label: "Specialized Roubaix", bikeType: "route", templateId: "shimano-105-12v", brakeType: "disc" },
  { match: ["specialized", "diverge"], label: "Specialized Diverge", bikeType: "gravel", templateId: "shimano-grx-11v", brakeType: "disc" },
  { match: ["specialized", "epic"], label: "Specialized Epic", bikeType: "vtt", templateId: "shimano-xt-12v", brakeType: "disc" },

  // ── Trek ────────────────────────────────────────────────────
  { match: ["trek", "domane"], label: "Trek Domane", bikeType: "route", templateId: "shimano-105-12v", brakeType: "disc" },
  { match: ["trek", "emonda"], label: "Trek Émonda", bikeType: "route", templateId: "shimano-ultegra-11v", brakeType: "disc" },
  { match: ["trek", "madone"], label: "Trek Madone", bikeType: "route", templateId: "shimano-ultegra-di2-12v", brakeType: "disc" },
  { match: ["trek", "checkpoint"], label: "Trek Checkpoint", bikeType: "gravel", templateId: "shimano-grx-11v", brakeType: "disc" },
  { match: ["trek", "marlin"], label: "Trek Marlin", bikeType: "vtt", templateId: "shimano-deore-12v", brakeType: "disc" },

  // ── Cannondale ──────────────────────────────────────────────
  { match: ["cannondale", "supersix"], label: "Cannondale SuperSix", bikeType: "route", templateId: "shimano-105-12v", brakeType: "disc" },
  { match: ["cannondale", "synapse"], label: "Cannondale Synapse", bikeType: "route", templateId: "shimano-105-11v", brakeType: "disc" },
  { match: ["cannondale", "topstone"], label: "Cannondale Topstone", bikeType: "gravel", templateId: "shimano-grx-11v", brakeType: "disc" },

  // ── Giant ───────────────────────────────────────────────────
  { match: ["giant", "tcr"], label: "Giant TCR", bikeType: "route", templateId: "shimano-105-12v", brakeType: "disc" },
  { match: ["giant", "defy"], label: "Giant Defy", bikeType: "route", templateId: "shimano-105-11v", brakeType: "disc" },
  { match: ["giant", "revolt"], label: "Giant Revolt", bikeType: "gravel", templateId: "shimano-grx-11v", brakeType: "disc" },

  // ── Scott ───────────────────────────────────────────────────
  { match: ["scott", "addict"], label: "Scott Addict", bikeType: "route", templateId: "shimano-ultegra-11v", brakeType: "disc" },
  { match: ["scott", "speedster"], label: "Scott Speedster", bikeType: "route", templateId: "shimano-tiagra-10v", brakeType: "disc" },
  { match: ["scott", "spark"], label: "Scott Spark", bikeType: "vtt", templateId: "shimano-xt-12v", brakeType: "disc" },

  // ── Orbea / BMC ─────────────────────────────────────────────
  { match: ["orbea", "orca"], label: "Orbea Orca", bikeType: "route", templateId: "shimano-105-12v", brakeType: "disc" },
  { match: ["orbea", "terra"], label: "Orbea Terra", bikeType: "gravel", templateId: "shimano-grx-11v", brakeType: "disc" },
  { match: ["bmc", "teammachine"], label: "BMC Teammachine", bikeType: "route", templateId: "shimano-ultegra-di2-12v", brakeType: "disc" },
  { match: ["bmc", "roadmachine"], label: "BMC Roadmachine", bikeType: "route", templateId: "shimano-105-12v", brakeType: "disc" },

  // ── Decathlon ───────────────────────────────────────────────
  { match: ["van rysel"], label: "Van Rysel", bikeType: "route", templateId: "shimano-105-11v", brakeType: "disc" },
  { match: ["triban", "rc520"], label: "Triban RC520", bikeType: "route", templateId: "shimano-105-11v", brakeType: "disc" },
  { match: ["triban"], label: "Triban", bikeType: "route", templateId: "shimano-sora-9v", brakeType: "rim" },
  { match: ["rockrider"], label: "Rockrider", bikeType: "vtt", templateId: "shimano-deore-12v", brakeType: "disc" },

  // ── Lapierre / Cube ─────────────────────────────────────────
  { match: ["lapierre", "xelius"], label: "Lapierre Xelius", bikeType: "route", templateId: "shimano-105-12v", brakeType: "disc" },
  { match: ["lapierre", "crosshill"], label: "Lapierre Crosshill", bikeType: "gravel", templateId: "shimano-grx-11v", brakeType: "disc" },
  { match: ["cube", "attain"], label: "Cube Attain", bikeType: "route", templateId: "shimano-105-11v", brakeType: "disc" },
  { match: ["cube", "nuroad"], label: "Cube Nuroad", bikeType: "gravel", templateId: "shimano-grx-11v", brakeType: "disc" },
  { match: ["cube", "reaction"], label: "Cube Reaction", bikeType: "vtt", templateId: "shimano-deore-12v", brakeType: "disc" },
];

// Retourne la config suggérée pour un vélo, ou null.
// `text` = concaténation marque + modèle + nom du vélo (Strava).
// Les entrées les plus spécifiques (plus de mots) sont testées en premier.
export function matchBikeModel(text: string): BikeModelMatch | null {
  const t = text.toLowerCase();
  const sorted = [...BIKE_MODELS].sort((a, b) => b.match.length - a.match.length);
  for (const m of sorted) {
    if (m.match.every(word => t.includes(word))) return m;
  }
  return null;
}
