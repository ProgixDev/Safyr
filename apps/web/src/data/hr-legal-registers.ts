export interface PersonnelRegisterEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  action: "entry" | "exit" | "modification";
  date: string;
  type: "CDI" | "CDD" | "STAGE" | "APPRENTISSAGE" | "OTHER";
  position: string;
  department: string;
  notes?: string;
  documents: string[];
  createdAt: string;
}

export interface WorkAccident {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  date: string;
  time: string;
  location: string;
  description: string;
  severity: "light" | "moderate" | "serious" | "fatal";
  cause: string;
  witness?: string;
  medicalCare: boolean;
  workStoppage: boolean;
  workStoppageDays?: number;
  declared: boolean;
  declaredAt?: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingRegisterEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  trainingType: string;
  provider: string;
  startDate: string;
  endDate: string;
  duration: number; // hours
  certificateNumber?: string;
  cost: number;
  documents: string[];
  createdAt: string;
}

export interface CDDEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  action: "entry" | "exit" | "renewal";
  contractStartDate: string;
  contractEndDate: string;
  position: string;
  reason: string;
  renewalCount?: number;
  documents: string[];
  createdAt: string;
}

export const mockPersonnelRegister: PersonnelRegisterEntry[] = [];

export const mockWorkAccidents: WorkAccident[] = [];

export const mockTrainingRegister: TrainingRegisterEntry[] = [];

export const mockCDDEntries: CDDEntry[] = [];
