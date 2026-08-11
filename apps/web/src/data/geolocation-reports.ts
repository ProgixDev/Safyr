// ── Types ──────────────────────────────────────────────────────────

export type ReportType =
  | "presences"
  | "rondes"
  | "deplacements"
  | "incidents"
  | "zones";

export const REPORT_TYPES: ReportType[] = [];

export const REPORT_TYPE_CONFIG: Record<
  ReportType,
  { label: string; description: string }
> = {
  presences: {
    label: "Présences géolocalisées",
    description: "Qui était où et quand",
  },
  rondes: {
    label: "Rondes & Interventions",
    description: "Itinéraires avec détails des points de contrôle",
  },
  deplacements: {
    label: "Déplacements",
    description: "Mouvements des agents et distances parcourues",
  },
  incidents: {
    label: "Incidents HSE",
    description: "Événements SOS, alertes d'immobilité",
  },
  zones: {
    label: "Activité zones",
    description: "Activité par zone géolocalisée",
  },
};

// ── Incident Enums ─────────────────────────────────────────────────

export type IncidentType =
  | "SOS"
  | "Immobilité"
  | "Hors zone"
  | "Batterie critique"
  | "Perte signal";

export type IncidentSeverity = "Critique" | "Élevé" | "Moyen" | "Faible";

// ── Interfaces ─────────────────────────────────────────────────────

export interface PresenceReportRow {
  id: string;
  agentName: string;
  site: string;
  zone: string;
  date: string;
  shiftStart: string;
  shiftEnd: string;
  arrivalTime: string | null;
  departureTime: string | null;
  durationMinutes: number;
  status: "Présent" | "En retard" | "Absent" | "Hors zone";
  anomalies: string[];
}

export interface RondeReportRow {
  id: string;
  routeName: string;
  agentName: string;
  site: string;
  date: string;
  startedAt: string;
  endedAt: string | null;
  status: "Terminée" | "Incomplète" | "En cours";
  checkpointsTotal: number;
  checkpointsScanned: number;
  completionRate: number;
  durationMinutes: number | null;
  distanceMeters: number | null;
}

export interface DeplacementSegment {
  from: string;
  to: string;
  distanceKm: number;
  durationMinutes: number;
}

export interface DeplacementReportRow {
  id: string;
  agentName: string;
  site: string;
  date: string;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  avgSpeedKmh: number;
  stationaryMinutes: number;
  movingMinutes: number;
  segments: DeplacementSegment[];
}

export interface IncidentReportRow {
  id: string;
  agentName: string;
  site: string;
  zone: string;
  date: string;
  time: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  resolved: boolean;
  resolvedAt: string | null;
  durationMinutes: number | null;
}

export interface ZoneActivityReportRow {
  id: string;
  zoneName: string;
  zoneType: string;
  site: string;
  date: string;
  totalEntries: number;
  totalExits: number;
  uniqueAgents: number;
  avgPresenceDurationMinutes: number;
  peakHour: string;
  alerts: number;
  occupancyRate: number;
}

// ── Constants ──────────────────────────────────────────────────────

const AGENTS: { name: string; site: string }[] = [
  { name: "Jean Dupont", site: "Centre Commercial Rosny 2" },
  { name: "Marie Martin", site: "Siège Social La Défense" },
  { name: "Pierre Bernard", site: "Entrepôt Logistique Gennevilliers" },
  { name: "Sophie Dubois", site: "Entrepôt Logistique Gennevilliers" },
  { name: "Lucas Moreau", site: "Centre Commercial Rosny 2" },
  { name: "Camille Leroy", site: "Siège Social La Défense" },
];

const ZONES: { name: string; site: string; type: string }[] = [
  {
    name: "Zone Nord — Rosny 2",
    site: "Centre Commercial Rosny 2",
    type: "Surveillance",
  },
  {
    name: "Périmètre La Défense",
    site: "Siège Social La Défense",
    type: "Périmètre",
  },
  {
    name: "Entrepôt Gennevilliers",
    site: "Entrepôt Logistique Gennevilliers",
    type: "Entrepôt",
  },
  {
    name: "Zone Restreinte Serveurs",
    site: "Siège Social La Défense",
    type: "Restreinte",
  },
  {
    name: "Checkpoint Ronde A",
    site: "Centre Commercial Rosny 2",
    type: "Checkpoint",
  },
];

const PATROL_ROUTES: { name: string; site: string; checkpoints: number }[] = [
  {
    name: "Ronde Extérieure Rosny 2",
    site: "Centre Commercial Rosny 2",
    checkpoints: 8,
  },
  {
    name: "Ronde Nocturne La Défense",
    site: "Siège Social La Défense",
    checkpoints: 6,
  },
  {
    name: "Ronde Entrepôt Gennevilliers",
    site: "Entrepôt Logistique Gennevilliers",
    checkpoints: 10,
  },
  {
    name: "Ronde Périmétrique Serveurs",
    site: "Siège Social La Défense",
    checkpoints: 4,
  },
];

const SITES = [
  "Centre Commercial Rosny 2",
  "Siège Social La Défense",
  "Entrepôt Logistique Gennevilliers",
];

const SHIFTS: { start: string; end: string }[] = [
  { start: "06:00", end: "14:00" },
  { start: "14:00", end: "22:00" },
  { start: "22:00", end: "06:00" },
];

const INCIDENT_DESCRIPTIONS: Record<IncidentType, string[]> = {
  SOS: [
    "Alerte SOS déclenchée manuellement",
    "Alerte SOS — agent en difficulté sur site",
    "Déclenchement SOS suite à confrontation avec intrus",
  ],
  Immobilité: [
    "Aucun mouvement détecté depuis 15 minutes",
    "Immobilité prolongée détectée — vérification en cours",
    "Alerte immobilité — agent ne répond pas",
  ],
  "Hors zone": [
    "Agent détecté hors périmètre autorisé",
    "Sortie de zone non autorisée détectée",
    "Position GPS en dehors du géo-fence assigné",
  ],
  "Batterie critique": [
    "Niveau de batterie critique (< 10%)",
    "Batterie faible — risque de perte de suivi",
    "Appareil en mode économie d'énergie — batterie < 5%",
  ],
  "Perte signal": [
    "Perte de signal GPS prolongée",
    "Signal GPS perdu depuis plus de 10 minutes",
    "Connexion réseau interrompue — dernière position connue enregistrée",
  ],
};

const INCIDENT_TYPES: IncidentType[] = [
  "SOS",
  "Immobilité",
  "Hors zone",
  "Batterie critique",
  "Perte signal",
];

const INCIDENT_SEVERITIES: IncidentSeverity[] = [
  "Critique",
  "Élevé",
  "Moyen",
  "Faible",
];

const SEGMENT_LOCATIONS = [
  "Entrée principale",
  "Parking souterrain",
  "Hall d'accueil",
  "Aile nord",
  "Aile sud",
  "Zone de livraison",
  "Poste de contrôle",
  "Salle serveurs",
  "Terrasse niveau 3",
  "Bureau sécurité",
];

// ── Seeded RNG ─────────────────────────────────────────────────────

function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// ── Helpers ────────────────────────────────────────────────────────

function eachDayInRange(start: string, end: string): string[] {
  const days: string[] = [];
  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");
  const current = new Date(startDate);

  while (current <= endDate) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function padTime(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function pickItem<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randomInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomFloat(
  min: number,
  max: number,
  rng: () => number,
  decimals: number = 1,
): number {
  return Number((rng() * (max - min) + min).toFixed(decimals));
}

// ── Generator: Présences ───────────────────────────────────────────

export function generatePresenceReport(
  startDate: string,
  endDate: string,
): PresenceReportRow[] {
  const rows: PresenceReportRow[] = [];
  const days = eachDayInRange(startDate, endDate);

  for (const day of days) {
    for (const agent of AGENTS) {
      const rng = createRng(hashString(`presence-${day}-${agent.name}`));
      const shift = pickItem(SHIFTS, rng);
      const roll = rng();

      let status: PresenceReportRow["status"];
      if (roll < 0.6) status = "Présent";
      else if (roll < 0.75) status = "En retard";
      else if (roll < 0.9) status = "Absent";
      else status = "Hors zone";

      const zone = pickItem(
        ZONES.filter((z) => z.site === agent.site),
        rng,
      );
      const zoneName = zone?.name ?? ZONES[0].name;

      let arrivalTime: string | null = null;
      let departureTime: string | null = null;
      let durationMinutes = 0;
      const anomalies: string[] = [];

      if (status === "Absent") {
        anomalies.push("Absence non justifiée");
      } else {
        const shiftStartH = parseInt(shift.start.split(":")[0]);
        const shiftEndH = parseInt(shift.end.split(":")[0]);

        if (status === "En retard") {
          const delayMin = randomInt(5, 45, rng);
          const arrH = shiftStartH + Math.floor(delayMin / 60);
          const arrM = delayMin % 60;
          arrivalTime = padTime(arrH % 24, arrM);
          anomalies.push(`Retard de ${delayMin} minutes`);
        } else {
          const earlyMin = randomInt(0, 10, rng);
          const arrH =
            shiftStartH === 0
              ? 23 - Math.floor(earlyMin / 60)
              : shiftStartH - Math.floor(earlyMin / 60);
          const arrM = earlyMin > 0 ? 60 - (earlyMin % 60) : 0;
          arrivalTime = padTime(Math.abs(arrH) % 24, arrM % 60);
        }

        const depOffsetMin = randomInt(-10, 15, rng);
        const depH = shiftEndH + Math.floor(depOffsetMin / 60);
        const depM = Math.abs(depOffsetMin % 60);
        departureTime = padTime(Math.abs(depH) % 24, depM);

        durationMinutes =
          status === "Hors zone"
            ? randomInt(120, 360, rng)
            : randomInt(420, 510, rng);

        if (status === "Hors zone") {
          anomalies.push("Sortie de zone détectée");
        }
      }

      rows.push({
        id: `pres-${day}-${agent.name.replace(/\s/g, "-").toLowerCase()}`,
        agentName: agent.name,
        site: agent.site,
        zone: zoneName,
        date: day,
        shiftStart: shift.start,
        shiftEnd: shift.end,
        arrivalTime,
        departureTime,
        durationMinutes,
        status,
        anomalies,
      });
    }
  }

  return rows;
}

// ── Generator: Rondes ──────────────────────────────────────────────

export function generateRondeReport(
  startDate: string,
  endDate: string,
): RondeReportRow[] {
  const rows: RondeReportRow[] = [];
  const days = eachDayInRange(startDate, endDate);

  for (const day of days) {
    const rng = createRng(hashString(`ronde-${day}`));
    const patrolCount = randomInt(2, 4, rng);

    for (let i = 0; i < patrolCount; i++) {
      const route = pickItem(PATROL_ROUTES, rng);
      const siteAgents = AGENTS.filter((a) => a.site === route.site);
      const agent =
        siteAgents.length > 0
          ? pickItem(siteAgents, rng)
          : pickItem(AGENTS, rng);

      const roll = rng();
      let status: RondeReportRow["status"];
      if (roll < 0.7) status = "Terminée";
      else if (roll < 0.9) status = "Incomplète";
      else status = "En cours";

      const startH = randomInt(0, 23, rng);
      const startM = randomInt(0, 59, rng);
      const startedAt = padTime(startH, startM);

      let endedAt: string | null = null;
      let durationMinutes: number | null = null;
      let distanceMeters: number | null = null;
      let checkpointsScanned = route.checkpoints;

      if (status === "Terminée") {
        durationMinutes = randomInt(25, 90, rng);
        const endTotalMin = startH * 60 + startM + durationMinutes;
        endedAt = padTime(Math.floor(endTotalMin / 60) % 24, endTotalMin % 60);
        distanceMeters = randomInt(800, 3500, rng);
      } else if (status === "Incomplète") {
        checkpointsScanned = randomInt(1, route.checkpoints - 1, rng);
        durationMinutes = randomInt(10, 50, rng);
        const endTotalMin = startH * 60 + startM + durationMinutes;
        endedAt = padTime(Math.floor(endTotalMin / 60) % 24, endTotalMin % 60);
        distanceMeters = randomInt(300, 2000, rng);
      } else {
        checkpointsScanned = randomInt(
          0,
          Math.floor(route.checkpoints / 2),
          rng,
        );
      }

      const completionRate = Math.round(
        (checkpointsScanned / route.checkpoints) * 100,
      );

      rows.push({
        id: `ronde-${day}-${i}`,
        routeName: route.name,
        agentName: agent.name,
        site: route.site,
        date: day,
        startedAt,
        endedAt,
        status,
        checkpointsTotal: route.checkpoints,
        checkpointsScanned,
        completionRate,
        durationMinutes,
        distanceMeters,
      });
    }
  }

  return rows;
}

// ── Generator: Déplacements ────────────────────────────────────────

export function generateDeplacementReport(
  startDate: string,
  endDate: string,
): DeplacementReportRow[] {
  const rows: DeplacementReportRow[] = [];
  const days = eachDayInRange(startDate, endDate);

  for (const day of days) {
    for (const agent of AGENTS) {
      const rng = createRng(hashString(`deplacement-${day}-${agent.name}`));

      const totalDistanceKm = randomFloat(2, 25, rng);
      const totalDurationMinutes = randomInt(30, 180, rng);
      const movingMinutes = randomInt(
        Math.floor(totalDurationMinutes * 0.4),
        Math.floor(totalDurationMinutes * 0.8),
        rng,
      );
      const stationaryMinutes = totalDurationMinutes - movingMinutes;
      const avgSpeedKmh = movingMinutes > 0 ? randomFloat(2, 8, rng) : 0;

      const segmentCount = randomInt(2, 5, rng);
      const segments: DeplacementSegment[] = [];

      for (let s = 0; s < segmentCount; s++) {
        const from = pickItem(SEGMENT_LOCATIONS, rng);
        let to = pickItem(SEGMENT_LOCATIONS, rng);
        while (to === from) {
          to = pickItem(SEGMENT_LOCATIONS, rng);
        }
        segments.push({
          from,
          to,
          distanceKm: randomFloat(0.2, 5, rng),
          durationMinutes: randomInt(5, 40, rng),
        });
      }

      rows.push({
        id: `dep-${day}-${agent.name.replace(/\s/g, "-").toLowerCase()}`,
        agentName: agent.name,
        site: agent.site,
        date: day,
        totalDistanceKm,
        totalDurationMinutes,
        avgSpeedKmh,
        stationaryMinutes,
        movingMinutes,
        segments,
      });
    }
  }

  return rows;
}

// ── Generator: Incidents ───────────────────────────────────────────

export function generateIncidentReport(
  startDate: string,
  endDate: string,
): IncidentReportRow[] {
  const rows: IncidentReportRow[] = [];
  const days = eachDayInRange(startDate, endDate);

  for (const day of days) {
    const rng = createRng(hashString(`incident-${day}`));
    const incidentCount = randomInt(0, 3, rng);

    for (let i = 0; i < incidentCount; i++) {
      const agent = pickItem(AGENTS, rng);
      const zone = pickItem(ZONES, rng);
      const type = pickItem(INCIDENT_TYPES, rng);
      const severity = pickItem(INCIDENT_SEVERITIES, rng);
      const descriptions = INCIDENT_DESCRIPTIONS[type];
      const description = pickItem(descriptions, rng);

      const timeH = randomInt(0, 23, rng);
      const timeM = randomInt(0, 59, rng);
      const time = padTime(timeH, timeM);

      const resolved = rng() < 0.7;
      let resolvedAt: string | null = null;
      let durationMinutes: number | null = null;

      if (resolved) {
        durationMinutes = randomInt(5, 120, rng);
        const resolvedTotalMin = timeH * 60 + timeM + durationMinutes;
        resolvedAt = padTime(
          Math.floor(resolvedTotalMin / 60) % 24,
          resolvedTotalMin % 60,
        );
      }

      rows.push({
        id: `inc-${day}-${i}`,
        agentName: agent.name,
        site: agent.site,
        zone: zone.name,
        date: day,
        time,
        type,
        severity,
        description,
        resolved,
        resolvedAt,
        durationMinutes,
      });
    }
  }

  return rows;
}

// ── Generator: Activité zones ──────────────────────────────────────

export function generateZoneActivityReport(
  startDate: string,
  endDate: string,
): ZoneActivityReportRow[] {
  const rows: ZoneActivityReportRow[] = [];
  const days = eachDayInRange(startDate, endDate);

  for (const day of days) {
    for (const zone of ZONES) {
      const rng = createRng(hashString(`zone-${day}-${zone.name}`));

      const totalEntries = randomInt(5, 50, rng);
      const totalExits = randomInt(
        Math.max(1, totalEntries - 5),
        totalEntries + 2,
        rng,
      );
      const uniqueAgents = randomInt(2, 6, rng);
      const avgPresenceDurationMinutes = randomInt(15, 240, rng);
      const peakH = randomInt(6, 22, rng);
      const peakHour = padTime(peakH, 0);
      const alerts = randomInt(0, 5, rng);
      const occupancyRate = randomInt(10, 100, rng);

      rows.push({
        id: `zone-${day}-${zone.name.replace(/\s/g, "-").toLowerCase()}`,
        zoneName: zone.name,
        zoneType: zone.type,
        site: zone.site,
        date: day,
        totalEntries,
        totalExits,
        uniqueAgents,
        avgPresenceDurationMinutes,
        peakHour,
        alerts,
        occupancyRate,
      });
    }
  }

  return rows;
}

// ── Filter Helpers ─────────────────────────────────────────────────

export function getUniqueSites(): string[] {
  return [...SITES];
}

export function getUniqueAgentNames(): string[] {
  return AGENTS.map((a) => a.name);
}

export function getUniqueZoneNames(): string[] {
  return ZONES.map((z) => z.name);
}
