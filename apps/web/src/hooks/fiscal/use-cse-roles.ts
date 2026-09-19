"use client";

import { useMemo } from "react";
import { useRegistre, type LigneRegistre } from "./use-registre";

/**
 * Rôles CSE des salariés, enregistrés en base dans le registre `cse_role`
 * (table fiscal_record, type = "cse_role"). Un salarié peut cumuler plusieurs
 * rôles : une ligne par rôle et par mandat.
 *
 * Écrit depuis la fiche salarié (onglet CSE), lu par tout écran qui a besoin
 * de la liste des élus (ex. Heures de délégation CSE) via `useRolesCse()`.
 */
export type RoleCse =
  | "titulaire"
  | "suppleant"
  | "secretaire"
  | "tresorier"
  | "delegue_syndical"
  | "representant_proximite";

export const ROLES_CSE: {
  value: RoleCse;
  label: string;
  /** Crédit d'heures mensuel indicatif, à ajuster selon l'effectif / l'accord. */
  heuresParDefaut: number;
  /** Élu au CSE (sinon désigné : délégué syndical, représentant de proximité). */
  elu: boolean;
}[] = [
  {
    value: "titulaire",
    label: "Membre titulaire",
    heuresParDefaut: 21,
    elu: true,
  },
  { value: "suppleant", label: "Suppléant", heuresParDefaut: 0, elu: true },
  { value: "secretaire", label: "Secrétaire", heuresParDefaut: 21, elu: true },
  { value: "tresorier", label: "Trésorier", heuresParDefaut: 21, elu: true },
  {
    value: "delegue_syndical",
    label: "Délégué syndical",
    heuresParDefaut: 12,
    elu: false,
  },
  {
    value: "representant_proximite",
    label: "Représentant de proximité",
    heuresParDefaut: 10,
    elu: false,
  },
];

export function libelleRoleCse(role: string): string {
  return ROLES_CSE.find((r) => r.value === role)?.label ?? role;
}

/**
 * Ligne telle qu'enregistrée (meta du fiscal_record). Dates au format
 * ISO « AAAA-MM-JJ ». `id` est l'identifiant du registre, pas celui du salarié.
 */
export interface LigneRoleCse extends LigneRegistre {
  /** Identifiant du salarié (Employee.id). */
  employeeId: string;
  employeeName: string;
  role: RoleCse;
  /** Début du mandat. */
  startDate: string;
  /** Fin du mandat ; absente = mandat en cours. */
  endDate?: string;
  /** Heures de délégation par mois. */
  delegationHours: number;
  /** Élu (true) ou désigné (false). */
  isElected: boolean;
  electionDate?: string;
  notes?: string;
}

/** Mandat en cours à la date donnée (aujourd'hui par défaut). */
export function roleCseActif(
  ligne: Pick<LigneRoleCse, "startDate" | "endDate">,
  date: Date = new Date(),
): boolean {
  const jour = date.toISOString().slice(0, 10);
  if (ligne.startDate && ligne.startDate > jour) return false;
  return !ligne.endDate || ligne.endDate >= jour;
}

export interface EluCse {
  employeeId: string;
  employeeName: string;
  roles: RoleCse[];
  /** Somme des heures de délégation mensuelles de ses mandats en cours. */
  delegationHours: number;
}

/**
 * Rôles CSE de l'organisation. `elus` regroupe par salarié les mandats en
 * cours : c'est la liste à proposer dans un sélecteur d'élus.
 */
export function useRolesCse() {
  const registre = useRegistre<LigneRoleCse>("cse_role", []);

  const roles = useMemo(
    () =>
      registre.lignes.filter(
        (l) =>
          Boolean(l.employeeId) && ROLES_CSE.some((r) => r.value === l.role),
      ),
    [registre.lignes],
  );

  const elus = useMemo<EluCse[]>(() => {
    const parSalarie = new Map<string, EluCse>();
    for (const ligne of roles) {
      if (!roleCseActif(ligne)) continue;
      const existant = parSalarie.get(ligne.employeeId) ?? {
        employeeId: ligne.employeeId,
        employeeName: ligne.employeeName,
        roles: [],
        delegationHours: 0,
      };
      existant.roles.push(ligne.role);
      existant.delegationHours += Number(ligne.delegationHours) || 0;
      parSalarie.set(ligne.employeeId, existant);
    }
    return [...parSalarie.values()].sort((a, b) =>
      a.employeeName.localeCompare(b.employeeName, "fr"),
    );
  }, [roles]);

  return {
    roles,
    elus,
    isLoading: registre.isLoading,
    enregistrer: registre.enregistrer,
    supprimerLigne: registre.supprimerLigne,
  };
}
