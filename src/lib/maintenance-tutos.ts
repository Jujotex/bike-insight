// Tutos d'entretien (le « je le fais moi-même ») par type d'entretien.
// Calqué sur repair-guides.ts (pièces) : difficulté, temps DIY indicatif et un
// lien vers un tuto public réputé. Liens Alltricks « surl » (redirections
// maintenues) — vérifiés en juillet 2026.
//
// Clé = slug du type d'entretien (maintenance_types.slug). Les types
// personnalisés (custom-…) n'ont pas de tuto dédié → findMaintenanceTuto renvoie null.

import type { RepairDifficulty } from "./repair-guides";

export type MaintenanceTuto = {
  difficulty: RepairDifficulty;
  timeMin: number;          // temps DIY indicatif (minutes) — 0 = plutôt atelier
  timeMax: number;
  tutorialUrl: string;
  tutorialSource: string;
  shopOnly?: boolean;       // plutôt une prestation atelier qu'un vrai DIY
};

const HUB_URL = "https://www.alltricks.fr/surl/entretienreparation";

const TUTOS: Record<string, MaintenanceTuto> = {
  "lubrification-chaine": {
    difficulty: "facile", timeMin: 5, timeMax: 10,
    tutorialUrl: "https://www.alltricks.fr/surl/entretien-transmission-velo",
    tutorialSource: "Alltricks",
  },
  "nettoyage-transmission": {
    difficulty: "facile", timeMin: 20, timeMax: 40,
    tutorialUrl: "https://www.alltricks.fr/surl/entretien-transmission-velo",
    tutorialSource: "Alltricks",
  },
  "purge-freins": {
    difficulty: "expert", timeMin: 30, timeMax: 45,
    tutorialUrl: "https://www.alltricks.fr/surl/freinsadisquespurgersesfreins_v2",
    tutorialSource: "Alltricks",
  },
  "preventif-tubeless": {
    difficulty: "moyen", timeMin: 15, timeMax: 25,
    tutorialUrl: "https://www.alltricks.fr/surl/comment-passer-roue-en-tubeless",
    tutorialSource: "Alltricks",
  },
  "controle-serrages": {
    difficulty: "facile", timeMin: 10, timeMax: 20,
    tutorialUrl: "https://www.alltricks.fr/surl/verifications_v2",
    tutorialSource: "Alltricks",
  },
  "entretien-suspension": {
    difficulty: "expert", timeMin: 60, timeMax: 120,
    tutorialUrl: HUB_URL,
    tutorialSource: "Alltricks",
    shopOnly: true,
  },
  "revision-complete": {
    difficulty: "expert", timeMin: 0, timeMax: 0,
    tutorialUrl: HUB_URL,
    tutorialSource: "Alltricks",
    shopOnly: true,
  },
};

// Renvoie le tuto d'un entretien à partir de son slug, ou null si aucun tuto dédié.
export function findMaintenanceTuto(slug: string): MaintenanceTuto | null {
  return TUTOS[slug] ?? null;
}
