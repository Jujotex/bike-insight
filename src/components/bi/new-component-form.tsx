"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/bi/toast";
import { BiCard, BiLabel, Mono, Dot } from "@/components/bi/ui";
import { getCatalogForTemplate, checkBrandCompatibility, type CatalogEntry } from "@/lib/components-catalog";
import { CatalogAutocomplete } from "@/components/bi/catalog-autocomplete";
import { BIKE_TEMPLATES } from "@/lib/bike-templates";

export interface FormBike {
  id: string;
  name: string;
  total_km: number | null;
  groupset_template_id?: string | null;
}

const COMPONENT_TYPES = [
  { name: "Chaîne",     category: "transmission", defaultKm: 3000,  desc: "Relie le pédalier à la cassette et transmet ta force à la roue. C'est la pièce de la transmission qui s'use le plus vite ; la changer à temps évite d'abîmer la cassette et les plateaux." },
  { name: "Pneus",      category: "roues",        defaultKm: 8000,  desc: "La gomme en contact avec le sol. S'use selon les kilomètres, ton poids et le revêtement — l'arrière plus vite que l'avant." },
  { name: "Cassette",   category: "transmission", defaultKm: 25000, desc: "Le bloc de pignons sur la roue arrière qui donne les vitesses. S'use plus lentement que la chaîne, mais une chaîne trop usée l'abîme." },
  { name: "Plateaux",   category: "transmission", defaultKm: 50000, desc: "Les grandes couronnes dentées à l'avant, sur le pédalier. Très longue durée de vie ; à surveiller quand les dents deviennent pointues." },
  { name: "Plaquettes", category: "freinage",     defaultKm: 3000,  desc: "Les patins qui serrent le disque sur les freins à disque. À remplacer avant que la garniture soit à nu (bruit métallique au freinage)." },
  { name: "Disque",     category: "freinage",     defaultKm: 5000,  desc: "Le rotor métallique fixé à la roue, sur lequel serrent les plaquettes (freins à disque). Se change s'il est trop fin ou voilé." },
  { name: "Patins",     category: "freinage",     defaultKm: 4000,  desc: "Les patins de frein sur jante (freins classiques, sans disque). S'usent avec le freinage, surtout par temps humide." },
  { name: "Câble",      category: "transmission", defaultKm: 5000,  desc: "Les câbles et gaines qui commandent dérailleurs et freins mécaniques. À changer quand le passage de vitesses devient dur ou imprécis." },
  { name: "Galets",     category: "transmission", defaultKm: 12000, desc: "Les deux petites roues dentées du dérailleur arrière qui guident la chaîne. À changer s'ils sont creusés, bruyants ou ont du jeu." },
  { name: "Boîtier",    category: "transmission", defaultKm: 15000, desc: "Le boîtier de pédalier : les roulements dans lesquels tourne l'axe du pédalier. À remplacer quand ça grince ou que le pédalier a du jeu." },
  { name: "Roulements", category: "roues",        defaultKm: 18000, desc: "Les roulements des moyeux dans lesquels tournent les roues. À changer quand la roue accroche en tournant ou a du jeu latéral." },
  { name: "Guidoline",  category: "cockpit",      defaultKm: 8000,  desc: "Le ruban enroulé autour du cintre (route/gravel). À refaire pour le grip et le confort quand elle est usée ou déchirée." },
  { name: "Autre",      category: "autre",        defaultKm: 5000,  desc: "Une pièce non listée. Donne-lui un nom et une durée de vie estimée : le suivi d'usure fonctionne pareil." },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 10,
  border: "1px solid var(--bi-line)",
  background: "var(--bi-bg)",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--bi-ink)",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

export function NewComponentForm({ bikes }: { bikes: FormBike[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultBikeId    = searchParams.get("bike_id") ?? bikes[0]?.id ?? "";
  const defaultType      = searchParams.get("type") ?? "";
  const defaultInstalledKm = searchParams.get("installed_km") ?? "";
  const initType = defaultType
    ? (COMPONENT_TYPES.find(t => t.name === defaultType) ?? COMPONENT_TYPES[0])
    : COMPONENT_TYPES[0];
  const [selectedType, setSelectedType] = useState(initType);
  const [bikeId, setBikeId] = useState(defaultBikeId);
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [installedAt, setInstalledAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [installedKm, setInstalledKm] = useState(
    defaultInstalledKm || String(bikes.find(b => b.id === defaultBikeId)?.total_km ?? bikes[0]?.total_km ?? 0)
  );
  const [kmMax, setKmMax] = useState(String(initType.defaultKm));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTypeChange(type: typeof COMPONENT_TYPES[0]) {
    setSelectedType(type);
    setKmMax(String(type.defaultKm));
  }

  function handleBikeChange(id: string) {
    setBikeId(id);
    const bike = bikes.find(b => b.id === id);
    if (bike) setInstalledKm(String(bike.total_km ?? 0));
  }

  // Template du velo selectionne
  const currentBike = bikes.find(b => b.id === bikeId);
  const currentTemplate = currentBike?.groupset_template_id
    ? BIKE_TEMPLATES.find(t => t.id === currentBike.groupset_template_id)
    : null;

  // Suggestions catalog pour le type selectionne
  const catalogEntry: CatalogEntry | null = currentTemplate
    ? getCatalogForTemplate(selectedType.name, selectedType.category, currentTemplate.brand, currentTemplate.speeds, currentTemplate.bikeTypes, currentTemplate.id)
    : null;

  // Verification compatibilite
  const compatCheck = currentTemplate && brand
    ? checkBrandCompatibility(selectedType.name, brand, currentTemplate.brand)
    : { compatible: true, warning: null };

  async function handleSave() {
    if (!bikeId) { setError("Sélectionne un vélo"); return; }
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Non authentifié"); setSaving(false); return; }

    const { error: err } = await supabase.from("components").insert({
      user_id: user.id,
      bike_id: bikeId,
      name: selectedType.name + (brand ? ` · ${brand}` : ""),
      brand: brand || null,
      category: selectedType.category,
      purchase_price: price ? parseFloat(price) : null,
      installed_at: installedAt || null,
      installed_km: parseFloat(installedKm) || 0,
      km_max: parseFloat(kmMax) || selectedType.defaultKm,
    });

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    // Recalcul immédiat de l'usure via route serveur (a les droits nécessaires)
    await fetch("/api/components/recalculate", { method: "POST" }).catch(() => {});

    showToast("Pièce ajoutée — usure suivie automatiquement");
    router.push("/bikes/" + bikeId);
    router.refresh();
  }

  return (
    <div className="bi-grid-form">
      {/* Form */}
      <BiCard pad={28}>
        {/* Type */}
        <BiLabel style={{ marginBottom: 12 }}>Type de composant</BiLabel>
        <div className="bi-grid-4" style={{ gap: 8, marginBottom: 12 }}>
          {COMPONENT_TYPES.map((t) => {
            const active = selectedType.name === t.name;
            return (
              <button
                key={t.name}
                onClick={() => handleTypeChange(t)}
                style={{
                  padding: "12px 8px",
                  borderRadius: 10,
                  textAlign: "center",
                  background: active ? "var(--bi-ink)" : "var(--bi-card)",
                  color: active ? "var(--bi-bg)" : "var(--bi-ink)",
                  border: `1px solid ${active ? "var(--bi-ink)" : "var(--bi-line)"}`,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {t.name}
              </button>
            );
          })}
        </div>
        {/* Explication du type sélectionné */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 24, padding: "12px 14px", borderRadius: 10, background: "var(--bi-bg)", border: "1px solid var(--bi-line)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ink)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01" strokeLinecap="round"/></svg>
          <div style={{ flex: 1, fontSize: 12, lineHeight: 1.5, color: "var(--bi-muted)" }}>
            <strong style={{ color: "var(--bi-ink)", fontWeight: 600 }}>{selectedType.name}</strong> — {selectedType.desc}
          </div>
        </div>

        {/* Bike + Brand */}
        <div className="bi-grid-2" style={{ marginBottom: 18 }}>
          <div>
            <BiLabel style={{ marginBottom: 8 }}>Vélo</BiLabel>
            <select
              value={bikeId}
              onChange={e => handleBikeChange(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {bikes.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
              {bikes.length === 0 && <option value="">Aucun vélo trouvé</option>}
            </select>
          </div>
          <div>
            <BiLabel style={{ marginBottom: 8 }}>Modèle / marque (optionnel)</BiLabel>
            <CatalogAutocomplete
              inputStyle={inputStyle}
              value={brand}
              onChange={setBrand}
              onSelect={(p) => {
                setBrand(p.name);
                setPrice(String(p.price));
                setKmMax(String(p.lifeKm));
              }}
              placeholder="ex. Continental GP5000, Michelin…"
            />
            {/* Compatibility warning */}
            {!compatCheck.compatible && compatCheck.warning && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "var(--bi-warn-soft)", border: "1px solid rgba(208,132,21,0.25)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bi-warn)" strokeWidth="2" strokeLinecap="round"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                <span style={{ fontSize: 12, color: "var(--bi-warn)", fontWeight: 500 }}>{compatCheck.warning}</span>
              </div>
            )}
          </div>
        </div>

        {/* Catalog suggestions for selected type + bike template */}
        {catalogEntry && (
          <div style={{ marginBottom: 20 }}>
            <BiLabel style={{ marginBottom: 10 }}>Suggestions compatibles avec ton groupe</BiLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {catalogEntry.products.slice(0, 6).map((p, i) => {
                const isActive = brand === p.name;
                return (
                <button key={i} onClick={() => {
                  setBrand(p.name);
                  setPrice(String(p.price));
                  setKmMax(String(p.lifeKm));
                }} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 14,
                  border: `1.5px solid ${isActive ? "var(--bi-ink)" : "var(--bi-line)"}`,
                  background: isActive ? "rgba(14,14,16,0.05)" : "var(--bi-bg)",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                }}>
                  {isActive && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bi-ok)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M4 12l5 5L20 7"/></svg>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bi-ink)" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 2 }}>{p.brand} · {p.lifeKm.toLocaleString("fr")} km · {p.note}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-jetbrains-mono)" }}>{p.price} €</div>
                    <div style={{ fontSize: 10, color: isActive ? "var(--bi-ok)" : "var(--bi-muted)", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: isActive ? 700 : 400 }}>{isActive ? "Sélectionné" : p.tier === "budget" ? "Budget" : p.tier === "original" ? "Recommandé" : "Premium"}</div>
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Price + Date + Installed km */}
        <div className="bi-grid-3" style={{ marginBottom: 24 }}>
          <div>
            <BiLabel style={{ marginBottom: 8 }}>Prix d&apos;achat (€)</BiLabel>
            <input
              type="number"
              min="0"
              step="0.01"
              style={inputStyle}
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="38"
            />
          </div>
          <div>
            <BiLabel style={{ marginBottom: 8 }}>Date d&apos;installation</BiLabel>
            <input
              type="date"
              style={inputStyle}
              value={installedAt}
              onChange={e => setInstalledAt(e.target.value)}
            />
          </div>
          <div>
            <BiLabel style={{ marginBottom: 8 }}>Km vélo à l&apos;installation</BiLabel>
            <input
              type="number"
              min="0"
              style={inputStyle}
              value={installedKm}
              onChange={e => setInstalledKm(e.target.value)}
            />
          </div>
        </div>

        {/* Km max */}
        <BiLabel style={{ marginBottom: 12 }}>Durée de vie estimée</BiLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {[
            { km: Math.round(selectedType.defaultKm * 0.7), label: "Conservateur" },
            { km: selectedType.defaultKm,                   label: "Recommandé"  },
            { km: Math.round(selectedType.defaultKm * 1.5), label: "Optimiste"   },
          ].map((l) => (
            <button
              key={l.km}
              onClick={() => setKmMax(String(l.km))}
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: 10,
                background: kmMax === String(l.km) ? "var(--bi-ink)" : "var(--bi-card)",
                color: kmMax === String(l.km) ? "var(--bi-bg)" : "var(--bi-ink)",
                border: `1px solid ${kmMax === String(l.km) ? "var(--bi-ink)" : "var(--bi-line)"}`,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <Mono style={{ display: "block", fontSize: 16, fontWeight: 500 }}>
                {l.km.toLocaleString("fr")} km
              </Mono>
              <div style={{
                fontSize: 11,
                color: kmMax === String(l.km) ? "rgba(255,255,255,0.6)" : "var(--bi-muted)",
                marginTop: 2
              }}>
                {l.label}
              </div>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "var(--bi-bad-soft)", color: "var(--bi-bad)", fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ paddingTop: 20, borderTop: "1px solid var(--bi-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => router.back()}
            style={{ background: "transparent", color: "var(--bi-muted)", border: "none", padding: "10px 0", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !bikeId}
            style={{
              padding: "12px 22px",
              background: saving ? "rgba(14,14,16,0.5)" : "var(--bi-ink)",
              color: "var(--bi-bg)",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
            {!saving && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </BiCard>

      {/* Live preview */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <BiCard pad={22} style={{ border: "1px solid var(--bi-accent)", background: "rgba(199,255,63,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <Dot color="var(--bi-accent)" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Aperçu
            </span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.5, lineHeight: 1.3 }}>
            {selectedType.name}
            {brand && <span style={{ color: "var(--bi-muted)", fontWeight: 400 }}> · {brand}</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--bi-muted)", marginTop: 4 }}>
            {bikes.find(b => b.id === bikeId)?.name ?? "—"}
          </div>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--bi-line)", borderRadius: 10, overflow: "hidden" }}>
            {[
              ["Durée de vie", `${parseInt(kmMax).toLocaleString("fr")} km`],
              ["Catégorie", selectedType.category],
              ["Prix", price ? `${price} €` : "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "var(--bi-card)", padding: "12px 14px" }}>
                <BiLabel style={{ fontSize: 10 }}>{k}</BiLabel>
                <Mono style={{ display: "block", fontSize: 14, fontWeight: 500, marginTop: 4 }}>{v}</Mono>
              </div>
            ))}
          </div>
        </BiCard>

        <BiCard pad={22}>
          <BiLabel style={{ marginBottom: 10 }}>Comment ça marche ?</BiLabel>
          <div style={{ fontSize: 13, color: "var(--bi-muted)", lineHeight: 1.55 }}>
            L&apos;usure est calculée automatiquement à chaque synchronisation Strava.{" "}
            <strong style={{ color: "var(--bi-ink)" }}>Km à l&apos;installation</strong> = kilométrage de ton vélo au moment où tu poses le composant.
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--bi-muted)", lineHeight: 1.5 }}>
            Usure = km actuels du vélo − km à l&apos;installation
          </div>
        </BiCard>
      </div>
    </div>
  );
}
