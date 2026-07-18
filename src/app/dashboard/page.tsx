import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/data";
import { DashboardClient } from "./client";

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/login");

  const {
    user, bikes, kpis,
    readinessByBike, attentionItems,
    predictions, budgetByBike, wearByCategoryByBike,
    maintenanceAlerts, maintenanceSummaryByBike,
    km12mByBike, rides12mByBike,
  } = data;

  const userName = (user.user_metadata?.full_name as string)?.split(" ")[0] ?? "toi";
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <AppShell nav={<SideNavLoader />}>
      <div className="bi-page">
        <DashboardClient
          userName={userName}
          todayCap={todayCap}
          bikes={bikes as unknown as Array<Record<string, unknown>>}
          kpis={kpis}
          readinessByBike={readinessByBike}
          attentionItems={attentionItems}
          predictions={predictions}
          maintenanceAlerts={maintenanceAlerts}
          maintenanceSummaryByBike={maintenanceSummaryByBike}
          budgetByBike={budgetByBike}
          wearByCategoryByBike={wearByCategoryByBike}
          km12mByBike={km12mByBike}
          rides12mByBike={rides12mByBike}
        />
      </div>
    </AppShell>
  );
}
