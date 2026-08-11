export interface OffboardingProcess {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  contractEndDate: string;
  noticePeriodStart: string;
  noticePeriodEnd: string;
  reason:
    | "resignation"
    | "end_of_contract"
    | "dismissal"
    | "retirement"
    | "other";
  status: "En cours" | "Terminé" | "Annulé";
  equipmentReturned: boolean;
  equipmentReturnDate?: string;
  documentsGenerated: {
    workCertificate: boolean;
    poleEmploiCertificate: boolean;
    finalSettlement: boolean;
  };
  payrollExported: boolean;
  fileArchived: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockOffboardingProcesses: OffboardingProcess[] = [];
