"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Download,
  Eye,
  MoreVertical,
  Trash2,
  Pencil,
  History,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TimeOffRequest } from "@/lib/types";
import { useEmployeeOptions } from "@/hooks/employees";
import { useRegistre } from "@/hooks/fiscal";

/** Ligne enregistrée en base : les dates y sont des chaînes ISO. */
function raviverDemande(ligne: Record<string, unknown>): TimeOffRequest {
  const enDate = (v: unknown) => (v ? new Date(v as string) : undefined);
  return {
    ...(ligne as unknown as TimeOffRequest),
    startDate: enDate(ligne.startDate) ?? new Date(),
    endDate: enDate(ligne.endDate) ?? new Date(),
    createdAt: enDate(ligne.createdAt) ?? new Date(),
    updatedAt: enDate(ligne.updatedAt) ?? new Date(),
    validatedAt: enDate(ligne.validatedAt),
  };
}

export default function TimeManagementPage() {
  // Les demandes sont enregistrées en base : elles ne vivaient auparavant
  // que dans l'état React ("TODO: Save to database via API") et
  // disparaissaient au rechargement de la page.
  const registre = useRegistre<TimeOffRequest & { id: string }>("conge", []);
  const requests = registre.lignes.map((l) =>
    raviverDemande(l as unknown as Record<string, unknown>),
  );
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<TimeOffRequest | null>(
    null,
  );
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(
    null,
  );
  const [newRequestData, setNewRequestData] = useState({
    employeeId: "",
    type: "vacation" as TimeOffRequest["type"],
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [validationComment, setValidationComment] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<TimeOffRequest | null>(
    null,
  );
  const [editData, setEditData] = useState({
    type: "vacation" as TimeOffRequest["type"],
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyRequest, setHistoryRequest] = useState<TimeOffRequest | null>(
    null,
  );

  // Salariés réels de l'entreprise : cet écran proposait auparavant douze
  // noms fictifs (Jean Dupont, Marie Martin…) au lieu du dossier du personnel.
  const mockEmployees = useEmployeeOptions();

  const filteredEmployees = mockEmployees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      employee.employeeNumber
        .toLowerCase()
        .includes(employeeSearch.toLowerCase()) ||
      employee.department.toLowerCase().includes(employeeSearch.toLowerCase()),
  );

  const getStatusBadge = (status: TimeOffRequest["status"]) => {
    const variants = {
      pending: {
        variant: "secondary" as const,
        label: "En attente",
        icon: Clock,
        className:
          "border-transparent bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-500/20 dark:text-orange-300",
      },
      approved: {
        variant: "default" as const,
        label: "Approuvé",
        icon: CheckCircle,
        className:
          "border-transparent bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-500/20 dark:text-green-300",
      },
      rejected: {
        variant: "destructive" as const,
        label: "Refusé",
        icon: XCircle,
        className: "",
      },
      cancelled: {
        variant: "outline" as const,
        label: "Annulé",
        icon: XCircle,
        className: "",
      },
    };
    return variants[status];
  };

  const getTypeLabel = (type: TimeOffRequest["type"]) => {
    const labels = {
      vacation: "Congés",
      sick_leave: "Arrêt maladie",
      unpaid_leave: "Congé sans solde",
      maternity_leave: "Congé maternité",
      paternity_leave: "Congé paternité",
      family_event: "Événement familial",
      training: "Formation",
      cse_delegation: "Délégation CSE",
    };
    return labels[type];
  };

  const handleNewRequestChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setNewRequestData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateDays = () => {
    if (!newRequestData.startDate || !newRequestData.endDate) return 0;
    const start = new Date(newRequestData.startDate);
    const end = new Date(newRequestData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleCreateRequest = () => {
    const selectedEmployee = mockEmployees.find(
      (emp) => emp.id === newRequestData.employeeId,
    );

    const newRequest: TimeOffRequest = {
      id: `REQ${Date.now()}`,
      employeeId: newRequestData.employeeId,
      employeeName: selectedEmployee?.name || "Unknown Employee",
      employeeNumber: selectedEmployee?.employeeNumber || "Unknown",
      department: selectedEmployee?.department || "Unknown",
      type: newRequestData.type,
      startDate: new Date(newRequestData.startDate),
      endDate: new Date(newRequestData.endDate),
      totalDays: calculateDays(),
      reason: newRequestData.reason,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    void registre.enregistrer(newRequest, {
      period: newRequestData.startDate.slice(0, 7),
      label: `${newRequest.employeeName} — ${getTypeLabel(newRequest.type)}`,
      status: newRequest.status,
    });

    // Reset form and close modal
    setNewRequestData({
      employeeId: "",
      type: "vacation",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setEmployeeSearch("");
    setIsEmployeeDropdownOpen(false);
    setIsNewRequestModalOpen(false);
  };

  const handleEmployeeSelect = (employee: (typeof mockEmployees)[0]) => {
    setNewRequestData((prev) => ({ ...prev, employeeId: employee.id }));
    setEmployeeSearch(`${employee.name} (${employee.employeeNumber})`);
    setIsEmployeeDropdownOpen(false);
  };

  const handleViewDetails = (request: TimeOffRequest) => {
    setSelectedRequest(request);
    setValidationComment("");
    setIsDetailsModalOpen(true);
  };

  const toIso = (d: Date) => new Date(d).toISOString().split("T")[0];

  const enregistrerDemande = (demande: TimeOffRequest) =>
    registre.enregistrer(demande, {
      period: toIso(demande.startDate).slice(0, 7),
      label: `${demande.employeeName} — ${getTypeLabel(demande.type)}`,
      status: demande.status,
    });

  const handleValidation = (
    approved: boolean,
    requestId: string,
    comment?: string,
  ) => {
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    void enregistrerDemande({
      ...request,
      status: approved ? "approved" : "rejected",
      validatedBy: "Current User",
      validatedAt: new Date(),
      validationComment: comment || "",
    });

    // If modal is open for this request, close it
    if (selectedRequest?.id === requestId) {
      setIsDetailsModalOpen(false);
      setSelectedRequest(null);
      setValidationComment("");
    }
  };

  const handleDeleteClick = (request: TimeOffRequest) => {
    setRequestToDelete(request);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (requestToDelete) {
      void registre.supprimerLigne(requestToDelete.id);
      setIsDeleteModalOpen(false);
      setRequestToDelete(null);
    }
  };

  const handleEdit = (request: TimeOffRequest) => {
    setEditingRequest(request);
    setEditData({
      type: request.type,
      startDate: toIso(request.startDate),
      endDate: toIso(request.endDate),
      reason: request.reason ?? "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingRequest) return;
    const start = new Date(editData.startDate);
    const end = new Date(editData.endDate);
    const totalDays = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / 86400000) + 1,
    );
    void enregistrerDemande({
      ...editingRequest,
      type: editData.type,
      startDate: start,
      endDate: end,
      reason: editData.reason,
      totalDays,
      updatedAt: new Date(),
    });
    setIsEditModalOpen(false);
    setEditingRequest(null);
  };

  const handleHistory = (request: TimeOffRequest) => {
    setHistoryRequest(request);
    setIsHistoryModalOpen(true);
  };

  const requestColumns: ColumnDef<TimeOffRequest>[] = [
    {
      key: "employee",
      label: "Employé",
      sortable: true,
      render: (request) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`/avatars/employee-${request.employeeId}.jpg`} />
            <AvatarFallback>
              {request.employeeName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate">{request.employeeName}</p>
            <p className="text-sm text-muted-foreground truncate">
              {request.employeeNumber}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (request) => (
        <span className="text-sm">{getTypeLabel(request.type)}</span>
      ),
    },
    {
      key: "department",
      label: "Département",
      sortable: true,
      render: (request) => (
        <span className="text-sm truncate">{request.department}</span>
      ),
    },
    {
      key: "period",
      label: "Période",
      sortable: true,
      sortValue: (request) => request.startDate.getTime(),
      render: (request) => (
        <div className="space-y-1">
          <div className="text-sm">
            {request.startDate.toLocaleDateString("fr-FR")} -{" "}
            {request.endDate.toLocaleDateString("fr-FR")}
          </div>
          <div className="text-xs text-muted-foreground">
            {request.totalDays} jour{request.totalDays > 1 ? "s" : ""}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (request) => {
        const statusConfig = getStatusBadge(request.status);
        const StatusIcon = statusConfig.icon;
        return (
          <Badge
            variant={statusConfig.variant}
            className={`flex items-center gap-1 w-fit ${statusConfig.className}`}
          >
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        );
      },
    },
  ];

  const requestActions = (request: TimeOffRequest) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleViewDetails(request)}>
          <Eye className="mr-2 h-4 w-4 text-green-600" />
          Voir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEdit(request)}>
          <Pencil className="mr-2 h-4 w-4 text-orange-500" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleHistory(request)}>
          <History className="mr-2 h-4 w-4 text-blue-500" />
          Historique
        </DropdownMenuItem>
        {request.status === "pending" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleValidation(true, request.id)}
            >
              <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
              Approuver
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleValidation(false, request.id)}
              className="text-red-600"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Refuser
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => handleDeleteClick(request)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4 text-red-600" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Statistiques calculées depuis les vraies demandes plutôt que depuis un
  // objet fictif déconnecté de la liste affichée.
  const now = new Date();
  const totalAbsenceDays = requests.reduce((sum, r) => sum + r.totalDays, 0);
  const pendingRequests = requests.filter(
    (r) => r.status === "pending",
  ).length;
  const approvedRequests = requests.filter(
    (r) => r.status === "approved",
  ).length;
  const dureesReponse = requests
    .filter((r) => r.validatedAt)
    .map(
      (r) =>
        (r.validatedAt!.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60),
    );
  const averageResponseTime = dureesReponse.length
    ? Math.round(
        dureesReponse.reduce((sum, h) => sum + h, 0) / dureesReponse.length,
      )
    : 0;
  const employeesOnLeave = new Set(
    requests
      .filter(
        (r) =>
          r.status === "approved" &&
          r.startDate <= now &&
          r.endDate >= now,
      )
      .map((r) => r.employeeId),
  ).size;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Temps & Absences
          </h1>
          <p className="text-muted-foreground">
            Gestion des congés, absences et heures travaillées
          </p>
        </div>
        <Button onClick={() => setIsNewRequestModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle demande
        </Button>
      </div>

      {/* Stats Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Calendar}
          title="Total Demandes"
          value={requests.length}
          subtext={`${totalAbsenceDays} jours au total`}
          color="gray"
        />

        <InfoCard
          icon={Clock}
          title="En attente"
          value={pendingRequests}
          subtext={`Temps moyen: ${averageResponseTime}h`}
          color="orange"
        />

        <InfoCard
          icon={CheckCircle}
          title="Approuvées"
          value={approvedRequests}
          subtext={`${
            requests.length
              ? ((approvedRequests / requests.length) * 100).toFixed(0)
              : 0
          }% du total`}
          color="green"
        />

        <InfoCard
          icon={Users}
          title="Employés absents"
          value={employeesOnLeave}
          subtext="Actuellement en congé"
          color="blue"
        />
      </InfoCardContainer>

      {/* Requests Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Demandes de congés</CardTitle>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4 text-violet-500" />
            Exporter
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            onRowClick={handleViewDetails}
            data={requests}
            columns={requestColumns}
            searchKeys={["employeeName", "employeeNumber", "department"]}
            searchPlaceholder="Rechercher par nom, numéro ou département..."
            itemsPerPage={10}
            filters={[
              {
                key: "status",
                label: "Statut",
                options: [
                  { value: "all", label: "Tous les statuts" },
                  { value: "pending", label: "En attente" },
                  { value: "approved", label: "Approuvé" },
                  { value: "rejected", label: "Refusé" },
                  { value: "cancelled", label: "Annulé" },
                ],
              },
              {
                key: "type",
                label: "Type",
                options: [
                  { value: "all", label: "Tous les types" },
                  { value: "vacation", label: "Congés" },
                  { value: "sick_leave", label: "Arrêt maladie" },
                  { value: "unpaid_leave", label: "Congé sans solde" },
                  { value: "maternity_leave", label: "Congé maternité" },
                  { value: "paternity_leave", label: "Congé paternité" },
                  { value: "family_event", label: "Événement familial" },
                  { value: "training", label: "Formation" },
                  { value: "cse_delegation", label: "Délégation CSE" },
                ],
              },
            ]}
            actions={requestActions}
          />
        </CardContent>
      </Card>

      {/* New Request Modal */}
      <Modal
        open={isNewRequestModalOpen}
        onOpenChange={(open) => {
          setIsNewRequestModalOpen(open);
          if (!open) {
            setNewRequestData({
              employeeId: "",
              type: "vacation",
              startDate: "",
              endDate: "",
              reason: "",
            });
            setEmployeeSearch("");
            setIsEmployeeDropdownOpen(false);
          }
        }}
        type="form"
        title="Nouvelle demande d'absence"
        description="Créer une demande de congé ou d'absence"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsNewRequestModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: "Soumettre la demande",
            onClick: handleCreateRequest,
            disabled:
              !newRequestData.employeeId ||
              !newRequestData.startDate ||
              !newRequestData.endDate,
          },
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeSearch">
              Employé <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="employeeSearch"
                type="text"
                placeholder="Rechercher et sélectionner un employé..."
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setIsEmployeeDropdownOpen(true);
                }}
                onFocus={() => setIsEmployeeDropdownOpen(true)}
                onBlur={() => {
                  // Delay closing to allow click on options
                  setTimeout(() => setIsEmployeeDropdownOpen(false), 200);
                }}
              />
              {isEmployeeDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <button
                        key={employee.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                        onClick={() => handleEmployeeSelect(employee)}
                      >
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.employeeNumber} - {employee.department}
                        </div>
                      </button>
                    ))
                  ) : employeeSearch ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Aucun employé trouvé
                    </div>
                  ) : (
                    mockEmployees.slice(0, 5).map((employee) => (
                      <button
                        key={employee.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                        onClick={() => handleEmployeeSelect(employee)}
                      >
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.employeeNumber} - {employee.department}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">
              Type d&apos;absence <span className="text-red-500">*</span>
            </Label>
            <Select
              value={newRequestData.type}
              onValueChange={(value: TimeOffRequest["type"]) =>
                setNewRequestData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vacation">Congés payés</SelectItem>
                <SelectItem value="sick_leave">Arrêt maladie</SelectItem>
                <SelectItem value="unpaid_leave">Congé sans solde</SelectItem>
                <SelectItem value="maternity_leave">Congé maternité</SelectItem>
                <SelectItem value="paternity_leave">Congé paternité</SelectItem>
                <SelectItem value="family_event">Événement familial</SelectItem>
                <SelectItem value="training">Formation</SelectItem>
                <SelectItem value="cse_delegation">Délégation CSE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Date de début <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={newRequestData.startDate}
                onChange={handleNewRequestChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                Date de fin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={newRequestData.endDate}
                onChange={handleNewRequestChange}
                min={newRequestData.startDate}
                required
              />
            </div>
          </div>

          {newRequestData.startDate && newRequestData.endDate && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium">
                Durée: {calculateDays()} jour{calculateDays() > 1 ? "s" : ""}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Motif (optionnel)</Label>
            <Textarea
              id="reason"
              name="reason"
              value={newRequestData.reason}
              onChange={handleNewRequestChange}
              placeholder="Précisez le motif de votre demande..."
              rows={4}
            />
          </div>

          <div className="rounded-md border border-muted bg-muted/50 p-4">
            <h4 className="font-medium mb-2">📋 Informations importantes</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • Les demandes de congés doivent être faites au moins 2 mois à
                l&apos;avance
              </li>
              <li>
                • Les arrêts maladie doivent être déclarés dans moins de 48h
              </li>
              <li>
                • Les congés maternité/paternité doivent être déclarés au moins
                2 mois à l&apos;avance
              </li>
              <li>• Les heures de délégation CSE sont soumises à validation</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        type="details"
        title={`Demande #${selectedRequest?.id}`}
        description={
          selectedRequest
            ? `${getTypeLabel(selectedRequest.type)} - ${selectedRequest.employeeName}`
            : ""
        }
        actions={
          selectedRequest?.status === "pending"
            ? {
                secondary: {
                  label: "Fermer",
                  onClick: () => setIsDetailsModalOpen(false),
                  variant: "outline",
                },
                primary: {
                  label: "Approuver",
                  onClick: () =>
                    handleValidation(
                      true,
                      selectedRequest.id,
                      validationComment,
                    ),
                },
                tertiary: {
                  label: "Refuser",
                  onClick: () =>
                    handleValidation(
                      false,
                      selectedRequest.id,
                      validationComment,
                    ),
                  variant: "destructive",
                },
              }
            : {
                secondary: {
                  label: "Fermer",
                  onClick: () => setIsDetailsModalOpen(false),
                  variant: "outline",
                },
              }
        }
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex justify-center">
              {(() => {
                const statusConfig = getStatusBadge(selectedRequest.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <Badge
                    variant={statusConfig.variant}
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    <StatusIcon className="h-4 w-4" />
                    {statusConfig.label}
                  </Badge>
                );
              })()}
            </div>

            {/* Request Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Type de demande
                </label>
                <p className="mt-1 font-medium">
                  {getTypeLabel(selectedRequest.type)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Durée
                </label>
                <p className="mt-1 font-medium">
                  {selectedRequest.totalDays} jour
                  {selectedRequest.totalDays > 1 ? "s" : ""}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Date de début
                </label>
                <p className="mt-1 font-medium">
                  {selectedRequest.startDate.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Date de fin
                </label>
                <p className="mt-1 font-medium">
                  {selectedRequest.endDate.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {selectedRequest.reason && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Motif
                </label>
                <p className="mt-1">{selectedRequest.reason}</p>
              </div>
            )}

            {/* Employee Info */}
            <Separator />
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={`/avatars/employee-${selectedRequest.employeeId}.jpg`}
                />
                <AvatarFallback>
                  {selectedRequest.employeeName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{selectedRequest.employeeName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.employeeNumber} -{" "}
                  {selectedRequest.department}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/dashboard/hr/collaborators/${selectedRequest.employeeId}`}
                >
                  Voir le profil
                </Link>
              </Button>
            </div>

            {/* Validation Section */}
            {selectedRequest.status === "pending" && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Commentaire (optionnel)
                  </Label>
                  <Textarea
                    value={validationComment}
                    onChange={(e) => setValidationComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Validation History */}
            {(selectedRequest.status === "approved" ||
              selectedRequest.status === "rejected") && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const StatusIcon = getStatusBadge(
                        selectedRequest.status,
                      ).icon;
                      return <StatusIcon className="h-4 w-4" />;
                    })()}
                    <span className="font-medium">
                      {selectedRequest.status === "approved"
                        ? "Approuvé"
                        : "Refusé"}{" "}
                      par {selectedRequest.validatedBy}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Le{" "}
                    {selectedRequest.validatedAt?.toLocaleDateString("fr-FR")} à{" "}
                    {selectedRequest.validatedAt?.toLocaleTimeString("fr-FR")}
                  </p>
                  {selectedRequest.validationComment && (
                    <div className="mt-3 rounded-md bg-muted p-3">
                      <p className="text-sm">
                        {selectedRequest.validationComment}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        type="confirmation"
        title="Supprimer la demande"
        actions={{
          primary: {
            label: "Supprimer",
            onClick: handleDeleteConfirm,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsDeleteModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <p>
          Êtes-vous sûr de vouloir supprimer la demande de congé de{" "}
          <span className="font-semibold">{requestToDelete?.employeeName}</span>{" "}
          ({requestToDelete?.type}) ? Cette action est irréversible.
        </p>
      </Modal>

      {/* Modifier (correction) */}
      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        type="form"
        title="Modifier la demande"
        actions={{
          primary: { label: "Enregistrer", onClick: handleSaveEdit },
          secondary: {
            label: "Annuler",
            onClick: () => setIsEditModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select
              value={editData.type}
              onValueChange={(v) =>
                setEditData({ ...editData, type: v as TimeOffRequest["type"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vacation">Congés payés</SelectItem>
                <SelectItem value="sick_leave">Arrêt maladie</SelectItem>
                <SelectItem value="unpaid_leave">Congé sans solde</SelectItem>
                <SelectItem value="maternity_leave">Congé maternité</SelectItem>
                <SelectItem value="paternity_leave">Congé paternité</SelectItem>
                <SelectItem value="family_event">Événement familial</SelectItem>
                <SelectItem value="training">Formation</SelectItem>
                <SelectItem value="cse_delegation">Délégation CSE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date de début</Label>
              <Input
                type="date"
                value={editData.startDate}
                onChange={(e) =>
                  setEditData({ ...editData, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={editData.endDate}
                onChange={(e) =>
                  setEditData({ ...editData, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <Label>Motif</Label>
            <Textarea
              value={editData.reason}
              onChange={(e) =>
                setEditData({ ...editData, reason: e.target.value })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Les informations proviennent du planning ; vous pouvez les corriger
            ici si besoin.
          </p>
        </div>
      </Modal>

      {/* Historique */}
      <Modal
        open={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
        type="form"
        title="Historique de la demande"
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setIsHistoryModalOpen(false),
            variant: "outline",
          },
        }}
      >
        {historyRequest && (
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="w-40 shrink-0 text-muted-foreground">
                {new Date(historyRequest.createdAt).toLocaleString("fr-FR")}
              </span>
              <span>Demande créée</span>
            </div>
            {historyRequest.validatedAt && (
              <div className="flex gap-3">
                <span className="w-40 shrink-0 text-muted-foreground">
                  {new Date(historyRequest.validatedAt).toLocaleString("fr-FR")}
                </span>
                <span>
                  {historyRequest.status === "approved"
                    ? "Approuvée"
                    : "Refusée"}
                  {historyRequest.validatedBy
                    ? ` par ${historyRequest.validatedBy}`
                    : ""}
                  {historyRequest.validationComment
                    ? ` — « ${historyRequest.validationComment} »`
                    : ""}
                </span>
              </div>
            )}
            <div className="flex gap-3">
              <span className="w-40 shrink-0 text-muted-foreground">
                {new Date(historyRequest.updatedAt).toLocaleString("fr-FR")}
              </span>
              <span>Dernière modification</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
