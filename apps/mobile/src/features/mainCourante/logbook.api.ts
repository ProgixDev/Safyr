import { apiRequest } from "@/lib/api-client";

export type EventType = "event" | "incident" | "action" | "control";
export type Severity = "low" | "medium" | "high" | "critical";

export type LogbookEvent = {
  id: string;
  type: EventType;
  severity: Severity;
  title: string;
  description: string | null;
  occurredAt: string;
  siteId: string | null;
  category: string | null;
  status: "open" | "validated" | "closed" | "rejected";
};

export type CreateLogbookEventBody = {
  siteId?: string;
  type?: EventType;
  category?: string;
  severity?: Severity;
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
};

export function listMyEvents(): Promise<LogbookEvent[]> {
  return apiRequest<LogbookEvent[]>("/logbook/events/mine");
}

export function createEvent(
  body: CreateLogbookEventBody,
): Promise<LogbookEvent> {
  return apiRequest<LogbookEvent>("/logbook/events", {
    method: "POST",
    body,
  });
}
