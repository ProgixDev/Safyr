import { z } from "zod";

export const TimeEntrySourceSchema = z.enum(["gps", "qr", "manual"]);
export type TimeEntrySource = z.infer<typeof TimeEntrySourceSchema>;

const LatitudeSchema = z.number().min(-90).max(90);
const LongitudeSchema = z.number().min(-180).max(180);

export const ClockInSchema = z.object({
  siteName: z.string().trim().min(1).max(120).optional(),
  source: TimeEntrySourceSchema.default("gps"),
  latitude: LatitudeSchema.optional(),
  longitude: LongitudeSchema.optional(),
  notes: z.string().trim().max(500).optional(),
});

export const ClockOutSchema = z.object({
  latitude: LatitudeSchema.optional(),
  longitude: LongitudeSchema.optional(),
  notes: z.string().trim().max(500).optional(),
});

export const ListTimeEntriesQuerySchema = z.object({
  memberId: z.string().optional(),
  from: z.string().optional(), // ISO date
  to: z.string().optional(), // ISO date
  status: z.enum(["open", "closed", "all"]).default("all"),
});

export type ClockInDto = z.infer<typeof ClockInSchema>;
export type ClockOutDto = z.infer<typeof ClockOutSchema>;
export type ListTimeEntriesQuery = z.infer<typeof ListTimeEntriesQuerySchema>;
