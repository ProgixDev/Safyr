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
  DropdownMenuSeparator,
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
  Shirt,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type {
  PayrollVariable,
  PayrollVariableType,
  Employee,
} from "@/lib/types";
import { mockEmployees } from "@/data/employees";
import {
  usePayrollVariables,
  useCreatePayrollVariable,
  useDeletePayrollVariable,
  useUpdateAnyPayrollVariable,
} from "@/hooks/payroll";

// Constante pour le taux d'indemnité d'habillage (par heure)
const CLOTHING_ALLOWANCE_RATE = 0.50; // 0.50€ par heure travaillée

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

// Ajouter un champ hasClothingAllowance aux employés mockés
const employeesWithAllowance = mockEmployees.map(emp => ({
  ...emp,
  hasClothingAllowance: ["EMP001", "EMP002", "EMP005", "EMP004"].includes(emp.id),
  clothingAllowanceRate: CLOTHING_ALLOWANCE_RATE,
}));

// Fonction pour calculer automatiquement l'indemnité d'habillage
const calculateClothingAllowance = (
  employeeId: string,
  totalHours: number,
  employees: Employee[]
): number => {
  const employee = employees.find(e => e.id === employeeId);
  if (!employee?.hasClothingAllowance) return 0;
  
  const rate = (employee as any).clothingAllowanceRate || CLOTHING_ALLOWANCE_RATE;
  return Math.round(totalHours * rate * 100) / 100;
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

  const { data: rawVariables = [] } = usePayrollVariables();
  const createVariableMutation = useCreatePayrollVariable();
  const deleteVariableMutation = useDeletePayrollVariable();
  const updateVariableMutation = useUpdateAnyPayrollVariable();

  const variables: PayrollVariable[] = rawVariables.map((v) => ({
    ...v,
    type: v.type as PayrollVariableType,
    description: v.description ?? undefined,
    notes: v.notes ?? undefined,
    createdAt: new Date(v.createdAt),
    updatedAt: new Date(v.updatedAt),
  }));
  
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
  const [showAutoAllowanceInfo, setShowAutoAllowanceInfo] = useState(false);
  const [autoCalculatedAllowance, setAutoCalculatedAllowance] = useState<{
    employeeId: string;
    amount: number;
    hours: number;
  } | null>(null);

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
    updateVariableMutation.mutate({
      id: variable.id,
      data: { status: "validated", notes },
    });
  };

  const handleRefuse = (variable: PayrollVariable, notes: string) => {
    updateVariableMutation.mutate({
      id: variable.id,
      data: { status: "refused", notes },
    });
  };

  const handleSelectEmployee = (employee: Employee) => {
    const empWithAllowance = employeesWithAllowance.find(e => e.id === employee.id);
    setVariableForm((prev) => ({
      ...prev,
      employeeId: employee.employeeNumber,
      employeeName: `${employee.firstName} ${employee.lastName}`,
    }));
    setEmployeeSearchOpen(false);
    setEmployeeSearchQuery("");
    
    if (empWithAllowance?.hasClothingAllowance) {
      setShowAutoAllowanceInfo(true);
    } else {
      setShowAutoAllowanceInfo(false);
      setAutoCalculatedAllowance(null);
    }
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

  const handleCreateOrUpdateVariable = async () => {
    const period = `${variableForm.year}-${variableForm.month.padStart(2, "0")}-01`;
    try {
      if (isEditMode && selectedVariable) {
        await updateVariableMutation.mutateAsync({
          id: selectedVariable.id,
          data: {
            employeeId: variableForm.employeeId,
            employeeName: variableForm.employeeName,
            period,
            type: variableForm.type,
            amount: parseFloat(variableForm.amount),
            description: variableForm.description,
          },
        });
      } else {
        const employee = employeesWithAllowance.find(
          e => e.employeeNumber === variableForm.employeeId
        );
        
        // Calculer le total des heures
        const hourTypes = ["h_jour", "h_dimanche", "h_ferie", "h_nuit", "h_dimanche_nuit", "h_ferie_nuit", "h_supp_25", "h_supp_50", "h_compl_10"];
        let totalHours = 0;
        hourTypes.forEach(type => {
          const value = parseFloat((variableForm as Record<string, string>)[type]) || 0;
          totalHours += value;
        });

        // Calculer l'indemnité d'habillage
        const clothingAllowance = calculateClothingAllowance(
          variableForm.employeeId, 
          totalHours, 
          employeesWithAllowance
        );

        if (employee?.hasClothingAllowance && clothingAllowance > 0) {
          setAutoCalculatedAllowance({
            employeeId: variableForm.employeeId,
            amount: clothingAllowance,
            hours: totalHours,
          });
        }

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
        ];
        
        const toCreate = types
          .map((type) => {
            let amount = 0;
            if (type === "indemnite_habillage" && employee?.hasClothingAllowance && clothingAllowance > 0) {
              amount = clothingAllowance;
            } else {
              amount = parseFloat((variableForm as Record<string, string>)[type]) || 0;
            }
            return { type, amount };
          })
          .filter(({ amount }) => amount > 0);

        await Promise.all(
          toCreate.map(({ type, amount }) =>
            createVariableMutation.mutateAsync({
              employeeId: variableForm.employeeId,
              employeeName: variableForm.employeeName,
              period,
              type,
              amount,
              currency: "EUR",
              description: type === "indemnite_habillage" && employee?.hasClothingAllowance && clothingAllowance > 0
                ? `Indemnité d'habillage - ${totalHours}h à ${CLOTHING_ALLOWANCE_RATE}€/h`
                : variableForm.description || "",
              status: "pending",
            })
          )
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Échec de l'enregistrement : ${message}`);
      return;
    }

    setIsVariableModalOpen(false);
    setIsEditMode(false);
    setEmployeeSearchOpen(false);
    setEmployeeSearchQuery("");
    setShowAutoAllowanceInfo(false);
    setAutoCalculatedAllowance(null);
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

  const filteredEmployees = employeesWithAllowance.filter((employee) =>
    `${employee.firstName} ${employee.lastName} ${employee.employeeNumber} ${employee.position}`
      .toLowerCase()
      .includes(employeeSearchQuery.toLowerCase()),
  );

  const handleOpenCreateModal = () => {
    const now = new Date();
    setIsEditMode(false);
    setSelectedVariable(null);
    setShowAutoAllowanceInfo(false);
    setAutoCalculatedAllowance(null);
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
          const isClothingAllowance = t === "indemnite_habillage";
          return (
            <span className={val ? "" : "text-muted-foreground"}>
              {isClothingAllowance && val > 0 && (
                <Shirt className="inline h-3 w-3 mr-1 text-purple-500" />
              )}
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
    {
      key: "actions",
      label: "Actions",
      render: (row: EmployeePivot) => {
        const employeeVariables = filteredVariables.filter(
          (v) => v.employeeId === row.employeeId
        );
        
        if (employeeVariables.length === 0) return null;
        
        const firstVariable = employeeVariables[0];
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedVariable(firstVariable);
                  setIsViewModalOpen(true);
                }}
                className="text-green-600 focus:text-green-700 focus:bg-green-50"
              >
                <Eye className="h-4 w-4 mr-2 text-green-600" />
                Voir
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEditVariable(firstVariable)}
                className="text-orange-600 focus:text-orange-700 focus:bg-orange-50"
              >
                <Edit className="h-4 w-4 mr-2 text-orange-600" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (confirm(`Supprimer toutes les variables de ${row.employeeName} ?`)) {
                    employeeVariables.forEach(v => {
                      deleteVariableMutation.mutate(v.id);
                    });
                  }
                }}
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
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
      render: (item) => (
        <span className="flex items-center gap-1">
          {item.type === "indemnite_habillage" && (
            <Shirt className="h-3 w-3 text-purple-500" />
          )}
          {variableTypeLabels[item.type]}
        </span>
      ),
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
    {
      key: "actions",
      label: "Actions",
      render: (item: PayrollVariable) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setSelectedVariable(item);
                setIsViewModalOpen(true);
              }}
              className="text-green-600 focus:text-green-700 focus:bg-green-50"
            >
              <Eye className="h-4 w-4 mr-2 text-green-600" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleEditVariable(item)}
              className="text-orange-600 focus:text-orange-700 focus:bg-orange-50"
            >
              <Edit className="h-4 w-4 mr-2 text-orange-600" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (confirm(`Supprimer cette variable ?`)) {
                  deleteVariableMutation.mutate(item.id);
                }
              }}
              className="text-red-600 focus:text-red-700 focus:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2 text-red-600" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const totalClothingAllowance = variables
    .filter(v => v.type === "indemnite_habillage")
    .reduce((sum, v) => sum + v.amount, 0);

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
          icon={Shirt}
          title="Indemnités habillage"
          value={`${totalClothingAllowance.toLocaleString("fr-FR")} €`}
          subtext="Calculées automatiquement"
          color="purple"
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

      {/* Info sur l'indemnité d'habillage automatique */}
      {autoCalculatedAllowance && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shirt className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Indemnité d'habillage calculée automatiquement
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {autoCalculatedAllowance.amount.toFixed(2)}€ pour {autoCalculatedAllowance.hours}h travaillées
                (taux: {CLOTHING_ALLOWANCE_RATE}€/h)
              </p>
            </div>
          </div>
        </div>
      )}

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
            {
              key: "type",
              label: "Type",
              options: [
                { value: "all", label: "Tous" },
                ...Object.entries(variableTypeLabels)
                  .filter(([type]) => !type.startsWith("h_"))
                  .map(([value, label]) => ({
                    value,
                    label,
                  })),
              ],
            },
          ]}
          groupBy={groupBy}
          groupByOptions={[
            { value: "employeeName", label: "Employé" },
            { value: "period", label: "Période" },
            { value: "type", label: "Type" },
          ]}
          groupByLabel={(value: unknown) => {
            if (groupBy === "period") {
              return new Date(value as string).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
              });
            }
            if (groupBy === "type") {
              return variableTypeLabels[value as PayrollVariableType] || value as string;
            }
            return value as string;
          }}
          onGroupByChange={setGroupBy}
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
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  {selectedVariable.type === "indemnite_habillage" && (
                    <Shirt className="h-4 w-4 text-purple-500" />
                  )}
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

            {selectedVariable.type === "indemnite_habillage" && (
              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shirt className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-purple-900 dark:text-purple-100">
                      Indemnité d'habillage automatique
                    </p>
                    <p className="text-purple-700 dark:text-purple-300">
                      Calculée automatiquement sur la base des heures travaillées
                    </p>
                  </div>
                </div>
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
            setShowAutoAllowanceInfo(false);
            setAutoCalculatedAllowance(null);
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
            onClick: () => {
              setIsVariableModalOpen(false);
              setShowAutoAllowanceInfo(false);
              setAutoCalculatedAllowance(null);
            },
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
                      filteredEmployees.map((employee) => {
                        const empWithAllowance = employeesWithAllowance.find(
                          e => e.id === employee.id
                        );
                        return (
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
                            <div className="flex-1">
                              <div className="font-medium">
                                {employee.firstName} {employee.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {employee.employeeNumber} • {employee.position}
                              </div>
                            </div>
                            {empWithAllowance?.hasClothingAllowance && (
                              <Badge variant="outline" className="text-xs">
                                <Shirt className="h-3 w-3 mr-1" />
                                Indemnité habillage
                              </Badge>
                            )}
                          </button>
                        );
                      })
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

          {/* Information sur l'indemnité d'habillage */}
          {showAutoAllowanceInfo && variableForm.employeeId && (
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Shirt className="h-4 w-4 text-purple-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-purple-900 dark:text-purple-100">
                    Indemnité d'habillage automatique
                  </p>
                  <p className="text-purple-700 dark:text-purple-300">
                    {`Cet employé bénéficie de l'indemnité d'habillage (${CLOTHING_ALLOWANCE_RATE}€/h). 
                    Elle sera calculée automatiquement en fonction des heures saisies.`}
                  </p>
                </div>
              </div>
            </div>
          )}

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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(variableTypeLabels)
                  .filter(([type]) => !type.startsWith("h_") && type !== "indemnite_habillage")
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
                          onChange={(e) => {
                            const value = e.target.value;
                            setVariableForm((prev) => ({
                              ...prev,
                              [type]: value,
                            }));
                            
                            // Recalcul automatique de l'indemnité d'habillage
                            const employee = employeesWithAllowance.find(
                              e => e.employeeNumber === variableForm.employeeId
                            );
                            if (employee?.hasClothingAllowance) {
                              const hourTypes = ["h_jour", "h_dimanche", "h_ferie", "h_nuit", "h_dimanche_nuit", "h_ferie_nuit", "h_supp_25", "h_supp_50", "h_compl_10"];
                              let totalHours = 0;
                              hourTypes.forEach(hType => {
                                const val = parseFloat((variableForm as Record<string, string>)[hType]) || 0;
                                totalHours += val;
                              });
                              // Mettre à jour totalHours avec la nouvelle valeur
                              if (type.startsWith("h_")) {
                                const newTotal = hourTypes.reduce((sum, hType) => {
                                  const val = parseFloat((variableForm as Record<string, string>)[hType]) || 0;
                                  return sum + val;
                                }, 0);
                                const allowance = calculateClothingAllowance(
                                  variableForm.employeeId,
                                  newTotal,
                                  employeesWithAllowance
                                );
                                if (allowance > 0) {
                                  setVariableForm((prev) => ({
                                    ...prev,
                                    indemnite_habillage: allowance.toString(),
                                  }));
                                  setAutoCalculatedAllowance({
                                    employeeId: variableForm.employeeId,
                                    amount: allowance,
                                    hours: newTotal,
                                  });
                                }
                              }
                            }
                          }}
                          placeholder="0.00"
                        />
                      </div>
                    );
                  })}
              </div>

              {/* Champ pour l'indemnité d'habillage (calculé automatiquement) */}
              <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="indemnite_habillage" className="flex items-center gap-2">
                      <Shirt className="h-4 w-4 text-purple-600" />
                      Indemnité d'habillage
                      <Badge variant="outline" className="text-xs">
                        Auto-calculée
                      </Badge>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Calculée automatiquement en fonction des heures saisies
                    </p>
                  </div>
                  <div className="w-48">
                    <Input
                      id="indemnite_habillage"
                      type="number"
                      step="0.01"
                      value={(variableForm as Record<string, string>).indemnite_habillage || "0"}
                      disabled
                      className="bg-background"
                    />
                  </div>
                </div>
                {showAutoAllowanceInfo && (
                  <p className="text-xs text-purple-600 mt-2">
                    Taux appliqué: {CLOTHING_ALLOWANCE_RATE}€ par heure travaillée
                  </p>
                )}
              </div>
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