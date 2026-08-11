// ── Types ──────────────────────────────────────────────────────────

export type KPIPeriod = "today" | "week" | "month";

export type SiteFilter = (typeof SITES)[number] | "all";

export interface SecurityKPIs {
  patrolsCompleted: number;
  patrolsPlanned: number;
  conformityRate: number; // 0-100
  zoneEvents: number;
  sosActive: number;
  sosResolved: number;
}

export interface OperationalKPIs {
  presenceRate: number; // 0-100
  tardinessRate: number; // 0-100
  avgInterventionMinutes: number;
  avgTravelMetersPerSite: number;
}

export interface HRAgentEntry {
  agentId: string;
  agentName: string;
  site: string;
  missionsCount: number;
  hoursWorked: number;
  incidentCount: number;
}

export interface HRKPIs {
  topAgents: HRAgentEntry[];
  absenceCount: number;
  sosHistoryCount: number;
  fatigueIndex: number; // 0-100
}

export interface TrendDataPoint {
  label: string;
  presences: number;
  absences: number;
}

export interface PatrolBySite {
  site: string;
  planned: number;
  actual: number;
}

export interface AgentStatusDistribution {
  status: string;
  count: number;
  color: string;
}

export interface ZoneActivity {
  zone: string;
  events: number;
  color: string;
}

export interface KPIData {
  security: SecurityKPIs;
  operational: OperationalKPIs;
  hr: HRKPIs;
  trendData: TrendDataPoint[];
  patrolsBySite: PatrolBySite[];
  agentStatusDistribution: AgentStatusDistribution[];
  zoneActivity: ZoneActivity[];
  trends: {
    patrolsDelta: number;
    conformityDelta: number;
    presenceDelta: number;
    tardinessDelta: number;
    interventionDelta: number;
    travelDelta: number;
  };
}

// ── Constants ─────────────────────────────────────────────────────

export const SITES: string[] = [];

const SITE_SHORT_NAMES: Record<(typeof SITES)[number], string> = {
  "Centre Commercial Rosny 2": "Rosny 2",
  "Siège Social La Défense": "La Défense",
  "Entrepôt Logistique Gennevilliers": "Gennevilliers",
};

const SITE_ZONES: Record<(typeof SITES)[number], string[]> = {
  "Centre Commercial Rosny 2": ["Zone Nord — Rosny 2"],
  "Siège Social La Défense": [
    "Zone Ouest — La Défense",
    "Zone Sensible — La Défense",
  ],
  "Entrepôt Logistique Gennevilliers": [
    "Zone Sud — Gennevilliers",
    "Zone Restreinte — Gennevilliers",
  ],
};

export const CHART_COLORS = {
  cyan: "#22d3ee",
  green: "#10b981",
  amber: "#f59e0b",
  purple: "#8b5cf6",
  red: "#ef4444",
  blue: "#3b82f6",
  pink: "#ec4899",
} as const;

export const PERIOD_OPTIONS: { value: KPIPeriod; label: string }[] = [];

// ── Helpers ───────────────────────────────────────────────────────

function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function periodMultiplier(period: KPIPeriod, week = 7, month = 30): number {
  return period === "today" ? 1 : period === "week" ? week : month;
}

function filterBySite<T>(
  items: T[],
  siteFilter: SiteFilter,
  getSite: (item: T) => string,
): T[] {
  if (siteFilter === "all") return items;
  const shortName = SITE_SHORT_NAMES[siteFilter];
  return items.filter((item) => getSite(item) === shortName);
}

// ── Data generation ───────────────────────────────────────────────

function generateTrendData(period: KPIPeriod): TrendDataPoint[] {
  const rand = createSeededRandom(
    period === "today" ? 101 : period === "week" ? 202 : 303,
  );

  if (period === "today") {
    return Array.from({ length: 15 }, (_, i) => {
      const hour = 6 + i;
      return {
        label: `${String(hour).padStart(2, "0")}h`,
        presences: Math.round(3 + rand() * 3),
        absences: Math.round(rand() * 2),
      };
    });
  }

  if (period === "week") {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    return days.map((label) => ({
      label,
      presences: Math.round(4 + rand() * 2),
      absences: Math.round(rand() * 2),
    }));
  }

  return ["Sem 1", "Sem 2", "Sem 3", "Sem 4"].map((label) => ({
    label,
    presences: Math.round(20 + rand() * 10),
    absences: Math.round(2 + rand() * 6),
  }));
}

function generatePatrolsBySite(
  period: KPIPeriod,
  siteFilter: SiteFilter,
): PatrolBySite[] {
  const rand = createSeededRandom(
    period === "today" ? 401 : period === "week" ? 402 : 403,
  );
  const multiplier = periodMultiplier(period);

  const all: PatrolBySite[] = [
    {
      site: "Rosny 2",
      planned: Math.round((3 + rand()) * multiplier),
      actual: Math.round((2 + rand() * 2) * multiplier),
    },
    {
      site: "La Défense",
      planned: Math.round((2 + rand()) * multiplier),
      actual: Math.round((1.5 + rand() * 1.5) * multiplier),
    },
    {
      site: "Gennevilliers",
      planned: Math.round((2 + rand()) * multiplier),
      actual: Math.round((1.5 + rand()) * multiplier),
    },
  ];

  return filterBySite(all, siteFilter, (p) => p.site);
}

function generateAgentStatusDistribution(
  siteFilter: SiteFilter,
): AgentStatusDistribution[] {
  if (siteFilter === "all") {
    return [
      { status: "En poste", count: 3, color: CHART_COLORS.green },
      { status: "En déplacement", count: 2, color: CHART_COLORS.blue },
      { status: "Hors ligne", count: 1, color: CHART_COLORS.red },
    ];
  }

  const siteCounts: Record<(typeof SITES)[number], [number, number, number]> = {
    "Centre Commercial Rosny 2": [1, 1, 0],
    "Siège Social La Défense": [1, 1, 0],
    "Entrepôt Logistique Gennevilliers": [1, 0, 1],
  };

  const [posted, moving, offline] = siteCounts[siteFilter] ?? [1, 1, 0];
  return [
    { status: "En poste", count: posted, color: CHART_COLORS.green },
    { status: "En déplacement", count: moving, color: CHART_COLORS.blue },
    { status: "Hors ligne", count: offline, color: CHART_COLORS.red },
  ];
}

function generateZoneActivity(
  period: KPIPeriod,
  siteFilter: SiteFilter,
): ZoneActivity[] {
  const rand = createSeededRandom(
    period === "today" ? 501 : period === "week" ? 502 : 503,
  );
  const multiplier = periodMultiplier(period, 5, 18);

  const allZones: ZoneActivity[] = [
    {
      zone: "Zone Nord — Rosny 2",
      events: Math.round((3 + rand() * 4) * multiplier),
      color: CHART_COLORS.cyan,
    },
    {
      zone: "Zone Ouest — La Défense",
      events: Math.round((2 + rand() * 3) * multiplier),
      color: CHART_COLORS.purple,
    },
    {
      zone: "Zone Sud — Gennevilliers",
      events: Math.round((1 + rand() * 3) * multiplier),
      color: CHART_COLORS.amber,
    },
    {
      zone: "Zone Sensible — La Défense",
      events: Math.round((2 + rand() * 5) * multiplier),
      color: CHART_COLORS.red,
    },
    {
      zone: "Zone Restreinte — Gennevilliers",
      events: Math.round((1 + rand() * 2) * multiplier),
      color: CHART_COLORS.pink,
    },
  ];

  if (siteFilter === "all") return allZones;
  const zoneNames = SITE_ZONES[siteFilter] ?? [];
  return allZones.filter((z) => zoneNames.includes(z.zone));
}

function generateTopAgents(
  period: KPIPeriod,
  siteFilter: SiteFilter,
): HRAgentEntry[] {
  const rand = createSeededRandom(
    period === "today" ? 601 : period === "week" ? 602 : 603,
  );
  const multiplier = periodMultiplier(period, 5, 20);

  const allAgents: HRAgentEntry[] = [
    {
      agentId: "1",
      agentName: "Jean Dupont",
      site: "Rosny 2",
      missionsCount: Math.round((3 + rand() * 2) * multiplier),
      hoursWorked: Math.round((8 + rand() * 2) * multiplier),
      incidentCount: Math.round(rand() * 2 * (multiplier / 5)),
    },
    {
      agentId: "5",
      agentName: "Lucas Moreau",
      site: "Rosny 2",
      missionsCount: Math.round((2 + rand() * 3) * multiplier),
      hoursWorked: Math.round((7 + rand() * 3) * multiplier),
      incidentCount: Math.round(rand() * (multiplier / 5)),
    },
    {
      agentId: "2",
      agentName: "Marie Martin",
      site: "La Défense",
      missionsCount: Math.round((2 + rand() * 2) * multiplier),
      hoursWorked: Math.round((7 + rand() * 2) * multiplier),
      incidentCount: Math.round(rand() * 1.5 * (multiplier / 5)),
    },
    {
      agentId: "6",
      agentName: "Camille Leroy",
      site: "La Défense",
      missionsCount: Math.round((2 + rand()) * multiplier),
      hoursWorked: Math.round((6 + rand() * 3) * multiplier),
      incidentCount: 0,
    },
    {
      agentId: "3",
      agentName: "Pierre Bernard",
      site: "Gennevilliers",
      missionsCount: Math.round((1.5 + rand() * 2) * multiplier),
      hoursWorked: Math.round((7 + rand() * 2) * multiplier),
      incidentCount: Math.round(rand() * (multiplier / 5)),
    },
  ];

  return filterBySite(allAgents, siteFilter, (a) => a.site)
    .sort((a, b) => b.missionsCount - a.missionsCount)
    .slice(0, 5);
}

// ── Main export ───────────────────────────────────────────────────

export function getKPIData(period: KPIPeriod, siteFilter: SiteFilter): KPIData {
  const rand = createSeededRandom(
    (period === "today" ? 1000 : period === "week" ? 2000 : 3000) +
      (siteFilter === "all" ? 0 : siteFilter.length * 7),
  );

  const multiplier = periodMultiplier(period);
  const siteScale = siteFilter === "all" ? 1 : 0.35;

  const patrolsPlanned = Math.round(8 * multiplier * siteScale);
  const patrolsCompleted = Math.round(patrolsPlanned * (0.75 + rand() * 0.2));

  const security: SecurityKPIs = {
    patrolsCompleted,
    patrolsPlanned,
    conformityRate: Math.round(
      (patrolsCompleted / Math.max(patrolsPlanned, 1)) * 100,
    ),
    zoneEvents: Math.round((5 + rand() * 10) * multiplier * siteScale),
    sosActive: Math.round(rand() * 2),
    sosResolved: Math.round((1 + rand() * 4) * multiplier * siteScale),
  };

  const operational: OperationalKPIs = {
    presenceRate: Math.round(82 + rand() * 15),
    tardinessRate: Math.round(3 + rand() * 12),
    avgInterventionMinutes: Math.round(4 + rand() * 8),
    avgTravelMetersPerSite: Math.round(800 + rand() * 1200),
  };

  const hr: HRKPIs = {
    topAgents: generateTopAgents(period, siteFilter),
    absenceCount: Math.round((1 + rand() * 3) * multiplier * siteScale),
    sosHistoryCount: Math.round((1 + rand() * 3) * multiplier * siteScale),
    fatigueIndex: Math.round(20 + rand() * 40),
  };

  const trends = {
    patrolsDelta: Math.round((rand() - 0.3) * 20),
    conformityDelta: Math.round((rand() - 0.4) * 10),
    presenceDelta: Math.round((rand() - 0.3) * 8),
    tardinessDelta: Math.round((rand() - 0.5) * 15),
    interventionDelta: Math.round((rand() - 0.5) * 12),
    travelDelta: Math.round((rand() - 0.5) * 10),
  };

  return {
    security,
    operational,
    hr,
    trendData: generateTrendData(period),
    patrolsBySite: generatePatrolsBySite(period, siteFilter),
    agentStatusDistribution: generateAgentStatusDistribution(siteFilter),
    zoneActivity: generateZoneActivity(period, siteFilter),
    trends,
  };
}
