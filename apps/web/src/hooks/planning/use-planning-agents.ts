"use client";

import { useMemo } from "react";
import { useEmployees } from "@/hooks/employees";
import type { PlanningAgent } from "@/data/planning-agents";
import type { Employee as ApiEmployee } from "@safyr/api-client";

/**
 * Agents du planning construits à partir des dossiers salariés réels.
 *
 * Le module planning affichait une liste de démonstration (`mockPlanningAgents`,
 * `mockEmployees`) : les salariés créés dans le module RH n'y apparaissaient
 * jamais. Les deux modules partagent désormais la même source — l'API.
 */

const CERTIFICATION_LABELS: Record<string, string> = {
  CQP_APS: "CQP APS",
  CNAPS: "Carte Professionnelle",
  SSIAP1: "SSIAP 1",
  SSIAP2: "SSIAP 2",
  SSIAP3: "SSIAP 3",
  SST: "SST",
  H0B0: "H0B0",
  VM: "Visite médicale",
  FIRE: "Incendie",
};

function toContractType(value: string | null): PlanningAgent["contractType"] {
  if (value === "CDD") return "CDD";
  if (value === "INTERIM") return "Intérim";
  return "CDI";
}

function toAvailability(
  status: ApiEmployee["status"],
): PlanningAgent["availabilityStatus"] {
  return status === "active" ? "Disponible" : "Absent";
}

export function toPlanningAgent(employee: ApiEmployee): PlanningAgent {
  const heures = employee.workSchedule === "part-time" ? 24 : 35;

  return {
    id: employee.id,
    name: `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim(),
    contractType: toContractType(employee.contractType),
    contractHours: heures,
    qualifications: [
      ...new Set(
        (employee.certifications ?? []).map(
          (c) => CERTIFICATION_LABELS[c.type] ?? c.type,
        ),
      ),
      ...(employee.cartePro ? ["Carte Professionnelle"] : []),
    ],
    availabilityStatus: toAvailability(employee.status),
    weeklyHours: heures,
    maxAmplitude: 12,
    lastActivity: (employee.createdAt ?? "").split("T")[0] ?? "",
    phone: employee.phone ?? "",
    email: employee.email ?? employee.user.email,
  };
}

export function usePlanningAgents() {
  const { data: employees = [], isLoading } = useEmployees();

  const agents = useMemo<PlanningAgent[]>(
    () => employees.map(toPlanningAgent),
    [employees],
  );

  return { agents, isLoading };
}
