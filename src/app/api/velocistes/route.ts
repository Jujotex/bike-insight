import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { geocodeAddress, findVelocistes, type GeoPoint } from "@/lib/velocistes";

// Recherche de vélocistes proches. Deux modes :
//   ?q=adresse            → géocodage puis recherche
//   ?lat=..&lon=..        → recherche directe (géolocalisation navigateur)
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
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
    } catch {
      return NextResponse.json(
        { error: "Recherche indisponible pour le moment. Réessaie dans un instant." },
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
  } catch {
    return NextResponse.json(
      { error: "Recherche indisponible pour le moment. Réessaie dans un instant." },
      { status: 502 }
    );
  }
}
