import { QuoteLine } from "@/data/billing-quotes";

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  siteId?: string;
  siteName?: string;
  period: {
    start: string;
    end: string;
  };
  status:
    | "Brouillon"
    | "En attente"
    | "Validée"
    | "Envoyée"
    | "Payée"
    | "Annulée";
  // Sources de données
  planningHours?: number; // heures planifiées
  realizedHours?: number; // heures réalisées (géoloc/main courante)
  validatedHours?: number; // heures validées (paie)
  // Facturation
  normalHours: number;
  overtimeHours: number;
  replacements: number;
  // Montants
  subtotal: number; // HT
  vatRate: number; // % TVA
  vatAmount: number;
  total: number; // TTC
  // Écarts
  variance?: {
    planned: number;
    realized: number;
    difference: number;
  };
  // Validation
  previewed: boolean;
  validatedBy?: string;
  validatedAt?: string;
  // Émission
  issuedAt?: string;
  sentAt?: string;
  paymentDueDate?: string;
  paidAt?: string;
  // Ajustements
  adjustments?: {
    id: string;
    type: "Manual" | "Credit" | "Exception";
    amount: number;
    reason: string;
    createdAt: string;
    createdBy: string;
  }[];
  // Avoirs
  credits?: {
    id: string;
    creditNumber: string;
    amount: number;
    reason: string;
    createdAt: string;
  }[];
  // Connexion Paie
  payrollAlignment?: {
    hoursPaid: number;
    hoursBillable: number;
    variance: number;
    profitability: number; // %
  };
  // Connexion Comptabilité
  accountingEntries?: {
    salesEntry: string;
    vatEntry: string;
    status: "Pending" | "Generated" | "Exported";
  };
  createdAt: string;
  updatedAt: string;
  lines?: QuoteLine[];
}

export const mockBillingInvoices: BillingInvoice[] = [];
