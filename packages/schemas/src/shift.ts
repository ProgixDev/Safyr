import { z } from "zod";

export const ShiftStatusSchema = z.enum([
  "planned",
  "confirmed",
  "cancelled",
  "completed",
]);
export type ShiftStatus = z.infer<typeof ShiftStatusSchema>;

const IsoDateTime = z
  .string()
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Date invalide");

export const CreateShiftSchema = z
  .object({
    postId: z.string().min(1, "Poste requis"),
    memberId: z.string().nullable().optional(),
    startAt: IsoDateTime,
    endAt: IsoDateTime,
    status: ShiftStatusSchema.default("planned"),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((v) => new Date(v.endAt) > new Date(v.startAt), {
    message: "La fin doit être après le début",
    path: ["endAt"],
  });

export const UpdateShiftSchema = z
  .object({
    postId: z.string().min(1).optional(),
    memberId: z.string().nullable().optional(),
    startAt: IsoDateTime.optional(),
    endAt: IsoDateTime.optional(),
    status: ShiftStatusSchema.optional(),
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (v) =>
      !v.startAt || !v.endAt || new Date(v.endAt) > new Date(v.startAt),
    { message: "La fin doit être après le début", path: ["endAt"] },
  );

export const ListShiftsQuerySchema = z.object({
  siteId: z.string().optional(),
  postId: z.string().optional(),
  memberId: z.string().optional(),
  from: IsoDateTime.optional(),
  to: IsoDateTime.optional(),
  status: ShiftStatusSchema.optional(),
});

export type CreateShiftDto = z.infer<typeof CreateShiftSchema>;
export type UpdateShiftDto = z.infer<typeof UpdateShiftSchema>;
export type ListShiftsQuery = z.infer<typeof ListShiftsQuerySchema>;
