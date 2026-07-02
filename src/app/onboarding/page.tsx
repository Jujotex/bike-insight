import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./client";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ bike_id?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { bike_id: preselectedBikeId } = await searchParams;

  // Vélos de l'utilisateur
  const { data: bikes } = await supabase
    .from("bikes")
    .select("id, name, brand, model, total_km, strava_gear_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("total_km", { ascending: false });

  // Vélos qui ont déjà des composants actifs
  const { data: configuredBikes } = await supabase
    .from("components")
    .select("bike_id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const configuredBikeIds = new Set((configuredBikes ?? []).map(c => c.bike_id as string));

  const bikeList = (bikes ?? []).map(b => ({
    id: b.id as string,
    name: b.name as string,
    brand: (b.brand as string | null) ?? undefined,
    model: (b.model as string | null) ?? undefined,
    totalKm: (b.total_km as number) ?? 0,
    isStrava: !!(b.strava_gear_id as string | null),
    isConfigured: configuredBikeIds.has(b.id as string),
  }));

  return (
    <OnboardingWizard
      userId={user.id}
      bikes={bikeList}
      preselectedBikeId={preselectedBikeId}
    />
  );
}
