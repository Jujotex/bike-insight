"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState, PageHead } from "@/components/bi/ui";
import { SkelCard } from "@/components/bi/skeleton";
import { EditComponentForm } from "@/components/bi/edit-component-form";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";
import { useAsyncData } from "@/lib/use-async-data";

/**
 * Modification d'une pièce — converti en composant client (phase 2.1, lot 2).
 *
 * Les deux requêtes restent séquentielles : le nom du vélo dépend du `bike_id`
 * de la pièce, on ne peut pas les paralléliser.
 */
/** Modification d'une pièce. Identifiant via `?id=` — voir `lib/routes.ts`. */
function EditComponentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const load = useCallback(async () => {
    const userId = await getCurrentUserId();
    if (!userId) {
      router.replace("/login");
      return null;
    }

    const { data: comp } = await supabase
      .from("component_stats")
      .select("id, name, brand, category, purchase_price, installed_at, installed_km, km_max, bike_id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!comp) {
      router.replace("/bikes");
      return null;
    }

    const { data: bike } = await supabase
      .from("bikes")
      .select("name")
      .eq("id", comp.bike_id)
      .single();

    return {
      id: comp.id as string,
      name: comp.name as string,
      brand: comp.brand as string | null,
      category: comp.category as string,
      purchase_price: comp.purchase_price as number | null,
      installed_at: comp.installed_at as string | null,
      installed_km: comp.installed_km as number | null,
      km_max: comp.km_max as number | null,
      bike_name: (bike?.name as string | null) ?? null,
    };
  }, [id, router]);

  const { data: component, loading, error } = useAsyncData(load, [id]);

  if (loading && !component) {
    return (
      <div className="bi-page">
        <PageHead title="Modifier le composant" breadcrumb={["Composants", "…"]} sub="" />
        <SkelCard h={420} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bi-page">
        <PageHead title="Modifier le composant" sub="" />
        <EmptyState
          title="Chargement impossible"
          text="La pièce n'a pas pu être récupérée. Vérifie ta connexion et réessaie."
        />
      </div>
    );
  }

  if (!component) return null; // redirection en cours

  return (
    <div className="bi-page">
      <PageHead
        title="Modifier le composant"
        breadcrumb={["Composants", component.name, "Modifier"]}
        sub="Les km d&apos;usure seront recalculés automatiquement."
      />
      <EditComponentForm component={component} />
    </div>
  );
}

export default function EditComponentPage() {
  return (
    <Suspense fallback={null}>
      <EditComponentContent />
    </Suspense>
  );
}
