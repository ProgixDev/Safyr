export type CertificationCode =
  | "CQP_APS"
  | "CNAPS"
  | "SSIAP1"
  | "SSIAP2"
  | "SSIAP3"
  | "SST"
  | "VM"
  | "H0B0"
  | "FIRE";

export interface Post {
  id: string;
  siteId: string;
  name: string;
  description: string | null;
  requiredCertifications: CertificationCode[];
  defaultStartTime: string | null;
  defaultEndTime: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: string;
  organizationId: string;
  name: string;
  clientName: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  geofenceRadiusMeters: number | null;
  notes: string | null;
  active: boolean;
  posts: Post[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSitePayload {
  name: string;
  clientName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  geofenceRadiusMeters?: number;
  notes?: string;
  active?: boolean;
}

export type UpdateSitePayload = Partial<CreateSitePayload>;

export interface CreatePostPayload {
  name: string;
  description?: string;
  requiredCertifications?: CertificationCode[];
  defaultStartTime?: string;
  defaultEndTime?: string;
  active?: boolean;
}

export type UpdatePostPayload = Partial<CreatePostPayload>;
