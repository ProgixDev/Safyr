import { PayrollControl, ControlExecution, PayrollAnomaly } from "@/lib/types";

// Available control definitions
export const PAYROLL_CONTROLS: PayrollControl[] = [];

// Mock anomalies
export const MOCK_ANOMALIES: PayrollAnomaly[] = [];

// Mock execution history
export const MOCK_EXECUTIONS: ControlExecution[] = [];

// Helper functions
export function getControlsByCategory(
  category: PayrollControl["category"],
): PayrollControl[] {
  return PAYROLL_CONTROLS.filter((control) => control.category === category);
}

export function getAnomaliesBySeverity(
  severity: PayrollAnomaly["severity"],
): PayrollAnomaly[] {
  return MOCK_ANOMALIES.filter((anomaly) => anomaly.severity === severity);
}

export function getAnomaliesByEmployee(employeeId: string): PayrollAnomaly[] {
  return MOCK_ANOMALIES.filter((anomaly) => anomaly.employeeId === employeeId);
}

export function getAnomaliesByStatus(
  status: PayrollAnomaly["status"],
): PayrollAnomaly[] {
  return MOCK_ANOMALIES.filter((anomaly) => anomaly.status === status);
}

export function getAutoCorrectableAnomalies(): PayrollAnomaly[] {
  return MOCK_ANOMALIES.filter((anomaly) => anomaly.autoCorrectAvailable);
}

export function getCategoryCounts() {
  const counts: Record<string, number> = {};
  PAYROLL_CONTROLS.forEach((control) => {
    const anomalies = MOCK_ANOMALIES.filter(
      (a) => a.controlId === control.id,
    ).length;
    if (!counts[control.category]) {
      counts[control.category] = 0;
    }
    counts[control.category] += anomalies;
  });
  return counts;
}
