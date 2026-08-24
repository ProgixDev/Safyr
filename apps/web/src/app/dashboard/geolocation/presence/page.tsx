"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Timer,
  CalendarClock,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { DataTable } from "@/components/ui/DataTable";
import type { ColumnDef, FilterDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PresenceDetailPanel } from "@/components/geolocation/PresenceDetailPanel";
import { mockGeolocationAgents } from "@/data/geolocation-agents";
import { mockGeolocationZones } from "@/data/geolocation-zones";
import {
  getMockShiftAssignments,
  getMockShiftAssignmentsForPeriod,
  computePresenceRecords,
  computeCumulativeSummary,
  PRESENCE_STATUS_CONFIG,
  PRESENCE_STATUSES,
  formatDuration,
  computeDeltaColor,
} from "@/data/geolocation-presence";
import type {
  PresenceRecord,
  AgentCumulativeSummary,
} from "@/data/geolocation-presence";
import { cn, getInitials } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────

function formatFrenchDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday-based week
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { start, end };
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
}

// ── Columns ──────────────────────────────────────────────────────────

const columns: ColumnDef<PresenceRecord>[] = [
  {
    key: "agentName",
    label: "Agent",
    render: (record) => {
      const config = PRESENCE_STATUS_CONFIG[record.status];
      return (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
              config.avatarClass,
            )}
          >
            {getInitials(record.agentName)}
          </div>
          <span className="font-medium text-sm">{record.agentName}</span>
        </div>
      );
    },
  },
  {
    key: "siteName",
    label: "Site Assigné",
    render: (record) => (
      <span className="text-sm text-muted-foreground">{record.siteName}</span>
    ),
  },
  {
    key: "shiftStart",
    label: "Vacation",
    render: (record) => (
      <span className="text-sm tabular-nums">
        {record.shiftStart} – {record.shiftEnd}
      </span>
    ),
    sortable: true,
    sortValue: (record) => record.shiftStart,
  },
  {
    key: "plannedDurationMinutes",
    label: "Prévues",
    render: (record) => (
      <span className="text-sm tabular-nums text-muted-foreground">
        {formatDuration(record.plannedDurationMinutes)}
      </span>
    ),
    sortable: true,
    sortValue: (record) => record.plannedDurationMinutes,
  },
  {
    key: "actualDurationMinutes",
    label: "Réalisées",
    render: (record) =>
      record.actualDurationMinutes !== null ? (
        <span className="text-sm tabular-nums">
          {formatDuration(record.actualDurationMinutes)}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
    sortable: true,
    sortValue: (record) => record.actualDurationMinutes ?? -1,
  },
  {
    key: "deltaMinutes",
    label: "Écart",
    render: (record) => {
      if (record.deltaMinutes === null) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      const sign = record.deltaMinutes >= 0 ? "+" : "-";
      return (
        <span
          className={cn(
            "text-sm tabular-nums font-medium",
            computeDeltaColor(record.deltaMinutes),
          )}
        >
          {sign}
          {formatDuration(Math.abs(record.deltaMinutes))}
        </span>
      );
    },
    sortable: true,
    sortValue: (record) => record.deltaMinutes ?? 0,
  },
  {
    key: "status",
    label: "Statut",
    render: (record) => {
      const config = PRESENCE_STATUS_CONFIG[record.status];
      return (
        <Badge
          variant={config.badgeVariant}
          className={cn("gap-1", config.badgeClassName)}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
          {config.label}
        </Badge>
      );
    },
    sortable: true,
    sortValue: (record) => {
      const order = { present: 0, late: 1, "off-zone": 2, absent: 3 };
      return order[record.status];
    },
  },
  {
    key: "lastSeenAt",
    label: "Dernière position",
    render: (record) =>
      record.lastSeenAt ? (
        <span className="text-sm tabular-nums">
          {new Date(record.lastSeenAt).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground italic">
          Aucun signal
        </span>
      ),
    sortable: true,
    sortValue: (record) => record.lastSeenAt ?? "",
  },
  {
    key: "anomalies",
    label: "Anomalies",
    render: (record) =>
      record.anomalies.length > 0 ? (
        <Badge variant="error" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {record.anomalies.length}
        </Badge>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
    sortable: true,
    sortValue: (record) => record.anomalies.length,
  },
];

// ── Cumulative columns (week / month) ────────────────────────────────

const cumulativeColumns: ColumnDef<AgentCumulativeSummary>[] = [
  {
    key: "agentName",
    label: "Agent",
    render: (entry) => (
      <span className="font-medium text-sm">{entry.agentName}</span>
    ),
    sortable: true,
    sortValue: (entry) => entry.agentName,
  },
  {
    key: "totalPlannedMinutes",
    label: "Total Prévues",
    render: (entry) => (
      <span className="text-sm tabular-nums text-muted-foreground">
        {formatDuration(entry.totalPlannedMinutes)}
      </span>
    ),
    sortable: true,
    sortValue: (entry) => entry.totalPlannedMinutes,
  },
  {
    key: "totalActualMinutes",
    label: "Total Réalisées",
    render: (entry) =>
      entry.totalActualMinutes > 0 ? (
        <span className="text-sm tabular-nums">
          {formatDuration(entry.totalActualMinutes)}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      ),
    sortable: true,
    sortValue: (entry) => entry.totalActualMinutes,
  },
  {
    key: "totalDeltaMinutes",
    label: "Écart",
    render: (entry) => {
      if (entry.totalActualMinutes === 0) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      const sign = entry.totalDeltaMinutes >= 0 ? "+" : "-";
      return (
        <span
          className={cn(
            "text-sm tabular-nums font-medium",
            computeDeltaColor(entry.totalDeltaMinutes),
          )}
        >
          {sign}
          {formatDuration(Math.abs(entry.totalDeltaMinutes))}
        </span>
      );
    },
    sortable: true,
    sortValue: (entry) => entry.totalDeltaMinutes,
  },
  {
    key: "daysWorked",
    label: "Jours travaillés",
    render: (entry) => (
      <span className="text-sm tabular-nums text-muted-foreground">
        {entry.daysWorked}j
      </span>
    ),
    sortable: true,
    sortValue: (entry) => entry.daysWorked,
  },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Tous" },
  ...PRESENCE_STATUSES.map((s) => ({
    value: s,
    label: PRESENCE_STATUS_CONFIG[s].label,
  })),
];

// ── Page ─────────────────────────────────────────────────────────────

export default function PresenceControlPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");

  const dateStr = toDateStr(selectedDate);

  // Date range for current period
  const periodRange = useMemo(() => {
    if (period === "week") return getWeekRange(selectedDate);
    if (period === "month") return getMonthRange(selectedDate);
    return { start: selectedDate, end: selectedDate };
  }, [period, selectedDate]);

  // Shifts for current period
  const periodShifts = useMemo(() => {
    if (period === "day") return getMockShiftAssignments(dateStr);
    return getMockShiftAssignmentsForPeriod(
      toDateStr(periodRange.start),
      toDateStr(periodRange.end),
    );
  }, [period, dateStr, periodRange]);

  // Presence records for current period (used for totals and cumulative)
  const periodRecords = useMemo(
    () =>
      computePresenceRecords(
        periodShifts,
        mockGeolocationAgents,
        mockGeolocationZones,
      ),
    [periodShifts],
  );

  // For the day-view table, always use single-day records
  const dayRecords = useMemo(
    () =>
      period === "day"
        ? periodRecords
        : computePresenceRecords(
            getMockShiftAssignments(dateStr),
            mockGeolocationAgents,
            mockGeolocationZones,
          ),
    [period, periodRecords, dateStr],
  );

  // Cumulative per-agent summary for week/month views
  const cumulativeSummary = useMemo(
    () => computeCumulativeSummary(periodRecords),
    [periodRecords],
  );

  // Records grouped by agentId for the expandable rows
  const agentPeriodRecords = useMemo(() => {
    const map = new Map<string, PresenceRecord[]>();
    for (const r of periodRecords) {
      const list = map.get(r.agentId) ?? [];
      list.push(r);
      map.set(r.agentId, list);
    }
    // Sort each agent's records by date then shiftStart
    for (const list of map.values()) {
      list.sort((a, b) =>
        a.date !== b.date
          ? a.date.localeCompare(b.date)
          : a.shiftStart.localeCompare(b.shiftStart),
      );
    }
    return map;
  }, [periodRecords]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      total: periodRecords.length,
      present: 0,
      late: 0,
      absent: 0,
      "off-zone": 0,
    };
    for (const r of periodRecords) counts[r.status]++;
    return counts;
  }, [periodRecords]);

  const hourTotals = useMemo(() => {
    const totalPlanned = periodRecords.reduce(
      (sum, r) => sum + r.plannedDurationMinutes,
      0,
    );
    const totalActual = periodRecords.reduce(
      (sum, r) => sum + (r.actualDurationMinutes ?? 0),
      0,
    );
    return { totalPlanned, totalActual };
  }, [periodRecords]);

  // Unique sites for the day-view filter
  const siteOptions = useMemo(() => {
    const sites = Array.from(
      new Set(getMockShiftAssignments(dateStr).map((s) => s.siteName)),
    );
    return [
      { value: "all", label: "Tous les sites" },
      ...sites.map((s) => ({ value: s, label: s })),
    ];
  }, [dateStr]);

  const filters: FilterDef[] = [
    { key: "siteName", label: "Site", options: siteOptions },
    { key: "status", label: "Statut", options: STATUS_OPTIONS },
  ];

  const findZone = (zoneId: string) =>
    mockGeolocationZones.find((z) => z.id === zoneId);

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const todayStr = toDateStr(new Date());

  // Period-aware navigation
  const navigate = (direction: 1 | -1) => {
    if (period === "week") {
      setSelectedDate(addDays(selectedDate, 7 * direction));
    } else if (period === "month") {
      const d = new Date(selectedDate);
      d.setMonth(d.getMonth() + direction);
      setSelectedDate(d);
    } else {
      setSelectedDate(addDays(selectedDate, direction));
    }
  };

  // Date display label
  const dateLabel = useMemo(() => {
    if (period === "day") return formatFrenchDate(selectedDate);
    if (period === "week") {
      const fmt = (d: Date) =>
        d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      return `Semaine du ${fmt(periodRange.start)} au ${fmt(periodRange.end)}`;
    }
    return selectedDate
      .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
      .replace(/^\w/, (c) => c.toUpperCase());
  }, [period, selectedDate, periodRange]);

  const periodSubtext = period === "day" ? "du jour" : "sur la période";

  return (
    <div className="space-y-6 p-6 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Pointage</h1>
        <p className="text-muted-foreground">
          Vérification des présences par rapport au planning
        </p>
      </div>

      {/* Summary InfoCards */}
      <div aria-live="polite" className="space-y-4">
        <InfoCardContainer>
          <InfoCard
            icon={CalendarCheck}
            title="Planifiés"
            value={statusCounts.total}
            subtext={`Vacations ${periodSubtext}`}
            color="blue"
          />
          <InfoCard
            icon={CheckCircle}
            title="Présents"
            value={statusCounts.present}
            subtext="Agents confirmés"
            color="green"
          />
          <InfoCard
            icon={Clock}
            title="En retard"
            value={statusCounts.late}
            subtext="Arrivée tardive"
            color="orange"
          />
          <InfoCard
            icon={AlertTriangle}
            title="Anomalies"
            value={statusCounts.absent + statusCounts["off-zone"]}
            subtext={`${statusCounts.absent} absent · ${statusCounts["off-zone"]} hors zone`}
            color="red"
          />
        </InfoCardContainer>
        <InfoCardContainer className="lg:grid-cols-2">
          <InfoCard
            icon={Timer}
            title="Heures prévues"
            value={formatDuration(hourTotals.totalPlanned)}
            subtext={`Total ${periodSubtext}`}
            color="blue"
          />
          <InfoCard
            icon={CalendarClock}
            title="Heures réalisées"
            value={formatDuration(hourTotals.totalActual)}
            subtext={`Total ${periodSubtext}`}
            color="green"
          />
        </InfoCardContainer>
      </div>

      {/* Period Selector + Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as "day" | "week" | "month")}
        >
          <TabsList className="w-fit">
            <TabsTrigger value="day">Jour</TabsTrigger>
            <TabsTrigger value="week">Semaine</TabsTrigger>
            <TabsTrigger value="month">Mois</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => navigate(-1)}
            aria-label="Période précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span
            className="text-sm font-medium min-w-[200px] text-center capitalize"
            aria-live="polite"
          >
            {dateLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => navigate(1)}
            aria-label="Période suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isToday && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Aujourd&apos;hui
            </Button>
          )}
        </div>
      </div>

      {/* Day view — full presence table */}
      {period === "day" &&
        (dayRecords.length > 0 ? (
          <DataTable
            data={dayRecords}
            columns={columns}
            filters={filters}
            searchKeys={["agentName", "siteName"]}
            searchPlaceholder="Rechercher un agent ou un site..."
            itemsPerPage={10}
            getRowId={(record) => record.id}
            expandableContent={(record) => (
              <PresenceDetailPanel
                record={record}
                zone={findZone(record.zoneId)}
              />
            )}
            rowClassName={(record) =>
              cn(
                "border-l-2",
                record.status === "present" && "border-l-emerald-500/50",
                record.status === "late" && "border-l-yellow-500/50",
                record.status === "absent" && "border-l-red-500/50",
                record.status === "off-zone" && "border-l-orange-500/50",
              )
            }
            actions={(record) => (
              <RowActionsMenu
                extraItems={[
                  {
                    label: "Localiser sur la carte",
                    icon: MapPin,
                    tone: "locate" as const,
                    onClick: () =>
                      router.push(
                        `/dashboard/geolocation/live?agent=${record.agentId}`,
                      ),
                  },
                ]}
              />
            )}
          />
        ) : (
          <div className="rounded-xl border border-border/40 bg-card p-12 text-center">
            <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Aucune vacation planifiée pour cette date
            </p>
            {!isToday && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setSelectedDate(new Date())}
              >
                Retour à aujourd&apos;hui
              </Button>
            )}
          </div>
        ))}

      {/* Week / Month view — cumulative per-agent summary */}
      {period !== "day" && (
        <DataTable
          data={cumulativeSummary}
          columns={cumulativeColumns}
          searchKeys={["agentName"]}
          searchPlaceholder="Rechercher un agent..."
          itemsPerPage={10}
          getRowId={(entry) => entry.agentId}
          expandableContent={(entry) => {
            const agentRecords = agentPeriodRecords.get(entry.agentId) ?? [];
            return (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vacation</TableHead>
                      <TableHead className="text-right">Prévues</TableHead>
                      <TableHead className="text-right">Réalisées</TableHead>
                      <TableHead className="text-right">Écart</TableHead>
                      <TableHead className="text-right">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentRecords.map((r) => {
                      const statusCfg = PRESENCE_STATUS_CONFIG[r.status];
                      const delta = r.deltaMinutes;
                      const deltaSign =
                        delta !== null && delta >= 0 ? "+" : "-";
                      const isRecordToday = r.date === todayStr;
                      return (
                        <TableRow
                          key={r.id}
                          className={cn(
                            isRecordToday &&
                              "bg-primary/5 border-l-2 border-l-primary/40",
                          )}
                        >
                          <TableCell
                            className={cn(
                              "capitalize",
                              isRecordToday
                                ? "text-primary font-medium"
                                : "text-muted-foreground",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {new Date(r.date).toLocaleDateString("fr-FR", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                              {isRecordToday && (
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {r.shiftStart} – {r.shiftEnd}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatDuration(r.plannedDurationMinutes)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.actualDurationMinutes !== null
                              ? formatDuration(r.actualDurationMinutes)
                              : "—"}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right tabular-nums font-medium",
                              delta !== null
                                ? computeDeltaColor(delta)
                                : "text-muted-foreground",
                            )}
                          >
                            {delta !== null
                              ? `${deltaSign}${formatDuration(Math.abs(delta))}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={statusCfg.badgeVariant}
                              className={cn("gap-1", statusCfg.badgeClassName)}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  statusCfg.dotClass,
                                )}
                              />
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          }}
        />
      )}
    </div>
  );
}
