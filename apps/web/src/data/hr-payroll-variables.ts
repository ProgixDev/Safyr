export interface PayrollVariable {
  id: string;
  code: string;
  name: string;
  category: "base" | "premium" | "deduction" | "benefit" | "other";
  type: "fixed" | "percentage" | "calculated" | "manual";
  value?: number;
  percentage?: number;
  formula?: string;
  appliesTo: string[]; // Employee IDs or "all"
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollPeriod {
  id: string;
  period: string; // Format: "YYYY-MM"
  status: "draft" | "validated" | "paid" | "locked";
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  employeeCount: number;
  validatedAt?: string;
  validatedBy?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockPayrollVariables: PayrollVariable[] = [];

export const mockPayrollPeriods: PayrollPeriod[] = [];
