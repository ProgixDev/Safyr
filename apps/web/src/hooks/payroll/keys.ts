export const expenseKeys = {
  all: ["expense-reports"] as const,
  list: () => [...expenseKeys.all, "list"] as const,
};

export const payrollVariableKeys = {
  all: ["payroll-variables"] as const,
  list: () => [...payrollVariableKeys.all, "list"] as const,
};
