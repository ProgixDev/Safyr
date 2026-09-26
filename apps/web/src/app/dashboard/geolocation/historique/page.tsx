"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Flame,
  MapPin,
  MessageSquare,
  PanelRight,
  Pause,
  Play,
  User,
  X,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/DataTable";
import type { ColumnDef } from "@/components/ui/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PatrolMap } from "@/components/geolocation/PatrolMap";
import { PatrolIncidentModal } from "@/components/geolocation/PatrolIncidentModal";
import { PatrolReportEmailModal } from "@/components/geolocation/PatrolReportEmailModal";
import type {
  CheckpointScan,
  PatrolExecution,
} from "@/data/geolocation-patrols";
import {
  getPatrolDisplayStatus,
  getPatrolHistory,
  getRouteById,
  mockPatrolExecutions,
  mockPatrolRoutes,
  PATROL_STATUS_CONFIG,
} from "@/data/geolocation-patrols";
import { generatePatrolReport } from "@/lib/patrol-report-pdf";

// ── Display status config ────────────────────────────────────────────

type DisplayStatus = "all" | "complete" | "incomplete" | "incident";

const DISPLAY_STATUS_TABS: { value: DisplayStatus; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "complete", label: "Complètes" },
  { value: "incomplete", label: "Incomplètes" },
  { value: "incident", label: "Incidents" },
];

// ── Helpers ──────────────────────────────────────────────────────────

function formatFrenchDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFrenchDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDistance(meters: number | null): string {
  if (meters === null) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}

// ── Column definitions ───────────────────────────────────────────────

const historyColumns: ColumnDef<PatrolExecution>[] = [
  {
    key: "startedAt",
    label: "Date",
    render: (item) => (
      <span className="text-xs">{formatFrenchDate(item.startedAt)}</span>
    ),
    sortValue: (item) => new Date(item.startedAt).getTime(),
  },
  {
    key: "site",
    label: "Site",
    render: (item) => (
      <span className="text-xs truncate max-w-[100px] block">{item.site}</span>
    ),
  },
  {
    key: "agentName",
    label: "Agent",
    render: (item) => (
      <div className="flex items-center gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400 shrink-0">
          <User className="h-2.5 w-2.5" />
        </div>
        <span className="text-xs">{item.agentName}</span>
      </div>
    ),
  },
  {
    key: "completionRate",
    label: "Taux",
    render: (item) => (
      <span
        className={cn(
          "text-xs font-semibold",
          item.completionRate >= 80
            ? "text-emerald-400"
            : item.completionRate >= 50
              ? "text-amber-400"
              : "text-red-400",
        )}
      >
        {item.completionRate}%
      </span>
    ),
    sortValue: (item) => item.completionRate,
  },
  {
    key: "status",
    label: "Statut",
    render: (item) => {
      const displayStatus = getPatrolDisplayStatus(item);
      if (displayStatus === "incident") {
        return (
          <Badge variant="error" className="text-[10px] px-1.5 py-0 gap-1">
            <Flame className="h-2.5 w-2.5" />
            Incident
          </Badge>
        );
      }
      const config = PATROL_STATUS_CONFIG[item.status];
      return (
        <Badge
          variant={config.badgeVariant}
          className="text-[10px] px-1.5 py-0"
        >
          {displayStatus === "complete" ? "Complète" : "Incomplète"}
        </Badge>
      );
    },
  },
];

// ── Page component ───────────────────────────────────────────────────

export default function HistoriquePage() {
  const allHistory = useMemo(() => getPatrolHistory(mockPatrolExecutions), []);

  // ── Filter state ──────────────────────────────────────────────────
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<DisplayStatus>("all");

  // ── Selection & sidebar state ─────────────────────────────────────
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
    null,
  );
  const [showSidebar, setShowSidebar] = useState(true);

  // ── Replay state ──────────────────────────────────────────────────
  const [replayProgress, setReplayProgress] = useState(0);
  const [isReplaying, setIsReplaying] = useState(false);
  const replayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Incident modal state ──────────────────────────────────────────
  const [incidentModal, setIncidentModal] = useState<{
    open: boolean;
    scan: CheckpointScan | null;
    scanIndex: number;
  }>({ open: false, scan: null, scanIndex: 0 });

  // ── Email modal state ─────────────────────────────────────────────
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<
    "responsable" | "client" | null
  >(null);

  // ── Replay timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (isReplaying) {
      replayRef.current = setInterval(() => {
        setReplayProgress((prev) => {
          if (prev >= 1) {
            setIsReplaying(false);
            return 1;
          }
          return Math.min(prev + 0.005, 1);
        });
      }, 50);
    } else if (replayRef.current) {
      clearInterval(replayRef.current);
      replayRef.current = null;
    }
    return () => {
      if (replayRef.current) clearInterval(replayRef.current);
    };
  }, [isReplaying]);

  // ── Derived filter options ────────────────────────────────────────

  const availableSites = useMemo(() => {
    return Array.from(new Set(allHistory.map((e) => e.site))).sort();
  }, [allHistory]);

  const availableClients = useMemo(() => {
    return Array.from(
      new Set(allHistory.map((e) => e.client).filter(Boolean) as string[]),
    ).sort();
  }, [allHistory]);

  // ── Filtered executions ───────────────────────────────────────────

  const filteredExecutions = useMemo(() => {
    const startMs = startDateFilter
      ? new Date(startDateFilter).getTime()
      : null;
    const endMs = endDateFilter
      ? new Date(endDateFilter).getTime() + 24 * 60 * 60 * 1000 - 1
      : null;
    return allHistory.filter((e) => {
      const ts = new Date(e.startedAt).getTime();
      if (startMs !== null && ts < startMs) return false;
      if (endMs !== null && ts > endMs) return false;
      if (siteFilter !== "all" && e.site !== siteFilter) return false;
      if (clientFilter !== "all" && e.client !== clientFilter) return false;
      if (statusFilter !== "all") {
        const ds = getPatrolDisplayStatus(e);
        if (ds !== statusFilter) return false;
      }
      return true;
    });
  }, [
    allHistory,
    startDateFilter,
    endDateFilter,
    siteFilter,
    clientFilter,
    statusFilter,
  ]);

  // ── Derived selection data ────────────────────────────────────────

  const selectedExecution = useMemo(
    () =>
      selectedExecutionId
        ? (mockPatrolExecutions.find((e) => e.id === selectedExecutionId) ??
          null)
        : null,
    [selectedExecutionId],
  );

  const selectedRoute = useMemo(
    () =>
      selectedExecution
        ? (getRouteById(mockPatrolRoutes, selectedExecution.routeId) ?? null)
        : null,
    [selectedExecution],
  );

  // ── Handlers ──────────────────────────────────────────────────────

  const handleSelectExecution = useCallback((id: string) => {
    if (!id) {
      setSelectedExecutionId(null);
      setReplayProgress(0);
      setIsReplaying(false);
      return;
    }
    setSelectedExecutionId(id);
    setReplayProgress(0);
    setIsReplaying(false);
    setShowSidebar(true);
  }, []);

  const handleToggleReplay = useCallback(() => {
    setIsReplaying((prev) => {
      if (!prev && replayProgress >= 1) setReplayProgress(0);
      return !prev;
    });
  }, [replayProgress]);

  function handleGenerateReport() {
    if (!selectedExecution) return;
    const checkpoints = selectedRoute?.checkpoints ?? [];
    void generatePatrolReport(selectedExecution, checkpoints);
  }

  // ── Map props ─────────────────────────────────────────────────────

  const mapProps = useMemo(() => {
    if (selectedExecution && selectedRoute) {
      return {
        execution: selectedExecution,
        route: selectedRoute,
        routeCheckpoints: selectedRoute.checkpoints,
        replayProgress,
      };
    }
    return {};
  }, [selectedExecution, selectedRoute, replayProgress]);

  // ── Sidebar content ───────────────────────────────────────────────

  const renderDetail = () => {
    if (!selectedExecution) return null;
    const statusConfig = PATROL_STATUS_CONFIG[selectedExecution.status];
    const displayStatus = getPatrolDisplayStatus(selectedExecution);
    const scannedCount = selectedExecution.checkpointScans.filter(
      (s) => s.status === "validated",
    ).length;
    const missedCount = selectedExecution.checkpointScans.filter(
      (s) => s.status === "missed",
    ).length;
    const totalCount = selectedExecution.checkpointScans.length;

    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Back button */}
          <button
            onClick={() => handleSelectExecution("")}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour à l&apos;historique
          </button>

          {/* Agent + route */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400 shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">
                {selectedExecution.agentName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {selectedExecution.routeName}
              </p>
            </div>
            {displayStatus === "incident" ? (
              <Badge
                variant="error"
                className="ml-auto text-[10px] px-1.5 py-0 gap-1 shrink-0"
              >
                <Flame className="h-2.5 w-2.5" />
                Incident
              </Badge>
            ) : (
              <Badge
                variant={statusConfig.badgeVariant}
                className="ml-auto text-[10px] px-1.5 py-0 shrink-0"
              >
                {displayStatus === "complete" ? "Complète" : "Incomplète"}
              </Badge>
            )}
          </div>

          {/* Site & client */}
          <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
              <span>{selectedExecution.site}</span>
            </div>
            {selectedExecution.client && (
              <p className="text-[10px] text-muted-foreground pl-5">
                {selectedExecution.client}
              </p>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Date
              </div>
              <div className="text-xs font-semibold">
                {formatFrenchDateTime(selectedExecution.startedAt)}
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Durée
              </div>
              <div className="text-xs font-semibold">
                {selectedExecution.actualDurationMinutes !== null
                  ? `${selectedExecution.actualDurationMinutes} min`
                  : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Distance
              </div>
              <div className="text-xs font-semibold">
                {formatDistance(selectedExecution.actualDistanceMeters)}
              </div>
            </div>
          </div>

          {/* Completion rate */}
          <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
              Taux de complétion
            </div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "text-lg font-bold",
                  selectedExecution.completionRate >= 80
                    ? "text-emerald-400"
                    : selectedExecution.completionRate >= 50
                      ? "text-amber-400"
                      : "text-red-400",
                )}
              >
                {selectedExecution.completionRate}%
              </span>
              <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    selectedExecution.completionRate >= 80
                      ? "bg-emerald-500"
                      : selectedExecution.completionRate >= 50
                        ? "bg-amber-500"
                        : "bg-red-500",
                  )}
                  style={{ width: `${selectedExecution.completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Checkpoint counts */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-muted-foreground">
                {scannedCount} validés
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <XCircle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-muted-foreground">
                {missedCount} manqués
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{totalCount} total</span>
            </div>
          </div>

          {/* Replay controls */}
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Rejouer le trajet
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 shrink-0"
                onClick={handleToggleReplay}
              >
                {isReplaying ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </Button>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(replayProgress * 100)}
                onChange={(e) =>
                  setReplayProgress(Number(e.target.value) / 100)
                }
                className="flex-1 h-1.5 accent-cyan-500"
              />
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                {Math.round(replayProgress * 100)}%
              </span>
            </div>
          </div>

          {/* Checkpoint timeline */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
              Points de contrôle
            </div>
            <div className="relative pl-4 space-y-3">
              <div
                className="absolute left-[7px] top-1 bottom-1 w-px bg-border/50"
                aria-hidden="true"
              />
              {selectedExecution.checkpointScans.map((scan, index) => {
                const hasIncident =
                  scan.status === "missed" &&
                  !!(scan.incidentDescription ?? scan.comment);
                const checkpoint = selectedRoute?.checkpoints.find(
                  (cp) => cp.id === scan.checkpointId,
                );
                const dotColor =
                  scan.status === "validated"
                    ? "bg-emerald-500"
                    : scan.status === "missed"
                      ? "bg-red-500"
                      : "bg-slate-500";

                const RowTag = hasIncident ? "button" : "div";
                return (
                  <RowTag
                    key={scan.checkpointId}
                    onClick={
                      hasIncident
                        ? () =>
                            setIncidentModal({
                              open: true,
                              scan,
                              scanIndex: index,
                            })
                        : undefined
                    }
                    type={hasIncident ? "button" : undefined}
                    aria-label={
                      hasIncident
                        ? `Ouvrir l'incident sur ${checkpoint?.name ?? `Point ${index + 1}`}`
                        : undefined
                    }
                    className={cn(
                      "relative flex items-start gap-3 w-full text-left rounded-md -mx-1 px-1 py-0.5",
                      hasIncident &&
                        "cursor-pointer hover:bg-red-500/8 transition-colors",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute -left-4 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-background shrink-0 z-10",
                        dotColor,
                      )}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono tabular-nums text-muted-foreground shrink-0">
                          {scan.scannedAt
                            ? new Date(scan.scannedAt).toLocaleTimeString(
                                "fr-FR",
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "—:—"}
                        </span>
                        <span className="text-xs font-medium">
                          {checkpoint?.name ?? `Point ${index + 1}`}
                        </span>
                        <Badge
                          variant={
                            scan.status === "validated"
                              ? "success"
                              : scan.status === "missed"
                                ? "error"
                                : "muted"
                          }
                          className="text-[9px] px-1 py-0"
                        >
                          {scan.status === "validated"
                            ? "Validé"
                            : scan.status === "missed"
                              ? "Manqué"
                              : "En attente"}
                        </Badge>
                        {hasIncident && (
                          <span className="flex items-center gap-1 text-[9px] font-medium text-red-400 border border-red-500/30 bg-red-500/8 rounded px-1.5 py-0">
                            <Flame className="h-2.5 w-2.5" />
                            Incident
                          </span>
                        )}
                      </div>
                      {scan.comment && (
                        <div className="flex items-start gap-1.5">
                          <MessageSquare className="h-3 w-3 text-muted-foreground/60 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                            {scan.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </RowTag>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action footer */}
        <div className="shrink-0 border-t border-border/50 p-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={handleGenerateReport}
          >
            Générer rapport
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => setEmailModalOpen(true)}
          >
            Envoyer par mail
          </Button>
        </div>
      </div>
    );
  };

  const renderList = () => (
    <div className="flex flex-col h-full min-h-0">
      {/* Filter bar */}
      <div className="shrink-0 p-3 border-b border-border/50 space-y-3">
        <div>
          <h2 className="text-sm font-bold">Historique des rondes</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {filteredExecutions.length} ronde
            {filteredExecutions.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground">
              Date début
            </label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="h-7 w-full text-xs rounded-md border border-input bg-background pl-6 pr-2 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground">
              Date fin
            </label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="h-7 w-full text-xs rounded-md border border-input bg-background pl-6 pr-2 focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Site / Client */}
        <div className="grid grid-cols-2 gap-1.5">
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sites</SelectItem>
              {availableSites.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {availableClients.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {DISPLAY_STATUS_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[10px] font-medium border transition-colors",
                statusFilter === value
                  ? value === "incident"
                    ? "border-red-500/50 bg-red-500/15 text-red-400"
                    : value === "complete"
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                      : value === "incomplete"
                        ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                        : "border-cyan-500/50 bg-cyan-500/15 text-cyan-400"
                  : "border-border/50 text-muted-foreground hover:bg-muted/40",
              )}
            >
              {value === "incident" && (
                <Flame className="h-2.5 w-2.5 inline mr-1" />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-3">
        <DataTable
          data={filteredExecutions}
          columns={historyColumns}
          filters={[]}
          getSearchValue={(item) =>
            `${item.agentName} ${item.routeName} ${item.site} ${item.client ?? ""}`
          }
          searchPlaceholder="Rechercher…"
          itemsPerPage={10}
          getRowId={(item) => item.id}
          onRowClick={(item) => handleSelectExecution(item.id)}
        />
      </div>
    </div>
  );

  const hasSelection = !!selectedExecution;

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="relative h-full">
      {/* Full-page map */}
      <PatrolMap
        className="absolute inset-0"
        {...mapProps}
        allRoutes={mockPatrolRoutes}
      />

      {/* ── Desktop sidebar ────────────────────────────────────────── */}
      {showSidebar && (
        <div
          className={cn(
            "hidden lg:flex absolute top-3 right-3 bottom-3 z-10 flex-col bg-background/80 backdrop-blur-md border border-border/50 rounded-xl shadow-lg overflow-hidden transition-all",
            hasSelection ? "w-96" : "w-[500px]",
          )}
        >
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1 shrink-0">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {hasSelection ? "Détail de la ronde" : "Historique"}
            </span>
            <button
              onClick={() => setShowSidebar(false)}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
              aria-label="Masquer le panneau"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {hasSelection ? renderDetail() : renderList()}
        </div>
      )}

      {/* Sidebar toggle (desktop, when sidebar is hidden) */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="hidden lg:flex absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl p-2.5 shadow-lg"
          aria-label="Afficher le panneau"
        >
          <PanelRight className="h-4 w-4" />
        </button>
      )}

      {/* ── Mobile sidebar (Sheet) ────────────────────────────────── */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="lg:hidden absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl p-2.5 shadow-lg">
            <PanelRight className="h-4 w-4" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-96 p-0">
          {hasSelection ? renderDetail() : renderList()}
        </SheetContent>
      </Sheet>

      {/* ── Incident modal ─────────────────────────────────────────── */}
      <PatrolIncidentModal
        open={incidentModal.open}
        onOpenChange={(open) => setIncidentModal((prev) => ({ ...prev, open }))}
        scan={incidentModal.scan}
        checkpoint={
          selectedRoute?.checkpoints.find(
            (cp) => cp.id === incidentModal.scan?.checkpointId,
          ) ?? null
        }
        checkpointIndex={incidentModal.scanIndex}
        onSendReport={(target) => {
          setEmailTarget(target);
          setEmailModalOpen(true);
        }}
        onSaveObservation={(text) => {
          if (!incidentModal.scan) return;
          setIncidentModal((prev) =>
            prev.scan
              ? { ...prev, scan: { ...prev.scan, incidentDescription: text } }
              : prev,
          );
        }}
      />

      {/* ── Email modal ────────────────────────────────────────────── */}
      <PatrolReportEmailModal
        open={emailModalOpen}
        onOpenChange={(open) => {
          setEmailModalOpen(open);
          if (!open) setEmailTarget(null);
        }}
        execution={selectedExecution}
        onDownloadPDF={handleGenerateReport}
        recipientLabel={
          emailTarget === "client"
            ? "Client"
            : emailTarget === "responsable"
              ? "Responsable"
              : undefined
        }
      />
    </div>
  );
}
