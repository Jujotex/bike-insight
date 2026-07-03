import { redirect } from "next/navigation";

// Page fusionnée dans le dashboard (audit UX P3) : les alertes vivent
// dans les blocs « À traiter » et « Entretien à prévoir ».
export default function NotificationsPage() {
  redirect("/dashboard");
}
