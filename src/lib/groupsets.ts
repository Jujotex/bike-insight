// ── Moteur de règles de compatibilité — SOURCE DE VÉRITÉ ──────────────
//
// Chaque groupe (transmission) est décrit par des faits déterministes :
// discipline, nombre de vitesses, et surtout le TYPE D'ÉTRIER, qui décide
// du type de plaquette. On ne devine plus par mots-clés (`includes("m0")`) —
// on résout par table. C'est la brique qui rend la compatibilité fiable et
// auditable (cf. `findBikeDataIssues`).
//
// `id` correspond volontairement à l'`id` des BIKE_TEMPLATES : le groupe EST
// l'identité de référence.

import { BIKE_TEMPLATES } from "./bike-templates";

export type Discipline = "route" | "gravel" | "vtt";

// Type de plaquette = famille physiquement compatible avec l'étrier.
export type BrakePadType =
  | "shimano-road-L"  // étriers route flat-mount 11v et moins (R7070/R8070/RS405) → L03A/L04C
  | "shimano-road-K"  // étriers route flat-mount 12v (R7170/R8170/R9270) → K02S/K04S
  | "shimano-mtb"     // étriers VTT 2/4 pistons (Deore/SLX/XT, CUES) → M06/M07/B01S
  | "sram-road"       // étriers route SRAM (Rival/Force/Red) → plaquettes route SRAM
  | "sram-mtb"        // étriers VTT SRAM (Level/Guide/Code/DB) → plaquettes VTT SRAM
  | "campagnolo-road"; // étriers Campagnolo (Ekar/Chorus/Record)

export type GroupsetSpec = {
  id: string;              // == BIKE_TEMPLATES[].id
  brand: "Shimano" | "SRAM" | "Campagnolo";
  discipline: Discipline;
  speeds: number;
  padType: BrakePadType;
};

// Registre des groupes connus. Un seul endroit à maintenir, relu facilement.
export const GROUPSETS: Record<string, GroupsetSpec> = {
  // ── Shimano route ──
  "shimano-claris-8v":       { id: "shimano-claris-8v",       brand: "Shimano",    discipline: "route",  speeds: 8,  padType: "shimano-road-L" },
  "shimano-sora-9v":         { id: "shimano-sora-9v",         brand: "Shimano",    discipline: "route",  speeds: 9,  padType: "shimano-road-L" },
  "shimano-tiagra-10v":      { id: "shimano-tiagra-10v",      brand: "Shimano",    discipline: "route",  speeds: 10, padType: "shimano-road-L" },
  "shimano-105-11v":         { id: "shimano-105-11v",         brand: "Shimano",    discipline: "route",  speeds: 11, padType: "shimano-road-L" },
  "shimano-105-12v":         { id: "shimano-105-12v",         brand: "Shimano",    discipline: "route",  speeds: 12, padType: "shimano-road-K" },
  "shimano-105-12v-meca":    { id: "shimano-105-12v-meca",    brand: "Shimano",    discipline: "route",  speeds: 12, padType: "shimano-road-K" },
  "shimano-ultegra-11v":     { id: "shimano-ultegra-11v",     brand: "Shimano",    discipline: "route",  speeds: 11, padType: "shimano-road-L" },
  "shimano-ultegra-di2-12v": { id: "shimano-ultegra-di2-12v", brand: "Shimano",    discipline: "route",  speeds: 12, padType: "shimano-road-K" },
  "shimano-dura-ace-12v":    { id: "shimano-dura-ace-12v",    brand: "Shimano",    discipline: "route",  speeds: 12, padType: "shimano-road-K" },

  // ── Shimano gravel ──
  "shimano-grx-11v":         { id: "shimano-grx-11v",         brand: "Shimano",    discipline: "gravel", speeds: 11, padType: "shimano-road-L" },

  // ── Shimano VTT / polyvalent ──
  "shimano-cues-10v":        { id: "shimano-cues-10v",        brand: "Shimano",    discipline: "vtt",    speeds: 10, padType: "shimano-mtb" },
  "shimano-deore-12v":       { id: "shimano-deore-12v",       brand: "Shimano",    discipline: "vtt",    speeds: 12, padType: "shimano-mtb" },
  "shimano-slx-12v":         { id: "shimano-slx-12v",         brand: "Shimano",    discipline: "vtt",    speeds: 12, padType: "shimano-mtb" },
  "shimano-xt-12v":          { id: "shimano-xt-12v",          brand: "Shimano",    discipline: "vtt",    speeds: 12, padType: "shimano-mtb" },

  // ── SRAM route / gravel ──
  "sram-apex-11v":           { id: "sram-apex-11v",           brand: "SRAM",       discipline: "route",  speeds: 11, padType: "sram-road" },
  "sram-rival-11v":          { id: "sram-rival-11v",          brand: "SRAM",       discipline: "route",  speeds: 11, padType: "sram-road" },
  "sram-force-axs-12v":      { id: "sram-force-axs-12v",      brand: "SRAM",       discipline: "route",  speeds: 12, padType: "sram-road" },
  "sram-rival-axs-gravel":   { id: "sram-rival-axs-gravel",   brand: "SRAM",       discipline: "gravel", speeds: 12, padType: "sram-road" },
  "sram-red-axs-12v":        { id: "sram-red-axs-12v",        brand: "SRAM",       discipline: "route",  speeds: 12, padType: "sram-road" },
  "sram-apex-axs-12v":       { id: "sram-apex-axs-12v",       brand: "SRAM",       discipline: "route",  speeds: 12, padType: "sram-road" },

  // ── SRAM VTT ──
  "sram-nx-eagle-12v":       { id: "sram-nx-eagle-12v",       brand: "SRAM",       discipline: "vtt",    speeds: 12, padType: "sram-mtb" },
  "sram-gx-eagle-12v":       { id: "sram-gx-eagle-12v",       brand: "SRAM",       discipline: "vtt",    speeds: 12, padType: "sram-mtb" },
  "sram-x01-eagle-12v":      { id: "sram-x01-eagle-12v",      brand: "SRAM",       discipline: "vtt",    speeds: 12, padType: "sram-mtb" },

  // ── Campagnolo ──
  "campagnolo-chorus-12v":   { id: "campagnolo-chorus-12v",   brand: "Campagnolo", discipline: "route",  speeds: 12, padType: "campagnolo-road" },
  "campagnolo-ekar-13v":     { id: "campagnolo-ekar-13v",     brand: "Campagnolo", discipline: "gravel", speeds: 13, padType: "campagnolo-road" },
};

// Type de plaquette → id d'entrée du catalogue de remplacement.
const PAD_TYPE_TO_CATALOG: Record<BrakePadType, string> = {
  "shimano-road-L": "brake-disc-shimano-road-11v",
  "shimano-road-K": "brake-disc-shimano-road-12v",
  "shimano-mtb":    "brake-disc-shimano",
  "sram-road":      "brake-disc-sram",
  "sram-mtb":       "brake-disc-sram",
  "campagnolo-road":"brake-disc-campagnolo",
};

// Résout l'entrée catalogue de plaquettes pour un groupe donné (déterministe).
// null si le groupe n'est pas connu → l'appelant applique son repli.
export function resolvePadCatalogId(groupsetId: string): string | null {
  const g = GROUPSETS[groupsetId];
  if (!g) return null;
  return PAD_TYPE_TO_CATALOG[g.padType] ?? null;
}

// ── Validateur d'intégrité ────────────────────────────────────────────
// Parcourt les templates et détecte les plaquettes incohérentes avec le
// groupe (ex. plaquette VTT « M06 » sur un groupe route). Retourne la liste
// des problèmes — à exécuter en test/CI pour bloquer ce type de régression.
export function findBikeDataIssues(): string[] {
  const issues: string[] = [];

  for (const tpl of BIKE_TEMPLATES) {
    const spec = GROUPSETS[tpl.id];
    if (!spec) {
      issues.push(`Groupe « ${tpl.id} » absent de GROUPSETS (source de vérité).`);
      continue;
    }
    const pad = tpl.components.disc.find((c) => c.category === "freinage");
    if (!pad) continue;
    const name = pad.name.toLowerCase();

    const isMtbPad = /\bm0\d|\bb0\d/.test(name);           // M03/M04/M06/M07, B01S…
    const isRoadPad = /\bl0\d|\bk0\d/.test(name);          // L03A/L04C, K02S/K04S…

    if ((spec.padType === "shimano-road-L" || spec.padType === "shimano-road-K") && isMtbPad) {
      issues.push(`Template « ${tpl.id} » (route) propose une plaquette VTT : « ${pad.name} ».`);
    }
    if (spec.padType === "shimano-mtb" && isRoadPad) {
      issues.push(`Template « ${tpl.id} » (VTT) propose une plaquette route : « ${pad.name} ».`);
    }
  }

  return issues;
}
