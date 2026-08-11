"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef, FilterDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HoursInput } from "@/components/ui/hours-input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  Pencil,
  Check,
  RefreshCw,
  Users,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import {
  mockEmployeePayrollVariables,
  mockPayrollPeriods,
} from "@/data/payroll-variables";
import { EmployeePayrollVariables, ImportStatus } from "@/lib/types";

type ModalMode = "view" | "edit" | null;

export default function PayrollVariablesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PayrollVariablesContent />
    </Suspense>
  );
}

/**
 * Période de repli : le mois en cours. Les périodes de démonstration ayant été
 * retirées, `periods[0]` était `undefined` et la page plantait au chargement
 * sur `selectedPeriod.month`.
 */
function periodeParDefaut(): PeriodType {
  const d = new Date();
  const mois = d.getMonth() + 1;
  return {
    id: `${d.getFullYear()}-${String(mois).padStart(2, "0")}`,
    month: mois,
    year: d.getFullYear(),
    label: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
  };
}

function PayrollVariablesContent() {
  const searchParams = useSearchParams();

  // Convert PayrollPeriod to Period format
  const periods: PeriodType[] = mockPayrollPeriods.map((p) => ({
    id: p.id,
    month: p.month,
    year: p.year,
    label: p.label,
  }));

  // Compute initial state from URL params
  const getInitialStateFromParams = () => {
    const employeeId = searchParams.get("employeeId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (employeeId && month && year) {
      const targetPeriod = periods.find(
        (p) => p.month === parseInt(month) && p.year === parseInt(year),
      );
      const periodString = `${year}-${month.padStart(2, "0")}`;
      const variableRecord = mockEmployeePayrollVariables.find(
        (v) => v.employeeId === employeeId && v.period === periodString,
      );

      if (variableRecord) {
        return {
          period: targetPeriod || periods[0] || periodeParDefaut(),
          modalMode: "view" as ModalMode,
          selectedVariable: variableRecord,
          formData: variableRecord,
        };
      } else {
        const employee = mockEmployeePayrollVariables.find(
          (v) => v.employeeId === employeeId,
        );
        const newVariable: Partial<EmployeePayrollVariables> = {
          employeeId: employeeId,
          employeeName: employee?.employeeName || "Employé inconnu",
          period: periodString,
          validated: false,
          hasErrors: false,
          hasWarnings: false,
        };
        return {
          period: targetPeriod || periods[0] || periodeParDefaut(),
          modalMode: "edit" as ModalMode,
          selectedVariable: null,
          formData: newVariable,
        };
      }
    }

    return {
      period: periods[0] || periodeParDefaut(),
      modalMode: null,
      selectedVariable: null,
      formData: {},
    };
  };

  const initialState = getInitialStateFromParams();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(
    initialState.period,
  );
  const [variables, setVariables] = useState<EmployeePayrollVariables[]>(
    mockEmployeePayrollVariables,
  );
  const [modalMode, setModalMode] = useState<ModalMode>(initialState.modalMode);
  const [selectedVariable, setSelectedVariable] =
    useState<EmployeePayrollVariables | null>(initialState.selectedVariable);
  const [formData, setFormData] = useState<Partial<EmployeePayrollVariables>>(
    initialState.formData,
  );
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Filter variables by selected period
  const periodVariables = variables.filter(
    (v) =>
      v.period ===
      `${selectedPeriod.year}-${String(selectedPeriod.month).padStart(2, "0")}`,
  );

  // Statistics
  const stats = {
    total: periodVariables.length,
    imported: periodVariables.filter(
      (v) =>
        v.planningImportStatus === "imported" &&
        v.hrImportStatus === "imported",
    ).length,
    validated: periodVariables.filter((v) => v.validated).length,
    errors: periodVariables.filter((v) => v.hasErrors).length,
    warnings: periodVariables.filter((v) => v.hasWarnings).length,
  };

  const getStatusBadge = (status: ImportStatus) => {
    const config = {
      pending: {
        label: "En attente",
        variant: "outline" as const,
        icon: Clock,
      },
      importing: {
        label: "Import en cours",
        variant: "secondary" as const,
        icon: RefreshCw,
      },
      imported: {
        label: "Importé",
        variant: "default" as const,
        icon: CheckCircle,
      },
      error: {
        label: "Erreur",
        variant: "destructive" as const,
        icon: XCircle,
      },
      validated: { label: "Validé", variant: "default" as const, icon: Check },
    };
    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const handleSync = (source: "planning" | "hr") => {
    // Simulate sync - in real app this would call API to sync latest data
    const updatedVariables = variables.map((v) => {
      if (
        v.period ===
        `${selectedPeriod.year}-${String(selectedPeriod.month).padStart(2, "0")}`
      ) {
        if (source === "planning") {
          return {
            ...v,
            planningImportStatus: "imported" as ImportStatus,
            planningImportDate: new Date(),
          };
        } else if (source === "hr") {
          return {
            ...v,
            hrImportStatus: "imported" as ImportStatus,
            hrImportDate: new Date(),
          };
        }
      }
      return v;
    });

    setVariables(updatedVariables);
  };

  const handleImportExternal = () => {
    setImportDialogOpen(true);
  };

  const executeImport = () => {
    // Simulate external file import
    const updatedVariables = variables.map((v) => {
      if (
        v.period ===
        `${selectedPeriod.year}-${String(selectedPeriod.month).padStart(2, "0")}`
      ) {
        return {
          ...v,
          externalImportStatus: "imported" as ImportStatus,
          externalImportDate: new Date(),
        };
      }
      return v;
    });

    setVariables(updatedVariables);
    setImportDialogOpen(false);
  };

  const handleView = (variable: EmployeePayrollVariables) => {
    setSelectedVariable(variable);
    setFormData(variable);
    setModalMode("view");
  };

  const handleEdit = (variable: EmployeePayrollVariables) => {
    setSelectedVariable(variable);
    setFormData(variable);
    setModalMode("edit");
  };

  const handleValidate = (id: string) => {
    setVariables(
      variables.map((v) =>
        v.id === id
          ? {
              ...v,
              validated: true,
              validatedBy: "Marie Dubois",
              validatedAt: new Date(),
            }
          : v,
      ),
    );
  };

  const handleSave = () => {
    if (modalMode === "edit" && selectedVariable) {
      setVariables(
        variables.map((v) =>
          v.id === selectedVariable.id
            ? {
                ...v,
                ...formData,
                lastModifiedBy: "Marie Dubois",
                lastModifiedAt: new Date(),
              }
            : v,
        ),
      );
      setModalMode(null);
      setSelectedVariable(null);
      setFormData({});
    }
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedVariable(null);
    setFormData({});
  };

  // Enrich data with computed status for filtering
  const enrichedVariables = periodVariables.map((v) => ({
    ...v,
    statusFilter: v.hasErrors
      ? "errors"
      : v.hasWarnings
        ? "warnings"
        : v.validated
          ? "validated"
          : "pending",
    importStatus:
      v.planningImportStatus === "imported" && v.hrImportStatus === "imported"
        ? "imported"
        : v.planningImportStatus === "error" || v.hrImportStatus === "error"
          ? "error"
          : "pending",
  }));

  // Filters for DataTable
  const variableFilters: FilterDef[] = [
    {
      key: "statusFilter",
      label: "Statut",
      options: [
        { value: "all", label: "Tous les statuts" },
        { value: "validated", label: "Validés" },
        { value: "pending", label: "À valider" },
        { value: "errors", label: "Erreurs" },
        { value: "warnings", label: "Avertissements" },
      ],
    },
    {
      key: "importStatus",
      label: "Import",
      options: [
        { value: "all", label: "Tous" },
        { value: "imported", label: "Importés" },
        { value: "pending", label: "En attente" },
        { value: "error", label: "Erreurs" },
      ],
    },
    {
      key: "contractType",
      label: "Contrat",
      options: [
        { value: "all", label: "Tous les contrats" },
        { value: "CDI", label: "CDI" },
        { value: "CDD", label: "CDD" },
        { value: "Apprentissage", label: "Apprentissage" },
      ],
    },
  ];

  // Combined columns for the unified table
  const columns: ColumnDef<EmployeePayrollVariables>[] = [
    {
      key: "employeeName",
      label: "Employé",
      render: (item) => (
        <div>
          <div className="font-medium">{item.employeeName}</div>
          <div className="text-sm text-muted-foreground">{item.employeeId}</div>
        </div>
      ),
    },
    {
      key: "position",
      label: "Poste",
      defaultVisible: false,
    },
    {
      key: "contractType",
      label: "Contrat",
    },
    {
      key: "planningImportStatus",
      label: "Import Planning",
      render: (item) => getStatusBadge(item.planningImportStatus),
      defaultVisible: false,
    },
    {
      key: "hrImportStatus",
      label: "Import RH",
      render: (item) => getStatusBadge(item.hrImportStatus),
      defaultVisible: false,
    },
    // Planning hours columns
    {
      key: "normalHours",
      label: "H. Normales",
      render: (item) => item.planningData.normalHours.toFixed(2),
    },
    {
      key: "nightHours",
      label: "H. Nuit",
      render: (item) => item.planningData.nightHours.toFixed(2),
      defaultVisible: false,
    },
    {
      key: "holidayHours",
      label: "H. Fériées",
      render: (item) => item.planningData.holidayHours.toFixed(2),
      defaultVisible: false,
    },
    {
      key: "overtimeHours25",
      label: "H. Sup 25%",
      render: (item) => item.planningData.overtimeHours25.toFixed(2),
      defaultVisible: false,
    },
    {
      key: "overtimeHours50",
      label: "H. Sup 50%",
      render: (item) => item.planningData.overtimeHours50.toFixed(2),
      defaultVisible: false,
    },
    {
      key: "sundayHours",
      label: "H. Dimanche",
      render: (item) => item.planningData.sundayHours.toFixed(2),
      defaultVisible: false,
    },
    {
      key: "mealAllowances",
      label: "Paniers",
      render: (item) => item.planningData.mealAllowances,
      defaultVisible: false,
    },
    // HR absences columns
    {
      key: "paidLeave",
      label: "Congés payés",
      render: (item) => item.hrData.paidLeave,
      defaultVisible: false,
    },
    {
      key: "sickLeave",
      label: "Maladie",
      render: (item) => item.hrData.sickLeave,
      defaultVisible: false,
    },
    {
      key: "workAccident",
      label: "AT",
      render: (item) => item.hrData.workAccident,
      defaultVisible: false,
    },
    {
      key: "exceptionalLeave",
      label: "Congés except.",
      render: (item) => item.hrData.exceptionalLeave,
      defaultVisible: false,
    },
    {
      key: "validated",
      label: "Statut",
      render: (item) => {
        if (item.hasErrors) {
          return (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Erreurs
            </Badge>
          );
        }
        if (item.hasWarnings) {
          return (
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-yellow-700 border-yellow-500 bg-yellow-50"
            >
              <AlertTriangle className="h-3 w-3" />
              Avertissements
            </Badge>
          );
        }
        if (item.validated) {
          return (
            <Badge
              variant="default"
              className="flex items-center gap-1 bg-green-600"
            >
              <Check className="h-3 w-3" />
              Validé
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />À valider
          </Badge>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(item)}>
              <Eye className="mr-2 h-4 w-4" />
              Voir détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(item)}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            {!item.validated && !item.hasErrors && (
              <DropdownMenuItem onClick={() => handleValidate(item.id)}>
                <Check className="mr-2 h-4 w-4" />
                Valider
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Errors and warnings list
  const errorVariables = periodVariables.filter((v) => v.hasErrors);
  const warningVariables = periodVariables.filter((v) => v.hasWarnings);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Saisie & Import des Variables</h1>
        <p className="text-muted-foreground mt-1">
          Importation et gestion des variables de paie depuis Planning et RH
        </p>
      </div>

      {/* Period Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Période de paie</CardTitle>
              <CardDescription>
                Sélectionnez la période pour laquelle gérer les variables
              </CardDescription>
            </div>
            <PeriodSelector
              periods={periods}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              label=""
              className="m-0"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <InfoCardContainer className="lg:grid-cols-5">
        <InfoCard
          icon={Users}
          title="Employés"
          value={stats.total}
          color="blue"
        />
        <InfoCard
          icon={Download}
          title="Importés"
          value={stats.imported}
          subtext={`sur ${stats.total} employés`}
          color="green"
        />
        <InfoCard
          icon={CheckCircle}
          title="Validés"
          value={stats.validated}
          subtext={`sur ${stats.total} employés`}
          color="green"
        />
        <InfoCard
          icon={XCircle}
          title="Erreurs"
          value={stats.errors}
          color="red"
        />
        <InfoCard
          icon={AlertTriangle}
          title="Avertissements"
          value={stats.warnings}
          color="orange"
        />
      </InfoCardContainer>

      {/* Import Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Synchronisation des données</CardTitle>
          <CardDescription>
            Synchroniser les dernières données depuis les modules internes ou
            importer un fichier externe
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={() => handleSync("planning")}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <Briefcase className="h-4 w-4" />
            Synchroniser Planning
          </Button>
          <Button
            onClick={() => handleSync("hr")}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <Users className="h-4 w-4" />
            Synchroniser RH
          </Button>
          <Button
            onClick={handleImportExternal}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Importer fichier externe
          </Button>
        </CardContent>
      </Card>

      {/* Errors and Warnings Alert */}
      {(errorVariables.length > 0 || warningVariables.length > 0) && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Contrôles de cohérence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorVariables.length > 0 && (
              <div>
                <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Erreurs ({errorVariables.length})
                </h4>
                <div className="space-y-2">
                  {errorVariables.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-start justify-between p-3 bg-destructive/10 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{v.employeeName}</div>
                        {v.coherenceChecks
                          .filter((c) => c.checkType === "error")
                          .map((check) => (
                            <div
                              key={check.id}
                              className="text-sm text-muted-foreground"
                            >
                              {check.message}
                            </div>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(v)}
                      >
                        Corriger
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {warningVariables.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Avertissements ({warningVariables.length})
                </h4>
                <div className="space-y-2">
                  {warningVariables.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-start justify-between p-3 bg-orange-100 border border-orange-200 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-orange-900">
                          {v.employeeName}
                        </div>
                        {v.coherenceChecks
                          .filter((c) => c.checkType === "warning")
                          .map((check) => (
                            <div
                              key={check.id}
                              className="text-sm text-orange-800"
                            >
                              {check.message}
                            </div>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(v)}
                      >
                        Voir
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Variables de paie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={enrichedVariables}
            filters={variableFilters}
            searchKey="employeeName"
            searchPlaceholder="Rechercher un employé..."
            onRowClick={(item) => handleView(item)}
          />
        </CardContent>
      </Card>

      {/* View/Edit Modal */}
      <Modal
        open={modalMode !== null}
        onOpenChange={handleCloseModal}
        type={modalMode === "view" ? "details" : "form"}
        title={`${modalMode === "view" ? "Détails" : "Modifier"} - Variables de paie`}
        description={`${selectedVariable?.employeeName} - Période ${selectedPeriod.label}`}
        size="xl"
        actions={{
          primary:
            modalMode === "edit"
              ? {
                  label: "Enregistrer",
                  onClick: handleSave,
                }
              : undefined,
          secondary: {
            label: "Fermer",
            onClick: handleCloseModal,
            variant: "outline",
          },
        }}
      >
        {selectedVariable && (
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employé</Label>
                <Input value={selectedVariable.employeeName} disabled />
              </div>
              <div>
                <Label>Poste</Label>
                <Input value={selectedVariable.position} disabled />
              </div>
            </div>

            {/* Planning Hours */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Heures Planning
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Heures normales</Label>
                  <HoursInput
                    value={formData.planningData?.normalHours ?? 0}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        planningData: {
                          ...selectedVariable.planningData,
                          normalHours: value,
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                    step={0.5}
                    max={999}
                  />
                </div>
                <div>
                  <Label>Heures nuit</Label>
                  <HoursInput
                    value={formData.planningData?.nightHours ?? 0}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        planningData: {
                          ...selectedVariable.planningData,
                          nightHours: value,
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                    step={0.5}
                    max={999}
                  />
                </div>
                <div>
                  <Label>Heures fériées</Label>
                  <HoursInput
                    value={formData.planningData?.holidayHours ?? 0}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        planningData: {
                          ...selectedVariable.planningData,
                          holidayHours: value,
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                    step={0.5}
                    max={999}
                  />
                </div>
                <div>
                  <Label>H. Sup 25%</Label>
                  <HoursInput
                    value={formData.planningData?.overtimeHours25 ?? 0}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        planningData: {
                          ...selectedVariable.planningData,
                          overtimeHours25: value,
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                    step={0.5}
                    max={999}
                  />
                </div>
                <div>
                  <Label>H. Sup 50%</Label>
                  <HoursInput
                    value={formData.planningData?.overtimeHours50 ?? 0}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        planningData: {
                          ...selectedVariable.planningData,
                          overtimeHours50: value,
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                    step={0.5}
                    max={999}
                  />
                </div>
                <div>
                  <Label>Heures dimanche</Label>
                  <HoursInput
                    value={formData.planningData?.sundayHours ?? 0}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        planningData: {
                          ...selectedVariable.planningData,
                          sundayHours: value,
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                    step={0.5}
                    max={999}
                  />
                </div>
                <div>
                  <Label>Paniers repas</Label>
                  <Input
                    type="number"
                    value={formData.planningData?.mealAllowances ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        planningData: {
                          ...selectedVariable.planningData,
                          mealAllowances: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label>Indemnités déplacement</Label>
                  <Input
                    type="number"
                    value={formData.planningData?.travelAllowances ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        planningData: {
                          ...selectedVariable.planningData,
                          travelAllowances: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label>Indemnités habillage</Label>
                  <Input
                    type="number"
                    value={formData.planningData?.dressingAllowances ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        planningData: {
                          ...selectedVariable.planningData,
                          dressingAllowances: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                    className="h-8"
                  />
                </div>
              </div>
            </div>

            {/* HR Absences */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Absences RH
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Congés payés (jours)</Label>
                  <Input
                    type="number"
                    value={formData.hrData?.paidLeave ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hrData: {
                          ...selectedVariable.hrData,
                          paidLeave: parseInt(e.target.value),
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <Label>Maladie (jours)</Label>
                  <Input
                    type="number"
                    value={formData.hrData?.sickLeave ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hrData: {
                          ...selectedVariable.hrData,
                          sickLeave: parseInt(e.target.value),
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <Label>Accident travail (jours)</Label>
                  <Input
                    type="number"
                    value={formData.hrData?.workAccident ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hrData: {
                          ...selectedVariable.hrData,
                          workAccident: parseInt(e.target.value),
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <Label>Congés exceptionnels (jours)</Label>
                  <Input
                    type="number"
                    value={formData.hrData?.exceptionalLeave ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hrData: {
                          ...selectedVariable.hrData,
                          exceptionalLeave: parseInt(e.target.value),
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <Label>Heures syndicales</Label>
                  <Input
                    type="number"
                    value={formData.hrData?.unionHours ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hrData: {
                          ...selectedVariable.hrData,
                          unionHours: parseInt(e.target.value),
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                  />
                </div>
                <div>
                  <Label>Retenues salaire (€)</Label>
                  <Input
                    type="number"
                    value={formData.hrData?.salaryDeductions ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hrData: {
                          ...selectedVariable.hrData,
                          salaryDeductions: parseFloat(e.target.value),
                        },
                      })
                    }
                    disabled={modalMode === "view"}
                  />
                </div>
              </div>
            </div>

            {/* Coherence Checks */}
            {selectedVariable.coherenceChecks.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Contrôles de cohérence
                </h4>
                <div className="space-y-2">
                  {selectedVariable.coherenceChecks.map((check) => (
                    <div
                      key={check.id}
                      className={`p-3 rounded-lg ${
                        check.checkType === "error"
                          ? "bg-destructive/10"
                          : "bg-yellow-50"
                      }`}
                    >
                      <div className="font-medium">{check.message}</div>
                      {check.details && (
                        <div className="text-sm text-muted-foreground">
                          {check.details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* External Import Dialog */}
      <Modal
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        type="form"
        title="Import fichier externe"
        description="Importer les données depuis un fichier externe (CSV, Excel)"
        size="md"
        actions={{
          primary: {
            label: "Importer",
            onClick: executeImport,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setImportDialogOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label>Période</Label>
            <Input value={selectedPeriod.label} disabled />
          </div>

          <div>
            <Label>Fichier</Label>
            <Input type="file" accept=".csv,.xlsx,.xls" />
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              Assurez-vous que le fichier respecte le format attendu (colonnes:
              ID employé, heures normales, heures nuit, etc.)
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
