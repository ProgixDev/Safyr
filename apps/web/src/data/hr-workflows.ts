export interface CertificateRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  type: "work" | "salary" | "employment" | "training" | "other";
  purpose: string;
  deliveryMethod: "email" | "pickup" | "post";
  status: "pending" | "in_progress" | "ready" | "delivered" | "cancelled";
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  readyAt?: string;
  deliveredAt?: string;
  documentUrl?: string;
  priority: "low" | "normal" | "high" | "urgent";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department?: string;
  documentType: "payslip" | "contract" | "attestation" | "other";
  documentDescription: string;
  period?: string;
  year?: number;
  specificDetails?: string;
  deliveryMethod: "email" | "pickup" | "post";
  status: "pending" | "in_progress" | "validated" | "provided" | "cancelled";
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
  providedAt?: string;
  documentUrl?: string;
  priority: "low" | "normal" | "high" | "urgent";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankDetailsChange {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  currentIban?: string;
  newIban: string;
  newBic: string;
  newBankName: string;
  reason: string;
  status: "pending" | "validated" | "rejected" | "cancelled";
  submittedAt: string;
  validatedAt?: string;
  validatedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SignatureRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  documentType: "contract" | "amendment" | "acknowledgment" | "other";
  documentTitle: string;
  documentUrl: string;
  status: "pending" | "sent" | "signed" | "expired" | "cancelled";
  sentAt?: string;
  signedAt?: string;
  expiresAt?: string;
  signatureMethod: "electronic" | "physical";
  reminderSent: boolean;
  reminderSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const mockCertificateRequests: CertificateRequest[] = [];

export const mockDocumentRequests: DocumentRequest[] = [];

export const mockBankDetailsChanges: BankDetailsChange[] = [];

export const mockSignatureRequests: SignatureRequest[] = [];
