// Formatage — source unique. Trois variantes du même `toLocaleString`
// traînaient dans les pages (dont un "fr" au lieu de "fr-FR").

/** 1234 → "1 234" */
export function fmtNum(n: number): string {
  return n.toLocaleString("fr-FR");
}

/** "2026-03-04" → "04 mars 2026" */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Échéance en semaines → texte lisible. */
export function fmtDelay(weeks: number): string {
  if (weeks <= 0) return "à remplacer";
  if (weeks < 5) return `dans ${weeks} sem.`;
  return `dans ${Math.round(weeks / 4)} mois`;
}
