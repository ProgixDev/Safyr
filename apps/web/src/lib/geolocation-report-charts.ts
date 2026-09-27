import type {
  DeplacementReportRow,
  IncidentReportRow,
  PresenceReportRow,
  RondeReportRow,
  ZoneActivityReportRow,
} from "@/data/geolocation-reports";

export interface BarSeries {
  key: string;
  label: string;
  color: string;
}

export interface BarDatum {
  label: string;
  [series: string]: number | string;
}

export interface PieDatum {
  name: string;
  value: number;
  color: string;
}

export interface ChartData {
  bar: BarDatum[];
  barSeries: BarSeries[];
  pie: PieDatum[];
  /** Stacked bars stack together; false = grouped side-by-side. */
  barStacked: boolean;
}

export const CHART_COLORS = {
  emerald: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  cyan: "#295F8E",
  violet: "#8b5cf6",
  slate: "#64748b",
} as const;

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

function groupByDate<T extends { date: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const key = row.date;
    const bucket = map.get(key) ?? [];
    bucket.push(row);
    map.set(key, bucket);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

// ── Presences ──────────────────────────────────────────────────────

export function buildPresencesCharts(rows: PresenceReportRow[]): ChartData {
  const grouped = groupByDate(rows);
  const bar: BarDatum[] = [...grouped.entries()].map(([date, items]) => ({
    label: formatShortDate(date),
    Présent: items.filter((r) => r.status === "Présent").length,
    Retard: items.filter((r) => r.status === "En retard").length,
    Absent: items.filter((r) => r.status === "Absent").length,
    "Hors zone": items.filter((r) => r.status === "Hors zone").length,
  }));

  const counts = {
    Présent: rows.filter((r) => r.status === "Présent").length,
    Retard: rows.filter((r) => r.status === "En retard").length,
    Absent: rows.filter((r) => r.status === "Absent").length,
    "Hors zone": rows.filter((r) => r.status === "Hors zone").length,
  };

  return {
    bar,
    barStacked: true,
    barSeries: [
      { key: "Présent", label: "Présent", color: CHART_COLORS.emerald },
      { key: "Retard", label: "En retard", color: CHART_COLORS.amber },
      { key: "Absent", label: "Absent", color: CHART_COLORS.red },
      { key: "Hors zone", label: "Hors zone", color: CHART_COLORS.violet },
    ],
    pie: [
      { name: "Présent", value: counts.Présent, color: CHART_COLORS.emerald },
      { name: "En retard", value: counts.Retard, color: CHART_COLORS.amber },
      { name: "Absent", value: counts.Absent, color: CHART_COLORS.red },
      {
        name: "Hors zone",
        value: counts["Hors zone"],
        color: CHART_COLORS.violet,
      },
    ].filter((d) => d.value > 0),
  };
}

// ── Rondes ─────────────────────────────────────────────────────────

export function buildRondesCharts(rows: RondeReportRow[]): ChartData {
  const grouped = groupByDate(rows);
  const bar: BarDatum[] = [...grouped.entries()].map(([date, items]) => ({
    label: formatShortDate(date),
    Terminée: items.filter((r) => r.status === "Terminée").length,
    Incomplète: items.filter((r) => r.status === "Incomplète").length,
    "En cours": items.filter((r) => r.status === "En cours").length,
  }));

  const counts = {
    Terminée: rows.filter((r) => r.status === "Terminée").length,
    Incomplète: rows.filter((r) => r.status === "Incomplète").length,
    "En cours": rows.filter((r) => r.status === "En cours").length,
  };

  return {
    bar,
    barStacked: true,
    barSeries: [
      { key: "Terminée", label: "Terminée", color: CHART_COLORS.emerald },
      { key: "Incomplète", label: "Incomplète", color: CHART_COLORS.amber },
      { key: "En cours", label: "En cours", color: CHART_COLORS.cyan },
    ],
    pie: [
      { name: "Terminée", value: counts.Terminée, color: CHART_COLORS.emerald },
      {
        name: "Incomplète",
        value: counts.Incomplète,
        color: CHART_COLORS.amber,
      },
      { name: "En cours", value: counts["En cours"], color: CHART_COLORS.cyan },
    ].filter((d) => d.value > 0),
  };
}

// ── Déplacements ───────────────────────────────────────────────────

export function buildDeplacementsCharts(
  rows: DeplacementReportRow[],
): ChartData {
  const grouped = groupByDate(rows);
  const bar: BarDatum[] = [...grouped.entries()].map(([date, items]) => ({
    label: formatShortDate(date),
    Distance: Number(
      items.reduce((sum, r) => sum + r.totalDistanceKm, 0).toFixed(2),
    ),
  }));

  const totalMoving = rows.reduce((sum, r) => sum + r.movingMinutes, 0);
  const totalStationary = rows.reduce((sum, r) => sum + r.stationaryMinutes, 0);

  return {
    bar,
    barStacked: false,
    barSeries: [
      { key: "Distance", label: "Distance (km)", color: CHART_COLORS.cyan },
    ],
    pie: [
      { name: "En mouvement", value: totalMoving, color: CHART_COLORS.cyan },
      {
        name: "À l'arrêt",
        value: totalStationary,
        color: CHART_COLORS.slate,
      },
    ].filter((d) => d.value > 0),
  };
}

// ── Incidents ──────────────────────────────────────────────────────

export function buildIncidentsCharts(rows: IncidentReportRow[]): ChartData {
  const grouped = groupByDate(rows);
  const bar: BarDatum[] = [...grouped.entries()].map(([date, items]) => ({
    label: formatShortDate(date),
    Faible: items.filter((r) => r.severity === "Faible").length,
    Moyen: items.filter((r) => r.severity === "Moyen").length,
    Élevé: items.filter((r) => r.severity === "Élevé").length,
    Critique: items.filter((r) => r.severity === "Critique").length,
  }));

  const counts = {
    Faible: rows.filter((r) => r.severity === "Faible").length,
    Moyen: rows.filter((r) => r.severity === "Moyen").length,
    Élevé: rows.filter((r) => r.severity === "Élevé").length,
    Critique: rows.filter((r) => r.severity === "Critique").length,
  };

  return {
    bar,
    barStacked: true,
    barSeries: [
      { key: "Faible", label: "Faible", color: CHART_COLORS.cyan },
      { key: "Moyen", label: "Moyen", color: CHART_COLORS.amber },
      { key: "Élevé", label: "Élevé", color: CHART_COLORS.red },
      { key: "Critique", label: "Critique", color: CHART_COLORS.violet },
    ],
    pie: [
      { name: "Faible", value: counts.Faible, color: CHART_COLORS.cyan },
      { name: "Moyen", value: counts.Moyen, color: CHART_COLORS.amber },
      { name: "Élevé", value: counts.Élevé, color: CHART_COLORS.red },
      { name: "Critique", value: counts.Critique, color: CHART_COLORS.violet },
    ].filter((d) => d.value > 0),
  };
}

// ── Zones ──────────────────────────────────────────────────────────

export function buildZonesCharts(rows: ZoneActivityReportRow[]): ChartData {
  const byZone = new Map<string, number>();
  for (const row of rows) {
    byZone.set(
      row.zoneName,
      (byZone.get(row.zoneName) ?? 0) + row.totalEntries,
    );
  }

  const sortedZones = [...byZone.entries()].sort((a, b) => b[1] - a[1]);
  const topZones = sortedZones.slice(0, 5);

  const palette = [
    CHART_COLORS.cyan,
    CHART_COLORS.emerald,
    CHART_COLORS.amber,
    CHART_COLORS.violet,
    CHART_COLORS.red,
  ];

  const bar: BarDatum[] = topZones.map(([zone, entries]) => ({
    label: zone.length > 14 ? `${zone.slice(0, 14)}…` : zone,
    Entrées: entries,
  }));

  return {
    bar,
    barStacked: false,
    barSeries: [{ key: "Entrées", label: "Entrées", color: CHART_COLORS.cyan }],
    pie: topZones.map(([zone, entries], i) => ({
      name: zone,
      value: entries,
      color: palette[i % palette.length],
    })),
  };
}
