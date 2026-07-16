import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { suggestAddresses } from "@/lib/velocistes";

// Autocomplétion d'adresse (type-ahead) — proxy vers Photon.
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
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
