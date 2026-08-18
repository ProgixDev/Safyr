/**
 * Périodes de paie proposées dans les sélecteurs.
 *
 * Les écrans de paie listaient des périodes d'exemple ; une fois celles-ci
 * retirées le sélecteur n'affichait plus rien. Les périodes sont désormais
 * calculées à partir du mois en cours — c'est du calendrier, pas de la donnée.
 */
export interface PeriodePaie {
  id: string;
  month: number;
  year: number;
  label: string;
}

const MOIS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

/** Les `nombre` derniers mois, du plus récent au plus ancien. */
export function periodesRecentes(nombre = 12): PeriodePaie[] {
  const reference = new Date();
  return Array.from({ length: nombre }, (_, i) => {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return {
      id: `${year}-${String(month).padStart(2, "0")}`,
      month,
      year,
      label: `${MOIS[d.getMonth()]} ${year}`,
    };
  });
}
