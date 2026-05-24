import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, Dot, PageHead } from "@/components/bi/ui";
import { ArchiveButton } from "@/components/bi/archive-button";
import { ReplaceButton } from "@/components/bi/replace-button";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
  archived: "var(--bi-muted)",
};

const STATUS_LABELS: Record<string, string> = {
  ok: "En bon état",
  warn: "À surveiller",
  bad: "À remplacer",
  archived: "Archivé",
};

const CATEGORY_LABELS: Record<string, string> = {
  transmission: "Transmission",
  freinage: "Freinage",
  suspension: "Suspension",
  roues: "Roues",
  cockpit: "Cockpit",
  eclairage: "Éclairage",
  autre: "Autre",
};

export default async function ComponentDetailPage({
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
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!comp) redirect("/components");

  const { data: bike } = await supabase
    .from("bikes")
    .select("name, total_km")
    .eq("id", comp.bike_id)
    .single();

  const wearPct = Math.min(Math.round((comp.wear_pct as number) ?? 0), 100);
  const statusColor = STATUS_COLORS[comp.status as string] ?? "var(--bi-muted)";
  const statusLabel = STATUS_LABELS[comp.status as string] ?? comp.status;
  const kmUsed = Math.round((comp.km_used as number) ?? 0);
  const kmMax = Math.round((comp.km_max as number) ?? 0);
  const kmRemaining = Math.max(0, kmMax - kmUsed);
  const installedDate = comp.installed_at
    ? new Date(comp.installed_at as string).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const costPerKm = (comp.cost_per_km as number | null);

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 1100 }}>
        <PageHead
          title={`${comp.name as string}`}
          breadcrumb={["Composants", comp.name as string]}
          sub={`${CATEGORY_LABELS[comp.category as string] ?? comp.category} · installé le ${installedDate}`}
          actions={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={`/components/${id}/edit`}>
                <button style={{ padding: "9px 16px", background: "var(--bi-card)", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-ink)", display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Modifier
                </button>
              </Link>
              {(comp.status as string) !== "archived" && (
                <ReplaceButton
                  componentId={id}
                  bikeId={comp.bike_id as string}
                  componentName={(comp.name as string).split(" · ")[0]}
                  componentCategory={comp.category as string}
                  currentBikeKm={bike?.total_km ?? 0}
                  componentPrice={comp.purchase_price as number | null}
                />
              )}
              <ArchiveButton componentId={id} isArchived={(comp.status as string) === "archived"} />
            </div>
          }
        />

        <div className="bi-grid-split" style={{ marginBottom: 14 }}>
          {/* Hero dark card */}
          <div style={{
            background: "#0E0E10", color: "#fff", borderRadius: 18, padding: 32,
            position: "relative", overflow: "hidden",
            borderLeft: `4px solid ${statusColor}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: statusColor, letterSpacing: "0.07em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                  <Dot color={statusColor} size={6} /> {statusLabel}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                  {bike?.name ?? "Vélo inconnu"}
                </div>
              </div>
              <Mono style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                {(comp.category as string) ? CATEGORY_LABELS[comp.category as string] ?? comp.category : "—"}
              </Mono>
            </div>

            <div style={{ marginTop: 32, display: "flex", alignItems: "baseline", gap: 10 }}>
              <Mono style={{ fontSize: 100, fontWeight: 400, letterSpacing: -4, lineHeight: 1 }}>
                {kmMax > 0 ? wearPct : "—"}
              </Mono>
              {kmMax > 0 && <Mono style={{ fontSize: 28, color: "rgba(255,255,255,0.45)" }}>%</Mono>}
              <div style={{ flex: 1 }} />
              {kmMax > 0 && (
                <div style={{ textAlign: "right" }}>
                  <Mono style={{ display: "block", fontSize: 20, fontWeight: 500 }}>
                    {kmUsed.toLocaleString("fr")} / {kmMax.toLocaleString("fr")}
                  </Mono>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                    km · ~{kmRemaining.toLocaleString("fr")} km restants
                  </span>
                </div>
              )}
            </div>

            {kmMax > 0 && (
              <>
                <div style={{ marginTop: 22, height: 5, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ width: `${wearPct}%`, height: "100%", background: statusColor, borderRadius: 999, transition: "width 0.5s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-jetbrains-mono)" }}>
                  <span>0 km</span>
                  <span>{Math.round(kmMax / 3).toLocaleString("fr")}</span>
                  <span>{Math.round(kmMax * 2 / 3).toLocaleString("fr")}</span>
                  <span>{kmMax.toLocaleString("fr")} km</span>
                </div>
              </>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Status card */}
            <div style={{
              padding: 22,
              border: `1.5px solid ${statusColor}`,
              borderRadius: 16,
              background: (comp.status as string) === "bad" ? "rgba(200,54,46,0.04)" :
                (comp.status as string) === "warn" ? "rgba(208,132,21,0.04)" : "rgba(14,143,90,0.04)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Dot color={statusColor} size={7} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: statusColor, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  {statusLabel}
                </span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.45 }}>
                {(comp.status as string) === "bad" && "Composant à remplacer maintenant."}
                {(comp.status as string) === "warn" && "Surveille ce composant — il approche de sa limite."}
                {(comp.status as string) === "ok" && "Ce composant est en bon état."}
                {(comp.status as string) === "archived" && "Ce composant a été archivé."}
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--bi-line)", borderRadius: 14, overflow: "hidden" }}>
              {[
                ["Prix d'achat", comp.purchase_price !== null ? `${comp.purchase_price} €` : "—"],
                ["Coût / km", costPerKm !== null ? `${(costPerKm as number).toFixed(3)} €` : "—"],
                ["Km parcourus", `${kmUsed.toLocaleString("fr")} km`],
                ["Km restants", kmMax > 0 ? `~${kmRemaining.toLocaleString("fr")} km` : "—"],
              ].map(([k, v]) => (
                <div key={String(k)} style={{ background: "var(--bi-card)", padding: "14px 16px" }}>
                  <BiLabel style={{ fontSize: 10 }}>{k}</BiLabel>
                  <Mono style={{ display: "block", fontSize: 16, fontWeight: 500, marginTop: 4 }}>{v as string}</Mono>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes / info */}
        <BiCard pad={24}>
          <BiLabel style={{ marginBottom: 14 }}>Informations</BiLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {[
              ["Vélo", bike?.name ?? "—"],
              ["Catégorie", CATEGORY_LABELS[comp.category as string] ?? (comp.category as string)],
              ["Installé le", installedDate],
              ["Km vélo à l'install.", comp.installed_km !== null ? `${Math.round(comp.installed_km as number).toLocaleString("fr")} km` : "—"],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <BiLabel style={{ fontSize: 10 }}>{k}</BiLabel>
                <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 6 }}>{v as string}</div>
              </div>
            ))}
          </div>
        </BiCard>
      </div>
    </AppShell>
  );
}
