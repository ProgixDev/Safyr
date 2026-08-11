import {
  PayrollCalculationRun,
  EmployeePayrollCalculation,
  SalaryElement,
  SocialContributionDetail,
  PaySlip,
  DSNDeclaration,
} from "@/lib/types";

// Mock salary elements templates
export const createBaseSalaryElement = (baseAmount: number): SalaryElement => ({
  id: "base-1",
  code: "SAL_BASE",
  label: "Salaire de base",
  type: "earning",
  category: "base",
  quantity: 151.67,
  rate: baseAmount / 151.67,
  amount: baseAmount,
  taxable: true,
  subjectToContributions: true,
});

export const createHoursElement = (
  code: string,
  label: string,
  hours: number,
  rate: number,
): SalaryElement => ({
  id: `hours-${code}`,
  code,
  label,
  type: "earning",
  category: hours > 151.67 ? "overtime" : "hours",
  quantity: hours,
  rate,
  amount: hours * rate,
  taxable: true,
  subjectToContributions: true,
});

export const createBonusElement = (
  code: string,
  label: string,
  amount: number,
): SalaryElement => ({
  id: `bonus-${code}`,
  code,
  label,
  type: "earning",
  category: "bonus",
  amount,
  taxable: true,
  subjectToContributions: true,
});

export const createAllowanceElement = (
  code: string,
  label: string,
  quantity: number,
  rate: number,
): SalaryElement => ({
  id: `allowance-${code}`,
  code,
  label,
  type: "earning",
  category: "allowance",
  quantity,
  rate,
  amount: quantity * rate,
  taxable: false,
  subjectToContributions: false,
});

export const createAbsenceElement = (
  code: string,
  label: string,
  hours: number,
  rate: number,
): SalaryElement => ({
  id: `absence-${code}`,
  code,
  label,
  type: "deduction",
  category: "absence",
  quantity: hours,
  rate,
  amount: -(hours * rate),
  taxable: true,
  subjectToContributions: true,
});

// Mock social contributions
export const createEmployeeContributions = (
  grossSalary: number,
): SocialContributionDetail[] => {
  const plafondSS = 3864; // Plafond mensuel SS 2024
  const baseTrancheA = Math.min(grossSalary, plafondSS);
  const baseTrancheB = Math.max(0, grossSalary - plafondSS);

  return [
    {
      id: "emp-health",
      code: "S21.G05.00.001",
      label: "Assurance maladie",
      type: "employee",
      category: "health",
      baseAmount: grossSalary,
      rate: 0,
      amount: 0,
      tranche: "A",
    },
    {
      id: "emp-retirement-t1",
      code: "S21.G05.00.002",
      label: "Retraite Tranche 1",
      type: "employee",
      category: "retirement",
      baseAmount: baseTrancheA,
      rate: 6.9,
      amount: baseTrancheA * 0.069,
      ceiling: plafondSS,
      tranche: "A",
    },
    {
      id: "emp-retirement-t2",
      code: "S21.G05.00.003",
      label: "Retraite Tranche 2",
      type: "employee",
      category: "retirement",
      baseAmount: baseTrancheB,
      rate: 8.64,
      amount: baseTrancheB * 0.0864,
      tranche: "B",
    },
    {
      id: "emp-unemployment",
      code: "S21.G05.00.004",
      label: "Assurance chômage",
      type: "employee",
      category: "unemployment",
      baseAmount: grossSalary,
      rate: 0,
      amount: 0,
    },
    {
      id: "emp-csg-deductible",
      code: "S21.G05.00.010",
      label: "CSG déductible",
      type: "employee",
      category: "csg",
      baseAmount: grossSalary * 0.9825,
      rate: 6.8,
      amount: grossSalary * 0.9825 * 0.068,
    },
    {
      id: "emp-csg-non-deductible",
      code: "S21.G05.00.011",
      label: "CSG non déductible",
      type: "employee",
      category: "csg",
      baseAmount: grossSalary * 0.9825,
      rate: 2.4,
      amount: grossSalary * 0.9825 * 0.024,
    },
    {
      id: "emp-crds",
      code: "S21.G05.00.012",
      label: "CRDS",
      type: "employee",
      category: "crds",
      baseAmount: grossSalary * 0.9825,
      rate: 0.5,
      amount: grossSalary * 0.9825 * 0.005,
    },
  ];
};

export const createEmployerContributions = (
  grossSalary: number,
): SocialContributionDetail[] => {
  const plafondSS = 3864;
  const baseTrancheA = Math.min(grossSalary, plafondSS);
  const baseTrancheB = Math.max(0, grossSalary - plafondSS);

  return [
    {
      id: "empr-health",
      code: "S21.G05.00.020",
      label: "Assurance maladie",
      type: "employer",
      category: "health",
      baseAmount: grossSalary,
      rate: 13.0,
      amount: grossSalary * 0.13,
    },
    {
      id: "empr-retirement-t1",
      code: "S21.G05.00.021",
      label: "Retraite Tranche 1",
      type: "employer",
      category: "retirement",
      baseAmount: baseTrancheA,
      rate: 8.55,
      amount: baseTrancheA * 0.0855,
      ceiling: plafondSS,
      tranche: "A",
    },
    {
      id: "empr-retirement-t2",
      code: "S21.G05.00.022",
      label: "Retraite Tranche 2",
      type: "employer",
      category: "retirement",
      baseAmount: baseTrancheB,
      rate: 12.95,
      amount: baseTrancheB * 0.1295,
      tranche: "B",
    },
    {
      id: "empr-unemployment",
      code: "S21.G05.00.023",
      label: "Assurance chômage",
      type: "employer",
      category: "unemployment",
      baseAmount: Math.min(grossSalary, plafondSS * 4),
      rate: 4.05,
      amount: Math.min(grossSalary, plafondSS * 4) * 0.0405,
    },
    {
      id: "empr-family",
      code: "S21.G05.00.024",
      label: "Allocations familiales",
      type: "employer",
      category: "family",
      baseAmount: grossSalary,
      rate: grossSalary <= plafondSS * 3.5 ? 3.45 : 5.25,
      amount: grossSalary * (grossSalary <= plafondSS * 3.5 ? 0.0345 : 0.0525),
    },
    {
      id: "empr-accident",
      code: "S21.G05.00.025",
      label: "Accidents du travail",
      type: "employer",
      category: "accident",
      baseAmount: grossSalary,
      rate: 1.8,
      amount: grossSalary * 0.018,
    },
  ];
};

// Mock employee calculations
export const mockEmployeeCalculations: EmployeePayrollCalculation[] = [];

// Mock calculation run
export const mockCalculationRun: PayrollCalculationRun = {
  id: "run-2024-12",
  period: "2024-12",
  periodLabel: "Décembre 2024",
  status: "calculated",
  totalEmployees: 6,
  calculatedEmployees: 4,
  pendingEmployees: 1,
  errorEmployees: 1,
  validatedEmployees: 1,
  totalGrossSalary: 14136.5,
  totalNetSalary: 11086.82,
  totalEmployeeContributions: 3049.48,
  totalEmployerContributions: 5916.31,
  totalCost: 20052.81,
  startedAt: new Date("2024-12-20T10:30:00"),
  startedBy: "admin@safyr.com",
  completedAt: new Date("2024-12-20T10:35:00"),
  calculations: mockEmployeeCalculations,
};

// Mock pay slips
export const mockPaySlips: PaySlip[] = [];

// Mock DSN declaration
export const mockDSNDeclaration: DSNDeclaration = {
  id: "dsn-2024-12",
  period: "2024-12",
  type: "monthly",
  status: "generated",
  totalEmployees: 6,
  totalGrossSalary: 14136.5,
  totalContributions: 8965.79,
  generatedAt: new Date("2024-12-20T16:00:00"),
  errors: [],
};

// Helper functions
export function getCalculationRun(): PayrollCalculationRun {
  return mockCalculationRun;
}

export function getEmployeeCalculation(
  employeeId: string,
  period: string,
): EmployeePayrollCalculation | undefined {
  return mockEmployeeCalculations.find(
    (calc) => calc.employeeId === employeeId && calc.period === period,
  );
}

export function getPaySlips(period: string): PaySlip[] {
  return mockPaySlips.filter((slip) => slip.period === period);
}

export function getDSNDeclaration(period: string): DSNDeclaration | undefined {
  if (period === "2024-12") return mockDSNDeclaration;
  return undefined;
}

export function calculateTotals(calculations: EmployeePayrollCalculation[]): {
  totalGross: number;
  totalNet: number;
  totalEmployeeContributions: number;
  totalEmployerContributions: number;
  totalCost: number;
} {
  return calculations.reduce(
    (acc, calc) => ({
      totalGross: acc.totalGross + calc.grossSalary,
      totalNet: acc.totalNet + calc.netSalary,
      totalEmployeeContributions:
        acc.totalEmployeeContributions + calc.totalEmployeeContributions,
      totalEmployerContributions:
        acc.totalEmployerContributions + calc.totalEmployerContributions,
      totalCost: acc.totalCost + calc.totalCost,
    }),
    {
      totalGross: 0,
      totalNet: 0,
      totalEmployeeContributions: 0,
      totalEmployerContributions: 0,
      totalCost: 0,
    },
  );
}
