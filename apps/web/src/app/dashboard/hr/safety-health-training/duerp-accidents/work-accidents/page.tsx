"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Download,
  MoreVertical,
  AlertTriangle,
  FileText,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { WorkAccident } from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";

// Mock employees
const mockEmployees = [
  { id: "1", name: "Marie Dupont" },
  { id: "2", name: "Jean Martin" },
  { id: "3", name: "Sophie Leroy" },
  { id: "4", name: "Pierre Durand" },
];

// Mock data
const mockWorkAccidents: WorkAccident[] = [
  {
    id: "1",
    employeeId: "1",
    accidentDate: new Date("2024-11-15"),
    accidentTime: "14:30",
    location: "Site client A - Parking",
    description:
      "Chute sur sol glissant lors d'une ronde de sécurité. Blessure au poignet droit.",
    injuries: "Entorse du poignet droit",
    witnesses: ["Jean Martin", "Sophie Leroy"],
    declarationDate: new Date("2024-11-15"),
    declarationNumber: "AT-2024-001",
    workStoppage: true,
    workStoppageStart: new Date("2024-11-16"),
    workStoppageEnd: new Date("2024-11-30"),
    returnToWork: new Date("2024-12-01"),
    severity: "moderate",
    status: "closed",
    cpamNotified: true,
    cpamNotificationDate: new Date("2024-11-16"),
    createdAt: new Date("2024-11-15"),
    updatedAt: new Date("2024-12-01"),
  },
  {
    id: "2",
    employeeId: "2",
    accidentDate: new Date("2024-12-05"),
    accidentTime: "09:15",
    location: "Site client B - Hall d'entrée",
    description:
      "Incident mineur lors du contrôle d'accès. Coupure superficielle à la main gauche.",
    injuries: "Coupure superficielle main gauche",
    declarationDate: new Date("2024-12-05"),
    declarationNumber: "AT-2024-002",
    workStoppage: false,
    severity: "minor",
    status: "declared",
    cpamNotified: true,
    cpamNotificationDate: new Date("2024-12-05"),
    createdAt: new Date("2024-12-05"),
    updatedAt: new Date("2024-12-05"),
  },
];

const severityLabels = {
  minor: "Bénin",
  moderate: "Modéré",
  severe: "Grave",
  fatal: "Mortel",
};

const severityColors = {
  minor: "secondary",
  moderate: "default",
  severe: "destructive",
  fatal: "destructive",
} as const;

const statusLabels = {
  declared: "Déclaré",
  investigating: "En investigation",
  closed: "Clôturé",
};

const statusColors = {
  declared: "default",
  investigating: "default",
  closed: "secondary",
} as const;

export default function WorkAccidentsPage() {
  const [accidents, setAccidents] = useState<WorkAccident[]>(mockWorkAccidents);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingAccident, setEditingAccident] = useState<WorkAccident | null>(
    null,
  );
  const [viewingAccident, setViewingAccident] = useState<WorkAccident | null>(
    null,
  );
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState({
    employeeId: "",
    accidentDate: "",
    accidentTime: "",
    location: "",
    description: "",
    injuries: "",
    witnesses: "",
    declarationDate: "",
    declarationNumber: "",
    workStoppage: false,
    workStoppageStart: "",
    workStoppageEnd: "",
    returnToWork: "",
    severity: "minor" as WorkAccident["severity"],
    status: "declared" as WorkAccident["status"],
    cpamNotified: false,
    cpamNotificationDate: "",
    notes: "",
  });

  const getEmployeeName = (employeeId: string) => {
    return mockEmployees.find((e) => e.id === employeeId)?.name || "N/A";
  };

  const handleCreate = () => {
    setEditingAccident(null);
    setFormData({
      employeeId: "",
      accidentDate: "",
      accidentTime: "",
      location: "",
      description: "",
      injuries: "",
      witnesses: "",
      declarationDate: new Date().toISOString().split("T")[0],
      declarationNumber: "",
      workStoppage: false,
      workStoppageStart: "",
      workStoppageEnd: "",
      returnToWork: "",
      severity: "minor",
      status: "declared",
      cpamNotified: false,
      cpamNotificationDate: "",
      notes: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (accident: WorkAccident) => {
    setEditingAccident(accident);
    setFormData({
      employeeId: accident.employeeId,
      accidentDate: accident.accidentDate.toISOString().split("T")[0],
      accidentTime: accident.accidentTime,
      location: accident.location,
      description: accident.description,
      injuries: accident.injuries,
      witnesses: accident.witnesses?.join(", ") || "",
      declarationDate: accident.declarationDate.toISOString().split("T")[0],
      declarationNumber: accident.declarationNumber || "",
      workStoppage: accident.workStoppage,
      workStoppageStart: accident.workStoppageStart
        ? accident.workStoppageStart.toISOString().split("T")[0]
        : "",
      workStoppageEnd: accident.workStoppageEnd
        ? accident.workStoppageEnd.toISOString().split("T")[0]
        : "",
      returnToWork: accident.returnToWork
        ? accident.returnToWork.toISOString().split("T")[0]
        : "",
      severity: accident.severity,
      status: accident.status,
      cpamNotified: accident.cpamNotified,
      cpamNotificationDate: accident.cpamNotificationDate
        ? accident.cpamNotificationDate.toISOString().split("T")[0]
        : "",
      notes: accident.notes || "",
    });
    setIsCreateModalOpen(true);
  };

  const handleView = (accident: WorkAccident) => {
    setViewingAccident(accident);
    setIsViewModalOpen(true);
  };

  const handleDelete = (accidentId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet accident ?")) {
      setAccidents(accidents.filter((a) => a.id !== accidentId));
    }
  };

  const handleSave = () => {
    const accidentData = {
      employeeId: formData.employeeId,
      accidentDate: new Date(formData.accidentDate),
      accidentTime: formData.accidentTime,
      location: formData.location,
      description: formData.description,
      injuries: formData.injuries,
      witnesses: formData.witnesses
        ? formData.witnesses.split(",").map((w) => w.trim())
        : undefined,
      declarationDate: new Date(formData.declarationDate),
      declarationNumber: formData.declarationNumber || undefined,
      workStoppage: formData.workStoppage,
      workStoppageStart: formData.workStoppageStart
        ? new Date(formData.workStoppageStart)
        : undefined,
      workStoppageEnd: formData.workStoppageEnd
        ? new Date(formData.workStoppageEnd)
        : undefined,
      returnToWork: formData.returnToWork
        ? new Date(formData.returnToWork)
        : undefined,
      severity: formData.severity,
      status: formData.status,
      cpamNotified: formData.cpamNotified,
      cpamNotificationDate: formData.cpamNotificationDate
        ? new Date(formData.cpamNotificationDate)
        : undefined,
      notes: formData.notes || undefined,
    };

    if (editingAccident) {
      setAccidents(
        accidents.map((accident) =>
          accident.id === editingAccident.id
            ? {
                ...accident,
                ...accidentData,
                updatedAt: new Date(),
              }
            : accident,
        ),
      );
    } else {
      const newAccident: WorkAccident = {
        id: Date.now().toString(),
        ...accidentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setAccidents([...accidents, newAccident]);
    }

    setIsCreateModalOpen(false);
  };

  const handleExportPDF = () => {
    alert(
      "Export PDF du registre des accidents du travail (conforme CNAPS)...",
    );
  };

  // Apply filters
  let filteredAccidents = accidents;

  if (filterSeverity !== "all") {
    filteredAccidents = filteredAccidents.filter(
      (a) => a.severity === filterSeverity,
    );
  }

  if (filterStatus !== "all") {
    filteredAccidents = filteredAccidents.filter(
      (a) => a.status === filterStatus,
    );
  }

  const columns: ColumnDef<WorkAccident>[] = [
    {
      key: "declarationNumber",
      label: "N° de déclaration",
      render: (accident: WorkAccident) => (
        <div className="font-medium">
          {accident.declarationNumber || "Non attribué"}
        </div>
      ),
    },
    {
      key: "employeeId",
      label: "Employé",
      render: (accident: WorkAccident) => (
        <Link
          href={`/dashboard/hr/collaborators/${accident.employeeId}`}
          className="hover:underline"
        >
          <div className="font-medium">
            {getEmployeeName(accident.employeeId)}
          </div>
          <div className="text-sm text-muted-foreground">
            {accident.location}
          </div>
        </Link>
      ),
    },
    {
      key: "accidentDate",
      label: "Date",
      render: (accident: WorkAccident) => (
        <div>
          <div>{accident.accidentDate.toLocaleDateString("fr-FR")}</div>
          <div className="text-sm text-muted-foreground">
            {accident.accidentTime}
          </div>
        </div>
      ),
    },
    {
      key: "severity",
      label: "Gravité",
      render: (accident: WorkAccident) => (
        <Badge variant={severityColors[accident.severity]}>
          {severityLabels[accident.severity]}
        </Badge>
      ),
    },
    {
      key: "workStoppage",
      label: "Arrêt de travail",
      render: (accident: WorkAccident) =>
        accident.workStoppage ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "status",
      label: "Statut",
      render: (accident: WorkAccident) => (
        <Badge variant={statusColors[accident.status]}>
          {statusLabels[accident.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (accident: WorkAccident) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(accident)}>
              <Eye className="mr-2 h-4 w-4 text-orange-500" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(accident)}>
              <Pencil className="mr-2 h-4 w-4 text-green-600" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(accident.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Calculate stats
  const totalAccidents = accidents.length;
  const activeAccidents = accidents.filter((a) => a.status !== "closed").length;
  const withStoppage = accidents.filter((a) => a.workStoppage).length;
  const severeAccidents = accidents.filter(
    (a) => a.severity === "severe" || a.severity === "fatal",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Registre des Accidents du Travail
          </h1>
          <p className="text-muted-foreground">
            Déclaration et suivi réglementaire des accidents du travail
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Déclarer un accident
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={AlertTriangle}
          title="Total"
          value={totalAccidents}
          subtext="Accidents déclarés"
          color="gray"
        />

        <InfoCard
          icon={FileText}
          title="En cours"
          value={activeAccidents}
          subtext="Non clôturés"
          color="blue"
        />

        <InfoCard
          icon={Calendar}
          title="Avec arrêt"
          value={withStoppage}
          subtext="Arrêts de travail"
          color="orange"
        />

        <InfoCard
          icon={AlertTriangle}
          title="Graves"
          value={severeAccidents}
          subtext="Accidents graves"
          color="red"
        />
      </InfoCardContainer>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Registre ({filteredAccidents.length})</CardTitle>
            <div className="flex gap-2">
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Gravité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes gravités</SelectItem>
                  <SelectItem value="minor">Bénin</SelectItem>
                  <SelectItem value="moderate">Modéré</SelectItem>
                  <SelectItem value="severe">Grave</SelectItem>
                  <SelectItem value="fatal">Mortel</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="declared">Déclaré</SelectItem>
                  <SelectItem value="investigating">
                    En investigation
                  </SelectItem>
                  <SelectItem value="closed">Clôturé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredAccidents} />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={editingAccident ? "Modifier l'accident" : "Déclarer un accident"}
        size="xl"
        actions={{
          primary: {
            label: "Enregistrer",
            onClick: handleSave,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employeeId">Employé *</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, employeeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {mockEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="declarationNumber">N° de déclaration</Label>
              <Input
                id="declarationNumber"
                value={formData.declarationNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    declarationNumber: e.target.value,
                  })
                }
                placeholder="Ex: AT-2024-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accidentDate">Date de l&apos;accident *</Label>
              <Input
                id="accidentDate"
                type="date"
                value={formData.accidentDate}
                onChange={(e) =>
                  setFormData({ ...formData, accidentDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="accidentTime">Heure de l&apos;accident *</Label>
              <Input
                id="accidentTime"
                type="time"
                value={formData.accidentTime}
                onChange={(e) =>
                  setFormData({ ...formData, accidentTime: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Lieu de l&apos;accident *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Ex: Site client A - Parking"
            />
          </div>

          <div>
            <Label htmlFor="description">
              Description de l&apos;accident *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="Décrire les circonstances de l'accident..."
            />
          </div>

          <div>
            <Label htmlFor="injuries">Blessures constatées *</Label>
            <Textarea
              id="injuries"
              value={formData.injuries}
              onChange={(e) =>
                setFormData({ ...formData, injuries: e.target.value })
              }
              rows={2}
              placeholder="Nature et localisation des blessures..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="severity">Gravité *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    severity: value as WorkAccident["severity"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Bénin</SelectItem>
                  <SelectItem value="moderate">Modéré</SelectItem>
                  <SelectItem value="severe">Grave</SelectItem>
                  <SelectItem value="fatal">Mortel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Statut *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as WorkAccident["status"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="declared">Déclaré</SelectItem>
                  <SelectItem value="investigating">
                    En investigation
                  </SelectItem>
                  <SelectItem value="closed">Clôturé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="witnesses">Témoins</Label>
            <Input
              id="witnesses"
              value={formData.witnesses}
              onChange={(e) =>
                setFormData({ ...formData, witnesses: e.target.value })
              }
              placeholder="Nom des témoins séparés par des virgules"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="declarationDate">Date de déclaration *</Label>
              <Input
                id="declarationDate"
                type="date"
                value={formData.declarationDate}
                onChange={(e) =>
                  setFormData({ ...formData, declarationDate: e.target.value })
                }
              />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="cpamNotified"
                checked={formData.cpamNotified}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    cpamNotified: checked as boolean,
                  })
                }
              />
              <Label htmlFor="cpamNotified" className="cursor-pointer">
                CPAM notifiée
              </Label>
            </div>
          </div>

          {formData.cpamNotified && (
            <div>
              <Label htmlFor="cpamNotificationDate">
                Date de notification CPAM
              </Label>
              <Input
                id="cpamNotificationDate"
                type="date"
                value={formData.cpamNotificationDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cpamNotificationDate: e.target.value,
                  })
                }
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="workStoppage"
              checked={formData.workStoppage}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, workStoppage: checked as boolean })
              }
            />
            <Label htmlFor="workStoppage" className="cursor-pointer">
              Arrêt de travail
            </Label>
          </div>

          {formData.workStoppage && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="workStoppageStart">Début arrêt</Label>
                <Input
                  id="workStoppageStart"
                  type="date"
                  value={formData.workStoppageStart}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workStoppageStart: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="workStoppageEnd">Fin arrêt</Label>
                <Input
                  id="workStoppageEnd"
                  type="date"
                  value={formData.workStoppageEnd}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workStoppageEnd: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="returnToWork">Reprise travail</Label>
                <Input
                  id="returnToWork"
                  type="date"
                  value={formData.returnToWork}
                  onChange={(e) =>
                    setFormData({ ...formData, returnToWork: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
            />
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de l'accident"
        size="lg"
      >
        {viewingAccident && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Employé</Label>
                <p className="text-sm font-medium">
                  {getEmployeeName(viewingAccident.employeeId)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  N° de déclaration
                </Label>
                <p className="text-sm font-medium">
                  {viewingAccident.declarationNumber || "Non attribué"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">
                  Date de l&apos;accident
                </Label>
                <p className="text-sm font-medium">
                  {viewingAccident.accidentDate.toLocaleDateString("fr-FR")} à{" "}
                  {viewingAccident.accidentTime}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Lieu</Label>
                <p className="text-sm font-medium">
                  {viewingAccident.location}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{viewingAccident.description}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">Blessures</Label>
              <p className="text-sm">{viewingAccident.injuries}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Gravité</Label>
                <div className="mt-1">
                  <Badge variant={severityColors[viewingAccident.severity]}>
                    {severityLabels[viewingAccident.severity]}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Statut</Label>
                <div className="mt-1">
                  <Badge variant={statusColors[viewingAccident.status]}>
                    {statusLabels[viewingAccident.status]}
                  </Badge>
                </div>
              </div>
            </div>

            {viewingAccident.witnesses &&
              viewingAccident.witnesses.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Témoins</Label>
                  <p className="text-sm">
                    {viewingAccident.witnesses.join(", ")}
                  </p>
                </div>
              )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">
                  Date de déclaration
                </Label>
                <p className="text-sm font-medium">
                  {viewingAccident.declarationDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">CPAM notifiée</Label>
                <p className="text-sm font-medium">
                  {viewingAccident.cpamNotified ? (
                    <>
                      Oui
                      {viewingAccident.cpamNotificationDate && (
                        <span className="text-muted-foreground">
                          {" "}
                          (
                          {viewingAccident.cpamNotificationDate.toLocaleDateString(
                            "fr-FR",
                          )}
                          )
                        </span>
                      )}
                    </>
                  ) : (
                    "Non"
                  )}
                </p>
              </div>
            </div>

            {viewingAccident.workStoppage && (
              <div>
                <Label className="text-muted-foreground">
                  Arrêt de travail
                </Label>
                <div className="text-sm">
                  {viewingAccident.workStoppageStart && (
                    <p>
                      Début:{" "}
                      {viewingAccident.workStoppageStart.toLocaleDateString(
                        "fr-FR",
                      )}
                    </p>
                  )}
                  {viewingAccident.workStoppageEnd && (
                    <p>
                      Fin:{" "}
                      {viewingAccident.workStoppageEnd.toLocaleDateString(
                        "fr-FR",
                      )}
                    </p>
                  )}
                  {viewingAccident.returnToWork && (
                    <p>
                      Reprise:{" "}
                      {viewingAccident.returnToWork.toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {viewingAccident.notes && (
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <p className="text-sm">{viewingAccident.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
