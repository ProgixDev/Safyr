export type EventType =
  | "routine"
  | "incident"
  | "action"
  | "control"
  | "critical";

export type EventStatus = "in_progress" | "resolved" | "deferred" | "pending";

export type EventSeverity = "low" | "medium" | "high" | "critical";

export interface LogbookEvent {
  id: string;
  timestamp: string;
  site: string;
  siteId: string;
  zone?: string;
  type: EventType;
  severity: EventSeverity;
  status: EventStatus;
  title: string;
  description: string;
  agentId: string;
  agentName: string;
  supervisorId?: string;
  supervisorName?: string;
  supervisorComment?: string;
  clientNotified: boolean;
  tags: string[];
  media?: {
    photos?: string[];
    videos?: string[];
    voiceNotes?: string[];
  };
  location?: {
    lat: number;
    lng: number;
  };
  signature?: string;
  validatedAt?: string;
  resolvedAt?: string;
}

// Helper function to get today's date in ISO format
const getTodayISO = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const mockLogbookEvents: LogbookEvent[] = [];

export const mockSites: { id: string; name: string; city: string }[] = [];

export const mockAgents: {
  id: string;
  name: string;
  role: string;
  siteId?: string;
  site?: string;
  phone?: string;
  status?: string;
}[] = [];

export const mockSupervisors: { id: string; name: string; role: string }[] = [];
