"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  UserCheck,
  Navigation,
  Route,
  AlertTriangle,
  MapPin,
  Calendar,
  Play,
  FileText,
  FileSpreadsheet,
  Table2,
  Clock,
  Shield,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  ArrowRight,
  Activity,
  Footprints,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  WidgetConfig,
  useWidgetSystem,
  CustomizerModal,
  WidgetGrid,
  PersonnaliserButton,
} from "@/components/ui/widget-customizer";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable } from "@/components/ui/DataTable";
import type { ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { cn, getInitials } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  type ReportType,
  REPORT_TYPES,
  REPORT_TYPE_CONFIG,
  type PresenceReportRow,
  type RondeReportRow,
  type DeplacementReportRow,
  type IncidentReportRow,
  type ZoneActivityReportRow,
  generatePresenceReport,
  generateRondeReport,
  generateDeplacementReport,
  generateIncidentReport,
  generateZoneActivityReport,
  getUniqueSites,
  getUniqueAgentNames,
  getUniqueZoneNames,
} from "@/data/geolocation-reports";
import {
  buildDeplacementsCharts,
  buildIncidentsCharts,
  buildPresencesCharts,
  buildRondesCharts,
  buildZonesCharts,
} from "@/lib/geolocation-report-charts";
import { ReportCharts } from "@/components/geolocation/ReportCharts";

// ── Discriminated Union Types ────────────────────────────────────────

type GeneratedReport =
  | { type: "presences"; rows: PresenceReportRow[] }
  | { type: "rondes"; rows: RondeReportRow[] }
  | { type: "deplacements"; rows: DeplacementReportRow[] }
  | { type: "incidents"; rows: IncidentReportRow[] }
  | { type: "zones"; rows: ZoneActivityReportRow[] };

type DetailRow =
  | { type: "presences"; row: PresenceReportRow }
  | { type: "rondes"; row: RondeReportRow }
  | { type: "deplacements"; row: DeplacementReportRow }
  | { type: "incidents"; row: IncidentReportRow }
  | { type: "zones"; row: ZoneActivityReportRow };

// ── Constants ────────────────────────────────────────────────────────

const REPORT_TYPE_ICONS: Record<ReportType, LucideIcon> = {
  presences: UserCheck,
  rondes: Navigation,
  deplacements: Route,
  incidents: AlertTriangle,
  zones: MapPin,
};

// ── Helpers ──────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDuration(minutes: number): string {
  if (minutes === 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function defaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function defaultEndDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getPlainValue(item: object, key: string): string {
  const record = item as Record<string, unknown>;
  const val = record[key];
  if (val == null) return "";
  if (Array.isArray(val)) return val.length > 0 ? String(val.length) : "0";
  if (typeof val === "boolean") return val ? "Oui" : "Non";
  return String(val);
}

function prepareExportData<T extends object>(
  data: T[],
  columns: ColumnDef<T>[],
): { headers: string[]; rows: string[][] } {
  return {
    headers: columns.map((c) => c.label),
    rows: data.map((item) => columns.map((c) => getPlainValue(item, c.key))),
  };
}

// ── Modal UI Helpers ─────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/30 p-3 flex flex-col items-center gap-1",
        className,
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function DetailGrid({
  fields,
}: {
  fields: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
      {fields.map((f) => (
        <div key={f.label}>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {f.label}
          </p>
          <div className="text-sm mt-0.5">{f.value}</div>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({
  value,
  width = "w-16",
  showLabel = true,
}: {
  value: number;
  width?: string;
  showLabel?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-1.5 rounded-full bg-muted", width)}>
        <div
          className={cn(
            "h-full rounded-full",
            value >= 80
              ? "bg-emerald-500"
              : value >= 50
                ? "bg-yellow-500"
                : "bg-red-500",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs tabular-nums text-muted-foreground">
          {value}%
        </span>
      )}
    </div>
  );
}

// ── Status Style Constants ────────────────────────────────────────────

const PRESENCE_STATUS_STYLE: Record<
  PresenceReportRow["status"],
  {
    variant: "success" | "warning" | "error" | "info";
    bg: string;
    border: string;
    text: string;
  }
> = {
  Présent: {
    variant: "success",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
  },
  "En retard": {
    variant: "warning",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    text: "text-yellow-400",
  },
  Absent: {
    variant: "error",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
  },
  "Hors zone": {
    variant: "info",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
  },
};

const RONDE_STATUS_STYLE: Record<
  RondeReportRow["status"],
  {
    variant: "success" | "warning" | "cyan";
    bg: string;
    border: string;
    text: string;
  }
> = {
  Terminée: {
    variant: "success",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
  },
  Incomplète: {
    variant: "warning",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    text: "text-yellow-400",
  },
  "En cours": {
    variant: "cyan",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    text: "text-cyan-400",
  },
};

const INCIDENT_SEVERITY_STYLE: Record<
  IncidentReportRow["severity"],
  {
    variant: "error" | "warning" | "info" | "neutral";
    bg: string;
    border: string;
  }
> = {
  Critique: {
    variant: "error",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  Élevé: {
    variant: "warning",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  Moyen: {
    variant: "info",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  Faible: {
    variant: "neutral",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
  },
};

const INCIDENT_TYPE_VARIANT: Record<
  string,
  "error" | "warning" | "info" | "cyan"
> = {
  SOS: "error",
  Immobilité: "warning",
  "Hors zone": "info",
  "Batterie critique": "warning",
  "Perte signal": "cyan",
};

// ── Column Definitions ───────────────────────────────────────────────

function getPresenceColumns(): ColumnDef<PresenceReportRow>[] {
  return [
    {
      key: "agentName",
      label: "Agent",
      render: (r) => <span className="font-medium text-sm">{r.agentName}</span>,
    },
    {
      key: "site",
      label: "Site",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{r.site}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (r) => (
        <span className="text-sm tabular-nums">{formatDate(r.date)}</span>
      ),
      sortable: true,
      sortValue: (r) => r.date,
    },
    {
      key: "shiftStart",
      label: "Vacation",
      render: (r) => (
        <span className="text-sm tabular-nums">
          {r.shiftStart} – {r.shiftEnd}
        </span>
      ),
      sortable: true,
      sortValue: (r) => r.shiftStart,
    },
    {
      key: "arrivalTime",
      label: "Arrivée",
      render: (r) =>
        r.arrivalTime ? (
          <span className="text-sm tabular-nums">{r.arrivalTime}</span>
        ) : (
          <span className="text-sm text-muted-foreground italic">—</span>
        ),
      sortable: true,
      sortValue: (r) => r.arrivalTime ?? "",
    },
    {
      key: "durationMinutes",
      label: "Durée",
      render: (r) => {
        if (r.durationMinutes === 0)
          return (
            <span className="text-sm text-muted-foreground italic">—</span>
          );
        return (
          <span className="text-sm tabular-nums">
            {formatDuration(r.durationMinutes)}
          </span>
        );
      },
      sortable: true,
      sortValue: (r) => r.durationMinutes,
    },
    {
      key: "status",
      label: "Statut",
      render: (r) => (
        <Badge variant={PRESENCE_STATUS_STYLE[r.status].variant}>
          {r.status}
        </Badge>
      ),
      sortable: true,
      sortValue: (r) => r.status,
    },
    {
      key: "anomalies",
      label: "Anomalies",
      render: (r) =>
        r.anomalies.length > 0 ? (
          <Badge variant="error" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {r.anomalies.length}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
      sortable: true,
      sortValue: (r) => r.anomalies.length,
    },
  ];
}

function getRondeColumns(): ColumnDef<RondeReportRow>[] {
  return [
    {
      key: "routeName",
      label: "Ronde",
      render: (r) => <span className="font-medium text-sm">{r.routeName}</span>,
    },
    {
      key: "agentName",
      label: "Agent",
      render: (r) => <span className="text-sm">{r.agentName}</span>,
    },
    {
      key: "site",
      label: "Site",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{r.site}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (r) => (
        <span className="text-sm tabular-nums">{formatDate(r.date)}</span>
      ),
      sortable: true,
      sortValue: (r) => r.date,
    },
    {
      key: "status",
      label: "Statut",
      render: (r) => (
        <Badge variant={RONDE_STATUS_STYLE[r.status].variant}>{r.status}</Badge>
      ),
      sortable: true,
      sortValue: (r) => r.status,
    },
    {
      key: "checkpointsScanned",
      label: "Checkpoints",
      render: (r) => (
        <span className="text-sm tabular-nums">
          {r.checkpointsScanned}/{r.checkpointsTotal}
        </span>
      ),
      sortable: true,
      sortValue: (r) => r.completionRate,
    },
    {
      key: "completionRate",
      label: "Complétion",
      render: (r) => <ProgressBar value={r.completionRate} />,
      sortable: true,
      sortValue: (r) => r.completionRate,
    },
    {
      key: "durationMinutes",
      label: "Durée",
      render: (r) =>
        r.durationMinutes != null ? (
          <span className="text-sm tabular-nums">{r.durationMinutes} min</span>
        ) : (
          <span className="text-sm text-muted-foreground italic">—</span>
        ),
      sortable: true,
      sortValue: (r) => r.durationMinutes ?? 0,
    },
  ];
}

function getDeplacementColumns(): ColumnDef<DeplacementReportRow>[] {
  return [
    {
      key: "agentName",
      label: "Agent",
      render: (r) => <span className="font-medium text-sm">{r.agentName}</span>,
    },
    {
      key: "site",
      label: "Site",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{r.site}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (r) => (
        <span className="text-sm tabular-nums">{formatDate(r.date)}</span>
      ),
      sortable: true,
      sortValue: (r) => r.date,
    },
    {
      key: "totalDistanceKm",
      label: "Distance",
      render: (r) => (
        <span className="text-sm tabular-nums">{r.totalDistanceKm} km</span>
      ),
      sortable: true,
      sortValue: (r) => r.totalDistanceKm,
    },
    {
      key: "totalDurationMinutes",
      label: "Durée totale",
      render: (r) => (
        <span className="text-sm tabular-nums">
          {formatDuration(r.totalDurationMinutes)}
        </span>
      ),
      sortable: true,
      sortValue: (r) => r.totalDurationMinutes,
    },
    {
      key: "avgSpeedKmh",
      label: "Vitesse moy.",
      render: (r) => (
        <span className="text-sm tabular-nums">{r.avgSpeedKmh} km/h</span>
      ),
      sortable: true,
      sortValue: (r) => r.avgSpeedKmh,
    },
    {
      key: "movingMinutes",
      label: "En mouvement",
      render: (r) => (
        <span className="text-sm tabular-nums">{r.movingMinutes} min</span>
      ),
      sortable: true,
      sortValue: (r) => r.movingMinutes,
    },
    {
      key: "stationaryMinutes",
      label: "À l'arrêt",
      render: (r) => (
        <span className="text-sm tabular-nums">{r.stationaryMinutes} min</span>
      ),
      sortable: true,
      sortValue: (r) => r.stationaryMinutes,
    },
    {
      key: "segments",
      label: "Segments",
      render: (r) => (
        <span className="text-sm tabular-nums">{r.segments.length}</span>
      ),
      sortable: true,
      sortValue: (r) => r.segments.length,
    },
  ];
}

function getIncidentColumns(): ColumnDef<IncidentReportRow>[] {
  return [
    {
      key: "date",
      label: "Date",
      render: (r) => (
        <span className="text-sm tabular-nums">{formatDate(r.date)}</span>
      ),
      sortable: true,
      sortValue: (r) => `${r.date}T${r.time}`,
    },
    {
      key: "time",
      label: "Heure",
      render: (r) => <span className="text-sm tabular-nums">{r.time}</span>,
      sortable: true,
      sortValue: (r) => r.time,
    },
    {
      key: "agentName",
      label: "Agent",
      render: (r) => <span className="font-medium text-sm">{r.agentName}</span>,
    },
    {
      key: "site",
      label: "Site",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{r.site}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (r) => (
        <Badge variant={INCIDENT_TYPE_VARIANT[r.type] ?? "secondary"}>
          {r.type}
        </Badge>
      ),
      sortable: true,
      sortValue: (r) => r.type,
    },
    {
      key: "severity",
      label: "Gravité",
      render: (r) => (
        <Badge variant={INCIDENT_SEVERITY_STYLE[r.severity].variant}>
          {r.severity}
        </Badge>
      ),
      sortable: true,
      sortValue: (r) => {
        const order = { Critique: 0, Élevé: 1, Moyen: 2, Faible: 3 };
        return order[r.severity];
      },
    },
    {
      key: "description",
      label: "Description",
      render: (r) => (
        <span className="text-sm max-w-[200px] truncate block">
          {r.description}
        </span>
      ),
    },
    {
      key: "resolved",
      label: "Résolu",
      render: (r) =>
        r.resolved ? (
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="text-xs">{r.resolvedAt}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-400">
            <XCircle className="h-3.5 w-3.5" />
            <span className="text-xs">Non</span>
          </div>
        ),
      sortable: true,
      sortValue: (r) => (r.resolved ? 0 : 1),
    },
  ];
}

function getZoneActivityColumns(): ColumnDef<ZoneActivityReportRow>[] {
  return [
    {
      key: "zoneName",
      label: "Zone",
      render: (r) => <span className="font-medium text-sm">{r.zoneName}</span>,
    },
    {
      key: "zoneType",
      label: "Type",
      render: (r) => <Badge variant="cyan">{r.zoneType}</Badge>,
    },
    {
      key: "site",
      label: "Site",
      render: (r) => (
        <span className="text-sm text-muted-foreground">{r.site}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (r) => (
        <span className="text-sm tabular-nums">{formatDate(r.date)}</span>
      ),
      sortable: true,
      sortValue: (r) => r.date,
    },
    {
      key: "totalEntries",
      label: "Entrées",
      render: (r) => (
        <span className="text-sm tabular-nums">{r.totalEntries}</span>
      ),
      sortable: true,
      sortValue: (r) => r.totalEntries,
    },
    {
      key: "totalExits",
      label: "Sorties",
      render: (r) => (
        <span className="text-sm tabular-nums">{r.totalExits}</span>
      ),
      sortable: true,
      sortValue: (r) => r.totalExits,
    },
    {
      key: "uniqueAgents",
      label: "Agents uniques",
      render: (r) => (
        <span className="text-sm tabular-nums">{r.uniqueAgents}</span>
      ),
      sortable: true,
      sortValue: (r) => r.uniqueAgents,
    },
    {
      key: "peakHour",
      label: "Heure de pointe",
      render: (r) => <span className="text-sm tabular-nums">{r.peakHour}</span>,
      sortable: true,
      sortValue: (r) => r.peakHour,
    },
    {
      key: "alerts",
      label: "Alertes",
      render: (r) =>
        r.alerts > 0 ? (
          <Badge variant="warning" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            {r.alerts}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">0</span>
        ),
      sortable: true,
      sortValue: (r) => r.alerts,
    },
    {
      key: "occupancyRate",
      label: "Occupation",
      render: (r) => <ProgressBar value={r.occupancyRate} width="w-12" />,
      sortable: true,
      sortValue: (r) => r.occupancyRate,
    },
  ];
}

// ── Export Functions ──────────────────────────────────────────────────

function exportCSV(headers: string[], rows: string[][], filename: string) {
  const headerLine = headers.join(";");
  const dataLines = rows.map((row) =>
    row.map((val) => `"${val.replace(/"/g, '""')}"`).join(";"),
  );
  const csv = [headerLine, ...dataLines].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(blob, `${filename}.csv`);
}

function exportExcel(headers: string[], rows: string[][], filename: string) {
  let html =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table border="1">';
  html += "<tr>" + headers.map((h) => `<th>${h}</th>`).join("") + "</tr>";
  for (const row of rows) {
    html += "<tr>" + row.map((v) => `<td>${v}</td>`).join("") + "</tr>";
  }
  html += "</table></body></html>";
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  triggerDownload(blob, `${filename}.xls`);
}

async function exportPDF(opts: {
  headers: string[];
  rows: string[][];
  title: string;
  period: string;
  recordCount: number;
  filename: string;
}) {
  const { headers, rows, title, period, recordCount, filename } = opts;
  const {
    applyPdfFooters,
    brandedPdfDefaults,
    drawPdfHeader,
    loadPdfBranding,
    pdfTableMargins,
  } = await import("@/lib/pdf-branding");
  const branding = await loadPdfBranding();
  const doc = new jsPDF({ orientation: "portrait", format: "a4" });

  const header = {
    title,
    subtitle: `Période : ${period} — ${recordCount} enregistrement${recordCount !== 1 ? "s" : ""} — Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
  };
  const startY = drawPdfHeader(doc, branding, header);

  autoTable(doc, {
    ...brandedPdfDefaults,
    startY,
    head: [headers],
    body: rows,
    styles: { ...brandedPdfDefaults.styles, fontSize: 6, cellPadding: 1.5 },
    margin: pdfTableMargins(branding, { header, left: 10, right: 10 }),
  });

  applyPdfFooters(doc, branding, {
    header: { ...header, skipFirstPage: true },
  });
  doc.save(`${filename}.pdf`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Summary Stats ────────────────────────────────────────────────────

interface SummaryStat {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtext?: string;
  color: string;
}

function getPresenceStats(data: PresenceReportRow[]): SummaryStat[] {
  const total = data.length;
  const present = data.filter((r) => r.status === "Présent").length;
  const late = data.filter((r) => r.status === "En retard").length;
  const anomalies = data.filter((r) => r.anomalies.length > 0).length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
  return [
    {
      icon: Users,
      title: "Total enregistrements",
      value: total,
      color: "cyan",
    },
    {
      icon: CheckCircle,
      title: "Taux de présence",
      value: `${rate}%`,
      subtext: `${present} présents`,
      color: "green",
    },
    {
      icon: Clock,
      title: "Retards",
      value: late,
      subtext: `${total > 0 ? Math.round((late / total) * 100) : 0}% du total`,
      color: "yellow",
    },
    { icon: AlertTriangle, title: "Anomalies", value: anomalies, color: "red" },
  ];
}

function getRondeStats(data: RondeReportRow[]): SummaryStat[] {
  const total = data.length;
  const completed = data.filter((r) => r.status === "Terminée").length;
  const incomplete = data.filter((r) => r.status === "Incomplète").length;
  const avgCompletion =
    total > 0
      ? Math.round(data.reduce((s, r) => s + r.completionRate, 0) / total)
      : 0;
  const totalDistance = data.reduce((s, r) => s + (r.distanceMeters ?? 0), 0);
  return [
    { icon: Navigation, title: "Total rondes", value: total, color: "cyan" },
    {
      icon: CheckCircle,
      title: "Complétion moy.",
      value: `${avgCompletion}%`,
      subtext: `${completed} terminées`,
      color: "green",
    },
    {
      icon: AlertTriangle,
      title: "Incomplètes",
      value: incomplete,
      color: "yellow",
    },
    {
      icon: Route,
      title: "Distance totale",
      value: `${(totalDistance / 1000).toFixed(1)} km`,
      color: "blue",
    },
  ];
}

function getDeplacementStats(data: DeplacementReportRow[]): SummaryStat[] {
  const totalDist = data.reduce((s, r) => s + r.totalDistanceKm, 0);
  const totalDur = data.reduce((s, r) => s + r.totalDurationMinutes, 0);
  const avgSpeed =
    data.length > 0
      ? (data.reduce((s, r) => s + r.avgSpeedKmh, 0) / data.length).toFixed(1)
      : "0";
  const agents = new Set(data.map((r) => r.agentName)).size;
  return [
    {
      icon: Route,
      title: "Distance totale",
      value: `${totalDist.toFixed(1)} km`,
      color: "cyan",
    },
    {
      icon: Clock,
      title: "Durée totale",
      value: `${Math.floor(totalDur / 60)}h${String(totalDur % 60).padStart(2, "0")}`,
      color: "blue",
    },
    {
      icon: TrendingUp,
      title: "Vitesse moy.",
      value: `${avgSpeed} km/h`,
      color: "green",
    },
    { icon: Users, title: "Agents suivis", value: agents, color: "yellow" },
  ];
}

function getIncidentStats(data: IncidentReportRow[]): SummaryStat[] {
  const total = data.length;
  const critical = data.filter((r) => r.severity === "Critique").length;
  const unresolved = data.filter((r) => !r.resolved).length;
  const resolvedWithDuration = data.filter(
    (r) => r.resolved && r.durationMinutes != null,
  );
  const avgResolution =
    resolvedWithDuration.length > 0
      ? Math.round(
          resolvedWithDuration.reduce(
            (s, r) => s + (r.durationMinutes ?? 0),
            0,
          ) / resolvedWithDuration.length,
        )
      : 0;
  return [
    { icon: Shield, title: "Total incidents", value: total, color: "cyan" },
    { icon: AlertTriangle, title: "Critiques", value: critical, color: "red" },
    { icon: XCircle, title: "Non résolus", value: unresolved, color: "yellow" },
    {
      icon: Clock,
      title: "Résolution moy.",
      value: `${avgResolution} min`,
      color: "green",
    },
  ];
}

function getZoneStats(data: ZoneActivityReportRow[]): SummaryStat[] {
  const zones = new Set(data.map((r) => r.zoneName)).size;
  const totalEntries = data.reduce((s, r) => s + r.totalEntries, 0);
  const avgOccupancy =
    data.length > 0
      ? Math.round(data.reduce((s, r) => s + r.occupancyRate, 0) / data.length)
      : 0;
  const totalAlerts = data.reduce((s, r) => s + r.alerts, 0);
  return [
    { icon: MapPin, title: "Zones actives", value: zones, color: "cyan" },
    {
      icon: Users,
      title: "Entrées totales",
      value: totalEntries,
      color: "blue",
    },
    {
      icon: TrendingUp,
      title: "Occupation moy.",
      value: `${avgOccupancy}%`,
      color: "green",
    },
    {
      icon: AlertTriangle,
      title: "Alertes",
      value: totalAlerts,
      color: "yellow",
    },
  ];
}

// ── Detail Modal Components ──────────────────────────────────────────

function PresenceDetail({ row }: { row: PresenceReportRow }) {
  const style = PRESENCE_STATUS_STYLE[row.status];
  return (
    <div className="space-y-5">
      {/* Agent Banner */}
      <div className={cn("rounded-lg p-4 border", style.bg, style.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold",
                style.bg,
                style.text,
              )}
            >
              {getInitials(row.agentName)}
            </div>
            <div>
              <p className="font-semibold">{row.agentName}</p>
              <p className="text-xs text-muted-foreground">
                {row.site} · {row.zone}
              </p>
            </div>
          </div>
          <Badge variant={style.variant} className="text-xs">
            {row.status}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricCard
          icon={Clock}
          label="Vacation"
          value={`${row.shiftStart} – ${row.shiftEnd}`}
        />
        <MetricCard
          icon={Play}
          label="Arrivée"
          value={row.arrivalTime ?? "—"}
        />
        <MetricCard
          icon={XCircle}
          label="Départ"
          value={row.departureTime ?? "—"}
        />
        <MetricCard
          icon={Activity}
          label="Durée"
          value={formatDuration(row.durationMinutes)}
        />
      </div>

      {/* Details */}
      <DetailSection title="Informations" icon={Info}>
        <DetailGrid
          fields={[
            { label: "Date", value: formatDate(row.date) },
            { label: "Zone", value: row.zone },
          ]}
        />
      </DetailSection>

      {/* Anomalies */}
      {row.anomalies.length > 0 && (
        <DetailSection title="Anomalies" icon={AlertTriangle}>
          <div className="space-y-2">
            {row.anomalies.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2"
              >
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <span className="text-sm">{a}</span>
              </div>
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  );
}

function RondeDetail({ row }: { row: RondeReportRow }) {
  const style = RONDE_STATUS_STYLE[row.status];
  return (
    <div className="space-y-5">
      {/* Route Banner */}
      <div className={cn("rounded-lg p-4 border", style.bg, style.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center",
                style.bg,
                style.text,
              )}
            >
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">{row.routeName}</p>
              <p className="text-xs text-muted-foreground">
                {row.site} · {row.agentName}
              </p>
            </div>
          </div>
          <Badge variant={style.variant} className="text-xs">
            {row.status}
          </Badge>
        </div>
      </div>

      {/* Completion Progress */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progression</span>
          <span className="text-sm font-semibold tabular-nums">
            {row.checkpointsScanned} / {row.checkpointsTotal} checkpoints
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              row.completionRate === 100
                ? "bg-emerald-500"
                : row.completionRate >= 50
                  ? "bg-yellow-500"
                  : "bg-red-500",
            )}
            style={{ width: `${row.completionRate}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
          {row.completionRate}% complété
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          icon={Clock}
          label="Durée"
          value={
            row.durationMinutes != null ? `${row.durationMinutes} min` : "—"
          }
        />
        <MetricCard
          icon={Route}
          label="Distance"
          value={
            row.distanceMeters != null
              ? `${(row.distanceMeters / 1000).toFixed(1)} km`
              : "—"
          }
        />
        <MetricCard icon={Calendar} label="Date" value={formatDate(row.date)} />
      </div>

      {/* Details */}
      <DetailSection title="Horaires" icon={Clock}>
        <DetailGrid
          fields={[
            { label: "Début", value: row.startedAt },
            { label: "Fin", value: row.endedAt ?? "En cours" },
          ]}
        />
      </DetailSection>
    </div>
  );
}

function DeplacementDetail({ row }: { row: DeplacementReportRow }) {
  const movingPct =
    row.totalDurationMinutes > 0
      ? Math.round((row.movingMinutes / row.totalDurationMinutes) * 100)
      : 0;
  return (
    <div className="space-y-5">
      {/* Agent Banner */}
      <div className="rounded-lg p-4 border bg-cyan-500/10 border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-cyan-500/10 text-cyan-400 text-sm font-bold">
            {getInitials(row.agentName)}
          </div>
          <div>
            <p className="font-semibold">{row.agentName}</p>
            <p className="text-xs text-muted-foreground">
              {row.site} · {formatDate(row.date)}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricCard
          icon={Route}
          label="Distance"
          value={`${row.totalDistanceKm} km`}
        />
        <MetricCard
          icon={Clock}
          label="Durée totale"
          value={formatDuration(row.totalDurationMinutes)}
        />
        <MetricCard
          icon={TrendingUp}
          label="Vitesse moy."
          value={`${row.avgSpeedKmh} km/h`}
        />
        <MetricCard
          icon={Footprints}
          label="Segments"
          value={String(row.segments.length)}
        />
      </div>

      {/* Activity Breakdown */}
      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium mb-3">Répartition du temps</p>
        <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-muted">
          <div
            className="bg-cyan-500 rounded-l-full"
            style={{ width: `${movingPct}%` }}
          />
          <div
            className="bg-slate-500 rounded-r-full"
            style={{ width: `${100 - movingPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            En mouvement — {row.movingMinutes} min ({movingPct}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-500" />À l&apos;arrêt
            — {row.stationaryMinutes} min ({100 - movingPct}%)
          </span>
        </div>
      </div>

      {/* Segments Table */}
      {row.segments.length > 0 && (
        <DetailSection title="Segments de déplacement" icon={Route}>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">
                    Trajet
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">
                    Distance
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">
                    Durée
                  </th>
                </tr>
              </thead>
              <tbody>
                {row.segments.map((seg, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span>{seg.from}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{seg.to}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {seg.distanceKm} km
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {seg.durationMinutes} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailSection>
      )}
    </div>
  );
}

function IncidentDetail({ row }: { row: IncidentReportRow }) {
  const sevStyle = INCIDENT_SEVERITY_STYLE[row.severity];
  return (
    <div className="space-y-5">
      {/* Severity Banner */}
      <div
        className={cn("rounded-lg p-4 border", sevStyle.bg, sevStyle.border)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center",
                sevStyle.bg,
              )}
            >
              <AlertTriangle className="h-5 w-5 text-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={INCIDENT_TYPE_VARIANT[row.type] ?? "secondary"}>
                  {row.type}
                </Badge>
                <Badge variant={sevStyle.variant}>{row.severity}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(row.date)} à {row.time}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Description
        </p>
        <p className="text-sm">{row.description}</p>
      </div>

      {/* Resolution Status */}
      <div
        className={cn(
          "rounded-lg border p-4",
          row.resolved
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-red-500/10 border-red-500/20",
        )}
      >
        <div className="flex items-center gap-3">
          {row.resolved ? (
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          ) : (
            <XCircle className="h-5 w-5 text-red-400" />
          )}
          <div>
            <p className="text-sm font-medium">
              {row.resolved ? "Résolu" : "Non résolu"}
            </p>
            {row.resolved && row.resolvedAt && (
              <p className="text-xs text-muted-foreground">
                Résolu à {row.resolvedAt}
                {row.durationMinutes != null &&
                  ` · Durée de résolution : ${row.durationMinutes} min`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Location Details */}
      <DetailSection title="Localisation" icon={MapPin}>
        <DetailGrid
          fields={[
            { label: "Agent", value: row.agentName },
            { label: "Site", value: row.site },
            { label: "Zone", value: row.zone },
          ]}
        />
      </DetailSection>
    </div>
  );
}

function ZoneActivityDetail({ row }: { row: ZoneActivityReportRow }) {
  return (
    <div className="space-y-5">
      {/* Zone Banner */}
      <div className="rounded-lg p-4 border bg-cyan-500/10 border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-cyan-500/10 text-cyan-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">{row.zoneName}</p>
              <p className="text-xs text-muted-foreground">{row.site}</p>
            </div>
          </div>
          <Badge variant="cyan">{row.zoneType}</Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricCard
          icon={Users}
          label="Entrées"
          value={String(row.totalEntries)}
        />
        <MetricCard
          icon={Users}
          label="Sorties"
          value={String(row.totalExits)}
        />
        <MetricCard
          icon={Users}
          label="Agents uniques"
          value={String(row.uniqueAgents)}
        />
        <MetricCard
          icon={Clock}
          label="Durée moy."
          value={formatDuration(row.avgPresenceDurationMinutes)}
        />
      </div>

      {/* Occupancy */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Taux d&apos;occupation</span>
          <span className="text-sm font-semibold tabular-nums">
            {row.occupancyRate}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              row.occupancyRate >= 80
                ? "bg-emerald-500"
                : row.occupancyRate >= 40
                  ? "bg-yellow-500"
                  : "bg-red-500",
            )}
            style={{ width: `${row.occupancyRate}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <DetailSection title="Activité" icon={Activity}>
        <DetailGrid
          fields={[
            { label: "Date", value: formatDate(row.date) },
            { label: "Heure de pointe", value: row.peakHour },
            {
              label: "Alertes",
              value:
                row.alerts > 0 ? (
                  <Badge variant="warning" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {row.alerts}
                  </Badge>
                ) : (
                  "Aucune"
                ),
            },
          ]}
        />
      </DetailSection>
    </div>
  );
}

function getDetailTitle(detail: DetailRow): string {
  switch (detail.type) {
    case "presences":
      return `${detail.row.agentName} — ${formatDate(detail.row.date)}`;
    case "rondes":
      return `${detail.row.routeName} — ${formatDate(detail.row.date)}`;
    case "deplacements":
      return `${detail.row.agentName} — ${formatDate(detail.row.date)}`;
    case "incidents":
      return `${detail.row.type} — ${formatDate(detail.row.date)} ${detail.row.time}`;
    case "zones":
      return `${detail.row.zoneName} — ${formatDate(detail.row.date)}`;
  }
}

// ── Filtering Helper ─────────────────────────────────────────────────

function filterReport(
  report: GeneratedReport,
  site: string,
  agent: string,
  zone: string,
): GeneratedReport {
  switch (report.type) {
    case "presences": {
      let rows = report.rows;
      if (site !== "all") rows = rows.filter((r) => r.site === site);
      if (agent !== "all") rows = rows.filter((r) => r.agentName === agent);
      if (zone !== "all") rows = rows.filter((r) => r.zone === zone);
      return { type: "presences", rows };
    }
    case "rondes": {
      let rows = report.rows;
      if (site !== "all") rows = rows.filter((r) => r.site === site);
      if (agent !== "all") rows = rows.filter((r) => r.agentName === agent);
      return { type: "rondes", rows };
    }
    case "deplacements": {
      let rows = report.rows;
      if (site !== "all") rows = rows.filter((r) => r.site === site);
      if (agent !== "all") rows = rows.filter((r) => r.agentName === agent);
      return { type: "deplacements", rows };
    }
    case "incidents": {
      let rows = report.rows;
      if (site !== "all") rows = rows.filter((r) => r.site === site);
      if (agent !== "all") rows = rows.filter((r) => r.agentName === agent);
      if (zone !== "all") rows = rows.filter((r) => r.zone === zone);
      return { type: "incidents", rows };
    }
    case "zones": {
      let rows = report.rows;
      if (site !== "all") rows = rows.filter((r) => r.site === site);
      if (zone !== "all") rows = rows.filter((r) => r.zoneName === zone);
      return { type: "zones", rows };
    }
  }
}

// ── KPI Widget Configs ────────────────────────────────────────────────

const defaultGeoWidgetConfigs: WidgetConfig[] = [
  { id: "presences-stats", name: "Présences", visible: true },
  { id: "rondes-stats", name: "Rondes", visible: true },
  { id: "deplacements-stats", name: "Déplacements", visible: true },
  { id: "incidents-stats", name: "Incidents", visible: true },
  { id: "zones-stats", name: "Activité Zones", visible: true },
];

const GEO_WIDGET_ICON: Record<string, LucideIcon> = {
  "presences-stats": UserCheck,
  "rondes-stats": Navigation,
  "deplacements-stats": Route,
  "incidents-stats": AlertTriangle,
  "zones-stats": MapPin,
};

// ── Page Component ───────────────────────────────────────────────────

export default function GeolocationReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("presences");
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [siteFilter, setSiteFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [rawReport, setRawReport] = useState<GeneratedReport | null>(null);
  const [detailRow, setDetailRow] = useState<DetailRow | null>(null);

  // Widget system
  const {
    widgetConfigs,
    visibleWidgets: visibleKpiWidgets,
    isEditMode: isKpiEditMode,
    setIsEditMode: setIsKpiEditMode,
    isDialogOpen,
    setIsDialogOpen,
    toggleVisibility,
    moveUp,
    moveDown,
    handleDragEnd,
    handleGridDragEnd,
  } = useWidgetSystem("geolocation", defaultGeoWidgetConfigs);

  // Auto-generate KPI stats for all report types using current date range
  const allKpiStats = useMemo((): Record<string, SummaryStat[]> => {
    const start = startDate;
    const end = endDate;
    return {
      "presences-stats": getPresenceStats(generatePresenceReport(start, end)),
      "rondes-stats": getRondeStats(generateRondeReport(start, end)),
      "deplacements-stats": getDeplacementStats(
        generateDeplacementReport(start, end),
      ),
      "incidents-stats": getIncidentStats(generateIncidentReport(start, end)),
      "zones-stats": getZoneStats(generateZoneActivityReport(start, end)),
    };
  }, [startDate, endDate]);

  const renderKpiWidget = (config: WidgetConfig) => {
    const stats = allKpiStats[config.id] ?? [];
    const Icon = GEO_WIDGET_ICON[config.id] ?? MapPin;
    return (
      <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {config.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="flex flex-col gap-1 p-2 rounded-md bg-muted/30"
                >
                  <div className="flex items-center gap-1.5">
                    <StatIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {stat.title}
                    </span>
                  </div>
                  <span className="text-lg font-light tabular-nums">
                    {stat.value}
                  </span>
                  {stat.subtext && (
                    <span className="text-xs text-muted-foreground">
                      {stat.subtext}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Reset generated report when type or dates change
  const [prevGenKey, setPrevGenKey] = useState("");
  const genKey = `${reportType}-${startDate}-${endDate}`;
  if (genKey !== prevGenKey) {
    setPrevGenKey(genKey);
    if (rawReport && prevGenKey !== "") {
      setRawReport(null);
    }
  }

  const sites = useMemo(() => getUniqueSites(), []);
  const agents = useMemo(() => getUniqueAgentNames(), []);
  const zones = useMemo(() => getUniqueZoneNames(), []);

  // Filter data (live filtering without re-generating)
  const filteredReport = useMemo(() => {
    if (!rawReport) return null;
    return filterReport(rawReport, siteFilter, agentFilter, zoneFilter);
  }, [rawReport, siteFilter, agentFilter, zoneFilter]);

  const recordCount = filteredReport?.rows.length ?? 0;

  const summaryStats = useMemo((): SummaryStat[] => {
    if (!filteredReport) return [];
    switch (filteredReport.type) {
      case "presences":
        return getPresenceStats(filteredReport.rows);
      case "rondes":
        return getRondeStats(filteredReport.rows);
      case "deplacements":
        return getDeplacementStats(filteredReport.rows);
      case "incidents":
        return getIncidentStats(filteredReport.rows);
      case "zones":
        return getZoneStats(filteredReport.rows);
    }
  }, [filteredReport]);

  const chartData = useMemo(() => {
    if (!filteredReport) return null;
    switch (filteredReport.type) {
      case "presences":
        return {
          data: buildPresencesCharts(filteredReport.rows),
          histogramTitle: "Présences par jour",
          pieTitle: "Répartition par statut",
        };
      case "rondes":
        return {
          data: buildRondesCharts(filteredReport.rows),
          histogramTitle: "Rondes par jour",
          pieTitle: "Répartition par statut",
        };
      case "deplacements":
        return {
          data: buildDeplacementsCharts(filteredReport.rows),
          histogramTitle: "Distance parcourue par jour (km)",
          pieTitle: "Temps en mouvement vs à l'arrêt",
        };
      case "incidents":
        return {
          data: buildIncidentsCharts(filteredReport.rows),
          histogramTitle: "Incidents par jour",
          pieTitle: "Répartition par gravité",
        };
      case "zones":
        return {
          data: buildZonesCharts(filteredReport.rows),
          histogramTitle: "Top 5 zones — entrées",
          pieTitle: "Répartition des entrées",
        };
    }
  }, [filteredReport]);

  const handleGenerate = () => {
    switch (reportType) {
      case "presences":
        setRawReport({
          type: "presences",
          rows: generatePresenceReport(startDate, endDate),
        });
        break;
      case "rondes":
        setRawReport({
          type: "rondes",
          rows: generateRondeReport(startDate, endDate),
        });
        break;
      case "deplacements":
        setRawReport({
          type: "deplacements",
          rows: generateDeplacementReport(startDate, endDate),
        });
        break;
      case "incidents":
        setRawReport({
          type: "incidents",
          rows: generateIncidentReport(startDate, endDate),
        });
        break;
      case "zones":
        setRawReport({
          type: "zones",
          rows: generateZoneActivityReport(startDate, endDate),
        });
        break;
    }
  };

  const period = `${formatDate(startDate)} — ${formatDate(endDate)}`;
  const fileBase = `rapport-${reportType}-${startDate}-${endDate}`;
  const title = REPORT_TYPE_CONFIG[reportType].label;

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    if (!filteredReport) return;
    let exportData: { headers: string[]; rows: string[][] };

    switch (filteredReport.type) {
      case "presences":
        exportData = prepareExportData(
          filteredReport.rows,
          getPresenceColumns(),
        );
        break;
      case "rondes":
        exportData = prepareExportData(filteredReport.rows, getRondeColumns());
        break;
      case "deplacements":
        exportData = prepareExportData(
          filteredReport.rows,
          getDeplacementColumns(),
        );
        break;
      case "incidents":
        exportData = prepareExportData(
          filteredReport.rows,
          getIncidentColumns(),
        );
        break;
      case "zones":
        exportData = prepareExportData(
          filteredReport.rows,
          getZoneActivityColumns(),
        );
        break;
    }

    switch (format) {
      case "csv":
        exportCSV(exportData.headers, exportData.rows, fileBase);
        break;
      case "excel":
        exportExcel(exportData.headers, exportData.rows, fileBase);
        break;
      case "pdf":
        void exportPDF({
          headers: exportData.headers,
          rows: exportData.rows,
          title,
          period,
          recordCount,
          filename: fileBase,
        });
        break;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapports</h1>
          <p className="text-sm text-muted-foreground">
            Générez et exportez des rapports de géolocalisation détaillés
          </p>
        </div>
        <div className="flex gap-2">
          {isKpiEditMode && (
            <button
              onClick={() => setIsKpiEditMode(false)}
              className="h-9 px-3 text-sm rounded-md border border-input text-muted-foreground hover:bg-accent transition-colors"
            >
              Quitter Édition
            </button>
          )}
          <PersonnaliserButton onClick={() => setIsDialogOpen(true)} />
          <CustomizerModal
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            configs={widgetConfigs}
            isEditMode={isKpiEditMode}
            onToggleEditMode={() => setIsKpiEditMode(!isKpiEditMode)}
            onDragEnd={handleDragEnd}
            onToggle={toggleVisibility}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
          />
        </div>
      </div>

      {/* KPI Dashboard */}
      {isKpiEditMode ? (
        <WidgetGrid
          configs={widgetConfigs}
          isEditMode={isKpiEditMode}
          renderWidget={renderKpiWidget}
          onToggle={toggleVisibility}
          onGridDragEnd={handleGridDragEnd}
          gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
        />
      ) : (
        visibleKpiWidgets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {visibleKpiWidgets.map((config) => (
              <div key={config.id} className="h-full">
                {renderKpiWidget(config)}
              </div>
            ))}
          </div>
        )
      )}

      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-2">
        {REPORT_TYPES.map((type) => {
          const config = REPORT_TYPE_CONFIG[type];
          const Icon = REPORT_TYPE_ICONS[type];
          return (
            <button
              key={type}
              onClick={() => setReportType(type)}
              aria-pressed={reportType === type}
              className={cn(
                "flex items-center gap-2 h-9 px-4 text-sm rounded-md border transition-colors",
                reportType === type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Date début
          </label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-sm rounded-md border border-input bg-background pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Date fin
          </label>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-sm rounded-md border border-input bg-background pl-8 pr-3 focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Site
          </label>
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="w-[220px] h-9">
              <SelectValue placeholder="Tous les sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sites</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Agent
          </label>
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Tous les agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les agents</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Zone
          </label>
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="Toutes les zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les zones</SelectItem>
              {zones.map((z) => (
                <SelectItem key={z} value={z}>
                  {z}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="primary"
          className="h-9 gap-2"
          onClick={handleGenerate}
        >
          <Play className="h-4 w-4" />
          Générer le rapport
        </Button>
      </div>

      {/* Generated Content */}
      {filteredReport && (
        <>
          {/* Summary Cards */}
          {summaryStats.length > 0 && (
            <InfoCardContainer>
              {summaryStats.map((stat) => (
                <InfoCard
                  key={stat.title}
                  icon={stat.icon}
                  title={stat.title}
                  value={stat.value}
                  subtext={stat.subtext}
                  color={stat.color}
                />
              ))}
            </InfoCardContainer>
          )}

          {/* Charts */}
          {chartData && (
            <ReportCharts
              data={chartData.data}
              histogramTitle={chartData.histogramTitle}
              pieTitle={chartData.pieTitle}
            />
          )}

          {/* Export Bar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">
                {recordCount}
              </span>{" "}
              enregistrement{recordCount !== 1 ? "s" : ""} trouvé
              {recordCount !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleExport("pdf")}
                disabled={recordCount === 0}
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleExport("excel")}
                disabled={recordCount === 0}
              >
                <Table2 className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => handleExport("csv")}
                disabled={recordCount === 0}
              >
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>

          {/* Data Tables — one per report type for proper typing */}
          {filteredReport.type === "presences" && (
            <DataTable
              data={filteredReport.rows}
              columns={getPresenceColumns()}
              searchKeys={["agentName", "site"]}
              searchPlaceholder="Rechercher par agent, site..."
              itemsPerPage={10}
              onRowClick={(row) => setDetailRow({ type: "presences", row })}
            />
          )}
          {filteredReport.type === "rondes" && (
            <DataTable
              data={filteredReport.rows}
              columns={getRondeColumns()}
              searchKeys={["agentName", "routeName"]}
              searchPlaceholder="Rechercher par agent, ronde..."
              itemsPerPage={10}
              onRowClick={(row) => setDetailRow({ type: "rondes", row })}
            />
          )}
          {filteredReport.type === "deplacements" && (
            <DataTable
              data={filteredReport.rows}
              columns={getDeplacementColumns()}
              searchKeys={["agentName", "site"]}
              searchPlaceholder="Rechercher par agent, site..."
              itemsPerPage={10}
              onRowClick={(row) => setDetailRow({ type: "deplacements", row })}
            />
          )}
          {filteredReport.type === "incidents" && (
            <DataTable
              data={filteredReport.rows}
              columns={getIncidentColumns()}
              searchKeys={["agentName", "type"]}
              searchPlaceholder="Rechercher par agent, type..."
              itemsPerPage={10}
              onRowClick={(row) => setDetailRow({ type: "incidents", row })}
            />
          )}
          {filteredReport.type === "zones" && (
            <DataTable
              data={filteredReport.rows}
              columns={getZoneActivityColumns()}
              searchKeys={["zoneName", "site"]}
              searchPlaceholder="Rechercher par zone, site..."
              itemsPerPage={10}
              onRowClick={(row) => setDetailRow({ type: "zones", row })}
            />
          )}
        </>
      )}

      {/* Empty State */}
      {!filteredReport && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">Aucun rapport généré</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Sélectionnez un type de rapport, configurez vos filtres et cliquez
            sur &quot;Générer le rapport&quot; pour afficher les données.
          </p>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={detailRow !== null}
        onOpenChange={(open) => {
          if (!open) setDetailRow(null);
        }}
        type="details"
        size="lg"
        title={detailRow ? getDetailTitle(detailRow) : ""}
        description={REPORT_TYPE_CONFIG[reportType].description}
      >
        {detailRow?.type === "presences" && (
          <PresenceDetail row={detailRow.row} />
        )}
        {detailRow?.type === "rondes" && <RondeDetail row={detailRow.row} />}
        {detailRow?.type === "deplacements" && (
          <DeplacementDetail row={detailRow.row} />
        )}
        {detailRow?.type === "incidents" && (
          <IncidentDetail row={detailRow.row} />
        )}
        {detailRow?.type === "zones" && (
          <ZoneActivityDetail row={detailRow.row} />
        )}
      </Modal>
    </div>
  );
}
