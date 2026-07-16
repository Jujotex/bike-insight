// Hook de démarrage Next.js : vérifie l'intégrité des données de compatibilité
// (groupes ↔ plaquettes) au lancement du serveur. Une incohérence (ex. plaquette
// VTT sur un groupe route) est signalée dans les logs — filet de sécurité pour
// éviter que ce type de bug ne repasse silencieusement.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { findBikeDataIssues } = await import("./lib/groupsets");
    const issues = findBikeDataIssues();
    if (issues.length > 0) {
      console.warn(
        `[compat] ${issues.length} incohérence(s) de compatibilité détectée(s) :\n- ` +
          issues.join("\n- ")
      );
    } else {
      console.log("[compat] Données de compatibilité groupes ↔ plaquettes : OK.");
    }
  } catch (err) {
    console.warn("[compat] Vérification d'intégrité impossible :", err);
  }
}
