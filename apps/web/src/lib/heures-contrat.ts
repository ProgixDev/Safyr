/**
 * Conversion heures hebdomadaires (stockées dans le contrat) ↔ heures
 * mensuelles (affichées et saisies dans l'analyse des coûts).
 */

/** Semaines par mois moyen : 35 h / semaine → 151,67 h / mois. */
const SEMAINES_PAR_MOIS = 52 / 12;

const arrondi = (n: number, decimales: number): number => {
  const f = 10 ** decimales;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/**
 * Heures mensuelles saisies → heures hebdomadaires à stocker.
 *
 * 6 décimales : à 2 décimales, 108 h devenait 24,92 h/semaine, qui revenait
 * à 107,99 h/mois (24,92 × 52/12). Le champ du contrat est un flottant :
 * autant garder la précision, l'aller-retour est alors exact au centième.
 */
export function heuresMensuellesVersHebdo(mensuelles: number): number {
  const hebdo = arrondi((mensuelles * 12) / 52, 6);
  // Une durée hebdo « à 2 décimales » est prise pour un ancien enregistrement
  // (voir ci-dessous) : on la décale d'un dixième de millième pour les saisies
  // non entières (ex. 2,99 h → 0,69 h), afin qu'elles ne soient pas ramenées.
  if (isDeuxDecimales(hebdo) && !Number.isInteger(mensuelles)) {
    return arrondi(hebdo + 0.00001, 6);
  }
  return hebdo;
}

const isDeuxDecimales = (hebdo: number): boolean =>
  Math.abs(hebdo * 100 - Math.round(hebdo * 100)) < 1e-6;

/**
 * Heures hebdomadaires du contrat → heures mensuelles (2 décimales).
 * Les contrats enregistrés avant la correction portent une durée hebdo arrondie
 * à 2 décimales (24,92 pour 108 h, soit 107,99) : pour une durée hebdo à 2
 * décimales dont le mensuel est à moins de 0,022 h d'un entier (erreur maximale
 * de cet arrondi), on rend l'entier. Les valeurs écrites depuis la correction
 * ont 6 décimales et ne sont jamais ramenées : 107,99 saisi reste 107,99.
 */
export function heuresHebdoVersMensuelles(hebdo: number): number {
  const brut = hebdo * SEMAINES_PAR_MOIS;
  const entier = Math.round(brut);
  if (isDeuxDecimales(hebdo) && Math.abs(brut - entier) < 0.022) return entier;
  return arrondi(brut, 2);
}
