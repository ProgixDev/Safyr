"use client";

import { useQuery } from "@tanstack/react-query";
import { listShifts } from "@safyr/api-client";
import { shiftKeys } from "@/hooks/shifts";
import { usePayrollVariables } from "./hooks";
import { arrondi2 } from "@/lib/payroll-primes";

export type SourceHeuresPaie = "paie" | "planning" | "aucune";

/**
 * Heures de paie d'un salarié pour un mois : les variables d'heures déjà
 * déclarées en paie (H Jour, H Nuit, H Supp…) ; à défaut, les heures des
 * vacations planifiées (hors annulées) du mois.
 *
 * Sert au calcul automatique de l'indemnité d'habillage.
 */
export function useHeuresPaie(params: {
  memberId: string;
  matricule?: string;
  annee: string;
  mois: string;
}): { heures: number; source: SourceHeuresPaie; isLoading: boolean } {
  const { memberId, matricule, annee, mois } = params;
  const { data: variables = [] } = usePayrollVariables();

  const periodeValide = /^\d{4}$/.test(annee) && /^\d{1,2}$/.test(mois);
  const enabled = Boolean(memberId) && periodeValide;
  const debut = periodeValide
    ? new Date(Number(annee), Number(mois) - 1, 1)
    : new Date(0);
  const fin = periodeValide
    ? new Date(Number(annee), Number(mois), 1)
    : new Date(0);

  const { data: vacations = [], isLoading } = useQuery({
    queryKey: shiftKeys.list({
      memberId,
      from: debut.toISOString(),
      to: fin.toISOString(),
    }),
    queryFn: () =>
      listShifts({
        memberId,
        from: debut.toISOString(),
        to: fin.toISOString(),
      }),
    enabled,
  });

  if (!enabled) return { heures: 0, source: "aucune", isLoading: false };

  const prefixe = `${annee}-${mois.padStart(2, "0")}`;
  const heuresPaie = variables
    .filter(
      (v) =>
        v.type.startsWith("h_") &&
        v.status !== "refused" &&
        v.period.startsWith(prefixe) &&
        (v.employeeId === memberId ||
          (matricule && v.employeeId === matricule)),
    )
    .reduce((somme, v) => somme + v.amount, 0);
  if (heuresPaie > 0) {
    return { heures: arrondi2(heuresPaie), source: "paie", isLoading };
  }

  const heuresPlanning = vacations
    .filter(
      (s) =>
        s.memberId === memberId &&
        s.status !== "cancelled" &&
        new Date(s.startAt) >= debut &&
        new Date(s.startAt) < fin,
    )
    .reduce(
      (somme, s) =>
        somme +
        Math.max(
          0,
          (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) /
            3_600_000,
        ),
      0,
    );
  if (heuresPlanning > 0) {
    return { heures: arrondi2(heuresPlanning), source: "planning", isLoading };
  }
  return { heures: 0, source: "aucune", isLoading };
}
