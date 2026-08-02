import { redirect } from "next/navigation";

/**
 * Le menu « Compteur heures sup. » faisait doublon avec « Suivi compteur
 * heures sup. ». Il a été fusionné : son contenu est désormais l'onglet
 * « Vue globale » de la page de suivi. On redirige les anciens liens.
 */
export default function OvertimeCounterPage() {
  redirect("/dashboard/hr/time-activity/track-overtime-counter");
}
