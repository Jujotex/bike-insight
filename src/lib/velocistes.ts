// Recherche de vélocistes proches à partir d'une adresse — 100 % OpenStreetMap,
// sans clé API ni dépendance : géocodage via Nominatim, autocomplétion via Photon,
// recherche des magasins vélo via Overpass. Renvoie une liste (pas de carte).
//
// ⚠️ Données communautaires OSM : couverture correcte mais parfois incomplète.
// Usage respectueux des serveurs publics (User-Agent identifiant, faible volume).

import { SUPPORT_EMAIL } from "./contact";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
// Overpass : serveurs publics gratuits, régulièrement saturés (429 / 502 / 504)
// ou en maintenance. Interrogés en parallèle (voir `raceOverpassMirrors`).
//
// ⚠️ Un miroir qui PEND coûte plus cher qu'un miroir qui échoue : `Promise.any`
// n'abandonne qu'une fois toutes les promesses réglées, donc le plus lent fixe
// le prix de chaque échec. `overpass.kumi.systems` a été retiré pour ça — il ne
// figurait plus dans la liste des instances publiques du wiki OSM, répondait
// 502, puis s'est mis à ne plus répondre du tout : il imposait à lui seul 15s
// d'attente (notre délai d'abandon) avant la seconde tentative, sur une
// recherche qui aboutissait ensuite en 4s.
//
// N'ajouter ici qu'une instance mondiale, sans clé, et documentée sur le wiki
// OSM. VK Maps (`maps.mail.ru`) remplit ces critères mais reçoit la position
// approximative de l'utilisateur : écarté pour cette raison.
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
// Photon (Komoot) : moteur de géocodage OSM pensé pour l'autocomplétion
// type-ahead (Nominatim l'interdit sur son serveur public). Gratuit, sans clé.
const PHOTON_URL = "https://photon.komoot.io/api/";
// ASCII uniquement, et une adresse de contact.
//
// L'ancienne valeur contenait un accent (« assistant d'entretien vélo ») :
// `fetch` sérialise les en-têtes en latin-1 et envoyait un octet 0xE9 brut,
// hors US-ASCII. Testé contre Overpass : **ce n'était pas la cause de la panne
// de l'annuaire**, le serveur répond 200 avec l'accent. On garde quand même
// l'ASCII (un octet non-ASCII dans un en-tête est à la merci du premier WAF
// venu) et on ajoute le contact, que la politique d'usage OSM demande.
//
// À remplacer par l'URL du site le jour où le domaine tourne, comme prévu dans
// `lib/contact.ts`.
const USER_AGENT = `BikeInsight/1.0 (bike maintenance assistant; ${SUPPORT_EMAIL})`;
// Deux tentatives, avec deux budgets. Le premier est une sonde courte : une
// réponse Overpass saine arrive en 1 à 4s, inutile d'attendre davantage avant
// de retenter ailleurs. La seconde est plus patiente.
//
// Dans chaque paire, le budget annoncé à Overpass reste SOUS notre abandon
// réseau : le serveur doit avoir le temps de dire « je renonce » avant qu'on
// coupe, sinon la cause est illisible. Et le total (5 + 1 + 8) tient la
// promesse qui compte : **jamais plus de ~15s de roue qui tourne**, même si un
// miroir pend au lieu d'échouer. L'ancienne version pouvait atteindre 31s.
const OVERPASS_ATTEMPTS = [
  { queryTimeoutS: 4, abortMs: 5000 },
  { queryTimeoutS: 6, abortMs: 8000 },
];
const RETRY_PAUSE_MS = 1000;
/** Marqueur d'erreur « quota Overpass épuisé », lu par la route API. */
export const RATE_LIMITED_PREFIX = "overpass-rate-limited:";

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
//
// Nominatim d'abord (le plus précis sur les adresses françaises), puis repli
// sur Photon — déjà utilisé pour l'autocomplétion, donc aucune dépendance en
// plus. Nominatim bloque volontiers les IP de datacenter (Vercel) : sans ce
// repli, une adresse parfaitement valide renvoyait « Recherche indisponible ».
export async function geocodeAddress(query: string): Promise<GeoPoint | null> {
  try {
    const url =
      `${NOMINATIM_URL}?format=jsonv2&limit=1&addressdetails=0&q=${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(
      url,
      { headers: { "User-Agent": USER_AGENT, "Accept-Language": "fr" }, cache: "no-store" },
      10000
    );
    if (res.ok) {
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (Array.isArray(data) && data.length > 0) {
        const hit = data[0];
        return { lat: Number(hit.lat), lon: Number(hit.lon), label: hit.display_name };
      }
    } else {
      console.warn("[velocistes] Nominatim HTTP " + res.status + " — repli sur Photon");
    }
  } catch (err) {
    console.warn("[velocistes] Nominatim injoignable — repli sur Photon", err);
  }

  const [first] = await suggestAddresses(query);
  return first ? { lat: first.lat, lon: first.lon, label: first.label } : null;
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

// ── Cache des résultats Overpass ──────────────────────────────
//
// Les instances publiques d'Overpass sont franchement instables : mesuré sur
// une même minute depuis une IP résidentielle, la même requête a renvoyé 200,
// puis 429 (quota), puis 504 (surcharge) et 502. Le meilleur correctif n'est
// pas de mieux réessayer, c'est de moins demander.
//
// On mémorise les ÉLÉMENTS bruts, pas les `Velociste` : les distances sont
// calculées depuis le point exact de l'utilisateur, alors que la clé de cache
// arrondit à 2 décimales (~1,1 km). Recalculer à la sortie évite d'afficher la
// distance du voisin. Le rayon de recherche, lui, part du centre arrondi : sur
// 15 km, l'écart aux marges est acceptable.
//
// Mémoire du process : sur Vercel, le cache vit le temps d'une instance tiède.
// C'est déjà l'essentiel du gain (un cycliste qui cherche deux fois, deux
// cyclistes de la même ville) pour zéro infrastructure.
const ELEMENTS_CACHE = new Map<string, { at: number; elements: OverpassElement[] }>();
const ELEMENTS_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // un magasin ne déménage pas dans la journée
const ELEMENTS_CACHE_MAX = 200;

function cacheKey(lat: number, lon: number, radiusM: number): string {
  return `${lat.toFixed(2)}/${lon.toFixed(2)}/${radiusM}`;
}

// Interroge tous les miroirs EN PARALLÈLE, le premier qui répond gagne.
// En séquentiel, des miroirs lents cumulaient leurs délais : jusqu'à 45s
// d'attente avant même le message d'erreur. Ici le pire cas est celui d'un seul
// miroir. Le surcoût pour ces serveurs publics gratuits reste acceptable : la
// recherche part d'un clic explicite sur une page de tuto, pas d'un chargement
// de page — et le cache au-dessus absorbe les répétitions.
async function raceOverpassMirrors(
  query: string,
  abortMs: number
): Promise<{ elements?: OverpassElement[] }> {
  try {
    return await Promise.any(
      OVERPASS_URLS.map(async (endpoint) => {
        const host = new URL(endpoint).host;
        try {
          const res = await fetchWithTimeout(
            endpoint,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "User-Agent": USER_AGENT,
              },
              body: "data=" + encodeURIComponent(query),
              cache: "no-store",
            },
            abortMs
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return (await res.json()) as { elements?: OverpassElement[] };
        } catch (err) {
          // Préfixer par l'hôte, y compris pour les erreurs réseau : un
          // « This operation was aborted » anonyme au milieu de la liste des
          // causes ne dit pas quel miroir a pendu.
          throw new Error(`${host} → ${err instanceof Error ? err.message : String(err)}`);
        }
      })
    );
  } catch (err) {
    // Promise.any n'échoue que si TOUS échouent : on remonte toutes les causes,
    // pas seulement la dernière. C'est ce détail qui distingue « miroirs
    // saturés » (429/502/504) d'un vrai problème de requête (400) ou de réseau.
    const causes =
      err instanceof AggregateError
        ? err.errors.map((e) => (e instanceof Error ? e.message : String(e))).join(" · ")
        : String(err);
    console.warn("[velocistes] Overpass — tous les miroirs ont échoué : " + causes);
    // Le 429 mérite son propre message côté cycliste : « réessaie dans un
    // instant » est un mauvais conseil quand la cause est justement d'avoir
    // trop cherché d'affilée.
    throw new Error(
      (causes.includes("HTTP 429") ? RATE_LIMITED_PREFIX : "overpass: tous les miroirs ont échoué") +
        " (" + causes + ")"
    );
  }
}

// Cherche les magasins vélo (shop=bicycle) dans un rayon donné (mètres),
// triés par distance croissante. Limité à `max` résultats.
export async function findVelocistes(
  lat: number,
  lon: number,
  radiusM: number,
  max = 12
): Promise<Velociste[]> {
  const key = cacheKey(lat, lon, radiusM);
  const hit = ELEMENTS_CACHE.get(key);
  if (hit && Date.now() - hit.at < ELEMENTS_CACHE_TTL_MS) {
    return toVelocistes(hit.elements, lat, lon, max);
  }

  // Sonde courte, puis seconde tentative plus patiente. Les 502/504 observés
  // sont transitoires et indépendants d'un miroir à l'autre : réessayer rattrape
  // une bonne partie des échecs, et ne coûte du temps que dans le cas où on
  // allait de toute façon afficher une erreur. On n'insiste pas sur un 429 : le
  // quota ne se libère pas en une seconde, et réessayer l'enfonce.
  const buildQuery = (timeoutS: number) =>
    `[out:json][timeout:${timeoutS}];` +
    `(nwr["shop"="bicycle"](around:${radiusM},${lat},${lon}););` +
    `out center tags 60;`;

  let json: { elements?: OverpassElement[] } | null = null;
  let lastError: unknown = null;
  for (const [i, attempt] of OVERPASS_ATTEMPTS.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, RETRY_PAUSE_MS));
    try {
      json = await raceOverpassMirrors(buildQuery(attempt.queryTimeoutS), attempt.abortMs);
      break;
    } catch (err) {
      lastError = err;
      if (err instanceof Error && err.message.startsWith(RATE_LIMITED_PREFIX)) throw err;
    }
  }
  if (!json) throw lastError;

  const elements = json.elements ?? [];

  // FIFO simple : la Map JS conserve l'ordre d'insertion, la plus ancienne
  // entrée sort en premier. Pas de LRU — 200 zones suffisent largement et une
  // vraie politique d'éviction serait du zèle ici.
  if (ELEMENTS_CACHE.size >= ELEMENTS_CACHE_MAX) {
    const oldest = ELEMENTS_CACHE.keys().next().value;
    if (oldest !== undefined) ELEMENTS_CACHE.delete(oldest);
  }
  ELEMENTS_CACHE.set(key, { at: Date.now(), elements });

  return toVelocistes(elements, lat, lon, max);
}

// Éléments OSM bruts → vélocistes triés par distance au point demandé.
function toVelocistes(
  elements: OverpassElement[],
  lat: number,
  lon: number,
  max: number
): Velociste[] {
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
