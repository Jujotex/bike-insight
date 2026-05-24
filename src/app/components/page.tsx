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
          {/* ── Desktop table ─────────────────────────────── */}
          <BiCard pad={0} style={{ display: "none" }} className="bi-desktop-block">
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 660 }}>
                <div style={{ display: "grid", gridTemplateColumns: "40px 1.5fr 1fr 1fr 140px 80px 80px", padding: "8px 22px", gap: 14, fontSize: 10.5, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--bi-line)" }}>
                  <span></span><span>Composant</span><span>Vélo</span><span>Statut</span><span>Progression</span>
                  <span style={{ textAlign: "right" }}>Km</span><span style={{ textAlign: "right" }}>Coût</span>
                </div>
                {components.map((c) => {
                  const color = STATUS_COLORS[c.status] ?? "var(--bi-muted)";
                  const wearPct = (c.wear_pct as number) ?? 0;
                  return (
                    <Link key={c.id} href={`/components/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "40px 1.5fr 1fr 1fr 140px 80px 80px", padding: "14px 22px", gap: 14, alignItems: "center", borderBottom: "1px solid var(--bi-line)", cursor: "pointer" }}>
                        <Dot color={color} size={8} />
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>{c.brand ?? "—"}</div>
                        </div>
                        <span style={{ fontSize: 12.5, color: "var(--bi-muted)" }}>{bikeNames[c.bike_id as string] ?? c.bike_name ?? "—"}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color, fontWeight: 600 }}>
                          <span>{STATUS_LABELS[c.status] ?? c.status}</span>
                          {c.wear_pct !== null && <Mono style={{ fontSize: 11, fontWeight: 400, color: "var(--bi-muted)" }}>· {Math.round(wearPct)} %</Mono>}
                        </div>
                        <ProgressBar value={Math.min(wearPct / 100, 1)} color={color} height={4} />
                        <Mono style={{ fontSize: 12, color: "var(--bi-muted)", textAlign: "right" }}>{(c.km_used as number ?? 0).toLocaleString("fr-FR")}</Mono>
                        <Mono style={{ fontSize: 12.5, fontWeight: 500, textAlign: "right" }}>{c.purchase_price !== null ? `${c.purchase_price} €` : "—"}</Mono>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </BiCard>

          {/* ── Mobile cards ──────────────────────────────── */}
          <div className="bi-mobile-flex" style={{ flexDirection: "column", gap: 10 }}>
            {components.map((c) => {
              const color = STATUS_COLORS[c.status] ?? "var(--bi-muted)";
              const wearPct = (c.wear_pct as number) ?? 0;
              return (
                <Link key={c.id} href={`/components/${c.id}`} style={{ textDecoration: "none" }}>
                  <BiCard pad={16}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <Dot color={color} size={8} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                        <div style={{ fontSize: 11.5, color: "var(--bi-muted)" }}>{bikeNames[c.bike_id as string] ?? c.bike_name ?? "—"}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{STATUS_LABELS[c.status] ?? c.status}</div>
                    </div>
                    <ProgressBar value={Math.min(wearPct / 100, 1)} color={color} height={5} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11.5, color: "var(--bi-muted)" }}>
                      <Mono>{Math.round(wearPct)} % usure</Mono>
                      <Mono>{(c.km_used as number ?? 0).toLocaleString("fr-FR")} km</Mono>
                      <Mono>{c.purchase_price !== null ? `${c.purchase_price} €` : "—"}</Mono>
                    </div>
                  </BiCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
