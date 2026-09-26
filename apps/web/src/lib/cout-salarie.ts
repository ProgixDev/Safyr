import { calculerCoefficientRGDU } from "./rgdu";

const arrondi2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

interface EntreeCout {
  brut: number;
  /** Heures du mois : dénominateur du coût horaire et proratisation du SMIC. */
  heures: number;
  tauxPatronal: number;
  tauxSalarial: number;
  appliquerRgdu: boolean;
  effectifMoins50: boolean;
}

interface LigneCout {
  chargesSalariales: number;
  net: number;
  /** Brut × taux patronal, avant réduction. */
  chargesPatronales: number;
  coefficientRgdu: number;
  reductionRgdu: number;
  /** max(0, charges patronales − réduction RGDU). */
  chargesPatronalesApresReduction: number;
  coutTotal: number;
  coutHoraire: number;
}

/** Formules de l'analyse des coûts, partagées par le tableau et l'aperçu. */
export function calculerCout(e: EntreeCout): LigneCout {
  const chargesPatronales = arrondi2((e.brut * e.tauxPatronal) / 100);
  const chargesSalariales = arrondi2((e.brut * e.tauxSalarial) / 100);
  const rgdu = e.appliquerRgdu
    ? calculerCoefficientRGDU({
        brutMensuel: e.brut,
        heuresMois: e.heures > 0 ? e.heures : undefined,
        effectifMoins50: e.effectifMoins50,
      })
    : { coefficient: 0, reduction: 0 };
  const apres = arrondi2(Math.max(0, chargesPatronales - rgdu.reduction));
  const coutTotal = arrondi2(e.brut + apres);
  return {
    chargesSalariales,
    net: arrondi2(e.brut - chargesSalariales),
    chargesPatronales,
    coefficientRgdu: rgdu.coefficient,
    reductionRgdu: rgdu.reduction,
    chargesPatronalesApresReduction: apres,
    coutTotal,
    coutHoraire: e.heures > 0 ? arrondi2(coutTotal / e.heures) : 0,
  };
}
