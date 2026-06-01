import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "./client";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Vélos de l'utilisateur
  const { data: bikes } = await supabase
    .from("bikes")
    .select("id, name, brand, model, total_km, strava_gear_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("total_km", { ascending: false });

  return (
    <OnboardingWizard
      userId={user.id}
      bikes={(bikes ?? []).map(b => ({
        id: b.id as string,
        name: b.name as string,
        brand: (b.brand as string | null) ?? undefined,
        model: (b.model as string | null) ?? undefined,
        totalKm: (b.total_km as number) ?? 0,
        isStrava: !!(b.strava_gear_id as string | null),
      }))}
    />
  );
}
