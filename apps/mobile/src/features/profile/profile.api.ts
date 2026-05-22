import { apiRequest } from "@/lib/api-client";
import { getSession } from "@/features/auth/auth.storage";

export type CertificationType =
  | "CQP_APS"
  | "CNAPS"
  | "SSIAP1"
  | "SSIAP2"
  | "SSIAP3"
  | "SST"
  | "VM"
  | "H0B0"
  | "FIRE";

export type EmployeeCertification = {
  id: string;
  type: CertificationType;
  number: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  verified: boolean;
};

export type EmployeeDocumentSummary = {
  id: string;
  storageKey: string;
  expiryDate: string | null;
  requirement?: {
    id: string;
    name: string;
    isRequired: boolean;
  } | null;
};

export type EmployeeProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  status: "active" | "inactive" | "suspended" | "terminated";
  employeeNumber: string | null;
  hireDate: string | null;
  certifications: EmployeeCertification[];
  documents: EmployeeDocumentSummary[];
  user: { id: string; email: string; name: string };
};

const CERTIFICATION_LABELS: Record<CertificationType, string> = {
  CQP_APS: "CQP/APS",
  CNAPS: "Carte Pro CNAPS",
  SSIAP1: "SSIAP 1",
  SSIAP2: "SSIAP 2",
  SSIAP3: "SSIAP 3",
  SST: "SST",
  VM: "Visite Médicale",
  H0B0: "H0B0",
  FIRE: "Incendie",
};

export function getCertificationLabel(type: CertificationType): string {
  return CERTIFICATION_LABELS[type] ?? type;
}

export type CertStatus = "valid" | "expiring-soon" | "expired";

export function computeCertStatus(expiryIso: string): CertStatus {
  const expiry = new Date(expiryIso).getTime();
  if (Number.isNaN(expiry)) return "expired";
  const days = (expiry - Date.now()) / 86_400_000;
  if (days < 0) return "expired";
  if (days <= 60) return "expiring-soon";
  return "valid";
}

export async function fetchMyEmployeeProfile(): Promise<EmployeeProfile | null> {
  const session = await getSession();
  if (!session) return null;

  const employees = await apiRequest<EmployeeProfile[]>(
    "/organization/employees",
  );
  return employees.find((e) => e.user.id === session.userId) ?? null;
}

export async function fetchSignedDocumentUrl(
  storageKey: string,
): Promise<string> {
  const data = await apiRequest<{ url: string }>(
    `/storage/signed-url/${encodeURIComponent(storageKey)}`,
  );
  return data.url;
}
