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
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Download,
  MoreVertical,
  FileText,
  Calendar,
  UserCheck,
  UserX,
} from "lucide-react";
import { CDDRegisterEntry } from "@/lib/types";
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
const mockCDDRegister: CDDRegisterEntry[] = [
  {
    id: "1",
    employeeId: "3",
    contractNumber: "CDD-2024-001",
    contractType: "CDD",
    entryDate: new Date("2024-03-10"),
    exitDate: new Date("2024-09-10"),
    expectedEndDate: new Date("2024-09-10"),
    actualEndDate: new Date("2024-09-10"),
    position: "Agent de sécurité",
    reason: "temporary_increase",
    reasonDetails: "Accroissement temporaire d'activité - Été 2024",
    renewalCount: 0,
    exitReason: "end_of_contract",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-09-11"),
  },
  {
    id: "2",
    employeeId: "4",
    contractNumber: "CDD-2024-002",
    contractType: "CDD",
    entryDate: new Date("2024-06-01"),
    expectedEndDate: new Date("2024-12-31"),
    position: "Agent de sécurité",
    reason: "replacement",
    reasonDetails: "Remplacement maladie longue durée",
    renewalCount: 1,
    previousContractId: "CDD-2024-002-R0",
    createdAt: new Date("2024-05-20"),
    updatedAt: new Date("2024-11-15"),
  },
];

const contractTypeLabels = {
  CDD: "CDD",
  apprentice: "Apprenti",
  interim: "Intérim",
};

const contractTypeColors = {
  CDD: "default",
  apprentice: "secondary",
  interim: "default",
} as const;

const reasonLabels = {
  replacement: "Remplacement",
  seasonal: "Saisonnier",
  temporary_increase: "Accroissement temporaire",
  specific_project: "Projet spécifique",
  other: "Autre",
};

const exitReasonLabels = {
  end_of_contract: "Fin de contrat",
  early_termination: "Rupture anticipée",
  conversion_to_cdi: "Conversion CDI",
  dismissal: "Licenciement",
  resignation: "Démission",
  other: "Autre",
};

export default function CDDRegisterPage() {
  const [entries, setEntries] = useState<CDDRegisterEntry[]>(mockCDDRegister);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CDDRegisterEntry | null>(
    null,
  );
  const [viewingEntry, setViewingEntry] = useState<CDDRegisterEntry | null>(
    null,
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterContractType, setFilterContractType] = useState<string>("all");

  const [formData, setFormData] = useState({
    employeeId: "",
    contractNumber: "",
    contractType: "CDD" as CDDRegisterEntry["contractType"],
    entryDate: "",
    exitDate: "",
    expectedEndDate: "",
    actualEndDate: "",
    position: "",
    reason: "temporary_increase" as CDDRegisterEntry["reason"],
    reasonDetails: "",
    renewalCount: "0",
    previousContractId: "",
    exitReason: "" as CDDRegisterEntry["exitReason"] | "",
    exitReasonDetails: "",
    notes: "",
  });

  const getEmployeeName = (employeeId: string) => {
    return mockEmployees.find((e) => e.id === employeeId)?.name || "N/A";
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setFormData({
      employeeId: "",
      contractNumber: "",
      contractType: "CDD",
      entryDate: "",
      exitDate: "",
      expectedEndDate: "",
      actualEndDate: "",
      position: "",
      reason: "temporary_increase",
      reasonDetails: "",
      renewalCount: "0",
      previousContractId: "",
      exitReason: "",
      exitReasonDetails: "",
      notes: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (entry: CDDRegisterEntry) => {
    setEditingEntry(entry);
    setFormData({
      employeeId: entry.employeeId,
      contractNumber: entry.contractNumber,
      contractType: entry.contractType,
      entryDate: entry.entryDate.toISOString().split("T")[0],
      exitDate: entry.exitDate
        ? entry.exitDate.toISOString().split("T")[0]
        : "",
      expectedEndDate: entry.expectedEndDate.toISOString().split("T")[0],
      actualEndDate: entry.actualEndDate
        ? entry.actualEndDate.toISOString().split("T")[0]
        : "",
      position: entry.position,
      reason: entry.reason,
      reasonDetails: entry.reasonDetails || "",
      renewalCount: entry.renewalCount.toString(),
      previousContractId: entry.previousContractId || "",
      exitReason: entry.exitReason || "",
      exitReasonDetails: entry.exitReasonDetails || "",
      notes: entry.notes || "",
    });
    setIsCreateModalOpen(true);
  };

  const handleView = (entry: CDDRegisterEntry) => {
    setViewingEntry(entry);
    setIsViewModalOpen(true);
  };

  const handleDelete = (entryId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
      setEntries(entries.filter((e) => e.id !== entryId));
    }
  };

  const handleSave = () => {
    const entryData = {
      employeeId: formData.employeeId,
      contractNumber: formData.contractNumber,
      contractType: formData.contractType,
      entryDate: new Date(formData.entryDate),
      exitDate: formData.exitDate ? new Date(formData.exitDate) : undefined,
      expectedEndDate: new Date(formData.expectedEndDate),
      actualEndDate: formData.actualEndDate
        ? new Date(formData.actualEndDate)
        : undefined,
      position: formData.position,
      reason: formData.reason,
      reasonDetails: formData.reasonDetails || undefined,
      renewalCount: Number(formData.renewalCount),
      previousContractId: formData.previousContractId || undefined,
      exitReason: formData.exitReason || undefined,
      exitReasonDetails: formData.exitReasonDetails || undefined,
      notes: formData.notes || undefined,
    };

    if (editingEntry) {
      setEntries(
        entries.map((entry) =>
          entry.id === editingEntry.id
            ? {
                ...entry,
                ...entryData,
                updatedAt: new Date(),
              }
            : entry,
        ),
      );
    } else {
      const newEntry: CDDRegisterEntry = {
        id: Date.now().toString(),
        ...entryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setEntries([...entries, newEntry]);
    }

    setIsCreateModalOpen(false);
  };

  const handleExportPDF = () => {
    alert(
      "Export PDF du registre CDD entrées/sorties (conforme inspection du travail)...",
    );
  };

  // Apply filters
  let filteredEntries = entries;

  if (filterStatus === "active") {
    filteredEntries = filteredEntries.filter((e) => !e.exitDate);
  } else if (filterStatus === "exited") {
    filteredEntries = filteredEntries.filter((e) => e.exitDate);
  }

  if (filterContractType !== "all") {
    filteredEntries = filteredEntries.filter(
      (e) => e.contractType === filterContractType,
    );
  }

  const columns: ColumnDef<CDDRegisterEntry>[] = [
    {
      key: "contractNumber",
      label: "N° de contrat",
      render: (entry: CDDRegisterEntry) => (
        <div className="font-medium">{entry.contractNumber}</div>
      ),
    },
    {
      key: "employeeId",
      label: "Employé",
      render: (entry: CDDRegisterEntry) => (
        <Link
          href={`/dashboard/hr/collaborators/${entry.employeeId}`}
          className="hover:underline"
        >
          <div className="font-medium">{getEmployeeName(entry.employeeId)}</div>
          <div className="text-sm text-muted-foreground">{entry.position}</div>
        </Link>
      ),
    },
    {
      key: "contractType",
      label: "Type",
      render: (entry: CDDRegisterEntry) => (
        <Badge variant={contractTypeColors[entry.contractType]}>
          {contractTypeLabels[entry.contractType]}
        </Badge>
      ),
    },
    {
      key: "entryDate",
      label: "Date d'entrée",
      render: (entry: CDDRegisterEntry) =>
        entry.entryDate.toLocaleDateString("fr-FR"),
    },
    {
      key: "expectedEndDate",
      label: "Fin prévue",
      render: (entry: CDDRegisterEntry) =>
        entry.expectedEndDate.toLocaleDateString("fr-FR"),
    },
    {
      key: "exitDate",
      label: "Sortie effective",
      render: (entry: CDDRegisterEntry) =>
        entry.exitDate ? (
          <span className="text-muted-foreground">
            {entry.exitDate.toLocaleDateString("fr-FR")}
          </span>
        ) : (
          <Badge variant="secondary">En cours</Badge>
        ),
    },
    {
      key: "renewalCount",
      label: "Renouvellements",
      render: (entry: CDDRegisterEntry) => entry.renewalCount,
    },
    {
      key: "actions",
      label: "Actions",
      render: (entry: CDDRegisterEntry) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(entry)}>
              <Eye className="mr-2 h-4 w-4 text-orange-500" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(entry)}>
              <Pencil className="mr-2 h-4 w-4 text-green-600" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(entry.id)}
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
  const totalEntries = entries.length;
  const activeContracts = entries.filter((e) => !e.exitDate).length;
  const exitedContracts = entries.filter((e) => e.exitDate).length;
  const totalRenewals = entries.reduce((sum, e) => sum + e.renewalCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registre CDD Entrées / Sorties</h1>
          <p className="text-muted-foreground">
            Suivi réglementaire des contrats à durée déterminée
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle entrée
          </Button>
        </div>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={FileText}
          title="Total"
          value={totalEntries}
          subtext="Contrats enregistrés"
          color="gray"
        />

        <InfoCard
          icon={UserCheck}
          title="En cours"
          value={activeContracts}
          subtext="Contrats actifs"
          color="green"
        />

        <InfoCard
          icon={UserX}
          title="Terminés"
          value={exitedContracts}
          subtext="Contrats clôturés"
          color="red"
        />

        <InfoCard
          icon={Calendar}
          title="Renouvellements"
          value={totalRenewals}
          subtext="Total cumulé"
          color="blue"
        />
      </InfoCardContainer>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Registre ({filteredEntries.length})</CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">En cours</SelectItem>
                  <SelectItem value="exited">Terminés</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterContractType}
                onValueChange={setFilterContractType}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type de contrat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="apprentice">Apprenti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredEntries} />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={editingEntry ? "Modifier l'entrée" : "Nouvelle entrée"}
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
              <Label htmlFor="contractNumber">N° de contrat *</Label>
              <Input
                id="contractNumber"
                value={formData.contractNumber}
                onChange={(e) =>
                  setFormData({ ...formData, contractNumber: e.target.value })
                }
                placeholder="Ex: CDD-2024-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contractType">Type de contrat *</Label>
              <Select
                value={formData.contractType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    contractType: value as CDDRegisterEntry["contractType"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="apprentice">Apprenti</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="position">Poste *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                placeholder="Ex: Agent de sécurité"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entryDate">Date d&apos;entrée *</Label>
              <Input
                id="entryDate"
                type="date"
                value={formData.entryDate}
                onChange={(e) =>
                  setFormData({ ...formData, entryDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="expectedEndDate">Fin de contrat prévue *</Label>
              <Input
                id="expectedEndDate"
                type="date"
                value={formData.expectedEndDate}
                onChange={(e) =>
                  setFormData({ ...formData, expectedEndDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reason">Motif du recours *</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    reason: value as CDDRegisterEntry["reason"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="replacement">Remplacement</SelectItem>
                  <SelectItem value="seasonal">Saisonnier</SelectItem>
                  <SelectItem value="temporary_increase">
                    Accroissement temporaire
                  </SelectItem>
                  <SelectItem value="specific_project">
                    Projet spécifique
                  </SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="renewalCount">Nombre de renouvellements</Label>
              <Input
                id="renewalCount"
                type="number"
                value={formData.renewalCount}
                onChange={(e) =>
                  setFormData({ ...formData, renewalCount: e.target.value })
                }
                min="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reasonDetails">Détails du motif</Label>
            <Textarea
              id="reasonDetails"
              value={formData.reasonDetails}
              onChange={(e) =>
                setFormData({ ...formData, reasonDetails: e.target.value })
              }
              rows={2}
              placeholder="Préciser le motif du recours..."
            />
          </div>

          {Number(formData.renewalCount) > 0 && (
            <div>
              <Label htmlFor="previousContractId">N° contrat précédent</Label>
              <Input
                id="previousContractId"
                value={formData.previousContractId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    previousContractId: e.target.value,
                  })
                }
                placeholder="Ex: CDD-2024-002-R0"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="exitDate">Date de sortie</Label>
              <Input
                id="exitDate"
                type="date"
                value={formData.exitDate}
                onChange={(e) =>
                  setFormData({ ...formData, exitDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="actualEndDate">Fin de contrat effective</Label>
              <Input
                id="actualEndDate"
                type="date"
                value={formData.actualEndDate}
                onChange={(e) =>
                  setFormData({ ...formData, actualEndDate: e.target.value })
                }
              />
            </div>
          </div>

          {formData.exitDate && (
            <>
              <div>
                <Label htmlFor="exitReason">Motif de sortie</Label>
                <Select
                  value={formData.exitReason}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      exitReason: value as CDDRegisterEntry["exitReason"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un motif" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="end_of_contract">
                      Fin de contrat
                    </SelectItem>
                    <SelectItem value="early_termination">
                      Rupture anticipée
                    </SelectItem>
                    <SelectItem value="conversion_to_cdi">
                      Conversion CDI
                    </SelectItem>
                    <SelectItem value="dismissal">Licenciement</SelectItem>
                    <SelectItem value="resignation">Démission</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="exitReasonDetails">
                  Détails du motif de sortie
                </Label>
                <Textarea
                  id="exitReasonDetails"
                  value={formData.exitReasonDetails}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exitReasonDetails: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>
            </>
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
        title="Détails de l'entrée"
        size="lg"
      >
        {viewingEntry && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Employé</Label>
                <p className="text-sm font-medium">
                  {getEmployeeName(viewingEntry.employeeId)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">N° de contrat</Label>
                <p className="text-sm font-medium">
                  {viewingEntry.contractNumber}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Type de contrat</Label>
                <div className="mt-1">
                  <Badge
                    variant={contractTypeColors[viewingEntry.contractType]}
                  >
                    {contractTypeLabels[viewingEntry.contractType]}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Poste</Label>
                <p className="text-sm font-medium">{viewingEntry.position}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">
                  Date d&apos;entrée
                </Label>
                <p className="text-sm font-medium">
                  {viewingEntry.entryDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  Fin de contrat prévue
                </Label>
                <p className="text-sm font-medium">
                  {viewingEntry.expectedEndDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">
                  Motif du recours
                </Label>
                <p className="text-sm font-medium">
                  {reasonLabels[viewingEntry.reason]}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Renouvellements</Label>
                <p className="text-sm font-medium">
                  {viewingEntry.renewalCount}
                </p>
              </div>
            </div>

            {viewingEntry.reasonDetails && (
              <div>
                <Label className="text-muted-foreground">
                  Détails du motif
                </Label>
                <p className="text-sm">{viewingEntry.reasonDetails}</p>
              </div>
            )}

            {viewingEntry.previousContractId && (
              <div>
                <Label className="text-muted-foreground">
                  N° contrat précédent
                </Label>
                <p className="text-sm font-medium">
                  {viewingEntry.previousContractId}
                </p>
              </div>
            )}

            {viewingEntry.exitDate && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      Date de sortie
                    </Label>
                    <p className="text-sm font-medium">
                      {viewingEntry.exitDate.toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  {viewingEntry.actualEndDate && (
                    <div>
                      <Label className="text-muted-foreground">
                        Fin de contrat effective
                      </Label>
                      <p className="text-sm font-medium">
                        {viewingEntry.actualEndDate.toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  )}
                </div>

                {viewingEntry.exitReason && (
                  <div>
                    <Label className="text-muted-foreground">
                      Motif de sortie
                    </Label>
                    <p className="text-sm font-medium">
                      {exitReasonLabels[viewingEntry.exitReason]}
                    </p>
                  </div>
                )}

                {viewingEntry.exitReasonDetails && (
                  <div>
                    <Label className="text-muted-foreground">
                      Détails du motif de sortie
                    </Label>
                    <p className="text-sm">{viewingEntry.exitReasonDetails}</p>
                  </div>
                )}
              </>
            )}

            {viewingEntry.notes && (
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <p className="text-sm">{viewingEntry.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
