"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, PageHead } from "@/components/bi/ui";
import { SkelCard } from "@/components/bi/skeleton";
import { supabase } from "@/lib/supabase";
import { useAsyncData } from "@/lib/use-async-data";
import { getDashboardData } from "@/lib/data";
import { DashboardClient } from "./client";

/**
 * Dashboard — converti en composant client (phase 2.1, lot 4).
 *
 * Dernier écran de la migration avec la page Coût. `getDashboardData` reçoit
 * désormais son client Supabase en paramètre, ce qui la rend appelable depuis le
 * navigateur.
 *
 * Le prénom vient des métadonnées de session : plus besoin de le remonter depuis
 * la fonction de chargement, il est disponible directement.
 */
export default function DashboardPage() {
  const router = useRouter();

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return null;
    }
    const result = await getDashboardData(supabase, user.id);
    if (!result) return null;
    return {
      ...result,
      userName: (user.user_metadata?.full_name as string)?.split(" ")[0] ?? "toi",
    };
  }, [router]);

  const { data, loading, error } = useAsyncData(load, []);

  if (loading && !data) {
    return (
      <div className="bi-page">
        <SkelCard h={120} style={{ marginBottom: 14 }} />
        <SkelCard h={220} style={{ marginBottom: 14 }} />
        <SkelCard h={280} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bi-page">
        <PageHead title="Tableau de bord" sub="" />
        <EmptyState
          title="Chargement impossible"
          text="Tes données n'ont pas pu être récupérées. Vérifie ta connexion et réessaie."
        />
      </div>
    );
  }

  if (!data) return null; // redirection vers /login en cours

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="bi-page" style={{ opacity: loading ? 0.6 : 1, transition: "opacity 120ms" }}>
      <DashboardClient
        userName={data.userName}
        todayCap={today.charAt(0).toUpperCase() + today.slice(1)}
        bikes={data.bikes as unknown as Array<Record<string, unknown>>}
        readinessByBike={data.readinessByBike}
        attentionItems={data.attentionItems}
        okItems={data.okItems}
        predictions={data.predictions}
        maintenanceAlerts={data.maintenanceAlerts}
        maintenanceSummaryByBike={data.maintenanceSummaryByBike}
        km12mByBike={data.km12mByBike}
        rides12mByBike={data.rides12mByBike}
      />
    </div>
  );
}
