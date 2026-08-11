import { z } from "zod";

const isoDate = (v: string) => !Number.isNaN(new Date(v).getTime());

export const InvoiceStatusSchema = z.enum([
  "draft",
  "sent",
  "paid",
  "cancelled",
]);

export const InvoiceLineSchema = z.object({
  label: z.string().trim().min(1, "Libellé requis").max(160),
  quantity: z.number().min(0).max(100_000),
  unitPrice: z.number().min(0).max(1_000_000),
  siteId: z.string().trim().max(60).optional(),
});

export const CreateInvoiceSchema = z.object({
  clientId: z.string().trim().min(1, "Client requis"),
  clientName: z.string().trim().min(1, "Nom du client requis").max(160),
  siteId: z.string().trim().max(60).optional(),
  siteName: z.string().trim().max(160).optional(),
  periodStart: z.string().refine(isoDate, "Date de début invalide"),
  periodEnd: z.string().refine(isoDate, "Date de fin invalide"),
  status: InvoiceStatusSchema.optional(),
  vatRate: z.number().min(0).max(100).optional(),
  notes: z.string().trim().max(2000).optional(),
  lines: z.array(InvoiceLineSchema).min(1, "Au moins une ligne est requise"),
});

export const UpdateInvoiceSchema = z.object({
  status: InvoiceStatusSchema.optional(),
  notes: z.string().trim().max(2000).optional(),
  paidAt: z.string().refine(isoDate, "Date invalide").optional(),
  paymentDueDate: z.string().refine(isoDate, "Date invalide").optional(),
});

/**
 * Génération d'une facture à partir des vacations planifiées : le module
 * facturation se nourrit du planning plutôt que d'une double saisie.
 */
export const GenerateInvoiceSchema = z.object({
  clientName: z.string().trim().min(1, "Client requis").max(160),
  periodStart: z.string().refine(isoDate, "Date de début invalide"),
  periodEnd: z.string().refine(isoDate, "Date de fin invalide"),
  hourlyRate: z.number().min(0).max(10_000),
  vatRate: z.number().min(0).max(100).optional(),
});

export type CreateInvoiceDto = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceDto = z.infer<typeof UpdateInvoiceSchema>;
export type GenerateInvoiceDto = z.infer<typeof GenerateInvoiceSchema>;
