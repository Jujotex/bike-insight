// Guides de réparation par type de pièce : « le fais moi-même » (lien tuto public)
// ou « je passe chez le vélociste » (fourchette main-d'œuvre indicative).
// Données 100 % statiques, aucune donnée maison, à visée indicative.
//
// Le temps (timeMin/timeMax, minutes) et les outils (tools) sont des ordres de
// grandeur pour aider à l'arbitrage DIY vs vélociste — pas un pas-à-pas maison.
//
// Sources (validées juillet 2026) :
// - Tutos publics réputés fr : Alltricks (pages « surl » maintenues) et Probikeshop.
// - Fourchettes main-d'œuvre : ordres de grandeur ateliers fr (hors pièces),
//   ex. grille Autour du Cycle 2025 (chaîne 10€, cassette 12€, plateaux 22€,
//   plaquettes 12€/étrier, pneu/chambre 15€…), élargis pour tenir compte
//   des écarts régionaux, du routage interne et disque vs patins.
//   → Ce sont des estimations, pas des devis.

export type RepairDifficulty = "facile" | "moyen" | "expert";

export type RepairGuide = {
  id: string;
  operation: string;        // ex. « Remplacer la chaîne »
  difficulty: RepairDifficulty;
  tutorialUrl: string;      // tuto public réputé (fr)
  tutorialSource: string;   // nom de la source, ex. « Alltricks »
  laborMin: number;         // main-d'œuvre atelier indicative, hors pièces (€)
  laborMax: number;
  timeMin: number;          // temps DIY indicatif (minutes)
  timeMax: number;
  tools: string[];          // outils indicatifs pour le faire soi-même
};

// Libellés et descriptions courtes des niveaux de difficulté (réutilisés
// par la carte « Et maintenant ? » et le hub tuto).
export const DIFFICULTY_LABELS: Record<RepairDifficulty, string> = {
  facile: "Facile",
  moyen: "Intermédiaire",
  expert: "Expert",
};

export const DIFFICULTY_DESC: Record<RepairDifficulty, string> = {
  facile: "Faisable en autonomie avec des outils de base.",
  moyen: "Quelques outils spécifiques et un peu de méthode.",
  expert: "Réglages précis — mieux vaut être équipé et expérimenté.",
};

// Niveau (1–3) pour une jauge visuelle, et couleur de statut associée.
export const DIFFICULTY_LEVEL: Record<RepairDifficulty, number> = {
  facile: 1,
  moyen: 2,
  expert: 3,
};

export const DIFFICULTY_COLOR: Record<RepairDifficulty, string> = {
  facile: "var(--bi-ok)",
  moyen: "var(--bi-warn)",
  expert: "var(--bi-bad)",
};

// Formate une fourchette de temps indicative en texte court.
export function formatRepairTime(min: number, max: number): string {
  if (max < 60) return `${min}–${max} min`;
  const h = (m: number) => (m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60}`);
  return `${min < 60 ? min + " min" : h(min)}–${h(max)}`;
}

// Entrée interne : le guide + les mots-clés qui le déclenchent.
// `names` matche le nom de la pièce, `categories` sert de repli par catégorie.
type GuideEntry = {
  guide: RepairGuide;
  names: string[];
  categories?: string[];
};

// Hub tutoriels générique (repli) — page durable listant les tutos d'atelier.
const HUB_URL = "https://www.alltricks.fr/surl/entretienreparation";

// Ordre = priorité : d'abord les pièces précises (match sur le nom),
// puis les replis par catégorie, puis un repli générique en dernier.
const GUIDE_ENTRIES: GuideEntry[] = [
  {
    names: ["chaine", "chaîne"],
    guide: {
      id: "chaine",
      operation: "Remplacer la chaîne",
      difficulty: "facile",
      tutorialUrl: "https://www.alltricks.fr/surl/chaine_v2",
      tutorialSource: "Alltricks",
      laborMin: 10,
      laborMax: 20,
      timeMin: 15,
      timeMax: 30,
      tools: ["Dérive-chaîne", "Pince à maillon rapide"],
    },
  },
  {
    names: ["cassette", "roue libre", "pignon"],
    guide: {
      id: "cassette",
      operation: "Remplacer la cassette",
      difficulty: "moyen",
      tutorialUrl: "https://www.alltricks.fr/surl/comment-remplacer-sa-cassette",
      tutorialSource: "Alltricks",
      laborMin: 12,
      laborMax: 25,
      timeMin: 15,
      timeMax: 25,
      tools: ["Fouet à chaîne", "Démonte-cassette", "Clé plate"],
    },
  },
  {
    names: ["plateau", "pedalier", "pédalier"],
    guide: {
      id: "plateaux",
      operation: "Remplacer les plateaux",
      difficulty: "expert",
      tutorialUrl: HUB_URL,
      tutorialSource: "Alltricks",
      laborMin: 22,
      laborMax: 45,
      timeMin: 30,
      timeMax: 60,
      tools: ["Jeu de clés Allen", "Clé démonte-manivelle"],
    },
  },
  {
    names: ["pneu", "boyau"],
    guide: {
      id: "pneus",
      operation: "Monter le pneu",
      difficulty: "facile",
      tutorialUrl: "https://probikeshop.fr/pages/monter-pneus-velo-route",
      tutorialSource: "Probikeshop",
      laborMin: 12,
      laborMax: 25,
      timeMin: 10,
      timeMax: 20,
      tools: ["Démonte-pneus", "Pompe"],
    },
  },
  {
    names: ["plaquette"],
    guide: {
      id: "plaquettes",
      operation: "Remplacer les plaquettes",
      difficulty: "moyen",
      tutorialUrl: "https://www.alltricks.fr/surl/freinsadisqueschangersesplaquettes_v2",
      tutorialSource: "Alltricks",
      laborMin: 12,
      laborMax: 25,
      timeMin: 15,
      timeMax: 30,
      tools: ["Jeu de clés Allen", "Repousse-piston"],
    },
  },
  {
    names: ["disque", "rotor", "patin"],
    guide: {
      id: "disque",
      operation: "Remplacer le disque",
      difficulty: "moyen",
      tutorialUrl: HUB_URL,
      tutorialSource: "Alltricks",
      laborMin: 10,
      laborMax: 20,
      timeMin: 15,
      timeMax: 25,
      tools: ["Clé Torx ou Allen", "Clé pour écrou Center-Lock"],
    },
  },
  {
    names: ["cable", "câble", "gaine"],
    guide: {
      id: "cable",
      operation: "Changer le câble et la gaine",
      difficulty: "moyen",
      tutorialUrl: HUB_URL,
      tutorialSource: "Alltricks",
      laborMin: 12,
      laborMax: 25,
      timeMin: 20,
      timeMax: 40,
      tools: ["Pince coupe-câble", "Jeu de clés Allen"],
    },
  },

  // ── Replis par catégorie (si le nom ne matche aucune pièce précise) ──
  {
    names: [],
    categories: ["transmission"],
    guide: {
      id: "cat-transmission",
      operation: "Intervenir sur la transmission",
      difficulty: "moyen",
      tutorialUrl: HUB_URL,
      tutorialSource: "Alltricks",
      laborMin: 12,
      laborMax: 35,
      timeMin: 20,
      timeMax: 45,
      tools: ["Jeu de clés Allen", "Dérive-chaîne"],
    },
  },
  {
    names: [],
    categories: ["freinage"],
    guide: {
      id: "cat-freinage",
      operation: "Intervenir sur le freinage",
      difficulty: "moyen",
      tutorialUrl: HUB_URL,
      tutorialSource: "Alltricks",
      laborMin: 12,
      laborMax: 30,
      timeMin: 20,
      timeMax: 40,
      tools: ["Jeu de clés Allen", "Clé Torx"],
    },
  },
  {
    names: [],
    categories: ["roues"],
    guide: {
      id: "cat-roues",
      operation: "Intervenir sur la roue",
      difficulty: "facile",
      tutorialUrl: HUB_URL,
      tutorialSource: "Alltricks",
      laborMin: 12,
      laborMax: 25,
      timeMin: 10,
      timeMax: 25,
      tools: ["Démonte-pneus", "Pompe"],
    },
  },
  {
    names: [],
    categories: ["cockpit"],
    guide: {
      id: "cat-cockpit",
      operation: "Intervenir sur le cockpit",
      difficulty: "moyen",
      tutorialUrl: HUB_URL,
      tutorialSource: "Alltricks",
      laborMin: 12,
      laborMax: 25,
      timeMin: 15,
      timeMax: 30,
      tools: ["Jeu de clés Allen", "Clé dynamométrique"],
    },
  },
];

// Repli final : toujours renvoyer quelque chose d'utile.
const GENERIC_GUIDE: RepairGuide = {
  id: "generique",
  operation: "Faire intervenir un vélociste",
  difficulty: "moyen",
  tutorialUrl: HUB_URL,
  tutorialSource: "Alltricks",
  laborMin: 15,
  laborMax: 40,
  timeMin: 20,
  timeMax: 45,
  tools: ["Outils de base"],
};

// Renvoie le guide le plus pertinent pour une pièce. Ne renvoie jamais null :
// à défaut de correspondance précise ou par catégorie, un guide générique.
export function findRepairGuide(
  componentName: string,
  componentCategory: string
): RepairGuide {
  const name = componentName.toLowerCase();
  const category = componentCategory.toLowerCase();

  // 1) Match précis sur le nom de la pièce.
  for (const entry of GUIDE_ENTRIES) {
    if (entry.names.some((kw) => name.includes(kw))) return entry.guide;
  }
  // 2) Repli par catégorie.
  for (const entry of GUIDE_ENTRIES) {
    if (entry.categories?.some((c) => category.includes(c))) return entry.guide;
  }
  // 3) Repli générique.
  return GENERIC_GUIDE;
}
