"use client";

import { useShifts } from "@/hooks/shifts";
import type { Shift } from "@safyr/api-client";

/**
 * Vacations du jour, pour savoir quels agents sont « En mission » maintenant.
 *
 * Le statut « En mission » n'était jamais calculé (toujours Disponible/Congé/
 * Absent) : un agent en plein poste apparaissait comme n'importe quel autre
 * agent disponible.
 */

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

export function usePlanningMissions() {
  const auj = new Date();
  const { data: shiftsToday = [], isLoading } = useShifts({
    from: startOfDay(auj).toISOString(),
    to: endOfDay(auj).toISOString(),
  });

  return { shiftsToday, isLoading };
}

/** Vrai si le salarié est actuellement sur une vacation en cours (statut non annulé). */
export function estEnMissionMaintenant(
  employeeId: string,
  shiftsToday: Shift[],
): boolean {
  const maintenant = new Date();
  return shiftsToday.some((s) => {
    if (s.memberId !== employeeId || s.status === "cancelled") return false;
    return (
      new Date(s.startAt) <= maintenant && maintenant <= new Date(s.endAt)
    );
  });
}
