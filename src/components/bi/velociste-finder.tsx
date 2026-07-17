"use client";

import { useRef, useState, type FormEvent, type CSSProperties } from "react";
import { Mono } from "@/components/bi/ui";
import type { Velociste, AddressSuggestion } from "@/lib/velocistes";

// Recherche de vélocistes par adresse (avec autocomplétion Photon) ou
// géolocalisation — rendu en liste, sans carte.

function fmtDistance(km: number): string {
  return km < 10 ? km.toFixed(1).replace(".", ",") : String(Math.round(km));
}

export function VelocisteFinder() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shops, setShops] = useState<Velociste[] | null>(null);

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function run(url: string) {
    setLoading(true);
    setError("");
    setShowSuggest(false);
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

  function onQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggest(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/velocistes/suggest?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setSuggestions((data.suggestions as AddressSuggestion[]) ?? []);
        setShowSuggest(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  }

  function pickSuggestion(s: AddressSuggestion) {
    setQuery(s.label);
    setSuggestions([]);
    setShowSuggest(false);
    run(`/api/velocistes?lat=${s.lat}&lon=${s.lon}`);
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
    setShowSuggest(false);
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
    width: "100%",
    padding: "9px 12px",
    borderRadius: 10,
    border: "1px solid var(--bi-line)",
    background: "var(--bi-bg)",
    fontSize: 13,
    fontFamily: "inherit",
    color: "var(--bi-ink)",
  };

  const chipStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 9px",
    borderRadius: 999,
    border: "1px solid var(--bi-line)",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--bi-ink)",
    textDecoration: "none",
  };

  // Boutons-icônes à emplacement fixe (site / téléphone) : présents sur chaque
  // ligne, atténués quand l'info OSM manque → rangées visuellement identiques.
  const iconBtn: CSSProperties = {
    width: 26, height: 26, flexShrink: 0,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    borderRadius: 8, border: "1px solid var(--bi-line)",
    color: "var(--bi-ink)", textDecoration: "none",
  };
  const iconBtnOff: CSSProperties = { ...iconBtn, color: "var(--bi-muted)", opacity: 0.3, cursor: "default" };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Trouver un vélociste près de toi</div>

      <form onSubmit={searchByAddress} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            placeholder="Adresse, ville ou code postal"
            autoComplete="off"
            style={inputStyle}
          />
          {showSuggest && suggestions.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20, background: "var(--bi-card)", border: "1px solid var(--bi-line)", borderRadius: 10, overflow: "hidden", boxShadow: "0 10px 34px rgba(14,14,16,0.14)" }}>
              {suggestions.map((s, i) => (
                <button
                  key={s.label + i}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickSuggestion(s)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", background: "transparent", border: "none", borderTop: i === 0 ? "none" : "1px solid var(--bi-line)", fontSize: 12, fontFamily: "inherit", color: "var(--bi-ink)", cursor: "pointer" }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: "var(--bi-muted)", marginBottom: 8 }}>
            {shops.length} vélociste{shops.length > 1 ? "s" : ""} · le plus proche à {fmtDistance(shops[0].distanceKm)} km
          </div>

          {/* Liste scrollable : hauteur fixe, la page ne s'allonge pas */}
          <div style={{ maxHeight: 328, overflowY: "auto", border: "1px solid var(--bi-line)", borderRadius: 14 }}>
            {shops.map((s, idx) => (
              <div key={s.id} style={{ display: "flex", gap: 12, padding: "12px 14px", borderTop: idx === 0 ? "none" : "1px solid var(--bi-line)" }}>
                {/* Pastille générée (initiale) — visuel léger, zéro requête */}
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--bi-ink)", color: "var(--bi-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 17, fontWeight: 700, fontFamily: "var(--bi-font-mono)" }}>
                  {s.name.trim().charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                    <span style={{ flexShrink: 0, padding: "2px 8px", borderRadius: 999, background: "var(--bi-bg)", border: "1px solid var(--bi-line)" }}>
                      <Mono style={{ fontSize: 11, fontWeight: 500, color: "var(--bi-muted)" }}>{fmtDistance(s.distanceKm)} km</Mono>
                    </span>
                  </div>

                  {s.address && (
                    <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.address}</div>
                  )}

                  {s.openingHours && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--bi-muted)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                      {s.openingHours}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                    {/* Itinéraire — toujours dispo, action principale */}
                    <a href={s.mapsUrl} target="_blank" rel="noopener noreferrer" style={chipStyle}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
                      Itinéraire
                    </a>
                    {/* Site — emplacement fixe, atténué si absent */}
                    {s.website ? (
                      <a href={s.website} target="_blank" rel="noopener noreferrer" aria-label="Site web" title="Site web" style={iconBtn}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18"/></svg>
                      </a>
                    ) : (
                      <span aria-hidden="true" title="Site non renseigné" style={iconBtnOff}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18"/></svg>
                      </span>
                    )}
                    {/* Téléphone — emplacement fixe, atténué si absent */}
                    {s.phone ? (
                      <a href={`tel:${s.phone}`} aria-label="Appeler" title={s.phone} style={iconBtn}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </a>
                    ) : (
                      <span aria-hidden="true" title="Téléphone non renseigné" style={iconBtnOff}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: "var(--bi-muted)", marginTop: 8 }}>Données OpenStreetMap · distances à vol d&apos;oiseau</div>
        </div>
      )}
    </div>
  );
}
