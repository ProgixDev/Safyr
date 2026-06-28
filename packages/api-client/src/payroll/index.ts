import { apiFetch } from "../client";

export type ExpenseCategory =
  | "travel"
  | "meal"
  | "accommodation"
  | "fuel"
  | "parking"
  | "other";

export interface ExpenseItem {
  id?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  receipt?: string;
  notes?: string;
  status: "draft" | "submitted" | "approved" | "rejected";
}

export interface ExpenseReport {
  id: string;
  organizationId: string;
  employeeId: string;
  title: string;
  items: ExpenseItem[];
  totalAmount: number;
  status: "draft" | "submitted" | "approved" | "rejected" | "paid";
  submittedAt?: string | null;
  reviewedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  paymentDate?: string | null;
  exportedToPayroll: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseReportPayload {
  employeeId: string;
  title: string;
  items: ExpenseItem[];
  totalAmount?: number;
  status?: "draft" | "submitted" | "approved" | "rejected" | "paid";
  notes?: string;
  exportedToPayroll?: boolean;
}

export type UpdateExpenseReportPayload = Partial<CreateExpenseReportPayload>;

export interface PayrollVariable {
  id: string;
  organizationId: string;
  employeeId: string;
  employeeName: string;
  period: string;
  type: string;
  amount: number;
  currency: string;
  description?: string | null;
  status: "pending" | "validated" | "refused";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayrollVariablePayload {
  employeeId: string;
  employeeName: string;
  period: string;
  type: string;
  amount: number;
  currency?: string;
  description?: string;
  status?: "pending" | "validated" | "refused";
  notes?: string;
}

export type UpdatePayrollVariablePayload =
  Partial<CreatePayrollVariablePayload>;

// --- Expense reports ---

export async function listExpenseReports(): Promise<ExpenseReport[]> {
  return apiFetch<ExpenseReport[]>("/organization/expenses");
}

export async function createExpenseReport(
  data: CreateExpenseReportPayload,
): Promise<ExpenseReport> {
  return apiFetch<ExpenseReport>("/organization/expenses", {
    method: "POST",
    body: data,
  });
}

export async function updateExpenseReport(
  id: string,
  data: UpdateExpenseReportPayload,
): Promise<ExpenseReport> {
  return apiFetch<ExpenseReport>(`/organization/expenses/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteExpenseReport(
  id: string,
): Promise<ExpenseReport> {
  return apiFetch<ExpenseReport>(`/organization/expenses/${id}`, {
    method: "DELETE",
  });
}

// --- Payroll variables ---

export async function listPayrollVariables(): Promise<PayrollVariable[]> {
  return apiFetch<PayrollVariable[]>("/organization/payroll-variables");
}

export async function createPayrollVariable(
  data: CreatePayrollVariablePayload,
): Promise<PayrollVariable> {
  return apiFetch<PayrollVariable>("/organization/payroll-variables", {
    method: "POST",
    body: data,
  });
}

export async function updatePayrollVariable(
  id: string,
  data: UpdatePayrollVariablePayload,
): Promise<PayrollVariable> {
  return apiFetch<PayrollVariable>(`/organization/payroll-variables/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deletePayrollVariable(
  id: string,
): Promise<PayrollVariable> {
  return apiFetch<PayrollVariable>(`/organization/payroll-variables/${id}`, {
    method: "DELETE",
  });
}
