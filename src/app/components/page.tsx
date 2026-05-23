import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Mono, Dot, ProgressBar, PageHead } from "@/components/bi/ui";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getComponentsData } from "@/lib/data";

const STATUS_COLORS: Record<string, string> = {
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
};

const STATUS_LABELS: Record<string, string> = {
  ok: "OK",
  warn: "Surveiller",
  bad: "Remplacer",
};

export default async function ComponentsPage() {
  const data = await getComponentsData();
  if (!data) redirect("/login");

  const { components, bikes } = data;

  // Map bike id → name for display
  const bikeNames = Object.fromEntries(
    bikes.map((b: { id: string; name: string }) => [b.id, b.name])
  );

  const badCount = components.filter((c) => c.status === "bad").length;
  const warnCount = components.filter((c) => c.status === "warn").length;
  const bikeCount = new Set(components.map((c) => c.bike_id)).size;

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 1100 }}>
        <PageHead
          title="Composants"
          sub={`${components.length} composant${components.length !== 1 ? "s" : ""} suivi${components.length !== 1 ? "s" : ""} sur ${bikeCount} vélo${bikeCount !== 1 ? "s" : ""}`}
          actions={
            <Link href="/components/new">
              <button style={{ padding: "9px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                Déclarer un composant
              </button>
            </Link>
          }
        />

        {/* Alertes rapides */}
        {(badCount > 0 || warnCount > 0) && (
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            {badCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(200,54,46,0.08)", borderRadius: 10, fontSize: 12.5, color: "var(--bi-bad)", fontWeight: 600 }}>
                <Dot color="var(--bi-bad)" size={6} />
                {badCount} à remplacer
              </div>
            )}
            {warnCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(208,132,21,0.08)", borderRadius: 10, fontSize: 12.5, color: "var(--bi-warn)", fontWeight: 600 }}>
                <Dot color="var(--bi-warn)" size={6} />
                {warnCount} à surveiller
              </div>
            )}
          </div>
        )}

        {components.length === 0 ? (
          <BiCard pad={40}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Aucun composant encore</div>
              <div style={{ fontSize: 13, color: "var(--bi-muted)", marginBottom: 20 }}>Ajoute tes premières pièces pour suivre leur usure et leur coût.</div>
              <Link href="/components/new">
                <button style={{ padding: "10px 20px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                  Ajouter un composant
                </button>
              </Link>
            </div>
          </BiCard>
        ) : (
          <BiCard pad={0}>
            <div style={{ display: "grid", gridTemplateColumns: "40px 1.5fr 1fr 1fr 140px 80px 80px", padding: "8px 22px", gap: 14, fontSize: 10.5, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--bi-line)" }}>
              <span></span>
              <span