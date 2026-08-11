/**
 * Numéro de TVA intracommunautaire français.
 *
 * Il se déduit du SIREN : FR + clé sur deux chiffres + les 9 chiffres du SIREN,
 * la clé valant (12 + 3 × (SIREN mod 97)) mod 97. Il n'y a donc rien à aller
 * chercher : saisir le SIRET suffit à connaître la TVA.
 */
export function tvaDepuisSiretOuSiren(valeur: string): string {
  const chiffres = valeur.replace(/\D/g, "");
  const siren = chiffres.slice(0, 9);
  if (siren.length !== 9) return "";
  const cle = (12 + 3 * (Number(siren) % 97)) % 97;
  return `FR${String(cle).padStart(2, "0")}${siren}`;
}
