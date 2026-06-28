import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listExpenseReports,
  createExpenseReport,
  updateExpenseReport,
  deleteExpenseReport,
  listPayrollVariables,
  createPayrollVariable,
  updatePayrollVariable,
  deletePayrollVariable,
  type UpdateExpenseReportPayload,
  type UpdatePayrollVariablePayload,
} from "@safyr/api-client";
import { expenseKeys, payrollVariableKeys } from "./keys";

// --- Expense reports ---

export function useExpenseReports() {
  return useQuery({
    queryKey: expenseKeys.list(),
    queryFn: listExpenseReports,
  });
}

export function useCreateExpenseReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createExpenseReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.list() }),
  });
}

export function useUpdateExpenseReport(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateExpenseReportPayload) =>
      updateExpenseReport(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.list() }),
  });
}

export function useDeleteExpenseReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteExpenseReport,
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.list() }),
  });
}

/** Update any expense report by id (for item-level edits within a report). */
export function useUpdateAnyExpenseReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateExpenseReportPayload;
    }) => updateExpenseReport(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: expenseKeys.list() }),
  });
}

// --- Payroll variables ---

export function usePayrollVariables() {
  return useQuery({
    queryKey: payrollVariableKeys.list(),
    queryFn: listPayrollVariables,
  });
}

export function useCreatePayrollVariable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPayrollVariable,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: payrollVariableKeys.list() }),
  });
}

export function useUpdatePayrollVariable(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePayrollVariablePayload) =>
      updatePayrollVariable(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: payrollVariableKeys.list() }),
  });
}

export function useDeletePayrollVariable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePayrollVariable,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: payrollVariableKeys.list() }),
  });
}

/** Update any variable by id (for validate/refuse/edit flows). */
export function useUpdateAnyPayrollVariable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePayrollVariablePayload;
    }) => updatePayrollVariable(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: payrollVariableKeys.list() }),
  });
}
