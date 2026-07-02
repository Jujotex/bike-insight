// Templates de composants par groupe vélo
// Utilisé dans le wizard d'onboarding pour pré-remplir les composants

export type TemplateComponent = {
  name: string;
  category: "transmission" | "freinage" | "roues" | "cockpit" | "suspension" | "eclairage" | "autre";
  brand: string;
  purchase_price: number;
  km_max: number;
  note?: string;
};

export type BikeTemplate = {
  id: string;
  label: string;             // ex: "Shimano 105 11v"
  brand: string;             // ex: "Shimano"
  level: string;             // ex: "Milieu de gamme"
  speeds: number;
  bikeTypes: ("route" | "gravel" | "vtt")[];
  components: {
    disc: TemplateComponent[];   // freins à disque
    rim: TemplateComponent[];    // patins (jante)
  };
};

// ── TEMPLATES ─────────────────────────────────────────────────

export const BIKE_TEMPLATES: BikeTemplate[] = [

  // ── SHIMANO ROUTE ────────────────────────────────────────────

  {
    id: "shimano-claris-8v",
    label: "Shimano Claris",
    brand: "Shimano",
    level: "Entrée de gamme",
    speeds: 8,
    bikeTypes: ["route"],
    components: {
      disc: [
        { name: "Chaîne KMC Z8", category: "transmission", brand: "KMC", purchase_price: 12, km_max: 2500 },
        { name: "Cassette Shimano CS-HG31 8v", category: "transmission", brand: "Shimano", purchase_price: 18, km_max: 12000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 18, km_max: 3000, note: "Remplacer par ton modèle" },
        { name: "Plaquettes disque Shimano", category: "freinage", brand: "Shimano", purchase_price: 15, km_max: 2500 },
      ],
      rim: [
        { name: "Chaîne KMC Z8", category: "transmission", brand: "KMC", purchase_price: 12, km_max: 2500 },
        { name: "Cassette Shimano CS-HG31 8v", category: "transmission", brand: "Shimano", purchase_price: 18, km_max: 12000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 18, km_max: 3000, note: "Remplacer par ton modèle" },
        { name: "Patins frein Shimano R50T2", category: "freinage", brand: "Shimano", purchase_price: 10, km_max: 3000 },
      ],
    },
  },

  {
    id: "shimano-sora-9v",
    label: "Shimano Sora",
    brand: "Shimano",
    level: "Entrée de gamme",
    speeds: 9,
    bikeTypes: ["route"],
    components: {
      disc: [
        { name: "Chaîne KMC X9", category: "transmission", brand: "KMC", purchase_price: 14, km_max: 2500 },
        { name: "Cassette Shimano CS-HG400 9v", category: "transmission", brand: "Shimano", purchase_price: 22, km_max: 12000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 22, km_max: 3500 },
        { name: "Plaquettes disque Shimano M04", category: "freinage", brand: "Shimano", purchase_price: 14, km_max: 2500 },
      ],
      rim: [
        { name: "Chaîne KMC X9", category: "transmission", brand: "KMC", purchase_price: 14, km_max: 2500 },
        { name: "Cassette Shimano CS-HG400 9v", category: "transmission", brand: "Shimano", purchase_price: 22, km_max: 12000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 22, km_max: 3500 },
        { name: "Patins frein Shimano R55C3", category: "freinage", brand: "Shimano", purchase_price: 12, km_max: 3500 },
      ],
    },
  },

  {
    id: "shimano-tiagra-10v",
    label: "Shimano Tiagra",
    brand: "Shimano",
    level: "Entrée de gamme",
    speeds: 10,
    bikeTypes: ["route"],
    components: {
      disc: [
        { name: "Chaîne Shimano HG54 10v", category: "transmission", brand: "Shimano", purchase_price: 16, km_max: 3000 },
        { name: "Cassette Shimano Tiagra CS-HG500 10v", category: "transmission", brand: "Shimano", purchase_price: 28, km_max: 15000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 28, km_max: 4000 },
        { name: "Plaquettes disque Shimano M04", category: "freinage", brand: "Shimano", purchase_price: 14, km_max: 2500 },
      ],
      rim: [
        { name: "Chaîne Shimano HG54 10v", category: "transmission", brand: "Shimano", purchase_price: 16, km_max: 3000 },
        { name: "Cassette Shimano Tiagra CS-HG500 10v", category: "transmission", brand: "Shimano", purchase_price: 28, km_max: 15000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 28, km_max: 4000 },
        { name: "Patins frein Shimano R55C4", category: "freinage", brand: "Shimano", purchase_price: 14, km_max: 4000 },
      ],
    },
  },

  {
    id: "shimano-105-11v",
    label: "Shimano 105",
    brand: "Shimano",
    level: "Milieu de gamme",
    speeds: 11,
    bikeTypes: ["route", "gravel"],
    components: {
      disc: [
        { name: "Chaîne Shimano HG601-11", category: "transmission", brand: "Shimano", purchase_price: 28, km_max: 4000, note: "Chaîne de série 105" },
        { name: "Cassette Shimano 105 CS-HG700-11", category: "transmission", brand: "Shimano", purchase_price: 50, km_max: 20000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 40, km_max: 4500, note: "Remplacer par ton modèle exact" },
        { name: "Plaquettes disque Shimano M06", category: "freinage", brand: "Shimano", purchase_price: 18, km_max: 3000 },
      ],
      rim: [
        { name: "Chaîne Shimano HG601-11", category: "transmission", brand: "Shimano", purchase_price: 28, km_max: 4000 },
        { name: "Cassette Shimano 105 CS-HG700-11", category: "transmission", brand: "Shimano", purchase_price: 50, km_max: 20000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 40, km_max: 4500 },
        { name: "Patins frein Shimano R55C4", category: "freinage", brand: "Shimano", purchase_price: 16, km_max: 4000 },
      ],
    },
  },

  {
    id: "shimano-105-12v",
    label: "Shimano 105 Di2 12v",
    brand: "Shimano",
    level: "Milieu de gamme",
    speeds: 12,
    bikeTypes: ["route", "gravel"],
    components: {
      disc: [
        { name: "Chaîne Shimano CN-HG601-12", category: "transmission", brand: "Shimano", purchase_price: 32, km_max: 4000 },
        { name: "Cassette Shimano 105 CS-R7100-12", category: "transmission", brand: "Shimano", purchase_price: 65, km_max: 20000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 50, km_max: 5000 },
        { name: "Plaquettes disque Shimano M06", category: "freinage", brand: "Shimano", purchase_price: 18, km_max: 3000 },
      ],
      rim: [
        { name: "Chaîne Shimano CN-HG601-12", category: "transmission", brand: "Shimano", purchase_price: 32, km_max: 4000 },
        { name: "Cassette Shimano 105 CS-R7100-12", category: "transmission", brand: "Shimano", purchase_price: 65, km_max: 20000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 50, km_max: 5000 },
        { name: "Patins frein Shimano R55C4", category: "freinage", brand: "Shimano", purchase_price: 16, km_max: 4000 },
      ],
    },
  },

  {
    id: "shimano-ultegra-11v",
    label: "Shimano Ultegra",
    brand: "Shimano",
    level: "Haut de gamme",
    speeds: 11,
    bikeTypes: ["route", "gravel"],
    components: {
      disc: [
        { name: "Chaîne Shimano Ultegra HG701-11", category: "transmission", brand: "Shimano", purchase_price: 38, km_max: 4500 },
        { name: "Cassette Shimano Ultegra CS-R8000", category: "transmission", brand: "Shimano", purchase_price: 80, km_max: 25000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 52, km_max: 5000, note: "Continental GP5000 recommandé" },
        { name: "Plaquettes disque Shimano M06", category: "freinage", brand: "Shimano", purchase_price: 20, km_max: 3500 },
      ],
      rim: [
        { name: "Chaîne Shimano Ultegra HG701-11", category: "transmission", brand: "Shimano", purchase_price: 38, km_max: 4500 },
        { name: "Cassette Shimano Ultegra CS-R8000", category: "transmission", brand: "Shimano", purchase_price: 80, km_max: 25000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 52, km_max: 5000 },
        { name: "Patins frein Shimano R55C4", category: "freinage", brand: "Shimano", purchase_price: 16, km_max: 4000 },
      ],
    },
  },

  // ── SRAM ROUTE ───────────────────────────────────────────────

  {
    id: "sram-apex-11v",
    label: "SRAM Apex",
    brand: "SRAM",
    level: "Entrée de gamme",
    speeds: 11,
    bikeTypes: ["route", "gravel"],
    components: {
      disc: [
        { name: "Chaîne SRAM PC-1130", category: "transmission", brand: "SRAM", purchase_price: 25, km_max: 3000 },
        { name: "Cassette SRAM PG-1130 11v", category: "transmission", brand: "SRAM", purchase_price: 30, km_max: 12000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 35, km_max: 4000 },
        { name: "Plaquettes disque SRAM Level", category: "freinage", brand: "SRAM", purchase_price: 20, km_max: 2500 },
      ],
      rim: [
        { name: "Chaîne SRAM PC-1130", category: "transmission", brand: "SRAM", purchase_price: 25, km_max: 3000 },
        { name: "Cassette SRAM PG-1130 11v", category: "transmission", brand: "SRAM", purchase_price: 30, km_max: 12000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 35, km_max: 4000 },
        { name: "Patins frein Swiss Stop Flash", category: "freinage", brand: "Swiss Stop", purchase_price: 16, km_max: 4000 },
      ],
    },
  },

  {
    id: "sram-rival-11v",
    label: "SRAM Rival",
    brand: "SRAM",
    level: "Milieu de gamme",
    speeds: 11,
    bikeTypes: ["route", "gravel"],
    components: {
      disc: [
        { name: "Chaîne SRAM PC-1130", category: "transmission", brand: "SRAM", purchase_price: 28, km_max: 3500 },
        { name: "Cassette SRAM PG-1130 11v", category: "transmission", brand: "SRAM", purchase_price: 35, km_max: 15000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 42, km_max: 4500 },
        { name: "Plaquettes disque SRAM Rival", category: "freinage", brand: "SRAM", purchase_price: 20, km_max: 3000 },
      ],
      rim: [
        { name: "Chaîne SRAM PC-1130", category: "transmission", brand: "SRAM", purchase_price: 28, km_max: 3500 },
        { name: "Cassette SRAM PG-1130 11v", category: "transmission", brand: "SRAM", purchase_price: 35, km_max: 15000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 42, km_max: 4500 },
        { name: "Patins frein Swiss Stop Flash Pro", category: "freinage", brand: "Swiss Stop", purchase_price: 22, km_max: 5000 },
      ],
    },
  },

  {
    id: "sram-force-axs-12v",
    label: "SRAM Force AXS 12v",
    brand: "SRAM",
    level: "Haut de gamme",
    speeds: 12,
    bikeTypes: ["route", "gravel"],
    components: {
      disc: [
        { name: "Chaîne SRAM Force Flattop", category: "transmission", brand: "SRAM", purchase_price: 50, km_max: 4500 },
        { name: "Cassette SRAM Force XG-1270 12v", category: "transmission", brand: "SRAM", purchase_price: 90, km_max: 20000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 55, km_max: 5000 },
        { name: "Plaquettes disque SRAM Force", category: "freinage", brand: "SRAM", purchase_price: 25, km_max: 3500 },
      ],
      rim: [
        { name: "Chaîne SRAM Force Flattop", category: "transmission", brand: "SRAM", purchase_price: 50, km_max: 4500 },
        { name: "Cassette SRAM Force XG-1270 12v", category: "transmission", brand: "SRAM", purchase_price: 90, km_max: 20000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 55, km_max: 5000 },
        { name: "Patins frein Swiss Stop Flash Pro", category: "freinage", brand: "Swiss Stop", purchase_price: 22, km_max: 5000 },
      ],
    },
  },

  // ── SHIMANO VTT ──────────────────────────────────────────────

  {
    id: "shimano-deore-12v",
    label: "Shimano Deore 12v",
    brand: "Shimano",
    level: "Entrée de gamme VTT",
    speeds: 12,
    bikeTypes: ["vtt"],
    components: {
      disc: [
        { name: "Chaîne Shimano Deore CN-M6100", category: "transmission", brand: "Shimano", purchase_price: 32, km_max: 4000 },
        { name: "Cassette Shimano Deore CS-M6100 12v", category: "transmission", brand: "Shimano", purchase_price: 55, km_max: 15000 },
        { name: "Pneus VTT 29\"", category: "roues", brand: "Maxxis", purchase_price: 42, km_max: 4000, note: "Remplacer par ton modèle exact" },
        { name: "Plaquettes disque Shimano M06", category: "freinage", brand: "Shimano", purchase_price: 18, km_max: 2500 },
      ],
      rim: [
        { name: "Chaîne Shimano Deore CN-M6100", category: "transmission", brand: "Shimano", purchase_price: 32, km_max: 4000 },
        { name: "Cassette Shimano Deore CS-M6100 12v", category: "transmission", brand: "Shimano", purchase_price: 55, km_max: 15000 },
        { name: "Pneus VTT 29\"", category: "roues", brand: "Maxxis", purchase_price: 42, km_max: 4000 },
        { name: "Patins frein VTT", category: "freinage", brand: "Shimano", purchase_price: 12, km_max: 3000 },
      ],
    },
  },

  {
    id: "shimano-xt-12v",
    label: "Shimano XT 12v",
    brand: "Shimano",
    level: "Haut de gamme VTT",
    speeds: 12,
    bikeTypes: ["vtt"],
    components: {
      disc: [
        { name: "Chaîne Shimano XT CN-M8100", category: "transmission", brand: "Shimano", purchase_price: 48, km_max: 5000 },
        { name: "Cassette Shimano XT CS-M8100 12v", category: "transmission", brand: "Shimano", purchase_price: 90, km_max: 25000 },
        { name: "Pneus VTT 29\"", category: "roues", brand: "Maxxis", purchase_price: 55, km_max: 4500 },
        { name: "Plaquettes disque Shimano M07 métal", category: "freinage", brand: "Shimano", purchase_price: 24, km_max: 5000 },
      ],
      rim: [
        { name: "Chaîne Shimano XT CN-M8100", category: "transmission", brand: "Shimano", purchase_price: 48, km_max: 5000 },
        { name: "Cassette Shimano XT CS-M8100 12v", category: "transmission", brand: "Shimano", purchase_price: 90, km_max: 25000 },
        { name: "Pneus VTT 29\"", category: "roues", brand: "Maxxis", purchase_price: 55, km_max: 4500 },
        { name: "Patins frein VTT XT", category: "freinage", brand: "Shimano", purchase_price: 15, km_max: 3500 },
      ],
    },
  },

  // ── SRAM VTT ────────────────────────────────────────────────

  {
    id: "sram-nx-eagle-12v",
    label: "SRAM NX Eagle 12v",
    brand: "SRAM",
    level: "Entrée de gamme VTT",
    speeds: 12,
    bikeTypes: ["vtt"],
    components: {
      disc: [
        { name: "Chaîne SRAM PC-1130", category: "transmission", brand: "SRAM", purchase_price: 28, km_max: 3500 },
        { name: "Cassette SRAM NX Eagle PG-1230", category: "transmission", brand: "SRAM", purchase_price: 50, km_max: 15000 },
        { name: "Pneus VTT 29\"", category: "roues", brand: "Maxxis", purchase_price: 38, km_max: 3500 },
        { name: "Plaquettes disque SRAM Guide", category: "freinage", brand: "SRAM", purchase_price: 20, km_max: 2500 },
      ],
      rim: [
        { name: "Chaîne SRAM PC-1130", category: "transmission", brand: "SRAM", purchase_price: 28, km_max: 3500 },
        { name: "Cassette SRAM NX Eagle PG-1230", category: "transmission", brand: "SRAM", purchase_price: 50, km_max: 15000 },
        { name: "Pneus VTT 29\"", category: "roues", brand: "Maxxis", purchase_price: 38, km_max: 3500 },
        { name: "Patins frein VTT", category: "freinage", brand: "Shimano", purchase_price: 12, km_max: 3000 },
      ],
    },
  },

  {
    id: "sram-gx-eagle-12v",
    label: "SRAM GX Eagle 12v",
    brand: "SRAM",
    level: "Milieu de gamme VTT",
    speeds: 12,
    bikeTypes: ["vtt"],
    components: {
      disc: [
        { name: "Chaîne SRAM GX Eagle", category: "transmission", brand: "SRAM", purchase_price: 55, km_max: 5000 },
        { name: "Cassette SRAM GX Eagle PG-1275", category: "transmission", brand: "SRAM", purchase_price: 85, km_max: 20000 },
        { name: "Pneus VTT 29\"", category: "roues", brand: "Maxxis", purchase_price: 50, km_max: 4000 },
        { name: "Plaquettes disque SRAM Guide métal", category: "freinage", brand: "SRAM", purchase_price: 25, km_max: 4500 },
      ],
      rim: [
        { name: "Chaîne SRAM GX Eagle", category: "transmission", brand: "SRAM", purchase_price: 55, km_max: 5000 },
        { name: "Cassette SRAM GX Eagle PG-1275", category: "transmission", brand: "SRAM", purchase_price: 85, km_max: 20000 },
        { name: "Pneus VTT 29\"", category: "roues", brand: "Maxxis", purchase_price: 50, km_max: 4000 },
        { name: "Patins frein VTT", category: "freinage", brand: "Shimano", purchase_price: 12, km_max: 3000 },
      ],
    },
  },

  // ── GRAVEL DÉDIÉ ─────────────────────────────────────────────

  {
    id: "shimano-grx-11v",
    label: "Shimano GRX 11v",
    brand: "Shimano",
    level: "Gravel milieu de gamme",
    speeds: 11,
    bikeTypes: ["gravel"],
    components: {
      disc: [
        { name: "Chaîne Shimano GRX HG601-11", category: "transmission", brand: "Shimano", purchase_price: 28, km_max: 4000 },
        { name: "Cassette Shimano GRX CS-HG700-11", category: "transmission", brand: "Shimano", purchase_price: 55, km_max: 20000 },
        { name: "Pneus gravel 700c", category: "roues", brand: "Panaracer", purchase_price: 42, km_max: 5000, note: "Panaracer GravelKing recommandé" },
        { name: "Plaquettes disque Shimano M06", category: "freinage", brand: "Shimano", purchase_price: 18, km_max: 3000 },
      ],
      rim: [
        { name: "Chaîne Shimano GRX HG601-11", category: "transmission", brand: "Shimano", purchase_price: 28, km_max: 4000 },
        { name: "Cassette Shimano GRX CS-HG700-11", category: "transmission", brand: "Shimano", purchase_price: 55, km_max: 20000 },
        { name: "Pneus gravel 700c", category: "roues", brand: "Panaracer", purchase_price: 42, km_max: 5000 },
        { name: "Patins frein Shimano R55C4", category: "freinage", brand: "Shimano", purchase_price: 16, km_max: 4000 },
      ],
    },
  },

  {
    id: "sram-rival-axs-gravel",
    label: "SRAM Rival AXS 12v Gravel",
    brand: "SRAM",
    level: "Gravel haut de gamme",
    speeds: 12,
    bikeTypes: ["gravel"],
    components: {
      disc: [
        { name: "Chaîne SRAM Rival Flattop", category: "transmission", brand: "SRAM", purchase_price: 42, km_max: 4000 },
        { name: "Cassette SRAM Rival XG-1250 12v", category: "transmission", brand: "SRAM", purchase_price: 75, km_max: 18000 },
        { name: "Pneus gravel 700c", category: "roues", brand: "Pirelli", purchase_price: 55, km_max: 6000, note: "Pirelli Cinturato Gravel recommandé" },
        { name: "Plaquettes disque SRAM Rival", category: "freinage", brand: "SRAM", purchase_price: 22, km_max: 3000 },
      ],
      rim: [
        { name: "Chaîne SRAM Rival Flattop", category: "transmission", brand: "SRAM", purchase_price: 42, km_max: 4000 },
        { name: "Cassette SRAM Rival XG-1250 12v", category: "transmission", brand: "SRAM", purchase_price: 75, km_max: 18000 },
        { name: "Pneus gravel 700c", category: "roues", brand: "Pirelli", purchase_price: 55, km_max: 6000 },
        { name: "Patins frein Swiss Stop Flash Pro", category: "freinage", brand: "Swiss Stop", purchase_price: 22, km_max: 5000 },
      ],
    },
  },
  // ── SHIMANO ROUTE 12V ────────────────────────────────────────

  {
    id: "shimano-105-12v-meca",
    label: "Shimano 105 12v Mécanique",
    brand: "Shimano",
    level: "Milieu de gamme · 12v",
    speeds: 12,
    bikeTypes: ["route", "gravel"],
    components: {
      disc: [
        { name: "Chaîne Shimano CN-M6100 12v", category: "transmission", brand: "Shimano", purchase_price: 30, km_max: 4000 },
        { name: "Cassette Shimano 105 CS-R7101-12", category: "transmission", brand: "Shimano", purchase_price: 60, km_max: 20000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 45, km_max: 4500 },
        { name: "Plaquettes disque Shimano M06", category: "freinage", brand: "Shimano", purchase_price: 18, km_max: 3000 },
      ],
      rim: [
        { name: "Chaîne Shimano CN-M6100 12v", category: "transmission", brand: "Shimano", purchase_price: 30, km_max: 4000 },
        { name: "Cassette Shimano 105 CS-R7101-12", category: "transmission", brand: "Shimano", purchase_price: 60, km_max: 20000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 45, km_max: 4500 },
        { name: "Patins frein Shimano R55C4", category: "freinage", brand: "Shimano", purchase_price: 16, km_max: 4000 },
      ],
    },
  },

  {
    id: "shimano-ultegra-di2-12v",
    label: "Shimano Ultegra Di2 12v",
    brand: "Shimano",
    level: "Haut de gamme · électronique",
    speeds: 12,
    bikeTypes: ["route", "gravel"],
    components: {
      disc: [
        { name: "Chaîne Shimano CN-M8100 12v", category: "transmission", brand: "Shimano", purchase_price: 45, km_max: 5000 },
        { name: "Cassette Shimano Ultegra CS-R8101-12", category: "transmission", brand: "Shimano", purchase_price: 110, km_max: 25000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 55, km_max: 5000, note: "Continental GP5000 recommandé" },
        { name: "Plaquettes disque Shimano M06", category: "freinage", brand: "Shimano", purchase_price: 20, km_max: 3500 },
      ],
      rim: [
        { name: "Chaîne Shimano CN-M8100 12v", category: "transmission", brand: "Shimano", purchase_price: 45, km_max: 5000 },
        { name: "Cassette Shimano Ultegra CS-R8101-12", category: "transmission", brand: "Shimano", purchase_price: 110, km_max: 25000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 55, km_max: 5000 },
        { name: "Patins frein Shimano R55C4", category: "freinage", brand: "Shimano", purchase_price: 16, km_max: 4000 },
      ],
    },
  },

  {
    id: "shimano-dura-ace-12v",
    label: "Shimano Dura-Ace Di2 12v",
    brand: "Shimano",
    level: "Compétition · électronique",
    speeds: 12,
    bikeTypes: ["route"],
    components: {
      disc: [
        { name: "Chaîne Shimano Dura-Ace CN-M9100", category: "transmission", brand: "Shimano", purchase_price: 60, km_max: 5000 },
        { name: "Cassette Shimano Dura-Ace CS-R9200-12", category: "transmission", brand: "Shimano", purchase_price: 380, km_max: 25000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 65, km_max: 5000, note: "GP5000 S TR recommandé" },
        { name: "Plaquettes disque Shimano K05S-RX", category: "freinage", brand: "Shimano", purchase_price: 25, km_max: 3500 },
      ],
      rim: [
        { name: "Chaîne Shimano Dura-Ace CN-M9100", category: "transmission", brand: "Shimano", purchase_price: 60, km_max: 5000 },
        { name: "Cassette Shimano Dura-Ace CS-R9200-12", category: "transmission", brand: "Shimano", purchase_price: 380, km_max: 25000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 65, km_max: 5000 },
        { name: "Patins frein Shimano Dura-Ace R55C4-A", category: "freinage", brand: "Shimano", purchase_price: 20, km_max: 4000 },
      ],
    },
  },

  // ── SRAM ROUTE AXS ───────────────────────────────────────────

  {
    id: "sram-red-axs-12v",
    label: "SRAM Red AXS 12v",
    brand: "SRAM",
    level: "Compétition · électronique",
    speeds: 12,
    bikeTypes: ["route"],
    components: {
      disc: [
        { name: "Chaîne SRAM Red Flattop", category: "transmission", brand: "SRAM", purchase_price: 75, km_max: 5000 },
        { name: "Cassette SRAM Red XG-1290 12v", category: "transmission", brand: "SRAM", purchase_price: 260, km_max: 22000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 60, km_max: 5000 },
        { name: "Plaquettes disque SRAM Red", category: "freinage", brand: "SRAM", purchase_price: 25, km_max: 3500 },
      ],
      rim: [
        { name: "Chaîne SRAM Red Flattop", category: "transmission", brand: "SRAM", purchase_price: 75, km_max: 5000 },
        { name: "Cassette SRAM Red XG-1290 12v", category: "transmission", brand: "SRAM", purchase_price: 260, km_max: 22000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 60, km_max: 5000 },
        { name: "Patins frein Swiss Stop Flash Pro", category: "freinage", brand: "Swiss Stop", purchase_price: 22, km_max: 5000 },
      ],
    },
  },

  {
    id: "sram-apex-axs-12v",
    label: "SRAM Apex AXS 12v",
    brand: "SRAM",
    level: "Entrée de gamme · électronique",
    speeds: 12,
    bikeTypes: ["route", "gravel"],
    components: {
      disc: [
        { name: "Chaîne SRAM Apex Flattop", category: "transmission", brand: "SRAM", purchase_price: 35, km_max: 4000 },
        { name: "Cassette SRAM Apex XPLR PG-1231", category: "transmission", brand: "SRAM", purchase_price: 65, km_max: 15000 },
        { name: "Pneus gravel 700c", category: "roues", brand: "Panaracer", purchase_price: 42, km_max: 5000 },
        { name: "Plaquettes disque SRAM Rival", category: "freinage", brand: "SRAM", purchase_price: 22, km_max: 3000 },
      ],
      rim: [
        { name: "Chaîne SRAM Apex Flattop", category: "transmission", brand: "SRAM", purchase_price: 35, km_max: 4000 },
        { name: "Cassette SRAM Apex XPLR PG-1231", category: "transmission", brand: "SRAM", purchase_price: 65, km_max: 15000 },
        { name: "Pneus gravel 700c", category: "roues", brand: "Panaracer", purchase_price: 42, km_max: 5000 },
        { name: "Patins frein Swiss Stop Flash", category: "freinage", brand: "Swiss Stop", purchase_price: 16, km_max: 4000 },
      ],
    },
  },

  // ── CAMPAGNOLO ───────────────────────────────────────────────

  {
    id: "campagnolo-chorus-12v",
    label: "Campagnolo Chorus 12v",
    brand: "Campagnolo",
    level: "Haut de gamme",
    speeds: 12,
    bikeTypes: ["route"],
    components: {
      disc: [
        { name: "Chaîne Campagnolo C12", category: "transmission", brand: "Campagnolo", purchase_price: 55, km_max: 4500 },
        { name: "Cassette Campagnolo Chorus 12v", category: "transmission", brand: "Campagnolo", purchase_price: 165, km_max: 20000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 55, km_max: 5000 },
        { name: "Plaquettes disque Campagnolo", category: "freinage", brand: "Campagnolo", purchase_price: 25, km_max: 3000 },
      ],
      rim: [
        { name: "Chaîne Campagnolo C12", category: "transmission", brand: "Campagnolo", purchase_price: 55, km_max: 4500 },
        { name: "Cassette Campagnolo Chorus 12v", category: "transmission", brand: "Campagnolo", purchase_price: 165, km_max: 20000 },
        { name: "Pneus route 700c", category: "roues", brand: "Continental", purchase_price: 55, km_max: 5000 },
        { name: "Patins frein Campagnolo", category: "freinage", brand: "Campagnolo", purchase_price: 20, km_max: 4000 },
      ],
    },
  },

  {
    id: "campagnolo-ekar-13v",
    label: "Campagnolo Ekar 13v",
    brand: "Campagnolo",
    level: "Gravel haut de gamme",
    speeds: 13,
    bikeTypes: ["gravel"],
    components: {
      disc: [
        { name: "Chaîne Campagnolo Ekar C13", category: "transmission", brand: "Campagnolo", purchase_price: 62, km_max: 4500 },
        { name: "Cassette Campagnolo Ekar 13v", category: "transmission", brand: "Campagnolo", purchase_price: 190, km_max: 18000 },
        { name: "Pneus gravel 700c", category: "roues", brand: "Pirelli", purchase_price: 55, km_max: 6000 },
        { name: "Plaquettes disque Campagnolo", category: "freinage", brand: "Campagnolo", purchase_price: 25, km_max: 3000 },
      ],
      rim: [
        { name: "Chaîne Campagnolo Ekar C13", category: "transmission", brand: "Campagnolo", purchase_price: 62, km_max: 4500 },
        { name: "Cassette Campagnolo Ekar 13v", category: "transmission", brand: "Campagnolo", purchase_price: 190, km_max: 18000 },
        { name: "Pneus gravel 700c", category: "roues", brand: "Pirelli", purchase_price: 55, km_max: 6000 },
        { name: "Patins frein Campagnolo", category: "freinage", brand: "Campagnolo", purchase_price: 20, km_max: 4000 },
      ],
    },
  },

  // ── VTT SUPPLÉMENTAIRES ──────────────────────────────────────

  {
    id: "shimano-slx-12v",
    label: "Shimano SLX 12v",
    brand: "Shimano",
    level: "Milieu de gamme VTT",
    speeds: 12,
    bikeTypes: ["vtt"],
    components: {
      disc: [
        { name: "Chaîne Shimano SLX CN-M7100", category: "transmission", brand: "Shimano", purchase_price: 38, km_max: 4500 },
        { name: "Cassette Shimano SLX CS-M7100 12v", category: "transmission", brand: "Shimano", purchase_price: 65, km_max: 18000 },
        { name: "Pneus VTT 29\"", category: "roues", brand: "Maxxis", purchase_price: 48, km_max: 4000 },
        { name: "Plaquettes disque Shimano M06", category: "freinage", brand: "Shimano", purchase_price: 18, km_max: 3000 },
      ],
      rim: [
        { name: "Chaîne Shimano SLX CN-M7100", category: "transmission", brand: "Shimano", purchase_price: 38, km_max: 4500 },
        { name: "Cassette Shimano SLX CS-M7100 12v", category: "transmission", brand: "Shimano", purchase_price: 65, km_max: 18000 },
        { name: "Pneus VTT 29\"", category: "roues", brand: "Maxxis", purchase_price: 48, km_max: 4000 },
        { name: "Patins frein VTT", category: "freinage", brand: "Shimano", purchase_price: 12, km_max: 3000 },
      ],
    },
  },

  {
    id: "sram-x01-eagle-12v",
    label: "SRAM X01 Eagle 12v",
    brand: "SRAM",
    level: "Haut de gamme VTT",
    speeds: 12,
    bikeTypes: ["vtt"],
    components: {
      disc: [
        { name: "Chaîne SRAM X01 Eagle", category: "transmission", brand: "SRAM", purchase_price: 70, km_max: 5500 },
        { name: "Cassette SRAM X01 Eagle XG-1295", category: "transmission", brand: "SRAM", purchase_price: 220, km_max: 25000 },
        { name: "Pneus VTT 29\"", category: "roues", brand: "Maxxis", purchase_price: 55, km_max: 4500 },
        { name: "Plaquettes disque SRAM Guide métal", category: "freinage", brand: "SRAM", purchase_price: 25, km_max: 4500 },
      ],
      rim: [
        { name: "Chaîne SRAM X01 Eagle", category: "transmission", brand: "SRAM", purchase_price: 70, km_max: 5500 },
        { name: "Cassette SRAM X01 Eagle XG-1295", category: "transmission", brand: "SRAM", purchase_price: 220, km_max: 25000 },
        { name: "Pneus VTT 29\"", category: "roues", brand: "Maxxis", purchase_price: 55, km_max: 4500 },
        { name: "Patins frein VTT", category: "freinage", brand: "Shimano", purchase_price: 12, km_max: 3000 },
      ],
    },
  },

  // ── URBAIN / TREKKING ────────────────────────────────────────

  {
    id: "shimano-cues-10v",
    label: "Shimano CUES 10v",
    brand: "Shimano",
    level: "Urbain / Trekking · LinkGlide",
    speeds: 10,
    bikeTypes: ["gravel", "vtt"],
    components: {
      disc: [
        { name: "Chaîne Shimano LinkGlide CN-LG500", category: "transmission", brand: "Shimano", purchase_price: 20, km_max: 5000, note: "LinkGlide : durabilité renforcée" },
        { name: "Cassette Shimano LinkGlide CS-LG400 10v", category: "transmission", brand: "Shimano", purchase_price: 40, km_max: 20000 },
        { name: "Pneus 700c / 29\"", category: "roues", brand: "Schwalbe", purchase_price: 30, km_max: 4000 },
        { name: "Plaquettes disque Shimano M05", category: "freinage", brand: "Shimano", purchase_price: 14, km_max: 2500 },
      ],
      rim: [
        { name: "Chaîne Shimano LinkGlide CN-LG500", category: "transmission", brand: "Shimano", purchase_price: 20, km_max: 5000 },
        { name: "Cassette Shimano LinkGlide CS-LG400 10v", category: "transmission", brand: "Shimano", purchase_price: 40, km_max: 20000 },
        { name: "Pneus 700c / 29\"", category: "roues", brand: "Schwalbe", purchase_price: 30, km_max: 4000 },
        { name: "Patins frein V-Brake", category: "freinage", brand: "Shimano", purchase_price: 10, km_max: 3000 },
      ],
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────

export const BIKE_TYPE_LABELS = {
  route: "Route",
  gravel: "Gravel",
  vtt: "VTT",
};

export function getTemplatesForType(bikeType: "route" | "gravel" | "vtt"): BikeTemplate[] {
  return BIKE_TEMPLATES.filter(t => t.bikeTypes.includes(bikeType));
}
