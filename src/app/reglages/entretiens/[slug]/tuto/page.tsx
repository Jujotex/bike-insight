import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { Mono } from "@/components/bi/ui";
import { VelocisteFinder } from "@/components/bi/velociste-finder";
import Link from "next/link";
import { BackButton } from "@/components/bi/back-button";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { findMaintenanceTuto } from "@/lib/maintenance-tutos";
import { DIFFICULTY_LABELS, DIFFICULTY_LEVEL, DIFFICULTY_COLOR, formatRepairTime } from "@/lib/repair-guides";
import { redirect } from "next/navigation";

export default async function MaintenanceTutoPage({
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

  const tuto = findMaintenanceTuto(slug);

  let q = supabase
    .from("maintenance_types")
    .select("bike_id, slug, label, default_cost")
    .eq("user_id", user.id)
    .eq("slug", slug);
  if (bike) q = q.eq("bike_id", bike);
  const { data: type } = await q.limit(1).maybeSingle();

  const backHref = `/reglages/entretiens/${slug}${bike ? `?bike=${bike}` : ""}`;
  // Pas de tuto dédié (entretien personnalisé) → on renvoie sur la fiche de l'entretien.
  if (!tuto) redirect(backHref);

  const bikeId = (type as { bike_id?: string } | null)?.bike_id ?? bike ?? "";
  const label = (type as { label?: string } | null)?.label ?? "Entretien";
  const defaultCost = (type as { default_cost?: number | null } | null)?.default_cost ?? null;

  const { data: bikeRow } = bikeId
    ? await supabase.from("bikes").select("name").eq("id", bikeId).single()
    : { data: null };
  const bikeName = (bikeRow as { name?: string } | null)?.name ?? "Ton vélo";

  const diffColor = DIFFICULTY_COLOR[tuto.difficulty];
  const diffLevel = DIFFICULTY_LEVEL[tuto.difficulty];
  const labor = tuto.laborMin != null && tuto.laborMax != null
    ? `${tuto.laborMin}–${tuto.laborMax}`
    : (defaultCost != null ? `${defaultCost}` : null);

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page">
        {/* Retour + fil d'ariane */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div className="bi-tuto-crumb" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--bi-muted)" }}>
            <Link href={`/reglages/entretiens${bike ? `?bike=${bike}` : ""}`} style={{ color: "var(--bi-muted)", textDecoration: "none" }}>Entretiens</Link>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
            <Link href={backHref} style={{ color: "var(--bi-muted)", textDecoration: "none" }}>{label}</Link>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
            <span style={{ color: "var(--bi-ink)" }}>Tuto</span>
          </div>
          <BackButton fallback={backHref} />
        </div>

        {/* Héros */}
        <div className="bi-tuto-hero" style={{ background: "var(--bi-ink)", color: "var(--bi-white)", borderRadius: 18, padding: 28, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--bi-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--bi-accent-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--bi-accent)" }}>Comment le faire</div>
              <div className="bi-tuto-hero-title" style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, marginTop: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: "var(--bi-white)", opacity: 0.6, marginTop: 4 }}>{bikeName} · Entretien</div>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--bi-white)", opacity: 0.5 }}>Difficulté</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} style={{ width: 22, height: 6, borderRadius: 999, background: n <= diffLevel ? diffColor : "var(--bi-white)", opacity: n <= diffLevel ? 1 : 0.18 }} />
                ))}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: diffColor }}>{DIFFICULTY_LABELS[tuto.difficulty]}</span>
            </div>
          </div>
        </div>

        {/* Deux options */}
        <div className="bi-grid-2" style={{ marginBottom: 22 }}>
          {/* DIY */}
          <div style={{ background: "var(--bi-card)", borderRadius: 18, border: "1px solid var(--bi-line)", padding: "22px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--bi-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Je le fais moi-même</div>
                <div style={{ fontSize: 12, color: "var(--bi-muted)" }}>Ton temps, ton matériel</div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--bi-muted)", marginBottom: 2 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                Temps
              </div>
              <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.6 }}>{tuto.timeMax > 0 ? formatRepairTime(tuto.timeMin, tuto.timeMax) : "En atelier"}</Mono>
            </div>

            <div style={{ marginTop: "auto" }}>
              <a
                href={tuto.tutorialUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--bi-accent)", color: "var(--bi-accent-ink)", borderRadius: 14, padding: "12px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none", width: "100%", boxSizing: "border-box" }}
              >
                Voir le tuto sur {tuto.tutorialSource}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>
              </a>
            </div>
          </div>

          {/* Vélociste */}
          <div style={{ background: "var(--bi-card)", borderRadius: 18, border: "1px solid var(--bi-line)", padding: "22px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: "var(--bi-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bi-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M3 9h18"/><path d="M9 9v3a3 3 0 0 1-6 0"/><path d="M15 9v3a3 3 0 0 1-6 0"/><path d="M21 9v3a3 3 0 0 1-6 0"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Je passe chez le vélociste</div>
                <div style={{ fontSize: 12, color: "var(--bi-muted)" }}>Rapide et sans matériel</div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--bi-muted)", marginBottom: 2 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.2 7a6 7 0 1 0 0 10"/><path d="M13 10H5"/><path d="M13 14H5"/></svg>
                Main-d&apos;œuvre
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.6 }}>{labor ?? "—"}</Mono>
                {labor && <span style={{ fontSize: 15, color: "var(--bi-muted)" }}>€</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>{labor ? "Indicatif, hors pièces" : "Généralement fait soi-même"}</div>
            </div>

            <div style={{ borderTop: "1px solid var(--bi-line)", paddingTop: 18 }}>
              <VelocisteFinder />
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ fontSize: 11, color: "var(--bi-muted)", lineHeight: 1.6 }}>
          Temps et prix sont des ordres de grandeur pour t&apos;aider à décider — pas un devis ni un tutoriel officiel.
          Le tuto est hébergé par {tuto.tutorialSource}.
        </div>
      </div>
    </AppShell>
  );
}
