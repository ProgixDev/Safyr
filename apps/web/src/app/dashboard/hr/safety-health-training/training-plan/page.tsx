"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import {
  Plus,
  Calendar,
  Euro,
  Users,
  Clock,
  CheckCircle,
  MoreVertical,
  Eye,
  Pencil,
  TrendingUp,
  Trash2,
} from "lucide-react";
import type { TrainingPlan, TrainingBudget } from "@/lib/types";

// Mock data for training plans
const mockTrainingPlans: TrainingPlan[] = [
  {
    id: "1",
    title: "Formation SSIAP 2 - recyclage",
    description: "Recyclage annuel SSIAP niveau 2 pour les agents de sécurité",
    plannedDate: new Date("2024-06-15"),
    duration: 16,
    participants: ["EMP001", "EMP002", "EMP003"],
    trainer: "Formateur CNAPS",
    location: "Centre de formation Paris",
    budget: 2400,
    currency: "EUR",
    status: "planned",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "SST - recyclage collectif",
    description: "Session de recyclage SST pour tout le personnel",
    plannedDate: new Date("2024-09-20"),
    duration: 8,
    participants: ["EMP001", "EMP002", "EMP003", "EMP004"],
    trainer: "INRS",
    location: "Salle de formation interne",
    budget: 1200,
    currency: "EUR",
    status: "confirmed",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: "3",
    title: "Habilitation électrique H0B0",
    description: "Formation initiale H0B0 pour nouveaux agents",
    plannedDate: new Date("2024-04-10"),
    duration: 24,
    participants: ["EMP005", "EMP006"],
    trainer: "Organisme habilité",
    location: "Centre de formation Lyon",
    budget: 3600,
    currency: "EUR",
    status: "completed",
    actualDate: new Date("2024-04-10"),
    actualDuration: 24,
    actualCost: 3400,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-04-10"),
  },
];

// Mock training budget
const mockTrainingBudget: TrainingBudget = {
  year: 2024,
  totalBudget: 50000,
  usedBudget: 7200,
  remainingBudget: 42800,
  currency: "EUR",
  breakdown: {
    byType: {
      SSIAP1: 8000,
      SSIAP2: 12000,
      SSIAP3: 14000,
      SST: 6000,
      H0B0: 10000,
      FIRE: 8000,
      OTHER: 6000,
    },
    byDepartment: {
      Sécurité: 30000,
      Administration: 10000,
      Technique: 10000,
    },
  },
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export default function TrainingPlanPage() {
  const [trainingPlans, setTrainingPlans] =
    useState<TrainingPlan[]>(mockTrainingPlans);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlanForDelete, setSelectedPlanForDelete] =
    useState<TrainingPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    title: "",
    description: "",
    plannedDate: "",
    duration: "",
    participants: "",
    trainer: "",
    location: "",
    budget: "",
  });

  const handleViewPlan = (plan: TrainingPlan) => {
    setSelectedPlan(plan);
    setIsViewModalOpen(true);
  };

  const handleEditPlan = (plan: TrainingPlan) => {
    setSelectedPlan(plan);
    setPlanForm({
      title: plan.title,
      description: plan.description || "",
      plannedDate: plan.plannedDate.toISOString().split("T")[0],
      duration: plan.duration.toString(),
      participants: plan.participants.join(", "),
      trainer: plan.trainer || "",
      location: plan.location || "",
      budget: plan.budget.toString(),
    });
    setIsEditMode(true);
    setIsPlanModalOpen(true);
  };

  const handleDeletePlan = () => {
    if (selectedPlanForDelete) {
      setTrainingPlans(
        trainingPlans.filter((p) => p.id !== selectedPlanForDelete.id),
      );
      setIsDeleteModalOpen(false);
      setSelectedPlanForDelete(null);
    }
  };

  const handleCreateOrUpdatePlan = () => {
    if (isEditMode && selectedPlan) {
      // Update existing plan
      setTrainingPlans(
        trainingPlans.map((p) =>
          p.id === selectedPlan.id
            ? {
                ...p,
                title: planForm.title,
                description: planForm.description,
                plannedDate: new Date(planForm.plannedDate),
                duration: parseInt(planForm.duration),
                participants: planForm.participants
                  .split(",")
                  .map((p) => p.trim()),
                trainer: planForm.trainer,
                location: planForm.location,
                budget: parseFloat(planForm.budget),
                updatedAt: new Date(),
              }
            : p,
        ),
      );
    } else {
      // Create new plan
      const plan: TrainingPlan = {
        id: `PLAN${Date.now()}`,
        title: planForm.title,
        description: planForm.description,
        plannedDate: new Date(planForm.plannedDate),
        duration: parseInt(planForm.duration),
        participants: planForm.participants.split(",").map((p) => p.trim()),
        trainer: planForm.trainer,
        location: planForm.location,
        budget: parseFloat(planForm.budget),
        currency: "EUR",
        status: "planned",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setTrainingPlans([...trainingPlans, plan]);
    }

    setIsPlanModalOpen(false);
    setIsEditMode(false);
    setPlanForm({
      title: "",
      description: "",
      plannedDate: "",
      duration: "",
      participants: "",
      trainer: "",
      location: "",
      budget: "",
    });
  };

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setPlanForm({
      title: "",
      description: "",
      plannedDate: "",
      duration: "",
      participants: "",
      trainer: "",
      location: "",
      budget: "",
    });
    setIsPlanModalOpen(true);
  };

  const columns: ColumnDef<TrainingPlan>[] = [
    {
      key: "title",
      label: "Formation",
      sortable: true,
      render: (plan) => (
        <div>
          <div className="font-medium">{plan.title}</div>
          <div className="text-sm text-muted-foreground">
            {plan.description}
          </div>
        </div>
      ),
    },
    {
      key: "plannedDate",
      label: "Date prévue",
      icon: Calendar,
      sortable: true,
      render: (plan) => (
        <span className="text-sm">
          {plan.plannedDate.toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      key: "duration",
      label: "Durée",
      icon: Clock,
      sortable: true,
      render: (plan) => <span className="text-sm">{plan.duration}h</span>,
    },
    {
      key: "participants",
      label: "Participants",
      icon: Users,
      render: (plan) => (
        <span className="text-sm">{plan.participants.length} participants</span>
      ),
    },
    {
      key: "budget",
      label: "Budget",
      icon: Euro,
      sortable: true,
      render: (plan) => (
        <span className="font-medium">
          {plan.budget.toLocaleString("fr-FR")} €
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (plan) => (
        <Badge
          variant={
            plan.status === "completed"
              ? "default"
              : plan.status === "confirmed"
                ? "secondary"
                : "outline"
          }
        >
          {plan.status === "completed"
            ? "Terminée"
            : plan.status === "confirmed"
              ? "Confirmée"
              : "Planifiée"}
        </Badge>
      ),
    },
  ];

  const confirmedCount = trainingPlans.filter(
    (p) => p.status === "confirmed",
  ).length;
  const completedCount = trainingPlans.filter(
    (p) => p.status === "completed",
  ).length;
  const totalBudgetUsed = trainingPlans.reduce((sum, p) => sum + p.budget, 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Plan & Budget de Formation
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Planification annuelle des formations et suivi budgétaire
          </p>
        </div>
        <Button onClick={handleOpenCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle formation
        </Button>
      </div>

      {/* Budget Overview */}
      <InfoCardContainer>
        <InfoCard
          icon={Euro}
          title="Budget total 2024"
          value={`${mockTrainingBudget.totalBudget.toLocaleString("fr-FR")} €`}
          subtext="Budget annuel"
          color="blue"
        />
        <InfoCard
          icon={TrendingUp}
          title="Budget utilisé"
          value={`${totalBudgetUsed.toLocaleString("fr-FR")} €`}
          subtext={`${((totalBudgetUsed / mockTrainingBudget.totalBudget) * 100).toFixed(1)}% du budget`}
          color="orange"
        />
        <InfoCard
          icon={CheckCircle}
          title="Budget restant"
          value={`${(mockTrainingBudget.totalBudget - totalBudgetUsed).toLocaleString("fr-FR")} €`}
          subtext="Disponible"
          color="green"
        />
        <InfoCard
          icon={Calendar}
          title="Formations planifiées"
          value={trainingPlans.length}
          subtext={`${confirmedCount} confirmées, ${completedCount} terminées`}
          color="purple"
        />
      </InfoCardContainer>

      {/* Training Plans DataTable */}
      <DataTable
        data={trainingPlans}
        columns={columns}
        searchKeys={["title", "description", "trainer"]}
        getSearchValue={(plan) =>
          `${plan.title} ${plan.description} ${plan.trainer}`
        }
        searchPlaceholder="Rechercher par titre, description ou formateur..."
        getRowId={(plan) => plan.id}
        actions={(plan) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleViewPlan(plan)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEditPlan(plan)}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPlanForDelete(plan);
                  setIsDeleteModalOpen(true);
                }}
                className="flex items-center gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* View Plan Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de la formation"
        size="md"
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Titre</Label>
              <p className="text-lg font-medium mt-1">{selectedPlan.title}</p>
            </div>

            {selectedPlan.description && (
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPlan.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Date prévue</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedPlan.plannedDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Durée</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedPlan.duration} heures
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Participants</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedPlan.participants.length} personnes
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Budget</Label>
                <p className="text-sm font-medium">
                  {selectedPlan.budget.toLocaleString("fr-FR")} €
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Formateur</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedPlan.trainer || "-"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Lieu</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedPlan.location || "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedPlan.status === "completed"
                        ? "default"
                        : selectedPlan.status === "confirmed"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {selectedPlan.status === "completed"
                      ? "Terminée"
                      : selectedPlan.status === "confirmed"
                        ? "Confirmée"
                        : "Planifiée"}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Date de réalisation
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPlan.actualDate?.toLocaleDateString("fr-FR") || "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                Créée le {selectedPlan.createdAt.toLocaleDateString("fr-FR")}
              </div>
              <div>
                Modifiée le {selectedPlan.updatedAt.toLocaleDateString("fr-FR")}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Plan Modal (Create/Edit) */}
      <Modal
        open={isPlanModalOpen}
        onOpenChange={(open) => {
          setIsPlanModalOpen(open);
          if (!open) {
            setIsEditMode(false);
          }
        }}
        type="form"
        title={isEditMode ? "Modifier la formation" : "Nouvelle formation"}
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsPlanModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: isEditMode ? "Mettre à jour" : "Créer",
            onClick: handleCreateOrUpdatePlan,
            disabled: !planForm.title || !planForm.plannedDate,
          },
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Titre de la formation <span className="text-destructive">*</span>
            </Label>
            <Select
              value={planForm.title}
              onValueChange={(value) =>
                setPlanForm((prev) => ({
                  ...prev,
                  title: value,
                }))
              }
            >
              <SelectTrigger id="title">
                <SelectValue placeholder="Choisir une formation..." />
              </SelectTrigger>
              <SelectContent>
                {[
                  "SSIAP1",
                  "SSIAP2",
                  "SSIAP3",
                  "SST",
                  "H0B0",
                  "MAC/APS",
                  "MAC/SST",
                  "Divers",
                ].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={planForm.description}
              onChange={(e) =>
                setPlanForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Description de la formation"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plannedDate">
                Date prévue <span className="text-destructive">*</span>
              </Label>
              <Input
                id="plannedDate"
                type="date"
                value={planForm.plannedDate}
                onChange={(e) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    plannedDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Durée (heures)</Label>
              <Input
                id="duration"
                type="number"
                value={planForm.duration}
                onChange={(e) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    duration: e.target.value,
                  }))
                }
                placeholder="16"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trainer">Formateur</Label>
              <Input
                id="trainer"
                value={planForm.trainer}
                onChange={(e) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    trainer: e.target.value,
                  }))
                }
                placeholder="Nom du formateur ou organisme"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input
                id="location"
                value={planForm.location}
                onChange={(e) =>
                  setPlanForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder="Lieu de la formation"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">
              Participants (séparés par des virgules)
            </Label>
            <Input
              id="participants"
              value={planForm.participants}
              onChange={(e) =>
                setPlanForm((prev) => ({
                  ...prev,
                  participants: e.target.value,
                }))
              }
              placeholder="EMP001, EMP002, EMP003"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget (€)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              value={planForm.budget}
              onChange={(e) =>
                setPlanForm((prev) => ({
                  ...prev,
                  budget: e.target.value,
                }))
              }
              placeholder="2400.00"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        type="confirmation"
        title="Confirmer la suppression"
        size="sm"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsDeleteModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: "Supprimer",
            onClick: handleDeletePlan,
            variant: "destructive",
          },
        }}
      >
        <div>
          <p>Êtes-vous sûr de vouloir supprimer cette formation ?</p>
          {selectedPlanForDelete && (
            <p className="text-sm text-muted-foreground mt-2">
              {selectedPlanForDelete.title}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
