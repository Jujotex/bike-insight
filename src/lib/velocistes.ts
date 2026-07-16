// Recherche de vélocistes proches à partir d'une adresse — 100 % OpenStreetMap,
// sans clé API ni dépendance : géocodage via Nominatim, autocomplétion via Photon,
// recherche des magasins vélo via Overpass. Renvoie une liste (pas de carte).
//
// ⚠️ Données communautaires OSM : couverture correcte mais parfois incomplète.
// Usage respectueux des serveurs publics (User-Agent identifiant, faible volume).

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
// Photon (Komoot) : moteur de géocodage OSM pensé pour l'autocomplétion
// type-ahead (Nominatim l'interdit sur son serveur public). Gratuit, sans clé.
const PHOTON_URL = "https://photon.komoot.io/api/";
const USER_AGENT = "BikeInsight/1.0 (assistant d'entretien vélo)";

export type GeoPoint = { lat: number; lon: number; label: string };

export type AddressSuggestion = { label: string; lat: number; lon: number };

export type Velociste = {
  id: string;
  name: string;
  distanceKm: number;
  address: string;
  lat: number;
  lon: number;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  mapsUrl: string; // lien itinéraire externe (ouvre l'app de cartes du user)
};

// fetch avec timeout, pour ne pas laisser une requête pendre indéfiniment.
async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Distance à vol d'oiseau (Haversine), en km.
function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Compose une adresse lisible à partir des tags OSM (souvent partiels).
function formatAddress(tags: Record<string, string>): string {
  const line = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const city = [tags["addr:postcode"], tags["addr:city"]].filter(Boolean).join(" ");
  return [line, city].filter(Boolean).join(", ");
}

// Géocode une adresse libre → point (lat/lon). null si introuvable.
export async function geocodeAddress(query: string): Promise<GeoPoint | null> {
  const url =
    `${NOMINATIM_URL}?format=jsonv2&limit=1&addressdetails=0&q=${encodeURIComponent(query)}`;
  const res = await fetchWithTimeout(
    url,
    { headers: { "User-Agent": USER_AGENT, "Accept-Language": "fr" }, cache: "no-store" },
    10000
  );
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!Array.isArray(data) || data.length === 0) return null;
  const hit = data[0];
  return { lat: Number(hit.lat), lon: Number(hit.lon), label: hit.display_name };
}

// Autocomplétion d'adresse (type-ahead) via Photon. Renvoie quelques
// suggestions avec leurs coordonnées, pour lancer la recherche sans
// second géocodage. Tolérant : liste vide en cas d'échec.
export async function suggestAddresses(query: string): Promise<AddressSuggestion[]> {
  const url = `${PHOTON_URL}?q=${encodeURIComponent(query)}&lang=fr&limit=6`;
  const res = await fetchWithTimeout(
    url,
    { headers: { "User-Agent": USER_AGENT }, cache: "no-store" },
    6000
  );
  if (!res.ok) return [];
  const json = (await res.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: Record<string, string>;
    }>;
  };

  const out: AddressSuggestion[] = [];
  const seen = new Set<string>();
  for (const f of json.features ?? []) {
    const coords = f.geometry?.coordinates;
    if (!coords || coords.length < 2) continue;
    const p = f.properties ?? {};
    const line1 = p.name || [p.housenumber, p.street].filter(Boolean).join(" ");
    const line2 = [p.postcode, p.city].filter(Boolean).join(" ");
    const label = [line1, line2, p.country].filter(Boolean).join(", ");
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push({ label, lat: coords[1], lon: coords[0] });
  }
  return out;
}

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

// Cherche les magasins vélo (shop=bicycle) dans un rayon donné (mètres),
// triés par distance croissante. Limité à `max` résultats.
export async function findVelocistes(
  lat: number,
  lon: number,
  radiusM: number,
  max = 12
): Promise<Velociste[]> {
  const query =
    `[out:json][timeout:25];` +
    `(nwr["shop"="bicycle"](around:${radiusM},${lat},${lon}););` +
    `out center tags 60;`;

  const res = await fetchWithTimeout(
    OVERPASS_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
      body: "data=" + encodeURIComponent(query),
      cache: "no-store",
    },
    15000
  );
  if (!res.ok) throw new Error("overpass " + res.status);

  const json = (await res.json()) as { elements?: OverpassElement[] };
  const elements = json.elements ?? [];

  const shops: Velociste[] = [];
  for (const el of elements) {
    const tags = el.tags ?? {};
    const eLat = el.lat ?? el.center?.lat;
    const eLon = el.lon ?? el.center?.lon;
    if (eLat === undefined || eLon === undefined) continue;
    const name = tags.name?.trim();
    if (!name) continue; // on ignore les magasins sans nom
    shops.push({
      id: `${el.type}/${el.id}`,
      name,
      distanceKm: haversineKm(lat, lon, eLat, eLon),
      address: formatAddress(tags),
      lat: eLat,
      lon: eLon,
      // On tente plusieurs clés OSM : les contributeurs utilisent des variantes.
      phone:
        tags.phone ??
        tags["contact:phone"] ??
        tags["contact:mobile"] ??
        tags["phone:mobile"] ??
        null,
      website:
        tags.website ??
        tags["contact:website"] ??
        tags.url ??
        tags["contact:url"] ??
        null,
      openingHours: tags.opening_hours ?? null,
      mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${eLat},${eLon}`,
    });
  }

  shops.sort((a, b) => a.distanceKm - b.distanceKm);
  return shops.slice(0, max);
}
