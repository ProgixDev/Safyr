"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HoursInput } from "@/components/ui/hours-input";
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
  Eye,
  Pencil,
  Trash2,
  FileSignature,
  FileText,
  MoreVertical,
} from "lucide-react";
import { Contract } from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";

// Mock data - replace with API call
const mockContracts: Contract[] = [
  {
    id: "1",
    type: "CDI",
    startDate: new Date("2024-02-01"),
    position: "Agent de sécurité",
    department: "Sécurité",
    salary: {
      gross: 2200,
      net: 1800,
      currency: "EUR",
    },
    workingHours: 35,
    signedByEmployee: false,
    signedByEmployer: true,
    amendments: [],
    status: "pending-signature",
    probationPeriod: {
      duration: 2,
      unit: "months",
    },
    probationStartDate: new Date("2024-02-01"),
    probationEndDate: new Date("2024-04-01"),
    probationRenewed: false,
    probationStatus: "active",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    type: "CDD",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-06-15"),
    position: "Chef d'équipe",
    department: "Sécurité",
    salary: {
      gross: 2800,
      net: 2300,
      currency: "EUR",
    },
    workingHours: 35,
    signedByEmployee: true,
    signedByEmployer: true,
    signedAt: new Date("2024-01-12"),
    amendments: [],
    status: "active",
    probationPeriod: {
      duration: 2,
      unit: "weeks",
    },
    probationStartDate: new Date("2024-01-15"),
    probationEndDate: new Date("2024-01-29"),
    probationRenewed: false,
    probationStatus: "completed",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-12"),
  },
];

const statusLabels = {
  draft: "Brouillon",
  "pending-signature": "En attente de signature",
  active: "Actif",
  terminated: "Terminé",
  expired: "Expiré",
};

const statusColors = {
  draft: "secondary",
  "pending-signature": "outline",
  active: "default",
  terminated: "destructive",
  expired: "destructive",
} as const;

const typeLabels = {
  CDI: "CDI",
  CDD: "CDD",
  INTERIM: "Intérim",
  APPRENTICESHIP: "Apprentissage",
  INTERNSHIP: "Stage",
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [formData, setFormData] = useState({
    type: "" as Contract["type"],
    startDate: "",
    endDate: "",
    position: "",
    department: "",
    grossSalary: "",
    netSalary: "",
    currency: "EUR",
    workingHours: "",
  });
  const [contractFile, setContractFile] = useState<File | null>(null);

  const handleCreate = () => {
    setEditingContract(null);
    setFormData({
      type: "" as Contract["type"],
      startDate: "",
      endDate: "",
      position: "",
      department: "",
      grossSalary: "",
      netSalary: "",
      currency: "EUR",
      workingHours: "",
    });
    setContractFile(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      type: contract.type,
      startDate: contract.startDate.toISOString().split("T")[0],
      endDate: contract.endDate
        ? contract.endDate.toISOString().split("T")[0]
        : "",
      position: contract.position,
      department: contract.department,
      grossSalary: contract.salary.gross.toString(),
      netSalary: contract.salary.net.toString(),
      currency: contract.salary.currency,
      workingHours: contract.workingHours.toString(),
    });
    setContractFile(null);
    setIsCreateModalOpen(true);
  };

  const handleView = (contract: Contract) => {
    setViewingContract(contract);
    setIsViewModalOpen(true);
  };

  const handleDelete = (contractId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce contrat ?")) {
      setContracts(contracts.filter((contract) => contract.id !== contractId));
    }
  };

  const handleSave = () => {
    const startDate = new Date(formData.startDate);
    const endDate = formData.endDate ? new Date(formData.endDate) : undefined;

    // Calculate probation period based on convention
    let probationPeriod:
      | { duration: number; unit: "months" | "weeks" | "days" }
      | undefined;
    let probationEndDate: Date | undefined;

    if (formData.type === "CDI") {
      // CDI private security
      const position = formData.position.toLowerCase();
      if (
        position.includes("responsable") ||
        position.includes("cadre") ||
        position.includes("directeur")
      ) {
        probationPeriod = { duration: 4, unit: "months" };
      } else if (position.includes("maitrise") || position.includes("chef")) {
        probationPeriod = { duration: 3, unit: "months" };
      } else {
        probationPeriod = { duration: 2, unit: "months" };
      }
      probationEndDate = new Date(startDate);
      probationEndDate.setMonth(
        probationEndDate.getMonth() + probationPeriod.duration,
      );
    } else if (formData.type === "CDD") {
      // CDD private security
      if (endDate) {
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationMonths = durationMs / (1000 * 60 * 60 * 24 * 30.44); // Approximate months
        if (durationMonths <= 6) {
          probationPeriod = { duration: 2, unit: "weeks" };
          probationEndDate = new Date(startDate);
          probationEndDate.setDate(probationEndDate.getDate() + 14);
        } else {
          probationPeriod = { duration: 1, unit: "months" };
          probationEndDate = new Date(startDate);
          probationEndDate.setMonth(probationEndDate.getMonth() + 1);
        }
      }
    }

    const contractData = {
      type: formData.type,
      startDate,
      endDate,
      position: formData.position,
      department: formData.department,
      salary: {
        gross: parseFloat(formData.grossSalary),
        net: parseFloat(formData.netSalary),
        currency: formData.currency,
      },
      workingHours: parseInt(formData.workingHours),
      fileUrl: contractFile ? `/files/contract_${Date.now()}.pdf` : undefined,
      probationPeriod,
      probationStartDate: probationPeriod ? startDate : undefined,
      probationEndDate,
      probationRenewed: false,
      probationStatus: probationPeriod ? ("active" as const) : undefined,
    };

    if (editingContract) {
      setContracts(
        contracts.map((contract) =>
          contract.id === editingContract.id
            ? { ...contract, ...contractData, updatedAt: new Date() }
            : contract,
        ),
      );
    } else {
      const newContract: Contract = {
        id: Date.now().toString(),
        ...contractData,
        signedByEmployee: false,
        signedByEmployer: false,
        amendments: [],
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setContracts([...contracts, newContract]);
    }
    setIsCreateModalOpen(false);
  };

  const handleStatusChange = (
    contractId: string,
    newStatus: Contract["status"],
  ) => {
    setContracts(
      contracts.map((contract) =>
        contract.id === contractId
          ? { ...contract, status: newStatus, updatedAt: new Date() }
          : contract,
      ),
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file: File | null) => {
    setContractFile(file);
  };

  const isFormValid =
    formData.type &&
    formData.startDate &&
    formData.position &&
    formData.department &&
    formData.grossSalary &&
    formData.netSalary &&
    formData.workingHours;

  const columns: ColumnDef<Contract>[] = [
    {
      key: "type",
      label: "Type",
      render: (contract: Contract) => (
        <Badge variant="outline">{typeLabels[contract.type]}</Badge>
      ),
    },
    {
      key: "position",
      label: "Poste",
      render: (contract: Contract) => (
        <div>
          {contract.employeeId ? (
            <Link
              href={`/dashboard/hr/collaborators/${contract.employeeId}`}
              className="font-medium hover:underline"
            >
              {contract.position}
            </Link>
          ) : (
            <div className="font-medium">{contract.position}</div>
          )}
          <div className="text-sm text-muted-foreground">
            {contract.department}
          </div>
        </div>
      ),
    },
    {
      key: "startDate",
      label: "Date de début",
      render: (contract: Contract) =>
        contract.startDate.toLocaleDateString("fr-FR"),
    },
    {
      key: "endDate",
      label: "Date de fin",
      render: (contract: Contract) =>
        contract.endDate ? contract.endDate.toLocaleDateString("fr-FR") : "-",
    },
    {
      key: "salary",
      label: "Salaire brut",
      render: (contract: Contract) =>
        `${contract.salary.gross} ${contract.salary.currency}`,
    },
    {
      key: "status",
      label: "Statut",
      render: (contract: Contract) => (
        <Badge variant={statusColors[contract.status]}>
          {statusLabels[contract.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (contract: Contract) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleView(contract)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleEdit(contract)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            {contract.status === "draft" && (
              <DropdownMenuItem
                onClick={() =>
                  handleStatusChange(contract.id, "pending-signature")
                }
                className="gap-2"
              >
                <FileSignature className="h-4 w-4 text-blue-600" />
                Envoyer en signature
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(contract.id)}
              className="gap-2 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Création & Signature
          </h1>
          <p className="text-muted-foreground">
            Gestion des contrats et signatures électroniques
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau contrat
        </Button>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contrats ({contracts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={contracts}
            columns={columns}
            searchKeys={["position", "department"]}
            searchPlaceholder="Rechercher des contrats..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={editingContract ? "Modifier le contrat" : "Nouveau contrat"}
        description="Ajoutez ou modifiez les informations du contrat."
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: editingContract ? "Enregistrer" : "Créer",
            onClick: handleSave,
            disabled: !isFormValid,
          },
        }}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type de contrat *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="APPRENTICESHIP">Apprentissage</SelectItem>
                  <SelectItem value="INTERNSHIP">Stage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Poste *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                placeholder="Ex: Agent de sécurité"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Département *</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) =>
                  handleInputChange("department", e.target.value)
                }
                placeholder="Ex: Sécurité"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workingHours">Heures/semaine *</Label>
              <HoursInput
                value={parseFloat(formData.workingHours) || 0}
                onChange={(value) =>
                  handleInputChange("workingHours", value.toString())
                }
                step={0.5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grossSalary">Salaire brut *</Label>
              <Input
                id="grossSalary"
                type="number"
                value={formData.grossSalary}
                onChange={(e) =>
                  handleInputChange("grossSalary", e.target.value)
                }
                placeholder="2200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="netSalary">Salaire net *</Label>
              <Input
                id="netSalary"
                type="number"
                value={formData.netSalary}
                onChange={(e) => handleInputChange("netSalary", e.target.value)}
                placeholder="1800"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => handleInputChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="XAF">XAF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contractFile">Fichier du contrat</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="contractFile"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    handleFileChange(e.target.files?.[0] || null)
                  }
                  className="flex-1"
                />
                {contractFile && (
                  <span className="text-sm text-muted-foreground">
                    {contractFile.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Formats acceptés: PDF, DOC, DOCX (max 10MB)
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails du contrat"
        description={
          viewingContract
            ? `${viewingContract.position} - ${typeLabels[viewingContract.type]}`
            : ""
        }
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {viewingContract && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de contrat</Label>
                <p className="text-sm font-medium">
                  {typeLabels[viewingContract.type]}
                </p>
              </div>
              <div>
                <Label>Statut</Label>
                <Badge variant={statusColors[viewingContract.status]}>
                  {statusLabels[viewingContract.status]}
                </Badge>
              </div>
              <div>
                <Label>Poste</Label>
                <p className="text-sm font-medium">
                  {viewingContract.position}
                </p>
              </div>
              <div>
                <Label>Département</Label>
                <p className="text-sm font-medium">
                  {viewingContract.department}
                </p>
              </div>
              <div>
                <Label>Date de début</Label>
                <p className="text-sm font-medium">
                  {viewingContract.startDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
              {viewingContract.endDate && (
                <div>
                  <Label>Date de fin</Label>
                  <p className="text-sm font-medium">
                    {viewingContract.endDate.toLocaleDateString("fr-FR")}
                  </p>
                </div>
              )}
              <div>
                <Label>Salaire brut</Label>
                <p className="text-sm font-medium">
                  {viewingContract.salary.gross}{" "}
                  {viewingContract.salary.currency}
                </p>
              </div>
              <div>
                <Label>Salaire net</Label>
                <p className="text-sm font-medium">
                  {viewingContract.salary.net} {viewingContract.salary.currency}
                </p>
              </div>
              <div>
                <Label>Heures travaillées</Label>
                <p className="text-sm font-medium">
                  {viewingContract.workingHours}h/semaine
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Signé par l&apos;employé</Label>
                <div className="flex items-center space-x-2">
                  <FileSignature
                    className={`h-4 w-4 ${viewingContract.signedByEmployee ? "text-green-600" : "text-red-600"}`}
                  />
                  <span className="text-sm">
                    {viewingContract.signedByEmployee ? "Oui" : "Non"}
                  </span>
                </div>
              </div>
              <div>
                <Label>Signé par l&apos;employeur</Label>
                <div className="flex items-center space-x-2">
                  <FileSignature
                    className={`h-4 w-4 ${viewingContract.signedByEmployer ? "text-green-600" : "text-red-600"}`}
                  />
                  <span className="text-sm">
                    {viewingContract.signedByEmployer ? "Oui" : "Non"}
                  </span>
                </div>
              </div>
            </div>

            {viewingContract.signedAt && (
              <div>
                <Label>Date de signature</Label>
                <p className="text-sm font-medium">
                  {viewingContract.signedAt.toLocaleDateString("fr-FR")}
                </p>
              </div>
            )}

            {viewingContract.fileUrl && (
              <div>
                <Label>Fichier du contrat</Label>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={viewingContract.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Voir le contrat
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
