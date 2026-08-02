export interface Representative {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  birthPlace?: string;
  nationality?: string;
  address?: string;
  email?: string;
  phone?: string;
  position?: string;
  appointmentDate?: string;
  socialSecurityNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  createdAt: string;
  siret?: string;
  ape?: string;
  address?: string;
  shareCapital?: string;
  authorizationNumber?: string;
  email?: string;
  phone?: string;
  /** Second numéro de téléphone de l'entreprise (facultatif). */
  phone2?: string;
  /** Numéro de TVA intracommunautaire (ex. FR40303265045). */
  numTVA?: string;
  representativeId?: string;
  representative?: Representative;
}

export interface DocumentRequirement {
  id: string;
  name: string;
  description?: string;
  type: string;
  category: string;
  targetType: string;
  isRequired: boolean;
  hasExpiry: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  storageKey: string;
  mimeType: string;
  size: number;
  status: string;
  expiryDate?: string;
  requirementId?: string;
  organizationId?: string;
  memberId?: string;
  uploaderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceItem {
  requirement: DocumentRequirement;
  document: Document | null;
  status: string;
}

export type UpdateOrganizationPayload = Partial<
  Omit<Organization, "id" | "slug" | "createdAt" | "representative">
> & {
  representative?: Partial<Omit<Representative, "id" | "createdAt" | "updatedAt">>;
};

export type CreateRepresentativePayload = Omit<
  Representative,
  "id" | "createdAt" | "updatedAt"
>;
