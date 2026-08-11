import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const Latitude = z.number().min(-90).max(90);
const Longitude = z.number().min(-180).max(180);

export const CreateSiteSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120),
  clientName: z.string().trim().max(120).optional(),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(120).optional(),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Code postal invalide")
    .optional(),
  country: z.string().trim().max(80).default("France"),
  latitude: Latitude.optional(),
  longitude: Longitude.optional(),
  geofenceRadiusMeters: z.number().int().min(10).max(10000).optional(),
  notes: z.string().trim().max(500).optional(),
  active: z.boolean().default(true),
});

export const UpdateSiteSchema = CreateSiteSchema.partial();

const CertificationCode = z.enum([
  "CQP_APS",
  "CNAPS",
  "SSIAP1",
  "SSIAP2",
  "SSIAP3",
  "SST",
  "VM",
  "H0B0",
  "FIRE",
]);

/** Champs métier du poste, conservés tels quels dans la colonne `details`. */
export const PostDetailsSchema = z.object({
  type: z.string().trim().max(60).optional(),
  requiredQualifications: z.array(z.string().trim().max(60)).optional(),
  defaultShiftDuration: z.number().min(0).max(24).optional(),
  breakDuration: z.number().min(0).max(600).optional(),
  nightShift: z.boolean().optional(),
  weekendWork: z.boolean().optional(),
  rotatingShift: z.boolean().optional(),
  minAgents: z.number().int().min(0).max(200).optional(),
  maxAgents: z.number().int().min(0).max(200).optional(),
  duties: z.array(z.string().trim().max(500)).optional(),
  procedures: z.string().trim().max(4000).optional(),
  equipment: z.array(z.string().trim().max(120)).optional(),
  emergencyContactMode: z.enum(["site", "client", "manual"]).optional(),
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: z.string().trim().max(30).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export const CreatePostSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120),
  description: z.string().trim().max(500).optional(),
  requiredCertifications: z.array(CertificationCode).default([]),
  defaultStartTime: z
    .string()
    .regex(TIME_REGEX, "Format HH:MM attendu")
    .optional(),
  defaultEndTime: z
    .string()
    .regex(TIME_REGEX, "Format HH:MM attendu")
    .optional(),
  active: z.boolean().default(true),
  /**
   * Caractéristiques métier saisies dans Planning › Postes (type de poste,
   * capacité, consignes, équipement, contact d'urgence, priorité). Stockées
   * telles quelles : elles n'ont pas vocation à être interrogées en SQL.
   */
  details: PostDetailsSchema.optional(),
});

export const UpdatePostSchema = CreatePostSchema.partial();

export type CreateSiteDto = z.infer<typeof CreateSiteSchema>;
export type UpdateSiteDto = z.infer<typeof UpdateSiteSchema>;
export type PostDetails = z.infer<typeof PostDetailsSchema>;
export type CreatePostDto = z.infer<typeof CreatePostSchema>;
export type UpdatePostDto = z.infer<typeof UpdatePostSchema>;
