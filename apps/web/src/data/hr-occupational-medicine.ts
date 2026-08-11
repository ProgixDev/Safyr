export interface MedicalVisit {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  type: "VM" | "VIP" | "Pré-reprise" | "Reprise" | "Autre";
  status: "À planifier" | "Planifiée" | "Effectuée" | "En retard" | "Annulée";
  scheduledDate?: string;
  completedDate?: string;
  nextVisitDate?: string;
  fitness: "Apte" | "Apte avec réserves" | "Inapte temporaire" | "Inapte" | "-";
  doctor: string;
  organization: string;
  restrictions?: string;
  notes?: string;
  documents: string[];
  alertSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export const mockMedicalVisits: MedicalVisit[] = [];
