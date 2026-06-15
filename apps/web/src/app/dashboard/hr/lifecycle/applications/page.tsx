"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  MoreVertical,
} from "lucide-react";
import { JobApplication } from "@/lib/types";
import { EMPLOYEE_POSTE_OPTIONS } from "@/lib/hr-options";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";

// Mock data - replace with API call
const mockApplications: JobApplication[] = [
  {
    id: "1",
    applicantName: "Marie Dupont",
    email: "marie.dupont@email.com",
    phone: "+33123456789",
    position: "Agent de sécurité",
    cv: "/files/cv_marie.pdf",
    coverLetter: "/files/lettre_marie.pdf",
    status: "pending",
    appliedAt: new Date("2024-01-15"),
    notes: "Expérience de 3 ans en sécurité",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    applicantName: "Jean Martin",
    email: "jean.martin@email.com",
    phone: "+33123456790",
    position: "Chef d'équipe",
    cv: "/files/cv_jean.pdf",
    status: "reviewed",
    appliedAt: new Date("2024-01-10"),
    reviewedAt: new Date("2024-01-12"),
    reviewedBy: "Alice Dubois",
    notes: "Très bon profil technique",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-12"),
  },
  {
    id: "3",
    employeeId: "3",
    applicantName: "Sophie Leroy",
    email: "sophie.leroy@email.com",
    phone: "+33123456791",
    position: "Agent de sécurité",
    cv: "/files/cv_sophie.pdf",
    coverLetter: "/files/lettre_sophie.pdf",
    status: "accepted",
    appliedAt: new Date("2024-01-08"),
    reviewedAt: new Date("2024-01-10"),
    reviewedBy: "Alice Dubois",
    notes: "Acceptée - début le 15/01",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-10"),
  },
];

const statusLabels = {
  pending: "En attente",
  reviewed: "Examinée",
  interviewed: "Entretien",
  accepted: "Acceptée",
  rejected: "Rejetée",
};

const statusColors = {
  pending: "secondary",
  reviewed: "outline",
  interviewed: "default",
  accepted: "default",
  rejected: "destructive",
} as const;

const commonPositions = EMPLOYEE_POSTE_OPTIONS;

export default function ApplicationsPage() {
  const [applications, setApplications] =
    useState<JobApplication[]>(mockApplications);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] =
    useState<JobApplication | null>(null);
  const [viewingApplication, setViewingApplication] =
    useState<JobApplication | null>(null);
  const [formData, setFormData] = useState({
    applicantName: "",
    email: "",
    phone: "",
    position: "",
    customPosition: "",
    notes: "",
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);

  const handleCreate = () => {
    setEditingApplication(null);
    setFormData({
      applicantName: "",
      email: "",
      phone: "",
      position: "",
      customPosition: "",
      notes: "",
    });
    setCvFile(null);
    setCoverLetterFile(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (application: JobApplication) => {
    setEditingApplication(application);
    setFormData({
      applicantName: application.applicantName,
      email: application.email,
      phone: application.phone,
      position: application.position,
      customPosition: "",
      notes: application.notes || "",
    });
    setCvFile(null);
    setCoverLetterFile(null);
    setIsCreateModalOpen(true);
  };

  const handleView = (application: JobApplication) => {
    setViewingApplication(application);
    setIsViewModalOpen(true);
  };

  const handleDelete = (applicationId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette candidature ?")) {
      setApplications(applications.filter((app) => app.id !== applicationId));
    }
  };

  const handleSave = () => {
    const applicationData = {
      applicantName: formData.applicantName,
      email: formData.email,
      phone: formData.phone,
      position:
        formData.position === "Autre"
          ? formData.customPosition
          : formData.position,
      cv: cvFile ? `/files/cv_${Date.now()}.pdf` : undefined,
      coverLetter: coverLetterFile
        ? `/files/lettre_${Date.now()}.pdf`
        : undefined,
      notes: formData.notes || undefined,
    };

    if (editingApplication) {
      setApplications(
        applications.map((app) =>
          app.id === editingApplication.id
            ? { ...app, ...applicationData, updatedAt: new Date() }
            : app,
        ),
      );
    } else {
      const newApplication: JobApplication = {
        id: Date.now().toString(),
        ...applicationData,
        status: "pending",
        appliedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setApplications([...applications, newApplication]);
    }
    setIsCreateModalOpen(false);
  };

  const handleStatusChange = (
    applicationId: string,
    newStatus: JobApplication["status"],
  ) => {
    setApplications(
      applications.map((app) =>
        app.id === applicationId
          ? { ...app, status: newStatus, updatedAt: new Date() }
          : app,
      ),
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: "cv" | "coverLetter", file: File | null) => {
    if (field === "cv") {
      setCvFile(file);
    } else {
      setCoverLetterFile(file);
    }
  };

  const isFormValid =
    formData.applicantName &&
    formData.email &&
    formData.phone &&
    (formData.position !== "Autre"
      ? formData.position
      : formData.customPosition);

  const columns: ColumnDef<JobApplication>[] = [
    {
      key: "applicantName",
      label: "Candidat",
      render: (app: JobApplication) => (
        <div>
          {app.employeeId ? (
            <Link
              href={`/dashboard/hr/collaborators/${app.employeeId}`}
              className="font-medium hover:underline"
            >
              {app.applicantName}
            </Link>
          ) : (
            <div className="font-medium">{app.applicantName}</div>
          )}
          <div className="text-sm text-muted-foreground">{app.email}</div>
        </div>
      ),
    },
    {
      key: "position",
      label: "Poste",
      render: (app: JobApplication) => app.position,
    },
    {
      key: "appliedAt",
      label: "Date de candidature",
      render: (app: JobApplication) =>
        app.appliedAt.toLocaleDateString("fr-FR"),
    },
    {
      key: "status",
      label: "Statut",
      render: (app: JobApplication) => (
        <Badge variant={statusColors[app.status]}>
          {statusLabels[app.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (app: JobApplication) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(app)} className="gap-2">
              <Eye className="h-4 w-4" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(app)} className="gap-2">
              <Pencil className="h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            {app.status === "pending" && (
              <>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(app.id, "reviewed")}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Marquer examinée
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange(app.id, "rejected")}
                  className="gap-2 text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeter
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(app.id)}
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
          <h1 className="text-3xl font-bold tracking-tight">Candidatures</h1>
          <p className="text-muted-foreground">
            Gestion des candidatures et recrutement
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a
              href="https://www.francetravail.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Voir France Travail
            </a>
          </Button>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle candidature
          </Button>
        </div>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Candidatures ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={applications}
            columns={columns}
            searchKeys={["applicantName", "position", "email"]}
            searchPlaceholder="Rechercher des candidatures..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={
          editingApplication
            ? "Modifier la candidature"
            : "Nouvelle candidature"
        }
        description="Ajoutez ou modifiez les informations de la candidature."
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: editingApplication ? "Enregistrer" : "Créer",
            onClick: handleSave,
            disabled: !isFormValid,
          },
        }}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicantName">Nom du candidat *</Label>
              <Input
                id="applicantName"
                value={formData.applicantName}
                onChange={(e) =>
                  handleInputChange("applicantName", e.target.value)
                }
                placeholder="Ex: Marie Dupont"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="marie.dupont@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <PhoneInput
                id="phone"
                value={formData.phone}
                onChange={(value) => handleInputChange("phone", value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Poste demandé *</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => handleInputChange("position", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un poste" />
                </SelectTrigger>
                <SelectContent>
                  {commonPositions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.position === "Autre" && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customPosition">Préciser le poste *</Label>
                <Input
                  id="customPosition"
                  value={formData.customPosition}
                  onChange={(e) =>
                    handleInputChange("customPosition", e.target.value)
                  }
                  placeholder="Ex: Responsable sécurité événementielle"
                  required
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cv">CV</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="cv"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    handleFileChange("cv", e.target.files?.[0] || null)
                  }
                  className="flex-1"
                />
                {cvFile && (
                  <span className="text-sm text-muted-foreground">
                    {cvFile.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Formats acceptés: PDF, DOC, DOCX (max 10MB)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverLetter">Lettre de motivation</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="coverLetter"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    handleFileChange("coverLetter", e.target.files?.[0] || null)
                  }
                  className="flex-1"
                />
                {coverLetterFile && (
                  <span className="text-sm text-muted-foreground">
                    {coverLetterFile.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Formats acceptés: PDF, DOC, DOCX (max 10MB)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Informations supplémentaires sur le candidat..."
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
        title="Détails de la candidature"
        description={
          viewingApplication
            ? `${viewingApplication.applicantName} - ${viewingApplication.position}`
            : ""
        }
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {viewingApplication && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom du candidat</Label>
                <p className="text-sm font-medium">
                  {viewingApplication.applicantName}
                </p>
              </div>
              <div>
                <Label>Poste demandé</Label>
                <p className="text-sm font-medium">
                  {viewingApplication.position}
                </p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm font-medium">
                  {viewingApplication.email}
                </p>
              </div>
              <div>
                <Label>Téléphone</Label>
                <p className="text-sm font-medium">
                  {viewingApplication.phone}
                </p>
              </div>
              <div>
                <Label>Date de candidature</Label>
                <p className="text-sm font-medium">
                  {viewingApplication.appliedAt.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label>Statut</Label>
                <Badge variant={statusColors[viewingApplication.status]}>
                  {statusLabels[viewingApplication.status]}
                </Badge>
              </div>
            </div>

            {viewingApplication.cv && (
              <div>
                <Label>CV</Label>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={viewingApplication.cv}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Voir le CV
                  </a>
                </Button>
              </div>
            )}

            {viewingApplication.coverLetter && (
              <div>
                <Label>Lettre de motivation</Label>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={viewingApplication.coverLetter}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Voir la lettre
                  </a>
                </Button>
              </div>
            )}

            {viewingApplication.notes && (
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={viewingApplication.notes}
                  readOnly
                  className="min-h-20"
                />
              </div>
            )}

            {viewingApplication.reviewedAt && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Examinée le</Label>
                  <p className="text-sm font-medium">
                    {viewingApplication.reviewedAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                {viewingApplication.reviewedBy && (
                  <div>
                    <Label>Par</Label>
                    <p className="text-sm font-medium">
                      {viewingApplication.reviewedBy}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
