"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState, PageHead } from "@/components/bi/ui";
import { SkelCard } from "@/components/bi/skeleton";
import { supabase } from "@/lib/supabase";
import { useAsyncData } from "@/lib/use-async-data";
import { MaintenanceSettingsClient, type MaintenanceTypeRow } from "./client";

/**
 * Réglages des entretiens — converti en composant client (phase 2.1, lot 3).
 *
 * `<Suspense>` requis : la page lit `?bike=` via `useSearchParams`.
 *
 * Le paramètre d'URL ne fait que fixer la sélection **initiale** — la suite est
 * gérée par l'état interne de `MaintenanceSettingsClient`. Il n'est donc pas dans
 * les dépendances du chargement : le remettre relancerait une requête à chaque
 * changement de vélo, pour des données qui ne changent pas.
 */
function MaintenanceSettingsContent() {
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

    const [{ data: bikes }, { data: types }] = await Promise.all([
      supabase
        .from("bikes")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("total_km", { ascending: false }),
      supabase
        .from("maintenance_types")
        .select("id, bike_id, slug, label, sub, interval_km, interval_months, default_cost, sort_order")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true }),
    ]);

    const bikeList = (bikes ?? []).map((b) => ({ id: b.id as string, name: b.name as string }));

    return {
      bikes: bikeList,
      types: (types ?? []) as MaintenanceTypeRow[],
      initialBikeId:
        requestedBike && bikeList.some((b) => b.id === requestedBike)
          ? requestedBike
          : bikeList[0]?.id ?? "",
    };
  }, [requestedBike, router]);

  const { data, loading, error } = useAsyncData(load, []);

  return (
    <div className="bi-page">
      <PageHead
        title="Entretiens"
        sub="Personnalise les types d'entretien et leurs échéances, vélo par vélo"
        breadcrumb={["Réglages", "Entretiens"]}
      />
      {loading && !data ? (
        <SkelCard h={420} />
      ) : error ? (
        <EmptyState
          title="Chargement impossible"
          text="Tes réglages n'ont pas pu être récupérés. Vérifie ta connexion et réessaie."
        />
      ) : data ? (
        <MaintenanceSettingsClient
          bikes={data.bikes}
          types={data.types}
          initialBikeId={data.initialBikeId}
        />
      ) : null}
    </div>
  );
}

export default function MaintenanceSettingsPage() {
  return (
    <Suspense fallback={null}>
      <MaintenanceSettingsContent />
    </Suspense>
  );
}
