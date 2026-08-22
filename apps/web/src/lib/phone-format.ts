/**
 * Mise en forme d'un numéro de téléphone français : un espace tous les deux
 * chiffres (06 12 34 56 78).
 *
 * Plusieurs formulaires utilisaient un champ texte brut : le numéro s'y
 * saisissait d'un bloc, difficile à relire et à vérifier.
 */
export function formaterTelephone(valeur: string): string {
  const chiffres = valeur.replace(/\D/g, "").slice(0, 15);
  return chiffres.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

/** Numéro sans séparateur, pour l'enregistrement et les liens « tel: ». */
export function telephoneBrut(valeur: string): string {
  return valeur.replace(/\D/g, "");
}
