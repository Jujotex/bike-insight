"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState, PageHead } from "@/components/bi/ui";
import { SkelCard } from "@/components/bi/skeleton";
import { NewComponentForm } from "@/components/bi/new-component-form";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";
import { useAsyncData } from "@/lib/use-async-data";
import { routes } from "@/lib/routes";

/**
 * Ajout d'une pièce — converti en composant client (phase 2.1, lot 2).
 *
 * Page fine : une seule requête, la liste des vélos, passée au formulaire qui était
 * déjà client. Le `<Suspense>` d'origine entourait le formulaire (il lit les
 * paramètres d'URL) ; il est conservé pour la même raison.
 */
function NewComponentContent() {
  const router = useRouter();
  const bikeId = useSearchParams().get("bike_id");

  const load = useCallback(async () => {
    const userId = await getCurrentUserId();
    if (!userId) {
      router.replace("/login");
      return null;
    }
    const { data } = await supabase
      .from("bikes")
      .select("id, name, total_km, groupset_template_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("total_km", { ascending: false });
    return data ?? [];
  }, [router]);

  const { data: bikes, loading, error } = useAsyncData(load, []);

  const currentBike = bikeId ? bikes?.find((b) => (b.id as string) === bikeId) : null;

  return (
    <div className="bi-page">
      <PageHead
        title="Ajouter une pièce"
        breadcrumb={
          currentBike
            ? [{ label: currentBike.name as string, href: routes.bikeTab(bikeId as string, "pieces") }, "Nouvelle pièce"]
            : [{ label: "Mes vélos", href: routes.bikes() }, "Nouvelle pièce"]
        }
        sub="L'usure sera calculée automatiquement à partir de tes sorties Strava."
      />
      {loading && !bikes ? (
        <SkelCard h={360} />
      ) : error ? (
        <EmptyState
          title="Chargement impossible"
          text="La liste de tes vélos n'a pas pu être récupérée. Vérifie ta connexion et réessaie."
        />
      ) : bikes ? (
        <NewComponentForm bikes={bikes} />
      ) : null}
    </div>
  );
}

export default function NewComponentPage() {
  return (
    <Suspense fallback={null}>
      <NewComponentContent />
    </Suspense>
  );
}
