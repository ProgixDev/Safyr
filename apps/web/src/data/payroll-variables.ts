import {
  EmployeePayrollVariables,
  PayrollPeriod,
  CoherenceCheck,
} from "@/lib/types";

export interface Period {
  id: string;
  month: number;
  year: number;
  label: string;
}

// Mock Payroll Periods
export const mockPayrollPeriods: PayrollPeriod[] = [];

// Mock Coherence Checks
const mockCoherenceChecks: CoherenceCheck[] = [
  {
    id: "check-1",
    employeeId: "EMP001",
    employeeName: "Jean Dupont",
    checkType: "error",
    category: "hours",
    message: "Heures totales dépassent le maximum légal",
    details: "Total de 210h pour le mois dépasse le maximum de 169h + 48h sup",
    expectedValue: 217,
    actualValue: 210,
    resolved: false,
  },
  {
    id: "check-2",
    employeeId: "EMP003",
    employeeName: "Sophie Martin",
    checkType: "warning",
    category: "absences",
    message: "Congés payés non saisis",
    details: "Aucune donnée d'absence importée depuis le module RH",
    resolved: false,
  },
  {
    id: "check-3",
    employeeId: "EMP005",
    employeeName: "Thomas Bernard",
    checkType: "error",
    category: "contract",
    message: "Type de contrat manquant",
    details: "Impossible de calculer les cotisations sans type de contrat",
    resolved: false,
  },
];

// Mock Employee Payroll Variables
export const mockEmployeePayrollVariables: EmployeePayrollVariables[] = [];

// Helper functions
export function getVariablesByPeriod(
  period: string,
): EmployeePayrollVariables[] {
  return mockEmployeePayrollVariables.filter((v) => v.period === period);
}

export function getVariableById(id: string): EmployeePayrollVariables | null {
  return mockEmployeePayrollVariables.find((v) => v.id === id) || null;
}

export function getVariableByEmployeeAndPeriod(
  employeeId: string,
  period: string,
): EmployeePayrollVariables | null {
  return (
    mockEmployeePayrollVariables.find(
      (v) => v.employeeId === employeeId && v.period === period,
    ) || null
  );
}

export function getPeriodById(id: string): PayrollPeriod | null {
  return mockPayrollPeriods.find((p) => p.id === id) || null;
}

export function getCurrentPeriod(): PayrollPeriod {
  return mockPayrollPeriods[0];
}

// Convert PayrollPeriod to Period format for PeriodSelector component
export function getPeriodsForSelector(): Period[] {
  return mockPayrollPeriods.map((p) => ({
    id: p.id,
    month: p.month,
    year: p.year,
    label: p.label,
  }));
}
