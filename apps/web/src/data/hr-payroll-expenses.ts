export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  type:
    | "mileage"
    | "meal"
    | "accommodation"
    | "training"
    | "equipment"
    | "other";
  description: string;
  amount: number;
  date: string;
  receiptUrl?: string;
  status: "draft" | "submitted" | "validated" | "rejected" | "paid";
  submittedAt?: string;
  validatedAt?: string;
  validatedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockExpenses: Expense[] = [];
