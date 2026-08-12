import Link from "next/link";
import type { Metadata } from "next";
import { SUPPORT_EMAIL, STRAVA_APPS_SETTINGS_URL } from "@/lib/contact";

/**
 * Politique de confidentialité.
 *
 * Exigée par l'API Policy Strava §7.3 (conforme RGPD, accessible par un lien
 * « reasonably prominent ») et par les deux stores. Couvre également :
 *   §6.5 — mention obligatoire des Usage Data collectées par Strava ;
 *   §7.7 — liste des sous-traitants ;
 *   §2.1 — types de données, méthodes, retrait du consentement, suppression.
 *
 * ⚠️ Ce texte a été rédigé à partir du code et des obligations contractuelles,
 * il n'a pas été relu par un juriste. Les trois constantes ci-dessous doivent
 * être renseignées avant publication — elles sont fausses ou incomplètes en l'état.
 */

// ⚠️ À RENSEIGNER — le RGPD (art. 13) impose d'identifier le responsable de traitement.
const CONTROLLER_NAME = "Tanguy Dietsch";
// ⚠️ À RENSEIGNER : statut (particulier / micro-entreprise) et, le cas échéant, n° SIRET.
const CONTROLLER_STATUS = "éditeur individuel de l'application Bike Insight";
// ⚠️ À VÉRIFIER dans le tableau de bord Supabase (Project Settings → General → Region).
// Détermine s'il y a ou non un transfert hors UE à déclarer plus bas.
const SUPABASE_REGION = "à confirmer";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Bike Insight",
  description:
    "Quelles données Bike Insight collecte, pourquoi, combien de temps, et comment exercer tes droits.",
};

const LAST_UPDATED = "12 août 2026";

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

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--bi-muted)",
  borderBottom: "1px solid var(--bi-line)",
};

const td: React.CSSProperties = {
  padding: "12px",
  fontSize: 13,
  lineHeight: 1.6,
  verticalAlign: "top",
  borderBottom: "1px solid var(--bi-line)",
};

export default function ConfidentialitePage() {
  return (
    <main style={{ background: "var(--bi-bg)", minHeight: "100dvh" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 22px 96px" }}>
        <Link href="/" style={{ ...muted, textDecoration: "none", fontWeight: 600 }}>
          ← Bike Insight
        </Link>

        <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: -1, marginTop: 24, marginBottom: 8 }}>
          Politique de confidentialité
        </h1>
        <div style={muted}>Dernière mise à jour : {LAST_UPDATED}</div>

        <p style={{ ...p, marginTop: 28 }}>
          Bike Insight calcule l&apos;usure de tes pièces de vélo et ton coût de possession à partir
          de tes kilomètres parcourus. Pour ça, l&apos;application a besoin de certaines données.
          Cette page explique lesquelles, pourquoi, combien de temps elles sont conservées, et
          comment tu gardes la main dessus.
        </p>

        <h2 style={h2}>1. Qui est responsable de tes données</h2>
        <p style={p}>
          Le responsable du traitement est {CONTROLLER_NAME}, {CONTROLLER_STATUS}. Pour toute
          question ou pour exercer tes droits :{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "var(--bi-ink)", fontWeight: 600 }}>
            {SUPPORT_EMAIL}
          </a>.
        </p>

        <h2 style={h2}>2. Quelles données, pour quoi faire</h2>
        <div style={{ overflowX: "auto", margin: "16px 0 4px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--bi-card)", borderRadius: 14 }}>
            <thead>
              <tr>
                <th style={th}>Données</th>
                <th style={th}>Finalité</th>
                <th style={th}>Base légale</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>Adresse email, mot de passe (chiffré), prénom et nom si tu les renseignes</td>
                <td style={td}>Créer et sécuriser ton compte</td>
                <td style={td}>Exécution du contrat</td>
              </tr>
              <tr>
                <td style={td}>Tes vélos, pièces, entretiens, prix d&apos;achat et notes</td>
                <td style={td}>Suivre l&apos;usure et calculer le coût de possession</td>
                <td style={td}>Exécution du contrat</td>
              </tr>
              <tr>
                <td style={td}>Données Strava (détail au point 3)</td>
                <td style={td}>Alimenter automatiquement tes kilomètres</td>
                <td style={td}>Ton consentement</td>
              </tr>
              <tr>
                <td style={td}>Préférences d&apos;alerte et notifications</td>
                <td style={td}>T&apos;avertir quand une pièce approche de sa fin de vie</td>
                <td style={td}>Exécution du contrat</td>
              </tr>
              <tr>
                <td style={td}>Journaux techniques du serveur (adresse IP, navigateur, horodatage)</td>
                <td style={td}>Sécurité, diagnostic de pannes</td>
                <td style={td}>Intérêt légitime</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style={muted}>
          Bike Insight n&apos;utilise aujourd&apos;hui aucun outil de mesure d&apos;audience ni de
          publicité. Tes données ne sont ni vendues, ni louées, ni transmises à des tiers à des
          fins commerciales.
        </p>

        <h2 style={h2}>3. Ce que Bike Insight récupère sur Strava</h2>
        <p style={p}>
          Si tu connectes ton compte Strava, l&apos;application accède en{" "}
          <strong style={{ fontWeight: 600 }}>lecture seule</strong> à ta liste de vélos et à tes
          sorties. De chaque sortie, elle ne conserve que quatre informations :
          l&apos;identifiant Strava de la sortie, le vélo utilisé, la distance et la date.
        </p>
        <p style={p}>
          Ne sont <strong style={{ fontWeight: 600 }}>pas</strong> récupérés : les tracés GPS, les
          noms de tes sorties, la fréquence cardiaque, la puissance, les photos, ni aucune donnée
          concernant d&apos;autres athlètes. L&apos;identifiant de sortie est conservé pour deux
          raisons précises : éviter de compter deux fois les mêmes kilomètres, et pouvoir retirer
          la contribution d&apos;une sortie que tu supprimerais sur Strava.
        </p>
        <p style={p}>
          Tes données Strava ne sont affichées qu&apos;à toi. Elles ne sont jamais agrégées avec
          celles d&apos;autres utilisateurs, ni utilisées pour entraîner un modèle d&apos;intelligence
          artificielle.
        </p>
        <p style={p}>
          Tu peux retirer cette autorisation à tout moment depuis{" "}
          <a href={STRAVA_APPS_SETTINGS_URL} target="_blank" rel="noopener noreferrer" style={{ color: "var(--bi-ink)", fontWeight: 600 }}>
            tes réglages Strava
          </a>. Les données importées sont alors supprimées de Bike Insight.
        </p>
        <p style={muted}>
          Strava peut de son côté collecter et utiliser des données d&apos;usage relatives à
          l&apos;utilisation de son API par Bike Insight, à ses propres fins commerciales. Le
          traitement de tes données par Strava relève de la{" "}
          <a href="https://www.strava.com/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--bi-ink)", fontWeight: 600 }}>
            politique de confidentialité de Strava
          </a>, qui prévaut sur la présente en cas de contradiction.
        </p>

        <h2 style={h2}>4. Qui d&apos;autre traite ces données</h2>
        <p style={p}>
          Bike Insight s&apos;appuie sur trois prestataires, qui n&apos;utilisent tes données que
          pour fournir leur service :
        </p>
        <ul style={{ ...p, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>
            <strong style={{ fontWeight: 600 }}>Supabase</strong> — base de données et
            authentification. Région d&apos;hébergement : {SUPABASE_REGION}.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong style={{ fontWeight: 600 }}>Vercel</strong> — hébergement de
            l&apos;application et journaux techniques.
          </li>
          <li>
            <strong style={{ fontWeight: 600 }}>Strava</strong> — source des données
            d&apos;activité, uniquement si tu as connecté ton compte.
          </li>
        </ul>
        <p style={muted}>
          Lorsqu&apos;un transfert de données hors de l&apos;Union européenne a lieu, il est encadré
          par les clauses contractuelles types de la Commission européenne.
        </p>

        <h2 style={h2}>5. Combien de temps</h2>
        <ul style={{ ...p, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>
            Données de compte et de matériel : tant que ton compte existe.
          </li>
          <li style={{ marginBottom: 6 }}>
            Données Strava : tant que la connexion Strava est active. En cas de révocation, de
            demande de ta part ou de suppression de ton compte, elles sont effacées{" "}
            <strong style={{ fontWeight: 600 }}>sous 30 jours au plus</strong>, et en pratique
            immédiatement.
          </li>
          <li>Journaux techniques : quelques semaines, selon la rétention de l&apos;hébergeur.</li>
        </ul>

        <h2 style={h2}>6. Tes droits</h2>
        <p style={p}>
          Tu disposes d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
          limitation, d&apos;opposition et de portabilité de tes données, ainsi que du droit de
          retirer ton consentement à tout moment.
        </p>
        <p style={p}>
          La suppression de ton compte se fait directement dans l&apos;application, depuis la page
          Compte : elle efface définitivement toutes tes données et révoque l&apos;autorisation
          Strava. Nous te confirmons la suppression. Pour toute autre demande, écris à{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "var(--bi-ink)", fontWeight: 600 }}>
            {SUPPORT_EMAIL}
          </a>.
        </p>
        <p style={muted}>
          Si tu estimes que tes droits ne sont pas respectés, tu peux introduire une réclamation
          auprès de la{" "}
          <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" style={{ color: "var(--bi-ink)", fontWeight: 600 }}>
            CNIL
          </a>.
        </p>

        <h2 style={h2}>7. Sécurité</h2>
        <p style={p}>
          Les échanges sont chiffrés en transit. L&apos;accès aux données est cloisonné par
          utilisateur au niveau de la base : techniquement, un compte ne peut lire que ses propres
          données. Les mots de passe ne sont jamais stockés en clair.
        </p>

        <h2 style={h2}>8. Cookies</h2>
        <p style={p}>
          Bike Insight n&apos;utilise que les cookies strictement nécessaires à ton
          authentification — aucun cookie publicitaire ni de mesure d&apos;audience. Ils ne
          requièrent donc pas de bandeau de consentement.
        </p>

        <h2 style={h2}>9. Mineurs</h2>
        <p style={p}>
          L&apos;application n&apos;est pas destinée aux personnes de moins de 15 ans et ne
          collecte pas sciemment leurs données.
        </p>

        <h2 style={h2}>10. Modifications</h2>
        <p style={p}>
          Cette politique peut évoluer avec l&apos;application. La date de dernière mise à jour
          figure en haut de page ; en cas de changement significatif dans les données collectées,
          tu en seras informé et ton consentement sera à nouveau recueilli si nécessaire.
        </p>
      </div>
    </main>
  );
}
