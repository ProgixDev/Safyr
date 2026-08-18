"use client";

import { useState } from "react";
import Link from "next/link";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  MoreVertical,
  FileText,
} from "lucide-react";
import { DisciplinaryProcedure, DisciplinaryStep } from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Combobox } from "@/components/ui/combobox";

// Mock data - replace with API call
const standardSteps: DisciplinaryStep[] = [
  {
    id: "1",
    title: "Mise en demeure",
    description:
      "Mise en demeure de justifier votre absence et de reprendre votre poste de travail",
    completed: false,
  },
  {
    id: "2",
    title: "Convocation à entretien préalable",
    description: "Convocation à un entretien préalable au licenciement",
    completed: false,
  },
  {
    id: "3",
    title: "Notification de licenciement",
    description: "Notification de la décision de licenciement",
    completed: false,
  },
];

const mockProcedures: DisciplinaryProcedure[] = [];

const statusLabels = {
  ongoing: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

const statusColors = {
  ongoing: "default",
  completed: "secondary",
  cancelled: "destructive",
} as const;

export function ProceduresSection() {
  const mockEmployees = useEmployeeOptions();
  const employeeOptions = mockEmployees.map((employee) => ({
    value: employee.id,
    label: employee.name,
  }));
  const [procedures, setProcedures] =
    useState<DisciplinaryProcedure[]>(mockProcedures);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] =
    useState<DisciplinaryProcedure | null>(null);
  const [viewingProcedure, setViewingProcedure] =
    useState<DisciplinaryProcedure | null>(null);
  const [formData, setFormData] = useState({
    employeeId: "",
    startDate: "",
    steps: [] as DisciplinaryStep[],
    status: "ongoing" as "ongoing" | "completed" | "cancelled",
  });
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const handleCreate = () => {
    setEditingProcedure(null);
    setFormData({
      employeeId: "",
      startDate: new Date().toISOString().split("T")[0],
      steps: standardSteps.map((step) => ({ ...step })),
      status: "ongoing",
    });
    setDocumentFile(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (procedure: DisciplinaryProcedure) => {
    setEditingProcedure(procedure);
    setFormData({
      employeeId: procedure.employeeId,
      startDate: procedure.startDate.toISOString().split("T")[0],
      steps: procedure.steps.map((step) => ({ ...step })),
      status: procedure.status,
    });
    setDocumentFile(null);
    setIsCreateModalOpen(true);
  };

  const handleView = (procedure: DisciplinaryProcedure) => {
    setViewingProcedure(procedure);
    setIsViewModalOpen(true);
  };

  const handleDelete = (procedureId: string) => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir supprimer cette procédure disciplinaire ?",
      )
    ) {
      setProcedures(procedures.filter((p) => p.id !== procedureId));
    }
  };

  const handleSave = () => {
    const procedureData = {
      employeeId: formData.employeeId,
      startDate: new Date(formData.startDate),
      steps: formData.steps,
      currentStep:
        formData.steps.findIndex((s) => !s.completed) + 1 ||
        formData.steps.length,
      status: formData.status,
      documents: documentFile ? [`/files/procedure_${Date.now()}.pdf`] : [],
    };

    if (editingProcedure) {
      setProcedures(
        procedures.map((p) =>
          p.id === editingProcedure.id
            ? { ...p, ...procedureData, updatedAt: new Date() }
            : p,
        ),
      );
    } else {
      const newProcedure: DisciplinaryProcedure = {
        id: Date.now().toString(),
        ...procedureData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setProcedures([...procedures, newProcedure]);
    }
    setIsCreateModalOpen(false);
  };

  const handleStatusChange = (
    procedureId: string,
    newStatus: DisciplinaryProcedure["status"],
  ) => {
    setProcedures(
      procedures.map((p) =>
        p.id === procedureId
          ? { ...p, status: newStatus, updatedAt: new Date() }
          : p,
      ),
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStepChange = (
    stepId: string,
    field: string,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId ? { ...step, [field]: value } : step,
      ),
    }));
  };

  const handleFileChange = (file: File | null) => {
    setDocumentFile(file);
  };

  const isFormValid = formData.employeeId && formData.startDate;

  const getEmployeeName = (employeeId: string) => {
    const employee = mockEmployees.find((e) => e.id === employeeId);
    return employee ? employee.name : "Employé inconnu";
  };

  const columns: ColumnDef<DisciplinaryProcedure>[] = [
    {
      key: "employeeId",
      label: "Employé",
      render: (procedure: DisciplinaryProcedure) => (
        <div>
          <div className="font-medium">
            <Link
              href={`/dashboard/hr/employees/${procedure.employeeId}`}
              className="text-primary hover:underline"
            >
              {getEmployeeName(procedure.employeeId)}
            </Link>
          </div>
        </div>
      ),
    },
    {
      key: "startDate",
      label: "Date de début",
      render: (procedure: DisciplinaryProcedure) =>
        procedure.startDate.toLocaleDateString("fr-FR"),
    },
    {
      key: "currentStep",
      label: "Étape actuelle",
      render: (procedure: DisciplinaryProcedure) => (
        <div>
          Étape {procedure.currentStep} sur {procedure.steps.length}
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (procedure: DisciplinaryProcedure) => (
        <Badge variant={statusColors[procedure.status]}>
          {statusLabels[procedure.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (procedure: DisciplinaryProcedure) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleView(procedure)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleEdit(procedure)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            {procedure.status === "ongoing" && (
              <>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(procedure.id, "completed")}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Marquer terminée
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(procedure.id, "cancelled")}
                  className="gap-2 text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                  Annuler
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(procedure.id)}
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
            Procédures disciplinaires
          </h1>
          <p className="text-muted-foreground">
            Gestion des procédures disciplinaires
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle procédure
        </Button>
      </div>

      {/* Procedures Table */}
      <Card>
        <CardHeader>
          <CardTitle>Procédures disciplinaires ({procedures.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={procedures}
            columns={columns}
            searchKeys={["employeeId"]}
            searchPlaceholder="Rechercher des procédures..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={
          editingProcedure
            ? "Modifier la procédure disciplinaire"
            : "Nouvelle procédure disciplinaire"
        }
        description="Ajoutez ou modifiez les informations de la procédure."
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: editingProcedure ? "Enregistrer" : "Créer",
            onClick: handleSave,
            disabled: !isFormValid,
          },
        }}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employé *</Label>
              <Combobox
                options={employeeOptions}
                value={formData.employeeId}
                onValueChange={(value) =>
                  handleInputChange("employeeId", value)
                }
                placeholder="Sélectionner un employé"
                searchPlaceholder="Rechercher un employé..."
                emptyMessage="Aucun employé trouvé."
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
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "ongoing" | "completed" | "cancelled") =>
                  handleInputChange("status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ongoing">En cours</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Steps Section */}
          <div className="space-y-4">
            <Label>Étapes de la procédure</Label>
            <div className="space-y-4">
              {formData.steps.map((step, index) => (
                <div key={step.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Étape {index + 1}: {step.title}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Terminée</Label>
                    <Select
                      value={step.completed ? "true" : "false"}
                      onValueChange={(value) =>
                        handleStepChange(step.id, "completed", value === "true")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Non</SelectItem>
                        <SelectItem value="true">Oui</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">Document</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="document"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                className="flex-1"
              />
              {documentFile && (
                <span className="text-sm text-muted-foreground">
                  {documentFile.name}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formats acceptés: PDF, DOC, DOCX (max 10MB)
            </p>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de la procédure disciplinaire"
        description={
          viewingProcedure
            ? `${getEmployeeName(viewingProcedure.employeeId)} - Étape ${viewingProcedure.currentStep} sur ${viewingProcedure.steps.length}`
            : ""
        }
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {viewingProcedure && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employé</Label>
                <p className="text-sm font-medium">
                  {getEmployeeName(viewingProcedure.employeeId)}
                </p>
              </div>
              <div>
                <Label>Date de début</Label>
                <p className="text-sm font-medium">
                  {viewingProcedure.startDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label>Étape actuelle</Label>
                <p className="text-sm font-medium">
                  {viewingProcedure.currentStep} sur{" "}
                  {viewingProcedure.steps.length}
                </p>
              </div>
              <div>
                <Label>Statut</Label>
                <Badge variant={statusColors[viewingProcedure.status]}>
                  {statusLabels[viewingProcedure.status]}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Étapes</Label>
              <div className="space-y-2">
                {viewingProcedure.steps.map((step, index) => (
                  <div key={step.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">
                        Étape {index + 1}: {step.title}
                      </h4>
                      <Badge variant={step.completed ? "default" : "secondary"}>
                        {step.completed ? "Terminée" : "En cours"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {step.description}
                    </p>
                    {step.completed && step.completedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Terminée le{" "}
                        {step.completedAt.toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {viewingProcedure.documents.length > 0 && (
              <div>
                <Label>Documents</Label>
                <div className="space-y-2">
                  {viewingProcedure.documents.map((doc, index) => (
                    <Button key={index} variant="outline" size="sm" asChild>
                      <a href={doc} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Document {index + 1}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
