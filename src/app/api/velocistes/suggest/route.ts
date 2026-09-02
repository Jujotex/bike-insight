import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { suggestAddresses } from "@/lib/velocistes";

// Autocomplétion d'adresse (type-ahead) — proxy vers Photon.
export async function GET(request: Request) {
  // Cookie (web) ou jeton en en-tête (app native) — cf. `lib/api-auth.ts`.
  const auth = await getApiUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await suggestAddresses(q);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
