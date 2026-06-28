"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { EmployeeCreateDialog } from "@/components/employees/EmployeeCreateDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  AlertCircle,
  Users,
  UserCheck,
  FileWarning,
  MoreVertical,
  Eye,
  Pencil,
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

const STATUS_VARIANTS = {
  active: { variant: "default" as const, label: "Actif" },
  inactive: { variant: "secondary" as const, label: "Inactif" },
  suspended: { variant: "destructive" as const, label: "Suspendu" },
  terminated: { variant: "outline" as const, label: "Terminé" },
};

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

  const getStatusBadge = (status: Employee["status"]) => {
    const config = STATUS_VARIANTS[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

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
            <Avatar className="h-10 w-10">
              {showSpinner ? (
                <AvatarFallback>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage src={employee.photo} alt={employee.firstName} />
                  <AvatarFallback>
                    {employee.firstName[0]}
                    {employee.lastName[0]}
                  </AvatarFallback>
                </>
              )}
            </Avatar>
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
        <div>
          <div className="font-medium">{employee.position}</div>
          <div className="text-sm text-muted-foreground capitalize">
            {employee.role === "owner"
              ? "Propriétaire"
              : employee.role === "agent"
                ? "Agent"
                : "—"}
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Contact",
      icon: Mail,
      sortable: true,
      render: (employee) => (
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3 text-muted-foreground" />
            {employee.email}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3" />
            {employee.phone}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (employee) => getStatusBadge(employee.status),
    },
    {
      key: "hireDate",
      label: "Date d'embauche",
      sortable: true,
      render: (employee) => (
        <span className="text-sm">
          {new Date(employee.hireDate).toLocaleDateString("fr-FR")}
        </span>
      ),
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
          Nouvel employé
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
        filters={[
          {
            key: "status",
            label: "Statut",
            options: [
              { value: "all", label: "Tous" },
              { value: "active", label: "Actif" },
              { value: "inactive", label: "Inactif" },
              { value: "suspended", label: "Suspendu" },
              { value: "terminated", label: "Terminé" },
            ],
          },
          {
            key: "role",
            label: "Rôle",
            options: [
              { value: "all", label: "Tous" },
              { value: "owner", label: "Propriétaire" },
              { value: "agent", label: "Agent" },
            ],
          },
        ]}
        actions={(employee) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleViewProfile(employee)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir le profil
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/hr/collaborators/${employee.id}?edit=true`}
                  className="flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(employee)}
                className="gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={employeeToDelete.photo}
                    alt={employeeToDelete.firstName}
                  />
                  <AvatarFallback>
                    {employeeToDelete.firstName[0]}
                    {employeeToDelete.lastName[0]}
                  </AvatarFallback>
                </Avatar>
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
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={employee.photo}
                      alt={employee.firstName}
                    />
                    <AvatarFallback className="text-xs">
                      {employee.firstName[0]}
                      {employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
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
    employeeNumber: p.employeeNumber,
    hireDate: p.hireDate ?? null,
    position: p.position,
    contractType: p.contractType ?? null,
    workSchedule: p.workSchedule ?? null,
    status: p.status ?? "active",
    terminatedAt: null,
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
