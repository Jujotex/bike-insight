import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, PageHead } from "@/components/bi/ui";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  findRepairGuide,
  DIFFICULTY_LABELS,
  DIFFICULTY_DESC,
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

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 900 }}>
        <PageHead
          title={guide.operation}
          breadcrumb={["Composants", comp.name as string, "Tuto"]}
          sub={(comp.name as string) + " · " + (bike?.name ?? "Ton vélo")}
          actions={
            <Link href={"/components/" + id}>
              <button style={{ padding: "10px 16px", background: "transparent", border: "1px solid var(--bi-line)", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", color: "var(--bi-muted)" }}>
                ← Retour
              </button>
            </Link>
          }
        />

        {/* Bandeau contexte : difficulté + temps indicatif */}
        <div style={{ marginBottom: 22, borderRadius: 18, border: "1px solid var(--bi-line)", overflow: "hidden", background: "var(--bi-card)" }}>
          <div className="bi-grid-2" style={{ gap: 1, background: "var(--bi-line)" }}>
            <div style={{ background: "var(--bi-card)", padding: "20px 22px" }}>
              <BiLabel style={{ fontSize: 10 }}>Difficulté</BiLabel>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6 }}>{DIFFICULTY_LABELS[guide.difficulty]}</div>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>{DIFFICULTY_DESC[guide.difficulty]}</div>
            </div>
            <div style={{ background: "var(--bi-card)", padding: "20px 22px" }}>
              <BiLabel style={{ fontSize: 10 }}>Temps estimé (soi-même)</BiLabel>
              <Mono style={{ fontSize: 16, fontWeight: 500, display: "block", marginTop: 6 }}>{formatRepairTime(guide.timeMin, guide.timeMax)}</Mono>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>{categoryLabel} · ordre de grandeur</div>
            </div>
          </div>
        </div>

        {/* Arbitrage détaillé : DIY vs vélociste */}
        <div style={{ borderRadius: 18, border: "1px solid var(--bi-line)", overflow: "hidden", background: "var(--bi-card)", marginBottom: 22 }}>
          <div style={{ padding: "22px 22px 12px" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Deux façons de s&apos;y prendre</div>
            <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>Compare le temps et le matériel avec le coût atelier, puis choisis.</div>
          </div>
          <div className="bi-grid-2" style={{ gap: 1, background: "var(--bi-line)", borderTop: "1px solid var(--bi-line)" }}>
            {/* DIY */}
            <div style={{ background: "var(--bi-card)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <BiLabel style={{ fontSize: 10 }}>Je le fais moi-même</BiLabel>
                <div style={{ marginTop: 8, display: "flex", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--bi-muted)" }}>Temps</div>
                    <Mono style={{ fontSize: 14, fontWeight: 500 }}>{formatRepairTime(guide.timeMin, guide.timeMax)}</Mono>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--bi-muted)" }}>Niveau</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{DIFFICULTY_LABELS[guide.difficulty]}</div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--bi-muted)", marginBottom: 6 }}>Outils indicatifs</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {guide.tools.map((t) => (
                    <span key={t} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 999, background: "var(--bi-bg)", color: "var(--bi-muted)", border: "1px solid var(--bi-line)", fontWeight: 600 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <a
                href={guide.tutorialUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--bi-ink)", color: "var(--bi-bg)", borderRadius: 14, padding: "10px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
              >
                Voir le tuto sur {guide.tutorialSource}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></svg>
              </a>
            </div>
            {/* Vélociste */}
            <div style={{ background: "var(--bi-card)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <BiLabel style={{ fontSize: 10 }}>Je passe chez le vélociste</BiLabel>
                <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 6 }}>
                  <Mono style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.6 }}>{guide.laborMin}–{guide.laborMax}</Mono>
                  <span style={{ fontSize: 13, color: "var(--bi-muted)" }}>€</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>Main-d&apos;œuvre indicative, hors pièces</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--bi-muted)", lineHeight: 1.5 }}>
                À privilégier si tu n&apos;as pas le matériel, en cas de doute sur le réglage, ou pour les pièces qui demandent de l&apos;outillage spécifique.
              </div>
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
