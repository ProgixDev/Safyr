"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Download,
  MoreVertical,
  GraduationCap,
  Award,
  Euro,
  Calendar,
} from "lucide-react";
import { TrainingRegisterEntry } from "@/lib/types";
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
const mockTrainingRegister: TrainingRegisterEntry[] = [
  {
    id: "1",
    employeeId: "1",
    trainingName: "SSIAP 1 - Initial",
    trainingType: "SSIAP",
    trainingOrganization: "Centre de formation XYZ",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-01-19"),
    duration: 67,
    cost: 850.0,
    fundingSource: "opco",
    certificationObtained: true,
    certificationDate: new Date("2024-01-19"),
    certificationNumber: "SSIAP1-2024-001",
    expirationDate: new Date("2027-01-19"),
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    employeeId: "2",
    trainingName: "SST - Recyclage",
    trainingType: "SST",
    trainingOrganization: "ACME Formation",
    startDate: new Date("2024-03-10"),
    endDate: new Date("2024-03-11"),
    duration: 14,
    cost: 250.0,
    fundingSource: "company",
    certificationObtained: true,
    certificationDate: new Date("2024-03-11"),
    certificationNumber: "SST-2024-045",
    expirationDate: new Date("2026-03-11"),
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-12"),
  },
  {
    id: "3",
    employeeId: "3",
    trainingName: "CQP APS",
    trainingType: "CQP",
    trainingOrganization: "Institut de Sécurité",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-03-15"),
    duration: 175,
    cost: 1500.0,
    fundingSource: "opco",
    certificationObtained: true,
    certificationDate: new Date("2024-03-15"),
    certificationNumber: "CQP-2024-123",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-03-16"),
  },
];

const trainingTypeLabels = {
  SSIAP: "SSIAP",
  SST: "SST",
  CQP: "CQP",
  H0B0: "H0B0",
  fire: "Incendie",
  professional: "Professionnelle",
  regulatory: "Réglementaire",
  other: "Autre",
};

const trainingTypeColors = {
  SSIAP: "default",
  SST: "default",
  CQP: "secondary",
  H0B0: "default",
  fire: "destructive",
  professional: "secondary",
  regulatory: "default",
  other: "secondary",
} as const;

const fundingSourceLabels = {
  company: "Entreprise",
  opco: "OPCO",
  personal: "Personnel",
  other: "Autre",
};

export default function TrainingRegisterPage() {
  const [trainings, setTrainings] =
    useState<TrainingRegisterEntry[]>(mockTrainingRegister);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] =
    useState<TrainingRegisterEntry | null>(null);
  const [viewingTraining, setViewingTraining] =
    useState<TrainingRegisterEntry | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterFunding, setFilterFunding] = useState<string>("all");

  const [formData, setFormData] = useState({
    employeeId: "",
    trainingName: "",
    trainingType: "professional" as TrainingRegisterEntry["trainingType"],
    trainingOrganization: "",
    startDate: "",
    endDate: "",
    duration: "",
    cost: "",
    fundingSource: "company" as TrainingRegisterEntry["fundingSource"],
    certificationObtained: false,
    certificationDate: "",
    certificationNumber: "",
    expirationDate: "",
    notes: "",
  });

  const getEmployeeName = (employeeId: string) => {
    return mockEmployees.find((e) => e.id === employeeId)?.name || "N/A";
  };

  const handleCreate = () => {
    setEditingTraining(null);
    setFormData({
      employeeId: "",
      trainingName: "",
      trainingType: "professional",
      trainingOrganization: "",
      startDate: "",
      endDate: "",
      duration: "",
      cost: "",
      fundingSource: "company",
      certificationObtained: false,
      certificationDate: "",
      certificationNumber: "",
      expirationDate: "",
      notes: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (training: TrainingRegisterEntry) => {
    setEditingTraining(training);
    setFormData({
      employeeId: training.employeeId,
      trainingName: training.trainingName,
      trainingType: training.trainingType,
      trainingOrganization: training.trainingOrganization,
      startDate: training.startDate.toISOString().split("T")[0],
      endDate: training.endDate.toISOString().split("T")[0],
      duration: training.duration.toString(),
      cost: training.cost.toString(),
      fundingSource: training.fundingSource,
      certificationObtained: training.certificationObtained,
      certificationDate: training.certificationDate
        ? training.certificationDate.toISOString().split("T")[0]
        : "",
      certificationNumber: training.certificationNumber || "",
      expirationDate: training.expirationDate
        ? training.expirationDate.toISOString().split("T")[0]
        : "",
      notes: training.notes || "",
    });
    setIsCreateModalOpen(true);
  };

  const handleView = (training: TrainingRegisterEntry) => {
    setViewingTraining(training);
    setIsViewModalOpen(true);
  };

  const handleDelete = (trainingId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette formation ?")) {
      setTrainings(trainings.filter((t) => t.id !== trainingId));
    }
  };

  const handleSave = () => {
    const trainingData = {
      employeeId: formData.employeeId,
      trainingName: formData.trainingName,
      trainingType: formData.trainingType,
      trainingOrganization: formData.trainingOrganization,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      duration: Number(formData.duration),
      cost: Number(formData.cost),
      fundingSource: formData.fundingSource,
      certificationObtained: formData.certificationObtained,
      certificationDate: formData.certificationDate
        ? new Date(formData.certificationDate)
        : undefined,
      certificationNumber: formData.certificationNumber || undefined,
      expirationDate: formData.expirationDate
        ? new Date(formData.expirationDate)
        : undefined,
      notes: formData.notes || undefined,
    };

    if (editingTraining) {
      setTrainings(
        trainings.map((training) =>
          training.id === editingTraining.id
            ? {
                ...training,
                ...trainingData,
                updatedAt: new Date(),
              }
            : training,
        ),
      );
    } else {
      const newTraining: TrainingRegisterEntry = {
        id: Date.now().toString(),
        ...trainingData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setTrainings([...trainings, newTraining]);
    }

    setIsCreateModalOpen(false);
  };

  const handleExportPDF = () => {
    alert("Export PDF du registre unique de formation (conforme CNAPS)...");
  };

  // Apply filters
  let filteredTrainings = trainings;

  if (filterType !== "all") {
    filteredTrainings = filteredTrainings.filter(
      (t) => t.trainingType === filterType,
    );
  }

  if (filterFunding !== "all") {
    filteredTrainings = filteredTrainings.filter(
      (t) => t.fundingSource === filterFunding,
    );
  }

  const columns: ColumnDef<TrainingRegisterEntry>[] = [
    {
      key: "employeeId",
      label: "Employé",
      render: (training: TrainingRegisterEntry) => (
        <Link
          href={`/dashboard/hr/collaborators/${training.employeeId}`}
          className="hover:underline"
        >
          <div className="font-medium">
            {getEmployeeName(training.employeeId)}
          </div>
        </Link>
      ),
    },
    {
      key: "trainingName",
      label: "Formation",
      render: (training: TrainingRegisterEntry) => (
        <div>
          <div className="font-medium">{training.trainingName}</div>
          <div className="text-sm text-muted-foreground">
            {training.trainingOrganization}
          </div>
        </div>
      ),
    },
    {
      key: "trainingType",
      label: "Type",
      render: (training: TrainingRegisterEntry) => (
        <Badge variant={trainingTypeColors[training.trainingType]}>
          {trainingTypeLabels[training.trainingType]}
        </Badge>
      ),
    },
    {
      key: "startDate",
      label: "Période",
      render: (training: TrainingRegisterEntry) => (
        <div className="text-sm">
          {training.startDate.toLocaleDateString("fr-FR")}
          <br />
          <span className="text-muted-foreground">
            au {training.endDate.toLocaleDateString("fr-FR")}
          </span>
        </div>
      ),
    },
    {
      key: "duration",
      label: "Durée",
      render: (training: TrainingRegisterEntry) => (
        <span>{training.duration}h</span>
      ),
    },
    {
      key: "certificationObtained",
      label: "Certification",
      render: (training: TrainingRegisterEntry) =>
        training.certificationObtained ? (
          <div>
            <Award className="h-4 w-4 text-green-600 inline mr-1" />
            <span className="text-sm">{training.certificationNumber}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "cost",
      label: "Coût",
      render: (training: TrainingRegisterEntry) => (
        <span className="font-medium">{training.cost.toFixed(2)} €</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (training: TrainingRegisterEntry) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(training)}>
              <Eye className="mr-2 h-4 w-4 text-green-600" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(training)}>
              <Pencil className="mr-2 h-4 w-4 text-orange-500" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(training.id)}
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
  const totalTrainings = trainings.length;
  const totalCost = trainings.reduce((sum, t) => sum + t.cost, 0);
  const totalHours = trainings.reduce((sum, t) => sum + t.duration, 0);
  const certifiedCount = trainings.filter(
    (t) => t.certificationObtained,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registre Unique de Formation</h1>
          <p className="text-muted-foreground">
            Suivi réglementaire des formations et certifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une formation
          </Button>
        </div>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={GraduationCap}
          title="Formations"
          value={totalTrainings}
          subtext="Total enregistré"
          color="blue"
        />

        <InfoCard
          icon={Calendar}
          title="Heures"
          value={`${totalHours}h`}
          subtext="Durée totale"
          color="green"
        />

        <InfoCard
          icon={Euro}
          title="Budget"
          value={`${totalCost.toFixed(0)} €`}
          subtext="Coût total"
          color="orange"
        />

        <InfoCard
          icon={Award}
          title="Certifications"
          value={certifiedCount}
          subtext="Obtenues"
          color="purple"
        />
      </InfoCardContainer>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Registre ({filteredTrainings.length})</CardTitle>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="SSIAP">SSIAP</SelectItem>
                  <SelectItem value="SST">SST</SelectItem>
                  <SelectItem value="CQP">CQP</SelectItem>
                  <SelectItem value="MAC/CQP">MAC / CQP</SelectItem>
                  <SelectItem value="MAC/SST">MAC / SST</SelectItem>
                  <SelectItem value="H0B0">H0B0</SelectItem>
                  <SelectItem value="fire">Incendie</SelectItem>
                  <SelectItem value="professional">Professionnelle</SelectItem>
                  <SelectItem value="regulatory">Réglementaire</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterFunding} onValueChange={setFilterFunding}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Financement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="company">Entreprise</SelectItem>
                  <SelectItem value="opco">OPCO</SelectItem>
                  <SelectItem value="personal">Personnel</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredTrainings} />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={
          editingTraining ? "Modifier la formation" : "Ajouter une formation"
        }
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
              <Label htmlFor="trainingType">Type de formation *</Label>
              <Select
                value={formData.trainingType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    trainingType:
                      value as TrainingRegisterEntry["trainingType"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SSIAP">SSIAP</SelectItem>
                  <SelectItem value="SST">SST</SelectItem>
                  <SelectItem value="CQP">CQP</SelectItem>
                  <SelectItem value="MAC/CQP">MAC / CQP</SelectItem>
                  <SelectItem value="MAC/SST">MAC / SST</SelectItem>
                  <SelectItem value="H0B0">H0B0</SelectItem>
                  <SelectItem value="fire">Incendie</SelectItem>
                  <SelectItem value="professional">Professionnelle</SelectItem>
                  <SelectItem value="regulatory">Réglementaire</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="trainingName">Intitulé de la formation *</Label>
            <Input
              id="trainingName"
              value={formData.trainingName}
              onChange={(e) =>
                setFormData({ ...formData, trainingName: e.target.value })
              }
              placeholder="Ex: SSIAP 1 - Initial"
            />
          </div>

          <div>
            <Label htmlFor="trainingOrganization">
              Organisme de formation *
            </Label>
            <Input
              id="trainingOrganization"
              value={formData.trainingOrganization}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  trainingOrganization: e.target.value,
                })
              }
              placeholder="Ex: Centre de formation XYZ"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="endDate">Date de fin *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="duration">Durée (heures) *</Label>
              <HoursInput
                value={parseFloat(formData.duration) || 0}
                onChange={(value) =>
                  setFormData({ ...formData, duration: value.toString() })
                }
                step={0.5}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost">Coût (€) *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
                placeholder="Ex: 850.00"
              />
            </div>

            <div>
              <Label htmlFor="fundingSource">Source de financement *</Label>
              <Select
                value={formData.fundingSource}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    fundingSource:
                      value as TrainingRegisterEntry["fundingSource"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Entreprise</SelectItem>
                  <SelectItem value="opco">OPCO</SelectItem>
                  <SelectItem value="personal">Personnel</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="certificationObtained"
              checked={formData.certificationObtained}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  certificationObtained: checked as boolean,
                })
              }
            />
            <Label htmlFor="certificationObtained" className="cursor-pointer">
              Certification obtenue
            </Label>
          </div>

          {formData.certificationObtained && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="certificationDate">Date certification</Label>
                <Input
                  id="certificationDate"
                  type="date"
                  value={formData.certificationDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificationDate: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="certificationNumber">N° certification</Label>
                <Input
                  id="certificationNumber"
                  value={formData.certificationNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificationNumber: e.target.value,
                    })
                  }
                  placeholder="Ex: SSIAP1-2024-001"
                />
              </div>

              <div>
                <Label htmlFor="expirationDate">Date d&apos;expiration</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expirationDate: e.target.value })
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
        title="Détails de la formation"
        size="lg"
      >
        {viewingTraining && (
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Employé</Label>
              <p className="text-sm font-medium">
                {getEmployeeName(viewingTraining.employeeId)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Formation</Label>
                <p className="text-sm font-medium">
                  {viewingTraining.trainingName}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <div className="mt-1">
                  <Badge
                    variant={trainingTypeColors[viewingTraining.trainingType]}
                  >
                    {trainingTypeLabels[viewingTraining.trainingType]}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">
                Organisme de formation
              </Label>
              <p className="text-sm">{viewingTraining.trainingOrganization}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">Date de début</Label>
                <p className="text-sm font-medium">
                  {viewingTraining.startDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date de fin</Label>
                <p className="text-sm font-medium">
                  {viewingTraining.endDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Durée</Label>
                <p className="text-sm font-medium">
                  {viewingTraining.duration} heures
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Coût</Label>
                <p className="text-sm font-medium">
                  {viewingTraining.cost.toFixed(2)} €
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Financement</Label>
                <p className="text-sm font-medium">
                  {fundingSourceLabels[viewingTraining.fundingSource]}
                </p>
              </div>
            </div>

            {viewingTraining.certificationObtained && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">
                      Date certification
                    </Label>
                    <p className="text-sm font-medium">
                      {viewingTraining.certificationDate?.toLocaleDateString(
                        "fr-FR",
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      N° certification
                    </Label>
                    <p className="text-sm font-medium">
                      {viewingTraining.certificationNumber}
                    </p>
                  </div>
                </div>

                {viewingTraining.expirationDate && (
                  <div>
                    <Label className="text-muted-foreground">
                      Date d&apos;expiration
                    </Label>
                    <p className="text-sm font-medium">
                      {viewingTraining.expirationDate.toLocaleDateString(
                        "fr-FR",
                      )}
                    </p>
                  </div>
                )}
              </>
            )}

            {viewingTraining.notes && (
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <p className="text-sm">{viewingTraining.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
