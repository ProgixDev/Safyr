import { apiFetch } from "../client";
import type {
  CreateLogbookEventPayload,
  ListLogbookEventsParams,
  LogbookEvent,
  UpdateLogbookEventPayload,
  ValidateLogbookEventPayload,
} from "./types";

export * from "./types";

export function listLogbookEvents(
  params: ListLogbookEventsParams = {},
): Promise<LogbookEvent[]> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") qs.set(k, String(v));
  }
  const search = qs.toString();
  return apiFetch<LogbookEvent[]>(
    `/logbook/events${search ? `?${search}` : ""}`,
  );
}

export function listMyLogbookEvents(): Promise<LogbookEvent[]> {
  return apiFetch<LogbookEvent[]>("/logbook/events/mine");
}

export const createLogbookEvent = (data: CreateLogbookEventPayload) =>
  apiFetch<LogbookEvent>("/logbook/events", { method: "POST", body: data });

export const updateLogbookEvent = (
  eventId: string,
  data: UpdateLogbookEventPayload,
) =>
  apiFetch<LogbookEvent>(`/logbook/events/${eventId}`, {
    method: "PATCH",
    body: data,
  });

export const validateLogbookEvent = (
  eventId: string,
  data: ValidateLogbookEventPayload,
) =>
  apiFetch<LogbookEvent>(`/logbook/events/${eventId}/validate`, {
    method: "POST",
    body: data,
  });

export const deleteLogbookEvent = (eventId: string) =>
  apiFetch<LogbookEvent>(`/logbook/events/${eventId}`, { method: "DELETE" });
