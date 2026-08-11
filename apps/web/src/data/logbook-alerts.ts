export type AlertType =
  | "grave_incident"
  | "effraction"
  | "incendie"
  | "critique_medical"
  | "absence_ronde"
  | "inactivite"
  | "pc_securite"
  | "superviseur"
  | "client"
  | "rh";

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  timestamp: string;
  site: string;
  siteId: string;
  zone?: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "active" | "acknowledged" | "resolved" | "closed";
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  notified: {
    pcSecurite: boolean;
    superviseur: boolean;
    client: boolean;
    rh: boolean;
  };
  eventId?: string;
  agentId?: string;
  agentName?: string;
  location?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const mockAlerts: Alert[] = [];
