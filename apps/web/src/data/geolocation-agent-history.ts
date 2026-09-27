import type { GeolocationAgent } from "./geolocation-agents";
import { mockGeolocationAgents } from "./geolocation-agents";
import { flatEarthDistance } from "./geolocation-zones";

// ── Types ────────────────────────────────────────────────────────────

export interface HistoricalPosition {
  id: string;
  agentId: string;
  timestamp: string; // ISO datetime
  latitude: number;
  longitude: number;
  speed: number; // km/h
  status: GeolocationAgent["status"];
}

export interface AgentDayHistory {
  agentId: string;
  agentName: string;
  date: string; // YYYY-MM-DD
  positions: HistoricalPosition[];
  totalDistanceMeters: number;
  totalDurationMinutes: number;
}

// ── Utilities ────────────────────────────────────────────────────────

/** Split positions into consecutive segments by status */
export function segmentTrailByStatus(
  positions: HistoricalPosition[],
): { status: GeolocationAgent["status"]; positions: HistoricalPosition[] }[] {
  if (positions.length === 0) return [];

  const segments: {
    status: GeolocationAgent["status"];
    positions: HistoricalPosition[];
  }[] = [];
  let current: (typeof segments)[0] = {
    status: positions[0].status,
    positions: [positions[0]],
  };

  for (let i = 1; i < positions.length; i++) {
    if (positions[i].status === current.status) {
      current.positions.push(positions[i]);
    } else {
      // Bridge: duplicate boundary point so segments connect visually
      segments.push(current);
      current = {
        status: positions[i].status,
        positions: [positions[i - 1], positions[i]],
      };
    }
  }
  segments.push(current);
  return segments;
}

/** Pre-compute cumulative distances for a position array (compute once, reuse per tick) */
export function computeCumulativeDistances(
  positions: HistoricalPosition[],
): number[] {
  const dists: number[] = [0];
  for (let i = 1; i < positions.length; i++) {
    dists.push(
      dists[i - 1] +
        flatEarthDistance(
          [positions[i - 1].longitude, positions[i - 1].latitude],
          [positions[i].longitude, positions[i].latitude],
        ),
    );
  }
  return dists;
}

/** Interpolate position along a trail at progress 0–1 */
export function interpolateHistoryPosition(
  positions: HistoricalPosition[],
  cumulativeDistances: number[],
  progress: number,
): { latitude: number; longitude: number; timestamp: string } | null {
  if (positions.length === 0) return null;
  if (positions.length === 1 || progress <= 0) {
    const p = positions[0];
    return {
      latitude: p.latitude,
      longitude: p.longitude,
      timestamp: p.timestamp,
    };
  }
  if (progress >= 1) {
    const p = positions[positions.length - 1];
    return {
      latitude: p.latitude,
      longitude: p.longitude,
      timestamp: p.timestamp,
    };
  }

  const totalDist = cumulativeDistances[cumulativeDistances.length - 1];
  if (totalDist === 0) {
    const p = positions[0];
    return {
      latitude: p.latitude,
      longitude: p.longitude,
      timestamp: p.timestamp,
    };
  }

  const targetDist = progress * totalDist;
  for (let i = 1; i < cumulativeDistances.length; i++) {
    if (cumulativeDistances[i] >= targetDist) {
      const segLen = cumulativeDistances[i] - cumulativeDistances[i - 1];
      const t =
        segLen > 0 ? (targetDist - cumulativeDistances[i - 1]) / segLen : 0;
      const a = positions[i - 1];
      const b = positions[i];
      return {
        latitude: a.latitude + (b.latitude - a.latitude) * t,
        longitude: a.longitude + (b.longitude - a.longitude) * t,
        timestamp: new Date(
          new Date(a.timestamp).getTime() +
            (new Date(b.timestamp).getTime() -
              new Date(a.timestamp).getTime()) *
              t,
        ).toISOString(),
      };
    }
  }

  const p = positions[positions.length - 1];
  return {
    latitude: p.latitude,
    longitude: p.longitude,
    timestamp: p.timestamp,
  };
}

/** Build GeoJSON FeatureCollection for color-coded trail segments */
export function buildHistoryTrailGeoJson(
  positions: HistoricalPosition[],
): GeoJSON.FeatureCollection {
  const STATUS_COLORS: Record<GeolocationAgent["status"], string> = {
    "En poste": "#22c55e",
    "En déplacement": "#357AB7",
    "Hors ligne": "#6b7280",
  };

  const segments = segmentTrailByStatus(positions);
  const features: GeoJSON.Feature[] = segments
    .filter((seg) => seg.positions.length >= 2)
    .map((seg, i) => ({
      type: "Feature" as const,
      properties: {
        color: STATUS_COLORS[seg.status],
        dashed: seg.status === "Hors ligne" ? 1 : 0,
        segmentIndex: i,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: seg.positions.map((p) => [p.longitude, p.latitude]),
      },
    }));

  return { type: "FeatureCollection" as const, features };
}

/** Compute total distance in meters (skip offline-to-offline gaps) */
export function computeTrailDistance(positions: HistoricalPosition[]): number {
  let total = 0;
  for (let i = 1; i < positions.length; i++) {
    if (
      positions[i].status === "Hors ligne" &&
      positions[i - 1].status === "Hors ligne"
    )
      continue;
    total += flatEarthDistance(
      [positions[i - 1].longitude, positions[i - 1].latitude],
      [positions[i].longitude, positions[i].latitude],
    );
  }
  return total;
}

// ── Mock Data Generation ─────────────────────────────────────────────

function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface StatusBlock {
  status: GeolocationAgent["status"];
  durationMinutes: number;
  pointCount: number;
}

function generateDaySchedule(rand: () => number): StatusBlock[] {
  const blocks: StatusBlock[] = [
    { status: "En déplacement", durationMinutes: 15, pointCount: 3 },
    { status: "En poste", durationMinutes: 90, pointCount: 5 },
    { status: "En déplacement", durationMinutes: 25, pointCount: 4 },
    { status: "En poste", durationMinutes: 60, pointCount: 3 },
    { status: "Hors ligne", durationMinutes: 45, pointCount: 2 },
    { status: "En poste", durationMinutes: 80, pointCount: 4 },
    { status: "En déplacement", durationMinutes: 20, pointCount: 3 },
    { status: "En poste", durationMinutes: 70, pointCount: 4 },
    { status: "En déplacement", durationMinutes: 10, pointCount: 2 },
  ];

  for (const block of blocks) {
    block.durationMinutes = Math.round(
      block.durationMinutes * (0.8 + rand() * 0.4),
    );
  }
  return blocks;
}

function generateAgentDayHistory(
  agent: GeolocationAgent,
  date: string,
): AgentDayHistory {
  const rand = createSeededRandom(
    agent.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 1000 +
      date.split("").reduce((a, c) => a + c.charCodeAt(0), 0),
  );

  const blocks = generateDaySchedule(rand);
  const positions: HistoricalPosition[] = [];

  const dayStart = new Date(`${date}T07:30:00`);
  dayStart.setMinutes(dayStart.getMinutes() + Math.floor(rand() * 30));
  let currentTime = dayStart.getTime();
  let currentLat = agent.latitude;
  let currentLng = agent.longitude;
  let posIndex = 0;

  for (const block of blocks) {
    const intervalMs =
      (block.durationMinutes * 60 * 1000) / Math.max(block.pointCount - 1, 1);

    for (let i = 0; i < block.pointCount; i++) {
      if (block.status === "En déplacement") {
        currentLat += (rand() - 0.4) * 0.003;
        currentLng += (rand() - 0.4) * 0.004;
      } else if (block.status === "En poste") {
        currentLat += (rand() - 0.5) * 0.0002;
        currentLng += (rand() - 0.5) * 0.0002;
      }

      const speed =
        block.status === "En déplacement"
          ? Math.round(5 + rand() * 30)
          : block.status === "En poste"
            ? Math.round(rand() * 2)
            : 0;

      positions.push({
        id: `${agent.id}-${date}-${posIndex}`,
        agentId: agent.id,
        timestamp: new Date(currentTime).toISOString(),
        latitude: currentLat,
        longitude: currentLng,
        speed,
        status: block.status,
      });

      posIndex++;
      currentTime += intervalMs;
    }
  }

  const totalDistanceMeters = computeTrailDistance(positions);
  const totalDurationMinutes =
    positions.length >= 2
      ? Math.round(
          (new Date(positions[positions.length - 1].timestamp).getTime() -
            new Date(positions[0].timestamp).getTime()) /
            60000,
        )
      : 0;

  return {
    agentId: agent.id,
    agentName: agent.name,
    date,
    positions,
    totalDistanceMeters,
    totalDurationMinutes,
  };
}

const today = new Date().toISOString().slice(0, 10);

export const mockAgentDayHistories: AgentDayHistory[] =
  mockGeolocationAgents.map((agent) => generateAgentDayHistory(agent, today));

/** Look up a history by agentId and date */
export function getAgentDayHistory(
  agentId: string,
  date: string,
): AgentDayHistory | undefined {
  const existing = mockAgentDayHistories.find(
    (h) => h.agentId === agentId && h.date === date,
  );
  if (existing) return existing;

  const agent = mockGeolocationAgents.find((a) => a.id === agentId);
  if (!agent) return undefined;
  return generateAgentDayHistory(agent, date);
}
