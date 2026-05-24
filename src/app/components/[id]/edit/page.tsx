import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { PageHead } from "@/components/bi/ui";
import { EditComponentForm } from "@/components/bi/edit-component-form";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function EditComponentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: comp } = await supabase
    .from("component_stats")
    .select("id, name, brand, category, purchase_price, installed_at, installed_km, km_max, bike_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!comp) redirect("/components");

  const { data: bike } = await supabase
    .from("bikes")
    .select("name")
    .eq("id", comp.bike_id)
    .single();

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 900 }}>
        <PageHead
          title="Modifier le composant"
          breadcrumb={["Composants", comp.name as string, "Modifier"]}
          sub="Les km d&apos;usure seront recalculés automatiquement."
        />
        <EditComponentForm
          component={{
            id: comp.id as string,
            name: comp.name as string,
            brand: comp.brand as string | null,
            category: comp.category as string,
            purchase_price: comp.purchase_price as number | null,
            installed_at: comp.installed_at as string | null,
            installed_km: comp.installed_km as number | null,
            km_max: comp.km_max as number | null,
            bike_name: bike?.name ?? null,
          }}
        />
      </div>
    </AppShell>
  );
}
