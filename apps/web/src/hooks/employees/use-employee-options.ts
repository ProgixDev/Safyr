"use client";

import { useMemo } from "react";
import { useEmployees } from "./hooks";
import type { Employee as EmployeeRH } from "@/lib/types";

/**
 * Salarié tel qu'attendu par les menus déroulants du logiciel.
 *
 * Une vingtaine d'écrans RH proposaient un choix de salarié alimenté par une
 * liste locale : ils sont restés vides une fois les exemples retirés. Ils
 * partagent désormais cette source unique, alimentée par les dossiers réels.
 */
export interface OptionSalarie {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  matricule: string;
  /** Alias historiques utilisés par les écrans RH. */
  employeeNumber: string;
  poste: string;
  position: string;
  /** Conservé pour les écrans qui affichent un service. */
  department: string;
  hiringDate: string;
  contractType: string;
  status: string;
}

export function useEmployeeOptions(): OptionSalarie[] {
  const { data: employees = [] } = useEmployees();

  return useMemo(
    () =>
      employees.map((e) => {
        const nom = `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim();
        return {
          id: e.id,
          name: nom || (e.employeeNumber ?? "Salarié"),
          firstName: e.firstName ?? "",
          lastName: e.lastName ?? "",
          email: e.email ?? e.user?.email ?? "",
          matricule: e.employeeNumber ?? "",
          employeeNumber: e.employeeNumber ?? "",
          poste: e.position ?? "",
          position: e.position ?? "",
          department: e.position ?? "",
          hiringDate: (e.hireDate ?? "").split("T")[0] ?? "",
          contractType: e.contractType ?? "CDI",
          status: e.status ?? "active",
        };
      }),
    [employees],
  );
}

/**
 * Mêmes salariés, au format `Employee` du module RH : quelques écrans
 * (certifications, habilitations, audit social) passent l'objet complet à
 * leurs fonctions de calcul.
 */
export function useEmployeesRH(): EmployeeRH[] {
  const { data: employees = [] } = useEmployees();

  return useMemo(
    () =>
      employees.map(
        (e) =>
          ({
            id: e.id,
            firstName: e.firstName ?? "",
            lastName: e.lastName ?? "",
            email: e.email ?? e.user?.email ?? "",
            phone: e.phone ?? "",
            employeeNumber: e.employeeNumber ?? "",
            position: e.position ?? "",
            department: e.position ?? "",
            hireDate: e.hireDate ? new Date(e.hireDate) : new Date(),
            dateOfBirth: e.birthDate ? new Date(e.birthDate) : new Date(),
            contractType: e.contractType ?? "CDI",
            workSchedule: e.workSchedule ?? "full-time",
            status: e.status ?? "active",
            cartePro: e.cartePro ?? undefined,
            socialSecurityNumber: e.socialSecurityNumber ?? "",
            placeOfBirth: e.birthPlace ?? "",
            nationality: e.nationality ?? "",
            gender: e.gender ?? "male",
            civilStatus: e.civilStatus ?? "single",
            address: {
              street: e.addressRecord?.street ?? "",
              city: e.addressRecord?.city ?? "",
              postalCode: e.addressRecord?.postalCode ?? "",
              country: e.addressRecord?.country ?? "France",
            },
            bankDetails: {
              iban: e.bankDetails?.iban ?? "",
              bic: e.bankDetails?.bic ?? "",
              bankName: e.bankDetails?.bankName ?? "",
            },
            qualifications: (e.certifications ?? []).map((c) => c.type),
            documents: [],
            createdAt: new Date(e.createdAt ?? 0),
            updatedAt: new Date(e.createdAt ?? 0),
          }) as unknown as EmployeeRH,
      ),
    [employees],
  );
}
