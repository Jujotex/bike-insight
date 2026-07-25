"use client";

import { useState } from "react";
import Link from "next/link";
import { BiCard, Mono } from "@/components/bi/ui";

// Badge compact (visible seulement sur mobile, quand les colonnes se replient)
const mtBadge: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  padding: "3px 8px",
  borderRadius: 999,
  background: "var(--bi-bg)",
  border: "1px solid var(--bi-line)",
  color: "var(--bi-muted)",
  fontFamily: "var(--bi-font-mono)",
};

export type MaintenanceTypeRow = {
  id: string;
  bike_id: string;
  slug: string;
  label: string;
  sub: string | null;
  interval_km: number | null;
  interval_months: number | null;
  default_cost: number | null;
  sort_order: number;
};

type Bike = { id: string; name: string };

export function MaintenanceSettingsClient({
  bikes,
  types,
  initialBikeId,
}: {
  bikes: Bike[];
  types: MaintenanceTypeRow[];
  initialBikeId: string;
}) {
  const [bikeId, setBikeId] = useState(initialBikeId);
  const bikeTypes = types.filter((t) => t.bike_id === bikeId);

  if (bikes.length === 0) {
    return (
      <BiCard pad={28} style={{ textAlign: "center", color: "var(--bi-muted)", fontSize: 13 }}>
        Ajoute d&apos;abord un vélo pour configurer ses entretiens.
      </BiCard>
    );
  }

  return (
    <>
      {/* Sélecteur de vélo */}
      {bikes.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {bikes.map((b) => {
            const on = b.id === bikeId;
            return (
              <button
                key={b.id}
                onClick={() => setBikeId(b.id)}
                style={{
                  padding: "8px 14px", borderRadius: 999, fontSize: 13, fontFamily: "inherit", cursor: "pointer",
                  border: `1.5px solid ${on ? "var(--bi-ink)" : "var(--bi-line)"}`,
                  background: on ? "var(--bi-ink)" : "transparent",
                  color: on ? "var(--bi-bg)" : "var(--bi-ink)",
                  fontWeight: on ? 600 : 500,
                }}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      )}

      <BiCard pad={0} style={{ overflow: "hidden" }}>
        {/* Sous-en-tête + Ajouter */}
        <div style={{ padding: "20px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderBottom: "1px solid var(--bi-line)" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Entretiens</div>
            <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>
              {bikeTypes.length} entretien{bikeTypes.length !== 1 ? "s" : ""} · clique une ligne pour la gérer
            </div>
          </div>
          <Link
            href={`/reglages/entretiens/new?bike=${bikeId}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "var(--bi-ink)", color: "var(--bi-bg)", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Ajouter
          </Link>
        </div>

        {/* Empty state */}
        {bikeTypes.length === 0 && (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--bi-muted)", fontSize: 13 }}>
            Aucun entretien pour ce vélo. Clique sur « Ajouter » pour en créer un.
          </div>
        )}

        {/* Tableau */}
        {bikeTypes.length > 0 && (
          <>
            <div className="bi-mt-row" style={{ padding: "8px 22px", fontSize: 11, color: "var(--bi-muted)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: "1px solid var(--bi-line)" }}>
              <span>Entretien</span>
              <span className="bi-mt-num" style={{ textAlign: "right" }}>Échéance km</span>
              <span className="bi-mt-num" style={{ textAlign: "right" }}>Échéance temps</span>
              <span className="bi-mt-num" style={{ textAlign: "right" }}>Coût</span>
              <span />
            </div>

            {bikeTypes.map((t) => (
              <Link
                key={t.id}
                href={`/reglages/entretiens/${t.slug}?bike=${bikeId}`}
                className="bi-component-row bi-mt-row"
                style={{ padding: "14px 22px", alignItems: "center", borderBottom: "1px solid var(--bi-line)", cursor: "pointer", textDecoration: "none", color: "inherit" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{ width: 4, height: 28, background: "var(--bi-muted)", borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                    {t.sub && <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.sub}</div>}
                    <div className="bi-mt-badges">
                      {t.interval_km !== null && <span style={mtBadge}>{t.interval_km.toLocaleString("fr")} km</span>}
                      {t.interval_months !== null && <span style={mtBadge}>{t.interval_months} mois</span>}
                      {t.default_cost !== null && <span style={mtBadge}>{t.default_cost} €</span>}
                    </div>
                  </div>
                </div>
                <div className="bi-mt-num" style={{ textAlign: "right" }}>
                  <Mono style={{ fontSize: 12, color: t.interval_km !== null ? "var(--bi-ink)" : "var(--bi-muted)" }}>
                    {t.interval_km !== null ? `${t.interval_km.toLocaleString("fr")} km` : "—"}
                  </Mono>
                </div>
                <div className="bi-mt-num" style={{ textAlign: "right" }}>
                  <Mono style={{ fontSize: 12, color: t.interval_months !== null ? "var(--bi-ink)" : "var(--bi-muted)" }}>
                    {t.interval_months !== null ? `${t.interval_months} mois` : "—"}
                  </Mono>
                </div>
                <div className="bi-mt-num" style={{ textAlign: "right" }}>
                  <Mono style={{ fontSize: 12, fontWeight: 500, color: t.default_cost !== null ? "var(--bi-ink)" : "var(--bi-muted)" }}>
                    {t.default_cost !== null ? `${t.default_cost} €` : "—"}
                  </Mono>
                </div>
                <div style={{ justifySelf: "end", color: "var(--bi-muted)", display: "flex", alignItems: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
                </div>
              </Link>
            ))}
          </>
        )}
      </BiCard>
    </>
  );
}
