export interface BillingClient {
  id: string;
  name: string;
  siret: string;
  tva?: string; // Numéro de TVA
  contractType: "Mensuel" | "Forfaitaire" | "Heure réelle";
  // Backwards-compatible single service type (kept for compatibility)
  serviceType?:
    | "Gardiennage"
    | "Rondes"
    | "Événementiel"
    | "SSIAP"
    | "Accueil"
    | "Intervention"
    | "ADS";
  // Multiple service types allowed
  serviceTypes?: (
    | "Gardiennage"
    | "Rondes"
    | "Événementiel"
    | "SSIAP"
    | "Accueil"
    | "Intervention"
    | "ADS"
  )[];
  contractStartDate: string;
  contractEndDate?: string;
  monthlyHours?: number; // volumes horaires mensuels
  hourlyRate: number;
  nightBonus: number; // % majoration nuit
  sundayBonus: number; // % majoration dimanche
  holidayBonus: number; // % majoration jours fériés
  indexationRate?: number; // % d'indexation annuelle
  sites: number;
  status: "Actif" | "Suspendu" | "Inactif";
  billingDay: number; // jour du mois
  paymentTerm: number; // jours
  lastInvoice: string;
  // Company info
  companyPhone?: string;
  companyEmail?: string;
  address?: string;
  // Contact info
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  // Legacy fields (kept for backward compatibility)
  phone?: string;
  email?: string;
  // Connexions
  agentTypes?: string[]; // Typologie des agents affectés (RH)
  planningVolumes?: {
    site: string;
    monthlyHours: number;
  }[]; // Volumes contractuels (Planning)
}

export const mockBillingClients: BillingClient[] = [];
