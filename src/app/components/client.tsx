"use client";

import { useState } from "react";
import Link from "next/link";
import { BiCard, Mono, Dot, ProgressBar, PageHead } from "@/components/bi/ui";

// ── Types ───────────────────────────────────────────────────────

type Tab = "actifs" | "historique" | "tous";

export interface ReplacementLog {
  id: string;
  performedAt: string | null;
  cost: number | null;
  reason: string | null;
  componentId: string | null;
  componentName: string;
  componentBrand: string | null;
  lifeKm: number | null;
  kmMax: number | null;
  beat: number | null;
  bikeId: string | null;
  bikeName: string;
}

interface Props {
  components: Record<string, unknown>[];
  bikes: { id: string; name: string }[];
  bikeNames: Record<string, string>;
  replacementLogs: ReplacementLog[];
  kpis: {
    activeCount: number;
    replacedCount: number;
    totalCost: number;
    avgBeat: number | null;
  };
}

// ── Constants ───────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  ok: "var(--bi-ok)",
  warn: "var(--bi-warn)",
  bad: "var(--bi-bad)",
};

const REASON_CONFIG: Record<string, { label: string; color: string; bg: string; border: boolean }> = {
  usure:     { label: "Usure normale", color: "var(--bi-muted)",      bg: "transparent",             border: true  },
  crevaison: { label: "Crevaison",     color: "var(--bi-warn)",       bg: "rgba(208,132,21,0.08)",   border: false },
  casse:     { label: "Casse",         color: "var(--bi-bad)",        bg: "rgba(200,54,46,0.08)",    border: false },
  anticipé:  { label: "Anticipé",      color: "var(--bi-accent-ink)", bg: "var(--bi-accent)",        border: false },
};

// ── Helpers ─────────────────────────────────────────────────────

function formatDate(dateStr: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", opts ?? {
    day: "numeric", month: "short", year: "numeric",
  });
}

function ReasonBadge({ reason }: { reason: string | null }) {
  if (!reason) return <span style={{ color: "var(--bi-muted)", fontSize: 12 }}>—</span>;
  const cfg = REASON_CONFIG[reason] ?? { label: reason, color: "var(--bi-muted)", bg: "transparent", border: true };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 8px", borderRadius: 999,
      background: cfg.bg,
      border: cfg.border ? "1px solid var(--bi-line)" : "none",
      color: cfg.color, fontSize: 10.5, fontWeight: 600,
    }}>
      <Dot color={cfg.color} size={5} />
      {cfg.label}
    </span>
  );
}

// ── Main component ───────────────────────────────────────────────

export function ComponentsClient({ components, bikes, bikeNames, replacementLogs, kpis }: Props) {
  const [tab, setTab] = useState<Tab>("actifs");
  const [bikeFilter, setBikeFilter] = useState<string | null>(null);

  const filteredComponents = bikeFilter
    ? components.filter(c => c.bike_id === bikeFilter)
    : components;

  const activeBikeIds = [...new Set(components.map(c => c.bike_id as string).filter(Boolean))];

  const showActive  = tab === "actifs"    || tab === "tous";
  const showHistory = tab === "historique" || tab === "tous";

  // Footer insight
  const worstLog = replacementLogs.length > 0
    ? [...replacementLogs]
        .filter(r => r.beat !== null)
        .sort((a, b) => (a.beat ?? 0) - (b.beat ?? 0))[0] ?? null
    : null;

  // ── Tabs config ─────────────────────────────────────────────
  const TAB_LABELS: Record<Tab, string> = {
    actifs: "Actifs",
    historique: "Remplacements",
    tous: "Tous",
  };
  const TAB_COUNTS: Record<Tab, number> = {
    actifs: kpis.activeCount,
    historique: kpis.replacedCount,
    tous: kpis.activeCount + kpis.replacedCount,
  };

  return (
    <div className="bi-page" style={{ maxWidth: 1100 }}>

      {/* Page header */}
      <PageHead
        title="Composants"
        sub={`${kpis.activeCount} composant${kpis.activeCount !== 1 ? "s" : ""} actif${kpis.activeCount !== 1 ? "s" : ""} · ${kpis.replacedCount} remplacé${kpis.replacedCount !== 1 ? "s" : ""} · suivi sur ${bikes.length} vélo${bikes.length !== 1 ? "s" : ""}`}
        actions={
          <Link href={kpis.activeCount === 0 ? "/onboarding" : "/components/new"}>
            <button style={{ padding: "9px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
              Déclarer un composant
            </button>
          </Link>
        }
      />

      {/* ── KPI strip ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--bi-line)", borderRadius: 16, overflow: "hidden", marginBottom: 22 }} className="bi-grid-4">
        {[
          { label: "Composants actifs",  value: String(kpis.activeCount),                                                                         sub: null,           color: null },
          { label: "Remplacés · 12 mois",value: String(kpis.replacedCount),                                                                       sub: null,           color: null },
          { label: "Coût composants",    value: `${kpis.totalCost.toLocaleString("fr")} €`,                                                       sub: null,           color: null },
          {
            label: "Durée de vie moy.",
            value: kpis.avgBeat !== null ? `${kpis.avgBeat >= 0 ? "+" : ""}${kpis.avgBeat.toLocaleString("fr")} km` : "—",
            sub:   kpis.avgBeat !== null ? "vs estimation" : null,
            color: kpis.avgBeat !== null ? (kpis.avgBeat >= 0 ? "var(--bi-ok)" : "var(--bi-bad)") : null,
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background: "var(--bi-card)", padding: "18px 22px" }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--bi-muted)" }}>
              {label}
            </div>
            <Mono style={{ display: "block", fontSize: 22, fontWeight: 500, letterSpacing: -0.5, marginTop: 8, color: color ?? "var(--bi-ink)" }}>
              {value}
            </Mono>
            {sub && <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 4 }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 0, marginBottom: 14, borderBottom: "1px solid var(--bi-line)" }}>
        {(["actifs", "historique", "tous"] as Tab[]).map(t => {
          const on = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 4px", marginRight: 20, marginBottom: -1,
                background: "transparent", border: "none",
                borderBottom: on ? "2px solid var(--bi-ink)" : "2px solid transparent",
                color: on ? "var(--bi-ink)" : "var(--bi-muted)",
                fontWeight: on ? 600 : 500, fontSize: 13,
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              }}
            >
              {TAB_LABELS[t]}
              <span style={{
                padding: "2px 7px", borderRadius: 999,
                background: on ? "var(--bi-ink)" : "transparent",
                color: on ? "var(--bi-bg)" : "var(--bi-muted)",
                border: on ? "none" : "1px solid var(--bi-line)",
                fontSize: 10.5, fontFamily: "var(--bi-font-mono)", fontWeight: 600,
              }}>
                {TAB_COUNTS[t]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Active components ─────────────────────────────────── */}
      {showActive && (
        <BiCard pad={0} style={{ marginBottom: tab === "tous" ? 22 : 14 }}>
          {/* Sub-header */}
          <div style={{ padding: "20px 22px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderBottom: "1px solid var(--bi-line)" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Composants actifs</div>
              <div style={{ fontSize: 11.5, color: "var(--bi-muted)", marginTop: 2 }}>
                Tous tes composants en cours d'usage, triés par taux d'usure
              </div>
            </div>
            {activeBikeIds.length > 1 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                  onClick={() => setBikeFilter(null)}
                  style={{
                    fontSize: 11, padding: "5px 11px", borderRadius: 999,
                    background: bikeFilter === null ? "var(--bi-ink)" : "transparent",
                    color: bikeFilter === null ? "var(--bi-bg)" : "var(--bi-muted)",
                    border: bikeFilter === null ? "none" : "1px solid var(--bi-line)",
                    fontWeight: bikeFilter === null ? 600 : 500,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Tous vélos
                </button>
                {activeBikeIds.map(id => (
                  <button
                    key={id}
                    onClick={() => setBikeFilter(bikeFilter === id ? null : id)}
                    style={{
                      fontSize: 11, padding: "5px 11px", borderRadius: 999,
                      background: bikeFilter === id ? "var(--bi-ink)" : "transparent",
                      color: bikeFilter === id ? "var(--bi-bg)" : "var(--bi-muted)",
                      border: bikeFilter === id ? "none" : "1px solid var(--bi-line)",
                      fontWeight: bikeFilter === id ? 600 : 500,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {bikeNames[id] ?? id}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="bi-desktop-block" style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 640 }}>
              <div style={{
                padding: "8px 22px", display: "grid",
                gridTemplateColumns: "1.4fr 1fr 1fr 1.4fr 0.6fr 0.5fr",
                gap: 14, fontSize: 10.5, color: "var(--bi-muted)", fontWeight: 600,
                letterSpacing: "0.07em", textTransform: "uppercase",
                borderBottom: "1px solid var(--bi-line)",
              }}>
                <span>Composant</span><span>Vélo</span><span>Installé</span>
                <span>Usure</span>
                <span style={{ textAlign: "right" }}>Km</span>
                <span style={{ textAlign: "right" }}>Coût</span>
              </div>

              {filteredComponents.length === 0 ? (
                <div style={{ padding: "32px 22px", textAlign: "center", color: "var(--bi-muted)", fontSize: 13 }}>
                  Aucun composant pour ce vélo.
                </div>
              ) : (
                filteredComponents.map(c => {
                  const color = STATUS_COLORS[c.status as string] ?? "var(--bi-muted)";
                  const wearPct = (c.wear_pct as number) ?? 0;
                  return (
                    <Link
                      key={c.id as string}
                      href={`/components/${c.id}`}
                      className="bi-component-row"
                      style={{
                        textDecoration: "none", color: "inherit",
                        display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1.4fr 0.6fr 0.5fr",
                        gap: 14, padding: "14px 22px", alignItems: "center",
                        borderBottom: "1px solid var(--bi-line)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 4, height: 28, background: color, borderRadius: 2, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name as string}</div>
                          <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>{(c.brand as string) ?? "—"}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>
                        {bikeNames[c.bike_id as string] ?? "—"}
                      </span>
                      <Mono style={{ fontSize: 11.5, color: "var(--bi-muted)" }}>
                        {formatDate(c.installed_at as string | null)}
                      </Mono>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <ProgressBar value={Math.min(wearPct / 100, 1)} color={color} height={3} />
                        </div>
                        <Mono style={{ fontSize: 11, color: "var(--bi-muted)", width: 34, textAlign: "right" }}>
                          {Math.round(wearPct)} %
                        </Mono>
                      </div>
                      <Mono style={{ fontSize: 12, textAlign: "right" }}>
                        {((c.km_used as number) ?? 0).toLocaleString("fr")}
                      </Mono>
                      <Mono style={{ fontSize: 12, textAlign: "right", fontWeight: 500 }}>
                        {c.purchase_price !== null ? `${c.purchase_price} €` : "—"}
                      </Mono>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Mobile cards */}
          <div className="bi-mobile-flex" style={{ flexDirection: "column" }}>
            {filteredComponents.map(c => {
              const color = STATUS_COLORS[c.status as string] ?? "var(--bi-muted)";
              const wearPct = (c.wear_pct as number) ?? 0;
              return (
                <Link key={c.id as string} href={`/components/${c.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--bi-line)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 4, height: 28, background: color, borderRadius: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name as string}</div>
                        <div style={{ fontSize: 11.5, color: "var(--bi-muted)" }}>{bikeNames[c.bike_id as string] ?? "—"}</div>
                      </div>
                      <Mono style={{ fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                        {c.purchase_price !== null ? `${c.purchase_price} €` : "—"}
                      </Mono>
                    </div>
                    <ProgressBar value={Math.min(wearPct / 100, 1)} color={color} height={4} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11.5, color: "var(--bi-muted)" }}>
                      <Mono>{Math.round(wearPct)} % usure</Mono>
                      <Mono>{((c.km_used as number) ?? 0).toLocaleString("fr")} km</Mono>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </BiCard>
      )}

      {/* ── History ───────────────────────────────────────────── */}
      {showHistory && (
        <>
          <div style={{
            marginBottom: 14, display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.5 }}>Historique des remplacements</div>
              <div style={{ fontSize: 12.5, color: "var(--bi-muted)", marginTop: 4 }}>
                Chaque composant qui a quitté ton vélo, avec ce qu'il a tenu et combien il t'a coûté.
              </div>
            </div>
            <Mono style={{ fontSize: 12, color: "var(--bi-muted)", flexShrink: 0, paddingTop: 4 }}>
              {kpis.replacedCount} entrée{kpis.replacedCount !== 1 ? "s" : ""} · 12 derniers mois
            </Mono>
          </div>

          {replacementLogs.length === 0 ? (
            <BiCard pad={40}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Aucun remplacement enregistré</div>
                <div style={{ fontSize: 13, color: "var(--bi-muted)" }}>
                  Utilise le bouton "Remplacer" sur un composant actif pour enregistrer un remplacement.
                </div>
              </div>
            </BiCard>
          ) : (
            <BiCard pad={0}>
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 780 }}>
                  {/* Header */}
                  <div style={{
                    padding: "12px 22px", display: "grid",
                    gridTemplateColumns: "0.9fr 1.4fr 1fr 1.2fr 0.9fr 0.6fr 1fr 0.3fr",
                    gap: 14, fontSize: 10.5, color: "var(--bi-muted)", fontWeight: 600,
                    letterSpacing: "0.07em", textTransform: "uppercase",
                    borderBottom: "1px solid var(--bi-line)",
                  }}>
                    <span>Date</span>
                    <span>Composant</span>
                    <span>Vélo</span>
                    <span>Durée de vie</span>
                    <span>Vs prévu</span>
                    <span style={{ textAlign: "right" }}>Coût</span>
                    <span>Raison</span>
                    <span />
                  </div>

                  {replacementLogs.map((r, i) => {
                    const isLast = i === replacementLogs.length - 1;
                    const lifePct = r.lifeKm !== null && r.kmMax && r.kmMax > 0
                      ? Math.min(100, Math.round((r.lifeKm / r.kmMax) * 100))
                      : null;
                    const barColor  = (r.beat ?? 0) >= 0 ? "var(--bi-ok)" : "var(--bi-warn)";
                    const beatColor = (r.beat ?? 0) >= 0 ? "var(--bi-ok)" : "var(--bi-bad)";

                    return (
                      <div
                        key={r.id}
                        style={{
                          padding: "16px 22px", display: "grid",
                          gridTemplateColumns: "0.9fr 1.4fr 1fr 1.2fr 0.9fr 0.6fr 1fr 0.3fr",
                          gap: 14, alignItems: "center",
                          borderBottom: isLast ? "none" : "1px solid var(--bi-line)",
                        }}
                      >
                        {/* Date */}
                        <Mono style={{ fontSize: 11.5, color: "var(--bi-muted)" }}>
                          {formatDate(r.performedAt)}
                        </Mono>

                        {/* Composant */}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{r.componentName}</div>
                          {r.componentBrand && (
                            <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>{r.componentBrand}</div>
                          )}
                        </div>

                        {/* Vélo */}
                        <span style={{ fontSize: 12, color: "var(--bi-muted)" }}>{r.bikeName}</span>

                        {/* Durée de vie */}
                        <div>
                          <Mono style={{ fontSize: 13, fontWeight: 500 }}>
                            {r.lifeKm !== null ? `${r.lifeKm.toLocaleString("fr")} km` : "—"}
                          </Mono>
                          {lifePct !== null && r.kmMax ? (
                            <>
                              <div style={{ position: "relative", height: 3, borderRadius: 999, background: "var(--bi-line)", marginTop: 6 }}>
                                {/* Fill */}
                                <div style={{
                                  position: "absolute", inset: 0, borderRadius: 999, overflow: "hidden",
                                }}>
                                  <div style={{
                                    height: "100%", width: `${lifePct}%`,
                                    background: barColor, borderRadius: 999,
                                  }} />
                                </div>
                                {/* Tick at expected */}
                                <div style={{
                                  position: "absolute", right: 0, top: -2,
                                  width: 1.5, height: 7, background: "var(--bi-muted)", borderRadius: 1,
                                }} />
                              </div>
                              <Mono style={{ fontSize: 10.5, color: "var(--bi-muted)", marginTop: 4 }}>
                                cible {r.kmMax.toLocaleString("fr")}
                              </Mono>
                            </>
                          ) : null}
                        </div>

                        {/* Vs prévu */}
                        <Mono style={{ fontSize: 12, fontWeight: 600, color: r.beat !== null ? beatColor : "var(--bi-muted)" }}>
                          {r.beat !== null
                            ? `${r.beat >= 0 ? "+" : ""}${r.beat.toLocaleString("fr")} km`
                            : "—"}
                        </Mono>

                        {/* Coût */}
                        <Mono style={{ fontSize: 13, textAlign: "right", fontWeight: 500 }}>
                          {r.cost !== null ? `${r.cost} €` : "—"}
                        </Mono>

                        {/* Raison */}
                        <ReasonBadge reason={r.reason} />

                        {/* Chevron */}
                        {r.componentId ? (
                          <Link
                            href={`/components/${r.componentId}`}
                            style={{ justifySelf: "end", color: "var(--bi-muted)", display: "flex", alignItems: "center" }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
                          </Link>
                        ) : (
                          <div style={{ justifySelf: "end", display: "flex", alignItems: "center" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bi-line)" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </BiCard>
          )}
        </>
      )}


    </div>
  );
}