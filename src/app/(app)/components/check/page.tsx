"use client";

import { Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState, PageHead } from "@/components/bi/ui";
import { SkelCard } from "@/components/bi/skeleton";
import { ComponentCheckForm } from "@/components/bi/component-check-form";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/current-user";
import { useAsyncData } from "@/lib/use-async-data";
import { routes } from "@/lib/routes";

/**
 * Contrôle d'une pièce. Identifiant via `?id=` — voir `lib/routes.ts`.
 *
 * Écran de sortie de secours du moteur d'usure : quand l'utilisateur a vérifié
 * la pièce de ses mains et sait qu'elle tient encore, il le déclare ici plutôt
 * que de subir une alerte à laquelle il ne croit plus.
 */
function ComponentCheckContent() {
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
      .select("id, name, km_used, km_max, status, bike_id")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!comp) {
      router.replace("/bikes");
      return null;
    }

    // Une pièce archivée ne se contrôle plus : elle n'est plus sur le vélo.
    if (comp.status === "archived") {
      router.replace(routes.component(id));
      return null;
    }

    const { data: bike } = await supabase
      .from("bikes")
      .select("name, total_km")
      .eq("id", comp.bike_id as string)
      .maybeSingle();

    return {
      id: comp.id as string,
      name: comp.name as string,
      bike_id: comp.bike_id as string,
      bike_name: (bike?.name as string | null) ?? null,
      bike_total_km: (bike?.total_km as number | null) ?? 0,
      km_used: (comp.km_used as number | null) ?? 0,
      km_max: comp.km_max as number | null,
    };
  }, [id, router]);

  const { data: component, loading, error } = useAsyncData(load, [id]);

  if (loading && !component) {
    return (
      <div className="bi-page">
        <PageHead title="Contrôle" breadcrumb={["Composants", "…"]} sub="" />
        <SkelCard h={420} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bi-page">
        <PageHead title="Contrôle" sub="" />
        <EmptyState
          title="Chargement impossible"
          text="La pièce n'a pas pu être récupérée. Vérifie ta connexion et réessaie."
        />
      </div>
    );
  }

  if (!component) return null; // redirection en cours

  // Sans durée de vie déclarée, il n'y a rien à prolonger — et aucune alerte à
  // corriger. On renvoie vers l'écran qui règle vraiment le problème.
  if (!component.km_max || component.km_max <= 0) {
    return (
      <div className="bi-page">
        <PageHead
          title="Contrôle"
          breadcrumb={[
            { label: component.bike_name ?? "Vélo", href: routes.bikeTab(component.bike_id, "pieces") },
            { label: component.name, href: routes.component(component.id) },
            "Contrôle",
          ]}
          sub=""
        />
        <EmptyState
          title="Aucune durée de vie déclarée"
          text="Cette pièce n'a pas d'estimation de durée de vie : il n'y a donc pas d'usure à corriger. Renseigne-la d'abord."
        />
        <div style={{ marginTop: 16 }}>
          <Link href={routes.componentEdit(component.id)} style={{ fontSize: 13, fontWeight: 600, color: "var(--bi-ink)" }}>
            Modifier la pièce →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bi-page">
      <PageHead
        title="Contrôle effectué"
        breadcrumb={[
          { label: component.bike_name ?? "Vélo", href: routes.bikeTab(component.bike_id, "pieces") },
          { label: component.name, href: routes.component(component.id) },
          "Contrôle",
        ]}
        sub="Tu as vérifié la pièce : dis à Bike Insight ce qu'elle a encore dans le ventre."
      />
      <ComponentCheckForm component={component} />
    </div>
  );
}

export default function ComponentCheckPage() {
  return (
    <Suspense fallback={null}>
      <ComponentCheckContent />
    </Suspense>
  );
}
