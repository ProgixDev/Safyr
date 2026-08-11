export interface TrainingCertification {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  type: "SSIAP1" | "SSIAP2" | "SSIAP3" | "SST" | "H0B0" | "CACES" | "OTHER";
  level?: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  issuer: string;
  status: "valid" | "expired" | "expiring-soon";
  validated: boolean;
  validatedBy?: string;
  validatedAt?: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPlan {
  id: string;
  year: number;
  employeeId: string;
  employeeName: string;
  trainingType: string;
  plannedDate: string;
  duration: number; // hours
  provider: string;
  estimatedCost: number;
  status: "planned" | "confirmed" | "completed" | "cancelled";
  completedDate?: string;
  actualCost?: number;
  certificateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingAlert {
  id: string;
  employeeId: string;
  employeeName: string;
  certificationId: string;
  certificationType: string;
  expiryDate: string;
  daysUntilExpiry: number;
  alertLevel: "info" | "warning" | "critical";
  notified: boolean;
  notifiedAt?: string;
  createdAt: string;
}

export const mockTrainingCertifications: TrainingCertification[] = [];

export const mockTrainingPlans: TrainingPlan[] = [];

export const mockTrainingAlerts: TrainingAlert[] = [];
