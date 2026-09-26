/**
 * Réduction générale dégressive unique (RGDU 2026) sur les cotisations
 * patronales, selon la formule publiée par l'Urssaf :
 *
 *   coefficient = Tmin + Tdelta × [ 0,5 × (3 × SMIC annuel / brut annuel − 1) ]^P
 *
 * Nul à partir de 3 SMIC, plafonné à Tmin + Tdelta, arrondi à 4 décimales.
 */

/** Durée légale mensuelle (35 h × 52 / 12). */
const HEURES_MOIS_LEGALES = 151.67;
/** SMIC mensuel brut de référence de l'exemple Urssaf (151,67 h). */
const SMIC_MENSUEL_REFERENCE = 1823.03;

const T_MIN = 0.02;
const T_DELTA_MOINS_50 = 0.38;
const T_DELTA_50_ET_PLUS = 0.3821;
const PUISSANCE = 1.75;

interface ParametresRGDU {
  /** Salaire brut du mois (€). */
  brutMensuel: number;
  /** Heures du mois du salarié (temps partiel : SMIC proratisé). */
  heuresMois?: number;
  smicMensuelReference?: number;
  /** Entreprise de moins de 50 salariés (Tdelta = 0,38 sinon 0,3821). */
  effectifMoins50?: boolean;
}

interface ResultatRGDU {
  coefficient: number;
  reduction: number;
}

const arrondi = (n: number, decimales: number): number => {
  const f = 10 ** decimales;
  return Math.round((n + Number.EPSILON) * f) / f;
};

export function calculerCoefficientRGDU({
  brutMensuel,
  heuresMois = HEURES_MOIS_LEGALES,
  smicMensuelReference = SMIC_MENSUEL_REFERENCE,
  effectifMoins50 = true,
}: ParametresRGDU): ResultatRGDU {
  if (!(brutMensuel > 0) || !(heuresMois > 0)) {
    return { coefficient: 0, reduction: 0 };
  }
  const tDelta = effectifMoins50 ? T_DELTA_MOINS_50 : T_DELTA_50_ET_PLUS;
  const plafond = T_MIN + tDelta;

  // Les facteurs 12 du brut et du SMIC annuels s'annulent dans le rapport.
  const smicMois = smicMensuelReference * (heuresMois / HEURES_MOIS_LEGALES);
  if (brutMensuel >= 3 * smicMois) return { coefficient: 0, reduction: 0 };

  const base = 0.5 * ((3 * smicMois) / brutMensuel - 1);
  const brut = T_MIN + tDelta * Math.pow(base, PUISSANCE);
  const coefficient = arrondi(Math.min(plafond, brut), 4);
  return { coefficient, reduction: arrondi(brutMensuel * coefficient, 2) };
}
