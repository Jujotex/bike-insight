import { redirect } from "next/navigation";

// La liste globale des pièces n'a plus d'entrée de navigation : les composants
// se consultent depuis le détail de chaque vélo. On redirige vers /bikes.
export default function ComponentsPage() {
  redirect("/bikes");
}
