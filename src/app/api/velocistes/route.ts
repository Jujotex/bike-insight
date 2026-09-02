import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { geocodeAddress, findVelocistes, RATE_LIMITED_PREFIX, type GeoPoint } from "@/lib/velocistes";

// Recherche de vélocistes proches. Deux modes :
//   ?q=adresse            → géocodage puis recherche
//   ?lat=..&lon=..        → recherche directe (géolocalisation navigateur)
export async function GET(request: Request) {
  // Cookie (web) ou jeton en en-tête (app native) — cf. `lib/api-auth.ts`.
  const auth = await getApiUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const latRaw = searchParams.get("lat");
  const lonRaw = searchParams.get("lon");

  let origin: GeoPoint | null = null;
  if (latRaw && lonRaw) {
    const lat = Number(latRaw);
    const lon = Number(lonRaw);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      origin = { lat, lon, label: "Ma position" };
    }
  } else if (q && q.length >= 2) {
    try {
      origin = await geocodeAddress(q);
    } catch (err) {
      // Sans ce log, un échec de géocodage et un échec de recherche de magasins
      // produisaient le même message opaque, sans trace côté serveur.
      console.error("[api/velocistes] géocodage échoué pour", q, err);
      return NextResponse.json(
        { error: "Impossible de localiser cette adresse pour le moment. Réessaie dans un instant." },
        { status: 502 }
      );
    }
  }

  if (!origin) {
    return NextResponse.json(
      { error: "Adresse introuvable. Précise la ville ou le code postal." },
      { status: 404 }
    );
  }

  try {
    const shops = await findVelocistes(origin.lat, origin.lon, 15000);
    return NextResponse.json({ origin, shops });
  } catch (err) {
    console.error("[api/velocistes] recherche magasins échouée", origin, err);
    const rateLimited = err instanceof Error && err.message.startsWith(RATE_LIMITED_PREFIX);
    return NextResponse.json(
      {
        error: rateLimited
          ? "Trop de recherches d'affilée sur l'annuaire OpenStreetMap. Attends une minute et réessaie."
          : "L'annuaire des magasins ne répond pas. Réessaie dans un instant.",
        // `detail` porte les causes réelles (hôte + code HTTP de chaque miroir).
        // L'utilisateur ne le voit pas ; la console du navigateur l'affiche.
        // Sans ça, la panne se diagnostiquait uniquement dans les logs serveur,
        // inaccessibles depuis la page où elle se produit.
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
