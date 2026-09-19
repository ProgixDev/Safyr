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
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckCircle, XCircle, FileText, Wand2, Eye } from "lucide-react";
import { JobApplication } from "@/lib/types";
import { EMPLOYEE_POSTE_OPTIONS } from "@/lib/hr-options";
import { candidateFromEmail } from "@/lib/candidate-from-email";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { useRegistre } from "@/hooks/fiscal/use-registre";
import { useAttachments, useAttachDocument } from "@/hooks/contracts";
import { downloadStoredFile } from "@/lib/document-files";
import { BADGE_TONS, type BadgeTon } from "@/lib/hr-status-badges";
import { cn } from "@/lib/utils";

/** Ligne telle qu'enregistrée en base : les dates y sont des chaînes ISO. */
interface LigneCandidature {
  id: string;
  employeeId?: string;
  applicantName: string;
  email: string;
  phone: string;
  position: string;
  status: JobApplication["status"];
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

const EPOQUE = new Date(0);

function versApplication(l: LigneCandidature): JobApplication {
  return {
    id: l.id,
    employeeId: l.employeeId,
    applicantName: l.applicantName ?? "",
    email: l.email ?? "",
    phone: l.phone ?? "",
    position: l.position ?? "",
    status: l.status ?? "pending",
    appliedAt: l.appliedAt ? new Date(l.appliedAt) : EPOQUE,
    reviewedAt: l.reviewedAt ? new Date(l.reviewedAt) : undefined,
    reviewedBy: l.reviewedBy,
    notes: l.notes,
    createdAt: EPOQUE,
    updatedAt: EPOQUE,
  };
}

const statusLabels = {
  pending: "En attente",
  reviewed: "Examinée",
  interviewed: "Entretien",
  accepted: "Acceptée",
  rejected: "Rejetée",
};

// Examinée = orange, Acceptée = vert, Rejetée = rouge (demande du client).
const statusColors: Record<JobApplication["status"], BadgeTon> = {
  pending: "gris",
  reviewed: "orange",
  interviewed: "bleu",
  accepted: "vert",
  rejected: "rouge",
};

function StatutCandidature({ status }: { status: JobApplication["status"] }) {
  return (
    <Badge variant="outline" className={cn(BADGE_TONS[statusColors[status]])}>
      {statusLabels[status]}
    </Badge>
  );
}

const commonPositions = EMPLOYEE_POSTE_OPTIONS;

export default function ApplicationsPage() {
  // Enregistré en base : la liste ne vivait que dans le navigateur.
  const registreCandidatures = useRegistre<LigneCandidature>("candidature", []);
  const applications = registreCandidatures.lignes.map(versApplication);
  // Le CV et la lettre de motivation sont de vraies pièces jointes : le
  // formulaire ne faisait auparavant que fabriquer un chemin de fichier
  // fictif, jamais réellement enregistré.
  const attacherPieceCandidature = useAttachDocument("divers");
  const { data: piecesCandidature = [] } = useAttachments("divers");
  const cvDe = (id: string) =>
    piecesCandidature.find((p) => p.scopeId === id && p.slot === "cv");
  const lettreDe = (id: string) =>
    piecesCandidature.find((p) => p.scopeId === id && p.slot === "lettre");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] =
    useState<JobApplication | null>(null);
  // On garde l'identifiant plutôt qu'une copie : le statut affiché dans la
  // fenêtre de détails suit ainsi les changements enregistrés en base.
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewingApplication =
    applications.find((a) => a.id === viewingId) ?? null;
  const [formData, setFormData] = useState({
    applicantName: "",
    email: "",
    phone: "",
    position: "",
    customPosition: "",
    notes: "",
    status: "pending" as JobApplication["status"],
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
      status: "pending",
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
      status: application.status,
    });
    setCvFile(null);
    setCoverLetterFile(null);
    setIsCreateModalOpen(true);
  };

  const handleView = (application: JobApplication) => {
    setViewingId(application.id);
    setIsViewModalOpen(true);
  };

  const handleDelete = (applicationId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette candidature ?")) {
      registreCandidatures
        .supprimerLigne(applicationId)
        .catch(() => alert("Échec de la suppression. Réessayez."));
    }
  };

  const enregistrerCandidature = (
    app: JobApplication,
    champs: Partial<LigneCandidature>,
  ) =>
    registreCandidatures.enregistrer(
      {
        id: app.id,
        employeeId: app.employeeId,
        applicantName: app.applicantName,
        email: app.email,
        phone: app.phone,
        position: app.position,
        status: app.status,
        appliedAt: app.appliedAt.toISOString(),
        reviewedAt: app.reviewedAt?.toISOString(),
        reviewedBy: app.reviewedBy,
        notes: app.notes,
        ...champs,
      },
      {
        period: app.appliedAt.toISOString().slice(0, 7),
        label: `${app.applicantName} — ${app.position}`,
        status: champs.status ?? app.status,
      },
    );

  const handleSave = async () => {
    const position =
      formData.position === "Autre"
        ? formData.customPosition
        : formData.position;
    const base: JobApplication =
      editingApplication ??
      ({
        id: "",
        applicantName: "",
        email: "",
        phone: "",
        position: "",
        status: "pending",
        appliedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as JobApplication);
    try {
      const id = await enregistrerCandidature(base, {
        id: editingApplication?.id ?? "",
        applicantName: formData.applicantName,
        email: formData.email,
        phone: formData.phone,
        position,
        notes: formData.notes || undefined,
        appliedAt: (editingApplication?.appliedAt ?? new Date()).toISOString(),
        status: formData.status,
        reviewedAt:
          formData.status !== (editingApplication?.status ?? "pending")
            ? new Date().toISOString()
            : editingApplication?.reviewedAt?.toISOString(),
      });
      if (cvFile) {
        await attacherPieceCandidature.mutateAsync({
          file: cvFile,
          scopeId: id,
          slot: "cv",
        });
      }
      if (coverLetterFile) {
        await attacherPieceCandidature.mutateAsync({
          file: coverLetterFile,
          scopeId: id,
          slot: "lettre",
        });
      }
    } catch (erreur) {
      alert(
        erreur instanceof Error
          ? `Échec de l'enregistrement : ${erreur.message}`
          : "Échec de l'enregistrement.",
      );
      return;
    }
    setIsCreateModalOpen(false);
  };

  const handleStatusChange = async (
    applicationId: string,
    newStatus: JobApplication["status"],
  ) => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app || app.status === newStatus) return;
    try {
      await enregistrerCandidature(app, {
        status: newStatus,
        reviewedAt: new Date().toISOString(),
      });
    } catch (erreur) {
      alert(
        erreur instanceof Error
          ? `Échec de la mise à jour du statut : ${erreur.message}`
          : "Échec de la mise à jour du statut.",
      );
    }
  };

  /** Entrées « Modifier le statut » du menu de la ligne (statut actuel exclu). */
  const entreesStatut = (app: JobApplication) =>
    (
      [
        {
          statut: "reviewed",
          label: "Marquer comme examinée",
          icon: Eye,
          tone: "edit",
        },
        {
          statut: "accepted",
          label: "Marquer comme acceptée",
          icon: CheckCircle,
          tone: "validate",
        },
        {
          statut: "rejected",
          label: "Marquer comme rejetée",
          icon: XCircle,
          tone: "delete",
        },
      ] as const
    )
      .filter((e) => e.statut !== app.status)
      .map((e, index) => ({
        label: e.label,
        icon: e.icon,
        tone: e.tone,
        separatorBefore: index === 0,
        onClick: () => void handleStatusChange(app.id, e.statut),
      }));

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Récupération automatique des informations du candidat à partir de son
   * adresse e-mail (ex. marie.dupont@societe.fr → « Marie Dupont »).
   * N'écrase jamais un nom déjà saisi.
   */
  const handleEmailBlur = () => {
    if (formData.applicantName.trim()) return;
    const { fullName } = candidateFromEmail(formData.email);
    if (fullName) {
      setFormData((prev) => ({ ...prev, applicantName: fullName }));
    }
  };

  const suggestedName = candidateFromEmail(formData.email).fullName;
  const canAutofill =
    Boolean(suggestedName) && suggestedName !== formData.applicantName;

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
        <StatutCandidature status={app.status} />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (app: JobApplication) => (
        <RowActionsMenu
          onView={() => handleView(app)}
          onEdit={() => handleEdit(app)}
          extraItems={entreesStatut(app)}
          onDelete={() => handleDelete(app.id)}
        />
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
            onRowClick={handleView}
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
            onClick: () => void handleSave(),
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
                onBlur={handleEmailBlur}
                placeholder="marie.dupont@email.com"
                required
              />
              {canAutofill && (
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      applicantName: suggestedName,
                    }))
                  }
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Wand2 className="h-3 w-3" />
                  Remplir le nom avec « {suggestedName} »
                </button>
              )}
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

            <div className="space-y-2">
              <Label htmlFor="statut-candidature">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as JobApplication["status"],
                  }))
                }
              >
                <SelectTrigger id="statut-candidature">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(statusLabels) as JobApplication["status"][]
                  ).map((statut) => (
                    <SelectItem key={statut} value={statut}>
                      {statusLabels[statut]}
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
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatutCandidature status={viewingApplication.status} />
                  <Select
                    value={viewingApplication.status}
                    onValueChange={(value) =>
                      void handleStatusChange(
                        viewingApplication.id,
                        value as JobApplication["status"],
                      )
                    }
                  >
                    <SelectTrigger
                      className="h-8 w-40"
                      aria-label="Modifier le statut"
                    >
                      <SelectValue placeholder="Modifier le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(statusLabels) as JobApplication["status"][]
                      ).map((statut) => (
                        <SelectItem key={statut} value={statut}>
                          {statusLabels[statut]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {cvDe(viewingApplication.id) && (
              <div>
                <Label>CV</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const piece = cvDe(viewingApplication.id)!;
                    void downloadStoredFile({
                      name: piece.name,
                      key: piece.storageKey,
                    });
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Voir le CV
                </Button>
              </div>
            )}

            {lettreDe(viewingApplication.id) && (
              <div>
                <Label>Lettre de motivation</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const piece = lettreDe(viewingApplication.id)!;
                    void downloadStoredFile({
                      name: piece.name,
                      key: piece.storageKey,
                    });
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Voir la lettre
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
