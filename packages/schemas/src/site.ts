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
});

export const UpdatePostSchema = CreatePostSchema.partial();

export type CreateSiteDto = z.infer<typeof CreateSiteSchema>;
export type UpdateSiteDto = z.infer<typeof UpdateSiteSchema>;
export type CreatePostDto = z.infer<typeof CreatePostSchema>;
export type UpdatePostDto = z.infer<typeof UpdatePostSchema>;
