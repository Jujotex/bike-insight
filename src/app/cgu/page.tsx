import Link from "next/link";
import type { Metadata } from "next";
import { SUPPORT_EMAIL, PRIVACY_POLICY_PATH, STRAVA_APPS_SETTINGS_URL } from "@/lib/contact";

/**
 * Conditions générales d'utilisation.
 *
 * Exigées par l'API Policy Strava §9.2 : les conditions doivent **décliner les
 * garanties pour le compte des fournisseurs tiers** et limiter leur
 * responsabilité — c'est l'objet du point 8, qui n'est donc pas une clause de
 * style mais une obligation contractuelle précise. Les deux stores exigent par
 * ailleurs des conditions accessibles depuis la fiche de l'application.
 *
 * ⚠️ Rédigé à partir du fonctionnement réel de l'application et des obligations
 * contractuelles connues. **Non relu par un juriste.** À faire relire avant
 * d'encaisser le moindre paiement : dès qu'il y a une contrepartie financière, le
 * droit de la consommation ajoute des obligations (rétractation, garanties,
 * médiation) que ce texte ne couvre pas.
 *
 * `EDITOR_STATUS` est à reprendre le jour où une micro-entreprise existe, comme
 * `CONTROLLER_STATUS` dans la politique de confidentialité.
 */

const EDITOR_NAME = "Tanguy Dietsch";
// ⚠️ À mettre à jour le jour où une micro-entreprise est créée (ajouter le n° SIRET).
const EDITOR_STATUS = "éditeur individuel, agissant à titre non professionnel";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Bike Insight",
  description:
    "Les règles d'utilisation de Bike Insight : compte, usage, limites de responsabilité et résiliation.",
};

const LAST_UPDATED = "3 septembre 2026";

const h2: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  letterSpacing: -0.2,
  marginTop: 36,
  marginBottom: 10,
};

const p: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.7,
  color: "var(--bi-ink)",
  marginBottom: 12,
};

const muted: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.7,
  color: "var(--bi-muted)",
};

const lien: React.CSSProperties = { color: "var(--bi-ink)", fontWeight: 600 };

export default function CguPage() {
  return (
    <main style={{ background: "var(--bi-bg)", minHeight: "100dvh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 22px 96px" }}>
        <Link href="/" style={{ ...muted, textDecoration: "none", fontWeight: 600 }}>
          ← Bike Insight
        </Link>

        <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1, marginTop: 24, marginBottom: 8 }}>
          Conditions générales d&apos;utilisation
        </h1>
        <div style={muted}>Dernière mise à jour : {LAST_UPDATED}</div>

        <p style={{ ...p, marginTop: 28 }}>
          Ces conditions encadrent l&apos;utilisation de Bike Insight. En créant un compte, tu
          les acceptes. Elles sont écrites pour être lisibles : si un point te paraît obscur,
          écris-nous plutôt que de rester dans le doute.
        </p>

        <h2 style={h2}>1. Qui édite l&apos;application</h2>
        <p style={p}>
          Bike Insight est édité par {EDITOR_NAME}, {EDITOR_STATUS}. Contact :{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={lien}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>

        <h2 style={h2}>2. Ce que fait l&apos;application</h2>
        <p style={p}>
          Bike Insight estime l&apos;usure de tes pièces de vélo, les échéances d&apos;entretien
          et ton coût de possession, à partir des kilomètres que tu parcours — importés depuis
          Strava ou saisis à la main.
        </p>
        <p style={p}>
          <strong style={{ fontWeight: 600 }}>Ce sont des estimations, pas un diagnostic.</strong>{" "}
          Elles reposent sur des durées de vie moyennes et sur une distance parcourue ; elles ne
          tiennent compte ni de ton terrain, ni de la météo, ni de ton style de pilotage, ni de
          l&apos;état réel de tes pièces. Une chaîne annoncée « à surveiller » peut être bonne
          pour mille kilomètres, une chaîne annoncée « OK » peut être usée.
        </p>
        <p style={p}>
          <strong style={{ fontWeight: 600 }}>
            Rien ne remplace un contrôle visuel et l&apos;avis d&apos;un professionnel
          </strong>
          , en particulier sur les organes de sécurité : freinage, direction, roues, cadre.
          N&apos;utilise pas l&apos;application pour décider seul qu&apos;une pièce de sécurité
          peut encore servir.
        </p>

        <h2 style={h2}>3. Ton compte</h2>
        <p style={p}>
          La création d&apos;un compte demande une adresse e-mail valide. Tu es responsable de la
          confidentialité de ton mot de passe et des actions effectuées depuis ton compte. Tu
          t&apos;engages à fournir des informations exactes.
        </p>
        <p style={p}>
          L&apos;application n&apos;est pas destinée aux personnes de moins de 15 ans.
        </p>

        <h2 style={h2}>4. Connexion à Strava</h2>
        <p style={p}>
          La connexion de ton compte Strava est facultative : l&apos;application fonctionne aussi
          avec des sorties saisies à la main. Si tu la connectes, tu autorises Bike Insight à lire
          tes activités et ton matériel pour calculer l&apos;usure.
        </p>
        <p style={p}>
          Tu peux retirer cette autorisation à tout moment depuis{" "}
          <a href={STRAVA_APPS_SETTINGS_URL} target="_blank" rel="noopener noreferrer" style={lien}>
            tes réglages Strava
          </a>
          . Les données importées sont alors supprimées. Ton usage de Strava reste par ailleurs
          régi par les conditions de Strava, auxquelles Bike Insight ne se substitue pas.
        </p>

        <h2 style={h2}>5. Usage acceptable</h2>
        <p style={p}>Tu t&apos;engages à ne pas :</p>
        <ul style={{ ...p, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>
            accéder au service par des moyens automatisés, ni en extraire massivement les données ;
          </li>
          <li style={{ marginBottom: 6 }}>
            tenter d&apos;accéder aux données d&apos;autres utilisateurs, ni contourner les
            mécanismes d&apos;authentification ;
          </li>
          <li style={{ marginBottom: 6 }}>
            perturber le fonctionnement du service ou celui de ses prestataires ;
          </li>
          <li>revendre ou redistribuer le service ou ses données.</li>
        </ul>

        <h2 style={h2}>6. Tes données et tes contenus</h2>
        <p style={p}>
          Tu restes propriétaire des données que tu saisis. Tu peux les exporter à tout moment
          depuis ta page Compte, et supprimer ton compte — ce qui efface définitivement
          l&apos;ensemble de tes données. Le détail des traitements figure dans la{" "}
          <Link href={PRIVACY_POLICY_PATH} style={lien}>
            politique de confidentialité
          </Link>
          .
        </p>
        <p style={p}>
          Le code, l&apos;interface, les textes et les repères d&apos;usure de Bike Insight
          restent la propriété de son éditeur.
        </p>

        <h2 style={h2}>7. Disponibilité du service</h2>
        <p style={p}>
          Le service est fourni en l&apos;état, sans garantie de disponibilité continue. Il peut
          être interrompu pour maintenance, évoluer, ou cesser d&apos;être exploité. En cas
          d&apos;arrêt définitif, tu seras prévenu avec un délai raisonnable pour exporter tes
          données.
        </p>
        <p style={p}>
          Bike Insight est aujourd&apos;hui gratuit. L&apos;introduction éventuelle
          d&apos;une offre payante ne rendrait pas payantes les fonctionnalités déjà fournies
          sans contrepartie, et ferait l&apos;objet de conditions distinctes.
        </p>

        <h2 style={h2}>8. Services tiers et limites de responsabilité</h2>
        <p style={p}>
          Bike Insight s&apos;appuie sur des services fournis par des tiers — Strava pour les
          activités, OpenStreetMap pour l&apos;annuaire des magasins, Supabase et Vercel pour
          l&apos;hébergement. Ces services sont mis à disposition{" "}
          <strong style={{ fontWeight: 600 }}>« en l&apos;état »</strong>, sans garantie
          d&apos;aucune sorte, expresse ou implicite, y compris de qualité marchande,
          d&apos;adéquation à un usage particulier, d&apos;exactitude ou de disponibilité.
        </p>
        <p style={p}>
          <strong style={{ fontWeight: 600 }}>
            Ces fournisseurs tiers ne sont partie à aucune relation entre toi et Bike Insight
          </strong>{" "}
          et n&apos;assument aucune responsabilité au titre du service. En particulier, Strava
          n&apos;endosse ni ne garantit les calculs, estimations ou recommandations produits par
          Bike Insight, qui sont de la seule responsabilité de son éditeur.
        </p>
        <p style={p}>
          Dans la limite permise par la loi, la responsabilité de l&apos;éditeur ne saurait être
          engagée pour un dommage résultant d&apos;une décision d&apos;entretien ou de
          remplacement prise sur la base des estimations de l&apos;application, d&apos;une
          indisponibilité du service, ni d&apos;une perte de données imputable à un prestataire
          tiers.
        </p>
        <p style={muted}>
          Rien dans ces conditions n&apos;écarte les droits que la loi t&apos;accorde de manière
          impérative, notamment en cas de faute lourde ou de dommage corporel.
        </p>

        <h2 style={h2}>9. Résiliation</h2>
        <p style={p}>
          Tu peux supprimer ton compte à tout moment depuis ta page Compte, sans préavis ni
          justification. L&apos;éditeur peut suspendre un compte en cas de manquement au point 5,
          après t&apos;en avoir informé sauf urgence.
        </p>

        <h2 style={h2}>10. Modifications</h2>
        <p style={p}>
          Ces conditions peuvent évoluer avec l&apos;application. La date de dernière mise à jour
          figure en haut de page. En cas de changement significatif, tu en seras informé ; ton
          usage continu du service vaudra alors acceptation.
        </p>

        <h2 style={h2}>11. Droit applicable</h2>
        <p style={p}>
          Ces conditions sont régies par le droit français. En cas de litige, une solution amiable
          sera recherchée en priorité — écris à{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={lien}>
            {SUPPORT_EMAIL}
          </a>{" "}
          — avant toute action contentieuse.
        </p>
      </div>
    </main>
  );
}
