export interface AnnualInterview {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  year: number;
  scheduledDate: string;
  completedDate?: string;
  interviewer: string;
  status: "scheduled" | "completed" | "cancelled" | "pending";
  topics: {
    achievements: string[];
    challenges: string[];
    goals: string[];
    training: string[];
  };
  notes?: string;
  rating?: number; // 1-5
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalInterview {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  type: "professional" | "career" | "skills";
  scheduledDate: string;
  completedDate?: string;
  interviewer: string;
  status: "scheduled" | "completed" | "cancelled" | "pending";
  topics: {
    career: string[];
    skills: string[];
    development: string[];
  };
  notes?: string;
  nextSteps?: string[];
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Objective {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  year: number;
  title: string;
  description: string;
  category: "performance" | "development" | "project" | "other";
  targetDate: string;
  status: "not_started" | "in_progress" | "completed" | "cancelled";
  progress: number; // 0-100
  completedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockAnnualInterviews: AnnualInterview[] = [];

export const mockProfessionalInterviews: ProfessionalInterview[] = [];

export const mockObjectives: Objective[] = [];
