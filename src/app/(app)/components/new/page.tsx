"use client";

import { Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, PageHead } from "@/components/bi/ui";
import { SkelCard } from "@/components/bi/skeleton";
import { NewComponentForm } from "@/components/bi/new-component-form";
import { supabase } from "@/lib/supabase";
import { useAsyncData } from "@/lib/use-async-data";

/**
 * Ajout d'une pièce — converti en composant client (phase 2.1, lot 2).
 *
 * Page fine : une seule requête, la liste des vélos, passée au formulaire qui était
 * déjà client. Le `<Suspense>` d'origine entourait le formulaire (il lit les
 * paramètres d'URL) ; il est conservé pour la même raison.
 */
function NewComponentContent() {
  const router = useRouter();

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return null;
    }
    const { data } = await supabase
      .from("bikes")
      .select("id, name, total_km, groupset_template_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("total_km", { ascending: false });
    return data ?? [];
  }, [router]);

  const { data: bikes, loading, error } = useAsyncData(load, []);

  return (
    <div className="bi-page">
      <PageHead
        title="Ajouter une pièce"
        breadcrumb={["Pièces", "Nouvelle"]}
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
