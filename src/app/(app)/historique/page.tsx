"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState, PageHead } from "@/components/bi/ui";
import { SkelCard } from "@/components/bi/skeleton";
import { BikePicker } from "@/components/bi/bike-picker";
import { supabase } from "@/lib/supabase";
import { useAsyncData } from "@/lib/use-async-data";
import { HistoryLog } from "./history-log";
import { HistoryCharts } from "./history-charts";
import { loadHistoryData } from "./history-data";

/**
 * Page Historique — premier écran converti en composant client (phase 2.1).
 *
 * Elle sert de patron pour les quatorze autres. Ce qui change par rapport à la
 * version Server Component :
 *   • `searchParams` (promesse) → `useSearchParams()` ;
 *   • `redirect("/login")` → redirection client après vérification de session ;
 *   • le rendu se fait en deux temps, d'où un état de chargement — c'est le vrai
 *     coût de la conversion, le rendu serveur l'évitait.
 *
 * La requête SQL est identique à celle d'avant : seul le client change. Cela n'est
 * défendable que parce que la RLS cloisonne réellement depuis le correctif des
 * vues `component_stats` / `bike_stats` du 12/08/2026.
 *
 * `useSearchParams` impose un `<Suspense>` : Next refuse de prérendre un composant
 * qui le lit sans limite de suspense.
 */
function HistoriqueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedBike = searchParams.get("bike");

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return null;
    }
    return loadHistoryData(supabase, user.id, requestedBike);
  }, [requestedBike, router]);

  const { data, loading, error } = useAsyncData(load, [requestedBike]);

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
      <PageHead title="Historique" sub="Tes remplacements de pièces et tes entretiens" />
      <BikePicker bikes={data.bikes} selected={data.selectedBikeId} basePath="/historique" />
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
  return (
    <Suspense fallback={null}>
      <HistoriqueContent />
    </Suspense>
  );
}
