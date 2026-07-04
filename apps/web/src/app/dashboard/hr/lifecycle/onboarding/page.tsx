"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  HardHat,
  MoreHorizontal,
  MoreVertical,
  Download,
  FileCheck,
  Users,
  Building2,
  Calendar,
  AlertCircle,
  FileArchive,
  FolderOpen,
  UserCheck,
  FileSignature,
  Briefcase,
  Shield,
  Award,
  Mail,
  Phone,
  MapPin,
  IdCard,
  CreditCard,
} from "lucide-react";
import { OnboardingPath, OnboardingTask } from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";

// Types pour les documents du dossier salarié
interface EmployeeDocument {
  id: string;
  name: string;
  type: "identity" | "cv" | "diploma" | "contract" | "certificate" | "other";
  category: "documents" | "training" | "equipment" | "other";
  status: "pending" | "validated" | "rejected";
  uploadedAt?: Date;
  validatedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  fileName?: string;
}

interface EmployeeInfo {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: Date;
  documents: EmployeeDocument[];
}

// Mock data - Documents du dossier salarié
const mockEmployeeDocuments: Record<string, EmployeeDocument[]> = {
  "1": [
    {
      id: "doc1",
      name: "Carte d'identité recto-verso",
      type: "identity",
      category: "documents",
      status: "validated",
      uploadedAt: new Date("2024-01-15"),
      validatedAt: new Date("2024-01-16"),
      fileName: "cni_dupont_marie.pdf",
      fileSize: 2048576,
    },
    {
      id: "doc2",
      name: "CV - Marie Dupont",
      type: "cv",
      category: "documents",
      status: "validated",
      uploadedAt: new Date("2024-01-14"),
      validatedAt: new Date("2024-01-15"),
      fileName: "cv_marie_dupont.pdf",
      fileSize: 1048576,
    },
    {
      id: "doc3",
      name: "Diplôme SSIAP 1",
      type: "diploma",
      category: "training",
      status: "pending",
      uploadedAt: new Date("2024-01-17"),
      fileName: "ssiap1_dupont.pdf",
      fileSize: 1572864,
    },
    {
      id: "doc4",
      name: "Certificat SST",
      type: "certificate",
      category: "training",
      status: "pending",
      fileName: "sst_dupont.pdf",
      fileSize: 1048576,
    },
    {
      id: "doc5",
      name: "Contrat de travail",
      type: "contract",
      category: "documents",
      status: "validated",
      uploadedAt: new Date("2024-01-13"),
      validatedAt: new Date("2024-01-14"),
      fileName: "contrat_dupont_2024.pdf",
      fileSize: 3145728,
    },
  ],
  "2": [
    {
      id: "doc6",
      name: "Carte d'identité Jean Martin",
      type: "identity",
      category: "documents",
      status: "validated",
      uploadedAt: new Date("2024-01-10"),
      validatedAt: new Date("2024-01-11"),
      fileName: "cni_martin_jean.pdf",
      fileSize: 1848576,
    },
    {
      id: "doc7",
      name: "CV - Jean Martin",
      type: "cv",
      category: "documents",
      status: "validated",
      uploadedAt: new Date("2024-01-09"),
      validatedAt: new Date("2024-01-10"),
      fileName: "cv_jean_martin.pdf",
      fileSize: 1048576,
    },
    {
      id: "doc8",
      name: "Diplôme SSIAP 2",
      type: "diploma",
      category: "training",
      status: "validated",
      uploadedAt: new Date("2024-01-11"),
      validatedAt: new Date("2024-01-12"),
      fileName: "ssiap2_martin.pdf",
      fileSize: 2048576,
    },
    {
      id: "doc9",
      name: "Certificat Médical",
      type: "certificate",
      category: "documents",
      status: "validated",
      uploadedAt: new Date("2024-01-10"),
      validatedAt: new Date("2024-01-11"),
      fileName: "certificat_medical_martin.pdf",
      fileSize: 524288,
    },
    {
      id: "doc10",
      name: "Contrat de travail",
      type: "contract",
      category: "documents",
      status: "validated",
      uploadedAt: new Date("2024-01-09"),
      validatedAt: new Date("2024-01-10"),
      fileName: "contrat_martin_2024.pdf",
      fileSize: 3145728,
    },
  ],
};

// Infos employés mockées
const mockEmployeeInfo: Record<string, EmployeeInfo> = {
  "1": {
    id: "1",
    employeeNumber: "EMP001",
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie.dupont@entreprise.fr",
    phone: "06 12 34 56 78",
    position: "Agent de sécurité",
    department: "Sécurité",
    hireDate: new Date("2024-01-15"),
    documents: mockEmployeeDocuments["1"],
  },
  "2": {
    id: "2",
    employeeNumber: "EMP002",
    firstName: "Jean",
    lastName: "Martin",
    email: "jean.martin@entreprise.fr",
    phone: "06 98 76 54 32",
    position: "Chef d'équipe sécurité",
    department: "Sécurité",
    hireDate: new Date("2024-01-10"),
    documents: mockEmployeeDocuments["2"],
  },
};

// Mock data - replace with API call
const mockOnboardingPaths: OnboardingPath[] = [
  {
    id: "1",
    employeeId: "1",
    employeeName: "Marie Dupont",
    tasks: [
      {
        id: "1",
        employeeId: "1",
        task: "Télécharger la carte d'identité",
        category: "documents",
        status: "completed",
        completedAt: new Date("2024-01-16"),
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-16"),
      },
      {
        id: "2",
        employeeId: "1",
        task: "Formation SSIAP 1",
        category: "training",
        status: "pending",
        dueDate: new Date("2024-02-01"),
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
      {
        id: "3",
        employeeId: "1",
        task: "Réception du matériel de sécurité",
        category: "equipment",
        status: "pending",
        dueDate: new Date("2024-01-20"),
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      },
    ],
    startDate: new Date("2024-01-15"),
    status: "in-progress",
    progress: 33,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-16"),
  },
  {
    id: "2",
    employeeId: "2",
    employeeName: "Jean Martin",
    tasks: [
      {
        id: "4",
        employeeId: "2",
        task: "Télécharger le CV",
        category: "documents",
        status: "completed",
        completedAt: new Date("2024-01-11"),
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-11"),
      },
      {
        id: "5",
        employeeId: "2",
        task: "Formation SST",
        category: "training",
        status: "completed",
        completedAt: new Date("2024-01-13"),
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-13"),
      },
      {
        id: "6",
        employeeId: "2",
        task: "Réception de la radio",
        category: "equipment",
        status: "completed",
        completedAt: new Date("2024-01-12"),
        createdAt: new Date("2024-01-10"),
        updatedAt: new Date("2024-01-12"),
      },
    ],
    startDate: new Date("2024-01-10"),
    completionDate: new Date("2024-01-13"),
    status: "completed",
    progress: 100,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-13"),
  },
];

const statusLabels = {
  "in-progress": "En cours",
  completed: "Terminé",
};

const statusColors = {
  "in-progress": "outline",
  completed: "default",
} as const;

const categoryIcons = {
  documents: FileText,
  training: GraduationCap,
  equipment: HardHat,
  other: MoreHorizontal,
};

const categoryLabels = {
  documents: "Documents",
  training: "Formation",
  equipment: "Équipement",
  other: "Autre",
};

const documentTypeLabels = {
  identity: "Pièce d'identité",
  cv: "CV",
  diploma: "Diplôme",
  contract: "Contrat de travail",
  certificate: "Certificat",
  other: "Autre",
};

const documentTypeIcons = {
  identity: IdCard,
  cv: FileText,
  diploma: GraduationCap,
  contract: FileSignature,
  certificate: Award,
  other: FileArchive,
};

export default function OnboardingPage() {
  const [onboardingPaths, setOnboardingPaths] =
    useState<OnboardingPath[]>(mockOnboardingPaths);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<OnboardingPath | null>(null);
  const [viewingPath, setViewingPath] = useState<OnboardingPath | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: "",
    startDate: "",
    tasks: [] as {
      task: string;
      category: "documents" | "training" | "equipment" | "other";
      dueDate: string;
    }[],
  });

  // Charger les documents du salarié
  const loadEmployeeDocuments = (employeeId: string) => {
    const info = mockEmployeeInfo[employeeId];
    if (info) {
      setEmployeeInfo(info);
      setSelectedEmployeeId(employeeId);
    }
    setIsDocumentsModalOpen(true);
  };

  // Télécharger un document
  const downloadDocument = (document: EmployeeDocument) => {
    const fileName = document.fileName || `${document.name}.pdf`;
    const content = `Document: ${document.name}\nType: ${documentTypeLabels[document.type]}\nStatut: ${document.status === 'validated' ? 'Validé' : 'En attente'}\nTaille: ${document.fileSize ? Math.round(document.fileSize / 1024) : '?'} KB\nDate: ${document.uploadedAt ? document.uploadedAt.toLocaleDateString('fr-FR') : 'Non téléchargé'}`;
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Télécharger tous les documents du salarié
  const downloadAllDocuments = async (employeeId: string) => {
    setDownloadingAll(true);
    try {
      const info = mockEmployeeInfo[employeeId];
      if (!info) return;

      // Télécharger chaque document
      info.documents.forEach((doc, index) => {
        setTimeout(() => {
          downloadDocument(doc);
        }, index * 500); // Échelonnement pour éviter les blocages
      });

      // Créer un fichier récapitulatif
      const summary = `Récapitulatif des documents de ${info.firstName} ${info.lastName}\n${'='.repeat(50)}\n\n` +
        `Employé: ${info.firstName} ${info.lastName}\n` +
        `Matricule: ${info.employeeNumber}\n` +
        `Poste: ${info.position}\n` +
        `Département: ${info.department}\n` +
        `Date d'embauche: ${info.hireDate.toLocaleDateString('fr-FR')}\n` +
        `Email: ${info.email}\n` +
        `Téléphone: ${info.phone}\n\n` +
        `Documents (${info.documents.length}):\n${'='.repeat(30)}\n\n` +
        info.documents.map((doc, idx) => 
          `${idx + 1}. ${doc.name}\n` +
          `   Type: ${documentTypeLabels[doc.type]}\n` +
          `   Statut: ${doc.status === 'validated' ? '✅ Validé' : '⏳ En attente'}\n` +
          `   Taille: ${doc.fileSize ? Math.round(doc.fileSize / 1024) : '?'} KB\n` +
          `   Téléchargé le: ${doc.uploadedAt ? doc.uploadedAt.toLocaleDateString('fr-FR') : 'Non téléchargé'}\n`
        ).join('\n');

      const summaryBlob = new Blob([summary], { type: "text/plain" });
      const summaryUrl = URL.createObjectURL(summaryBlob);
      const summaryA = document.createElement("a");
      summaryA.href = summaryUrl;
      summaryA.download = `documents_${info.firstName}_${info.lastName}_resume.txt`;
      summaryA.click();
      URL.revokeObjectURL(summaryUrl);

    } catch (error) {
      console.error("Erreur lors du téléchargement des documents:", error);
    } finally {
      setDownloadingAll(false);
    }
  };

  // Récupérer les documents du dossier salarié pour le parcours
  const getDocumentsForPath = (path: OnboardingPath) => {
    const info = mockEmployeeInfo[path.employeeId];
    if (!info) return [];
    return info.documents;
  };

  // Mettre à jour le statut d'un document
  const updateDocumentStatus = (documentId: string, status: "validated" | "rejected") => {
    if (!employeeInfo) return;
    
    const updatedDocs = employeeInfo.documents.map(doc =>
      doc.id === documentId
        ? { ...doc, status, validatedAt: status === "validated" ? new Date() : undefined }
        : doc
    );
    
    setEmployeeInfo({ ...employeeInfo, documents: updatedDocs });
    
    // Mettre à jour aussi dans les données mockées
    if (selectedEmployeeId) {
      mockEmployeeInfo[selectedEmployeeId] = {
        ...mockEmployeeInfo[selectedEmployeeId],
        documents: updatedDocs,
      };
    }
  };

  const handleCreate = () => {
    setEditingPath(null);
    setFormData({
      employeeName: "",
      startDate: "",
      tasks: [
        {
          task: "Télécharger la carte d'identité",
          category: "documents",
          dueDate: "",
        },
        { task: "Formation SSIAP 1", category: "training", dueDate: "" },
        {
          task: "Réception du matériel de sécurité",
          category: "equipment",
          dueDate: "",
        },
      ],
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (path: OnboardingPath) => {
    setEditingPath(path);
    setFormData({
      employeeName: path.employeeName,
      startDate: path.startDate.toISOString().split("T")[0],
      tasks: path.tasks.map((task) => ({
        task: task.task,
        category: task.category,
        dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : "",
      })),
    });
    setIsCreateModalOpen(true);
  };

  const handleView = (path: OnboardingPath) => {
    setViewingPath(path);
    setIsViewModalOpen(true);
  };

  const handleDelete = (pathId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce parcours ?")) {
      setOnboardingPaths(onboardingPaths.filter((path) => path.id !== pathId));
    }
  };

  const handleSave = () => {
    const pathData = {
      employeeName: formData.employeeName,
      startDate: new Date(formData.startDate),
      tasks: formData.tasks.map((task, index) => ({
        id: editingPath
          ? editingPath.tasks[index]?.id || Date.now().toString() + index
          : Date.now().toString() + index,
        employeeId: editingPath?.employeeId || Date.now().toString(),
        task: task.task,
        category: task.category,
        status: "pending" as "pending" | "completed",
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: editingPath
          ? editingPath.tasks[index]?.createdAt || new Date()
          : new Date(),
        updatedAt: new Date(),
      })),
    };

    const totalTasks = pathData.tasks.length;
    const completedTasks = pathData.tasks.filter(
      (t) => t.status === "completed",
    ).length;
    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const status = progress === 100 ? "completed" : "in-progress";

    if (editingPath) {
      setOnboardingPaths(
        onboardingPaths.map((path) =>
          path.id === editingPath.id
            ? {
                ...path,
                ...pathData,
                progress,
                status,
                completionDate: status === "completed" ? new Date() : undefined,
                updatedAt: new Date(),
              }
            : path,
        ),
      );
    } else {
      const newPath: OnboardingPath = {
        id: Date.now().toString(),
        employeeId: Date.now().toString(),
        ...pathData,
        progress,
        status,
        completionDate: status === "completed" ? new Date() : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setOnboardingPaths([...onboardingPaths, newPath]);
    }
    setIsCreateModalOpen(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTaskChange = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task, i) =>
        i === index ? { ...task, [field]: value } : task,
      ),
    }));
  };

  const addTask = () => {
    setFormData((prev) => ({
      ...prev,
      tasks: [...prev.tasks, { task: "", category: "other", dueDate: "" }],
    }));
  };

  const removeTask = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  const handleTaskToggle = (
    pathId: string,
    taskId: string,
    completed: boolean,
  ) => {
    setOnboardingPaths(
      onboardingPaths.map((path) =>
        path.id === pathId
          ? (() => {
              const updatedTasks = path.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      status: (completed ? "completed" : "pending") as
                        | "completed"
                        | "pending",
                      completedAt: completed ? new Date() : undefined,
                      updatedAt: new Date(),
                    }
                  : task,
              );
              const completedCount = updatedTasks.filter(
                (t) => t.status === "completed",
              ).length;
              const progress = Math.round(
                (completedCount / updatedTasks.length) * 100,
              );
              const status =
                completedCount === updatedTasks.length
                  ? "completed"
                  : "in-progress";
              return {
                ...path,
                tasks: updatedTasks as OnboardingTask[],
                progress,
                status,
                completionDate: status === "completed" ? new Date() : undefined,
                updatedAt: new Date(),
              };
            })()
          : path,
      ),
    );
  };

  const isFormValid =
    formData.employeeName && formData.startDate && formData.tasks.length > 0;

  const columns: ColumnDef<OnboardingPath>[] = [
    {
      key: "employeeName",
      label: "Employé",
      render: (path: OnboardingPath) => (
        <div>
          <Link
            href={`/dashboard/hr/collaborators/${path.employeeId}`}
            className="font-medium hover:underline"
          >
            {path.employeeName}
          </Link>
          <div className="text-sm text-muted-foreground">
            Début: {path.startDate.toLocaleDateString("fr-FR")}
          </div>
        </div>
      ),
    },
    {
      key: "progress",
      label: "Progression",
      render: (path: OnboardingPath) => (
        <div className="space-y-1">
          <Progress value={path.progress} className="w-24" />
          <div className="text-xs text-muted-foreground">{path.progress}%</div>
        </div>
      ),
    },
    {
      key: "tasks",
      label: "Tâches",
      render: (path: OnboardingPath) => (
        <div className="text-sm">
          {path.tasks.filter((t) => t.status === "completed").length} /{" "}
          {path.tasks.length} terminées
        </div>
      ),
    },
    {
      key: "documents",
      label: "Documents",
      render: (path: OnboardingPath) => {
        const docs = getDocumentsForPath(path);
        const validated = docs.filter(d => d.status === "validated").length;
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {validated}/{docs.length} validés
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadEmployeeDocuments(path.employeeId)}
              className="h-6 w-6 p-0"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Statut",
      render: (path: OnboardingPath) => (
        <Badge variant={statusColors[path.status]}>
          {statusLabels[path.status]}
        </Badge>
      ),
    },
    {
      key: "completionDate",
      label: "Date de fin",
      render: (path: OnboardingPath) =>
        path.completionDate
          ? path.completionDate.toLocaleDateString("fr-FR")
          : "-",
    },
    {
      key: "actions",
      label: "Actions",
      render: (path: OnboardingPath) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleView(path)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => loadEmployeeDocuments(path.employeeId)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Voir documents
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleEdit(path)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(path.id)}
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
            Parcours d&apos;intégration
          </h1>
          <p className="text-muted-foreground">
            Suivi des intégrations et tâches des nouveaux employés
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau parcours
        </Button>
      </div>

      {/* Onboarding Paths Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Parcours d&apos;intégration ({onboardingPaths.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={onboardingPaths}
            columns={columns}
            searchKeys={["employeeName"]}
            searchPlaceholder="Rechercher des parcours..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={
          editingPath
            ? "Modifier le parcours"
            : "Nouveau parcours d'intégration"
        }
        description="Ajoutez ou modifiez les informations du parcours."
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: editingPath ? "Enregistrer" : "Créer",
            onClick: handleSave,
            disabled: !isFormValid,
          },
        }}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeName">Nom de l&apos;employé *</Label>
              <Input
                id="employeeName"
                value={formData.employeeName}
                onChange={(e) =>
                  handleInputChange("employeeName", e.target.value)
                }
                placeholder="Ex: Marie Dupont"
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
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Tâches ({formData.tasks.length})</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTask}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une tâche
              </Button>
            </div>
            <div className="space-y-3">
              {formData.tasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Tâche</Label>
                      <Input
                        value={task.task}
                        onChange={(e) =>
                          handleTaskChange(index, "task", e.target.value)
                        }
                        placeholder="Description de la tâche"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select
                        value={task.category}
                        onValueChange={(value) =>
                          handleTaskChange(index, "category", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="documents">Documents</SelectItem>
                          <SelectItem value="training">Formation</SelectItem>
                          <SelectItem value="equipment">Équipement</SelectItem>
                          <SelectItem value="other">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Échéance</Label>
                      <Input
                        type="date"
                        value={task.dueDate}
                        onChange={(e) =>
                          handleTaskChange(index, "dueDate", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTask(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails du parcours d'intégration"
        description={
          viewingPath
            ? `${viewingPath.employeeName} - ${statusLabels[viewingPath.status]}`
            : ""
        }
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {viewingPath && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employé</Label>
                <p className="text-sm font-medium">
                  {viewingPath.employeeName}
                </p>
              </div>
              <div>
                <Label>Statut</Label>
                <Badge variant={statusColors[viewingPath.status]}>
                  {statusLabels[viewingPath.status]}
                </Badge>
              </div>
              <div>
                <Label>Date de début</Label>
                <p className="text-sm font-medium">
                  {viewingPath.startDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
              {viewingPath.completionDate && (
                <div>
                  <Label>Date de fin</Label>
                  <p className="text-sm font-medium">
                    {viewingPath.completionDate.toLocaleDateString("fr-FR")}
                  </p>
                </div>
              )}
              <div className="col-span-2">
                <Label>Progression</Label>
                <div className="space-y-2">
                  <Progress value={viewingPath.progress} />
                  <div className="text-sm text-muted-foreground">
                    {viewingPath.progress}% terminé
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Tâches ({viewingPath.tasks.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const docs = getDocumentsForPath(viewingPath);
                    if (docs.length > 0) {
                      downloadAllDocuments(viewingPath.employeeId);
                    }
                  }}
                  disabled={downloadingAll}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {downloadingAll ? "Téléchargement..." : "Tout télécharger"}
                </Button>
              </div>
              <div className="space-y-3 mt-2">
                {viewingPath.tasks.map((task) => {
                  const Icon = categoryIcons[task.category];
                  return (
                    <div
                      key={task.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg"
                    >
                      <Checkbox
                        checked={task.status === "completed"}
                        onCheckedChange={(checked) =>
                          handleTaskToggle(
                            viewingPath.id,
                            task.id,
                            checked as boolean,
                          )
                        }
                        disabled={task.status === "completed"}
                      />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {task.task}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {categoryLabels[task.category]}
                          </Badge>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              Échéance:{" "}
                              {task.dueDate.toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        )}
                        {task.completedAt && (
                          <div className="flex items-center space-x-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            <span>
                              Terminée le{" "}
                              {task.completedAt.toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        )}
                      </div>
                      {task.category === "documents" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const docs = getDocumentsForPath(viewingPath);
                            const doc = docs.find(d => d.category === "documents");
                            if (doc) downloadDocument(doc);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Documents Modal */}
      <Modal
        open={isDocumentsModalOpen}
        onOpenChange={setIsDocumentsModalOpen}
        type="details"
        title={`Documents du dossier salarié`}
        description={employeeInfo ? `${employeeInfo.firstName} ${employeeInfo.lastName}` : ""}
        size="xl"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setIsDocumentsModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: "Tout télécharger",
            onClick: () => {
              if (selectedEmployeeId) {
                downloadAllDocuments(selectedEmployeeId);
              }
            },
            disabled: downloadingAll || !employeeInfo || employeeInfo.documents.length === 0,
          },
        }}
      >
        {employeeInfo && (
          <div className="space-y-6">
            {/* Infos employé */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Matricule</Label>
                <p className="font-medium">{employeeInfo.employeeNumber}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Poste</Label>
                <p className="font-medium">{employeeInfo.position}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Département</Label>
                <p className="font-medium">{employeeInfo.department}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-medium text-sm">{employeeInfo.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Téléphone</Label>
                <p className="font-medium">{employeeInfo.phone}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date d'embauche</Label>
                <p className="font-medium">{employeeInfo.hireDate.toLocaleDateString("fr-FR")}</p>
              </div>
            </div>

            {/* Liste des documents */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">
                  Documents ({employeeInfo.documents.length})
                </h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    <FileCheck className="h-3 w-3 mr-1 text-green-500" />
                    {employeeInfo.documents.filter(d => d.status === "validated").length} validés
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1 text-orange-500" />
                    {employeeInfo.documents.filter(d => d.status === "pending").length} en attente
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                {employeeInfo.documents.map((doc) => {
                  const Icon = documentTypeIcons[doc.type] || FileText;
                  return (
                    <div
                      key={doc.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                        doc.status === "validated"
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                          : doc.status === "rejected"
                            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                            : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{doc.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {documentTypeLabels[doc.type]}
                          </Badge>
                          {doc.status === "validated" && (
                            <Badge variant="default" className="text-xs bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Validé
                            </Badge>
                          )}
                          {doc.status === "pending" && (
                            <Badge variant="outline" className="text-xs text-orange-500 border-orange-500">
                              <Clock className="h-3 w-3 mr-1" />
                              En attente
                            </Badge>
                          )}
                          {doc.status === "rejected" && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Rejeté
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {doc.fileSize && (
                            <span>{Math.round(doc.fileSize / 1024)} KB</span>
                          )}
                          {doc.uploadedAt && (
                            <span>
                              Téléchargé le: {doc.uploadedAt.toLocaleDateString("fr-FR")}
                            </span>
                          )}
                          {doc.validatedAt && (
                            <span className="text-green-600">
                              Validé le: {doc.validatedAt.toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {doc.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-green-500 hover:text-green-600"
                              onClick={() => updateDocumentStatus(doc.id, "validated")}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-red-500 hover:text-red-600"
                              onClick={() => updateDocumentStatus(doc.id, "rejected")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDocument(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}