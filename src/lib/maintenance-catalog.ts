// Catalogue des entretiens courants + calcul des échéances
// Un entretien est rattaché au vélo (pas à un composant) et enregistré
// dans maintenance_logs avec maintenance_type + bike_id.

export type MaintenanceDef = {
  id: string;
  label: string;
  sub: string;             // aide en langage simple
  intervalKm?: number;     // intervalle recommandé en km
  intervalMonths?: number; // et/ou en mois — la première échéance atteinte prime
  vttOnly?: boolean;       // uniquement pertinent pour un VTT
  discOnly?: boolean;      // uniquement freins à disque hydrauliques
  defaultCost?: number;    // coût indicatif si fait chez un vélociste (€)
};

export const MAINTENANCE_TYPES: MaintenanceDef[] = [
  {
    id: "lubrification-chaine",
    label: "Lubrifier la chaîne",
    sub: "Plus souvent sous la pluie ou en hiver",
    intervalKm: 250,
    intervalMonths: 1,
  },
  {
    id: "nettoyage-transmission",
    label: "Nettoyer et dégraisser la transmission",
    sub: "Chaîne, cassette, plateaux — prolonge leur durée de vie",
    intervalKm: 1000,
    intervalMonths: 3,
  },
  {
    id: "purge-freins",
    label: "Purger les freins hydrauliques",
    sub: "Levier spongieux = purge en retard",
    intervalMonths: 12,
    discOnly: true,
    defaultCost: 30,
  },
  {
    id: "preventif-tubeless",
    label: "Renouveler le préventif tubeless",
    sub: "Si tu roules en tubeless — le liquide sèche avec le temps",
    intervalMonths: 4,
  },
  {
    id: "controle-serrages",
    label: "Contrôler les serrages",
    sub: "Potence, cintre, tige de selle, roues — au couple",
    intervalMonths: 6,
  },
  {
    id: "entretien-suspension",
    label: "Entretien fourche / suspension",
    sub: "Joints et bain d'huile — évite les réparations coûteuses",
    intervalKm: 1500,
    intervalMonths: 12,
    vttOnly: true,
    defaultCost: 80,
  },
  {
    id: "revision-complete",
    label: "Révision complète",
    sub: "Chez ton vélociste — roulements, jeu de direction, réglages",
    intervalKm: 5000,
    intervalMonths: 12,
    defaultCost: 80,
  },
];

export type MaintenanceLast = {
  performed_at: string;         // date ISO
  km_at_action: number | null;  // km vélo au moment de l'entretien
};

export type MaintenanceStatus =
  | { state: "never" }
  | {
      state: "ok" | "soon" | "due";
      pct: number;                // progression vers l'échéance (0-100, plafonné)
      kmSince: number | null;
      weeksSince: number;
      dueInKm: number | null;     // km restants avant échéance (si intervalKm)
      dueInWeeks: number | null;  // semaines restantes (si intervalMonths)
      dueKind: "km" | "time" | null; // échéance qui tombera EN PREMIER (la contraignante)
    };

const AVG_DAYS_PER_MONTH = 30.44;

export function computeMaintenanceStatus(
  def: MaintenanceDef,
  last: MaintenanceLast | null,
  bikeKm: number
): MaintenanceStatus {
  if (!last) return { state: "never" };

  const kmSince = last.km_at_action !== null ? Math.max(0, bikeKm - last.km_at_action) : null;
  const days = Math.max(0, (Date.now() - new Date(last.performed_at).getTime()) / 86400000);
  const weeksSince = Math.floor(days / 7);

  const ratioKm = def.intervalKm && kmSince !== null ? kmSince / def.intervalKm : 0;
  const ratioTime = def.intervalMonths ? days / (def.intervalMonths * AVG_DAYS_PER_MONTH) : 0;
  const ratio = Math.max(ratioKm, ratioTime);

  const dueInKm = def.intervalKm && kmSince !== null
    ? Math.max(0, Math.round(def.intervalKm - kmSince))
    : null;
  const dueInWeeks = def.intervalMonths
    ? Math.max(0, Math.round((def.intervalMonths * AVG_DAYS_PER_MONTH - days) / 7))
    : null;

  const state = ratio >= 1 ? "due" : ratio >= 0.75 ? "soon" : "ok";
  const pct = Math.min(100, Math.max(0, Math.round(ratio * 100)));

  // Quelle échéance tombera en premier ? Celle dont le ratio d'usure est le plus
  // avancé. Si une seule dimension est définie, c'est elle.
  const hasKm = def.intervalKm != null && kmSince !== null;
  const hasTime = def.intervalMonths != null;
  const dueKind: "km" | "time" | null =
    hasKm && hasTime ? (ratioKm >= ratioTime ? "km" : "time")
    : hasKm ? "km"
    : hasTime ? "time"
    : null;

  return { state, pct, kmSince, weeksSince, dueInKm, dueInWeeks, dueKind };
}

// Libellé COURT de la prochaine échéance : uniquement la dimension contraignante
// (km OU temps), jamais les deux. Ex. « ~158 km » ou « 3 sem. » / « 3 mois ».
export function formatNextDue(status: MaintenanceStatus): string {
  if (status.state === "never") return "";
  if (status.dueKind === "km" && status.dueInKm !== null) {
    return `${status.dueInKm.toLocaleString("fr")} km`;
  }
  if (status.dueKind === "time" && status.dueInWeeks !== null) {
    return status.dueInWeeks >= 5 ? `${Math.round(status.dueInWeeks / 4)} mois` : `${status.dueInWeeks} sem.`;
  }
  return "";
}
