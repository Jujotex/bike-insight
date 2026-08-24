"use client";

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAsyncData } from "@/lib/use-async-data";
import { OnboardingWizard } from "./client";

/**
 * Onboarding — converti en composant client (phase 2.1, lot 3).
 *
 * Les deux requêtes étaient séquentielles alors qu'elles sont indépendantes :
 * elles partent maintenant en parallèle.
 *
 * Pas d'écran d'erreur ici, contrairement aux autres pages : l'onboarding est le
 * premier contact avec l'app, un message d'échec y ferait plus de mal qu'un
 * simple écran vide. En cas de problème, le rechargement suffit.
 */
function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBikeId = searchParams.get("bike_id") ?? undefined;

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return null;
    }

    const [{ data: bikes }, { data: configuredBikes }] = await Promise.all([
      supabase
        .from("bikes")
        .select("id, name, brand, model, total_km, strava_gear_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("total_km", { ascending: false }),
      supabase
        .from("components")
        .select("bike_id")
        .eq("user_id", user.id)
        .eq("is_active", true),
    ]);

    const configuredBikeIds = new Set((configuredBikes ?? []).map((c) => c.bike_id as string));

    return {
      userId: user.id,
      bikes: (bikes ?? []).map((b) => ({
        id: b.id as string,
        name: b.name as string,
        brand: (b.brand as string | null) ?? undefined,
        model: (b.model as string | null) ?? undefined,
        totalKm: (b.total_km as number) ?? 0,
        isStrava: !!(b.strava_gear_id as string | null),
        isConfigured: configuredBikeIds.has(b.id as string),
      })),
    };
  }, [router]);

  const { data } = useAsyncData(load, []);

  if (!data) return null;

  return (
    <OnboardingWizard
      userId={data.userId}
      bikes={data.bikes}
      preselectedBikeId={preselectedBikeId}
    />
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}
