import { flatEarthDistance } from "@/data/geolocation-zones";

// ── Types ──────────────────────────────────────────────────────────

export type CheckpointType = "GPS" | "QR" | "NFC";

export type PatrolFrequency =
  | "Quotidienne"
  | "Bi-quotidienne"
  | "Nocturne"
  | "Hebdomadaire";

export type PatrolStatus = "en-cours" | "terminee" | "incomplete" | "planifiee";

export interface PatrolCheckpoint {
  id: string;
  name: string;
  coords: [number, number]; // [lng, lat]
  type: CheckpointType;
  expectedMinutes: number;
  toleranceMinutes: number;
  order: number;
}

export interface PatrolRoute {
  id: string;
  name: string;
  site: string;
  checkpoints: PatrolCheckpoint[];
  estimatedDurationMinutes: number;
  frequency: PatrolFrequency;
  distanceMeters: number;
  createdAt: string; // ISO
}

export interface CheckpointScan {
  checkpointId: string;
  scannedAt: string | null;
  status: "validated" | "missed" | "pending";
  comment?: string;
  incidentDescription?: string;
  mediaUrls?: string[];
}

export interface PatrolExecution {
  id: string;
  routeId: string;
  routeName: string;
  agentId: string;
  agentName: string;
  site: string;
  client?: string;
  status: PatrolStatus;
  startedAt: string; // ISO
  endedAt: string | null;
  checkpointScans: CheckpointScan[];
  gpsTrail: { coords: [number, number]; timestamp: string }[];
  completionRate: number; // 0-100
  actualDurationMinutes: number | null;
  actualDistanceMeters: number | null;
}

// ── Config ─────────────────────────────────────────────────────────

type PatrolBadgeVariant = "cyan" | "success" | "warning" | "error" | "info";

export const PATROL_STATUS_CONFIG: Record<
  PatrolStatus,
  { label: string; badgeVariant: PatrolBadgeVariant; dotClass: string }
> = {
  "en-cours": {
    label: "En cours",
    badgeVariant: "cyan",
    dotClass: "bg-cyan-500",
  },
  terminee: {
    label: "Terminée",
    badgeVariant: "success",
    dotClass: "bg-emerald-500",
  },
  incomplete: {
    label: "Incomplète",
    badgeVariant: "warning",
    dotClass: "bg-yellow-500",
  },
  planifiee: {
    label: "Planifiée",
    badgeVariant: "info",
    dotClass: "bg-blue-400",
  },
};

export const CHECKPOINT_TYPE_CONFIG: Record<
  CheckpointType,
  { label: string; color: string }
> = {
  GPS: { label: "GPS", color: "#22d3ee" },
  QR: { label: "QR Code", color: "#a855f7" },
  NFC: { label: "NFC", color: "#f59e0b" },
};

export const PATROL_FREQUENCIES: PatrolFrequency[] = [
  "Quotidienne",
  "Bi-quotidienne",
  "Nocturne",
  "Hebdomadaire",
];

// ── Utility functions ──────────────────────────────────────────────

/** Sum of flat-earth distances between consecutive checkpoints */
export function computeRouteDistance(checkpoints: PatrolCheckpoint[]): number {
  let total = 0;
  for (let i = 0; i < checkpoints.length - 1; i++) {
    total += flatEarthDistance(
      checkpoints[i].coords,
      checkpoints[i + 1].coords,
    );
  }
  return total;
}

/** Filter executions that are currently active */
export function getActivePatrols(
  executions: PatrolExecution[],
): PatrolExecution[] {
  return executions.filter((e) => e.status === "en-cours");
}

/** Filter executions that are completed or incomplete */
export function getPatrolHistory(
  executions: PatrolExecution[],
): PatrolExecution[] {
  return executions.filter(
    (e) => e.status === "terminee" || e.status === "incomplete",
  );
}

/** Returns true if a checkpoint scan represents an incident */
export function checkpointHasIncident(scan: CheckpointScan): boolean {
  return (
    scan.status === "missed" && !!(scan.incidentDescription ?? scan.comment)
  );
}

/** Returns true if a patrol execution contains at least one incident checkpoint */
export function patrolHasIncident(exec: PatrolExecution): boolean {
  return exec.checkpointScans.some(checkpointHasIncident);
}

/** Returns display-level status including "incident" concept */
export function getPatrolDisplayStatus(
  exec: PatrolExecution,
): "complete" | "incomplete" | "incident" {
  if (patrolHasIncident(exec)) return "incident";
  if (exec.status === "terminee") return "complete";
  return "incomplete";
}

/** Lookup a route by ID */
export function getRouteById(
  routes: PatrolRoute[],
  id: string,
): PatrolRoute | undefined {
  return routes.find((r) => r.id === id);
}

/**
 * Generate a mock GPS trail by interpolating between checkpoint coordinates
 * with slight random deviation to simulate realistic movement.
 */
export function generateMockTrail(
  checkpoints: PatrolCheckpoint[],
  options?: {
    pointsPerSegment?: number;
    deviationMeters?: number;
    startTime?: Date;
    intervalSeconds?: number;
  },
): { coords: [number, number]; timestamp: string }[] {
  const {
    pointsPerSegment = 5,
    deviationMeters = 10,
    startTime = new Date(),
    intervalSeconds = 30,
  } = options ?? {};

  const trail: { coords: [number, number]; timestamp: string }[] = [];
  let timeOffset = 0;

  // Seeded pseudo-random for deterministic output
  let seed = 42;
  function seededRandom(): number {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (let i = 0; i < checkpoints.length - 1; i++) {
    const [lng1, lat1] = checkpoints[i].coords;
    const [lng2, lat2] = checkpoints[i + 1].coords;

    for (let j = 0; j <= pointsPerSegment; j++) {
      // Skip first point of subsequent segments to avoid duplicates
      if (i > 0 && j === 0) continue;

      const t = j / pointsPerSegment;
      const baseLng = lng1 + (lng2 - lng1) * t;
      const baseLat = lat1 + (lat2 - lat1) * t;

      // Add random deviation (convert meters to degrees)
      const devLat = ((seededRandom() - 0.5) * 2 * deviationMeters) / 111320;
      const devLng =
        ((seededRandom() - 0.5) * 2 * deviationMeters) /
        (111320 * Math.cos((baseLat * Math.PI) / 180));

      const timestamp = new Date(
        startTime.getTime() + timeOffset * 1000,
      ).toISOString();

      trail.push({
        coords: [baseLng + devLng, baseLat + devLat],
        timestamp,
      });

      timeOffset += intervalSeconds;
    }
  }

  return trail;
}

// ── Mock Data — Patrol Routes ──────────────────────────────────────

const rosny2Checkpoints: PatrolCheckpoint[] = [
  {
    id: "cp-r1-1",
    name: "Entrée Nord",
    coords: [2.3502, 48.8576],
    type: "QR",
    expectedMinutes: 0,
    toleranceMinutes: 2,
    order: 1,
  },
  {
    id: "cp-r1-2",
    name: "Parking P2",
    coords: [2.3535, 48.858],
    type: "NFC",
    expectedMinutes: 8,
    toleranceMinutes: 3,
    order: 2,
  },
  {
    id: "cp-r1-3",
    name: "Quai de livraison",
    coords: [2.3548, 48.856],
    type: "GPS",
    expectedMinutes: 16,
    toleranceMinutes: 2,
    order: 3,
  },
  {
    id: "cp-r1-4",
    name: "Sortie Sud",
    coords: [2.354, 48.8548],
    type: "QR",
    expectedMinutes: 24,
    toleranceMinutes: 3,
    order: 4,
  },
  {
    id: "cp-r1-5",
    name: "Zone technique",
    coords: [2.3515, 48.855],
    type: "NFC",
    expectedMinutes: 32,
    toleranceMinutes: 2,
    order: 5,
  },
  {
    id: "cp-r1-6",
    name: "Retour Entrée Nord",
    coords: [2.3502, 48.8576],
    type: "QR",
    expectedMinutes: 42,
    toleranceMinutes: 3,
    order: 6,
  },
];

const defenseCheckpoints: PatrolCheckpoint[] = [
  {
    id: "cp-r2-1",
    name: "Accueil Tour A",
    coords: [2.2345, 48.893],
    type: "NFC",
    expectedMinutes: 0,
    toleranceMinutes: 2,
    order: 1,
  },
  {
    id: "cp-r2-2",
    name: "Sous-sol Parking",
    coords: [2.237, 48.8925],
    type: "QR",
    expectedMinutes: 7,
    toleranceMinutes: 3,
    order: 2,
  },
  {
    id: "cp-r2-3",
    name: "Esplanade Ouest",
    coords: [2.2385, 48.8935],
    type: "GPS",
    expectedMinutes: 15,
    toleranceMinutes: 2,
    order: 3,
  },
  {
    id: "cp-r2-4",
    name: "Terrasse Niveau 3",
    coords: [2.236, 48.894],
    type: "NFC",
    expectedMinutes: 24,
    toleranceMinutes: 3,
    order: 4,
  },
  {
    id: "cp-r2-5",
    name: "Retour Accueil",
    coords: [2.2345, 48.893],
    type: "NFC",
    expectedMinutes: 33,
    toleranceMinutes: 2,
    order: 5,
  },
];

const gennevilliersCheckpoints: PatrolCheckpoint[] = [
  {
    id: "cp-r3-1",
    name: "Portail Principal",
    coords: [2.296, 48.934],
    type: "QR",
    expectedMinutes: 0,
    toleranceMinutes: 2,
    order: 1,
  },
  {
    id: "cp-r3-2",
    name: "Hangar A",
    coords: [2.299, 48.9338],
    type: "NFC",
    expectedMinutes: 6,
    toleranceMinutes: 3,
    order: 2,
  },
  {
    id: "cp-r3-3",
    name: "Zone de stockage B",
    coords: [2.2995, 48.9325],
    type: "GPS",
    expectedMinutes: 14,
    toleranceMinutes: 2,
    order: 3,
  },
  {
    id: "cp-r3-4",
    name: "Retour Portail",
    coords: [2.296, 48.934],
    type: "QR",
    expectedMinutes: 22,
    toleranceMinutes: 3,
    order: 4,
  },
];

const serveursCheckpoints: PatrolCheckpoint[] = [
  {
    id: "cp-r4-1",
    name: "Sas d'entrée",
    coords: [2.2355, 48.892],
    type: "NFC",
    expectedMinutes: 0,
    toleranceMinutes: 1,
    order: 1,
  },
  {
    id: "cp-r4-2",
    name: "Baie Serveurs A",
    coords: [2.2362, 48.8917],
    type: "NFC",
    expectedMinutes: 5,
    toleranceMinutes: 2,
    order: 2,
  },
  {
    id: "cp-r4-3",
    name: "Baie Serveurs B",
    coords: [2.2368, 48.8915],
    type: "NFC",
    expectedMinutes: 12,
    toleranceMinutes: 2,
    order: 3,
  },
];

export const mockPatrolRoutes: PatrolRoute[] = [];

// ── Mock Data — Patrol Executions ──────────────────────────────────

const now = new Date();
const today = now.toISOString().slice(0, 10);

function isoAt(hoursAgo: number, minutesAgo = 0): string {
  return new Date(
    now.getTime() - (hoursAgo * 60 + minutesAgo) * 60000,
  ).toISOString();
}

export const mockPatrolExecutions: PatrolExecution[] = [];
