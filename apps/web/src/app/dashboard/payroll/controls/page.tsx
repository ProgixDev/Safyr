"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef, FilterDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  PeriodSelector,
  Period as PeriodType,
} from "@/components/ui/period-selector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  MoreHorizontal,
  Eye,
  Check,
  X,
  Clock,
  FileText,
  Download,
} from "lucide-react";
import {
  PAYROLL_CONTROLS,
  MOCK_ANOMALIES,
  MOCK_EXECUTIONS,
} from "@/data/payroll-controls";
import { PayrollAnomaly, ControlExecution } from "@/lib/types";

const mockPeriods: PeriodType[] = [
  { id: "2024-12", month: 12, year: 2024, label: "Décembre 2024" },
  { id: "2024-11", month: 11, year: 2024, label: "Novembre 2024" },
  { id: "2024-10", month: 10, year: 2024, label: "Octobre 2024" },
];

// Mock last run status for each control
const mockControlLastRun: Record<
  string,
  {
    date: Date;
    status: "success" | "warning" | "error";
    anomaliesFound: number;
  }
> = {
  ctrl_hours_planning: {
    date: new Date("2024-12-20T10:05:00"),
    status: "warning",
    anomaliesFound: 3,
  },
  ctrl_duplicates: {
    date: new Date("2024-12-20T10:05:00"),
    status: "error",
    anomaliesFound: 1,
  },
  ctrl_missing_entries: {
    date: new Date("2024-12-20T10:05:00"),
    status: "warning",
    anomaliesFound: 1,
  },
  ctrl_daily_max: {
    date: new Date("2024-12-20T10:05:00"),
    status: "error",
    anomaliesFound: 1,
  },
  ctrl_weekly_max: {
    date: new Date("2024-12-20T10:05:00"),
    status: "error",
    anomaliesFound: 1,
  },
  ctrl_rest_period: {
    date: new Date("2024-12-20T10:05:00"),
    status: "error",
    anomaliesFound: 2,
  },
  ctrl_night_bonus: {
    date: new Date("2024-12-20T10:05:00"),
    status: "warning",
    anomaliesFound: 1,
  },
  ctrl_holiday_bonus: {
    date: new Date("2024-12-20T10:05:00"),
    status: "warning",
    anomaliesFound: 1,
  },
  ctrl_oncall_bonus: {
    date: new Date("2024-12-20T10:05:00"),
    status: "success",
    anomaliesFound: 0,
  },
  ctrl_ijss_amount: {
    date: new Date("2024-12-20T10:05:00"),
    status: "warning",
    anomaliesFound: 2,
  },
  ctrl_ijss_missing: {
    date: new Date("2024-12-20T10:05:00"),
    status: "success",
    anomaliesFound: 1,
  },
  ctrl_overtime_limit: {
    date: new Date("2024-12-20T10:05:00"),
    status: "error",
    anomaliesFound: 1,
  },
};

export default function PayrollControlsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(
    mockPeriods[0],
  );
  const [selectedControls, setSelectedControls] = useState<string[]>(
    PAYROLL_CONTROLS.map((c) => c.id),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [runningControlId, setRunningControlId] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<ControlExecution | null>(
    MOCK_EXECUTIONS[0],
  );
  const [anomalies, setAnomalies] = useState<PayrollAnomaly[]>(MOCK_ANOMALIES);
  const [selectedAnomaly, setSelectedAnomaly] = useState<PayrollAnomaly | null>(
    null,
  );
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [executionModalOpen, setExecutionModalOpen] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    h_dimanche_nuit: "",
    h_ferie_nuit: "",
    acompte: "",
  });

  const handleRunControls = (controlIds?: string[]) => {
    const controlsToRun = controlIds || selectedControls;
    if (controlsToRun.length === 0) return;

    setExecutionModalOpen(false);
    setIsRunning(true);
    setRunningControlId(null);
    setTimeout(() => {
      setIsRunning(false);

      // Filter anomalies based on controls run
      const relevantAnomalies = MOCK_ANOMALIES.filter((a) =>
        controlsToRun.includes(a.controlId || ""),
      );

      setLastExecution({
        id: `exec_${Date.now()}`,
        periodId: `period_${selectedPeriod.year}_${selectedPeriod.month}`,
        period: `${getMonthName(selectedPeriod.month)} ${selectedPeriod.year}`,
        startedAt: new Date(),
        completedAt: new Date(Date.now() + 5000),
        status: "completed",
        controlsRun: controlsToRun,
        totalAnomalies: relevantAnomalies.length,
        criticalCount: relevantAnomalies.filter(
          (a) => a.severity === "critical",
        ).length,
        warningCount: relevantAnomalies.filter((a) => a.severity === "warning")
          .length,
        infoCount: relevantAnomalies.filter((a) => a.severity === "info")
          .length,
        employeesAffected: new Set(relevantAnomalies.map((a) => a.employeeId))
          .size,
        autoCorrectableCount: relevantAnomalies.filter(
          (a) => a.autoCorrectAvailable,
        ).length,
      });

      // Update displayed anomalies to match controls run
      if (controlIds) {
        setAnomalies(relevantAnomalies);
      } else {
        setAnomalies(MOCK_ANOMALIES);
      }
    }, 3000);
  };

  const handleRunSingleControl = (controlId: string) => {
    setRunningControlId(controlId);
    handleRunControls([controlId]);
  };

  const getControlLastRunStatus = (controlId: string) => {
    return mockControlLastRun[controlId];
  };

  const getStatusColor = (status: "success" | "warning" | "error"): string => {
    switch (status) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "warning":
        return "text-orange-600 dark:text-orange-400";
      case "error":
        return "text-red-600 dark:text-red-400";
    }
  };

  const getStatusBgColor = (
    status: "success" | "warning" | "error",
  ): string => {
    switch (status) {
      case "success":
        return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
      case "warning":
        return "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800";
      case "error":
        return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
    }
  };

  const getStatusIcon = (status: "success" | "warning" | "error") => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-3 w-3" />;
      case "warning":
        return <AlertTriangle className="h-3 w-3" />;
      case "error":
        return <XCircle className="h-3 w-3" />;
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "hours":
        return "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300";
      case "legal":
        return "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300";
      case "bonuses":
        return "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300";
      case "ijss":
        return "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300";
      case "duplicates":
        return "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300";
    }
  };

  const handleViewDetails = (anomaly: PayrollAnomaly) => {
    setSelectedAnomaly(anomaly);
    setDetailModalOpen(true);
  };

  const handleOpenCorrectionModal = (anomaly: PayrollAnomaly) => {
    setSelectedAnomaly(anomaly);
    setCorrectionForm({
      h_dimanche_nuit: "",
      h_ferie_nuit: "",
      acompte: "",
    });
    setDetailModalOpen(false);
    setCorrectionModalOpen(true);
  };

  const handleApplyCorrection = () => {
    if (selectedAnomaly) {
      setAnomalies(
        anomalies.map((a) =>
          a.id === selectedAnomaly.id ? { ...a, status: "corrected" } : a,
        ),
      );
      setCorrectionModalOpen(false);
      setSelectedAnomaly(null);
    }
  };

  const handleMarkAsReviewed = (anomaly: PayrollAnomaly) => {
    setAnomalies(
      anomalies.map((a) =>
        a.id === anomaly.id
          ? {
              ...a,
              status: "reviewed",
              reviewedBy: "Current User",
              reviewedAt: new Date(),
            }
          : a,
      ),
    );
  };

  const handleIgnore = (anomaly: PayrollAnomaly) => {
    setAnomalies(
      anomalies.map((a) =>
        a.id === anomaly.id ? { ...a, status: "ignored" } : a,
      ),
    );
  };

  const handleToggleControl = (controlId: string) => {
    setSelectedControls((prev) =>
      prev.includes(controlId)
        ? prev.filter((id) => id !== controlId)
        : [...prev, controlId],
    );
  };

  const getMonthName = (month: number) => {
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    return months[month - 1];
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityBadgeVariant = (
    severity: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending":
        return "default";
      case "reviewed":
        return "secondary";
      case "corrected":
        return "outline";
      case "ignored":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "En attente",
      reviewed: "Révisée",
      corrected: "Corrigée",
      ignored: "Ignorée",
      false_positive: "Faux positif",
    };
    return labels[status] || status;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      hours: "Heures",
      legal: "Légal",
      bonuses: "Primes",
      ijss: "IJSS",
      duplicates: "Doublons",
      general: "Général",
    };
    return labels[category] || category;
  };

  // Enrich anomalies with category for filtering
  const enrichedAnomalies = anomalies.map((anomaly) => {
    const control = PAYROLL_CONTROLS.find((c) => c.id === anomaly.controlId);
    return {
      ...anomaly,
      category: control?.category || "general",
    };
  });

  const anomalyFilters: FilterDef[] = [
    {
      key: "severity",
      label: "Sévérité",
      options: [
        { value: "all", label: "Toutes les sévérités" },
        { value: "critical", label: "Critiques" },
        { value: "warning", label: "Avertissements" },
        { value: "info", label: "Informations" },
      ],
    },
    {
      key: "status",
      label: "Statut",
      options: [
        { value: "all", label: "Tous les statuts" },
        { value: "pending", label: "En attente" },
        { value: "reviewed", label: "Révisées" },
        { value: "corrected", label: "Corrigées" },
        { value: "ignored", label: "Ignorées" },
      ],
    },
    {
      key: "category",
      label: "Catégorie",
      options: [
        { value: "all", label: "Toutes les catégories" },
        { value: "hours", label: "Heures" },
        { value: "legal", label: "Légal" },
        { value: "bonuses", label: "Primes" },
        { value: "ijss", label: "IJSS" },
        { value: "duplicates", label: "Doublons" },
      ],
    },
  ];

  const anomalyColumns: ColumnDef<PayrollAnomaly>[] = [
    {
      key: "severity",
      label: "Sévérité",
      render: (anomaly) => (
        <div className="flex items-center gap-2">
          <div
            className={
              anomaly.severity === "critical"
                ? "text-red-500"
                : anomaly.severity === "warning"
                  ? "text-orange-500"
                  : "text-blue-500"
            }
          >
            {getSeverityIcon(anomaly.severity)}
          </div>
          <Badge variant={getSeverityBadgeVariant(anomaly.severity)}>
            {anomaly.severity === "critical"
              ? "Critique"
              : anomaly.severity === "warning"
                ? "Attention"
                : "Info"}
          </Badge>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (anomaly) => {
        const control = PAYROLL_CONTROLS.find(
          (c) => c.id === anomaly.controlId,
        );
        return (
          <div>
            <div className="font-medium">{anomaly.title}</div>
            {control && (
              <div className="text-xs text-muted-foreground">
                {getCategoryLabel(control.category)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "employee",
      label: "Employé",
      render: (anomaly) => anomaly.employeeName,
    },
    {
      key: "description",
      label: "Description",
      render: (anomaly) => (
        <div className="max-w-md">
          <div className="text-sm">{anomaly.description}</div>
          {anomaly.date && (
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(anomaly.date).toLocaleDateString("fr-FR")}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (anomaly) => (
        <Badge variant={getStatusBadgeVariant(anomaly.status)}>
          {getStatusLabel(anomaly.status)}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (anomaly) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(anomaly)}>
              <Eye className="mr-2 h-4 w-4" />
              Voir détails
            </DropdownMenuItem>
            {anomaly.status === "pending" && (
              <>
                <DropdownMenuItem onClick={() => handleMarkAsReviewed(anomaly)}>
                  <Check className="mr-2 h-4 w-4" />
                  Marquer comme révisée
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleIgnore(anomaly)}>
                  <X className="mr-2 h-4 w-4" />
                  Ignorer
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contrôles Automatiques</h1>
          <p className="text-muted-foreground mt-2">
            Exécutez des contrôles automatiques sur les données de paie et
            corrigez les anomalies détectées
          </p>
        </div>
        <Button
          onClick={() => setExecutionModalOpen(true)}
          disabled={isRunning}
          size="lg"
        >
          <Play className="mr-2 h-5 w-5" />
          Configurer & Lancer
        </Button>
      </div>

      {lastExecution && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Dernière exécution:{" "}
                {lastExecution.completedAt?.toLocaleString("fr-FR")} - Période:{" "}
                {lastExecution.period}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {lastExecution && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Résultats</h2>
          <InfoCardContainer>
            <InfoCard
              title="Anomalies Totales"
              value={lastExecution.totalAnomalies.toString()}
              icon={FileText}
              color="blue"
            />
            <InfoCard
              title="Critiques"
              value={lastExecution.criticalCount.toString()}
              icon={XCircle}
              color="red"
            />
            <InfoCard
              title="Avertissements"
              value={lastExecution.warningCount.toString()}
              icon={AlertTriangle}
              color="orange"
            />
            <InfoCard
              title="Informations"
              value={lastExecution.infoCount.toString()}
              icon={Info}
              color="blue"
            />
            <InfoCard
              title="Employés Affectés"
              value={lastExecution.employeesAffected.toString()}
              icon={CheckCircle}
              color="green"
            />
            <InfoCard
              title="Auto-Corrigibles"
              value={lastExecution.autoCorrectableCount.toString()}
              icon={Check}
              color="green"
            />
          </InfoCardContainer>
        </div>
      )}

      {/* Anomalies List */}
      {lastExecution && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Anomalies Détectées</CardTitle>
                <CardDescription>
                  Liste détaillée des anomalies trouvées lors du dernier
                  contrôle
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              onRowClick={handleViewDetails}
              data={enrichedAnomalies}
              columns={anomalyColumns}
              filters={anomalyFilters}
              searchPlaceholder="Rechercher par employé..."
              searchKey="employeeName"
            />
          </CardContent>
        </Card>
      )}

      {/* Execution Modal */}
      <Modal
        open={executionModalOpen}
        onOpenChange={setExecutionModalOpen}
        type="form"
        title="Configuration des Contrôles"
        description="Sélectionnez la période et les contrôles à exécuter"
      >
        <div className="space-y-5">
          {/* Period Selection */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <Label className="text-base font-semibold">
              Période d&apos;analyse
            </Label>
            <div className="mt-2">
              <PeriodSelector
                periods={mockPeriods}
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
                showIcon={false}
                label=""
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedControls(PAYROLL_CONTROLS.map((c) => c.id))
              }
            >
              <Check className="mr-2 h-3 w-3" />
              Tout sélectionner
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedControls([])}
            >
              <X className="mr-2 h-3 w-3" />
              Tout désélectionner
            </Button>
          </div>

          {/* Control Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">
                Contrôles disponibles
              </Label>
              <Badge variant="secondary">
                {selectedControls.length}/{PAYROLL_CONTROLS.length} sélectionné
                {selectedControls.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="space-y-2 max-h-112 overflow-y-auto pr-2">
              {PAYROLL_CONTROLS.map((control) => {
                const lastRun = getControlLastRunStatus(control.id);
                const isSelected = selectedControls.includes(control.id);
                return (
                  <div
                    key={control.id}
                    className={`relative rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                    } ${
                      runningControlId === control.id ? "animate-pulse" : ""
                    }`}
                  >
                    <div className="p-4">
                      {/* Header Row */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            handleToggleControl(control.id)
                          }
                          id={`modal-${control.id}`}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          {/* Title and Category */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <label
                                htmlFor={`modal-${control.id}`}
                                className="text-sm font-semibold cursor-pointer leading-tight block"
                              >
                                {control.name}
                              </label>
                              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                {control.description}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`${getCategoryColor(control.category)} text-xs shrink-0`}
                            >
                              {getCategoryLabel(control.category)}
                            </Badge>
                          </div>

                          {/* Last Run Status */}
                          {lastRun && (
                            <div
                              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md border text-xs ${getStatusBgColor(lastRun.status)}`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`flex items-center gap-1 font-medium ${getStatusColor(lastRun.status)}`}
                                >
                                  {getStatusIcon(lastRun.status)}
                                  {lastRun.status === "success" &&
                                    "Aucune anomalie"}
                                  {lastRun.status === "warning" &&
                                    `${lastRun.anomaliesFound} avertissement${lastRun.anomaliesFound > 1 ? "s" : ""}`}
                                  {lastRun.status === "error" &&
                                    `${lastRun.anomaliesFound} critique${lastRun.anomaliesFound > 1 ? "s" : ""}`}
                                </span>
                              </div>
                              <span className="text-muted-foreground">
                                {lastRun.date.toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}

                          {/* Action Button */}
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleRunSingleControl(control.id)}
                            disabled={isRunning}
                            className="w-full"
                          >
                            {runningControlId === control.id && isRunning ? (
                              <>
                                <Clock className="mr-2 h-3 w-3 animate-spin" />
                                Exécution...
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-3 w-3" />
                                Lancer ce contrôle
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-2 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => setExecutionModalOpen(false)}
              disabled={isRunning}
            >
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button
              onClick={() => handleRunControls()}
              disabled={isRunning || selectedControls.length === 0}
              size="lg"
            >
              {isRunning && !runningControlId ? (
                <>
                  <Clock className="mr-2 h-5 w-5 animate-spin" />
                  Exécution en cours...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Lancer {selectedControls.length} contrôle
                  {selectedControls.length > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {selectedAnomaly && (
        <Modal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          type="details"
          title="Détails de l'Anomalie"
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">
                  {selectedAnomaly.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedAnomaly.employeeName} -{" "}
                  {selectedAnomaly.date &&
                    new Date(selectedAnomaly.date).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <Badge
                variant={getSeverityBadgeVariant(selectedAnomaly.severity)}
              >
                {selectedAnomaly.severity === "critical"
                  ? "Critique"
                  : selectedAnomaly.severity === "warning"
                    ? "Attention"
                    : "Info"}
              </Badge>
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <p className="text-sm mt-1">{selectedAnomaly.description}</p>
            </div>

            {/* Details */}
            {selectedAnomaly.details && (
              <div className="space-y-2">
                <Label>Détails Techniques</Label>
                <div className="rounded-lg border p-3 space-y-2 bg-muted/50">
                  {selectedAnomaly.details.expected !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Attendu:</span>
                      <span className="font-mono">
                        {typeof selectedAnomaly.details.expected === "object" &&
                        selectedAnomaly.details.expected !== null
                          ? JSON.stringify(selectedAnomaly.details.expected)
                          : selectedAnomaly.details.expected !== null
                            ? String(selectedAnomaly.details.expected)
                            : "N/A"}
                      </span>
                    </div>
                  )}
                  {selectedAnomaly.details.actual !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Réel:</span>
                      <span className="font-mono">
                        {typeof selectedAnomaly.details.actual === "object" &&
                        selectedAnomaly.details.actual !== null
                          ? JSON.stringify(selectedAnomaly.details.actual)
                          : selectedAnomaly.details.actual !== null
                            ? String(selectedAnomaly.details.actual)
                            : "N/A"}
                      </span>
                    </div>
                  )}
                  {selectedAnomaly.details.related !== undefined && (
                    <div className="text-sm">
                      <span className="text-muted-foreground block mb-1">
                        Données associées:
                      </span>
                      <pre className="font-mono text-xs overflow-auto p-2 bg-background rounded">
                        {typeof selectedAnomaly.details.related === "object" &&
                        selectedAnomaly.details.related !== null
                          ? JSON.stringify(
                              selectedAnomaly.details.related,
                              null,
                              2,
                            )
                          : selectedAnomaly.details.related !== null
                            ? String(selectedAnomaly.details.related)
                            : "N/A"}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Auto-correction */}
            {selectedAnomaly.autoCorrectAvailable &&
              selectedAnomaly.correction && (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-green-900 dark:text-green-100">
                        Correction Automatique Disponible
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        {selectedAnomaly.correction.description}
                      </p>
                      <Button
                        onClick={() =>
                          handleOpenCorrectionModal(selectedAnomaly)
                        }
                        size="sm"
                        className="mt-3"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Corriger
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            {/* Status & Notes */}
            <div className="space-y-2">
              <Label>Statut</Label>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(selectedAnomaly.status)}>
                  {getStatusLabel(selectedAnomaly.status)}
                </Badge>
                {selectedAnomaly.reviewedBy && (
                  <span className="text-xs text-muted-foreground">
                    Révisée par {selectedAnomaly.reviewedBy} le{" "}
                    {selectedAnomaly.reviewedAt?.toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>
            </div>

            {selectedAnomaly.notes && (
              <div>
                <Label>Notes</Label>
                <p className="text-sm mt-1 text-muted-foreground">
                  {selectedAnomaly.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              {selectedAnomaly.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleIgnore(selectedAnomaly);
                      setDetailModalOpen(false);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Ignorer
                  </Button>
                  <Button
                    onClick={() => {
                      handleMarkAsReviewed(selectedAnomaly);
                      setDetailModalOpen(false);
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Marquer comme Révisée
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={() => setDetailModalOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Correction Modal */}
      {selectedAnomaly && (
        <Modal
          open={correctionModalOpen}
          onOpenChange={setCorrectionModalOpen}
          type="form"
          title="Corriger l'anomalie"
          actions={{
            secondary: {
              label: "Annuler",
              onClick: () => setCorrectionModalOpen(false),
              variant: "outline",
            },
            primary: {
              label: "Appliquer la correction",
              onClick: handleApplyCorrection,
            },
          }}
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium">{selectedAnomaly.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedAnomaly.employeeName} -{" "}
                {selectedAnomaly.date &&
                  new Date(selectedAnomaly.date).toLocaleDateString("fr-FR")}
              </p>
            </div>

            {/* Description de la correction */}
            {selectedAnomaly.correction && (
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  {selectedAnomaly.correction.description}
                </p>
              </div>
            )}

            {/* Form fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="h_dimanche_nuit">Heures dimanches nuit</Label>
                <Input
                  id="h_dimanche_nuit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={correctionForm.h_dimanche_nuit}
                  onChange={(e) =>
                    setCorrectionForm({
                      ...correctionForm,
                      h_dimanche_nuit: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="h_ferie_nuit">Heures férié nuit</Label>
                <Input
                  id="h_ferie_nuit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={correctionForm.h_ferie_nuit}
                  onChange={(e) =>
                    setCorrectionForm({
                      ...correctionForm,
                      h_ferie_nuit: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="acompte">Acompte (€)</Label>
                <Input
                  id="acompte"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={correctionForm.acompte}
                  onChange={(e) =>
                    setCorrectionForm({
                      ...correctionForm,
                      acompte: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
