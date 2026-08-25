import { z } from "zod";

/** Registres administratifs tenus dans Entreprise, Formation et Salariés. */
export const FiscalRecordTypeSchema = z.enum([
  "tva",
  "cfe",
  "prelevement",
  "courrier",
  "akto",
  // Organismes et pièces de « Divers documents »
  "organisme",
  "divers",
  "courrier_organisme",
  // Dotations et avantages attribués à un salarié
  "equipement",
  "avantage",
  // Registres RH tenus dans Salariés : entretiens, objectifs, discipline
  "entretien_annuel",
  "entretien_professionnel",
  "objectif",
  "avertissement",
  "procedure_disciplinaire",
  "sanction",
]);

export const CreateFiscalRecordSchema = z.object({
  type: FiscalRecordTypeSchema,
  /** « 2026-03 » pour un mois, « 2026 » pour une année. */
  period: z.string().trim().min(4).max(20),
  label: z.string().trim().min(1, "Libellé requis").max(160),
  status: z.string().trim().max(40).optional(),
  amount: z.number().min(0).max(100_000_000).optional(),
  dueDate: z.string().trim().max(40).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const UpdateFiscalRecordSchema = CreateFiscalRecordSchema.partial();

export type FiscalRecordType = z.infer<typeof FiscalRecordTypeSchema>;
export type CreateFiscalRecordDto = z.infer<typeof CreateFiscalRecordSchema>;
export type UpdateFiscalRecordDto = z.infer<typeof UpdateFiscalRecordSchema>;
