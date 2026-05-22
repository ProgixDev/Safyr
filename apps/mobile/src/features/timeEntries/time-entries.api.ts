import { apiRequest } from "@/lib/api-client";

export type TimeEntrySource = "gps" | "qr" | "manual";

export type TimeEntry = {
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
};

export type ClockInBody = {
  siteName?: string;
  source?: TimeEntrySource;
  latitude?: number;
  longitude?: number;
  notes?: string;
};

export type ClockOutBody = {
  latitude?: number;
  longitude?: number;
  notes?: string;
};

export function getActiveTimeEntry(): Promise<TimeEntry | null> {
  return apiRequest<TimeEntry | null>("/time-entries/active");
}

export function listMyTimeEntries(params: {
  from?: string;
  to?: string;
  status?: "open" | "closed" | "all";
} = {}): Promise<TimeEntry[]> {
  const query = new URLSearchParams();
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  return apiRequest<TimeEntry[]>(`/time-entries${qs ? `?${qs}` : ""}`);
}

export function clockIn(body: ClockInBody): Promise<TimeEntry> {
  return apiRequest<TimeEntry>("/time-entries/clock-in", {
    method: "POST",
    body,
  });
}

export function clockOut(body: ClockOutBody): Promise<TimeEntry> {
  return apiRequest<TimeEntry>("/time-entries/clock-out", {
    method: "POST",
    body,
  });
}
