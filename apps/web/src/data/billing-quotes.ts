/**
 * Billing quotes (devis) types & mock data
 * - Provides a minimal structure for "Devis" (quotes/estimates)
 * - Used by the billing module for demo / UI
 */

export type QuoteUnit = "h" | "Nbre";
export type QuoteStatus = "Brouillon" | "Envoyé" | "Accepté" | "Refusé";

export interface QuoteLine {
  id: string;
  serviceId?: string; // optional link to catalog service
  description: string;
  date?: string;
  qty: number;
  unit: QuoteUnit;
  priceHT: number;
  vatRate: number;
  amountHT: number;
  amountTTC: number;
  notes?: string;
}

export interface BillingQuote {
  id: string;
  quoteNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  validUntil: string;
  message?: string;
  lines: QuoteLine[];
  subtotal: number; // total HT
  vatAmount: number;
  total: number; // TTC
  status: QuoteStatus;
  createdAt: string;
  updatedAt?: string;
}

/** Helper to compute TTC from HT + TVA */
export function computePriceTTC(priceHT: number, vatRate: number) {
  const ttc = priceHT + (priceHT * vatRate) / 100;
  return Math.round(ttc * 100) / 100;
}

/** Example mock quotes */
export const mockBillingQuotes: BillingQuote[] = [];
