export interface Absence {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  type:
    | "sick_leave"
    | "accident_work"
    | "maternity"
    | "paternity"
    | "unpaid"
    | "other";
  startDate: string;
  endDate?: string;
  totalDays: number;
  reason: string;
  medicalCertificate: boolean;
  certificateUrl?: string;
  workAccident: boolean;
  workAccidentId?: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockAbsences: Absence[] = [];
