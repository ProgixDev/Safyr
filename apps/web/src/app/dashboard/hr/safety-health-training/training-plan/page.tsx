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
  GraduationCap,
  Shield,
  Award,
  FileText,
  Briefcase,
  BookOpen,
  Building2,
} from "lucide-react";
import type { TrainingPlan, TrainingBudget } from "@/lib/types";

// Types de formation avec descriptions
const TRAINING_TYPES = {
  SSIAP1: {
    label: "SSIAP 1",
    description: "Formation initiale d'agent de sécurité incendie",
    duration: 70,
    icon: Shield,
  },
  SSIAP2: {
    label: "SSIAP 2",
    description: "Formation de chef d'équipe sécurité incendie",
    duration: 60,
    icon: Shield,
  },
  SSIAP3: {
    label: "SSIAP 3",
    description: "Formation de chef de service sécurité incendie",
    duration: 80,
    icon: Shield,
  },
  SST: {
    label: "SST",
    description: "Sauveteur Secouriste du Travail",
    duration: 14,
    icon: Award,
  },
  H0B0: {
    label: "H0B0",
    description: "Habilitation électrique H0B0",
    duration: 24,
    icon: Briefcase,
  },
  MAC_APS: {
    label: "MAC/APS",
    description: "Maintien et Actualisation des Compétences - APS",
    duration: 28,
    icon: BookOpen,
  },
  MAC_SST: {
    label: "MAC/SST",
    description: "Maintien et Actualisation des Compétences - SST",
    duration: 7,
    icon: BookOpen,
  },
  DIVERS: {
    label: "Divers",
    description: "Autres formations",
    duration: 0,
    icon: FileText,
  },
} as const;

type TrainingType = keyof typeof TRAINING_TYPES;

// Mock data for training plans
const mockTrainingPlans: TrainingPlan[] = [
  {
    id: "1",
    title: "SSIAP 2",
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
    title: "SST",
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
    title: "H0B0",
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
  {
    id: "4",
    title: "MAC/APS",
    description: "MAC/APS pour agents de sécurité",
    plannedDate: new Date("2024-11-05"),
    duration: 28,
    participants: ["EMP001", "EMP002", "EMP003", "EMP004", "EMP005"],
    trainer: "Organisme agréé",
    location: "Centre de formation Marseille",
    budget: 4200,
    currency: "EUR",
    status: "planned",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
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

  // Gestionnaire pour le changement de type de formation
  const handleTrainingTypeChange = (value: string) => {
    const trainingType = value as TrainingType;
    const trainingInfo = TRAINING_TYPES[trainingType];
    
    setPlanForm((prev) => ({
      ...prev,
      title: value,
      description: trainingInfo?.description || "",
      duration: trainingInfo?.duration?.toString() || "",
    }));
  };

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
                duration: parseInt(planForm.duration) || 0,
                participants: planForm.participants
                  .split(",")
                  .map((p) => p.trim())
                  .filter((p) => p),
                trainer: planForm.trainer,
                location: planForm.location,
                budget: parseFloat(planForm.budget) || 0,
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
        duration: parseInt(planForm.duration) || 0,
        participants: planForm.participants.split(",").map((p) => p.trim()).filter((p) => p),
        trainer: planForm.trainer,
        location: planForm.location,
        budget: parseFloat(planForm.budget) || 0,
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

  // Fonction pour obtenir l'icône du type de formation
  const getTrainingIcon = (title: string) => {
    const type = Object.keys(TRAINING_TYPES).find(
      (key) => TRAINING_TYPES[key as TrainingType].label === title
    ) as TrainingType | undefined;
    if (type && TRAINING_TYPES[type]) {
      const Icon = TRAINING_TYPES[type].icon;
      return <Icon className="h-4 w-4" />;
    }
    return <GraduationCap className="h-4 w-4" />;
  };

  // Fonction pour obtenir le badge de type de formation
  const getTrainingBadge = (title: string) => {
    const type = Object.keys(TRAINING_TYPES).find(
      (key) => TRAINING_TYPES[key as TrainingType].label === title
    ) as TrainingType | undefined;
    if (type) {
      const colors: Record<TrainingType, string> = {
        SSIAP1: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        SSIAP2: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
        SSIAP3: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
        SST: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        H0B0: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        MAC_APS: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
        MAC_SST: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
        DIVERS: "bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300",
      };
      return colors[type] || "";
    }
    return "";
  };

  const columns: ColumnDef<TrainingPlan>[] = [
    {
      key: "title",
      label: "Formation",
      sortable: true,
      render: (plan) => (
        <div>
          <div className="flex items-center gap-2">
            {getTrainingIcon(plan.title)}
            <span className="font-medium">{plan.title}</span>
          </div>
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

  // Statistiques par type de formation
  const trainingStats = Object.entries(TRAINING_TYPES).map(([key, value]) => {
    const count = trainingPlans.filter(p => p.title === value.label).length;
    const budget = trainingPlans
      .filter(p => p.title === value.label)
      .reduce((sum, p) => sum + p.budget, 0);
    return {
      type: key as TrainingType,
      label: value.label,
      count,
      budget,
      icon: value.icon,
    };
  });

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

      {/* Statistiques par type de formation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {trainingStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.type}
              className="p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{stat.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {stat.count} formation{stat.count > 1 ? "s" : ""}
                </span>
                <span className="font-medium">
                  {stat.budget.toLocaleString("fr-FR")} €
                </span>
              </div>
            </div>
          );
        })}
      </div>

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
              <div className="flex items-center gap-2 mt-1">
                {getTrainingIcon(selectedPlan.title)}
                <p className="text-lg font-medium">{selectedPlan.title}</p>
                <Badge className={getTrainingBadge(selectedPlan.title)}>
                  {selectedPlan.title}
                </Badge>
              </div>
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
              Type de formation <span className="text-destructive">*</span>
            </Label>
            <Select
              value={planForm.title}
              onValueChange={handleTrainingTypeChange}
            >
              <SelectTrigger id="title" className="w-full">
                <SelectValue placeholder="Sélectionner un type de formation..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TRAINING_TYPES).map(([key, value]) => {
                  const Icon = value.icon;
                  return (
                    <SelectItem key={key} value={value.label} className="py-2">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">{value.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {value.description}
                          </span>
                        </div>
                        {value.duration > 0 && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            {value.duration}h
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {planForm.title && (
              <p className="text-xs text-muted-foreground mt-1">
                {TRAINING_TYPES[planForm.title as TrainingType]?.description || 
                 "Formation personnalisée"}
              </p>
            )}
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
              placeholder="Description détaillée de la formation"
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
              <Label htmlFor="trainer">Formateur / Organisme</Label>
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
            <p className="text-xs text-muted-foreground">
              Entrez les identifiants des participants séparés par des virgules
            </p>
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
            <div className="mt-2 p-3 bg-muted/30 rounded-lg">
              <p className="font-medium">{selectedPlanForDelete.title}</p>
              <p className="text-sm text-muted-foreground">
                {selectedPlanForDelete.description}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}