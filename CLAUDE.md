@AGENTS.md

# Règles design (verrou chantier 2)

Le système de design vit dans `src/app/globals.css` (tokens `--bi-*` + classes `bi-text-*`). Tout nouveau style doit s'y conformer, sinon l'entropie revient.

- **Couleurs** : uniquement via `var(--bi-*)` (`--bi-bg`, `--bi-card`, `--bi-white`, `--bi-ink`, `--bi-muted`, `--bi-line`, `--bi-accent`, `--bi-ok`/`--bi-warn`/`--bi-bad` et leurs `-soft`, `--bi-strava`…). Aucun hex ou rgba en dur. Seule exception : les couleurs de marque des logos OAuth (Google multicolore, teinte Strava déjà tokenisée) et les palettes décoratives one-off assumées (courbes de graphiques, couleurs cycliques de vélos).
- **Tailles de police** : uniquement dans l'échelle `bi-text-*` (`bi-text-2xs` 10px · `bi-text-xs` 11 · `bi-text-sm` 12 · `bi-text-base` 13 · `bi-text-md` 14 · `bi-text-lg` 16). Pas de demi-pixel ni de taille inventée ; les grandes tailles d'affichage (titres/héros) restent l'exception documentée.
- **Radius** : seulement les valeurs autorisées (2 pour les barres de progression, 6, 8, 10, 14, 18, 999). Aucune nouvelle valeur.
- **Paddings** : un espacement par rôle — carte `20px 22px`, ligne de tableau `14px 22px`, bouton `10px 16px`, badge `3px 8px`.
- **Tableaux** : en-têtes en `.bi-label` (11px), colonnes numériques (km, €, %, dates) alignées à droite en `Mono`.
- **Nouveau code stylé via Tailwind** : privilégier les classes utilitaires Tailwind adossées aux tokens plutôt que le style inline. Migration de l'existant opportuniste (quand on touche un fichier), pas de big-bang.
