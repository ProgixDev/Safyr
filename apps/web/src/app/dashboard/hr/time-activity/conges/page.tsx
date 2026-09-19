import { CongesTabs, type OngletConges } from "../_components/CongesTabs";

/**
 * « Gestion des Congés » : écran distinct de « Gestion des absences ».
 * L'ancienne page « Suivi Congés Payés » redirige ici (?onglet=soldes).
 */
export default async function CongesPage({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string }>;
}) {
  const { onglet } = await searchParams;
  const ongletInitial: OngletConges =
    onglet === "soldes" ? "soldes" : "demandes";
  return <CongesTabs ongletInitial={ongletInitial} />;
}
