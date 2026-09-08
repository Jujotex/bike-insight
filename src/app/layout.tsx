import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NativeShell } from "@/components/bi/native-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Bike Insight",
  description: "Suivi de l'usure, de la maintenance et du coût de ton matériel vélo.",
};

/**
 * Réglages d'affichage, décisifs en natif.
 *
 * **`viewportFit: 'cover'` est la clé.** Sans lui, les variables CSS
 * `env(safe-area-inset-*)` valent zéro et toutes les marges qui en dépendent sont
 * sans effet. Or `targetSdkVersion = 36` : depuis Android 15, ce niveau **impose**
 * le bord-à-bord, donc la WebView est dessinée sous la barre d'état et sous la
 * barre de navigation. Sur iOS, c'est l'encoche et la barre d'accueil. Sans
 * `cover` **et** sans marges, l'en-tête de page passe sous l'horloge.
 *
 * Le zoom reste autorisé : le désactiver est courant dans les applications
 * embarquées, mais prive les personnes malvoyantes du seul moyen d'agrandir le
 * texte. Le gain esthétique ne vaut pas ça.
 *
 * `themeColor` teinte la barre d'état sur Android et la barre d'URL sur le web.
 * C'est la seule valeur en dur du fichier : les métadonnées Next sont lues hors
 * du CSS, donc `var(--bi-bg)` n'y a aucun sens. Elle doit rester alignée sur
 * `--bi-bg` dans `globals.css`.
 */
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#F4F4EF", // = --bi-bg
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Comportements natifs : bouton retour, barre de statut, masquage de
            l'écran de démarrage. Sans rendu, et entièrement inerte sur le web.

            Monté ici, à la racine, et non dans le layout du groupe `(app)` :
            l'application démarre sur `/`, qui est hors de ce groupe. Le
            composant n'y était jamais monté, `SplashScreen.hide()` jamais
            appelé — et l'app restait bloquée sur l'écran de démarrage. */}
        <NativeShell />
        {children}
      </body>
    </html>
  );
}
