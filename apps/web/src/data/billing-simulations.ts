export interface SimulationShiftNeed {
  id: string;
  postType: string; // "Agent de Sécurité" | "SSIAP 1" | "SSIAP 2" | "SSIAP 3" | "Opérateur Vidéo" | "Accueil" etc.
  type: "fixe" | "variable";
  // For fixed needs
  daysOfWeek?: number[]; // 0=Sunday to 6=Saturday
  startTime: string;
  endTime: string;
  // For variable needs
  startMonth?: number; // 1-12
  endMonth?: number;
  specificDays?: number[]; // days of week
  quantity: number;
}

export interface SimulationService {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  description?: string;
}

export interface Simulation {
  id: string;
  clientName: string;
  clientId?: string;
  siteName: string;
  siteAddress?: string;
  // Date range for the need
  startDate?: string;
  endDate?: string;
  status: "Brouillon" | "En cours" | "Terminée" | "Convertie";
  shiftNeeds: SimulationShiftNeed[];
  additionalServices: SimulationService[];
  // Rate configuration
  hourlyRate: number;
  nightSurchargePercent: number; // default 10%
  sundaySurchargePercent: number; // default 10%
  holidaySurchargePercent: number; // default 100%
  sundayNightSurchargePercent: number; // default 110%
  holidayNightSurchargePercent: number; // default 110%
  totalEstimate?: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export const mockSimulations: Simulation[] = [];

// Service suggestions for the dropdown
export const availableServices = [
  "Main courante électronique",
  "Portail clients",
  "PTI (Protection Travailleur Isolé)",
  "Géolocalisation",
  "Ordinateur de gestion",
  "Radio HF",
  "Tenue vestimentaire",
  "Badge d'accès",
  "Formation spécifique site",
];
