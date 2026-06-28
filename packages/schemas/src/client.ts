import { z } from "zod";

export const DirigeantSchema = z.object({
  nom: z.string().trim().max(120).optional(),
  prenom: z.string().trim().max(120).optional(),
  dateNaissance: z.string().trim().max(40).optional(),
  lieuNaissance: z.string().trim().max(160).optional(),
  nationalite: z.string().trim().max(80).optional(),
  adresse: z.string().trim().max(255).optional(),
  email: z.string().trim().max(160).optional(),
  telephone: z.string().trim().max(40).optional(),
  fonction: z.string().trim().max(120).optional(),
  dateNomination: z.string().trim().max(40).optional(),
  numeroSecuriteSociale: z.string().trim().max(40).optional(),
});

export const CreateClientSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(160),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(80).optional(),
  contactPerson: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(160).optional(),
  siret: z.string().trim().max(40).optional(),
  numTVA: z.string().trim().max(40).optional(),
  sector: z.string().trim().max(120).optional(),
  dirigeant: DirigeantSchema.optional(),
});

export const UpdateClientSchema = CreateClientSchema.partial();

export const CreateSubcontractorSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(160),
  siret: z.string().trim().max(40).optional(),
  address: z.string().trim().max(255).optional(),
  email: z.string().trim().max(160).optional(),
  telephone: z.string().trim().max(40).optional(),
  capitalSocial: z.string().trim().max(60).optional(),
  numeroAutorisation: z.string().trim().max(80).optional(),
  dateDebut: z.string().trim().max(40).optional(),
  statut: z.enum(["actif", "inactif", "suspendu"]).default("actif"),
  prochainRenouvellement: z.string().trim().max(40).optional(),
  dirigeant: DirigeantSchema.optional(),
});

export const UpdateSubcontractorSchema = CreateSubcontractorSchema.partial();

export type DirigeantDto = z.infer<typeof DirigeantSchema>;
export type CreateClientDto = z.infer<typeof CreateClientSchema>;
export type UpdateClientDto = z.infer<typeof UpdateClientSchema>;
export type CreateSubcontractorDto = z.infer<typeof CreateSubcontractorSchema>;
export type UpdateSubcontractorDto = z.infer<typeof UpdateSubcontractorSchema>;
