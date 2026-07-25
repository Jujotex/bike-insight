import { redirect } from "next/navigation";
import { getDashboardData } from "@/lib/data";
import { DashboardClient } from "./client";

export default async function DashboardPage() {
  const data = await getDashboardData();
  if (!data) redirect("/login");

  const {
    user, bikes,
    readinessByBike, attentionItems, okItems, predictions,
    maintenanceAlerts, maintenanceSummaryByBike,
    km12mByBike, rides12mByBike,
  } = data;

  const userName = (user.user_metadata?.full_name as string)?.split(" ")[0] ?? "toi";
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <>
      <div className="bi-page">
        <DashboardClient
          userName={userName}
          todayCap={todayCap}
          bikes={bikes as unknown as Array<Record<string, unknown>>}
          readinessByBike={readinessByBike}
          attentionItems={attentionItems}
          okItems={okItems}
          predictions={predictions}
          maintenanceAlerts={maintenanceAlerts}
          maintenanceSummaryByBike={maintenanceSummaryByBike}
          km12mByBike={km12mByBike}
          rides12mByBike={rides12mByBike}
        />
      </div>
    </>
  );
}
