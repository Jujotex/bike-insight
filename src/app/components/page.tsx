import { AppShell } from "@/components/bi/app-shell";
import { SideNavLoader } from "@/components/bi/side-nav-loader";
import { redirect } from "next/navigation";
import { getComponentsData } from "@/lib/data";
import { ComponentsClient } from "./client";

export default async function ComponentsPage() {
  const data = await getComponentsData();
  if (!data) redirect("/login");

  return (
    <AppShell nav={<SideNavLoader />}>
      <ComponentsClient
        components={data.components}
        bikes={data.bikes}
        bikeNames={data.bikeNames}
        replacementLogs={data.replacementLogs}
        kpis={data.kpis}
      />
    