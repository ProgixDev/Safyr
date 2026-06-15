"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/PhoneInput";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Download,
  MoreVertical,
  Users,
  FileText,
  Calendar,
  UserCheck,
} from "lucide-react";
import { PersonnelRegisterEntry } from "@/lib/types";
import { EMPLOYEE_POSTE_OPTIONS, QUALIFICATION_OPTIONS } from "@/lib/hr-options";
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
const mockPersonnelRegister: PersonnelRegisterEntry[] = [
  {
    id: "1",
    employeeId: "1",
    registrationNumber: "2024-001",
    entryDate: new Date("2024-01-15"),
    contractType: "CDI",
    contractWorkTime: "complet",
    position: "Agent de sécurité",
    qualification: "CQP APS",
    nationality: "Française",
    sex: "F",
    birthDate: new Date("1995-03-20"),
    birthPlace: "Paris (75)",
    address: "15 rue de la République, 75001 Paris",
    phone: "06 12 34 56 78",
    email: "marie.dupont@example.com",
    socialSecurityNumber: "1 95 03 75 123 456 78",
    cnapsProfessionalCardNumber: "CNAPS-2024-001",
    ssiapDiplomaNumber: "SSIAP1-2020-456",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    employeeId: "2",
    registrationNumber: "2024-002",
    entryDate: new Date("2024-02-01"),
    contractType: "CDI",
    contractWorkTime: "complet",
    position: "Chef d'équipe",
    qualification: "SSIAP 2",
    nationality: "Française",
    sex: "M",
    birthDate: new Date("1988-07-12"),
    birthPlace: "Lyon (69)",
    address: "8 avenue Victor Hugo, 69002 Lyon",
    phone: "06 23 45 67 89",
    email: "jean.martin@example.com",
    socialSecurityNumber: "1 88 07 69 234 567 89",
    cnapsProfessionalCardNumber: "CNAPS-2023-045",
    ssiapDiplomaNumber: "SSIAP2-2019-789",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: "3",
    employeeId: "3",
    registrationNumber: "2024-003",
    entryDate: new Date("2024-03-10"),
    exitDate: new Date("2024-09-10"),
    contractType: "CDD",
    contractWorkTime: "partiel",
    position: "Agent de sécurité",
    qualification: "CQP APS",
    nationality: "Française",
    sex: "F",
    birthDate: new Date("1992-11-05"),
    birthPlace: "Marseille (13)",
    address: "22 cours Julien, 13006 Marseille",
    phone: "06 34 56 78 90",
    email: "sophie.leroy@example.com",
    socialSecurityNumber: "2 92 11 13 345 678 90",
    cnapsProfessionalCardNumber: "CNAPS-2024-012",
    ssiapDiplomaNumber: "SSIAP1-2021-123",
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-09-10"),
  },
];

const contractTypeLabels = {
  CDI: "CDI",
  CDD: "CDD",
  apprentice: "Apprenti",
  interim: "Intérim",
  other: "Autre",
};

const contractTypeColors = {
  CDI: "secondary",
  CDD: "default",
  apprentice: "default",
  interim: "default",
  other: "secondary",
} as const;

export default function PersonnelRegisterPage() {
  const [entries, setEntries] = useState<PersonnelRegisterEntry[]>(
    mockPersonnelRegister,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] =
    useState<PersonnelRegisterEntry | null>(null);
  const [viewingEntry, setViewingEntry] =
    useState<PersonnelRegisterEntry | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterContractType, setFilterContractType] = useState<string>("all");

  const [formData, setFormData] = useState({
    employeeId: "",
    registrationNumber: "",
    entryDate: "",
    exitDate: "",
    contractType: "CDI" as PersonnelRegisterEntry["contractType"],
    contractWorkTime: "complet" as PersonnelRegisterEntry["contractWorkTime"],
    position: "",
    qualification: "",
    nationality: "Française",
    sex: "M" as PersonnelRegisterEntry["sex"],
    birthDate: "",
    birthPlace: "",
    address: "",
    phone: "",
    email: "",
    socialSecurityNumber: "",
    cnapsProfessionalCardNumber: "",
    ssiapDiplomaNumber: "",
    notes: "",
  });

  const getEmployeeName = (employeeId: string) => {
    return mockEmployees.find((e) => e.id === employeeId)?.name || "N/A";
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setFormData({
      employeeId: "",
      registrationNumber: "",
      entryDate: "",
      exitDate: "",
      contractType: "CDI",
      contractWorkTime: "complet",
      position: "",
      qualification: "",
      nationality: "Française",
      sex: "M",
      birthDate: "",
      birthPlace: "",
      address: "",
      phone: "",
      email: "",
      socialSecurityNumber: "",
      cnapsProfessionalCardNumber: "",
      ssiapDiplomaNumber: "",
      notes: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (entry: PersonnelRegisterEntry) => {
    setEditingEntry(entry);
    setFormData({
      employeeId: entry.employeeId,
      registrationNumber: entry.registrationNumber,
      entryDate: entry.entryDate.toISOString().split("T")[0],
      exitDate: entry.exitDate
        ? entry.exitDate.toISOString().split("T")[0]
        : "",
      contractType: entry.contractType,
      contractWorkTime: entry.contractWorkTime || "complet",
      position: entry.position,
      qualification: entry.qualification,
      nationality: entry.nationality,
      sex: entry.sex || "M",
      birthDate: entry.birthDate.toISOString().split("T")[0],
      birthPlace: entry.birthPlace,
      address: entry.address || "",
      phone: entry.phone || "",
      email: entry.email || "",
      socialSecurityNumber: entry.socialSecurityNumber || "",
      cnapsProfessionalCardNumber: entry.cnapsProfessionalCardNumber || "",
      ssiapDiplomaNumber: entry.ssiapDiplomaNumber || "",
      notes: entry.notes || "",
    });
    setIsCreateModalOpen(true);
  };

  const handleView = (entry: PersonnelRegisterEntry) => {
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
      registrationNumber: formData.registrationNumber,
      entryDate: new Date(formData.entryDate),
      exitDate: formData.exitDate ? new Date(formData.exitDate) : undefined,
      contractType: formData.contractType,
      contractWorkTime: formData.contractWorkTime,
      position: formData.position,
      qualification: formData.qualification,
      nationality: formData.nationality,
      sex: formData.sex,
      birthDate: new Date(formData.birthDate),
      birthPlace: formData.birthPlace,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      socialSecurityNumber: formData.socialSecurityNumber,
      cnapsProfessionalCardNumber: formData.cnapsProfessionalCardNumber,
      ssiapDiplomaNumber: formData.ssiapDiplomaNumber,
      notes: formData.notes,
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
      const newEntry: PersonnelRegisterEntry = {
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
      "Export PDF du registre du personnel (conforme inspection du travail/CNAPS)...",
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

  const columns: ColumnDef<PersonnelRegisterEntry>[] = [
    {
      key: "registrationNumber",
      label: "N° d'enregistrement",
      render: (entry: PersonnelRegisterEntry) => (
        <div className="font-medium">{entry.registrationNumber}</div>
      ),
    },
    {
      key: "employeeId",
      label: "Employé",
      render: (entry: PersonnelRegisterEntry) => (
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
      label: "Type de contrat",
      render: (entry: PersonnelRegisterEntry) => (
        <Badge variant={contractTypeColors[entry.contractType]}>
          {contractTypeLabels[entry.contractType]}
        </Badge>
      ),
    },
    {
      key: "entryDate",
      label: "Date d'entrée",
      render: (entry: PersonnelRegisterEntry) =>
        entry.entryDate.toLocaleDateString("fr-FR"),
    },
    {
      key: "exitDate",
      label: "Date de sortie",
      render: (entry: PersonnelRegisterEntry) =>
        entry.exitDate ? (
          <span className="text-muted-foreground">
            {entry.exitDate.toLocaleDateString("fr-FR")}
          </span>
        ) : (
          <Badge variant="secondary">En poste</Badge>
        ),
    },
    {
      key: "qualification",
      label: "Qualification",
      render: (entry: PersonnelRegisterEntry) => entry.qualification,
    },
    {
      key: "actions",
      label: "Actions",
      render: (entry: PersonnelRegisterEntry) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(entry)}>
              <Eye className="mr-2 h-4 w-4" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(entry)}>
              <Pencil className="mr-2 h-4 w-4" />
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
  const activeCount = entries.filter((e) => !e.exitDate).length;
  const cdiCount = entries.filter(
    (e) => e.contractType === "CDI" && !e.exitDate,
  ).length;
  const cddCount = entries.filter(
    (e) => e.contractType === "CDD" && !e.exitDate,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registre du Personnel</h1>
          <p className="text-muted-foreground">
            Registre unique du personnel conforme à la réglementation
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
          icon={Users}
          title="Total"
          value={entries.length}
          subtext="Enregistrements totaux"
          color="gray"
        />

        <InfoCard
          icon={UserCheck}
          title="En poste"
          value={activeCount}
          subtext="Employés actifs"
          color="green"
        />

        <InfoCard
          icon={FileText}
          title="CDI"
          value={cdiCount}
          subtext="Contrats CDI actifs"
          color="blue"
        />

        <InfoCard
          icon={Calendar}
          title="CDD"
          value={cddCount}
          subtext="Contrats CDD actifs"
          color="orange"
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
                  <SelectItem value="active">En poste</SelectItem>
                  <SelectItem value="exited">Sortis</SelectItem>
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
                  <SelectItem value="CDI">CDI</SelectItem>
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
              <Label htmlFor="registrationNumber">
                N° d&apos;enregistrement *
              </Label>
              <Input
                id="registrationNumber"
                value={formData.registrationNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registrationNumber: e.target.value,
                  })
                }
                placeholder="Ex: 2024-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="contractType">Type de contrat *</Label>
              <Select
                value={formData.contractType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    contractType:
                      value as PersonnelRegisterEntry["contractType"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="apprentice">Apprenti</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="contractWorkTime">Temps de travail</Label>
              <Select
                value={formData.contractWorkTime}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    contractWorkTime:
                      value as PersonnelRegisterEntry["contractWorkTime"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complet">Temps complet</SelectItem>
                  <SelectItem value="partiel">Temps partiel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Poste *</Label>
              <Select
                value={formData.position || undefined}
                onValueChange={(value) =>
                  setFormData({ ...formData, position: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un poste…" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_POSTE_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3">
              <Label>Qualification * (plusieurs choix possibles)</Label>
              <div className="flex flex-wrap gap-2 pt-1.5">
                {QUALIFICATION_OPTIONS.map((q) => {
                  const current = formData.qualification
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const selected = current.includes(q);
                  return (
                    <Badge
                      key={q}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer select-none"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          qualification: (selected
                            ? current.filter((c) => c !== q)
                            : [...current, q]
                          ).join(", "),
                        })
                      }
                    >
                      {q}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="nationality">Nationalité *</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) =>
                  setFormData({ ...formData, nationality: e.target.value })
                }
                placeholder="Ex: Française"
              />
            </div>

            <div>
              <Label htmlFor="sex">Sexe</Label>
              <Select
                value={formData.sex}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    sex: value as PersonnelRegisterEntry["sex"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthDate">Date de naissance *</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="birthPlace">Lieu de naissance *</Label>
              <Input
                id="birthPlace"
                value={formData.birthPlace}
                onChange={(e) =>
                  setFormData({ ...formData, birthPlace: e.target.value })
                }
                placeholder="Ex: Paris (75)"
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
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: e.target.value,
                })
              }
              placeholder="Ex: 15 rue de la République, 75001 Paris"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <PhoneInput
                id="phone"
                value={formData.phone}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    phone: value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="email">Adresse mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
                placeholder="Ex: exemple@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="socialSecurityNumber">
                N° de sécurité sociale
              </Label>
              <Input
                id="socialSecurityNumber"
                value={formData.socialSecurityNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socialSecurityNumber: e.target.value,
                  })
                }
                placeholder="Ex: 1 95 03 75 123 456 78"
              />
            </div>

            <div>
              <Label htmlFor="cnapsProfessionalCardNumber">
                N° carte Pro CNAPS
              </Label>
              <Input
                id="cnapsProfessionalCardNumber"
                value={formData.cnapsProfessionalCardNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cnapsProfessionalCardNumber: e.target.value,
                  })
                }
                placeholder="Ex: CNAPS-2024-001"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ssiapDiplomaNumber">N° Diplôme SSIAP</Label>
            <Input
              id="ssiapDiplomaNumber"
              value={formData.ssiapDiplomaNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ssiapDiplomaNumber: e.target.value,
                })
              }
              placeholder="Ex: SSIAP1-2020-456"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
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
                <Label className="text-muted-foreground">
                  N° d&apos;enregistrement
                </Label>
                <p className="text-sm font-medium">
                  {viewingEntry.registrationNumber}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                <Label className="text-muted-foreground">
                  Temps de travail
                </Label>
                <p className="text-sm font-medium">
                  {viewingEntry.contractWorkTime === "complet"
                    ? "Temps complet"
                    : "Temps partiel"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Poste</Label>
                <p className="text-sm font-medium">{viewingEntry.position}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">Qualification</Label>
                <p className="text-sm font-medium">
                  {viewingEntry.qualification}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Nationalité</Label>
                <p className="text-sm font-medium">
                  {viewingEntry.nationality}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Sexe</Label>
                <p className="text-sm font-medium">
                  {viewingEntry.sex === "M" ? "Masculin" : "Féminin"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">
                  Date de naissance
                </Label>
                <p className="text-sm font-medium">
                  {viewingEntry.birthDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  Lieu de naissance
                </Label>
                <p className="text-sm font-medium">{viewingEntry.birthPlace}</p>
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
                <Label className="text-muted-foreground">Date de sortie</Label>
                <p className="text-sm font-medium">
                  {viewingEntry.exitDate
                    ? viewingEntry.exitDate.toLocaleDateString("fr-FR")
                    : "En poste"}
                </p>
              </div>
            </div>

            {viewingEntry.address && (
              <div>
                <Label className="text-muted-foreground">Adresse</Label>
                <p className="text-sm font-medium">{viewingEntry.address}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {viewingEntry.phone && (
                <div>
                  <Label className="text-muted-foreground">Téléphone</Label>
                  <p className="text-sm font-medium">{viewingEntry.phone}</p>
                </div>
              )}
              {viewingEntry.email && (
                <div>
                  <Label className="text-muted-foreground">Adresse mail</Label>
                  <p className="text-sm font-medium">{viewingEntry.email}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {viewingEntry.socialSecurityNumber && (
                <div>
                  <Label className="text-muted-foreground">
                    N° de sécurité sociale
                  </Label>
                  <p className="text-sm font-medium">
                    {viewingEntry.socialSecurityNumber}
                  </p>
                </div>
              )}
              {viewingEntry.cnapsProfessionalCardNumber && (
                <div>
                  <Label className="text-muted-foreground">
                    N° carte Pro CNAPS
                  </Label>
                  <p className="text-sm font-medium">
                    {viewingEntry.cnapsProfessionalCardNumber}
                  </p>
                </div>
              )}
            </div>

            {viewingEntry.ssiapDiplomaNumber && (
              <div>
                <Label className="text-muted-foreground">
                  N° Diplôme SSIAP
                </Label>
                <p className="text-sm font-medium">
                  {viewingEntry.ssiapDiplomaNumber}
                </p>
              </div>
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
