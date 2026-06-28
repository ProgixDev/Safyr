"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HoursInput } from "@/components/ui/hours-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Plus,
  MoreVertical,
  Eye,
  Trash2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { mockCSEDelegationHours } from "@/data/time-management";
import { mockEmployees } from "@/data/employees";

export default function CSEHoursPage() {
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<
    (typeof allSessions)[0] | null
  >(null);
  const [sessionToDelete, setSessionToDelete] = useState<
    (typeof allSessions)[0] | null
  >(null);
  const [validationComment, setValidationComment] = useState("");
  const [sessionFormData, setSessionFormData] = useState({
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    duration: 0,
    type: "meeting" as
      | "meeting"
      | "employee_reception"
      | "inquiry"
      | "training",
    description: "",
  });

  // Flatten sessions for table display
  const [allSessions, setAllSessions] = useState(
    mockCSEDelegationHours.flatMap((member) =>
      member.sessions.map((session) => ({
        ...session,
        employeeName: member.employeeName,
        employeeId: member.employeeId,
        cseRole: member.cseRole,
        allocatedHours: member.allocatedHours,
        usedHours: member.usedHours,
      })),
    ),
  );

  const totalAllocated = mockCSEDelegationHours.reduce(
    (sum, m) => sum + m.allocatedHours,
    0,
  );
  const totalUsed = mockCSEDelegationHours.reduce(
    (sum, m) => sum + m.usedHours,
    0,
  );
  const totalSessions = mockCSEDelegationHours.reduce(
    (sum, m) => sum + m.sessions.length,
    0,
  );

  const getSessionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      meeting: "Réunion",
      employee_reception: "Réception salariés",
      inquiry: "Enquête",
      training: "Formation",
    };
    return types[type] || type;
  };

  const getSessionTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      meeting: "bg-blue-100 text-blue-800",
      employee_reception: "bg-green-100 text-green-800",
      inquiry: "bg-orange-100 text-orange-800",
      training: "bg-purple-100 text-purple-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const handleViewDetails = (session: (typeof allSessions)[0]) => {
    setSelectedSession(session);
    setValidationComment("");
    setIsDetailsModalOpen(true);
  };

  const handleValidation = (
    approved: boolean,
    sessionId: string,
    comment?: string,
  ) => {
    // TODO: API call to validate/reject session
    console.log("Validation:", {
      approved,
      comment,
      sessionId,
    });

    // Update sessions
    setAllSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              validated: approved,
              validatedBy: "Current User",
              validatedAt: new Date(),
              validationComment: comment || "",
            }
          : session,
      ),
    );

    // If modal is open for this session, close it
    if (selectedSession?.id === sessionId) {
      setIsDetailsModalOpen(false);
      setSelectedSession(null);
      setValidationComment("");
    }
  };

  const handleDeleteClick = (session: (typeof allSessions)[0]) => {
    setSessionToDelete(session);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (sessionToDelete) {
      setAllSessions((prev) => prev.filter((s) => s.id !== sessionToDelete.id));
      setIsDeleteModalOpen(false);
      setSessionToDelete(null);
    }
  };

  const sessionColumns: ColumnDef<(typeof allSessions)[0]>[] = [
    {
      key: "employeeName",
      label: "Élu CSE",
      sortable: true,
      render: (session) => (
        <div className="min-w-0">
          <p className="font-semibold truncate">{session.employeeName}</p>
          <Badge variant="outline" className="text-xs mt-1">
            {session.cseRole}
          </Badge>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (session) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          <span className="text-sm">
            {new Date(session.date).toLocaleDateString("fr-FR")}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (session) => (
        <Badge className={getSessionTypeBadge(session.type)}>
          {getSessionTypeLabel(session.type)}
        </Badge>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (session) => (
        <span className="text-sm truncate block max-w-xs">
          {session.description}
        </span>
      ),
    },
    {
      key: "duration",
      label: "Durée",
      sortable: true,
      render: (session) => (
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span className="font-semibold">{session.duration}h</span>
        </div>
      ),
    },
    {
      key: "validated",
      label: "Statut",
      sortable: true,
      render: (session) =>
        session.validated ? (
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Validé
          </Badge>
        ) : (
          <Badge variant="outline" className="text-orange-600">
            <Clock className="mr-1 h-3 w-3" />
            En attente
          </Badge>
        ),
    },
  ];

  const sessionActions = (session: (typeof allSessions)[0]) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-semibold">Actions</div>
        <div className="border-t my-1" />
        <button
          className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
          onClick={() => handleViewDetails(session)}
        >
          <Eye className="mr-2 h-4 w-4 text-green-600" />
          Voir
        </button>
        {session.validated === false && (
          <>
            <button
              className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
              onClick={() => handleValidation(true, session.id)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approuver
            </button>
            <button
              className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm text-red-600"
              onClick={() => handleValidation(false, session.id)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Refuser
            </button>
          </>
        )}
        <div className="border-t my-1" />
        <button
          className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm text-red-600"
          onClick={() => handleDeleteClick(session)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </button>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Heures de Délégation CSE
          </h1>
          <p className="text-muted-foreground">
            Suivi complet des heures des élus et délégués du personnel
          </p>
        </div>
        <Button onClick={() => setIsNewSessionModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle séance
        </Button>
      </div>

      {/* Statistics Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Users}
          title="Élus CSE"
          value={mockCSEDelegationHours.length}
          subtext="Actifs ce mois"
          color="gray"
        />

        <InfoCard
          icon={Clock}
          title="Heures Allouées"
          value={`${totalAllocated}h`}
          subtext="Total du mois"
          color="blue"
        />

        <InfoCard
          icon={CheckCircle}
          title="Heures Utilisées"
          value={`${totalUsed}h`}
          subtext={`${Math.round((totalUsed / totalAllocated) * 100)}% du crédit`}
          color="green"
        />

        <InfoCard
          icon={Calendar}
          title="Séances"
          value={totalSessions}
          subtext="Ce mois-ci"
          color="orange"
        />
      </InfoCardContainer>

      {/* CSE Hours Table */}
      <Card>
        <CardHeader>
          <CardTitle>Séances de délégation CSE</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={allSessions}
            columns={sessionColumns}
            searchKeys={["employeeName", "description"]}
            searchPlaceholder="Rechercher par élu ou description..."
            itemsPerPage={10}
            filters={[
              {
                key: "type",
                label: "Type",
                options: [
                  { value: "all", label: "Tous" },
                  { value: "meeting", label: "Réunion" },
                  { value: "employee_reception", label: "Réception salariés" },
                  { value: "inquiry", label: "Enquête" },
                  { value: "training", label: "Formation" },
                ],
              },
              {
                key: "validated",
                label: "Statut",
                options: [
                  { value: "all", label: "Tous" },
                  { value: "true", label: "Validées" },
                  { value: "false", label: "En attente" },
                ],
              },
            ]}
            actions={sessionActions}
          />
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Modal
        open={isDetailsModalOpen}
        onOpenChange={(open) => {
          setIsDetailsModalOpen(open);
          if (!open) {
            setSelectedSession(null);
            setValidationComment("");
          }
        }}
        type="details"
        title={`Séance CSE - ${selectedSession?.employeeName}`}
        description={
          selectedSession
            ? `${getSessionTypeLabel(selectedSession.type)} du ${new Date(selectedSession.date).toLocaleDateString("fr-FR")}`
            : ""
        }
        actions={
          selectedSession?.validated === false
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
                      selectedSession.id,
                      validationComment,
                    ),
                },
                tertiary: {
                  label: "Refuser",
                  onClick: () =>
                    handleValidation(
                      false,
                      selectedSession.id,
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
        {selectedSession && (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex justify-center">
              {selectedSession.validated ? (
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Validé
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600">
                  <Clock className="mr-1 h-3 w-3" />
                  En attente
                </Badge>
              )}
            </div>

            {/* Session Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Date
                </label>
                <p className="mt-1 font-medium">
                  {new Date(selectedSession.date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Durée
                </label>
                <p className="mt-1 font-medium">{selectedSession.duration}h</p>
              </div>
            </div>

            {/* Session Type */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Type de séance
              </label>
              <div className="mt-2">
                <Badge className={getSessionTypeBadge(selectedSession.type)}>
                  {getSessionTypeLabel(selectedSession.type)}
                </Badge>
              </div>
            </div>

            {/* Description */}
            {selectedSession.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="mt-1">{selectedSession.description}</p>
              </div>
            )}

            {/* Employee Info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-1">
                <p className="font-semibold">{selectedSession.employeeName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedSession.cseRole} -{" "}
                  {
                    mockEmployees.find(
                      (e) => e.id === selectedSession.employeeId,
                    )?.employeeNumber
                  }
                </p>
              </div>
            </div>

            {/* Hours Usage */}
            <div className="space-y-3">
              <h4 className="font-medium">Utilisation des heures</h4>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm">Allouées</span>
                  <span className="font-semibold">
                    {selectedSession.allocatedHours}h
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <span className="text-sm">Utilisées</span>
                  <span className="font-semibold text-blue-600">
                    {selectedSession.usedHours}h
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <span className="text-sm">Restantes</span>
                  <span className="font-semibold text-green-600">
                    {selectedSession.allocatedHours - selectedSession.usedHours}
                    h
                  </span>
                </div>
              </div>
              <Progress
                value={
                  (selectedSession.usedHours / selectedSession.allocatedHours) *
                  100
                }
                className="h-2"
              />
            </div>

            {/* Validation Section */}
            {selectedSession.validated === false && (
              <>
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
            {selectedSession.validated && selectedSession.validatedBy && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      Validé par {selectedSession.validatedBy}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Le{" "}
                    {new Date(selectedSession.validatedAt!).toLocaleDateString(
                      "fr-FR",
                    )}{" "}
                    à{" "}
                    {new Date(selectedSession.validatedAt!).toLocaleTimeString(
                      "fr-FR",
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* New Session Modal */}
      <Modal
        open={isNewSessionModalOpen}
        onOpenChange={setIsNewSessionModalOpen}
        type="form"
        title="Nouvelle séance CSE"
        description="Créer une nouvelle séance pour un élu CSE"
        actions={{
          primary: {
            label: "Créer la séance",
            onClick: () => {
              // Here you would normally save to database
              console.log("Creating new CSE session:", sessionFormData);
              setIsNewSessionModalOpen(false);
              setSessionFormData({
                employeeId: "",
                date: new Date().toISOString().split("T")[0],
                duration: 0,
                type: "meeting",
                description: "",
              });
            },
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsNewSessionModalOpen(false),
          },
        }}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cse-employee">Élu CSE</Label>
              <Select
                value={sessionFormData.employeeId}
                onValueChange={(value) =>
                  setSessionFormData({ ...sessionFormData, employeeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un élu CSE" />
                </SelectTrigger>
                <SelectContent>
                  {mockEmployees
                    .filter(
                      (employee) =>
                        employee.department === "Management" ||
                        employee.position.includes("CSE"),
                    )
                    .map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} -{" "}
                        {employee.employeeNumber}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-date">Date</Label>
              <Input
                id="session-date"
                type="date"
                value={sessionFormData.date}
                onChange={(e) =>
                  setSessionFormData({
                    ...sessionFormData,
                    date: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-type">Type de séance</Label>
              <Select
                value={sessionFormData.type}
                onValueChange={(
                  value:
                    | "meeting"
                    | "employee_reception"
                    | "inquiry"
                    | "training",
                ) => setSessionFormData({ ...sessionFormData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Réunion</SelectItem>
                  <SelectItem value="employee_reception">
                    Réception salariés
                  </SelectItem>
                  <SelectItem value="inquiry">Enquête</SelectItem>
                  <SelectItem value="training">Formation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Durée (heures)
              </Label>
              <HoursInput
                value={sessionFormData.duration}
                onChange={(value) =>
                  setSessionFormData({
                    ...sessionFormData,
                    duration: value,
                  })
                }
                step={0.5}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Décrivez l'objet de la séance..."
              value={sessionFormData.description}
              onChange={(e) =>
                setSessionFormData({
                  ...sessionFormData,
                  description: e.target.value,
                })
              }
              rows={3}
            />
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium mb-2">Récapitulatif</h4>
            <div className="text-sm space-y-1">
              <div>
                Élu CSE:{" "}
                <strong>
                  {sessionFormData.employeeId
                    ? mockEmployees.find(
                        (e) => e.id === sessionFormData.employeeId,
                      )?.firstName +
                      " " +
                      mockEmployees.find(
                        (e) => e.id === sessionFormData.employeeId,
                      )?.lastName
                    : "Non sélectionné"}
                </strong>
              </div>
              <div>
                Date:{" "}
                <strong>
                  {new Date(sessionFormData.date).toLocaleDateString("fr-FR")}
                </strong>
              </div>
              <div>
                Type:{" "}
                <strong>{getSessionTypeLabel(sessionFormData.type)}</strong>
              </div>
              <div>
                Durée: <strong>{sessionFormData.duration}h</strong>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        type="confirmation"
        title="Supprimer la séance"
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
          Êtes-vous sûr de vouloir supprimer la séance de{" "}
          <span className="font-semibold">{sessionToDelete?.employeeName}</span>{" "}
          ({sessionToDelete ? getSessionTypeLabel(sessionToDelete.type) : ""}) ?
          Cette action est irréversible.
        </p>
      </Modal>
    </div>
  );
}
