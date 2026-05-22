export type TimeEntrySource = "gps" | "qr" | "manual";

export interface TimeEntry {
  id: string;
  organizationId: string;
  memberId: string;
  siteName: string | null;
  source: TimeEntrySource;
  clockInAt: string;
  clockInLat: number | null;
  clockInLng: number | null;
  clockOutAt: string | null;
  clockOutLat: number | null;
  clockOutLng: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    employeeNumber: string | null;
    position?: string | null;
  };
}

export interface ActivePosition extends TimeEntry {
  member: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    employeeNumber: string | null;
    position: string | null;
  };
}

export interface ClockInPayload {
  siteName?: string;
  source?: TimeEntrySource;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface ClockOutPayload {
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface ListTimeEntriesParams {
  memberId?: string;
  from?: string;
  to?: string;
  status?: "open" | "closed" | "all";
}
