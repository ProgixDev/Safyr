import { z } from "zod";

export const EventTypeSchema = z.enum([
  "event",
  "incident",
  "action",
  "control",
]);
export const SeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export const EventStatusSchema = z.enum([
  "open",
  "validated",
  "closed",
  "rejected",
]);

const Latitude = z.number().min(-90).max(90);
const Longitude = z.number().min(-180).max(180);

export const CreateLogbookEventSchema = z.object({
  siteId: z.string().min(1).optional(),
  type: EventTypeSchema.default("event"),
  category: z.string().trim().max(60).optional(),
  severity: SeveritySchema.default("low"),
  title: z.string().trim().min(1, "Titre requis").max(160),
  description: z.string().trim().max(2000).optional(),
  occurredAt: z
    .string()
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Date invalide")
    .optional(),
  latitude: Latitude.optional(),
  longitude: Longitude.optional(),
});

export const UpdateLogbookEventSchema = z.object({
  type: EventTypeSchema.optional(),
  category: z.string().trim().max(60).nullable().optional(),
  severity: SeveritySchema.optional(),
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});

export const ValidateLogbookEventSchema = z.object({
  status: z.enum(["validated", "rejected", "closed"]),
  comment: z.string().trim().max(500).optional(),
});

export const ListLogbookEventsQuerySchema = z.object({
  memberId: z.string().optional(),
  siteId: z.string().optional(),
  type: EventTypeSchema.optional(),
  severity: SeveritySchema.optional(),
  status: EventStatusSchema.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type EventType = z.infer<typeof EventTypeSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type EventStatus = z.infer<typeof EventStatusSchema>;
export type CreateLogbookEventDto = z.infer<typeof CreateLogbookEventSchema>;
export type UpdateLogbookEventDto = z.infer<typeof UpdateLogbookEventSchema>;
export type ValidateLogbookEventDto = z.infer<
  typeof ValidateLogbookEventSchema
>;
export type ListLogbookEventsQuery = z.infer<
  typeof ListLogbookEventsQuerySchema
>;
