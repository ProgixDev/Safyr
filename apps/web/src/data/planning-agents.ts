export interface PlanningAgent {
  id: string;
  name: string;
  contractType: "CDI" | "CDD" | "Intérim";
  contractHours: number;
  qualifications: string[];
  availabilityStatus: "Disponible" | "En mission" | "Congé" | "Absent";
  weeklyHours: number;
  maxAmplitude: number; // heures
  lastActivity: string;
  phone: string;
  email: string;
}

export const mockPlanningAgents: PlanningAgent[] = [];
