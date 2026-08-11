import type { Employee, EmployeeStats } from "@/lib/types";

export const mockEmployees: Employee[] = [];

export const mockStats: EmployeeStats = {
  total: mockEmployees.length,
  active: mockEmployees.filter((e) => e.status === "active").length,
  inactive: mockEmployees.filter(
    (e) => e.status === "inactive" || e.status === "suspended",
  ).length,
  expiringCertifications: 3,
  pendingContracts: 2,
  cseMembers: 2,
};

export function getEmployeeById(id: string): Employee | undefined {
  return mockEmployees.find((emp) => emp.id === id);
}
