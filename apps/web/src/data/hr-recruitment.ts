export interface Application {
  id: string;
  candidateName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  appliedAt: string;
  source: "website" | "linkedin" | "indeed" | "referral" | "other";
  status: "new" | "screening" | "interview" | "offer" | "hired" | "rejected";
  resumeUrl?: string;
  coverLetterUrl?: string;
  interviewDate?: string;
  interviewNotes?: string;
  offerDetails?: {
    salary: number;
    startDate: string;
    position: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Verification {
  id: string;
  applicationId: string;
  candidateName: string;
  type:
    | "identity"
    | "diploma"
    | "certification"
    | "criminal_record"
    | "reference";
  status: "pending" | "in_progress" | "validated" | "rejected";
  requestedAt: string;
  completedAt?: string;
  verifiedBy?: string;
  notes?: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingTask {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "document" | "training" | "equipment" | "access" | "meeting";
  title: string;
  description: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  assignedTo?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockApplications: Application[] = [];

export const mockVerifications: Verification[] = [];

export const mockOnboardingTasks: OnboardingTask[] = [];
