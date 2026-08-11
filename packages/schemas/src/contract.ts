import { z } from "zod";

// Le type de contrat est déjà défini côté salarié : on le réutilise plutôt
// que de le dupliquer.
import { ContractTypeSchema } from "./employee";

export const ContractStatusSchema = z.enum([
  "draft",
  "active",
  "ended",
  "terminated",
]);

const isoDate = (v: string) => !Number.isNaN(new Date(v).getTime());

const ContractFieldsSchema = z.object({
  type: ContractTypeSchema,
  position: z.string().trim().min(1, "Poste requis").max(120),
  startDate: z.string().refine(isoDate, "Date de début invalide"),
  endDate: z.string().refine(isoDate, "Date de fin invalide").optional(),
  workingHours: z.number().min(0).max(80).optional(),
  grossSalary: z.number().min(0).max(1_000_000).optional(),
  trialPeriodEndDate: z
    .string()
    .refine(isoDate, "Date de fin d'essai invalide")
    .optional(),
  status: ContractStatusSchema.optional(),
  signedByEmployee: z.boolean().optional(),
  signedByEmployer: z.boolean().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const CreateContractSchema = ContractFieldsSchema
  .refine(
    (c) => !c.endDate || new Date(c.endDate) >= new Date(c.startDate),
    "La date de fin doit suivre la date de début",
  )
  .refine(
    (c) => c.type !== "CDD" || !!c.endDate,
    "Un CDD doit comporter une date de fin",
  );

export const UpdateContractSchema = ContractFieldsSchema.partial();

export type CreateContractDto = z.infer<typeof CreateContractSchema>;
export type UpdateContractDto = z.infer<typeof UpdateContractSchema>;

/**
 * Documents rattachés à un module sans table dédiée : sous-traitants,
 * dossiers fiscaux (TVA, CFE, prélèvement, courriers), dossiers AKTO/OPCO.
 */
export const AttachedScopeSchema = z.enum(["subcontractor", "tax", "akto"]);

export const AttachDocumentSchema = z.object({
  scope: AttachedScopeSchema,
  scopeId: z.string().trim().min(1, "Identifiant requis").max(120),
  slot: z.string().trim().min(1, "Type de pièce requis").max(60),
});

export type AttachedScope = z.infer<typeof AttachedScopeSchema>;
export type AttachDocumentDto = z.infer<typeof AttachDocumentSchema>;
