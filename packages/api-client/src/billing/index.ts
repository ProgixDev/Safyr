import { apiFetch } from "../client";

export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled";

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  label: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  siteId: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  siteId: string | null;
  siteName: string | null;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
  planningHours: number;
  normalHours: number;
  overtimeHours: number;
  hourlyRate: number;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes: string | null;
  issuedAt: string | null;
  paymentDueDate: string | null;
  paidAt: string | null;
  lines: InvoiceLine[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoicePayload {
  clientId: string;
  clientName: string;
  siteId?: string;
  siteName?: string;
  periodStart: string;
  periodEnd: string;
  status?: InvoiceStatus;
  vatRate?: number;
  notes?: string;
  lines: {
    label: string;
    quantity: number;
    unitPrice: number;
    siteId?: string;
  }[];
}

export interface UpdateInvoicePayload {
  status?: InvoiceStatus;
  notes?: string;
  paidAt?: string;
  paymentDueDate?: string;
}

/** Génération d'une facture à partir des vacations du planning. */
export interface GenerateInvoicePayload {
  clientName: string;
  periodStart: string;
  periodEnd: string;
  hourlyRate: number;
  vatRate?: number;
}

export function listInvoices(): Promise<Invoice[]> {
  return apiFetch<Invoice[]>("/billing/invoices");
}

export function getInvoice(invoiceId: string): Promise<Invoice> {
  return apiFetch<Invoice>(`/billing/invoices/${invoiceId}`);
}

export function createInvoice(
  payload: CreateInvoicePayload,
): Promise<Invoice> {
  return apiFetch<Invoice>("/billing/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function generateInvoiceFromPlanning(
  payload: GenerateInvoicePayload,
): Promise<Invoice> {
  return apiFetch<Invoice>("/billing/invoices/from-planning", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateInvoice(
  invoiceId: string,
  payload: UpdateInvoicePayload,
): Promise<Invoice> {
  return apiFetch<Invoice>(`/billing/invoices/${invoiceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteInvoice(invoiceId: string): Promise<Invoice> {
  return apiFetch<Invoice>(`/billing/invoices/${invoiceId}`, {
    method: "DELETE",
  });
}
