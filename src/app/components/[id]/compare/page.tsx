import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, Dot, PageHead } from "@/components/bi/ui";
import { ReplaceButton } from "@/components/bi/replace-button";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { findCatalogEntry, getCatalogForTemplate, TIER_LABELS, TIER_DESC, type CatalogProduct } from "@/lib/components-catalog";
import { BIKE_TEMPLATES } from "@/lib/bike-templates";

const CATEGORY_LABELS: Record<string, string> = {
  transmission: "Transmission",
  freinage: "Freinage",
  suspension: "Suspension",
  roues: "Roues",
  cockpit: "Cockpit",
  eclairage: "Éclairage",
  autre: "Autre",
};

// Fallback générique si aucun catalogue ne correspond
function buildGenericOptions(price: number | null, kmMax: number) {
  const basePrice = price ?? 40;
  const baseKm = kmMax > 0 ? kmMax : 3000;
  return [
    { name: "~" + Math.round(basePrice * 0.7) + " €", brand: "Estimation", price: Math.round(basePrice * 0.7), lifeKm: Math.round(baseKm * 0.85), tier: "budget" as const, note: "Fourchette basse estimée — vérifier la compatibilité avec ton modèle" },
    { name: "~" + basePrice + " €", brand: "Estimation", price: basePrice, lifeKm: baseKm, tier: "original" as const, note: "Équivalent à ton composant actuel, prix estimé à partir de ton historique" },
    { name: "~" + Math.round(basePrice * 1.75) + " €", brand: "Estimation", price: Math.round(basePrice * 1.75), lifeKm: Math.round(baseKm * 1.5), tier: "premium" as const, note: "Fourchette haute estimée — durée de vie potentiellement allongée" },
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

  if (!comp) redirect("/bikes");

  const { data: bike } = await supabase
    .from("bikes")
    .select("name, total_km, groupset_template_id")
    .eq("id", comp.bike_id)
    .single();

  const wearPct = Math.min(Math.round((comp.wear_pct as number) ?? 0), 100);
  const kmUsed = Math.round((comp.km_used as number) ?? 0);
  const kmMax = Math.round((comp.km_max as number) ?? 0);
  const kmRemaining = Math.max(0, kmMax - kmUsed);
  const installedDate = comp.installed_at
    ? new Date(comp.installed_at as string).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const status = comp.status as string;
  const statusColor = status === "bad" ? "var(--bi-bad)" : status === "warn" ? "var(--bi-warn)" : "var(--bi-ok)";
  const urgencyLabel = status === "bad" ? "URGENT" : status === "warn" ? "À SURVEILLER" : "OK";

  // Vie restante estimée
  let daysLabel = "—";
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
    daysLabel = "Dépassé";
  }

  // ── Catalogue ──────────────────────────────────────────────
  // Priorité au groupe enregistré du vélo (fiable), fallback sur la détection par mots-clés
  const bikeTemplate = bike?.groupset_template_id
    ? BIKE_TEMPLATES.find(t => t.id === bike.groupset_template_id) ?? null
    : null;
  const catalogEntry = bikeTemplate
    ? getCatalogForTemplate(comp.name as string, comp.category as string, bikeTemplate.brand, bikeTemplate.speeds, bikeTemplate.bikeTypes, bikeTemplate.id)
      ?? findCatalogEntry(comp.name as string, comp.category as string)
    : findCatalogEntry(comp.name as string, comp.category as string);
  const products: CatalogProduct[] = catalogEntry
    ? catalogEntry.products
    : buildGenericOptions(comp.purchase_price as number | null, kmMax);

  const tiers = ["budget", "original", "premium"] as const;
  const options = tiers.map(tier => products.find(p => p.tier === tier) ?? products[0]);
  const recommended = options[1]; // original = recommandé

  // Km par an estimé à partir de l'usage réel
  const ageDaysReal = comp.installed_at
    ? (Date.now() - new Date(comp.installed_at as string).getTime()) / (1000 * 60 * 60 * 24)
    : 365;
  const kmPerYear = ageDaysReal > 30 ? Math.round((kmUsed / ageDaysReal) * 365) : 3000;

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 1100 }}>
        <PageHead
          title={"Remplacer : " + (comp.name as string)}
          sub={(bike?.name ?? "Ton vélo") + " · basé sur " + kmPerYear.toLocaleString("fr") + " km/an"}
          actions={
            <Link href={"/components/" + id}>
              <button style={{ padding: "10px 16px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}>
                ← Retour
              </button>
            </Link>
          }
        />

        {/* Banner compatibilité détectée ou avertissement */}
        {catalogEntry ? (
          <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 14, background: "var(--bi-accent-soft)", border: "1px solid rgba(199,255,63,0.25)", display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="2.5" strokeLinecap="round"><path d="M4 12l5 5L20 7"/></svg>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--bi-ink)" }}>
                {bikeTemplate ? `Basé sur ton groupe ${bikeTemplate.label} — ` : "Compatibilité détectée — "}
              </span>
              <span style={{ fontSize: 13, color: "var(--bi-muted)" }}>{catalogEntry.compatNote}</span>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 14, background: "var(--bi-warn-soft)", border: "1px solid rgba(208,132,21,0.25)", display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bi-warn)" strokeWidth="2" strokeLinecap="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--bi-ink)" }}>Estimations génériques — </span>
              <span style={{ fontSize: 13, color: "var(--bi-muted)" }}>Cette pièce n&apos;est pas dans le catalogue. Les prix et durées sont des estimations — consulte ton vélociste.</span>
            </div>
          </div>
        )}

        {/* Context card */}
        <div style={{ background: "var(--bi-card)", borderRadius: 18, border: "1px solid var(--bi-line)", overflow: "hidden", marginBottom: 22 }}>
          <div className="bi-compare-context">
            <div style={{ padding: "20px 22px" }}>
              <BiLabel>Pièce actuelle</BiLabel>
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 4, height: 32, background: statusColor, borderRadius: 2 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{comp.name as string}</div>
                  <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>
                    {CATEGORY_LABELS[comp.category as string] ?? String(comp.category)} · installé le {installedDate}
                  </div>
                </div>
              </div>
            </div>
            <div className="bi-compare-context-divider" style={{ height: 56, background: "var(--bi-line)" }} />
            <div style={{ padding: "20px 22px" }}>
              <BiLabel>Usure</BiLabel>
              <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 4 }}>
                <Mono style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.6 }}>{kmUsed.toLocaleString("fr")}</Mono>
                <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>{kmMax > 0 ? " / " + kmMax.toLocaleString("fr") + " km" : " km"}</span>
              </div>
              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Dot color={statusColor} size={5} />
                <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, letterSpacing: 0.6 }}>{urgencyLabel} · {wearPct}%</span>
              </div>
            </div>
            <div className="bi-compare-context-divider" style={{ height: 56, background: "var(--bi-line)" }} />
            <div style={{ padding: "20px 22px" }}>
              <BiLabel>Vie restante</BiLabel>
              <div style={{ marginTop: 8 }}>
                <Mono style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.6, color: statusColor }}>{daysLabel}</Mono>
              </div>
              <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>
                {kmRemaining > 0 ? "~" + kmRemaining.toLocaleString("fr") + " km restants" : "Dépassé"}
              </div>
            </div>
          </div>
        </div>

        {/* 3 option cards */}
        <div className="bi-compare-options">
          {options.map((o, idx) => {
            const isReco = idx === 1;
            const costPerKm = o.price / o.lifeKm;
            const annual = Math.round(costPerKm * kmPerYear);

            return (
              <div key={o.tier} style={{
                position: "relative",
                background: isReco ? "var(--bi-ink)" : "var(--bi-card)",
                color: isReco ? "var(--bi-white)" : "var(--bi-ink)",
                borderRadius: 18,
                border: isReco ? "1.5px solid var(--bi-ink)" : "1px solid var(--bi-line)",
                padding: 24,
                display: "flex", flexDirection: "column",
              }}>
                {isReco && (
                  <div style={{ position: "absolute", top: -10, left: 24, padding: "3px 8px", background: "var(--bi-accent)", color: "var(--bi-accent-ink)", borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>
                    RECOMMANDÉ
                  </div>
                )}

                {/* Tier label */}
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase" as const, color: isReco ? "var(--bi-accent)" : "var(--bi-muted)" }}>
                  {TIER_LABELS[o.tier]}
                </div>

                {/* Nom produit */}
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.4, marginTop: 6, lineHeight: 1.2 }}>{o.name}</div>

                {/* Marque + référence */}
                {(o.brand || o.reference) && (
                  <div style={{ fontSize: 12, color: isReco ? "rgba(255,255,255,0.55)" : "var(--bi-muted)", marginTop: 4 }}>
                    {o.brand}{o.reference ? ` · ${o.reference}` : ""}
                  </div>
                )}

                {/* Prix */}
                <div style={{ marginTop: 20, paddingBottom: 16, borderBottom: "1px solid " + (isReco ? "rgba(255,255,255,0.1)" : "var(--bi-line)") }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <Mono style={{ fontSize: 40, fontWeight: 500, letterSpacing: -1.4, lineHeight: 1 }}>{o.price}</Mono>
                    <span style={{ fontSize: 15, color: isReco ? "rgba(255,255,255,0.5)" : "var(--bi-muted)", fontFamily: "var(--bi-font-mono)" }}>€</span>
                  </div>
                  <div style={{ fontSize: 11, color: isReco ? "rgba(255,255,255,0.4)" : "var(--bi-muted)", marginTop: 4 }}>{TIER_DESC[o.tier]}</div>
                </div>

                {/* Stats */}
                <div style={{ paddingTop: 14, paddingBottom: 16, borderBottom: "1px solid " + (isReco ? "rgba(255,255,255,0.1)" : "var(--bi-line)"), display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    ["Durée estimée", o.lifeKm.toLocaleString("fr") + " km"],
                    ["Coût annuel (" + kmPerYear.toLocaleString("fr") + " km)", annual + " €"],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: isReco ? "rgba(255,255,255,0.55)" : "var(--bi-muted)" }}>{k}</span>
                      <Mono style={{ fontSize: 13, fontWeight: 500 }}>{v}</Mono>
                    </div>
                  ))}
                </div>

                {/* Note / conseil */}
                {o.note && (
                  <div style={{ paddingTop: 14, flex: 1, fontSize: 12, color: isReco ? "rgba(255,255,255,0.65)" : "var(--bi-muted)", lineHeight: 1.5 }}>
                    {o.note}
                  </div>
                )}

                {/* CTA */}
                <div style={{ marginTop: 20 }}>
                  <ReplaceButton
                    componentId={id}
                    bikeId={comp.bike_id as string}
                    componentName={(comp.name as string).split(" · ")[0]}
                    componentCategory={comp.category as string}
                    currentBikeKm={bike?.total_km ?? 0}
                    componentPrice={o.price}
                    label="Choisir cette option"
                    fullWidth
                    variant={isReco ? "accent" : "default"}
                    newComponentName={o.name}
                    newComponentBrand={o.brand || undefined}
                    newComponentKmMax={o.lifeKm}
                  />
                </div>
              </div>
            );
          })}
        </div>


        {/* Repli honnête : pour les freins, la réf exacte dépend de l'étrier */}
        {(comp.category as string) === "freinage" && (
          <div style={{ marginBottom: 22, padding: "14px 16px", borderRadius: 14, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>
            <div style={{ fontSize: 13, color: "var(--bi-muted)", lineHeight: 1.55 }}>
              <strong style={{ color: "var(--bi-ink)" }}>Comment être sûr :</strong> le modèle exact de plaquette dépend de ton étrier. Vérifie le code gravé au dos de la plaquette usée — <strong style={{ color: "var(--bi-ink)" }}>L03A / K02S</strong> = route, <strong style={{ color: "var(--bi-ink)" }}>M06 / B01S</strong> = VTT. En cas de doute, ton vélociste l&apos;identifie en 30 secondes.
            </div>
          </div>
        )}

        {/* Raisonnement + prochaines étapes */}
        <div className="bi-grid-split">
          <BiCard pad={22} style={{ borderLeft: "3px solid var(--bi-accent)" }}>
            <BiLabel style={{ marginBottom: 10 }}>Pourquoi cette recommandation</BiLabel>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              {catalogEntry
                ? (<><strong>{recommended.name}</strong> est la référence directe compatible avec ton groupe. C'est le meilleur rapport durée de vie / prix pour ton usage de {kmPerYear.toLocaleString("fr")} km/an.</>)
                : (<><strong>L'option équivalente</strong> est la plus équilibrée. Elle correspond au niveau de ton composant actuel et son cycle d'usure est maîtrisé.</>)
              }
            </div>
            {catalogEntry && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "var(--bi-bg)", fontSize: 12, color: "var(--bi-muted)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--bi-ink)" }}>Si tu roules plus de 5 000 km/an,</strong> l'option premium devient plus rentable grâce à sa durée de vie accrue.
              </div>
            )}
          </BiCard>

          <BiCard pad={22}>
            <BiLabel style={{ marginBottom: 14 }}>Prochaines étapes</BiLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {([
                { n: "1", label: "Commande la pièce (chez ton vélociste ou en ligne)" },
                { n: "2", label: "Fais-la poser ou installe-la toi-même", href: `/components/${id}/tuto`, linkLabel: "Voir le tuto et les options" },
                { n: "3", label: "Marque-la comme installée dans Bike Insight" },
                { n: "4", label: "Le suivi d'usure reprend automatiquement" },
              ] as { n: string; label: string; href?: string; linkLabel?: string }[]).map(({ n, label, href, linkLabel }) => (
                <div key={n} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 999, background: "var(--bi-bg)", border: "1px solid var(--bi-line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 600, fontFamily: "var(--bi-font-mono)" }}>{n}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 13, lineHeight: 1.45 }}>{label}</span>
                    {href && (
                      <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--bi-ink)", textDecoration: "none" }}>
                        {linkLabel}
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18 }}>
              <ReplaceButton
                componentId={id}
                bikeId={comp.bike_id as string}
                componentName={(comp.name as string).split(" · ")[0]}
                componentCategory={comp.category as string}
                currentBikeKm={bike?.total_km ?? 0}
                componentPrice={recommended.price}
                label="Marquer comme remplacé (recommandé)"
                fullWidth
                newComponentName={recommended.name}
                newComponentBrand={recommended.brand || undefined}
                newComponentKmMax={recommended.lifeKm}
              />
            </div>
          </BiCard>
        </div>

      </div>
    </AppShell>
  );
}
