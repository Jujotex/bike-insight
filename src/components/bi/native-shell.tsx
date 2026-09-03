"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

/**
 * Comportements natifs qui n'ont pas d'équivalent web.
 *
 * Composant sans rendu, monté une fois dans le layout applicatif. Tout est gardé
 * derrière `Capacitor.isNativePlatform()`, qui vaut `false` dans un navigateur :
 * le site n'est pas concerné, et les modules ne sont même pas chargés — d'où les
 * `await import()` plutôt que des imports en tête de fichier, qui alourdiraient
 * le bundle web de code qu'il n'exécutera jamais.
 */

/**
 * Écrans depuis lesquels le bouton retour quitte l'application.
 *
 * Ailleurs il remonte dans l'historique. Le tableau de bord est la racine
 * naturelle ; les autres entrées de la barre du bas sont incluses parce qu'un
 * utilisateur qui y arrive par un onglet, et non par une navigation, n'a rien
 * derrière lui — le retour semblerait alors ne rien faire.
 */
const RACINES = new Set(["/dashboard", "/bikes", "/cout", "/historique"]);

export function NativeShell() {
  const router = useRouter();
  const pathname = usePathname();

  // ── Bouton retour Android ───────────────────────────────────
  //
  // Sans écouteur, Capacitor applique le comportement par défaut : **quitter
  // l'application**. Depuis n'importe quel écran, y compris une fiche pièce
  // atteinte après cinq navigations. C'est déroutant à l'usage, et Google le
  // relève en revue — le retour doit remonter la pile avant de sortir.
  //
  // iOS n'a pas de bouton retour matériel : l'écouteur n'y est jamais appelé.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let retirer: (() => void) | undefined;

    void (async () => {
      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        if (RACINES.has(pathname) || !canGoBack) {
          void App.exitApp();
          return;
        }
        router.back();
      });
      retirer = () => void handle.remove();
    })();

    return () => retirer?.();
  }, [pathname, router]);

  // ── Barre de statut et écran de démarrage ───────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void (async () => {
      const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
        import("@capacitor/status-bar"),
        import("@capacitor/splash-screen"),
      ]);

      // `Style.Light` désigne un **contenu** clair, donc des icônes claires. Ce
      // qu'on veut ici est l'inverse : le fond de l'app est ivoire, il faut des
      // icônes sombres, soit `Style.Dark`. La nomenclature prend à contre-pied
      // et c'est une source classique de barre d'état illisible.
      await StatusBar.setStyle({ style: Style.Dark }).catch(() => {});

      // L'interface est prête : on retire l'écran de démarrage. Il est configuré
      // pour ne pas se masquer seul (`launchAutoHide: false`), sinon il
      // disparaîtrait dès que l'activité dessine — c'est-à-dire avant que la
      // WebView ait rendu quoi que ce soit, laissant un éclair blanc.
      await SplashScreen.hide().catch(() => {});
    })();
  }, []);

  return null;
}
