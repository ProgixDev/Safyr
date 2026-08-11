import type { GeolocationAgent } from "./geolocation-agents";
import type { GeoZone } from "./geolocation-zones";
import { isPointInZone, distanceToZone } from "./geolocation-zones";

// ── Types ──────────────────────────────────────────────────────────

export type PresenceStatus = "present" | "late" | "absent" | "off-zone";

export interface ShiftAssignment {
  id: string;
  agentId: string;
  agentName: string;
  siteName: string;
  zoneId: string;
  shiftStart: string; // HH:mm
  shiftEnd: string; // HH:mm
  date: string; // YYYY-MM-DD
}

export interface PresenceRecord extends ShiftAssignment {
  status: PresenceStatus;
  lastSeenAt: string | null;
  lastLatitude: number | null;
  lastLongitude: number | null;
  distanceFromZone: number | null;
  anomalies: string[];
  plannedDurationMinutes: number;
  actualStart: string | null; // HH:mm
  actualEnd: string | null; // HH:mm
  actualDurationMinutes: number | null;
  deltaMinutes: number | null; // actual - planned (positive = overtime)
}

// ── Cumulative summary ────────────────────────────────────────────

export interface AgentCumulativeSummary {
  agentId: string;
  agentName: string;
  totalPlannedMinutes: number;
  totalActualMinutes: number;
  totalDeltaMinutes: number;
  daysWorked: number;
}

// ── Status config ──────────────────────────────────────────────────

type PresenceBadgeVariant = "success" | "warning" | "error";

export const PRESENCE_STATUS_CONFIG: Record<
  PresenceStatus,
  {
    label: string;
    dotClass: string;
    badgeVariant: PresenceBadgeVariant;
    badgeClassName?: string;
    avatarClass: string;
    ringClass: string;
    color: string;
  }
> = {
  present: {
    label: "Présent",
    dotClass: "bg-emerald-500",
    badgeVariant: "success",
    avatarClass: "bg-emerald-500/20 text-emerald-400",
    ringClass: "ring-emerald-500/50",
    color: "#10b981",
  },
  late: {
    label: "En retard",
    dotClass: "bg-yellow-500",
    badgeVariant: "warning",
    avatarClass: "bg-yellow-500/20 text-yellow-400",
    ringClass: "ring-yellow-500/50",
    color: "#eab308",
  },
  absent: {
    label: "Absent",
    dotClass: "bg-red-500",
    badgeVariant: "error",
    avatarClass: "bg-red-500/20 text-red-400",
    ringClass: "ring-red-500/50",
    color: "#ef4444",
  },
  "off-zone": {
    label: "Hors zone",
    dotClass: "bg-orange-500",
    badgeVariant: "warning",
    badgeClassName: "border-orange-500/30 bg-orange-500/10 text-orange-400",
    avatarClass: "bg-orange-500/20 text-orange-400",
    ringClass: "ring-orange-500/50",
    color: "#f97316",
  },
};

export const PRESENCE_STATUSES: PresenceStatus[] = [];

// ── Hour helpers ───────────────────────────────────────────────────

export function formatDuration(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

export function computeDeltaColor(deltaMinutes: number): string {
  const abs = Math.abs(deltaMinutes);
  if (abs < 15) return "text-emerald-400";
  if (abs < 30) return "text-amber-400";
  return "text-red-400";
}

// ── Mock shift data ────────────────────────────────────────────────

function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getMockShiftAssignments(
  targetDate?: string,
): ShiftAssignment[] {
  const date = targetDate ?? localDateStr();
  return [
    {
      id: "shift-1",
      agentId: "1",
      agentName: "Jean Dupont",
      siteName: "Centre Commercial Rosny 2",
      zoneId: "zone-1",
      shiftStart: "06:00",
      shiftEnd: "14:00",
      date,
    },
    {
      id: "shift-2",
      agentId: "2",
      agentName: "Marie Martin",
      siteName: "Siège Social La Défense",
      zoneId: "zone-2",
      shiftStart: "07:00",
      shiftEnd: "15:00",
      date,
    },
    {
      id: "shift-3",
      agentId: "3",
      agentName: "Pierre Bernard",
      siteName: "Entrepôt Logistique Gennevilliers",
      zoneId: "zone-3",
      shiftStart: "06:00",
      shiftEnd: "14:00",
      date,
    },
    {
      id: "shift-4",
      agentId: "4",
      agentName: "Sophie Dubois",
      siteName: "Entrepôt Logistique Gennevilliers",
      zoneId: "zone-3",
      shiftStart: "06:00",
      shiftEnd: "14:00",
      date,
    },
    {
      id: "shift-5",
      agentId: "5",
      agentName: "Lucas Moreau",
      siteName: "Centre Commercial Rosny 2",
      zoneId: "zone-1",
      shiftStart: "05:00",
      shiftEnd: "13:00",
      date,
    },
    {
      id: "shift-6",
      agentId: "6",
      agentName: "Camille Leroy",
      siteName: "Siège Social La Défense",
      zoneId: "zone-2",
      shiftStart: "08:00",
      shiftEnd: "16:00",
      date,
    },
    {
      id: "shift-7",
      agentId: "1",
      agentName: "Jean Dupont",
      siteName: "Centre Commercial Rosny 2",
      zoneId: "zone-1",
      shiftStart: "18:00",
      shiftEnd: "02:00",
      date,
    },
    {
      id: "shift-8",
      agentId: "3",
      agentName: "Pierre Bernard",
      siteName: "Entrepôt Logistique Gennevilliers",
      zoneId: "zone-3",
      shiftStart: "18:00",
      shiftEnd: "02:00",
      date,
    },
  ];
}

export function getMockShiftAssignmentsForPeriod(
  startDate: string,
  endDate: string,
): ShiftAssignment[] {
  const result: ShiftAssignment[] = [];
  const d = new Date(startDate);
  const end = new Date(endDate);
  let idx = 0;
  while (d <= end) {
    const dateStr = localDateStr(d);
    const dayShifts = getMockShiftAssignments(dateStr).map((s) => ({
      ...s,
      id: `${s.id}-${dateStr}-${idx++}`,
    }));
    result.push(...dayShifts);
    d.setDate(d.getDate() + 1);
  }
  return result;
}

// ── Presence computation ───────────────────────────────────────────

const LATE_TOLERANCE_MIN = 15;

function parseShiftTime(date: string, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

function toHHmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function deterministicOffset(seed: string, range: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffff;
  }
  return hash % range;
}

function computeMockActualHours(
  shift: ShiftAssignment,
  status: PresenceStatus,
  shiftStart: Date,
  shiftEnd: Date,
): Pick<
  PresenceRecord,
  "actualStart" | "actualEnd" | "actualDurationMinutes" | "deltaMinutes"
> {
  const plannedDurationMinutes = Math.round(
    (shiftEnd.getTime() - shiftStart.getTime()) / 60000,
  );

  if (status === "absent") {
    return {
      actualStart: null,
      actualEnd: null,
      actualDurationMinutes: null,
      deltaMinutes: null,
    };
  }

  const seed = `${shift.agentId}-${shift.date}-${shift.shiftStart}`;
  let startOffsetMin: number;
  let endOffsetMin: number;

  if (status === "late") {
    // Arrive 15–45 min after shift start, leave roughly on time
    startOffsetMin = 15 + deterministicOffset(seed + "ls", 31);
    endOffsetMin = deterministicOffset(seed + "le", 11) - 5;
  } else {
    // present / off-zone: small variation around scheduled times
    startOffsetMin = deterministicOffset(seed + "ps", 11) - 5;
    endOffsetMin = deterministicOffset(seed + "pe", 21) - 10;
  }

  const actualStartDate = new Date(
    shiftStart.getTime() + startOffsetMin * 60000,
  );
  const actualEndDate = new Date(shiftEnd.getTime() + endOffsetMin * 60000);
  const actualDurationMinutes = Math.round(
    (actualEndDate.getTime() - actualStartDate.getTime()) / 60000,
  );
  const deltaMinutes = actualDurationMinutes - plannedDurationMinutes;

  return {
    actualStart: toHHmm(actualStartDate),
    actualEnd: toHHmm(actualEndDate),
    actualDurationMinutes,
    deltaMinutes,
  };
}

export function computePresenceRecords(
  shifts: ShiftAssignment[],
  agents: GeolocationAgent[],
  zones: GeoZone[],
  referenceTime?: Date,
): PresenceRecord[] {
  const now = referenceTime ?? new Date();

  return shifts.map((shift) => {
    const agent = agents.find((a) => a.id === shift.agentId);
    const zone = zones.find((z) => z.id === shift.zoneId);

    const shiftStart = parseShiftTime(shift.date, shift.shiftStart);
    const shiftEnd = parseShiftTime(shift.date, shift.shiftEnd);
    // Handle overnight shifts
    if (shiftEnd <= shiftStart) shiftEnd.setDate(shiftEnd.getDate() + 1);

    const isActive = now >= shiftStart && now <= shiftEnd;
    const hasNotStarted = now < shiftStart;

    const plannedDurationMinutes = Math.round(
      (shiftEnd.getTime() - shiftStart.getTime()) / 60000,
    );

    let status: PresenceStatus = "present";
    const lastSeenAt = agent?.lastUpdate ?? null;
    const lastLatitude = agent?.latitude ?? null;
    const lastLongitude = agent?.longitude ?? null;
    let distanceFromZone: number | null = null;
    const anomalies: string[] = [];

    if (hasNotStarted) {
      // Pre-shift neutral state — no anomalies
    } else if (!agent) {
      status = "absent";
      anomalies.push("Agent introuvable dans le système");
    } else if (agent.status === "Hors ligne" && isActive) {
      status = "absent";
      const offlineMinutes = Math.round(
        (now.getTime() - new Date(agent.lastUpdate).getTime()) / 60000,
      );
      anomalies.push(`Aucun signal GPS depuis ${offlineMinutes} min`);
    } else if (zone) {
      const agentPoint: [number, number] = [agent.longitude, agent.latitude];
      const inZone = isPointInZone(agentPoint, zone.shape);

      if (inZone) {
        const agentLastUpdate = new Date(agent.lastUpdate);
        const lateThreshold = new Date(
          shiftStart.getTime() + LATE_TOLERANCE_MIN * 60000,
        );
        if (isActive && agentLastUpdate.getTime() > lateThreshold.getTime()) {
          const lateMinutes = Math.round(
            (agentLastUpdate.getTime() - shiftStart.getTime()) / 60000,
          );
          status = "late";
          anomalies.push(`Retard de ${lateMinutes} min`);
        }
      } else {
        status = "off-zone";
        const dist = Math.round(distanceToZone(agentPoint, zone.shape));
        distanceFromZone = dist;
        anomalies.push(`GPS hors zone assignée (${dist} m)`);
      }
    }

    const actualHours = computeMockActualHours(
      shift,
      status,
      shiftStart,
      shiftEnd,
    );

    return {
      ...shift,
      status,
      lastSeenAt,
      lastLatitude,
      lastLongitude,
      distanceFromZone,
      anomalies,
      plannedDurationMinutes,
      ...actualHours,
    };
  });
}

export function computeCumulativeSummary(
  records: PresenceRecord[],
): AgentCumulativeSummary[] {
  const map = new Map<string, AgentCumulativeSummary>();
  const datesWorked = new Map<string, Set<string>>();

  for (const r of records) {
    if (!map.has(r.agentId)) {
      map.set(r.agentId, {
        agentId: r.agentId,
        agentName: r.agentName,
        totalPlannedMinutes: 0,
        totalActualMinutes: 0,
        totalDeltaMinutes: 0,
        daysWorked: 0,
      });
      datesWorked.set(r.agentId, new Set());
    }
    const entry = map.get(r.agentId)!;
    entry.totalPlannedMinutes += r.plannedDurationMinutes;
    if (r.actualDurationMinutes !== null) {
      entry.totalActualMinutes += r.actualDurationMinutes;
      datesWorked.get(r.agentId)!.add(r.date);
    }
  }

  for (const [agentId, entry] of map.entries()) {
    entry.totalDeltaMinutes =
      entry.totalActualMinutes - entry.totalPlannedMinutes;
    entry.daysWorked = datesWorked.get(agentId)!.size;
  }

  return Array.from(map.values()).sort((a, b) =>
    a.agentName.localeCompare(b.agentName, "fr"),
  );
}
