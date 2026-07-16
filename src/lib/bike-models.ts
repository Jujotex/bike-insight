// Base de modèles de vélos connus → configuration par défaut du wizard.
// Utilisé pour pré-remplir type / groupe / freins d'après le nom du vélo Strava.
//
// C'est une SUGGESTION : la monte varie selon l'année et la finition. On renvoie
// donc un NIVEAU DE CONFIANCE, et l'utilisateur doit toujours pouvoir corriger.
//   - high   : finition + année identifiées → groupe fiable
//   - medium : finition ou famille identifiée, année incertaine → à confirmer
//   - low    : seule la famille est connue (elle couvre plusieurs groupes) → supposition

export type Confidence = "high" | "medium" | "low";

// Finition précise d'une famille (ex. « Addict 30 ») → groupe exact.
export type BikeVariant = {
  trims: string[];                 // au moins un token doit apparaître (ex. ["30"])
  label: string;                   // ex. "Scott Addict 30"
  templateId: string;
  yearFrom?: number;
  yearTo?: number;
  bikeType?: "route" | "gravel" | "vtt";
  brakeType?: "disc" | "rim";
};

export type BikeModelMatch = {
  match: string[];                 // tous les mots doivent apparaître (insensible à la casse)
  label: string;                   // ex: "Canyon Grizl"
  bikeType: "route" | "gravel" | "vtt";
  templateId: string;              // groupe par défaut (famille)
  brakeType: "disc" | "rim";
  trims?: BikeVariant[];           // finitions précises connues (optionnel)
};

export type ResolvedBikeModel = {
  label: string;
  bikeType: "route" | "gravel" | "vtt";
  templateId: string;
  brakeType: "disc" | "rim";
  confidence: Confidence;
  note?: string;
};

export const BIKE_MODELS: BikeModelMatch[] = [
  // ── Canyon ──────────────────────────────────────────────────
  { match: ["canyon", "aeroad"], label: "Canyon Aeroad", bikeType: "route", templateId: "shimano-ultegra-di2-12v", brakeType: "disc" },
  {
    match: ["canyon", "ultimate"], label: "Canyon Ultimate", bikeType: "route", templateId: "shimano-105-12v", brakeType: "disc",
    trims: [
      { trims: ["cf", "sl", "slx"], label: "Canyon Ultimate CF SL", templateId: "shimano-105-12v" },
      { trims: ["cfr"], label: "Canyon Ultimate CFR", templateId: "shimano-dura-ace-12v" },
    ],
  },
  {
    match: ["canyon", "endurace"], label: "Canyon Endurace", bikeType: "route", templateId: "shimano-105-11v", brakeType: "disc",
    trims: [
      { trims: ["6", "7"], label: "Canyon Endurace (6/7)", templateId: "shimano-105-11v", yearTo: 2022 },
      { trims: ["7"], label: "Canyon Endurace 7", templateId: "shimano-105-12v", yearFrom: 2023 },
      { trims: ["8"], label: "Canyon Endurace 8", templateId: "shimano-ultegra-di2-12v" },
    ],
  },
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
  {
    match: ["trek", "domane"], label: "Trek Domane", bikeType: "route", templateId: "shimano-105-12v", brakeType: "disc",
    trims: [
      { trims: ["al"], label: "Trek Domane AL", templateId: "shimano-tiagra-10v" },
      { trims: ["sl5", "sl", "5"], label: "Trek Domane SL 5", templateId: "shimano-105-12v" },
      { trims: ["sl6", "6"], label: "Trek Domane SL 6", templateId: "shimano-105-12v" },
      { trims: ["sl7", "7"], label: "Trek Domane SL 7", templateId: "shimano-ultegra-di2-12v" },
    ],
  },
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
  {
    match: ["scott", "addict"], label: "Scott Addict", bikeType: "route", templateId: "shimano-105-11v", brakeType: "disc",
    trims: [
      // Addict 30 : 105 11v (R7000) jusqu'à ~2021, 105 12v (R7100) ensuite.
      { trims: ["30"], label: "Scott Addict 30", templateId: "shimano-105-11v", yearTo: 2021 },
      { trims: ["30"], label: "Scott Addict 30", templateId: "shimano-105-12v", yearFrom: 2022 },
      { trims: ["20"], label: "Scott Addict 20", templateId: "shimano-105-12v" },
      { trims: ["10"], label: "Scott Addict 10", templateId: "shimano-ultegra-di2-12v" },
      { trims: ["rc"], label: "Scott Addict RC", templateId: "shimano-ultegra-di2-12v" },
    ],
  },
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

// Résout un vélo → groupe suggéré + niveau de confiance.
// `text` = concaténation marque + modèle + nom du vélo (Strava).
export function resolveBikeModel(text: string): ResolvedBikeModel | null {
  const t = text.toLowerCase();
  const tokens = t.split(/[^a-z0-9]+/).filter(Boolean);
  const yearMatch = t.match(/\b(20[0-3]\d)\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;

  // Les familles les plus spécifiques (plus de mots-clés) d'abord.
  const families = [...BIKE_MODELS].sort((a, b) => b.match.length - a.match.length);

  for (const fam of families) {
    if (!fam.match.every((w) => t.includes(w))) continue;

    // Famille avec finitions connues → tente une identification précise.
    if (fam.trims && fam.trims.length > 0) {
      const candidates = fam.trims.filter((v) => v.trims.some((tok) => tokens.includes(tok)));
      if (candidates.length > 0) {
        const byYear =
          year != null
            ? candidates.find(
                (v) => (v.yearFrom == null || year >= v.yearFrom) && (v.yearTo == null || year <= v.yearTo)
              )
            : undefined;
        const chosen = byYear ?? candidates[0];
        return {
          label: chosen.label,
          bikeType: chosen.bikeType ?? fam.bikeType,
          templateId: chosen.templateId,
          brakeType: chosen.brakeType ?? fam.brakeType,
          confidence: byYear != null ? "high" : "medium",
          note: byYear != null ? undefined : "Finition détectée — confirme l'année/le groupe.",
        };
      }
      // Finition non détectée : on ne connaît que la famille (plusieurs groupes possibles).
      return {
        label: fam.label,
        bikeType: fam.bikeType,
        templateId: fam.templateId,
        brakeType: fam.brakeType,
        confidence: "low",
        note: "Finition non détectée — le groupe varie selon le modèle exact, à confirmer.",
      };
    }

    // Famille sans finitions listées : suggestion de confiance moyenne.
    return {
      label: fam.label,
      bikeType: fam.bikeType,
      templateId: fam.templateId,
      brakeType: fam.brakeType,
      confidence: "medium",
    };
  }

  return null;
}

// Compat : ancienne signature (renvoie la famille brute, sans confiance).
export function matchBikeModel(text: string): BikeModelMatch | null {
  const t = text.toLowerCase();
  const sorted = [...BIKE_MODELS].sort((a, b) => b.match.length - a.match.length);
  for (const m of sorted) {
    if (m.match.every((word) => t.includes(word))) return m;
  }
  return null;
}
