"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, PageHead } from "@/components/bi/ui";
import { SkelCard } from "@/components/bi/skeleton";
import { supabase } from "@/lib/supabase";
import { useAsyncData } from "@/lib/use-async-data";
import { AccountClient } from "./client";

/**
 * Page Compte — convertie en composant client (phase 2.1, lot 3).
 *
 * Les quatre requêtes étaient **séquentielles** dans la version serveur, alors
 * qu'aucune ne dépend des autres : quatre allers-retours en file au lieu d'un.
 * Elles partent désormais en parallèle.
 */
export default function AccountPage() {
  const router = useRouter();

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return null;
    }

    const [{ data: profile }, { data: bikes }, { data: components }, { count: notifCount }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("strava_athlete_id, strava_access_token")
          .eq("id", user.id)
          .single(),
        supabase.from("bikes").select("id, name").eq("user_id", user.id).eq("is_active", true),
        supabase.from("components").select("id").eq("user_id", user.id).eq("is_active", true),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false),
      ]);

    const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";
    const email = user.email ?? "";

    return {
      userId: user.id,
      firstName:
        (user.user_metadata?.first_name as string | undefined) ?? fullName.split(" ")[0] ?? "",
      lastName:
        (user.user_metadata?.last_name as string | undefined) ??
        fullName.split(" ").slice(1).join(" ") ??
        "",
      email,
      initials:
        fullName
          .split(/[\s.]+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w: string) => w[0].toUpperCase())
          .join("") ||
        email[0]?.toUpperCase() ||
        "?",
      stravaConnected: !!profile?.strava_athlete_id,
      bikes: (bikes ?? []).map((b) => ({ id: b.id as string, name: b.name as string })),
      bikeCount: bikes?.length ?? 0,
      componentCount: components?.length ?? 0,
      unreadNotifCount: notifCount ?? 0,
      memberSince: new Date(user.created_at).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
    };
  }, [router]);

  const { data, loading, error } = useAsyncData(load, []);

  if (loading && !data) {
    return (
      <div className="bi-page">
        <PageHead title="Mon compte" sub="" />
        <SkelCard h={180} style={{ marginBottom: 14 }} />
        <SkelCard h={260} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bi-page">
        <PageHead title="Mon compte" sub="" />
        <EmptyState
          title="Chargement impossible"
          text="Ton compte n'a pas pu être récupéré. Vérifie ta connexion et réessaie."
        />
      </div>
    );
  }

  if (!data) return null; // redirection vers /login en cours

  return (
    <div className="bi-page">
      <PageHead title="Mon compte" sub={`Membre depuis ${data.memberSince}`} />
      <AccountClient
        userId={data.userId}
        firstName={data.firstName}
        lastName={data.lastName}
        email={data.email}
        initials={data.initials}
        stravaConnected={data.stravaConnected}
        bikes={data.bikes}
        bikeCount={data.bikeCount}
        componentCount={data.componentCount}
        unreadNotifCount={data.unreadNotifCount}
        memberSince={data.memberSince}
      />
    </div>
  );
}
