"use client";

import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import {
  listContracts,
  updateContract,
  type Contract,
} from "@safyr/api-client";
import { useEmployees } from "@/hooks/employees";
import { contractKeys } from "@/hooks/contracts";
import type { PersonnelCost } from "@/lib/types";
import { arrondi2 } from "@/lib/payroll-primes";
import { calculerCout } from "@/lib/cout-salarie";
import {
  heuresHebdoVersMensuelles,
  heuresMensuellesVersHebdo,
} from "@/lib/heures-contrat";
import {
  ANCIEN_TAUX_PATRONAL_DEFAUT,
  CLE_RGDU_ACTIVE,
  CLE_TAUX_PATRONAL,
  CLE_TAUX_SALARIAL,
  TAUX_PATRONAL_DEFAUT,
  TAUX_SALARIAL_DEFAUT,
  useParametresPaie,
} from "./use-parametres-paie";

const HEURES_HEBDO_DEFAUT = 35;
/** Seuil de la RGDU « moins de 50 salariés » (Tdelta = 0,38). */
const EFFECTIF_SEUIL_RGDU = 50;

export interface CoutSalarie extends PersonnelCost {
  memberId: string;
  matricule: string;
  poste: string;
  /** Contrat actif dont provient le salaire (null : aucun contrat actif). */
  contract: Contract | null;
  /** Durée hebdomadaire absente du contrat : 35 h retenues. */
  heuresEstimees: boolean;
  /** Contrat actif sans salaire brut renseigné. */
  brutManquant: boolean;
  /** Coefficient RGDU (0 à 0,4) appliqué au brut du mois. */
  coefficientRgdu: number;
  /** Réduction RGDU calculée (€), avant plafonnement aux charges patronales. */
  reductionRgdu: number;
  /** max(0, charges patronales − réduction RGDU). */
  chargesPatronalesApresReduction: number;
}

/** Contrat actif le plus récent d'un salarié. */
function contratActif(contrats: Contract[] | undefined): Contract | null {
  if (!contrats) return null;
  return (
    contrats
      .filter((c) => c.status === "active")
      .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null
  );
}

/**
 * Coût salarial par salarié, calculé à partir du salaire brut du contrat actif
 * (fiche salarié, onglet Contrats) :
 *   charges patronales = brut × taux patronal (20 % par défaut) ;
 *   après réduction RGDU = max(0, charges − réduction) ;
 *   coût total = brut + charges après réduction ;
 *   coût horaire = coût total ÷ heures mensuelles du contrat.
 *
 * Les taux de charges sont des estimations réglables (paramètres de paie).
 * Modifier le salaire met à jour le contrat, puis invalide sa requête : le
 * tableau se recalcule à partir de la donnée source.
 */
export function useCoutsSalaries() {
  const qc = useQueryClient();
  const { data: employees = [], isLoading: chargementSalaries } =
    useEmployees();
  const parametres = useParametresPaie(new Date().getFullYear());
  const tauxPatronalEnregistre = parametres.valeur(
    CLE_TAUX_PATRONAL,
    TAUX_PATRONAL_DEFAUT,
  );
  // 42 % = ancienne valeur par défaut, jamais choisie par le client : on
  // la traite comme non personnalisée.
  const tauxPatronal =
    tauxPatronalEnregistre === ANCIEN_TAUX_PATRONAL_DEFAUT
      ? TAUX_PATRONAL_DEFAUT
      : tauxPatronalEnregistre;
  const appliquerRgdu = parametres.valeur(CLE_RGDU_ACTIVE, 1) !== 0;
  const tauxSalarial = parametres.valeur(
    CLE_TAUX_SALARIAL,
    TAUX_SALARIAL_DEFAUT,
  );

  const presents = employees.filter(
    (e) => e.status === "active" || e.status === "suspended",
  );

  // Mêmes clés que la fiche salarié : une modification faite là-bas met aussi
  // ce tableau à jour.
  const contrats = useQueries({
    queries: presents.map((e) => ({
      queryKey: contractKeys.list(e.id),
      queryFn: () => listContracts(e.id),
    })),
  });

  const now = new Date();
  const periode = now.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const effectifMoins50 = presents.length < EFFECTIF_SEUIL_RGDU;

  const couts: CoutSalarie[] = presents.map((e, i) => {
    const contract = contratActif(contrats[i]?.data);
    const brut = contract?.grossSalary ?? 0;
    const hebdo = contract?.workingHours ?? HEURES_HEBDO_DEFAUT;
    const heures = heuresHebdoVersMensuelles(hebdo);
    const ligne = calculerCout({
      brut,
      heures,
      tauxPatronal,
      tauxSalarial,
      appliquerRgdu,
      effectifMoins50,
    });
    return {
      memberId: e.id,
      matricule: e.employeeNumber ?? "",
      poste: e.position ?? "Non renseigné",
      contract,
      heuresEstimees: contract?.workingHours == null,
      brutManquant: contract !== null && !contract.grossSalary,
      employeeId: e.id,
      employeeName:
        `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() ||
        (e.employeeNumber ?? "Salarié"),
      period: periode,
      grossSalary: brut,
      netSalary: ligne.net,
      taxableNet: ligne.net,
      employeeContributions: ligne.chargesSalariales,
      employerContributions: ligne.chargesPatronales,
      coefficientRgdu: ligne.coefficientRgdu,
      reductionRgdu: ligne.reductionRgdu,
      chargesPatronalesApresReduction: ligne.chargesPatronalesApresReduction,
      totalEmployerCost: ligne.coutTotal,
      currency: "€",
      workedHours: heures,
      costPerHour: ligne.coutHoraire,
      allowances: 0,
      bonuses: 0,
      maintenance: 0,
      totalCost: ligne.coutTotal,
    };
  });

  const modifierRemuneration = useMutation({
    mutationFn: (v: {
      memberId: string;
      contractId: string;
      grossSalary: number;
      /** Heures mensuelles saisies ; le contrat stocke des heures hebdomadaires. */
      heuresMensuelles: number;
    }) =>
      updateContract(v.memberId, v.contractId, {
        grossSalary: arrondi2(v.grossSalary),
        // Heures stockées telles quelles (pas d'arrondi à 2 décimales : 108 h
        // revenait à 107,99 h).
        workingHours: heuresMensuellesVersHebdo(v.heuresMensuelles),
      }),
    onSuccess: (_data, v) =>
      qc.invalidateQueries({ queryKey: contractKeys.list(v.memberId) }),
  });

  return {
    couts,
    isLoading: chargementSalaries || contrats.some((c) => c.isLoading),
    contratsEnErreur: contrats.filter((c) => c.isError).length,
    tauxPatronal,
    tauxSalarial,
    appliquerRgdu,
    effectifMoins50,
    parametres,
    modifierRemuneration,
  };
}
