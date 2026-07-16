"use client";

import { useState, type FormEvent, type CSSProperties } from "react";
import { Mono } from "@/components/bi/ui";
import type { Velociste } from "@/lib/velocistes";

// Recherche de vélocistes par adresse (ou géolocalisation) — rendu en liste,
// sans carte. Appelle /api/velocistes et affiche les résultats triés par distance.

function fmtDistance(km: number): string {
  return km < 10 ? km.toFixed(1).replace(".", ",") : String(Math.round(km));
}

export function VelocisteFinder() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shops, setShops] = useState<Velociste[] | null>(null);

  async function run(url: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Recherche indisponible.");
        setShops(null);
      } else {
        setShops(data.shops as Velociste[]);
      }
    } catch {
      setError("Recherche indisponible. Vérifie ta connexion.");
      setShops(null);
    } finally {
      setLoading(false);
    }
  }

  function searchByAddress(e: FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    run(`/api/velocistes?q=${encodeURIComponent(query.trim())}`);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Géolocalisation non disponible sur cet appareil.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => run(`/api/velocistes?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
      () => {
        setLoading(false);
        setError("Position refusée. Saisis une adresse à la place.");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  const inputStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid var(--bi-line)",
    background: "var(--bi-bg)",
    fontSize: 13,
    fontFamily: "inherit",
    color: "var(--bi-ink)",
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Trouver un vélociste près de toi</div>

      <form onSubmit={searchByAddress} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Adresse, ville ou code postal"
          style={inputStyle}
        />
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          style={{ flexShrink: 0, padding: "9px 14px", borderRadius: 10, background: "var(--bi-ink)", color: "var(--bi-bg)", border: "none", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", opacity: loading || query.trim().length < 2 ? 0.6 : 1 }}
        >
          Chercher
        </button>
      </form>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={loading}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, background: "transparent", border: "1px solid var(--bi-line)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", color: "var(--bi-ink)", cursor: loading ? "not-allowed" : "pointer" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
        Utiliser ma position
      </button>

      {loading && (
        <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 12 }}>Recherche en cours…</div>
      )}

      {error && !loading && (
        <div style={{ fontSize: 12, color: "var(--bi-bad)", marginTop: 12 }}>{error}</div>
      )}

      {!loading && !error && shops !== null && shops.length === 0 && (
        <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 12 }}>
          Aucun vélociste trouvé dans un rayon de 15 km. Essaie une autre adresse.
        </div>
      )}

      {!loading && shops !== null && shops.length > 0 && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--bi-line)" }}>
          {shops.map((s) => (
            <div key={s.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--bi-line)", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                {s.address && (
                  <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2 }}>{s.address}</div>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 6 }}>
                  <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: "var(--bi-ink)", textDecoration: "none" }}>
                    Itinéraire ↗
                  </a>
                  {s.website && (
                    <a href={s.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: "var(--bi-ink)", textDecoration: "none" }}>
                      Site ↗
                    </a>
                  )}
                  {s.phone && (
                    <a href={`tel:${s.phone}`} style={{ fontSize: 12, fontWeight: 600, color: "var(--bi-ink)", textDecoration: "none" }}>
                      Appeler
                    </a>
                  )}
                </div>
              </div>
              <Mono style={{ fontSize: 12, color: "var(--bi-muted)", flexShrink: 0, whiteSpace: "nowrap" }}>{fmtDistance(s.distanceKm)} km</Mono>
            </div>
          ))}
          <div style={{ fontSize: 10, color: "var(--bi-muted)", marginTop: 8 }}>Données OpenStreetMap · distances à vol d&apos;oiseau</div>
        </div>
      )}
    </div>
  );
}
