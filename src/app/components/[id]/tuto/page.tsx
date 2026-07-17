import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { Mono } from "@/components/bi/ui";
import { VelocisteFinder } from "@/components/bi/velociste-finder";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  findRepairGuide,
  DIFFICULTY_LABELS,
  DIFFICULTY_DESC,
  DIFFICULTY_LEVEL,
  DIFFICULTY_COLOR,
  formatRepairTime,
} from "@/lib/repair-guides";
import { redirect } from "next/navigation";

const CATEGORY_LABELS: Record<string, string> = {
  transmission: "Transmission",
  freinage: "Freinage",
  suspension: "Suspension",
  roues: "Roues",
  cockpit: "Cockpit",
  eclairage: "Éclairage",
  autre: "Autre",
};

export default async function TutoPage({
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
    .select("name")
    .eq("id", comp.bike_id)
    .single();

  const guide = findRepairGuide(comp.name as string, comp.category as string);
  const categoryLabel = CATEGORY_LABELS[comp.category as string] ?? String(comp.category);
  const diffColor = DIFFICULTY_COLOR[guide.difficulty];
  const diffLevel = DIFFICULTY_LEVEL[guide.difficulty];

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page bi-page-narrow">
        {/* Barre de retour + fil d'ariane */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <div className="bi-tuto-crumb" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--bi-muted)" }}>
            <Link href="/bikes" style={{ color: "var(--bi-muted)", textDecoration: "none" }}>Composants</Link>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
            <Link href={"/components/" + id} style={{ color: "var(--bi-muted)", textDecoration: "none" }}>{comp.name as string}</Link>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
            <span style={{ color: "var(--bi-ink)" }}>Tuto</span>
          </div>
          <Link href={"/components/" + id}>
            <button style={{ padding: "10px 16px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}>
              ← Retour
            </button>
          </Link>
        </div>

        {/* ── Héros : encre + accent lime ─────────────────────────── */}
        <div className="bi-tuto-hero" style={{ background: "var(--bi-ink)", color: "var(--bi-white)", borderRadius: 18, padding: 28, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Pastille outil accent */}
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--bi-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--bi-accent-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--bi-accent)" }}>Prochaine étape</div>
              <div className="bi-tuto-hero-title" style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, marginTop: 4 }}>{guide.operation}</div>
              <div style={{ fontSize: 13, color: "var(--bi-white)", opacity: 0.6, marginTop: 4 }}>{comp.name as string} · {bike?.name ?? "Ton vélo"} · {categoryLabel}</div>
            </div>
          </div>
          {/* Jauge de difficulté */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--bi-white)", opacity: 0.5 }}>Difficulté</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3].map((n) => (
                  <div key={n} style={{ width: 22, height: 6, borderRadius: 999, background: n <= diffLevel ? diffColor : "var(--bi-white)", opacity: n <= diffLevel ? 1 : 0.18 }} />
                ))}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: diffColor }}>{DIFFICULTY_LABELS[guide.difficulty]}</span>
            </div>
          </div>
        </div>

        {/* ── Deux options ────────────────────────────────────────── */}
        <div className="bi-grid-2" style={{ marginBottom: 22 }}>
          {/* DIY — mise en avant accent */}
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

            <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--bi-muted)", marginBottom: 2 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                  Temps
                </div>
                <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.6 }}>{formatRepairTime(guide.timeMin, guide.timeMax)}</Mono>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "var(--bi-muted)", marginBottom: 8 }}>Outils indicatifs</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {guide.tools.map((t) => (
                  <span key={t} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: "var(--bi-bg)", color: "var(--bi-muted)", border: "1px solid var(--bi-line)", fontWeight: 600 }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              <a
                href={guide.tutorialUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--bi-accent)", color: "var(--bi-accent-ink)", borderRadius: 14, padding: "12px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
              >
                {guide.generic ? "Voir les tutos d'entretien" : "Voir le tuto"} sur {guide.tutorialSource}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>
              </a>
              {guide.generic && (
                <div style={{ fontSize: 11, color: "var(--bi-muted)", lineHeight: 1.4 }}>
                  Pas de tuto dédié pour cette pièce — page d&apos;entretien générale.
                </div>
              )}
            </div>
          </div>

          {/* Vélociste — neutre */}
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
                <Mono style={{ fontSize: 28, fontWeight: 500, letterSpacing: -0.6 }}>{guide.laborMin}–{guide.laborMax}</Mono>
                <span style={{ fontSize: 15, color: "var(--bi-muted)" }}>€</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>Indicatif, hors pièces</div>
            </div>

            <div style={{ fontSize: 12, color: "var(--bi-muted)", lineHeight: 1.5, padding: "12px 14px", background: "var(--bi-bg)", borderRadius: 14 }}>
              À privilégier si tu n&apos;as pas l&apos;outillage, en cas de doute sur le réglage, ou pour les pièces qui demandent des outils spécifiques.
            </div>

            <div style={{ borderTop: "1px solid var(--bi-line)", paddingTop: 18 }}>
              <VelocisteFinder />
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ fontSize: 11, color: "var(--bi-muted)", lineHeight: 1.6 }}>
          Temps, outils et prix sont des ordres de grandeur pour t&apos;aider à décider — pas un devis ni un tutoriel officiel.
          Le tuto est hébergé par {guide.tutorialSource}. Pense à vérifier la compatibilité de la pièce avant de commander.
        </div>
      </div>
    </AppShell>
  );
}
