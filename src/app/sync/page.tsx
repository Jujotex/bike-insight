import { redirect } from "next/navigation";

// Page fusionnée dans Compte (audit UX P3) : le statut de connexion Strava
// et le bouton de synchronisation vivent déjà sur /account.
export default function SyncPage() {
  redirect("/account");
}
