import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/data";
import { DashboardClient } from "./client";

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/login");

  const {
    user, bikes, activityChart, kpis,
    readinessByBike, attentionItems, bikeStatus,
    predictions, budget12m, budget12mTotal, wearByCategoryByBike,
  } = data;

  const userName = (user.user_metadata?.full_name as string)?.split(" ")[0] ?? "toi";
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page" style={{ maxWidth: 1200 }}>
        <DashboardClient
          userName={userName}
          todayCap={todayCap}
          bikes={bikes as unknown as Array<Record<string, unknown>>}
          activityChart={activityChart}
          kpis={kpis}
          readinessByBike={readinessByBike}
          attentionItems={attentionItems}
          bikeStatus={bikeStatus}
          predictions={predictions}
          budget12m={budget12m}
          budget12mTotal={budget12mTotal}
          wearByCategoryByBike={wearByCategoryByBike}
        />
      </div>
    </AppShell>
  );
}
