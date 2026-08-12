// Catégories de pièces — libellés et couleurs, source unique.
//
// Les couleurs sont des tokens `--bi-cat-*` déclarés dans globals.css.
// Avant, `cout/page.tsx` mappait cockpit, eclairage et autre sur la même
// `--bi-muted` : dans la barre segmentée « Où part ton argent », ces trois
// catégories fusionnaient en un seul bloc gris.

export const CATEGORY_LABEL: Record<string, string> = {
  transmission: "Transmission",
  freinage: "Freinage",
  suspension: "Suspension",
  roues: "Pneumatiques",
  cockpit: "Cockpit",
  eclairage: "Éclairage",
  autre: "Autre",
  entretien: "Entretien courant",
};

const COLORS: Record<string, string> = {
  transmission: "var(--bi-cat-transmission)",
  freinage: "var(--bi-cat-freinage)",
  roues: "var(--bi-cat-roues)",
  suspension: "var(--bi-cat-suspension)",
  cockpit: "var(--bi-cat-cockpit)",
  eclairage: "var(--bi-cat-eclairage)",
  autre: "var(--bi-muted)",
  entretien: "var(--bi-ink)",
};

export function categoryColor(key: string): string {
  return COLORS[key] ?? "var(--bi-muted)";
}

export function categoryLabel(key: string): string {
  return CATEGORY_LABEL[key] ?? key;
}
