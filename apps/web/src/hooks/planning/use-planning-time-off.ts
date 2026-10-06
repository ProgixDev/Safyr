"use client";

import { useMemo } from "react";
import { useRegistre } from "@/hooks/fiscal/use-registre";
import type { TimeOffRequest, TimeOffStatus, TimeOffType } from "@/lib/types";

/**
 * Congés et absences du planning, lus depuis les mêmes registres que l'écran
 * RH « Temps et activité » (`conge`, `absence`).
 *
 * Le planning utilisait un tableau de démonstration (`mockTimeOffRequests`,
 * toujours vide) : un salarié en congé approuvé côté RH pouvait être
 * planifié sans aucun avertissement. Les deux écrans partagent désormais la
 * même source — le registre fiscal.
 */

const AUCUN_FICHIER: readonly string[] = [];

/** Forme minimale d'une ligne de registre congé/absence, telle qu'enregistrée. */
interface LigneTemps {
  id: string;
  employeeId?: string;
  employeeName?: string;
  employeeNumber?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

function toTimeOffRequest(l: LigneTemps): TimeOffRequest | null {
  if (!l.employeeId || !l.startDate || !l.endDate) return null;
  const debut = new Date(l.startDate);
  const fin = new Date(l.endDate);
  if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime())) return null;
  return {
    id: l.id,
    employeeId: l.employeeId,
    employeeName: l.employeeName ?? "",
    employeeNumber: l.employeeNumber ?? "",
    department: "",
    type: (l.type ?? "other") as TimeOffType,
    startDate: debut,
    endDate: fin,
    totalDays: Math.max(
      1,
      Math.round((fin.getTime() - debut.getTime()) / 86_400_000) + 1,
    ),
    status: (l.status ?? "pending") as TimeOffStatus,
    createdAt: debut,
    updatedAt: debut,
  };
}

export function usePlanningTimeOff() {
  const conges = useRegistre<LigneTemps>("conge", AUCUN_FICHIER);
  const absences = useRegistre<LigneTemps>("absence", AUCUN_FICHIER);

  const timeOffRequests = useMemo<TimeOffRequest[]>(
    () =>
      [...conges.lignes, ...absences.lignes]
        .map(toTimeOffRequest)
        .filter((r): r is TimeOffRequest => r !== null),
    [conges.lignes, absences.lignes],
  );

  return {
    timeOffRequests,
    isLoading: conges.isLoading || absences.isLoading,
  };
}

/** Vrai si le salarié a un congé/une absence approuvé(e) couvrant la date du jour. */
export function estEnCongeAujourdHui(
  employeeId: string,
  timeOffRequests: TimeOffRequest[],
): boolean {
  const auj = new Date();
  auj.setHours(12, 0, 0, 0);
  return timeOffRequests.some((r) => {
    if (r.employeeId !== employeeId || r.status !== "approved") return false;
    const debut = new Date(r.startDate);
    const fin = new Date(r.endDate);
    debut.setHours(0, 0, 0, 0);
    fin.setHours(23, 59, 59, 999);
    return auj >= debut && auj <= fin;
  });
}
