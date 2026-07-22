import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { PageHead } from "@/components/bi/ui";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { MaintenanceEditClient, type EditType } from "./client";

export default async function MaintenanceTypePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ bike?: string }>;
}) {
  const { slug } = await params;
  const { bike } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isNew = slug === "new";

  const { data: bikes } = await supabase
    .from("bikes")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("total_km", { ascending: false });
  const bikeList = (bikes ?? []).map((b) => ({ id: b.id as string, name: b.name as string }));

  let bikeId = bike && bikeList.some((b) => b.id === bike) ? bike : bikeList[0]?.id ?? "";
  let type: EditType = null;

  if (!isNew) {
    let q = supabase
      .from("maintenance_types")
      .select("id, bike_id, slug, label, sub, interval_km, interval_months, default_cost")
      .eq("user_id", user.id)
      .eq("slug", slug);
    if (bike) q = q.eq("bike_id", bike);
    const { data } = await q.limit(1).maybeSingle();
    if (!data) redirect(`/reglages/entretiens${bike ? `?bike=${bike}` : ""}`);
    type = data as EditType;
    bikeId = (data as { bike_id: string }).bike_id;
  }

  if (!bikeId) redirect("/reglages/entretiens");
  const bikeName = bikeList.find((b) => b.id === bikeId)?.name ?? "";

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page">
        <PageHead
          title={isNew ? "Nouvel entretien" : (type?.label ?? "Entretien")}
          sub={bikeName ? `Vélo : ${bikeName}` : undefined}
          breadcrumb={["Réglages", "Entretiens", isNew ? "Nouveau" : (type?.label ?? "")]}
        />
        <MaintenanceEditClient userId={user.id} bikeId={bikeId} type={type} />
      </div>
    </AppShell>
  );
}
