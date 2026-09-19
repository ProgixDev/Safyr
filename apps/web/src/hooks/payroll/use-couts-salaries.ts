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
import {
  CLE_TAUX_PATRONAL,
  CLE_TAUX_SALARIAL,
  TAUX_PATRONAL_DEFAUT,
  TAUX_SALARIAL_DEFAUT,
  useParametresPaie,
} from "./use-parametres-paie";

/** Semaines par mois moyen : 35 h / semaine → 151,67 h / mois. */
const SEMAINES_PAR_MOIS = 52 / 12;
const HEURES_HEBDO_DEFAUT = 35;

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
 *   charges patronales = brut × taux patronal ; coût total = brut + charges ;
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
  const tauxPatronal = parametres.valeur(
    CLE_TAUX_PATRONAL,
    TAUX_PATRONAL_DEFAUT,
  );
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

  const couts: CoutSalarie[] = presents.map((e, i) => {
    const contract = contratActif(contrats[i]?.data);
    const brut = contract?.grossSalary ?? 0;
    const hebdo = contract?.workingHours ?? HEURES_HEBDO_DEFAUT;
    const heures = arrondi2(hebdo * SEMAINES_PAR_MOIS);
    const chargesPatronales = arrondi2((brut * tauxPatronal) / 100);
    const chargesSalariales = arrondi2((brut * tauxSalarial) / 100);
    const net = arrondi2(brut - chargesSalariales);
    const total = arrondi2(brut + chargesPatronales);
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
      netSalary: net,
      taxableNet: net,
      employeeContributions: chargesSalariales,
      employerContributions: chargesPatronales,
      totalEmployerCost: total,
      currency: "€",
      workedHours: heures,
      costPerHour: heures > 0 ? arrondi2(total / heures) : 0,
      allowances: 0,
      bonuses: 0,
      maintenance: 0,
      totalCost: total,
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
        workingHours: arrondi2(v.heuresMensuelles / SEMAINES_PAR_MOIS),
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
    parametres,
    modifierRemuneration,
  };
}
