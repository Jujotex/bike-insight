"use client";

import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { apiFetch } from "@/lib/api";

/**
 * Téléchargement de l'export des données personnelles (RGPD art. 20).
 *
 * ## Pourquoi deux chemins
 *
 * Sur le web, un lien `<a download>` sur une URL d'objet suffit. Dans une WebView
 * Capacitor, **ça ne fait rien** : il n'y a pas de gestionnaire de
 * téléchargements, pas de dossier « Téléchargements » que l'app puisse viser, et
 * l'en-tête `Content-Disposition` n'y déclenche aucun comportement. Le bouton
 * paraîtrait simplement cassé.
 *
 * En natif, on écrit donc le fichier dans le répertoire de cache de l'app, puis
 * on ouvre la feuille de partage du système : l'utilisateur choisit lui-même où
 * il l'envoie — Drive, courriel, gestionnaire de fichiers. C'est le geste attendu
 * sur mobile, et il évite d'avoir à demander une permission de stockage.
 *
 * Le cache plutôt que les documents : le fichier n'a pas à survivre au partage,
 * et le système peut le récupérer seul.
 */
export function ExportDataButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleExport() {
    setStatus("loading");
    setErrorMsg(null);

    try {
      const res = await apiFetch("/api/account/export");
      if (!res.ok) {
        setErrorMsg(res.status === 401 ? "Session expirée — reconnecte-toi" : "Export impossible");
        setStatus("error");
        return;
      }

      const contenu = await res.text();
      const nom = `bike-insight-donnees-${new Date().toISOString().slice(0, 10)}.json`;

      if (Capacitor.isNativePlatform()) {
        const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
          import("@capacitor/filesystem"),
          import("@capacitor/share"),
        ]);

        await Filesystem.writeFile({
          path: nom,
          data: contenu,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        const { uri } = await Filesystem.getUri({ path: nom, directory: Directory.Cache });

        await Share.share({
          title: "Mes données Bike Insight",
          url: uri,
        });
      } else {
        const url = URL.createObjectURL(new Blob([contenu], { type: "application/json" }));
        const lien = document.createElement("a");
        lien.href = url;
        lien.download = nom;
        lien.click();
        // Sans révocation, le contenu reste en mémoire jusqu'au rechargement de
        // la page — et un export peut peser plusieurs mégaoctets.
        URL.revokeObjectURL(url);
      }

      setStatus("idle");
    } catch {
      // La feuille de partage annulée par l'utilisateur lève aussi : on ne
      // distingue pas, et présenter une erreur après une annulation volontaire
      // serait plus déroutant qu'utile.
      setStatus("idle");
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "14px 0", borderBottom: "1px solid var(--bi-line)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Exporter mes données</div>
        <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 1 }}>
          Vélos, pièces, sorties et entretiens, au format JSON
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", marginLeft: "auto" }}>
        {status === "error" && errorMsg && (
          <span style={{ fontSize: 12, color: "var(--bi-bad)", fontWeight: 500, flexBasis: "100%", textAlign: "right" }}>
            {errorMsg}
          </span>
        )}
        <button
          onClick={handleExport}
          disabled={status === "loading"}
          className="bi-text-base"
          style={{
            padding: "10px 16px",
            background: "transparent",
            color: "var(--bi-ink)",
            border: "1px solid var(--bi-line)",
            borderRadius: 10,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: status === "loading" ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {status === "loading" ? "Préparation…" : "Télécharger"}
        </button>
      </div>
    </div>
  );
}
