import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, Dot, PageHead } from "@/components/bi/ui";
import { ReplaceButton } from "@/components/bi/replace-button";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

const CATEGORY_LABELS: Record<string, string> = {
  transmission: "Transmission",
  freinage: "Freinage",
  suspension: "Suspension",
  roues: "Roues",
  cockpit: "Cockpit",
  eclairage: "Eclairage",
  autre: "Autre",
};

// Generate 3 replacement tiers based on component data
function buildOptions(price: number | null, kmMax: number, name: string) {
  const basePrice = price ?? 40;
  const baseKm = kmMax > 0 ? kmMax : 3000;

  return [
    {
      id: "budget",
      badge: "Budget",
      label: "Option economique",
      price: Math.round(basePrice * 0.7),
      lifeKm: Math.round(baseKm * 0.85),
      costPerKm: (basePrice * 0.7) / (baseKm * 0.85),
      annual: Math.round((basePrice * 0.7) / (baseKm * 0.85) * 3000),
      pros: ["Economique", "Compatible standard"],
      cons: ["Duree de vie plus courte", "Garantie reduite"],
      stock: "2 jours",
      warranty: "6 mois",
      recommended: false,
    },
    {
      id: "recommended",
      badge: "Recommande",
      label: "Meme modele",
      price: basePrice,
      lifeKm: baseKm,
      costPerKm: basePrice / baseKm,
      annual: Math.round((basePrice / baseKm) * 3000),
      pros: ["Modele que tu connais", "Meilleur cycle d'usure", "En stock"],
      cons: [],
      stock: "En stock",
      warranty: "1 an",
      recommended: true,
    },
    {
      id: "premium",
      badge: "Premium",
      label: "Haut de gamme",
      price: Math.round(basePrice * 1.75),
      lifeKm: Math.round(baseKm * 1.5),
      costPerKm: (basePrice * 1.75) / (baseKm * 1.5),
      annual: Math.round(((basePrice * 1.75) / (baseKm * 1.5)) * 3000),
      pros: ["Duree +50%", "Plus silencieux", "Meilleure performance"],
      cons: ["Investissement initial", "Sur commande"],
      stock: "5-7 jours",
      warranty: "2 ans",
      recommended: false,
    },
  ];
}

export default async function ComparePage({
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
  const kmUsed = Math.round((comp.km_used as number) ?? 0);
  const kmMax = Math.round((comp.km_max as number) ?? 0);
  const kmRemaining = Math.max(0, kmMax - kmUsed);
  const installedDate = comp.installed_at
    ? new Date(comp.installed_at as string).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "-";
  const status = comp.status as string;
  const statusColor = status === "bad" ? "var(--bi-bad)" : status === "warn" ? "var(--bi-warn)" : "var(--bi-ok)";
  const urgencyLabel = status === "bad" ? "URGENT" : status === "warn" ? "A SURVEILLER" : "OK";

  // Estimated days remaining
  let daysLabel = "-";
  if (kmRemaining > 0 && kmUsed > 0 && comp.installed_at) {
    const ageDays = (Date.now() - new Date(comp.installed_at as string).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > 0) {
      const kmPerDay = kmUsed / ageDays;
      const daysLeft = Math.round(kmRemaining / kmPerDay);
      if (daysLeft < 7) daysLabel = "~ " + daysLeft + " j";
      else if (daysLeft < 30) daysLabel = "~ " + Math.round(daysLeft / 7) + " sem.";
      else daysLabel = "~ " + Math.round(daysLeft / 30) + " mois";
    }
  } else if (kmRemaining === 0 && kmMax > 0) {
    daysLabel = "0 j restants";
  }

  const options = buildOptions(comp.purchase_price as number | null, kmMax, comp.name as string);
  const recommended = options[1];

  const tableRows = [
    ["Duree estimee", options.map(o => o.lifeKm.toLocaleString("fr") + " km")],
    ["Prix d'achat", options.map(o => o.price + " EUR")],
    ["Cout par km", options.map(o => o.costPerKm.toFixed(3) + " EUR")],
    ["Cout annuel equiv.", options.map(o => o.annual + " EUR")],
    ["Disponibilite", options.map(o => o.stock)],
    ["Garantie", options.map(o => o.warranty)],
  ];

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 1100 }}>
        <PageHead
          title={"Remplacer : " + (comp.name as string)}
          breadcrumb={["Composants", comp.name as string, "Remplacer"]}
          sub={"3 options pour " + (bike?.name ?? "ton velo") + " · estimations a 3 000 km/an"}
          actions={
            <Link href={"/components/" + id}>
              <button style={{ padding: "9px 16px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}>
                Retour
              </button>
            </Link>
          }
        />

        {/* Context card */}
        <div style={{ background: "var(--bi-card)", borderRadius: 16, border: "1px solid var(--bi-line)", overflow: "hidden", marginBottom: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1px 1fr 1px 1fr", alignItems: "center" }}>
            <div style={{ padding: "18px 22px" }}>
              <BiLabel>Composant actuel</BiLabel>
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 4, height: 32, background: statusColor, borderRadius: 2 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{comp.name as string}</div>
                  <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>
                    {CATEGORY_LABELS[comp.category as string] ?? String(comp.category)} · installe le {installedDate}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ height: 56, background: "var(--bi-line)" }} />
            <div style={{ padding: "18px 22px" }}>
              <BiLabel>Usure</BiLabel>
              <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 4 }}>
                <Mono style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.6 }}>{kmUsed.toLocaleString("fr")}</Mono>
                <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>{kmMax > 0 ? " / " + kmMax.toLocaleString("fr") + " km" : " km"}</span>
              </div>
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Dot color={statusColor} size={5} />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: statusColor, letterSpacing: 0.6 }}>{urgencyLabel} · {wearPct}%</span>
              </div>
            </div>
            <div style={{ height: 56, background: "var(--bi-line)" }} />
            <div style={{ padding: "18px 22px" }}>
              <BiLabel>Vie restante</BiLabel>
              <div style={{ marginTop: 8 }}>
                <Mono style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.6, color: statusColor }}>{daysLabel}</Mono>
              </div>
              <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>
                {kmRemaining > 0 ? "~" + kmRemaining.toLocaleString("fr") + " km restants" : "Depasse"}
              </div>
            </div>
          </div>
        </div>

        {/* 3 option cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
          {options.map(o => {
            const isReco = o.recommended;
            return (
              <div key={o.id} style={{
                position: "relative",
                background: isReco ? "var(--bi-ink)" : "var(--bi-card)",
                color: isReco ? "#fff" : "var(--bi-ink)",
                borderRadius: 18,
                border: isReco ? "1.5px solid var(--bi-ink)" : "1px solid var(--bi-line)",
                padding: 24,
                display: "flex", flexDirection: "column",
              }}>
                {isReco && (
                  <div style={{ position: "absolute", top: -10, left: 24, padding: "4px 10px", background: "var(--bi-accent)", color: "var(--bi-accent-ink)", borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>
                    RECOMMANDE POUR TOI
                  </div>
                )}

                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" as const, color: isReco ? "var(--bi-accent)" : "var(--bi-muted)" }}>{o.badge}</div>
                <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: -0.5, marginTop: 6 }}>{o.label}</div>
                <div style={{ fontSize: 11.5, color: isReco ? "rgba(255,255,255,0.55)" : "var(--bi-muted)", marginTop: 2 }}>{o.stock}</div>

                {/* Price */}
                <div style={{ marginTop: 24, paddingBottom: 18, borderBottom: "1px solid " + (isReco ? "rgba(255,255,255,0.08)" : "var(--bi-soft-line)") }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <Mono style={{ fontSize: 44, fontWeight: 500, letterSpacing: -1.4, lineHeight: 1 }}>{o.price}</Mono>
                    <span style={{ fontSize: 16, color: isReco ? "rgba(255,255,255,0.55)" : "var(--bi-muted)", fontFamily: "var(--bi-font-mono)" }}>EUR</span>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ paddingTop: 14, paddingBottom: 16, borderBottom: "1px solid " + (isReco ? "rgba(255,255,255,0.08)" : "var(--bi-soft-line)"), display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ["Duree estimee", o.lifeKm.toLocaleString("fr") + " km"],
                    ["Cout / km", o.costPerKm.toFixed(3) + " EUR"],
                    ["Cout annuel", o.annual + " EUR"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11.5, color: isReco ? "rgba(255,255,255,0.55)" : "var(--bi-muted)" }}>{k}</span>
                      <Mono style={{ fontSize: 13, fontWeight: 500 }}>{v}</Mono>
                    </div>
                  ))}
                </div>

                {/* Pros/Cons */}
                <div style={{ paddingTop: 14, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  {o.pros.map(p => (
                    <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, lineHeight: 1.45 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isReco ? "var(--bi-accent)" : "var(--bi-ok)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M4 12l5 5L20 7"/></svg>
                      {p}
                    </div>
                  ))}
                  {o.cons.map(c => (
                    <div key={c} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: isReco ? "rgba(255,255,255,0.55)" : "var(--bi-muted)", lineHeight: 1.45 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M18 6L6 18M6 6l12 12"/></svg>
                      {c}
                    </div>
                  ))}
                </div>

                {/* CTA → goes to replace flow */}
                <div style={{ marginTop: 20 }}>
                  <ReplaceButton
                    componentId={id}
                    bikeId={comp.bike_id as string}
                    componentName={(comp.name as string).split(" - ")[0]}
                    componentCategory={comp.category as string}
                    currentBikeKm={bike?.total_km ?? 0}
                    componentPrice={o.price}
                    label={"Choisir cette option"}
                    fullWidth
                    variant={isReco ? "accent" : "default"}
                  />
                </div>

                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: 10.5, color: isReco ? "rgba(255,255,255,0.5)" : "var(--bi-muted)", fontFamily: "var(--bi-font-mono)" }}>
                  <span>Stock : {o.stock}</span>
                  <span>Garantie {o.warranty}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed comparison table */}
        <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.4 }}>Comparaison detaillee</div>
            <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>Sur la base de ton rythme actuel · 3 000 km/an</div>
          </div>
        </div>

        <BiCard pad={0} style={{ marginBottom: 22 }}>
          <div style={{ padding: "14px 22px 12px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 14, fontSize: 10.5, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" as const, borderBottom: "1px solid var(--bi-soft-line)" }}>
            <span></span>
            {options.map(o => (
              <span key={o.id} style={{ textAlign: "center", color: o.recommended ? "var(--bi-ink)" : "var(--bi-muted)" }}>
                {o.recommended ? "Recommande" : o.badge}
              </span>
            ))}
          </div>
          {tableRows.map(([label, vals], i) => (
            <div key={i} style={{ padding: "14px 22px", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 14, alignItems: "center", borderBottom: i === tableRows.length - 1 ? "none" : "1px solid var(--bi-soft-line)" }}>
              <span style={{ fontSize: 12.5, color: "var(--bi-muted)" }}>{label as string}</span>
              {(vals as string[]).map((v, j) => (
                <span key={j} style={{ fontSize: 13, fontWeight: j === 1 ? 600 : 500, textAlign: "center", fontFamily: "var(--bi-font-mono)", background: j === 1 ? "rgba(14,14,16,0.025)" : "transparent", padding: "6px 0", borderRadius: 6 }}>
                  {v}
                </span>
              ))}
            </div>
          ))}
        </BiCard>

        {/* Reasoning + Next steps */}
        <div className="bi-grid-split">
          <BiCard pad={22} style={{ borderLeft: "3px solid var(--bi-accent)" }}>
            <BiLabel style={{ marginBottom: 10 }}>Notre raisonnement</BiLabel>
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>
              <strong>L&apos;option recommandee</strong> est la plus equilibree pour ton usage. Tu connais deja ce composant ({comp.name as string}), son cycle d&apos;usure est maitrise et le rapport cout/km est optimal a 3 000 km/an.
            </div>
            <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "var(--bi-bg)", fontSize: 12, color: "var(--bi-muted)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--bi-ink)" }}>Si tu roules plus de 5 000 km/an,</strong> l&apos;option premium devient plus rentable grace a sa duree de vie accrue.
            </div>
          </BiCard>

          <BiCard pad={22}>
            <BiLabel style={{ marginBottom: 14 }}>Action apres ton choix</BiLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["1", "Commande la piece (chez ton vendeur habituel)"],
                ["2", "Pose-la toi-meme ou demande a ton mecano"],
                ["3", "Marque-la comme installee dans Bike Insight"],
                ["4", "L'app reprend le suivi automatiquement"],
              ].map(([n, label]) => (
                <div key={n} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 999, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 600, fontFamily: "var(--bi-font-mono)" }}>{n}</div>
                  <span style={{ fontSize: 13, lineHeight: 1.45 }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
              <ReplaceButton
                componentId={id}
                bikeId={comp.bike_id as string}
                componentName={(comp.name as string).split(" - ")[0]}
                componentCategory={comp.category as string}
                currentBikeKm={bike?.total_km ?? 0}
                componentPrice={recommended.price}
                label="Marquer comme remplace (recommande)"
                fullWidth
              />
            </div>
          </BiCard>
        </div>

      </div>
    </AppShell>
  );
}
