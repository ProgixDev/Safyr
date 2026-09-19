import { TimeOffScreen } from "../_components/TimeOffScreen";

/**
 * « Gestion des absences » : uniquement les absences (maladie, accident du
 * travail, absence injustifiée ou autorisée, congé sans solde…).
 * Les congés payés et RTT sont dans « Gestion des Congés ».
 */
export default function AbsencesPage() {
  return <TimeOffScreen mode="absence" />;
}
