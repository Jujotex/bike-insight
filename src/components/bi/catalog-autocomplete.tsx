"use client";

import { useRef, useState } from "react";
import { searchCatalog, type CatalogSuggestion } from "@/lib/components-catalog";

// Champ texte avec suggestions du catalogue en direct.
// L'utilisateur tape "gp 5000", "conti gp"… et choisit le produit :
// onSelect reçoit le produit complet (nom, marque, prix, durée de vie).

export function CatalogAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  inputStyle,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (p: CatalogSuggestion) => void;
  placeholder?: string;
  inputStyle: React.CSSProperties;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const results = open ? searchCatalog(value) : [];

  return (
    <div style={{ position: "relative", ...style }}>
      <input
        style={inputStyle}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120); }}
      />
      {results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 40,
            background: "var(--bi-card)",
            border: "1px solid var(--bi-line)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            overflow: "hidden",
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {results.map((p, i) => (
            <button
              key={`${p.brand}-${p.name}-${i}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                if (blurTimer.current) clearTimeout(blurTimer.current);
                onSelect(p);
                setOpen(false);
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bi-bg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                borderBottom: i < results.length - 1 ? "1px solid var(--bi-line)" : "none",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bi-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--bi-muted)", marginTop: 1 }}>
                  {p.brand} · {p.lifeKm.toLocaleString("fr")} km
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--bi-font-mono)", flexShrink: 0 }}>
                {p.price} €
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
