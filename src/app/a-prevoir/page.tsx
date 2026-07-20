// « À prévoir » — tout ce qui demande une action, tous vélos confondus.
//
// Aide à la décision, pas annuaire de tutos : chaque ligne part d'une pièce
// ou d'un entretien RÉEL de l'utilisateur, et lui donne de quoi trancher
// « je le fais moi-même » vs « je passe chez le vélociste » (difficulté,
// temps, outils, fourchette main-d'œuvre).
//
// Aucune requête propre : `getDashboardData` remonte déjà `attentionItems`
// (pièces warn/bad, tous vélos) et `maintenanceAlerts` (entretiens dus).

import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { BiCard, BiLabel, Dot, Mono, PageHead } from "@/components/bi/ui";
import { BikePicker } from "@/components/bi/bike-picker";
import { getDashboardData } from "@/lib/data";
import {
  findRepairGuide,
  DIFFICULTY_LABELS,
  DIFFICULTY_LEVEL,
  DIFFICULTY_COLOR,
  formatRepairTime,
} from "@/lib/repair-guides";
import { redirect } from "next/navigation";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  transmission: "Transmission",
  freinage: "Freinage",
  suspension: "Suspension",
  roues: "Pneumatiques",
  cockpit: "Cockpit",
  eclairage: "Éclairage",
  autre: "Autre",
};

function urgencyLabel(weeksUntil: number | null, status: string): string {
  if (status === "bad") return "Maintenant";
  if (weeksUntil === null) return "À surveiller";
  if (weeksUntil <= 0) return "Maintenant";
  if (weeksUntil === 1) return "1 sem.";
  if (weeksUntil < 5) return `${weeksUntil} sem.`;
  return `${Math.round(weeksUntil / 4)} mois`;
}

export default async function UpcomingPage({
  searchParams,
}: {
  searchParams: Promise<{ bike?: string }>;
}) {
  const { bike } = await searchParams;
  const data = await getDashboardData();
  if (!data) redirect("/login");

  const { bikes, attentionItems, maintenanceAlerts } = data;

  const allBikes = (bikes ?? []).map((b) => ({
    id: b.id as string,
    name: b.name as string,
  }));
  // Un id de vélo inconnu (lien périmé, vélo archivé) est ignoré plutôt que
  // de produire une page vide sans explication.
  const selectedBikeId =
    bike && allBikes.some((b) => b.id === bike) ? bike : null;

  const parts = attentionItems
    .filter((a) => !selectedBikeId || a.bikeId === selectedBikeId)
    .map((a) => ({ ...a, guide: findRepairGuide(a.name, a.category) }));

  const maintenance = maintenanceAlerts.filter(
    (m) => !selectedBikeId || m.bikeId === selectedBikeId
  );

  const nothingToDo = parts.length === 0 && maintenance.length === 0;

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page">
        <PageHead
          title="À prévoir"
          sub="Ce qui demande une action, et ce que ça implique."
        />

        <BikePicker
          bikes={allBikes}
          selected={selectedBikeId}
          basePath="/a-prevoir"
          allLabel="Tous les vélos"
        />

        {nothingToDo ? (
          <BiCard pad={40} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              Rien à prévoir pour l&apos;instant
            </div>
            <div style={{ fontSize: 13, color: "var(--bi-muted)" }}>
              Aucune pièce n&apos;approche de sa limite et aucun entretien
              n&apos;est dû. On te préviendra ici quand ça changera.
            </div>
          </BiCard>
        ) : (
          <>
            {/* ── Pièces à remplacer ───────────────────────────── */}
            {parts.length > 0 && (
              <BiCard pad={0} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    padding: "20px 22px 14px",
                    borderBottom: "1px solid var(--bi-line)",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600 }}>
                    Pièces {parts.length > 1 ? "concernées" : "concernée"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--bi-muted)",
                      marginTop: 2,
                    }}
                  >
                    Triées par urgence. Temps et coûts sont indicatifs.
                  </div>
                </div>

                {parts.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      padding: "14px 22px",
                      borderTop: i === 0 ? "none" : "1px solid var(--bi-line)",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 200, flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <Dot
                          color={
                            p.status === "bad"
                              ? "var(--bi-bad)"
                              : "var(--bi-warn)"
                          }
                          size={7}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {p.name}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--bi-muted)",
                          marginTop: 2,
                        }}
                      >
                        {p.bikeName} ·{" "}
                        {CATEGORY_LABELS[p.category] ?? p.category} ·{" "}
                        {p.wearPct}% d&apos;usure
                      </div>

                      {/* Arbitrage DIY vs atelier */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          marginTop: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <span
                            style={{ display: "flex", gap: 2 }}
                            aria-label={DIFFICULTY_LABELS[p.guide.difficulty]}
                          >
                            {[1, 2, 3].map((n) => (
                              <span
                                key={n}
                                style={{
                                  width: 14,
                                  height: 4,
                                  borderRadius: 2,
                                  background:
                                    n <= DIFFICULTY_LEVEL[p.guide.difficulty]
                                      ? DIFFICULTY_COLOR[p.guide.difficulty]
                                      : "var(--bi-line)",
                                }}
                              />
                            ))}
                          </span>
                          <span
                            style={{ fontSize: 11, color: "var(--bi-muted)" }}
                          >
                            {DIFFICULTY_LABELS[p.guide.difficulty]}
                          </span>
                        </span>
                        <span
                          style={{ fontSize: 11, color: "var(--bi-muted)" }}
                        >
                          Soi-même :{" "}
                          <Mono>
                            {formatRepairTime(
                              p.guide.timeMin,
                              p.guide.timeMax
                            )}
                          </Mono>
                        </span>
                        <span
                          style={{ fontSize: 11, color: "var(--bi-muted)" }}
                        >
                          Atelier :{" "}
                          <Mono>
                            {p.guide.laborMin}–{p.guide.laborMax} €
                          </Mono>
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 6,
                      }}
                    >
                      <div>
                        <Mono
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color:
                              p.status === "bad"
                                ? "var(--bi-bad)"
                                : "var(--bi-warn)",
                          }}
                        >
                          {urgencyLabel(p.weeksUntil, p.status)}
                        </Mono>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--bi-muted)",
                            marginTop: 1,
                          }}
                        >
                          {p.kmRemaining.toLocaleString("fr-FR")} km restants
                        </div>
                      </div>
                      <Link
                        href={`/components/${p.id}/tuto`}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: "none",
                          color: "var(--bi-ink)",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        Voir la marche à suivre
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </BiCard>
            )}

            {/* ── Entretiens périodiques dus ───────────────────── */}
            {maintenance.length > 0 && (
              <BiCard pad={0} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    padding: "20px 22px 14px",
                    borderBottom: "1px solid var(--bi-line)",
                  }}
                >
                  <div style={{ fontSize: 15, fontWeight: 600 }}>
                    Entretiens
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--bi-muted)",
                      marginTop: 2,
                    }}
                  >
                    Échéances périodiques, basées sur ton dernier passage.
                  </div>
                </div>

                {maintenance.map((m, i) => (
                  <div
                    key={`${m.bikeId}:${m.typeId}`}
                    style={{
                      padding: "14px 22px",
                      borderTop: i === 0 ? "none" : "1px solid var(--bi-line)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <Dot
                          color={
                            m.state === "due"
                              ? "var(--bi-bad)"
                              : "var(--bi-warn)"
                          }
                          size={7}
                        />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>
                          {m.label}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--bi-muted)",
                          marginTop: 2,
                        }}
                      >
                        {m.bikeName} · {m.detail}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "3px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          background:
                            m.state === "due"
                              ? "var(--bi-bad-soft)"
                              : "var(--bi-warn-soft)",
                          color:
                            m.state === "due"
                              ? "var(--bi-bad)"
                              : "var(--bi-warn)",
                        }}
                      >
                        {m.state === "due" ? "À faire" : "Bientôt"}
                      </span>
                    </div>
                  </div>
                ))}
              </BiCard>
            )}

            <BiCard pad={18}>
              <BiLabel>Note</BiLabel>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--bi-muted)",
                  marginTop: 6,
                  lineHeight: 1.5,
                }}
              >
                Temps, outils et fourchettes atelier sont des ordres de grandeur
                pour t&apos;aider à arbitrer — pas un devis. Les marches à
                suivre renvoient vers des tutos publics.
              </div>
            </BiCard>
          </>
        )}
      </div>
    </AppShell>
  );
}
