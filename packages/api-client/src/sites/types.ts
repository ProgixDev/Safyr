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

/** Champs metier du poste (Planning > Postes), stockes en JSON cote serveur. */
export interface PostDetails {
  type?: string;
  requiredQualifications?: string[];
  defaultShiftDuration?: number;
  breakDuration?: number;
  nightShift?: boolean;
  weekendWork?: boolean;
  rotatingShift?: boolean;
  minAgents?: number;
  maxAgents?: number;
  duties?: string[];
  procedures?: string;
  equipment?: string[];
  emergencyContactMode?: "site" | "client" | "manual";
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  priority?: "low" | "medium" | "high" | "critical";
}

export interface Post {
  id: string;
  siteId: string;
  name: string;
  description: string | null;
  requiredCertifications: CertificationCode[];
  defaultStartTime: string | null;
  defaultEndTime: string | null;
  active: boolean;
  details: PostDetails | null;
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
  details?: PostDetails;
}

export type UpdatePostPayload = Partial<CreatePostPayload>;
