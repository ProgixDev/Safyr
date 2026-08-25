"use client";

import React, { useMemo, useState } from "react";
import { useEmployeeOptions } from "@/hooks/employees";
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
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
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
import { useRegistre } from "@/hooks/fiscal/use-registre";

/**
 * Lignes telles qu'elles sont enregistrees en base : les dates y sont des
 * chaines ISO, converties en Date a l'affichage.
 */
interface LigneEntretien {
  id: string;
  employeeId: string;
  type: "annual" | "professional";
  date: string;
  interviewer: string;
  notes: string;
  objectives: string[];
  status: "scheduled" | "completed" | "cancelled";
}

interface LigneObjectif {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  category: "performance" | "development" | "career" | "skills";
  targetDate: string;
  progress: number;
  status: "active" | "completed" | "cancelled";
  notes: string;
}

const CHAMPS_FICHIERS = ["document"] as const;
const EPOQUE = new Date(0);

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
  const mockEmployees = useEmployeeOptions();
  const employeeOptions = mockEmployees.map((employee) => ({
    value: employee.id,
    label: employee.name,
  }));
  // Entretiens, objectifs et pieces jointes sont enregistres en base :
  // ils restaient auparavant dans l'etat React et disparaissaient au F5.
  const registreAnnuel = useRegistre<LigneEntretien>(
    "entretien_annuel",
    CHAMPS_FICHIERS,
  );
  const registreProfessionnel = useRegistre<LigneEntretien>(
    "entretien_professionnel",
    CHAMPS_FICHIERS,
  );
  const registreObjectifs = useRegistre<LigneObjectif>(
    "objectif",
    CHAMPS_FICHIERS,
  );

  const versEntretien = (
    ligne: LigneEntretien,
    type: "annual" | "professional",
  ): Interview => ({
    id: ligne.id,
    employeeId: ligne.employeeId ?? "",
    type,
    date: ligne.date ? new Date(ligne.date) : EPOQUE,
    interviewer: ligne.interviewer ?? "",
    notes: ligne.notes ?? "",
    objectives: ligne.objectives ?? [],
    status: ligne.status ?? "scheduled",
    documents: [],
    createdAt: EPOQUE,
    updatedAt: EPOQUE,
  });

  const annualInterviews = useMemo(
    () => registreAnnuel.lignes.map((l) => versEntretien(l, "annual")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registreAnnuel.lignes],
  );
  const professionalInterviews = useMemo(
    () =>
      registreProfessionnel.lignes.map((l) => versEntretien(l, "professional")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registreProfessionnel.lignes],
  );
  const objectives = useMemo<Objective[]>(
    () =>
      registreObjectifs.lignes.map((ligne) => ({
        id: ligne.id,
        employeeId: ligne.employeeId ?? "",
        title: ligne.title ?? "",
        description: ligne.description ?? "",
        category: ligne.category ?? "performance",
        targetDate: ligne.targetDate ? new Date(ligne.targetDate) : EPOQUE,
        progress: ligne.progress ?? 0,
        status: ligne.status ?? "active",
        notes: ligne.notes ?? "",
        createdAt: EPOQUE,
        updatedAt: EPOQUE,
      })),
    [registreObjectifs.lignes],
  );
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
    if (!confirm(confirmMessage)) return;
    const registre =
      itemType === "objective"
        ? registreObjectifs
        : interviewType === "annual"
          ? registreAnnuel
          : registreProfessionnel;
    void registre.supprimerLigne(id);
  };

  const handleSave = async () => {
    const nomEmploye =
      mockEmployees.find((e) => e.id === formData.employeeId)?.name ??
      "Salarié";

    if (currentType === "objectives") {
      const ligne: LigneObjectif = {
        id: editingItem?.originalId ?? "",
        employeeId: formData.employeeId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        targetDate: formData.targetDate,
        progress: formData.progress,
        status: "active",
        notes: formData.notes,
      };
      const id = await registreObjectifs.enregistrer(ligne, {
        period: (formData.targetDate || new Date().toISOString()).slice(0, 7),
        label: formData.title || `Objectif — ${nomEmploye}`,
        status: "active",
      });
      if (documentFile) {
        await registreObjectifs.attacherFichier(id, "document", documentFile);
      }
    } else {
      const registre =
        currentType === "annual" ? registreAnnuel : registreProfessionnel;
      const ligne: LigneEntretien = {
        id: editingItem?.originalId ?? "",
        employeeId: formData.employeeId,
        type: currentType,
        date: formData.date,
        interviewer: formData.interviewer,
        notes: formData.notes,
        objectives: formData.objectives.filter((obj) => obj.trim() !== ""),
        status: formData.status,
      };
      const id = await registre.enregistrer(ligne, {
        period: (formData.date || new Date().toISOString()).slice(0, 7),
        label:
          currentType === "annual"
            ? `Entretien annuel — ${nomEmploye}`
            : `Entretien professionnel — ${nomEmploye}`,
        status: formData.status,
      });
      if (documentFile) {
        await registre.attacherFichier(id, "document", documentFile);
      }
    }

    setDocumentFile(null);
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
        <RowActionsMenu
          onView={() => handleView(item)}
          onEdit={() => handleEdit(item)}
          onDelete={() =>
            handleDelete(
              item.originalId,
              item.itemType,
              item.itemType === "interview" ? item.interviewType : undefined,
            )
          }
        />
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
          <DataTable
            onRowClick={handleView}
            columns={combinedColumns}
            data={allItems}
          />
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
            onClick: () => void handleSave(),
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
