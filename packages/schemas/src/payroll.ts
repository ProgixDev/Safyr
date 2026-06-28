import { z } from "zod";

export const ExpenseItemSchema = z.object({
  id: z.string().optional(),
  category: z.enum([
    "travel",
    "meal",
    "accommodation",
    "fuel",
    "parking",
    "other",
  ]),
  description: z.string().trim().max(500).default(""),
  amount: z.number().nonnegative(),
  date: z.string(), // ISO date string
  receipt: z.string().optional(),
  notes: z.string().optional(),
  status: z
    .enum(["draft", "submitted", "approved", "rejected"])
    .default("submitted"),
}).passthrough(); // preserve item-level metadata (approvedAt, rejectionNotes, ...)

export const CreateExpenseReportSchema = z.object({
  employeeId: z.string().trim().min(1, "Salarié requis"),
  title: z.string().trim().min(1).max(200),
  items: z.array(ExpenseItemSchema).default([]),
  totalAmount: z.number().nonnegative().default(0),
  status: z
    .enum(["draft", "submitted", "approved", "rejected", "paid"])
    .default("draft"),
  notes: z.string().optional(),
  exportedToPayroll: z.boolean().default(false),
});

export const UpdateExpenseReportSchema = CreateExpenseReportSchema.partial();

const PayrollVariableType = z.string().trim().min(1);

export const CreatePayrollVariableSchema = z.object({
  employeeId: z.string().trim().min(1, "Salarié requis"),
  employeeName: z.string().trim().min(1),
  period: z.string().trim().min(1),
  type: PayrollVariableType,
  amount: z.number(),
  currency: z.string().trim().default("EUR"),
  description: z.string().optional(),
  status: z.enum(["pending", "validated", "refused"]).default("pending"),
  notes: z.string().optional(),
});

export const UpdatePayrollVariableSchema =
  CreatePayrollVariableSchema.partial();

export type ExpenseItemDto = z.infer<typeof ExpenseItemSchema>;
export type CreateExpenseReportDto = z.infer<typeof CreateExpenseReportSchema>;
export type UpdateExpenseReportDto = z.infer<typeof UpdateExpenseReportSchema>;
export type CreatePayrollVariableDto = z.infer<
  typeof CreatePayrollVariableSchema
>;
export type UpdatePayrollVariableDto = z.infer<
  typeof UpdatePayrollVariableSchema
>;
