import { PageHead } from "@/components/bi/ui";
import { NewComponentForm } from "@/components/bi/new-component-form";
import { createSupabaseServerClient, getCachedUser } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function NewComponentPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getCachedUser();
  if (!user) redirect("/login");

  const { data: bikes } = await supabase
    .from("bikes")
    .select("id, name, total_km, groupset_template_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("total_km", { ascending: false });

  return (
    <>
      <div className="bi-page">
        <PageHead
          title="Ajouter une pièce"
          breadcrumb={["Pièces", "Nouvelle"]}
          sub="L'usure sera calculée automatiquement à partir de tes sorties Strava."
        />
        <Suspense fallback={null}>
          <NewComponentForm bikes={bikes ?? []} />
        </Suspense>
      </div>
    </>
  );
}
