import type {
  DocumentRequirement,
  Document,
  ComplianceItem,
} from "../organization/types";

export interface MemberAddress {
  id: string;
  memberId: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberBankDetails {
  id: string;
  memberId: string;
  iban: string;
  bic: string;
  bankName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Certification {
  id: string;
  memberId: string;
  type:
    | "CQP_APS"
    | "CNAPS"
    | "SSIAP1"
    | "SSIAP2"
    | "SSIAP3"
    | "SST"
    | "VM"
    | "H0B0"
    | "FIRE";
  number: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  verified: boolean;
  status: string;
  documentId?: string | null;
  document?: Document | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}

export interface Employee {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: string;

  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  nationality: string | null;
  gender: string | null;
  civilStatus: string | null;
  children: number | null;
  socialSecurityNumber: string | null;

  employeeNumber: string | null;
  hireDate: string | null;
  position: string | null;
  contractType: string | null;
  workSchedule: string | null;
  status: "active" | "inactive" | "suspended" | "terminated";
  terminatedAt: string | null;
  dressingAllowance: boolean;

  addressRecord: MemberAddress | null;
  bankDetails: MemberBankDetails | null;
  certifications: Certification[];
  documents: (Document & { requirement?: DocumentRequirement | null })[];
  user: EmployeeUser;
}

export interface EmployeeStats {
  total: number;
  active: number;
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationality?: string;
  gender?: "male" | "female" | "other";
  civilStatus?: "single" | "married" | "divorced" | "widowed" | "civil-union";
  children?: number;
  socialSecurityNumber?: string;
  employeeNumber: string;
  hireDate?: string;
  position: string;
  contractType?: "CDI" | "CDD" | "INTERIM" | "APPRENTICESHIP" | "INTERNSHIP";
  workSchedule?: "full-time" | "part-time";
  status?: "active" | "inactive" | "suspended" | "terminated";
  role?: "owner" | "agent";
  dressingAllowance?: boolean;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country?: string;
  };
  bankDetails: {
    iban: string;
    bic: string;
    bankName: string;
  };
}

export type UpdateEmployeePayload = Partial<
  Omit<CreateEmployeePayload, "address" | "bankDetails">
> & {
  address?: Partial<CreateEmployeePayload["address"]>;
  bankDetails?: Partial<CreateEmployeePayload["bankDetails"]>;
};

export interface CreateCertificationPayload {
  type: Certification["type"];
  number: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  verified?: boolean;
}

export type UpdateCertificationPayload = Partial<CreateCertificationPayload>;
