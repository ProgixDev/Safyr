export interface Warning {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  type: "oral" | "written" | "final";
  reason: string;
  description: string;
  date: string;
  issuedBy: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Suspension {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  startDate: string;
  endDate: string;
  duration: number; // days
  reason: string;
  description: string;
  type: "precautionary" | "disciplinary";
  issuedBy: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DisciplinaryProcedure {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  type: "warning" | "suspension" | "dismissal" | "other";
  status: "pending" | "in_progress" | "resolved" | "cancelled";
  reason: string;
  description: string;
  openedAt: string;
  openedBy: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  warnings: string[]; // Warning IDs
  suspensions: string[]; // Suspension IDs
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Sanction {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  type: "warning" | "suspension" | "dismissal" | "other";
  date: string;
  reason: string;
  description: string;
  issuedBy: string;
  severity: "low" | "medium" | "high" | "critical";
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export const mockWarnings: Warning[] = [];

export const mockSuspensions: Suspension[] = [];

export const mockDisciplinaryProcedures: DisciplinaryProcedure[] = [];

export const mockSanctions: Sanction[] = [];
