// Catalogue de composants vélo avec recommandations concrètes
// Détection automatique de compatibilité depuis le nom du composant

export type CatalogProduct = {
  name: string;
  brand: string;
  reference?: string;
  price: number;       // € indicatif
  lifeKm: number;     // km estimés
  tier: "budget" | "original" | "premium";
  note?: string;       // info compatibilité ou conseil
};

export type CatalogEntry = {
  id: string;
  compatNote: string;  // affiché à l'utilisateur ex: "Compatible Shimano 11v"
  keywords: string[][];  // tableau de groupes OR — chaque groupe doit matcher
  products: CatalogProduct[];
};

// ── CATALOGUE ──────────────────────────────────────────────────

export const CATALOG: CatalogEntry[] = [

  // ── CHAÎNES ────────────────────────────────────────────────

  {
    id: "chain-shimano-11v",
    compatNote: "Compatible Shimano 11 vitesses (105 / Ultegra / Dura-Ace / GRX)",
    keywords: [["shimano", "105", "ultegra", "dura-ace", "grx", "hg"], ["11v", "11-speed", "11 vitesse", "11s"]],
    products: [
      { name: "KMC X11", brand: "KMC", reference: "X11-1", price: 22, lifeKm: 3000, tier: "budget", note: "Compatible universelle 11v, bon rapport qualité/prix" },
      { name: "Shimano HG601-11", brand: "Shimano", reference: "CS-HG601", price: 28, lifeKm: 4000, tier: "original", note: "Chaîne de série 105/Ultegra, traitement anti-corrosion" },
      { name: "Shimano HG701-11 Ultegra", brand: "Shimano", reference: "CN-HG701", price: 38, lifeKm: 4500, tier: "premium", note: "Qualité Ultegra, traitement SIL-TEC réduit la friction" },
    ],
  },

  {
    id: "chain-shimano-12v",
    compatNote: "Compatible Shimano 12 vitesses (Dura-Ace / Ultegra Di2 / XT / SLX)",
    keywords: [["shimano", "di2", "xt", "slx", "deore", "dura-ace r9200", "ultegra r8100"], ["12v", "12-speed", "12 vitesse", "12s"]],
    products: [
      { name: "KMC X12", brand: "KMC", reference: "X12", price: 25, lifeKm: 3000, tier: "budget", note: "Compatible universelle 12v route et VTT" },
      { name: "Shimano CN-M6100", brand: "Shimano", reference: "CN-M6100", price: 32, lifeKm: 4000, tier: "original", note: "Entrée de gamme 12v Shimano, fiable et économique" },
      { name: "Shimano XT CN-M8100", brand: "Shimano", reference: "CN-M8100", price: 48, lifeKm: 5000, tier: "premium", note: "Qualité XT, traitement Hyper-Drive réduit le poids et la friction" },
    ],
  },

  {
    id: "chain-sram-12v",
    compatNote: "Compatible SRAM 12 vitesses (Eagle / AXS)",
    keywords: [["sram", "eagle", "axs", "gx", "nx", "sx", "xx1", "x01"], ["12v", "12-speed", "12 vitesse", "12s"]],
    products: [
      { name: "KMC X12 SRAM", brand: "KMC", reference: "X12-1", price: 25, lifeKm: 3000, tier: "budget", note: "Compatible SRAM Eagle 12v" },
      { name: "SRAM PC-1130", brand: "SRAM", reference: "PC-1130", price: 30, lifeKm: 3500, tier: "original", note: "Chaîne SRAM NX 12v, solide et accessible" },
      { name: "SRAM GX Eagle", brand: "SRAM", reference: "PC-GX-Eagle", price: 55, lifeKm: 5000, tier: "premium", note: "Chaîne GX Eagle, Power Lock inclus, légère" },
    ],
  },

  {
    id: "chain-sram-11v",
    compatNote: "Compatible SRAM 11 vitesses (Force / Rival / Red)",
    keywords: [["sram", "force", "rival", "red", "apex"], ["11v", "11-speed", "11 vitesse", "11s"]],
    products: [
      { name: "KMC X11 SRAM", brand: "KMC", reference: "X11-1", price: 22, lifeKm: 3000, tier: "budget", note: "Compatible universelle SRAM 11v" },
      { name: "SRAM PC-1130", brand: "SRAM", reference: "PC-1130", price: 28, lifeKm: 3500, tier: "original", note: "Chaîne SRAM Rival 11v standard" },
      { name: "SRAM PC-Red 22", brand: "SRAM", reference: "PC-Red22", price: 65, lifeKm: 4500, tier: "premium", note: "Chaîne Red 22, PowerGlide, revêtement cuivre" },
    ],
  },

  {
    id: "chain-generic-11v",
    compatNote: "Chaîne 11 vitesses (compatibilité universelle)",
    keywords: [["chaîne", "chain", "chaine"], ["11v", "11-speed", "11 vitesse", "11s"]],
    products: [
      { name: "KMC Z11", brand: "KMC", reference: "Z11", price: 15, lifeKm: 2500, tier: "budget", note: "Entrée de gamme 11v, compatible Shimano et SRAM" },
      { name: "KMC X11", brand: "KMC", reference: "X11", price: 22, lifeKm: 3500, tier: "original", note: "Référence polyvalente 11v" },
      { name: "Shimano HG601-11", brand: "Shimano", reference: "HG601-11", price: 28, lifeKm: 4000, tier: "premium", note: "Qualité groupe 105, fiable et durable" },
    ],
  },

  {
    id: "chain-generic-12v",
    compatNote: "Chaîne 12 vitesses (compatibilité universelle)",
    keywords: [["chaîne", "chain", "chaine"], ["12v", "12-speed", "12 vitesse", "12s"]],
    products: [
      { name: "KMC X12", brand: "KMC", reference: "X12", price: 25, lifeKm: 2500, tier: "budget", note: "Compatible Shimano et SRAM 12v" },
      { name: "SRAM PC-1130", brand: "SRAM", reference: "PC-1130", price: 30, lifeKm: 3500, tier: "original", note: "Solide et économique" },
      { name: "Shimano CN-M6100", brand: "Shimano", reference: "M6100", price: 32, lifeKm: 4000, tier: "premium", note: "Qualité Deore 12v" },
    ],
  },

  {
    id: "chain-generic",
    compatNote: "Chaîne vélo (vérifier la compatibilité vitesses)",
    keywords: [["chaîne", "chain", "chaine"]],
    products: [
      { name: "KMC Z9", brand: "KMC", reference: "Z9", price: 12, lifeKm: 2500, tier: "budget", note: "Compatible 9v, économique" },
      { name: "KMC X11", brand: "KMC", reference: "X11", price: 22, lifeKm: 3500, tier: "original", note: "Référence polyvalente — vérifier le nombre de vitesses" },
      { name: "Shimano HG701-11", brand: "Shimano", reference: "HG701-11", price: 38, lifeKm: 4500, tier: "premium", note: "Ultegra qualité — vérifier compatibilité avec ton groupe" },
    ],
  },

  // ── CASSETTES ──────────────────────────────────────────────

  {
    id: "cassette-shimano-11v-road",
    compatNote: "Compatible Shimano 11v route (105 / Ultegra / Dura-Ace)",
    keywords: [["shimano", "105", "ultegra", "dura-ace"], ["11v", "11-speed", "11s", "cassette"]],
    products: [
      { name: "Shimano CS-HG500-11", brand: "Shimano", reference: "CS-HG500-11", price: 25, lifeKm: 15000, tier: "budget", note: "Entrée de gamme 11v, compatible roue libre Shimano" },
      { name: "Shimano 105 CS-HG700-11", brand: "Shimano", reference: "CS-HG700-11", price: 50, lifeKm: 20000, tier: "original", note: "Cassette 105, aluminium, légère" },
      { name: "Shimano Ultegra CS-R8000", brand: "Shimano", reference: "CS-R8000", price: 80, lifeKm: 25000, tier: "premium", note: "Aluminium usiné, jusqu'à 200g, compatible Di2" },
    ],
  },

  {
    id: "cassette-sram-12v",
    compatNote: "Compatible SRAM Eagle 12v",
    keywords: [["sram", "eagle", "gx", "nx", "sx", "xx1"], ["12v", "12-speed", "cassette"]],
    products: [
      { name: "SRAM SX Eagle PG-1210", brand: "SRAM", reference: "PG-1210", price: 30, lifeKm: 12000, tier: "budget", note: "Entrée de gamme Eagle 12v" },
      { name: "SRAM NX Eagle PG-1230", brand: "SRAM", reference: "PG-1230", price: 50, lifeKm: 15000, tier: "original", note: "NX Eagle, acier, très robuste" },
      { name: "SRAM GX Eagle PG-1275", brand: "SRAM", reference: "PG-1275", price: 85, lifeKm: 20000, tier: "premium", note: "Alu/acier, léger, XD driver requis" },
    ],
  },

  {
    id: "cassette-shimano-12v",
    compatNote: "Compatible Shimano 12v (XT / SLX / Deore)",
    keywords: [["shimano", "xt", "slx", "deore"], ["12v", "12-speed", "cassette"]],
    products: [
      { name: "Shimano Deore CS-M6100", brand: "Shimano", reference: "CS-M6100", price: 35, lifeKm: 12000, tier: "budget", note: "Deore 12v, microspline requis" },
      { name: "Shimano SLX CS-M7100", brand: "Shimano", reference: "CS-M7100", price: 55, lifeKm: 18000, tier: "original", note: "SLX 12v, alu sur grandes couronnes" },
      { name: "Shimano XT CS-M8100", brand: "Shimano", reference: "CS-M8100", price: 90, lifeKm: 25000, tier: "premium", note: "XT 12v, hyperglide+ pour changements sous charge" },
    ],
  },

  // ── PNEUS ─────────────────────────────────────────────────

  {
    id: "tire-road-700c",
    compatNote: "Pneu route 700c",
    keywords: [["pneu", "tire", "tyre"], ["700c", "route", "road", "23c", "25c", "28c", "32c"]],
    products: [
      { name: "Continental Ultra Sport III", brand: "Continental", reference: "US3-700c", price: 18, lifeKm: 3000, tier: "budget", note: "Entrée de gamme solide, excellente durabilité" },
      { name: "Continental GP5000", brand: "Continental", reference: "GP5000", price: 52, lifeKm: 5000, tier: "original", note: "Référence route, faible résistance au roulement, anti-crevaison" },
      { name: "Vittoria Corsa Pro", brand: "Vittoria", reference: "Corsa-Pro", price: 68, lifeKm: 5000, tier: "premium", note: "Pneu de compétition, graphène, très grippy" },
    ],
  },

  {
    id: "tire-gravel",
    compatNote: "Pneu gravel 700c",
    keywords: [["pneu", "tire", "tyre"], ["gravel", "700x40", "700x38", "700x45", "650b"]],
    products: [
      { name: "Donnelly Strada USH", brand: "Donnelly", reference: "Strada-USH", price: 30, lifeKm: 4000, tier: "budget", note: "Bon compromis route/gravel léger" },
      { name: "Panaracer GravelKing SS+", brand: "Panaracer", reference: "GK-SS", price: 42, lifeKm: 5000, tier: "original", note: "Référence gravel, polyvalent et léger" },
      { name: "Pirelli Cinturato Gravel H", brand: "Pirelli", reference: "Cinturato-GH", price: 55, lifeKm: 6000, tier: "premium", note: "Haute performance gravel, anti-crevaison SpeedArmor" },
    ],
  },

  {
    id: "tire-mtb-29",
    compatNote: "Pneu VTT 29 pouces",
    keywords: [["pneu", "tire", "tyre"], ["29", "vtt", "mtb", "mountain", "29\"", "29x"]],
    products: [
      { name: "Kenda Booster Pro", brand: "Kenda", reference: "Booster-29", price: 28, lifeKm: 3000, tier: "budget", note: "Bon compromis grip/endurance en XC" },
      { name: "Maxxis Aggressor 29", brand: "Maxxis", reference: "TB00143400", price: 42, lifeKm: 4000, tier: "original", note: "Pneu arrière polyvalent enduro/trail" },
      { name: "Maxxis Minion DHF 29", brand: "Maxxis", reference: "DHF-29", price: 58, lifeKm: 4500, tier: "premium", note: "Référence descente/enduro, grip exceptionnel" },
    ],
  },

  // ── PLAQUETTES DE FREIN ────────────────────────────────────

  {
    id: "brake-disc-shimano",
    compatNote: "Plaquettes disque Shimano (M03 / M04 / M06 / M07)",
    keywords: [["shimano", "shimano"], ["plaquette", "frein", "brake", "disc", "disque", "m03", "m04", "m06", "m07"]],
    products: [
      { name: "Comprex compatible Shimano", brand: "Comprex", price: 8, lifeKm: 2000, tier: "budget", note: "Compatible Shimano, organique — vérifier le modèle (M03/M04/M06)" },
      { name: "Shimano M06 Organique", brand: "Shimano", reference: "M06", price: 18, lifeKm: 3000, tier: "original", note: "Plaquettes d'origine organique, bon mordant, silencieuses" },
      { name: "Shimano M07 Métal", brand: "Shimano", reference: "M07", price: 24, lifeKm: 5000, tier: "premium", note: "Métal fritté, longévité x2, idéal descente et pluie" },
    ],
  },

  {
    id: "brake-disc-sram",
    compatNote: "Plaquettes disque SRAM (Level / Guide / Maven)",
    keywords: [["sram"], ["plaquette", "frein", "brake", "disc", "disque", "level", "guide", "maven"]],
    products: [
      { name: "Comprex compatible SRAM", brand: "Comprex", price: 9, lifeKm: 2000, tier: "budget", note: "Compatible SRAM Guide/Level — vérifier la référence" },
      { name: "SRAM Organique", brand: "SRAM", price: 20, lifeKm: 2500, tier: "original", note: "Plaquettes SRAM d'origine, organique" },
      { name: "SRAM Métal fritté", brand: "SRAM", price: 28, lifeKm: 4500, tier: "premium", note: "Métal fritté, longévité maximale, mordant en descente" },
    ],
  },

  {
    id: "brake-rim",
    compatNote: "Patins de frein route (jante)",
    keywords: [["patin", "plaquette", "frein", "brake"], ["route", "jante", "rim", "r55", "r50", "700c"]],
    products: [
      { name: "Kool-Stop Dura 2 (paire)", brand: "Kool-Stop", price: 9, lifeKm: 3000, tier: "budget", note: "Bon grip, compatible cartouche Shimano/SRAM" },
      { name: "Shimano R55C4 (paire)", brand: "Shimano", reference: "R55C4", price: 16, lifeKm: 4000, tier: "original", note: "Patins d'origine 105/Ultegra, cartouche replacable" },
      { name: "Swiss Stop Flash Pro (paire)", brand: "Swiss Stop", reference: "Flash-Pro", price: 22, lifeKm: 5500, tier: "premium", note: "Référence performance, excellent mordant par temps humide" },
    ],
  },

  {
    id: "brake-generic",
    compatNote: "Plaquettes / patins de frein",
    keywords: [["plaquette", "patin", "frein", "brake"]],
    products: [
      { name: "Comprex universelles", brand: "Comprex", price: 9, lifeKm: 2000, tier: "budget", note: "Vérifier la compatibilité avec ton modèle de frein" },
      { name: "Shimano M06", brand: "Shimano", reference: "M06", price: 18, lifeKm: 3000, tier: "original", note: "Bonne qualité, vérifier la référence de ton frein" },
      { name: "Swiss Stop Flash Pro", brand: "Swiss Stop", price: 22, lifeKm: 5000, tier: "premium", note: "Excellentes performances toutes conditions" },
    ],
  },
];

// ── Détection automatique ─────────────────────────────────────

export function findCatalogEntry(componentName: string, componentCategory: string): CatalogEntry | null {
  const n = componentName.toLowerCase();
  const c = componentCategory.toLowerCase();

  // On cherche l'entrée dont tous les groupes de keywords matchent
  for (const entry of CATALOG) {
    const allGroupsMatch = entry.keywords.every(group =>
      group.some(kw => n.includes(kw) || c.includes(kw))
    );
    if (allGroupsMatch) return entry;
  }

  return null;
}

export const TIER_LABELS: Record<string, string> = {
  budget: "Budget",
  original: "Équivalent",
  premium: "Premium",
};

export const TIER_DESC: Record<string, string> = {
  budget: "L'essentiel, sans se ruiner",
  original: "Le choix le plus cohérent",
  premium: "Durée de vie maximale",
};

// ── Lookup par template (brand + speeds) ─────────────────────

export function getCatalogForTemplate(
  componentName: string,
  componentCategory: string,
  templateBrand: string,
  templateSpeeds: number
): CatalogEntry | null {
  const brand = templateBrand.toLowerCase();
  const name = componentName.toLowerCase();
  const cat = componentCategory.toLowerCase();
  const sv = `${templateSpeeds}v`;

  const isChain = name.includes("cha") || (cat === "transmission" && (name.includes("chain") || name.includes("kmc") || name.includes("hg")));
  const isCassette = name.includes("cassette") || name.includes("cs-");
  const isDiscBrake = cat === "freinage" && (name.includes("plaquette") || name.includes("disque") || name.includes("disc") || name.includes("m0"));
  const isRimBrake = cat === "freinage" && (name.includes("patin"));
  const isTire = cat === "roues";

  if (isChain) {
    return CATALOG.find(e => e.id === `chain-${brand}-${sv}`)
      ?? CATALOG.find(e => e.id === `chain-generic-${sv}`)
      ?? CATALOG.find(e => e.id === "chain-generic")
      ?? null;
  }
  if (isCassette) {
    return CATALOG.find(e => e.id === `cassette-${brand}-${sv}-road`)
      ?? CATALOG.find(e => e.id === `cassette-${brand}-${sv}`)
      ?? null;
  }
  if (isDiscBrake) {
    return CATALOG.find(e => e.id === `brake-disc-${brand}`)
      ?? CATALOG.find(e => e.id === "brake-disc-shimano")
      ?? null;
  }
  if (isRimBrake) {
    return CATALOG.find(e => e.id === "brake-rim") ?? null;
  }
  if (isTire) {
    return CATALOG.find(e => e.id === "tire-road-700c") ?? null;
  }

  return findCatalogEntry(componentName, componentCategory);
}

// ── Validation de compatibilite de marque ────────────────────

export function checkBrandCompatibility(
  componentName: string,
  componentBrand: string,
  templateBrand: string
): { compatible: boolean; warning: string | null } {
  if (!templateBrand || !componentBrand) return { compatible: true, warning: null };

  const tBrand = templateBrand.toLowerCase();
  const cBrand = componentBrand.toLowerCase();
  const cName = componentName.toLowerCase();

  // KMC est compatible avec tout
  if (cBrand.includes("kmc") || cName.includes("kmc")) {
    return { compatible: true, warning: null };
  }

  // Pneus, cockpit, eclairage toujours compatibles
  if (!cName.includes("cha") && !cName.includes("cassette") && !cName.includes("plaquette") && !cName.includes("disque")) {
    return { compatible: true, warning: null };
  }

  const isShimanoBike = tBrand === "shimano";
  const isSramBike = tBrand === "sram";

  const hasSram = cBrand.includes("sram") || cName.includes("sram") || cName.includes("eagle");
  const hasShimano = cBrand.includes("shimano") || cName.includes("shimano") || cName.includes("hg");
  const hasCampag = cBrand.includes("campagnolo") || cName.includes("campagnolo");

  if (isShimanoBike && hasSram) {
    return { compatible: false, warning: "Composant SRAM non compatible avec un groupe Shimano." };
  }
  if (isShimanoBike && hasCampag) {
    return { compatible: false, warning: "Composant Campagnolo non compatible avec un groupe Shimano." };
  }
  if (isSramBike && hasShimano) {
    return { compatible: false, warning: "Composant Shimano non compatible avec un groupe SRAM." };
  }
  if (isSramBike && hasCampag) {
    return { compatible: false, warning: "Composant Campagnolo non compatible avec un groupe SRAM." };
  }

  return { compatible: true, warning: null };
}
