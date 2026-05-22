import { apiFetch } from "../client";
import type {
  ActivePosition,
  ClockInPayload,
  ClockOutPayload,
  ListTimeEntriesParams,
  TimeEntry,
} from "./types";

export * from "./types";

export async function getActiveTimeEntry(): Promise<TimeEntry | null> {
  return apiFetch<TimeEntry | null>("/time-entries/active");
}

export async function listActivePositions(): Promise<ActivePosition[]> {
  return apiFetch<ActivePosition[]>("/time-entries/active-positions");
}

export async function listTimeEntries(
  params: ListTimeEntriesParams = {},
): Promise<TimeEntry[]> {
  const query = new URLSearchParams();
  if (params.memberId) query.set("memberId", params.memberId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.status) query.set("status", params.status);
  const qs = query.toString();
  return apiFetch<TimeEntry[]>(`/time-entries${qs ? `?${qs}` : ""}`);
}

export async function clockIn(data: ClockInPayload = {}): Promise<TimeEntry> {
  return apiFetch<TimeEntry>("/time-entries/clock-in", {
    method: "POST",
    body: data,
  });
}

export async function clockOut(data: ClockOutPayload = {}): Promise<TimeEntry> {
  return apiFetch<TimeEntry>("/time-entries/clock-out", {
    method: "POST",
    body: data,
  });
}
