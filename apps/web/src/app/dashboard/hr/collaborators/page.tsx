"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Badge } from "@/components/ui/badge";
import { EmployeeAvatar } from "@/components/employees/EmployeeAvatar";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { EmployeeCreateDialog } from "@/components/employees/EmployeeCreateDialog";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import {
  Plus,
  AlertCircle,
  Users,
  UserCheck,
  FileWarning,
  FolderOpen,
  Route,
  Trash2,
  User as UserIcon,
  Mail,
  Phone,
  Send,
  X,
} from "lucide-react";
import type { Employee } from "@/lib/types";
import { useSendEmail } from "@/hooks/useSendEmail";
import {
  useEmployees,
  useEmployeeStats,
  useDeleteEmployee,
  employeeKeys,
} from "@/hooks/employees";
import { toUiEmployee } from "@/lib/employee-adapter";
import { useMutationState } from "@tanstack/react-query";
import type { CreateEmployeePayload } from "@safyr/api-client";
import { Loader2 } from "lucide-react";

const selectPendingCreate = (m: { state: { variables: unknown } }) =>
  m.state.variables as CreateEmployeePayload;
const selectPendingDelete = (m: { state: { variables: unknown } }) =>
  m.state.variables as string;

export default function EmployeesPage() {
  const router = useRouter();
  const { data: apiEmployees, isLoading: isEmployeesLoading } = useEmployees();
  const { data: apiStats } = useEmployeeStats();
  const deleteEmployeeMutation = useDeleteEmployee();
  const pendingCreates = useMutationState<CreateEmployeePayload>({
    filters: { mutationKey: employeeKeys.create(), status: "pending" },
    select: selectPendingCreate,
  });
  const pendingDeleteIds = useMutationState<string>({
    filters: { mutationKey: employeeKeys.delete(), status: "pending" },
    select: selectPendingDelete,
  });
  const pendingDeleteIdSet = useMemo(
    () => new Set(pendingDeleteIds),
    [pendingDeleteIds],
  );
  const employees = useMemo(() => {
    const real = apiEmployees?.map(toUiEmployee) ?? [];
    const pending: Employee[] = pendingCreates.map((p, i) =>
      pendingToEmployee(p, i),
    );
    return [...pending, ...real];
  }, [apiEmployees, pendingCreates]);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null,
  );
  const { openEmailModal } = useSendEmail();
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);

  const handleDelete = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    await deleteEmployeeMutation.mutateAsync(employeeToDelete.id);
    setIsDeleteModalOpen(false);
    setEmployeeToDelete(null);
  };

  const handleViewProfile = (employee: Employee) => {
    router.push(`/dashboard/hr/collaborators/${employee.id}`);
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteModalOpen(true);
  };

  const confirmBulkDelete = async () => {
    await Promise.all(
      selectedEmployees.map((emp) =>
        deleteEmployeeMutation.mutateAsync(emp.id),
      ),
    );
    setSelectedEmployees([]);
    setIsBulkDeleteModalOpen(false);
  };

  const handleBulkEmail = () => {
    openEmailModal(selectedEmployees, () => {
      setSelectedEmployees([]);
    });
  };

  const handleClearSelection = () => {
    setSelectedEmployees([]);
  };

  const columns: ColumnDef<Employee>[] = [
    {
      key: "employee",
      label: "Employé",
      icon: UserIcon,
      sortable: true,
      sortValue: (employee) => `${employee.firstName} ${employee.lastName}`,
      render: (employee) => {
        const isCreating = employee.id.startsWith("__pending_");
        const isDeleting = pendingDeleteIdSet.has(employee.id);
        const showSpinner = isCreating || isDeleting;
        const label = isCreating
          ? "(création…)"
          : isDeleting
            ? "(suppression…)"
            : null;
        return (
          <div className="flex items-center gap-3">
            <EmployeeAvatar
              firstName={employee.firstName}
              lastName={employee.lastName}
              photo={employee.photo}
              loading={showSpinner}
            />
            <div>
              <div className="font-medium">
                {employee.firstName} {employee.lastName}
                {label && (
                  <span className="ml-2 text-xs text-muted-foreground italic">
                    {label}
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {employee.employeeNumber}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "position",
      label: "Poste",
      sortable: true,
      render: (employee) => (
        <Badge
          variant="secondary"
          className="bg-primary/10 font-normal text-primary"
        >
          {employee.position}
        </Badge>
      ),
    },
    {
      key: "email",
      label: "Contact",
      icon: Mail,
      sortable: true,
      render: (employee) => (
        <div className="text-sm">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <Mail className="h-3 w-3" />
            {employee.email}
          </div>
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <Phone className="h-3 w-3" />
            {employee.phone}
          </div>
        </div>
      ),
    },
    {
      key: "hireDate",
      label: "Date d'embauche",
      sortable: true,
      render: (employee) => {
        const annees = Math.floor(
          (Date.now() - new Date(employee.hireDate).getTime()) /
            (365.25 * 86_400_000),
        );
        return (
          <div className="text-sm">
            <div>{new Date(employee.hireDate).toLocaleDateString("fr-FR")}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400">
              {annees < 1
                ? "Moins d’un an"
                : `${annees} an${annees > 1 ? "s" : ""} d’ancienneté`}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Dossiers salariés
          </h1>
          <p className="mt-2 text-base font-light text-muted-foreground">
            Accès aux dossiers individuels des collaborateurs
          </p>
        </div>
        <Button
          onClick={() => setIsNewEmployeeModalOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouveau salarié
        </Button>
      </div>

      {/* Stats Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Users}
          title="Total Employés"
          value={apiStats?.total ?? 0}
          subtext={`${apiStats?.active ?? 0} actifs`}
          color="gray"
        />

        <InfoCard
          icon={UserCheck}
          title="Actifs"
          value={apiStats?.active ?? 0}
          subtext={
            apiStats && apiStats.total > 0
              ? `${((apiStats.active / apiStats.total) * 100).toFixed(1)}% du total`
              : "—"
          }
          color="green"
        />

        <InfoCard
          icon={AlertCircle}
          title="Alertes expiration"
          value={0}
          subtext="Certificats à renouveler"
          color="orange"
        />

        <InfoCard
          icon={FileWarning}
          title="Contrats en attente"
          value={0}
          subtext="Signatures requises"
          color="blue"
        />
      </InfoCardContainer>

      {/* Bulk Actions Toolbar */}
      {selectedEmployees.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {selectedEmployees.length} employé(s) sélectionné(s)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkEmail}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Envoyer un email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employees DataTable */}
      <DataTable
        data={employees}
        isLoading={isEmployeesLoading}
        columns={columns}
        searchKeys={["firstName", "lastName", "email", "employeeNumber"]}
        getSearchValue={(employee) =>
          `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.employeeNumber}`
        }
        searchPlaceholder="Rechercher par nom, email, ou numéro d'employé..."
        selectable={true}
        onSelectionChange={setSelectedEmployees}
        getRowId={(employee) => employee.id}
        onRowClick={handleViewProfile}
        rowClassName={(employee) =>
          employee.id.startsWith("__pending_") ||
          pendingDeleteIdSet.has(employee.id)
            ? "opacity-60 pointer-events-none"
            : ""
        }
        actions={(employee) => (
          // Menu d'actions standard du logiciel : icônes colorées identiques
          // partout (voir = vert, modifier = orange, supprimer = rouge).
          <RowActionsMenu
            viewLabel="Voir le profil"
            onView={() => handleViewProfile(employee)}
            onEdit={() =>
              router.push(
                `/dashboard/hr/collaborators/${employee.id}?edit=true`,
              )
            }
            extraItems={[
              {
                label: "Documents",
                icon: FolderOpen,
                tone: "upload",
                onClick: () =>
                  router.push(
                    `/dashboard/hr/collaborators/${employee.id}?tab=documents`,
                  ),
              },
              {
                label: "Parcours d'intégration",
                icon: Route,
                tone: "history",
                onClick: () =>
                  router.push(
                    `/dashboard/hr/lifecycle/onboarding?employee=${employee.id}`,
                  ),
              },
            ]}
            onDelete={() => handleDelete(employee)}
          />
        )}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        type="warning"
        title="Supprimer l'employé"
        description="Cette action est irréversible et supprimera toutes les données associées."
        closable={false}
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsDeleteModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: "Supprimer",
            onClick: confirmDelete,
            variant: "destructive",
          },
        }}
      >
        {employeeToDelete && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Vous êtes sur le point de supprimer définitivement :
            </p>
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <EmployeeAvatar
                  firstName={employeeToDelete.firstName}
                  lastName={employeeToDelete.lastName}
                  photo={employeeToDelete.photo}
                />
                <div>
                  <div className="font-medium">
                    {employeeToDelete.firstName} {employeeToDelete.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {employeeToDelete.position} -{" "}
                    {employeeToDelete.employeeNumber}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm font-medium text-destructive">
              Cette action supprimera également :
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>{employeeToDelete.contracts.length} contrat(s)</li>
              <li>Tous les documents associés</li>
              <li>L&apos;historique des équipements</li>
              <li>Les données de présence et congés</li>
            </ul>
          </div>
        )}
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        open={isBulkDeleteModalOpen}
        onOpenChange={setIsBulkDeleteModalOpen}
        type="warning"
        title="Suppression multiple"
        description={`Vous allez supprimer ${selectedEmployees.length} employé(s)`}
        closable={false}
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsBulkDeleteModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: `Supprimer ${selectedEmployees.length} employé(s)`,
            onClick: confirmBulkDelete,
            variant: "destructive",
          },
        }}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cette action est irréversible et supprimera toutes les données
            associées pour les employés suivants :
          </p>
          <div className="rounded-lg border bg-muted/30 p-3 max-h-50 overflow-y-auto">
            <div className="space-y-2">
              {selectedEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center gap-3 py-1">
                  <EmployeeAvatar
                    firstName={employee.firstName}
                    lastName={employee.lastName}
                    photo={employee.photo}
                    className="h-8 w-8"
                  />
                  <div className="text-sm">
                    <span className="font-medium">
                      {employee.firstName} {employee.lastName}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      - {employee.employeeNumber}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm font-medium text-destructive">
            Toutes les données associées (contrats, documents, équipements,
            historiques) seront également supprimées.
          </p>
        </div>
      </Modal>

      <EmployeeCreateDialog
        open={isNewEmployeeModalOpen}
        onOpenChange={setIsNewEmployeeModalOpen}
      />
    </div>
  );
}

function pendingToEmployee(p: CreateEmployeePayload, idx: number): Employee {
  const now = new Date().toISOString();
  return toUiEmployee({
    id: `__pending_${idx}`,
    organizationId: "",
    userId: "",
    role: p.role ?? "agent",
    createdAt: now,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    phone: p.phone ?? null,
    birthDate: p.dateOfBirth ?? null,
    birthPlace: p.placeOfBirth ?? null,
    nationality: p.nationality ?? null,
    gender: p.gender ?? null,
    civilStatus: p.civilStatus ?? null,
    children: p.children ?? null,
    socialSecurityNumber: p.socialSecurityNumber ?? null,
    cartePro: p.cartePro ?? null,
    employeeNumber: p.employeeNumber,
    hireDate: p.hireDate ?? null,
    position: p.position,
    contractType: p.contractType ?? null,
    workSchedule: p.workSchedule ?? null,
    status: p.status ?? "active",
    terminatedAt: null,
    dressingAllowance: p.dressingAllowance ?? false,
    addressRecord: {
      id: "",
      memberId: "",
      street: p.address.street,
      city: p.address.city,
      postalCode: p.address.postalCode,
      country: p.address.country ?? "France",
      createdAt: now,
      updatedAt: now,
    },
    bankDetails: {
      id: "",
      memberId: "",
      iban: p.bankDetails.iban,
      bic: p.bankDetails.bic,
      bankName: p.bankDetails.bankName,
      createdAt: now,
      updatedAt: now,
    },
    certifications: [],
    documents: [],
    user: { id: "", email: p.email, name: `${p.firstName} ${p.lastName}` },
  });
}
