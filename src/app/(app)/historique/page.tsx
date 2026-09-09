"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, PageHead } from "@/components/bi/ui";
import { SkelCard } from "@/components/bi/skeleton";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";
import { useAsyncData } from "@/lib/use-async-data";
import { OfflineBanner } from "@/components/bi/offline-banner";
import { HistoryLog } from "./history-log";
import { HistoryCharts } from "./history-charts";
import { loadHistoryData } from "./history-data";

/**
 * Page Historique — vue flotte.
 *
 * Comme Coût (`cout/page.tsx`), cette page globale n'a plus besoin d'un
 * sélecteur mono-vélo : le journal d'UN vélo vit désormais dans son Hub
 * (onglet Historique), qui appelle `loadHistoryData` sans `allBikes` —
 * exactement le comportement d'avant, filtré sur ce vélo. Ici, `allBikes`
 * mélange tous les vélos dans un seul journal ; chaque ligne porte son
 * étiquette de vélo (`HistoryLog`) pour rester lisible sans sélecteur.
 */
function HistoriqueContent() {
  const router = useRouter();

  const load = useCallback(async () => {
    const userId = await getCurrentUserId();
    if (!userId) {
      router.replace("/login");
      return null;
    }
    return loadHistoryData(supabase, userId, null, { allBikes: true });
  }, [router]);

  const { data, loading, error, cachedAt } = useAsyncData(load, [], "historique:flotte");

  // Premier chargement : on n'a encore rien à montrer.
  if (loading && !data) {
    return (
      <div className="bi-page">
        <PageHead title="Historique" sub="Tes remplacements de pièces et tes entretiens" />
        <div className="bi-stack">
          <SkelCard h={64} />
          <SkelCard h={220} />
          <SkelCard h={320} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bi-page">
        <PageHead title="Historique" sub="Tes remplacements de pièces et tes entretiens" />
        <EmptyState
          title="Chargement impossible"
          text="Les données n'ont pas pu être récupérées. Vérifie ta connexion et réessaie."
        />
      </div>
    );
  }

  if (!data) return null; // redirection vers /login en cours

  return (
    <div className="bi-page">
      <OfflineBanner cachedAt={cachedAt} />
      <PageHead
        title="Historique"
        sub={data.bikes.length > 1 ? `Tous tes vélos · ${data.bikes.length} vélos` : "Tes remplacements de pièces et tes entretiens"}
      />
      <div className="bi-stack" style={{ opacity: loading ? 0.6 : 1, transition: "opacity 120ms" }}>
        {data.items.length === 0 ? (
          <EmptyState
            title={"Rien à afficher pour l'instant"}
            text={
              "Dès que tu remplaces une pièce ou que tu enregistres un entretien, l'événement apparaît ici, daté et chiffré."
            }
          />
        ) : (
          <>
            <HistoryCharts items={data.items} />
            <HistoryLog items={data.items} />
          </>
        )}
      </div>
    </div>
  );
}

export default function HistoriquePage() {
  return <HistoriqueContent />;
}
