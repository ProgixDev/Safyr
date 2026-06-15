"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  CheckCircle,
  MoreVertical,
  Euro,
  Clock,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type {
  PayrollVariable,
  PayrollVariableType,
  Employee,
} from "@/lib/types";
import { mockEmployees } from "@/data/employees";

// Mock data
const mockVariables: PayrollVariable[] = [
  {
    id: "1",
    employeeId: "EMP001",
    employeeName: "Jean Dupont",
    period: "2024-12-01",
    type: "h_jour",
    amount: 160,
    currency: "EUR",
    description: "Heures travaillées",
    status: "validated",
    processedBy: "Admin",
    processedAt: new Date("2024-12-15"),
    createdAt: new Date("2024-12-10"),
    updatedAt: new Date("2024-12-15"),
  },
  {
    id: "2",
    employeeId: "EMP002",
    employeeName: "Marie Martin",
    period: "2024-12-01",
    type: "h_nuit",
    amount: 24,
    currency: "EUR",
    description: "Heures de nuit",
    status: "pending",
    createdAt: new Date("2024-12-18"),
    updatedAt: new Date("2024-12-18"),
  },
  {
    id: "3",
    employeeId: "EMP003",
    employeeName: "Pierre Durand",
    period: "2024-12-01",
    type: "prime",
    amount: 500,
    currency: "EUR",
    description: "Prime de fin d'année",
    status: "validated",
    processedBy: "Admin",
    processedAt: new Date("2024-12-16"),
    createdAt: new Date("2024-12-12"),
    updatedAt: new Date("2024-12-16"),
  },
  {
    id: "4",
    employeeId: "EMP001",
    employeeName: "Jean Dupont",
    period: "2024-12-01",
    type: "frais_restauration",
    amount: 45.5,
    currency: "EUR",
    description: "Frais de restauration",
    status: "validated",
    processedBy: "Admin",
    processedAt: new Date("2024-12-15"),
    createdAt: new Date("2024-12-10"),
    updatedAt: new Date("2024-12-15"),
  },
  {
    id: "5",
    employeeId: "EMP002",
    employeeName: "Marie Martin",
    period: "2024-12-01",
    type: "h_dimanche",
    amount: 8,
    currency: "EUR",
    description: "Heures dimanche",
    status: "validated",
    processedBy: "Admin",
    processedAt: new Date("2024-12-15"),
    createdAt: new Date("2024-12-10"),
    updatedAt: new Date("2024-12-15"),
  },
  {
    id: "6",
    employeeId: "EMP004",
    employeeName: "Sophie Leroy",
    period: "2024-11-01",
    type: "prime",
    amount: 300,
    currency: "EUR",
    description: "Prime de performance",
    status: "pending",
    createdAt: new Date("2024-11-20"),
    updatedAt: new Date("2024-11-20"),
  },
  {
    id: "7",
    employeeId: "EMP005",
    employeeName: "Lucas Moreau",
    period: "2024-11-01",
    type: "indemnite_habillage",
    amount: 150,
    currency: "EUR",
    description: "Indemnité habillage",
    status: "validated",
    processedBy: "Admin",
    processedAt: new Date("2024-11-25"),
    createdAt: new Date("2024-11-15"),
    updatedAt: new Date("2024-11-25"),
  },
  {
    id: "8",
    employeeId: "EMP003",
    employeeName: "Pierre Durand",
    period: "2024-11-01",
    type: "nbre_paniers",
    amount: 20,
    currency: "EUR",
    description: "Nombre de paniers",
    status: "pending",
    createdAt: new Date("2024-11-22"),
    updatedAt: new Date("2024-11-22"),
  },
  {
    id: "9",
    employeeId: "EMP001",
    employeeName: "Jean Dupont",
    period: "2024-11-01",
    type: "autres_indemnites",
    amount: 200,
    currency: "EUR",
    description: "Autres indemnités",
    status: "validated",
    processedBy: "Admin",
    processedAt: new Date("2024-11-28"),
    createdAt: new Date("2024-11-18"),
    updatedAt: new Date("2024-11-28"),
  },
  {
    id: "10",
    employeeId: "EMP002",
    employeeName: "Marie Martin",
    period: "2024-10-01",
    type: "prime",
    amount: 400,
    currency: "EUR",
    description: "Prime mensuelle",
    status: "pending",
    createdAt: new Date("2024-10-25"),
    updatedAt: new Date("2024-10-25"),
  },
];

const variableTypeLabels: Record<PayrollVariableType, string> = {
  h_jour: "H Jour",
  h_dimanche: "H Dimanche",
  h_ferie: "H Férié",
  h_nuit: "H Nuit",
  h_dimanche_nuit: "H Dimanche Nuit",
  h_ferie_nuit: "H Férié Nuit",
  h_supp_25: "H Supp 25%",
  h_supp_50: "H Supp 50%",
  h_compl_10: "H Compl 10%",
  nbre_paniers: "Nbre Paniers",
  frais_restauration: "Frais restauration",
  prime: "Prime",
  indemnite_habillage: "Indemnité d'habillage",
  tenue: "Tenue",
  nbre_deplacement: "Nbre Déplacement",
  autres_indemnites: "Autres Indemnités",
};

// Types de variables non-horaires (primes/indemnités) — colonnes de la vue par salarié.
const NON_HOUR_TYPES: PayrollVariableType[] = [
  "prime",
  "indemnite_habillage",
  "tenue",
  "frais_restauration",
  "nbre_paniers",
  "nbre_deplacement",
  "autres_indemnites",
];

// Une ligne = un salarié, avec le cumul de ses variables par type.
type EmployeePivot = {
  employeeId: string;
  employeeName: string;
  amounts: Record<string, number>;
  total: number;
};

// Helper to compute initial state from URL params
function getInitialStateFromParams(searchParams: URLSearchParams) {
  const employeeId = searchParams.get("employeeId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const defaultForm = {
    employeeId: "",
    employeeName: "",
    year: "",
    month: "",
    type: "h_jour" as PayrollVariableType,
    amount: "",
    description: "",
    h_jour: "",
    h_dimanche: "",
    h_ferie: "",
    h_nuit: "",
    h_dimanche_nuit: "",
    h_ferie_nuit: "",
    h_supp_25: "",
    h_supp_50: "",
    h_compl_10: "",
    nbre_paniers: "",
    frais_restauration: "",
    prime: "",
    indemnite_habillage: "",
    tenue: "",
    nbre_deplacement: "",
    autres_indemnites: "",
  };

  if (!employeeId || !month || !year) {
    return {
      selectedVariable: null,
      isViewModalOpen: false,
      isVariableModalOpen: false,
      isEditMode: false,
      variableForm: defaultForm,
    };
  }

  const periodString = `${year}-${month.padStart(2, "0")}-01`;
  const variableRecord = mockVariables.find(
    (v) => v.employeeId === employeeId && v.period === periodString,
  );

  if (variableRecord) {
    return {
      selectedVariable: variableRecord,
      isViewModalOpen: true,
      isVariableModalOpen: false,
      isEditMode: false,
      variableForm: defaultForm,
    };
  }

  const employee = mockEmployees.find((e) => e.id === employeeId);
  return {
    selectedVariable: null,
    isViewModalOpen: false,
    isVariableModalOpen: true,
    isEditMode: true,
    variableForm: {
      ...defaultForm,
      employeeId: employeeId,
      employeeName:
        employee?.firstName && employee?.lastName
          ? `${employee.firstName} ${employee.lastName}`
          : "Employé inconnu",
      year: year,
      month: month.padStart(2, "0"),
    },
  };
}

export default function PayrollVariablesPage() {
  const searchParams = useSearchParams();

  // Compute initial state from URL params
  const initialState = useMemo(
    () => getInitialStateFromParams(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [], // Only compute once on mount
  );

  const [variables, setVariables] = useState<PayrollVariable[]>(mockVariables);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(
    initialState.isVariableModalOpen,
  );
  const [isViewModalOpen, setIsViewModalOpen] = useState(
    initialState.isViewModalOpen,
  );
  const [isEditMode, setIsEditMode] = useState(initialState.isEditMode);
  const [selectedVariable, setSelectedVariable] =
    useState<PayrollVariable | null>(initialState.selectedVariable);

  const [groupBy, setGroupBy] = useState<string | undefined>(undefined);
  const [validationNotes, setValidationNotes] = useState("");
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const employeeSearchRef = useRef<HTMLDivElement>(null);
  const [variableForm, setVariableForm] = useState(initialState.variableForm);

  // Handle click outside to close employee search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        employeeSearchRef.current &&
        !employeeSearchRef.current.contains(event.target as Node)
      ) {
        setEmployeeSearchOpen(false);
        setEmployeeSearchQuery("");
      }
    };

    if (employeeSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [employeeSearchOpen]);

  const handleValidate = (variable: PayrollVariable, notes: string) => {
    setVariables(
      variables.map((v) =>
        v.id === variable.id
          ? {
              ...v,
              status: "validated",
              processedBy: "Admin",
              processedAt: new Date(),
              notes,
            }
          : v,
      ),
    );
  };

  const handleRefuse = (variable: PayrollVariable, notes: string) => {
    setVariables(
      variables.map((v) =>
        v.id === variable.id
          ? {
              ...v,
              status: "refused",
              processedBy: "Admin",
              processedAt: new Date(),
              notes,
            }
          : v,
      ),
    );
  };

  const handleSelectEmployee = (employee: Employee) => {
    setVariableForm((prev) => ({
      ...prev,
      employeeId: employee.employeeNumber,
      employeeName: `${employee.firstName} ${employee.lastName}`,
    }));
    setEmployeeSearchOpen(false);
    setEmployeeSearchQuery("");
  };

  const handleEditVariable = (variable: PayrollVariable) => {
    const [year, month] = variable.period.split("-");
    setSelectedVariable(variable);
    setVariableForm({
      employeeId: variable.employeeId,
      employeeName: variable.employeeName,
      year,
      month,
      type: variable.type,
      amount: variable.amount.toString(),
      description: variable.description || "",
      h_jour: "",
      h_dimanche: "",
      h_ferie: "",
      h_nuit: "",
      h_dimanche_nuit: "",
      h_ferie_nuit: "",
      h_supp_25: "",
      h_supp_50: "",
      h_compl_10: "",
      nbre_paniers: "",
      frais_restauration: "",
      prime: "",
      indemnite_habillage: "",
      tenue: "",
      nbre_deplacement: "",
      autres_indemnites: "",
    });
    setIsEditMode(true);
    setIsVariableModalOpen(true);
  };

  const handleCreateOrUpdateVariable = () => {
    const period = `${variableForm.year}-${variableForm.month.padStart(2, "0")}-01`;
    if (isEditMode && selectedVariable) {
      // Update existing variable
      setVariables(
        variables.map((v) =>
          v.id === selectedVariable.id
            ? {
                ...v,
                employeeId: variableForm.employeeId,
                employeeName: variableForm.employeeName,
                period,
                type: variableForm.type,
                amount: parseFloat(variableForm.amount),
                description: variableForm.description,
                updatedAt: new Date(),
              }
            : v,
        ),
      );
    } else {
      // Create new variables for each non-empty type
      const newVariables: PayrollVariable[] = [];
      const types = [
        "h_jour",
        "h_dimanche",
        "h_ferie",
        "h_nuit",
        "h_dimanche_nuit",
        "h_ferie_nuit",
        "h_supp_25",
        "h_supp_50",
        "h_compl_10",
        "nbre_paniers",
        "frais_restauration",
        "prime",
        "indemnite_habillage",
        "tenue",
        "nbre_deplacement",
        "autres_indemnites",
      ].filter((t) => !t.startsWith("h_"));
      types.forEach((type) => {
        const amountStr = (variableForm as Record<string, string>)[type];
        if (amountStr && parseFloat(amountStr) > 0) {
          const variable: PayrollVariable = {
            id: `VAR${Date.now()}-${type}`,
            employeeId: variableForm.employeeId,
            employeeName: variableForm.employeeName,
            period,
            type: type as PayrollVariableType,
            amount: parseFloat(amountStr),
            currency: "EUR",
            description: variableForm.description,
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          newVariables.push(variable);
        }
      });
      setVariables([...variables, ...newVariables]);
    }

    setIsVariableModalOpen(false);
    setIsEditMode(false);
    setEmployeeSearchOpen(false);
    setEmployeeSearchQuery("");
    const now = new Date();
    setVariableForm({
      employeeId: "",
      employeeName: "",
      year: now.getFullYear().toString(),
      month: (now.getMonth() + 1).toString().padStart(2, "0"),
      type: "h_jour" as PayrollVariableType,
      amount: "",
      description: "",
      h_jour: "",
      h_dimanche: "",
      h_ferie: "",
      h_nuit: "",
      h_dimanche_nuit: "",
      h_ferie_nuit: "",
      h_supp_25: "",
      h_supp_50: "",
      h_compl_10: "",
      nbre_paniers: "",
      frais_restauration: "",
      prime: "",
      indemnite_habillage: "",
      tenue: "",
      nbre_deplacement: "",
      autres_indemnites: "",
    });
  };

  const filteredEmployees = mockEmployees.filter((employee) =>
    `${employee.firstName} ${employee.lastName} ${employee.employeeNumber}`
      .toLowerCase()
      .includes(employeeSearchQuery.toLowerCase()),
  );

  const handleOpenCreateModal = () => {
    const now = new Date();
    setIsEditMode(false);
    setSelectedVariable(null);
    setVariableForm({
      employeeId: "",
      employeeName: "",
      year: now.getFullYear().toString(),
      month: (now.getMonth() + 1).toString().padStart(2, "0"),
      type: "h_jour" as PayrollVariableType,
      amount: "",
      description: "",
      h_jour: "",
      h_dimanche: "",
      h_ferie: "",
      h_nuit: "",
      h_dimanche_nuit: "",
      h_ferie_nuit: "",
      h_supp_25: "",
      h_supp_50: "",
      h_compl_10: "",
      nbre_paniers: "",
      frais_restauration: "",
      prime: "",
      indemnite_habillage: "",
      tenue: "",
      nbre_deplacement: "",
      autres_indemnites: "",
    });
    setIsVariableModalOpen(true);
  };

  const filteredVariables = variables.filter((v) => !v.type.startsWith("h_"));

  const [viewMode, setViewMode] = useState<"consolidated" | "detailed">(
    "consolidated",
  );

  const pivotRows = useMemo<EmployeePivot[]>(() => {
    const map = new Map<string, EmployeePivot>();
    for (const v of filteredVariables) {
      let row = map.get(v.employeeId);
      if (!row) {
        row = {
          employeeId: v.employeeId,
          employeeName: v.employeeName,
          amounts: {},
          total: 0,
        };
        map.set(v.employeeId, row);
      }
      row.amounts[v.type] = (row.amounts[v.type] ?? 0) + v.amount;
      if (!v.type.startsWith("nbre_")) row.total += v.amount;
    }
    return Array.from(map.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variables]);

  const pivotColumns: ColumnDef<EmployeePivot>[] = [
    {
      key: "employee",
      label: "Employé",
      icon: Users,
      sortable: true,
      sortValue: (r) => r.employeeName,
      render: (r) => (
        <div>
          <Link
            href={`/dashboard/hr/collaborators/${r.employeeId}`}
            className="font-medium text-primary hover:underline"
          >
            {r.employeeName}
          </Link>
          <div className="text-sm text-muted-foreground">{r.employeeId}</div>
        </div>
      ),
    },
    ...NON_HOUR_TYPES.map(
      (t): ColumnDef<EmployeePivot> => ({
        key: t,
        label: variableTypeLabels[t],
        sortable: true,
        sortValue: (r) => r.amounts[t] ?? 0,
        render: (r) => {
          const val = r.amounts[t] ?? 0;
          return (
            <span className={val ? "" : "text-muted-foreground"}>
              {t.startsWith("nbre_")
                ? val.toLocaleString("fr-FR")
                : `${val.toLocaleString("fr-FR")} €`}
            </span>
          );
        },
      }),
    ),
    {
      key: "total",
      label: "Total (€)",
      sortable: true,
      sortValue: (r) => r.total,
      render: (r) => (
        <span className="font-medium">
          {r.total.toLocaleString("fr-FR")} €
        </span>
      ),
    },
  ];

  const individualColumns: ColumnDef<PayrollVariable>[] = [
    {
      key: "employee",
      label: "Employé",
      icon: Users,
      sortable: true,
      sortValue: (item) => item.employeeName,
      render: (item) => (
        <div>
          <div className="font-medium">
            <Link
              href={`/dashboard/hr/collaborators/${item.employeeId}`}
              className="text-primary hover:underline"
            >
              {item.employeeName}
            </Link>
          </div>
          <div className="text-sm text-muted-foreground">{item.employeeId}</div>
        </div>
      ),
    },
    {
      key: "period",
      label: "Période",
      icon: Calendar,
      sortable: true,
      render: (item) => {
        const date = new Date(item.period);
        return (
          <span className="text-sm">
            {date.toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
            })}
          </span>
        );
      },
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (item) => <span>{variableTypeLabels[item.type]}</span>,
    },
    {
      key: "amount",
      label: "Montant",
      sortable: true,
      sortValue: (item) => item.amount,
      render: (item) => (
        <span className="font-medium">
          {item.type.startsWith("nbre_")
            ? item.amount.toLocaleString("fr-FR")
            : `${item.amount.toLocaleString("fr-FR")} €`}
        </span>
      ),
    },
    {
      key: "validated",
      label: "Statut",
      sortable: true,
      render: (item) => (
        <Badge
          variant={
            item.status === "validated"
              ? "default"
              : item.status === "refused"
                ? "destructive"
                : "secondary"
          }
        >
          {item.status === "validated"
            ? "Validé"
            : item.status === "refused"
              ? "Refusé"
              : "En attente"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Variables de paie
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Gestion des primes, indemnités et majorations
          </p>
        </div>
        <Button onClick={handleOpenCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle variable
        </Button>
      </div>
      {/* Stats Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Euro}
          title="Total déclarations"
          value={filteredVariables.length}
          subtext="Déclarations"
          color="gray"
        />

        <InfoCard
          icon={Clock}
          title="En attente de validation"
          value={filteredVariables.filter((v) => v.status === "pending").length}
          subtext="À valider"
          color="orange"
        />

        <InfoCard
          icon={Euro}
          title="Montant total"
          value={`${variables
            .reduce((sum, v) => sum + v.amount, 0)
            .toLocaleString("fr-FR")} €`}
          subtext="Variables validées"
          color="blue"
        />

        <InfoCard
          icon={CheckCircle}
          title="Taux de validation"
          value={`${
            filteredVariables.length > 0
              ? Math.round(
                  (filteredVariables.filter((v) => v.status === "validated")
                    .length /
                    filteredVariables.length) *
                    100,
                )
              : 0
          }%`}
          subtext="Variables validées"
          color="green"
        />
      </InfoCardContainer>
      {/* Bascule de vue */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "consolidated" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("consolidated")}
        >
          Par salarié
        </Button>
        <Button
          variant={viewMode === "detailed" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("detailed")}
        >
          Détaillé
        </Button>
      </div>

      {viewMode === "consolidated" ? (
        <DataTable
          data={pivotRows}
          columns={pivotColumns}
          searchKeys={["employeeName"]}
          getSearchValue={(r) => r.employeeName}
          searchPlaceholder="Rechercher par employé..."
          getRowId={(r) => r.employeeId}
        />
      ) : (
        <DataTable
          data={filteredVariables}
          columns={individualColumns}
          searchKeys={["employeeName"]}
        getSearchValue={(item) => item.employeeName}
        searchPlaceholder="Rechercher par employé..."
        getRowId={(item) => item.id}
        filters={[
          {
            key: "status",
            label: "Statut",
            options: [
              { value: "all", label: "Tous" },
              { value: "validated", label: "Validé" },
              { value: "pending", label: "En attente" },
              { value: "refused", label: "Refusé" },
            ],
          },
        ]}
        groupBy={groupBy}
        groupByOptions={[
          { value: "employeeName", label: "Employé" },
          { value: "period", label: "Période" },
        ]}
        groupByLabel={(value: unknown) =>
          groupBy === "period"
            ? new Date(value as string).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
              })
            : (value as string)
        }
        onGroupByChange={setGroupBy}
        actions={(item: PayrollVariable) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedVariable(item);
                  setIsViewModalOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEditVariable(item)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (confirm("Supprimer cette variable ?")) {
                    setVariables(variables.filter((v) => v.id !== item.id));
                  }
                }}
                className="flex items-center gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        />
      )}
      {/* View Variable Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de la variable de paie"
        size="md"
      >
        {selectedVariable && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Employé</Label>
                <p className="text-sm text-muted-foreground">
                  <Link
                    href={`/dashboard/hr/collaborators/${selectedVariable.employeeId}`}
                    className="text-primary hover:underline"
                  >
                    {selectedVariable.employeeName}
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedVariable.employeeId}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <p className="text-sm text-muted-foreground">
                  {variableTypeLabels[selectedVariable.type]}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Période</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedVariable.period).toLocaleDateString(
                    "fr-FR",
                    {
                      year: "numeric",
                      month: "long",
                    },
                  )}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  {selectedVariable.type.startsWith("nbre_")
                    ? "Nombre"
                    : "Montant"}
                </Label>
                <p className="text-sm font-medium">
                  {selectedVariable.type.startsWith("nbre_")
                    ? selectedVariable.amount.toLocaleString("fr-FR")
                    : `${selectedVariable.amount.toLocaleString("fr-FR")} €`}
                </p>
              </div>
            </div>

            {selectedVariable.description && (
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedVariable.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedVariable.status === "validated"
                        ? "default"
                        : selectedVariable.status === "refused"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {selectedVariable.status === "validated"
                      ? "Validé"
                      : selectedVariable.status === "refused"
                        ? "Refusé"
                        : "En attente"}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  {selectedVariable.status === "validated"
                    ? "Validé par"
                    : selectedVariable.status === "refused"
                      ? "Refusé par"
                      : "Traité par"}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedVariable.processedBy || "-"}
                </p>
              </div>
            </div>

            {selectedVariable.notes && (
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedVariable.notes}
                </p>
              </div>
            )}

            {selectedVariable.status === "pending" && (
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium">Notes</Label>
                <div className="mt-2 space-y-4">
                  <Textarea
                    placeholder="Ajouter des notes..."
                    value={validationNotes}
                    onChange={(e) => setValidationNotes(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleValidate(selectedVariable, validationNotes);
                        setIsViewModalOpen(false);
                        setValidationNotes("");
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        handleRefuse(selectedVariable, validationNotes);
                        setIsViewModalOpen(false);
                        setValidationNotes("");
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Refuser
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                Créée le{" "}
                {selectedVariable.createdAt.toLocaleDateString("fr-FR")}
                {selectedVariable.status !== "pending" &&
                  selectedVariable.processedBy && (
                    <span> par {selectedVariable.processedBy}</span>
                  )}
              </div>
              <div>
                {selectedVariable.processedAt
                  ? `Traitée le ${selectedVariable.processedAt.toLocaleDateString("fr-FR")}`
                  : `Modifiée le ${selectedVariable.updatedAt.toLocaleDateString("fr-FR")}`}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Variable Modal (Create/Edit) */}
      <Modal
        open={isVariableModalOpen}
        onOpenChange={(open) => {
          setIsVariableModalOpen(open);
          if (!open) {
            setEmployeeSearchOpen(false);
            setEmployeeSearchQuery("");
          }
        }}
        type="form"
        title={
          isEditMode
            ? "Modifier la variable de paie"
            : "Nouvelle déclaration de variables de paie"
        }
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsVariableModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: isEditMode ? "Mettre à jour" : "Créer les variables",
            onClick: handleCreateOrUpdateVariable,
            disabled:
              !variableForm.employeeName ||
              (isEditMode ? !variableForm.amount : false),
          },
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">
              Employé <span className="text-destructive">*</span>
            </Label>
            <div className="relative" ref={employeeSearchRef}>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setEmployeeSearchOpen(!employeeSearchOpen)}
              >
                {variableForm.employeeName || "Sélectionner un employé"}
                <Users className="h-4 w-4 opacity-50" />
              </Button>
              {employeeSearchOpen && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
                  <div className="p-2">
                    <Input
                      placeholder="Rechercher un employé..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="mb-2"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <button
                          key={employee.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-3"
                          onClick={() => handleSelectEmployee(employee)}
                        >
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                            {employee.firstName[0]}
                            {employee.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.employeeNumber} • {employee.position}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Aucun employé trouvé
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Année</Label>
              <Select
                value={variableForm.year}
                onValueChange={(value) =>
                  setVariableForm((prev) => ({ ...prev, year: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'année" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = (new Date().getFullYear() - 5 + i).toString();
                    return (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Mois</Label>
              <Select
                value={variableForm.month}
                onValueChange={(value) =>
                  setVariableForm((prev) => ({ ...prev, month: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le mois" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, "0");
                    const monthName = new Date(2000, i, 1).toLocaleDateString(
                      "fr-FR",
                      { month: "long" },
                    );
                    return (
                      <SelectItem key={month} value={month}>
                        {monthName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isEditMode ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="type">Type de variable</Label>
                <Select
                  value={variableForm.type}
                  onValueChange={(value) =>
                    setVariableForm((prev) => ({
                      ...prev,
                      type: value as PayrollVariableType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(variableTypeLabels)
                      .filter(([type]) => !type.startsWith("h_"))
                      .map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">
                  {variableForm.type.startsWith("h_")
                    ? "Nombre d'heures"
                    : variableForm.type.startsWith("nbre_")
                      ? "Nombre"
                      : "Montant (€)"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={variableForm.amount}
                  onChange={(e) =>
                    setVariableForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(variableTypeLabels)
                .filter(([type]) => !type.startsWith("h_"))
                .map(([type, label]) => {
                  const isHours = type.startsWith("h_");
                  const isCount = type.startsWith("nbre_");
                  const unit = isHours ? " (heures)" : isCount ? "" : " (€)";
                  return (
                    <div key={type} className="space-y-2">
                      <Label htmlFor={type}>
                        {label}
                        {unit}
                      </Label>
                      <Input
                        id={type}
                        type="number"
                        step="0.01"
                        value={(variableForm as Record<string, string>)[type]}
                        onChange={(e) =>
                          setVariableForm((prev) => ({
                            ...prev,
                            [type]: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                      />
                    </div>
                  );
                })}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={variableForm.description}
              onChange={(e) =>
                setVariableForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Description de la variable"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
