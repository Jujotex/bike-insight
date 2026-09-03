"use client";

/**
 * Bandeau signalant que l'écran affiche des données conservées localement.
 *
 * Il apparaît quand le réseau n'a pas répondu mais qu'une copie de la dernière
 * consultation existe (cf. `lib/offline-cache.ts`). Le parti pris est de **montrer
 * les données plutôt qu'une erreur** : dans un garage ou un sous-sol, savoir que
 * sa chaîne est à 2 800 km reste utile, même si le chiffre date de la veille.
 *
 * D'où l'importance de la date. Sans elle, l'utilisateur ne peut pas juger si
 * l'information vaut encore quelque chose, et un affichage silencieusement périmé
 * serait pire qu'un message d'échec — il aurait l'air à jour.
 */

function formatCachedAt(date: Date): string {
  const now = new Date();
  const heure = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `aujourd'hui à ${heure}`;

  const hier = new Date(now);
  hier.setDate(hier.getDate() - 1);
  if (date.toDateString() === hier.toDateString()) return `hier à ${heure}`;

  return `le ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} à ${heure}`;
}

export function OfflineBanner({ cachedAt }: { cachedAt: Date | null }) {
  if (!cachedAt) return null;

  return (
    <div
      role="status"
      className="mb-[14px] flex items-center gap-[10px] rounded-[10px] px-[14px] py-[10px]"
      style={{ background: "var(--bi-warn-soft)" }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--bi-warn)"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path d="M12 7v5l3 2" />
        <circle cx="12" cy="12" r="9" />
      </svg>
      <span className="bi-text-sm" style={{ color: "var(--bi-warn)", fontWeight: 600 }}>
        Hors ligne — données du {formatCachedAt(cachedAt)}
      </span>
    </div>
  );
}
