export interface Contract {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  type: "CDI" | "CDD" | "CDI_TEMPORAIRE" | "STAGE" | "APPRENTISSAGE";
  startDate: string;
  endDate?: string;
  position: string;
  department: string;
  baseSalary: number;
  workingHours: number;
  status: "active" | "ended" | "suspended" | "pending";
  signedAt?: string;
  signedBy?: string;
  documents: string[];
  amendments: Amendment[];
  createdAt: string;
  updatedAt: string;
}

export interface Amendment {
  id: string;
  contractId: string;
  type: "salary" | "position" | "hours" | "other";
  description: string;
  effectiveDate: string;
  changes: Record<string, unknown>;
  signedAt?: string;
  signedBy?: string;
  status: "pending" | "signed" | "cancelled";
  createdAt: string;
}

export const mockContracts: Contract[] = [];

export const mockAmendments: Amendment[] = [];
