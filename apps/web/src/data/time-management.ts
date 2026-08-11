import type {
  TimeOffRequest,
  WorkedHours,
  CSEDelegationHours,
  AbsenceSummary,
  TimeManagementStats,
} from "@/lib/types";

export const mockTimeOffRequests: TimeOffRequest[] = [];

export const mockWorkedHours: WorkedHours[] = [];

export const mockCSEDelegationHours: CSEDelegationHours[] = [];

export const mockAbsenceSummaries: AbsenceSummary[] = [];

export const mockTimeManagementStats: TimeManagementStats = {
  totalRequests: mockTimeOffRequests.length,
  pendingRequests: mockTimeOffRequests.filter((r) => r.status === "pending")
    .length,
  approvedRequests: mockTimeOffRequests.filter((r) => r.status === "approved")
    .length,
  rejectedRequests: mockTimeOffRequests.filter((r) => r.status === "rejected")
    .length,
  totalAbsenceDays: mockTimeOffRequests.reduce(
    (sum, r) => sum + r.totalDays,
    0,
  ),
  averageResponseTime: 24, // hours
  employeesOnLeave: 2,
};

export function getTimeOffRequestById(id: string): TimeOffRequest | undefined {
  return mockTimeOffRequests.find((request) => request.id === id);
}

export function getTimeOffRequestsByEmployee(
  employeeId: string,
): TimeOffRequest[] {
  return mockTimeOffRequests.filter(
    (request) => request.employeeId === employeeId,
  );
}

export function getWorkedHoursByEmployee(employeeId: string): WorkedHours[] {
  return mockWorkedHours.filter((hours) => hours.employeeId === employeeId);
}
