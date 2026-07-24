// Catalogue de composants vélo avec recommandations concrètes
// Détection automatique de compatibilité depuis le nom du composant

import { resolvePadCatalogId } from "./groupsets";

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
      { name: "KMC X11EL", brand: "KMC", reference: "X11EL", price: 45, lifeKm: 4000, tier: "premium", note: "Axes creux, plus légère et fluide" },
      { name: "Wippermann Connex 11SX", brand: "Wippermann", reference: "Connex-11SX", price: 42, lifeKm: 5000, tier: "premium", note: "Inox, très longue durée, maillon réutilisable" },
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
      { name: "Shimano SLX/GRX CN-M7100", brand: "Shimano", reference: "CN-M7100", price: 35, lifeKm: 4200, tier: "original", note: "12v SLX/GRX, bon compromis prix/durée" },
      { name: "Shimano XTR/Dura-Ace CN-M9100", brand: "Shimano", reference: "CN-M9100", price: 55, lifeKm: 5500, tier: "premium", note: "Haut de gamme 12v, partagée route et VTT" },
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
      { name: "SRAM X01 Eagle", brand: "SRAM", reference: "PC-X01-Eagle", price: 70, lifeKm: 5000, tier: "premium", note: "Hard Chrome, légère, PowerLock inclus" },
      { name: "SRAM XX1 Eagle", brand: "SRAM", reference: "PC-XX1-Eagle", price: 90, lifeKm: 5500, tier: "premium", note: "La plus durable de la gamme Eagle" },
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
      { name: "SRAM PC-1110", brand: "SRAM", reference: "PC-1110", price: 22, lifeKm: 3000, tier: "budget", note: "11v Apex/Rival, PowerLock inclus" },
      { name: "SRAM Force PC-Force22", brand: "SRAM", reference: "PC-Force22", price: 45, lifeKm: 4000, tier: "premium", note: "Hollow-pin, Hard Chrome, légère" },
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
      { name: "YBN SLA-210", brand: "YBN", reference: "SLA-210", price: 20, lifeKm: 3000, tier: "budget", note: "11v universelle, bon rapport qualité/prix" },
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
      { name: "YBN SLA-H12", brand: "YBN", reference: "SLA-H12", price: 24, lifeKm: 3000, tier: "budget", note: "12v universelle Shimano et SRAM" },
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
      { name: "SunRace CSMS8 11v", brand: "SunRace", reference: "CSMS8", price: 32, lifeKm: 14000, tier: "budget", note: "Large plage 11-40, alternative éco compatible Shimano" },
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
      { name: "SRAM XX1 Eagle XG-1299", brand: "SRAM", reference: "XG-1299", price: 350, lifeKm: 22000, tier: "premium", note: "10-52, monobloc X-Dome, ultra légère" },
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
      { name: "SunRace CSMZ90 12v", brand: "SunRace", reference: "CSMZ90", price: 60, lifeKm: 14000, tier: "budget", note: "10-50/10-51 microspline, alternative éco" },
      { name: "Shimano XTR CS-M9100", brand: "Shimano", reference: "CS-M9100", price: 150, lifeKm: 28000, tier: "premium", note: "12v XTR, titane, 10-45 ou 10-51" },
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
      { name: "Michelin Lithion 3", brand: "Michelin", reference: "Lithion-3", price: 28, lifeKm: 5000, tier: "original", note: "Polyvalent entraînement, bon compromis grip/longévité" },
      { name: "Michelin Power Cup TLR", brand: "Michelin", reference: "Power-Cup", price: 55, lifeKm: 4000, tier: "premium", note: "Compétition tubeless, très faible résistance au roulement" },
      { name: "Schwalbe Pro One TLE", brand: "Schwalbe", reference: "Pro-One", price: 55, lifeKm: 4000, tier: "premium", note: "Tubeless rapide, bon compromis confort/vitesse" },
      { name: "Continental GP5000 S TR", brand: "Continental", reference: "GP5000-S-TR", price: 62, lifeKm: 5000, tier: "premium", note: "Version tubeless du GP5000, anti-crevaison" },
      { name: "Pirelli P Zero Race", brand: "Pirelli", reference: "PZero-Race", price: 50, lifeKm: 4000, tier: "premium", note: "Grip sec et humide, pneu de compétition" },
      { name: "Vittoria Corsa Pro", brand: "Vittoria", reference: "Corsa-Pro", price: 68, lifeKm: 5000, tier: "premium", note: "Pneu de compétition, graphène, très grippy" },
    ],
  },

  {
    id: "tire-gravel",
    compatNote: "Pneu gravel 700c",
    keywords: [["pneu", "tire", "tyre"], ["gravel", "700x40", "700x38", "700x45", "650b"]],
    products: [
      { name: "Donnelly Strada USH", brand: "Donnelly", reference: "Strada-USH", price: 30, lifeKm: 4000, tier: "budget", note: "Bon compromis route/gravel léger" },
      { name: "Schwalbe G-One Allround", brand: "Schwalbe", reference: "G-One-Allround", price: 42, lifeKm: 4000, tier: "original", note: "Référence gravel polyvalente, roule bien sur route et chemins secs" },
      { name: "Panaracer GravelKing SS+", brand: "Panaracer", reference: "GK-SS", price: 42, lifeKm: 5000, tier: "original", note: "Référence gravel, polyvalent et léger" },
      { name: "WTB Riddler", brand: "WTB", reference: "Riddler", price: 40, lifeKm: 4000, tier: "original", note: "Crampons bas, rapide sur gravel roulant" },
      { name: "Vittoria Terreno Dry", brand: "Vittoria", reference: "Terreno-Dry", price: 42, lifeKm: 4500, tier: "original", note: "Terrain sec, bon grip en courbe" },
      { name: "Schwalbe G-One R", brand: "Schwalbe", reference: "G-One-R", price: 58, lifeKm: 3500, tier: "premium", note: "Gravel race tubeless, très roulant" },
      { name: "Continental Terra Speed", brand: "Continental", reference: "Terra-Speed", price: 55, lifeKm: 5000, tier: "premium", note: "Compétition gravel, faible résistance au roulement" },
      { name: "Pirelli Cinturato Gravel H", brand: "Pirelli", reference: "Cinturato-GH", price: 55, lifeKm: 6000, tier: "premium", note: "Haute performance gravel, anti-crevaison SpeedArmor" },
    ],
  },

  {
    id: "tire-mtb-29",
    compatNote: "Pneu VTT 29 pouces",
    keywords: [["pneu", "tire", "tyre"], ["29", "vtt", "mtb", "mountain", "29\"", "29x"]],
    products: [
      { name: "Kenda Booster Pro", brand: "Kenda", reference: "Booster-29", price: 28, lifeKm: 3000, tier: "budget", note: "Bon compromis grip/endurance en XC" },
      { name: "Maxxis Rekon 29", brand: "Maxxis", reference: "Rekon-29", price: 45, lifeKm: 3800, tier: "original", note: "Trail/XC roulant, bon grip polyvalent" },
      { name: "Schwalbe Nobby Nic 29", brand: "Schwalbe", reference: "NobbyNic-29", price: 48, lifeKm: 3500, tier: "original", note: "All-mountain polyvalent, sec comme humide" },
      { name: "Continental Cross King 29", brand: "Continental", reference: "CrossKing-29", price: 40, lifeKm: 4000, tier: "original", note: "XC roulant, longue durée de vie" },
      { name: "Maxxis Aggressor 29", brand: "Maxxis", reference: "TB00143400", price: 42, lifeKm: 4000, tier: "original", note: "Pneu arrière polyvalent enduro/trail" },
      { name: "Maxxis Minion DHF 29", brand: "Maxxis", reference: "DHF-29", price: 58, lifeKm: 4500, tier: "premium", note: "Référence descente/enduro, grip exceptionnel" },
    ],
  },

  // ── PLAQUETTES DE FREIN ────────────────────────────────────

  {
    // VTT uniquement : étriers Deore/SLX/XT 2 pistons (M06 = plaquette VTT).
    id: "brake-disc-shimano",
    compatNote: "Plaquettes disque Shimano VTT (M03 / M04 / M06 / M07)",
    keywords: [["shimano", "shimano"], ["plaquette", "frein", "brake", "disc", "disque", "m03", "m04", "m06", "m07"]],
    products: [
      { name: "Comprex compatible Shimano", brand: "Comprex", price: 8, lifeKm: 2000, tier: "budget", note: "Compatible Shimano VTT, organique — vérifier le modèle (M03/M04/M06)" },
      { name: "Shimano M06 Organique", brand: "Shimano", reference: "M06", price: 18, lifeKm: 3000, tier: "original", note: "Plaquettes VTT d'origine organique, bon mordant, silencieuses" },
      { name: "Shimano M07 Métal", brand: "Shimano", reference: "M07", price: 24, lifeKm: 5000, tier: "premium", note: "Métal fritté, longévité x2, idéal descente et pluie" },
      { name: "Galfer compatible Shimano", brand: "Galfer", price: 22, lifeKm: 4000, tier: "original", note: "Composé Pro, bon mordant, peu bruyant" },
      { name: "Shimano N03A métal (4 pistons)", brand: "Shimano", reference: "N03A", price: 30, lifeKm: 5000, tier: "premium", note: "Étriers 4 pistons XT/XTR, métal fritté" },
    ],
  },

  {
    // Route/gravel 11v et moins : étriers flat-mount type L (R7070/R8070/RS405).
    id: "brake-disc-shimano-road-11v",
    compatNote: "Plaquettes disque Shimano route type L (105/Ultegra/Tiagra — étriers R7070/R8070)",
    keywords: [["shimano"], ["plaquette", "frein", "brake", "disc", "disque", "l02a", "l03a", "l04c"]],
    products: [
      { name: "Comprex compatible Shimano L", brand: "Comprex", price: 10, lifeKm: 2000, tier: "budget", note: "Résine compatible étriers route flat-mount — vérifier L02A/L03A" },
      { name: "Shimano L03A résine", brand: "Shimano", reference: "L03A", price: 20, lifeKm: 2500, tier: "original", note: "Plaquettes route d'origine (résine), silencieuses" },
      { name: "Shimano L04C métal", brand: "Shimano", reference: "L04C", price: 30, lifeKm: 4000, tier: "premium", note: "Métal fritté, longévité accrue, meilleur par temps humide" },
      { name: "Galfer route type L", brand: "Galfer", price: 22, lifeKm: 3500, tier: "premium", note: "Composé longue durée, bon par temps humide" },
      { name: "SwissStop Disc 34 RS", brand: "SwissStop", reference: "Disc-34-RS", price: 28, lifeKm: 3500, tier: "premium", note: "Compatible étriers route Shimano type L" },
    ],
  },

  {
    // Route/gravel 12v : étriers flat-mount type K (R7170/R8170/R9270).
    id: "brake-disc-shimano-road-12v",
    compatNote: "Plaquettes disque Shimano route type K (105/Ultegra/Dura-Ace 12v — étriers R7170/R8170)",
    keywords: [["shimano"], ["plaquette", "frein", "brake", "disc", "disque", "k02s", "k03s", "k04s"]],
    products: [
      { name: "Comprex compatible Shimano K", brand: "Comprex", price: 12, lifeKm: 2000, tier: "budget", note: "Résine compatible étriers route 12v — vérifier K02S/K03S" },
      { name: "Shimano K02S résine", brand: "Shimano", reference: "K02S", price: 22, lifeKm: 2500, tier: "original", note: "Plaquettes route 12v d'origine (résine)" },
      { name: "Shimano K-type métal", brand: "Shimano", price: 32, lifeKm: 4000, tier: "premium", note: "Métal fritté, longévité accrue — vérifie la réf. (K03S/K04S selon ton étrier)" },
      { name: "Galfer route type K", brand: "Galfer", price: 24, lifeKm: 3500, tier: "premium", note: "Composé longue durée, étriers route 12v type K" },
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
      { name: "Galfer compatible SRAM", brand: "Galfer", price: 22, lifeKm: 4000, tier: "original", note: "Composé Pro, bon mordant" },
      { name: "Jagwire Pro SRAM", brand: "Jagwire", price: 20, lifeKm: 3500, tier: "original", note: "Compatible Level/Guide, semi-métallique" },
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
      { name: "Kool-Stop Salmon (paire)", brand: "Kool-Stop", price: 12, lifeKm: 3500, tier: "original", note: "Composé saumon, excellent par temps humide" },
      { name: "SwissStop BXP (paire)", brand: "SwissStop", reference: "BXP", price: 20, lifeKm: 5000, tier: "premium", note: "Polyvalent alu, silencieux et endurant" },
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
  // ── CHAÎNES 8/9/10V ────────────────────────────────────────

  {
    id: "chain-shimano-8v",
    compatNote: "Chaîne 8 vitesses (Claris / Altus / Acera)",
    keywords: [["chaîne", "chain", "chaine", "z8", "hg40"], ["8v", "8-speed", "8s", "8 vitesse"]],
    products: [
      { name: "KMC Z8", brand: "KMC", reference: "Z8.3", price: 12, lifeKm: 2500, tier: "budget", note: "Référence économique 8v, compatible Shimano et SRAM" },
      { name: "Shimano CN-HG40", brand: "Shimano", reference: "CN-HG40", price: 14, lifeKm: 3000, tier: "original", note: "Chaîne d'origine 6/7/8v" },
      { name: "Shimano CN-HG71", brand: "Shimano", reference: "CN-HG71", price: 20, lifeKm: 4000, tier: "premium", note: "Renforcée, très durable, idéale usage quotidien" },
      { name: "SRAM PC-830", brand: "SRAM", reference: "PC-830", price: 14, lifeKm: 2800, tier: "original", note: "6/7/8v, PowerLink inclus" },
    ],
  },

  {
    id: "chain-shimano-9v",
    compatNote: "Chaîne 9 vitesses (Sora / Alivio / Deore 9v)",
    keywords: [["chaîne", "chain", "chaine", "x9", "hg53"], ["9v", "9-speed", "9s", "9 vitesse"]],
    products: [
      { name: "KMC X9", brand: "KMC", reference: "X9.93", price: 14, lifeKm: 2500, tier: "budget", note: "Compatible universelle 9v" },
      { name: "Shimano CN-HG53", brand: "Shimano", reference: "CN-HG53", price: 18, lifeKm: 3000, tier: "original", note: "Chaîne de série Sora / Alivio" },
      { name: "Shimano CN-HG93", brand: "Shimano", reference: "CN-HG93", price: 25, lifeKm: 3500, tier: "premium", note: "Qualité supérieure, rivets renforcés" },
      { name: "SRAM PC-971", brand: "SRAM", reference: "PC-971", price: 20, lifeKm: 3000, tier: "premium", note: "9v, PowerLink, robuste" },
    ],
  },

  {
    id: "chain-shimano-10v",
    compatNote: "Chaîne 10 vitesses (Tiagra / Deore 10v / CUES)",
    keywords: [["chaîne", "chain", "chaine", "x10", "hg54", "lg500"], ["10v", "10-speed", "10s", "10 vitesse"]],
    products: [
      { name: "KMC X10", brand: "KMC", reference: "X10.93", price: 18, lifeKm: 3000, tier: "budget", note: "Compatible universelle 10v" },
      { name: "Shimano CN-HG54", brand: "Shimano", reference: "CN-HG54", price: 22, lifeKm: 3000, tier: "original", note: "Chaîne de série Tiagra / Deore" },
      { name: "Shimano CN-HG95", brand: "Shimano", reference: "CN-HG95", price: 28, lifeKm: 4000, tier: "premium", note: "Qualité XT/Ultegra 10v, traitement SIL-TEC" },
      { name: "SRAM PC-1051", brand: "SRAM", reference: "PC-1051", price: 24, lifeKm: 3200, tier: "original", note: "10v, PowerLock inclus" },
    ],
  },

  // ── CHAÎNES SRAM AXS ROUTE (FLATTOP) ───────────────────────

  {
    id: "chain-sram-axs-road",
    compatNote: "Compatible SRAM AXS route 12v (Red / Force / Rival / Apex) — chaîne Flattop uniquement",
    keywords: [["flattop"]],
    products: [
      { name: "SRAM Apex Flattop", brand: "SRAM", reference: "CN-APX-E1", price: 35, lifeKm: 4000, tier: "budget", note: "Flattop entrée de gamme, PowerLock inclus" },
      { name: "SRAM Rival Flattop", brand: "SRAM", reference: "CN-RVL-D1", price: 50, lifeKm: 4500, tier: "original", note: "Flattop de série Rival/Force AXS" },
      { name: "SRAM Red Flattop D1", brand: "SRAM", reference: "CN-RED-D1", price: 75, lifeKm: 5000, tier: "premium", note: "Flattop compétition, traitement Hard Chrome" },
    ],
  },

  // ── CAMPAGNOLO ─────────────────────────────────────────────

  {
    id: "chain-campagnolo-12v",
    compatNote: "Compatible Campagnolo 12 vitesses (Chorus / Record / Super Record)",
    keywords: [["campagnolo", "c12"], ["12v", "12-speed", "12s", "12 vitesse"]],
    products: [
      { name: "KMC X12", brand: "KMC", reference: "X12", price: 25, lifeKm: 3000, tier: "budget", note: "Compatibilité Campagnolo 12v à vérifier selon le groupe" },
      { name: "Campagnolo C12 Chorus", brand: "Campagnolo", reference: "CN21-CH1214", price: 55, lifeKm: 4500, tier: "original", note: "Chaîne d'origine Chorus 12v" },
      { name: "Campagnolo C12 Record", brand: "Campagnolo", reference: "CN21-RE1212", price: 70, lifeKm: 5000, tier: "premium", note: "Finition Record, traitement Ni-PTFE" },
    ],
  },

  {
    id: "chain-campagnolo-13v",
    compatNote: "Compatible Campagnolo Ekar 13 vitesses — chaîne C13 uniquement",
    keywords: [["ekar", "c13"], ["13v", "13-speed", "13s", "13 vitesse", "chaîne", "chain", "chaine"]],
    products: [
      { name: "Campagnolo C13 Ekar GT", brand: "Campagnolo", reference: "CN21-EKG13", price: 50, lifeKm: 4000, tier: "budget", note: "Version GT, seule alternative 13v" },
      { name: "Campagnolo C13 Ekar", brand: "Campagnolo", reference: "CN21-EK1312", price: 62, lifeKm: 4500, tier: "original", note: "Chaîne d'origine Ekar 13v" },
      { name: "Campagnolo C13 Ekar + C-Link", brand: "Campagnolo", reference: "CN21-EK1312-CL", price: 68, lifeKm: 4500, tier: "premium", note: "Avec maillon rapide C-Link inclus" },
    ],
  },

  // ── CASSETTES ROUTE 12V ────────────────────────────────────

  {
    id: "cassette-shimano-12v-road",
    compatNote: "Compatible Shimano 12v route (105 / Ultegra / Dura-Ace)",
    keywords: [["shimano", "105", "ultegra", "dura-ace", "r7101", "r8101", "r9200"], ["12v", "12-speed", "12s", "cassette"]],
    products: [
      { name: "Shimano 105 CS-R7101", brand: "Shimano", reference: "CS-R7101-12", price: 60, lifeKm: 18000, tier: "budget", note: "Cassette 105 12v, excellent rapport qualité/prix" },
      { name: "Shimano Ultegra CS-R8101", brand: "Shimano", reference: "CS-R8101-12", price: 110, lifeKm: 22000, tier: "original", note: "Aluminium usiné, compatible Di2" },
      { name: "Shimano Dura-Ace CS-R9200", brand: "Shimano", reference: "CS-R9200-12", price: 380, lifeKm: 25000, tier: "premium", note: "Titane/alu, la plus légère de la gamme" },
    ],
  },

  {
    id: "cassette-sram-12v-road",
    compatNote: "Compatible SRAM AXS route 12v (corps de roue libre XDR requis)",
    keywords: [["sram", "xg-12", "xdr"], ["12v", "12-speed", "12s", "cassette"]],
    products: [
      { name: "SRAM Rival XG-1250", brand: "SRAM", reference: "XG-1250", price: 75, lifeKm: 18000, tier: "budget", note: "Acier, robuste, corps XDR" },
      { name: "SRAM Force XG-1270", brand: "SRAM", reference: "XG-1270", price: 130, lifeKm: 20000, tier: "original", note: "Alu/acier, bon compromis poids/durabilité" },
      { name: "SRAM Red XG-1290", brand: "SRAM", reference: "XG-1290", price: 260, lifeKm: 22000, tier: "premium", note: "Monobloc X-Dome, ultra légère" },
    ],
  },

  {
    id: "cassette-campagnolo-12v",
    compatNote: "Compatible Campagnolo 12v (corps de roue libre Campagnolo)",
    keywords: [["campagnolo"], ["12v", "12-speed", "12s", "cassette"]],
    products: [
      { name: "Campagnolo Chorus 12v", brand: "Campagnolo", reference: "CS20-CH1212", price: 165, lifeKm: 18000, tier: "original", note: "Cassette d'origine Chorus" },
      { name: "Campagnolo Record 12v", brand: "Campagnolo", reference: "CS20-RE1212", price: 240, lifeKm: 20000, tier: "premium", note: "Pignons titane sur les grandes couronnes" },
    ],
  },

  {
    id: "cassette-campagnolo-13v",
    compatNote: "Compatible Campagnolo Ekar 13v (corps de roue libre N3W)",
    keywords: [["ekar", "n3w"], ["13v", "13-speed", "13s", "cassette"]],
    products: [
      { name: "Campagnolo Ekar GT 13v", brand: "Campagnolo", reference: "CS22-EKG13", price: 120, lifeKm: 16000, tier: "budget", note: "Version GT, acier, plus abordable" },
      { name: "Campagnolo Ekar 13v", brand: "Campagnolo", reference: "CS21-EK1312", price: 190, lifeKm: 18000, tier: "original", note: "Cassette d'origine Ekar 9-36 ou 9-42" },
    ],
  },

  // ── CASSETTES 8/9/10V ──────────────────────────────────────

  {
    id: "cassette-shimano-8v",
    compatNote: "Cassette Shimano 8 vitesses (Claris / Altus)",
    keywords: [["shimano", "hg31", "hg41"], ["8v", "8-speed", "8s", "cassette"]],
    products: [
      { name: "Shimano CS-HG31-8", brand: "Shimano", reference: "CS-HG31-8", price: 18, lifeKm: 12000, tier: "budget", note: "Cassette de série Claris" },
      { name: "Shimano CS-HG41-8", brand: "Shimano", reference: "CS-HG41-8", price: 22, lifeKm: 12000, tier: "original", note: "Acier renforcé" },
      { name: "Shimano CS-HG50-8", brand: "Shimano", reference: "CS-HG50-8", price: 30, lifeKm: 15000, tier: "premium", note: "Pignons nickelés, plus durable" },
      { name: "SunRace CSM55 8v", brand: "SunRace", reference: "CSM55", price: 16, lifeKm: 12000, tier: "budget", note: "Alternative éco compatible Shimano 8v" },
    ],
  },

  {
    id: "cassette-shimano-9v",
    compatNote: "Cassette Shimano 9 vitesses (Sora / Alivio)",
    keywords: [["shimano", "hg400"], ["9v", "9-speed", "9s", "cassette"]],
    products: [
      { name: "SunRace CSM99 9v", brand: "SunRace", reference: "CSM99", price: 18, lifeKm: 10000, tier: "budget", note: "Alternative économique compatible Shimano" },
      { name: "Shimano CS-HG400-9", brand: "Shimano", reference: "CS-HG400-9", price: 25, lifeKm: 12000, tier: "original", note: "Cassette de série Sora / Alivio" },
      { name: "Shimano CS-HG50-9", brand: "Shimano", reference: "CS-HG50-9", price: 30, lifeKm: 15000, tier: "premium", note: "Finition supérieure, plus durable" },
    ],
  },

  {
    id: "cassette-shimano-10v",
    compatNote: "Cassette Shimano 10 vitesses (Tiagra / Deore 10v / CUES)",
    keywords: [["shimano", "hg500", "lg400"], ["10v", "10-speed", "10s", "cassette"]],
    products: [
      { name: "SunRace CSMS3 10v", brand: "SunRace", reference: "CSMS3", price: 22, lifeKm: 12000, tier: "budget", note: "Alternative économique compatible Shimano" },
      { name: "Shimano Tiagra CS-HG500-10", brand: "Shimano", reference: "CS-HG500-10", price: 28, lifeKm: 15000, tier: "original", note: "Cassette de série Tiagra" },
      { name: "Shimano Deore CS-M4100-10", brand: "Shimano", reference: "CS-M4100-10", price: 35, lifeKm: 16000, tier: "premium", note: "Large plage, très robuste" },
      { name: "SRAM PG-1050 10v", brand: "SRAM", reference: "PG-1050", price: 35, lifeKm: 14000, tier: "original", note: "10v, compatible corps Shimano/SRAM" },
    ],
  },

  // ── ROTORS DE FREIN À DISQUE ───────────────────────────────

  {
    id: "rotor-disc",
    compatNote: "Rotor de frein à disque — vérifier la fixation (Centerlock / 6 trous) et le diamètre (140/160/180 mm)",
    keywords: [["rotor", "rt-", "centerlock", "disque de frein"]],
    products: [
      { name: "Shimano SM-RT54", brand: "Shimano", reference: "SM-RT54", price: 18, lifeKm: 15000, tier: "budget", note: "Centerlock, usage route/gravel courant" },
      { name: "Shimano SM-RT70", brand: "Shimano", reference: "SM-RT70", price: 30, lifeKm: 18000, tier: "original", note: "Niveau 105/SLX, Ice-Tech" },
      { name: "Shimano RT-MT800", brand: "Shimano", reference: "RT-MT800", price: 45, lifeKm: 20000, tier: "premium", note: "Ice-Tech Freeza, meilleure dissipation thermique" },
      { name: "SRAM Centerline X", brand: "SRAM", reference: "Centerline-X", price: 35, lifeKm: 18000, tier: "original", note: "Centerlock ou 6 trous, rond et silencieux" },
      { name: "Galfer Fixe Disc", brand: "Galfer", price: 30, lifeKm: 18000, tier: "original", note: "Acier inox, bon rapport prix/durée" },
    ],
  },

  // ── PLAQUETTES CAMPAGNOLO ──────────────────────────────────

  {
    id: "brake-disc-campagnolo",
    compatNote: "Plaquettes disque Campagnolo (Ekar / Chorus / Record)",
    keywords: [["campagnolo"], ["plaquette", "frein", "brake", "disc", "disque"]],
    products: [
      { name: "Comprex compatible Campagnolo", brand: "Comprex", price: 10, lifeKm: 2000, tier: "budget", note: "Organique — vérifier la référence de l'étrier" },
      { name: "Campagnolo organiques", brand: "Campagnolo", reference: "DB-310", price: 25, lifeKm: 3000, tier: "original", note: "Plaquettes d'origine, silencieuses" },
      { name: "Campagnolo Race", brand: "Campagnolo", reference: "DB-350", price: 30, lifeKm: 4000, tier: "premium", note: "Composé renforcé, meilleure endurance" },
    ],
  },

  // ── CÂBLES ET GAINES ───────────────────────────────────────

  {
    id: "cable-kit",
    compatNote: "Câbles et gaines de dérailleur / frein",
    keywords: [["câble", "cable", "gaine"]],
    products: [
      { name: "Kit câbles + gaines générique", brand: "Générique", price: 12, lifeKm: 8000, tier: "budget", note: "Kit complet dérailleur ou frein" },
      { name: "Shimano OT-SP41", brand: "Shimano", reference: "OT-SP41", price: 25, lifeKm: 10000, tier: "original", note: "Gaine de référence, glisse optimale" },
      { name: "Jagwire Road Elite", brand: "Jagwire", reference: "Road-Elite", price: 45, lifeKm: 12000, tier: "premium", note: "Câbles polis, gaines compressionless" },
      { name: "Jagwire Sport (kit)", brand: "Jagwire", reference: "Sport-Shop", price: 20, lifeKm: 9000, tier: "original", note: "Kit complet dérailleur/frein, bon rapport qualité/prix" },
      { name: "Shimano OT-RS900", brand: "Shimano", reference: "OT-RS900", price: 35, lifeKm: 11000, tier: "premium", note: "Gaine polymère route, friction minimale" },
    ],
  },

  // ── PNEUS VTT 27,5" ────────────────────────────────────────

  {
    id: "tire-mtb-275",
    compatNote: "Pneu VTT 27,5 pouces (650b)",
    keywords: [["pneu", "tire", "tyre"], ["27.5", "27,5", "650b"]],
    products: [
      { name: "Kenda Booster 27.5", brand: "Kenda", reference: "Booster-275", price: 25, lifeKm: 3000, tier: "budget", note: "Bon compromis XC/trail" },
      { name: "Maxxis Ardent 27.5", brand: "Maxxis", reference: "Ardent-275", price: 40, lifeKm: 4000, tier: "original", note: "Polyvalent trail, roulant" },
      { name: "Maxxis Rekon 27.5", brand: "Maxxis", reference: "Rekon-275", price: 42, lifeKm: 3800, tier: "original", note: "Trail/XC roulant, bon grip polyvalent" },
      { name: "Schwalbe Nobby Nic 27.5", brand: "Schwalbe", reference: "NobbyNic-275", price: 45, lifeKm: 3500, tier: "original", note: "All-mountain polyvalent, sec comme humide" },
      { name: "Maxxis Minion DHF 27.5", brand: "Maxxis", reference: "DHF-275", price: 55, lifeKm: 4500, tier: "premium", note: "Référence enduro, grip maximal" },
    ],
  },
  // ── PLATEAUX ───────────────────────────────────────────────

  {
    id: "chainring-road",
    compatNote: "Plateaux — vérifier le BCD (diamètre de fixation) et le nombre de dents de ton pédalier",
    keywords: [["plateau", "chainring"]],
    products: [
      { name: "Plateau Stronglight compatible", brand: "Stronglight", price: 25, lifeKm: 25000, tier: "budget", note: "Alternative française, vérifier BCD et denture" },
      { name: "Plateaux Shimano 105 FC-R7000", brand: "Shimano", reference: "FC-R7000", price: 50, lifeKm: 30000, tier: "original", note: "Plateaux d'origine 105, denture usinée" },
      { name: "Plateaux Shimano Ultegra FC-R8000", brand: "Shimano", reference: "FC-R8000", price: 80, lifeKm: 35000, tier: "premium", note: "Usinage Hollowglide, passage de chaîne optimisé" },
      { name: "Plateaux SRAM Rival", brand: "SRAM", reference: "Rival-Ring", price: 60, lifeKm: 30000, tier: "original", note: "Plateaux d'origine Rival, denture X-Sync" },
      { name: "Plateau Wolf Tooth 1x", brand: "Wolf Tooth", price: 55, lifeKm: 25000, tier: "premium", note: "Denture Drop-Stop pour montage mono (gravel/VTT)" },
      { name: "Plateaux Praxis", brand: "Praxis", price: 70, lifeKm: 30000, tier: "premium", note: "Usinage à froid, passage de chaîne fluide" },
    ],
  },

  // ── BOÎTIER DE PÉDALIER ────────────────────────────────────

  {
    id: "bottom-bracket",
    compatNote: "Boîtier de pédalier — vérifier le standard du cadre (BSA fileté, Press-Fit, T47…)",
    keywords: [["boîtier", "boitier", "pédalier", "pedalier", "bottom bracket"]],
    products: [
      { name: "Boîtier scellé générique", brand: "Générique", price: 18, lifeKm: 12000, tier: "budget", note: "Roulements scellés standard" },
      { name: "Shimano SM-BBR60", brand: "Shimano", reference: "SM-BBR60", price: 30, lifeKm: 15000, tier: "original", note: "BSA fileté, référence route Shimano" },
      { name: "Boîtier céramique (Kogel / CeramicSpeed entrée)", brand: "Kogel", price: 90, lifeKm: 20000, tier: "premium", note: "Roulements céramique, friction réduite" },
      { name: "SRAM DUB BSA", brand: "SRAM", reference: "DUB-BSA", price: 35, lifeKm: 15000, tier: "original", note: "Filetage BSA, standard DUB" },
      { name: "Boîtier Praxis (Press-Fit)", brand: "Praxis", price: 45, lifeKm: 15000, tier: "original", note: "Roulements de qualité, adaptateurs PF30/BB86" },
      { name: "Boîtier CeramicSpeed", brand: "CeramicSpeed", price: 200, lifeKm: 25000, tier: "premium", note: "Céramique, friction minimale, très durable" },
    ],
  },

  // ── ROULEMENTS DE ROUES ────────────────────────────────────

  {
    id: "wheel-bearings",
    compatNote: "Roulements de moyeux — vérifier la référence gravée sur le roulement (ex : 6803, 6903)",
    keywords: [["roulement", "bearing", "moyeu", "hub"]],
    products: [
      { name: "Jeu de roulements scellés", brand: "Générique", price: 15, lifeKm: 15000, tier: "budget", note: "Roulements standard ABEC-3, pose par tes soins" },
      { name: "Remplacement chez le vélociste", brand: "Prestation", price: 40, lifeKm: 18000, tier: "original", note: "Roulements qualité + pose et réglage" },
      { name: "Roulements Enduro ABEC-5", brand: "Enduro", price: 60, lifeKm: 25000, tier: "premium", note: "Étanchéité renforcée, idéal pluie/hiver" },
      { name: "Roulements SKF étanches", brand: "SKF", price: 45, lifeKm: 22000, tier: "premium", note: "Étanchéité renforcée, référence industrielle" },
    ],
  },

  // ── GALETS DE DÉRAILLEUR ───────────────────────────────────

  {
    id: "jockey-wheels",
    compatNote: "Galets de dérailleur — vérifier le nombre de dents (11/12/14) et le nombre de vitesses",
    keywords: [["galet", "jockey", "pulley"]],
    products: [
      { name: "Galets standard (paire)", brand: "Générique", price: 12, lifeKm: 8000, tier: "budget", note: "Bagues plastique, à vérifier régulièrement" },
      { name: "Galets Shimano d'origine (paire)", brand: "Shimano", price: 20, lifeKm: 10000, tier: "original", note: "Roulements scellés, silencieux" },
      { name: "Galets céramique (paire)", brand: "BBB", price: 60, lifeKm: 15000, tier: "premium", note: "Roulements céramique, friction réduite" },
      { name: "Galets SRAM d'origine (paire)", brand: "SRAM", price: 25, lifeKm: 10000, tier: "original", note: "Roulements scellés, compatibles Eagle/AXS" },
      { name: "Galets Kogel céramique (paire)", brand: "Kogel", price: 90, lifeKm: 18000, tier: "premium", note: "Céramique, roulements haut de gamme, friction réduite" },
    ],
  },

  // ── GUIDOLINE ──────────────────────────────────────────────

  {
    id: "bar-tape",
    compatNote: "Guidoline route / gravel",
    keywords: [["guidoline", "bar tape", "ruban de cintre"]],
    products: [
      { name: "Guidoline EVA basique", brand: "Générique", price: 12, lifeKm: 6000, tier: "budget", note: "Mousse EVA, bon grip" },
      { name: "Lizard Skins DSP 2.5", brand: "Lizard Skins", reference: "DSP-2.5", price: 30, lifeKm: 8000, tier: "original", note: "Référence confort/grip, durable" },
      { name: "Guidoline cuir Brooks", brand: "Brooks", price: 45, lifeKm: 12000, tier: "premium", note: "Cuir, patine avec le temps" },
      { name: "Supacaz Super Sticky Kush", brand: "Supacaz", reference: "SSK", price: 30, lifeKm: 8000, tier: "original", note: "Grip collant, épais, très populaire" },
      { name: "Fizik Tempo Bondcush", brand: "Fizik", reference: "Bondcush", price: 28, lifeKm: 9000, tier: "original", note: "Amorti confort, bonne tenue dans le temps" },
      { name: "Silca Nastro Cuscino", brand: "Silca", price: 45, lifeKm: 12000, tier: "premium", note: "Double couche, confort et durabilité premium" },
    ],
  },
];

// ── Détection automatique ─────────────────────────────────────

// ── Type générique d'une pièce (pour l'affichage en liste) ────
// À partir du nom complet ("Cassette Shimano 105 CS-HG700-11"), renvoie le
// type court ("Cassette"). Sert à afficher le type plutôt que le modèle exact.

export function getComponentType(name: string): string {
  const n = (name ?? "").toLowerCase();
  const rules: [RegExp, string][] = [
    [/plaquette/, "Plaquettes"],
    [/patin/, "Patins"],
    [/rotor|disque de frein/, "Disque"],
    [/cassette/, "Cassette"],
    [/chaîne|chaine|chain/, "Chaîne"],
    [/plateau/, "Plateaux"],
    [/galet|jockey/, "Galets"],
    [/boîtier|boitier|pédalier|pedalier|bottom bracket/, "Boîtier"],
    [/roulement|moyeu|bearing/, "Roulements"],
    [/guidoline|ruban|bar tape/, "Guidoline"],
    [/pneu|tire|tyre/, "Pneus"],
    [/câble|cable|gaine/, "Câble"],
    [/disque|disc/, "Disque"],
  ];
  for (const [re, label] of rules) if (re.test(n)) return label;
  // Format "Type · marque" du formulaire d'ajout
  if (name && name.includes(" · ")) return name.split(" · ")[0].trim();
  return name || "Pièce";
}

// Description courte d'un type de pièce, pour aider les débutants (création vélo).
const COMPONENT_TYPE_DESC: Record<string, string> = {
  "Chaîne": "Transmet ta force à la roue ; la pièce qui s'use le plus vite.",
  "Pneus": "La gomme en contact avec le sol.",
  "Cassette": "Le bloc de pignons à l'arrière qui donne les vitesses.",
  "Plateaux": "Les grandes couronnes dentées du pédalier, à l'avant.",
  "Plaquettes": "Les patins qui serrent le disque (freins à disque).",
  "Disque": "Le rotor de frein fixé à la roue.",
  "Patins": "Les patins de frein sur jante (sans disque).",
  "Câble": "Les câbles et gaines des dérailleurs et freins mécaniques.",
  "Galets": "Les petites roues du dérailleur arrière qui guident la chaîne.",
  "Boîtier": "Les roulements dans lesquels tourne l'axe du pédalier.",
  "Roulements": "Les roulements des moyeux de roue.",
  "Guidoline": "Le ruban enroulé autour du cintre.",
};

// Renvoie une description courte selon le type détecté, ou null si inconnu (pièce libre).
export function getComponentDescription(name: string): string | null {
  return COMPONENT_TYPE_DESC[getComponentType(name)] ?? null;
}

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

// ── Recherche libre dans tout le catalogue (autocomplete) ─────
// Tape "gp 5000", "conti gp", "ultegra chaîne"… → produits correspondants.
// Chaque mot de la requête doit apparaître dans nom + marque + référence.

export type CatalogSuggestion = CatalogProduct & { source: string };

// Liste à plat, dédupliquée (un même produit apparaît dans plusieurs entrées)
let _flatProducts: CatalogSuggestion[] | null = null;
function flatProducts(): CatalogSuggestion[] {
  if (_flatProducts) return _flatProducts;
  const seen = new Set<string>();
  const out: CatalogSuggestion[] = [];
  for (const entry of CATALOG) {
    for (const prod of entry.products) {
      const key = `${prod.brand}|${prod.name}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...prod, source: entry.id });
    }
  }
  _flatProducts = out;
  return out;
}

export function searchCatalog(query: string, limit = 6): CatalogSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const tokens = q.split(/\s+/).filter(Boolean);

  const scored: { p: CatalogSuggestion; score: number }[] = [];
  for (const prod of flatProducts()) {
    const hay = `${prod.brand} ${prod.name} ${prod.reference ?? ""}`.toLowerCase();
    if (!tokens.every((t) => hay.includes(t))) continue;
    // Priorité : nom ou marque commençant par la requête, puis position du 1er mot
    const starts =
      prod.name.toLowerCase().startsWith(q) || prod.brand.toLowerCase().startsWith(q);
    const score = (starts ? 0 : 100) + hay.indexOf(tokens[0]);
    scored.push({ p: prod, score });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((x) => x.p);
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
  templateSpeeds: number,
  templateBikeTypes: string[] = [],
  templateId: string = ""
): CatalogEntry | null {
  const brand = templateBrand.toLowerCase();
  const name = componentName.toLowerCase();
  const cat = componentCategory.toLowerCase();
  const sv = `${templateSpeeds}v`;
  // Route et gravel Shimano utilisent des plaquettes flat-mount (type L/K),
  // pas les plaquettes VTT (M06). Le VTT garde M06.
  const isRoadish = templateBikeTypes.some((t) => t === "route" || t === "gravel");

  const isChain = name.includes("cha") || (cat === "transmission" && (name.includes("chain") || name.includes("kmc") || name.includes("hg")));
  const isCassette = name.includes("cassette") || name.includes("cs-");
  const isDiscBrake = cat === "freinage" && (name.includes("plaquette") || name.includes("disque") || name.includes("disc") || name.includes("m0"));
  const isRimBrake = cat === "freinage" && (name.includes("patin"));
  const isTire = cat === "roues" && (name.includes("pneu") || name.includes("tire") || name.includes("tyre"));

  if (isChain) {
    if (name.includes("flattop")) {
      return CATALOG.find(e => e.id === "chain-sram-axs-road") ?? null;
    }
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
  // "Disque" = le rotor (pas les plaquettes) — prioritaire si pas de "plaquette" dans le nom.
  if (cat === "freinage" && (name.includes("rotor") || (name.includes("disque") && !name.includes("plaquette")))) {
    return CATALOG.find(e => e.id === "rotor-disc") ?? null;
  }
  if (isDiscBrake) {
    // Source de vérité : le groupe détermine le type de plaquette (déterministe).
    if (templateId) {
      const padId = resolvePadCatalogId(templateId);
      if (padId) return CATALOG.find(e => e.id === padId) ?? null;
    }
    // Replis si le groupe est inconnu : route Shimano → type L/K, sinon par marque.
    if (brand === "shimano" && isRoadish) {
      return CATALOG.find(e => e.id === `brake-disc-shimano-road-${sv}`)
        ?? CATALOG.find(e => e.id === "brake-disc-shimano-road-11v")
        ?? CATALOG.find(e => e.id === "brake-disc-shimano")
        ?? null;
    }
    return CATALOG.find(e => e.id === `brake-disc-${brand}`)
      ?? CATALOG.find(e => e.id === "brake-disc-shimano")
      ?? null;
  }
  if (isRimBrake) {
    return CATALOG.find(e => e.id === "brake-rim") ?? null;
  }
  if (isTire) {
    const tireId = templateBikeTypes.includes("vtt")
      ? "tire-mtb-29"
      : templateBikeTypes.includes("gravel")
        ? "tire-gravel"
        : "tire-road-700c";
    return CATALOG.find(e => e.id === tireId) ?? null;
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
