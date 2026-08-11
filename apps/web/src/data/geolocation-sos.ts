export type SOSStatus =
  | "active"
  | "acknowledged"
  | "dispatched"
  | "escalated"
  | "dismissed";

export interface SOSEvent {
  id: string;
  agentId: string;
  agentName: string;
  site: string;
  latitude: number;
  longitude: number;
  triggeredAt: string;
  status: SOSStatus;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  dismissedAt?: string;
  dismissReason?: string;
  dismissNote?: string;
}

export interface ImmobilityAlert {
  id: string;
  agentId: string;
  agentName: string;
  site: string;
  latitude: number;
  longitude: number;
  lastMovement: string;
  durationMinutes: number;
}

export const mockActiveSOSEvents: SOSEvent[] = [];

export const mockSOSHistory: SOSEvent[] = [];

export const mockImmobilityAlerts: ImmobilityAlert[] = [];

export const DISMISS_REASONS = [
  "Fausse alerte",
  "Test de système",
  "Problème technique",
  "Agent confirme sécurité",
  "Autre",
] as const;

export type DismissReason = (typeof DISMISS_REASONS)[number];

export const SOS_STATUS_CONFIG: Record<
  SOSStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Actif",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  acknowledged: {
    label: "Acquitté",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  dispatched: {
    label: "Secours envoyé",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  escalated: {
    label: "Escaladé",
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  dismissed: {
    label: "Clôturé",
    className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  },
};
