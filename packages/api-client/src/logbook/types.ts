export type EventType = "event" | "incident" | "action" | "control";
export type Severity = "low" | "medium" | "high" | "critical";
export type EventStatus = "open" | "validated" | "closed" | "rejected";

export interface LogbookEvent {
  id: string;
  organizationId: string;
  memberId: string | null;
  siteId: string | null;
  type: EventType;
  category: string | null;
  severity: Severity;
  title: string;
  description: string | null;
  occurredAt: string;
  latitude: number | null;
  longitude: number | null;
  status: EventStatus;
  validatorId: string | null;
  validatedAt: string | null;
  validationComment: string | null;
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    employeeNumber: string | null;
  } | null;
  site?: {
    id: string;
    name: string;
    clientName: string | null;
  } | null;
}

export interface CreateLogbookEventPayload {
  siteId?: string;
  type?: EventType;
  category?: string;
  severity?: Severity;
  title: string;
  description?: string;
  occurredAt?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateLogbookEventPayload {
  type?: EventType;
  category?: string | null;
  severity?: Severity;
  title?: string;
  description?: string | null;
}

export interface ValidateLogbookEventPayload {
  status: "validated" | "rejected" | "closed";
  comment?: string;
}

export interface ListLogbookEventsParams {
  memberId?: string;
  siteId?: string;
  type?: EventType;
  severity?: Severity;
  status?: EventStatus;
  from?: string;
  to?: string;
}
