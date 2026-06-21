"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MoreVertical,
  FileText,
  Target,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Interview, Objective } from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Combobox } from "@/components/ui/combobox";
import { Progress } from "@/components/ui/progress";

// Mock employees for selection
const mockEmployees = [
  { id: "1", name: "Marie Dupont", hiringDate: "2020-01-15" },
  { id: "2", name: "Jean Martin", hiringDate: "2019-03-20" },
  { id: "3", name: "Sophie Leroy", hiringDate: "2021-06-10" },
  { id: "4", name: "Pierre Durand", hiringDate: "2018-11-05" },
];

const employeeOptions = mockEmployees.map((employee) => ({
  value: employee.id,
  label: employee.name,
}));

// Mock data for interviews
const mockAnnualInterviews: Interview[] = [
  {
    id: "1",
    employeeId: "1",
    type: "annual",
    date: new Date("2024-12-15"),
    interviewer: "Alice Dubois",
    notes: "Excellente performance cette année. Objectifs atteints.",
    objectives: [
      "Améliorer les compétences en leadership",
      "Suivre formation management",
    ],
    status: "completed",
    documents: ["/files/entretien_marie_2024.pdf"],
    createdAt: new Date("2024-11-15"),
    updatedAt: new Date("2024-12-15"),
  },
  {
    id: "2",
    employeeId: "2",
    type: "annual",
    date: new Date("2025-01-20"),
    interviewer: "Alice Dubois",
    notes: "",
    objectives: [],
    status: "scheduled",
    createdAt: new Date("2024-12-01"),
    updatedAt: new Date("2024-12-01"),
  },
];

const mockProfessionalInterviews: Interview[] = [
  {
    id: "3",
    employeeId: "1",
    type: "professional",
    date: new Date("2024-06-10"),
    interviewer: "Dr. Dubois",
    notes: "Discussion sur les perspectives d'évolution professionnelle.",
    objectives: [
      "Préparation au passage de CQP",
      "Formation en management d'équipe",
    ],
    status: "completed",
    documents: ["/files/entretien_prof_marie_2024.pdf"],
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-06-10"),
  },
  {
    id: "4",
    employeeId: "2",
    type: "professional",
    date: new Date("2025-03-15"),
    interviewer: "Dr. Dubois",
    notes: "",
    objectives: [],
    status: "scheduled",
    createdAt: new Date("2024-12-01"),
    updatedAt: new Date("2024-12-01"),
  },
];

// Mock data for objectives
const mockObjectives: Objective[] = [
  {
    id: "1",
    employeeId: "1",
    title: "Améliorer les compétences en leadership",
    description: "Développer les compétences en management d'équipe",
    category: "development",
    targetDate: new Date("2024-12-31"),
    progress: 75,
    status: "active",
    relatedInterviewId: "1",
    notes: "Formation management en cours",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-10-15"),
  },
  {
    id: "2",
    employeeId: "2",
    title: "Certification CQP",
    description: "Obtenir la certification CQP dans les 2 ans",
    category: "career",
    targetDate: new Date("2025-12-31"),
    progress: 30,
    status: "active",
    notes: "Préparation en cours",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-09-01"),
  },
];

const statusLabels = {
  scheduled: "Planifié",
  completed: "Terminé",
  cancelled: "Annulé",
};

const statusColors = {
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
} as const;

const objectiveStatusLabels = {
  active: "Actif",
  completed: "Terminé",
  cancelled: "Annulé",
};

const objectiveStatusColors = {
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
} as const;

const categoryLabels = {
  performance: "Performance",
  development: "Développement",
  career: "Carrière",
  skills: "Compétences",
};

const categoryIcons = {
  performance: Target,
  development: TrendingUp,
  career: Calendar,
  skills: FileText,
};

type ItemType = "annual" | "professional" | "objectives";

type CombinedItem =
  | (Interview & {
      itemType: "interview";
      interviewType: "annual" | "professional";
      originalId: string;
    })
  | (Objective & { itemType: "objective"; originalId: string });

export default function InterviewsPage() {
  const [annualInterviews, setAnnualInterviews] =
    useState<Interview[]>(mockAnnualInterviews);
  const [professionalInterviews, setProfessionalInterviews] = useState<
    Interview[]
  >(mockProfessionalInterviews);
  const [objectives, setObjectives] = useState<Objective[]>(mockObjectives);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CombinedItem | null>(null);
  const [viewingItem, setViewingItem] = useState<CombinedItem | null>(null);
  const [currentType, setCurrentType] = useState<ItemType>("annual");
  const [formData, setFormData] = useState({
    employeeId: "",
    date: "",
    interviewer: "",
    notes: "",
    objectives: [""],
    status: "scheduled" as "scheduled" | "completed" | "cancelled",
    title: "",
    description: "",
    category: "performance" as
      | "performance"
      | "development"
      | "career"
      | "skills",
    targetDate: "",
    progress: 0,
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Combined data for the table
  const allItems: CombinedItem[] = [
    ...annualInterviews.map((i) => ({
      ...i,
      id: `annual-${i.id}`,
      originalId: i.id,
      itemType: "interview" as const,
      interviewType: "annual" as const,
    })),
    ...professionalInterviews.map((i) => ({
      ...i,
      id: `professional-${i.id}`,
      originalId: i.id,
      itemType: "interview" as const,
      interviewType: "professional" as const,
    })),
    ...objectives.map((o) => ({
      ...o,
      id: `objective-${o.id}`,
      originalId: o.id,
      itemType: "objective" as const,
    })),
  ];

  const handleCreate = (type: ItemType) => {
    setCurrentType(type);
    setEditingItem(null);
    if (type === "objectives") {
      setFormData({
        employeeId: "",
        date: "",
        interviewer: "",
        notes: "",
        objectives: [""],
        status: "scheduled",
        title: "",
        description: "",
        category: "performance",
        targetDate: new Date().toISOString().split("T")[0],
        progress: 0,
      });
    } else {
      setFormData({
        employeeId: "",
        date: new Date().toISOString().split("T")[0],
        interviewer: "",
        notes: "",
        objectives: [""],
        status: "scheduled",
        title: "",
        description: "",
        category: "performance",
        targetDate: "",
        progress: 0,
      });
    }
    setDocumentFile(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (item: CombinedItem) => {
    setEditingItem(item);
    if (item.itemType === "interview") {
      // It's an interview
      setCurrentType(item.interviewType);
      setFormData({
        employeeId: item.employeeId,
        date: item.date.toISOString().split("T")[0],
        interviewer: item.interviewer,
        notes: item.notes,
        objectives: item.objectives.length > 0 ? item.objectives : [""],
        status: item.status,
        title: "",
        description: "",
        category: "performance",
        targetDate: "",
        progress: 0,
      });
    } else {
      // It's an objective
      setCurrentType("objectives");
      setFormData({
        employeeId: item.employeeId,
        date: "",
        interviewer: "",
        notes: item.notes,
        objectives: [""],
        status: "scheduled",
        title: item.title,
        description: item.description,
        category: item.category,
        targetDate: item.targetDate.toISOString().split("T")[0],
        progress: item.progress,
      });
    }
    setIsCreateModalOpen(true);
  };

  const handleView = (item: CombinedItem) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const handleDelete = (
    id: string,
    itemType: "interview" | "objective",
    interviewType?: "annual" | "professional",
  ) => {
    const confirmMessage =
      itemType === "objective"
        ? "Êtes-vous sûr de vouloir supprimer cet objectif ?"
        : "Êtes-vous sûr de vouloir supprimer cet entretien ?";
    if (confirm(confirmMessage)) {
      if (itemType === "interview") {
        if (interviewType === "annual") {
          setAnnualInterviews(annualInterviews.filter((i) => i.id !== id));
        } else {
          setProfessionalInterviews(
            professionalInterviews.filter((i) => i.id !== id),
          );
        }
      } else {
        setObjectives(objectives.filter((o) => o.id !== id));
      }
    }
  };

  const handleSave = () => {
    if (currentType === "objectives") {
      const objectiveData = {
        employeeId: formData.employeeId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        targetDate: new Date(formData.targetDate),
        progress: formData.progress,
        status: "active" as const,
        notes: formData.notes,
      };

      if (editingItem && "title" in editingItem) {
        setObjectives(
          objectives.map((objective) =>
            objective.id === editingItem.originalId
              ? {
                  ...objective,
                  ...objectiveData,
                  updatedAt: new Date(),
                }
              : objective,
          ),
        );
      } else {
        const newObjective: Objective = {
          id: Date.now().toString(),
          ...objectiveData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setObjectives([...objectives, newObjective]);
      }
    } else {
      const interviewData = {
        employeeId: formData.employeeId,
        type: currentType as "annual" | "professional",
        date: new Date(formData.date),
        interviewer: formData.interviewer,
        notes: formData.notes,
        objectives: formData.objectives.filter((obj) => obj.trim() !== ""),
        status: formData.status,
        documents: documentFile ? [`/files/interview_${Date.now()}.pdf`] : [],
      };

      if (editingItem && "type" in editingItem) {
        const setter =
          currentType === "annual"
            ? setAnnualInterviews
            : setProfessionalInterviews;
        const interviews =
          currentType === "annual" ? annualInterviews : professionalInterviews;
        setter(
          interviews.map((interview) =>
            interview.id === editingItem.originalId
              ? {
                  ...interview,
                  ...interviewData,
                  updatedAt: new Date(),
                }
              : interview,
          ),
        );
      } else {
        const newInterview: Interview = {
          id: Date.now().toString(),
          ...interviewData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const setter =
          currentType === "annual"
            ? setAnnualInterviews
            : setProfessionalInterviews;
        const interviews =
          currentType === "annual" ? annualInterviews : professionalInterviews;
        setter([...interviews, newInterview]);
      }
    }

    setIsCreateModalOpen(false);
  };

  const addObjective = () => {
    setFormData({
      ...formData,
      objectives: [...formData.objectives, ""],
    });
  };

  const removeObjective = (index: number) => {
    setFormData({
      ...formData,
      objectives: formData.objectives.filter((_, i) => i !== index),
    });
  };

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = value;
    setFormData({
      ...formData,
      objectives: newObjectives,
    });
  };

  const getItemTypeLabel = (item: CombinedItem) => {
    if (item.itemType === "objective") return "Objectif";
    if (item.interviewType === "annual") return "Entretien annuel";
    return "Entretien professionnel";
  };

  const getItemDate = (item: CombinedItem) => {
    if (item.itemType === "objective") return item.targetDate;
    return item.date;
  };

  const getItemStatusLabel = (item: CombinedItem) => {
    if (item.itemType === "objective")
      return objectiveStatusLabels[item.status];
    return statusLabels[item.status];
  };

  const getItemStatusColor = (item: CombinedItem) => {
    if (item.itemType === "objective")
      return objectiveStatusColors[item.status];
    return statusColors[item.status];
  };

  const combinedColumns: ColumnDef<CombinedItem>[] = [
    {
      key: "type",
      label: "Type",
      render: (item: CombinedItem) => (
        <Badge variant="outline">{getItemTypeLabel(item)}</Badge>
      ),
    },
    {
      key: "employeeId",
      label: "Employé",
      render: (item: CombinedItem) => {
        const employee = mockEmployees.find((e) => e.id === item.employeeId);
        return employee?.name || "N/A";
      },
    },
    {
      key: "title",
      label: "Titre / Date",
      render: (item: CombinedItem) => {
        if (item.itemType === "objective") return item.title;
        return getItemDate(item).toLocaleDateString("fr-FR");
      },
    },
    {
      key: "category",
      label: "Catégorie / Responsable",
      render: (item: CombinedItem) => {
        if (item.itemType === "objective") {
          const Icon = categoryIcons[item.category];
          return (
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{categoryLabels[item.category]}</span>
            </div>
          );
        }
        return item.interviewer;
      },
    },
    {
      key: "progress",
      label: "Progression / Objectifs",
      render: (item: CombinedItem) => {
        if (item.itemType === "objective") {
          return (
            <div className="flex items-center gap-2">
              <Progress value={item.progress} className="w-20" />
              <span className="text-sm">{item.progress}%</span>
            </div>
          );
        }
        return `${item.objectives.length} objectif(s)`;
      },
    },
    {
      key: "status",
      label: "Statut",
      render: (item: CombinedItem) => (
        <Badge variant={getItemStatusColor(item)}>
          {getItemStatusLabel(item)}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: CombinedItem) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(item)}>
              <Eye className="mr-2 h-4 w-4 text-orange-500" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(item)}>
              <Pencil className="mr-2 h-4 w-4 text-green-600" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                handleDelete(
                  item.originalId,
                  item.itemType,
                  item.itemType === "interview"
                    ? item.interviewType
                    : undefined,
                )
              }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entretiens & Objectifs</h1>
          <p className="text-muted-foreground">
            Gestion des entretiens annuels, professionnels et suivi des
            objectifs
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={currentType}
            onValueChange={(value: ItemType) => setCurrentType(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="annual">Entretien annuel</SelectItem>
              <SelectItem value="professional">
                Entretien professionnel
              </SelectItem>
              <SelectItem value="objectives">Objectif</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleCreate(currentType)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des entretiens et objectifs</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={combinedColumns} data={allItems} />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={
          currentType === "objectives"
            ? editingItem && editingItem.itemType === "objective"
              ? "Modifier l'objectif"
              : "Nouvel objectif"
            : editingItem && editingItem.itemType === "interview"
              ? "Modifier l'entretien"
              : "Nouvel entretien"
        }
        size="lg"
        actions={{
          primary: {
            label: editingItem ? "Modifier" : "Créer",
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
          <div>
            <Label htmlFor="type">Type *</Label>
            <Select
              value={currentType}
              onValueChange={(value: ItemType) => setCurrentType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Entretien annuel</SelectItem>
                <SelectItem value="professional">
                  Entretien professionnel
                </SelectItem>
                <SelectItem value="objectives">Objectif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="employeeId">Employé *</Label>
            <Combobox
              options={employeeOptions}
              value={formData.employeeId}
              onValueChange={(value) =>
                setFormData({ ...formData, employeeId: value })
              }
              placeholder="Sélectionner un employé"
              searchPlaceholder="Rechercher un employé..."
              emptyMessage="Aucun employé trouvé"
            />
          </div>

          {currentType === "objectives" ? (
            <>
              <div>
                <Label htmlFor="title">Titre de l&apos;objectif *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Titre de l'objectif"
                />
              </div>

              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(
                    value: "performance" | "development" | "career" | "skills",
                  ) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="development">Développement</SelectItem>
                    <SelectItem value="career">Carrière</SelectItem>
                    <SelectItem value="skills">Compétences</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Description détaillée de l'objectif"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="targetDate">Date cible *</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) =>
                    setFormData({ ...formData, targetDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="progress">Progression (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      progress: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="date">Date de l&apos;entretien *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="interviewer">
                  Responsable de l&apos;entretien *
                </Label>
                <Input
                  id="interviewer"
                  value={formData.interviewer}
                  onChange={(e) =>
                    setFormData({ ...formData, interviewer: e.target.value })
                  }
                  placeholder="Nom du responsable"
                />
              </div>

              <div>
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(
                    value: "scheduled" | "completed" | "cancelled",
                  ) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Planifié</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Objectifs pour l&apos;année suivante</Label>
                <div className="space-y-2">
                  {formData.objectives.map((objective, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={objective}
                        onChange={(e) => updateObjective(index, e.target.value)}
                        placeholder="Objectif"
                      />
                      {formData.objectives.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeObjective(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addObjective}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un objectif
                  </Button>
                </div>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="notes">Notes et commentaires</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Notes sur la performance, compétences, évolution..."
              rows={4}
            />
          </div>

          {currentType !== "objectives" && (
            <div>
              <Label htmlFor="document">Document (PDF)</Label>
              <Input
                id="document"
                type="file"
                accept=".pdf"
                onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title={
          viewingItem && viewingItem.itemType === "objective"
            ? "Détails de l'objectif"
            : "Détails de l'entretien"
        }
        size="lg"
      >
        {viewingItem && viewingItem.itemType === "interview" && (
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Badge variant="outline">
                {viewingItem.type === "annual"
                  ? "Entretien annuel"
                  : "Entretien professionnel"}
              </Badge>
            </div>

            <div>
              <Label>Employé</Label>
              <p className="text-sm">
                {mockEmployees.find((e) => e.id === viewingItem.employeeId)
                  ?.name || "N/A"}
              </p>
            </div>

            <div>
              <Label>Date de l&apos;entretien</Label>
              <p className="text-sm">
                {viewingItem.date.toLocaleDateString("fr-FR")}
              </p>
            </div>

            <div>
              <Label>Responsable</Label>
              <p className="text-sm">{viewingItem.interviewer}</p>
            </div>

            <div>
              <Label>Statut</Label>
              <Badge variant={statusColors[viewingItem.status]}>
                {statusLabels[viewingItem.status]}
              </Badge>
            </div>

            {viewingItem.objectives.length > 0 && (
              <div>
                <Label>Objectifs</Label>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {viewingItem.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}

            {viewingItem.notes && (
              <div>
                <Label>Notes</Label>
                <p className="text-sm whitespace-pre-wrap">
                  {viewingItem.notes}
                </p>
              </div>
            )}

            {viewingItem.documents && viewingItem.documents.length > 0 && (
              <div>
                <Label>Documents</Label>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <a
                    href={viewingItem.documents[0]}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Voir le document
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {viewingItem && viewingItem.itemType === "objective" && (
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Badge variant="outline">Objectif</Badge>
            </div>

            <div>
              <Label>Employé</Label>
              <p className="text-sm">
                {mockEmployees.find((e) => e.id === viewingItem.employeeId)
                  ?.name || "N/A"}
              </p>
            </div>

            <div>
              <Label>Titre</Label>
              <p className="text-sm font-medium">{viewingItem.title}</p>
            </div>

            <div>
              <Label>Catégorie</Label>
              <div className="flex items-center gap-2">
                {React.createElement(categoryIcons[viewingItem.category], {
                  className: "h-4 w-4",
                })}
                <span className="text-sm">
                  {categoryLabels[viewingItem.category]}
                </span>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <p className="text-sm">{viewingItem.description}</p>
            </div>

            <div>
              <Label>Date cible</Label>
              <p className="text-sm">
                {viewingItem.targetDate.toLocaleDateString("fr-FR")}
              </p>
            </div>

            <div>
              <Label>Progression</Label>
              <div className="flex items-center gap-2">
                <Progress value={viewingItem.progress} className="w-32" />
                <span className="text-sm">{viewingItem.progress}%</span>
              </div>
            </div>

            <div>
              <Label>Statut</Label>
              <Badge variant={objectiveStatusColors[viewingItem.status]}>
                {objectiveStatusLabels[viewingItem.status]}
              </Badge>
            </div>

            {viewingItem.notes && (
              <div>
                <Label>Notes</Label>
                <p className="text-sm whitespace-pre-wrap">
                  {viewingItem.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
