import { redirect } from "next/navigation";

/** Ancienne adresse du suivi des congés payés : il vit désormais dans « Gestion des Congés ». */
export default function PaidLeaveTrackingRedirect(): never {
  redirect("/dashboard/hr/time-activity/conges?onglet=soldes");
}
