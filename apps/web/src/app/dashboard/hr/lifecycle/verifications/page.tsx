"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Shield,
  GraduationCap,
  MoreVertical,
} from "lucide-react";
import { RegulatoryVerification } from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";

// Mock data - replace with API call
const mockVerifications: RegulatoryVerification[] = [
  {
    id: "1",
    applicationId: "1",
    cnapsVerified: false,
    diplomasVerified: true,
    cnapsNumber: "CNAPS123456",
    diplomaFiles: ["/files/diploma_marie.pdf"],
    status: "pending",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    applicationId: "2",
    cnapsVerified: true,
    diplomasVerified: true,
    cnapsNumber: "CNAPS123457",
    diplomaFiles: ["/files/diploma_jean.pdf", "/files/cert_jean.pdf"],
    verifiedAt: new Date("2024-01-12"),
    verifiedBy: "Alice Dubois",
    status: "verified",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-12"),
  },
  {
    id: "3",
    applicationId: "3",
    cnapsVerified: false,
    diplomasVerified: false,
    diplomaFiles: [],
    status: "rejected",
    rejectionReason: "Diplôme non conforme",
    verifiedAt: new Date("2024-01-11"),
    verifiedBy: "Alice Dubois",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-11"),
  },
];

const statusLabels = {
  pending: "En attente",
  verified: "Conforme",
  rejected: "Non conforme",
};

const statusColors = {
  pending: "secondary",
  verified: "default",
  rejected: "destructive",
} as const;

// Noms des candidats associés aux candidatures (mock — à brancher sur l'API).
const applicantNames: Record<string, string> = {
  "1": "Marie Dupont",
  "2": "Jean Martin",
  "3": "Pierre Bernard",
};

// Ouvre la vérification de la carte pro sur le portail DRACAR (CNAPS).
function openDracar(cnapsNumber?: string) {
  const base = "https://dracar.cnaps-securite.fr";
  const url = cnapsNumber
    ? `${base}/recherche?numero=${encodeURIComponent(cnapsNumber)}`
    : base;
  window.open(url, "_blank", "noopener");
}

export default function VerificationsPage() {
  const [verifications, setVerifications] =
    useState<RegulatoryVerification[]>(mockVerifications);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingVerification, setEditingVerification] =
    useState<RegulatoryVerification | null>(null);
  const [viewingVerification, setViewingVerification] =
    useState<RegulatoryVerification | null>(null);
  const [formData, setFormData] = useState({
    applicationId: "",
    cnapsNumber: "",
    diplomaFiles: [] as string[],
  });
  const [diplomaFiles, setDiplomaFiles] = useState<File[]>([]);

  const handleCreate = () => {
    setEditingVerification(null);
    setFormData({
      applicationId: "",
      cnapsNumber: "",
      diplomaFiles: [],
    });
    setDiplomaFiles([]);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (verification: RegulatoryVerification) => {
    setEditingVerification(verification);
    setFormData({
      applicationId: verification.applicationId,
      cnapsNumber: verification.cnapsNumber || "",
      diplomaFiles: verification.diplomaFiles,
    });
    setDiplomaFiles([]);
    setIsCreateModalOpen(true);
  };

  const handleView = (verification: RegulatoryVerification) => {
    setViewingVerification(verification);
    setIsViewModalOpen(true);
  };

  const handleDelete = (verificationId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette vérification ?")) {
      setVerifications(
        verifications.filter((verif) => verif.id !== verificationId),
      );
    }
  };

  const handleSave = () => {
    const verificationData = {
      applicationId: formData.applicationId,
      cnapsNumber: formData.cnapsNumber || undefined,
      diplomaFiles:
        diplomaFiles.length > 0
          ? diplomaFiles.map(
              (_, index) => `/files/diploma_${Date.now()}_${index}.pdf`,
            )
          : formData.diplomaFiles,
    };

    if (editingVerification) {
      setVerifications(
        verifications.map((verif) =>
          verif.id === editingVerification.id
            ? { ...verif, ...verificationData, updatedAt: new Date() }
            : verif,
        ),
      );
    } else {
      const newVerification: RegulatoryVerification = {
        id: Date.now().toString(),
        ...verificationData,
        cnapsVerified: false,
        diplomasVerified: false,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setVerifications([...verifications, newVerification]);
    }
    setIsCreateModalOpen(false);
  };

  const handleVerify = (verificationId: string) => {
    setVerifications(
      verifications.map((verif) =>
        verif.id === verificationId
          ? {
              ...verif,
              status: "verified",
              cnapsVerified: true,
              diplomasVerified: true,
              verifiedAt: new Date(),
              verifiedBy: "Current User", // In a real app, get from auth
              updatedAt: new Date(),
            }
          : verif,
      ),
    );
  };

  const handleReject = (verificationId: string) => {
    const reason = prompt("Raison du rejet:");
    if (reason) {
      setVerifications(
        verifications.map((verif) =>
          verif.id === verificationId
            ? {
                ...verif,
                status: "rejected",
                rejectionReason: reason,
                verifiedAt: new Date(),
                verifiedBy: "Current User", // In a real app, get from auth
                updatedAt: new Date(),
              }
            : verif,
        ),
      );
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (files: FileList | null) => {
    if (files) {
      setDiplomaFiles(Array.from(files));
    } else {
      setDiplomaFiles([]);
    }
  };

  const isFormValid = formData.applicationId.trim() !== "";

  const columns: ColumnDef<RegulatoryVerification>[] = [
    {
      key: "applicationId",
      label: "Candidature",
      render: (verif: RegulatoryVerification) => (
        <div>
          <div className="font-medium">
            {applicantNames[verif.applicationId] ?? "Candidat inconnu"}
          </div>
          <div className="text-sm text-muted-foreground">
            Candidature #{verif.applicationId}
            {verif.cnapsNumber ? ` · ${verif.cnapsNumber}` : ""}
          </div>
        </div>
      ),
    },
    {
      key: "cnapsVerified",
      label: "CNAPS",
      render: (verif: RegulatoryVerification) => (
        <div className="flex items-center space-x-2">
          <Shield
            className={`h-4 w-4 ${verif.cnapsVerified ? "text-green-600" : "text-red-600"}`}
          />
          <span className="text-sm">
            {verif.cnapsVerified ? "Vérifié" : "Non vérifié"}
          </span>
        </div>
      ),
    },
    {
      key: "diplomasVerified",
      label: "Diplômes",
      render: (verif: RegulatoryVerification) => (
        <div className="flex items-center space-x-2">
          <GraduationCap
            className={`h-4 w-4 ${verif.diplomasVerified ? "text-green-600" : "text-red-600"}`}
          />
          <span className="text-sm">
            {verif.diplomasVerified ? "Vérifiés" : "Non vérifiés"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (verif: RegulatoryVerification) => (
        <Badge variant={statusColors[verif.status]}>
          {statusLabels[verif.status]}
        </Badge>
      ),
    },
    {
      key: "verifiedAt",
      label: "Date de vérification",
      render: (verif: RegulatoryVerification) =>
        verif.verifiedAt ? verif.verifiedAt.toLocaleDateString("fr-FR") : "-",
    },
    {
      key: "actions",
      label: "Actions",
      render: (verif: RegulatoryVerification) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDracar(verif.cnapsNumber)}
            className="gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Shield className="h-4 w-4" />
            DRACAR
          </Button>
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleView(verif)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleEdit(verif)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openDracar(verif.cnapsNumber)}
              className="gap-2"
            >
              <Shield className="h-4 w-4 text-blue-600" />
              Vérifier sur DRACAR
            </DropdownMenuItem>
            {verif.status === "pending" && (
              <>
                <DropdownMenuItem
                  onClick={() => handleVerify(verif.id)}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Marquer conforme
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleReject(verif.id)}
                  className="gap-2 text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                  Marquer non conforme
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              onClick={() => handleDelete(verif.id)}
              className="gap-2 text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vérifications réglementaires
          </h1>
          <p className="text-muted-foreground">
            Contrôle CNAPS et diplômes des candidats
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <FileText className="h-4 w-4" />
          Nouvelle vérification
        </Button>
      </div>

      {/* Verifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vérifications ({verifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={verifications}
            columns={columns}
            searchKeys={["cnapsNumber", "applicationId"]}
            searchPlaceholder="Rechercher des vérifications..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={
          editingVerification
            ? "Modifier la vérification"
            : "Nouvelle vérification"
        }
        description="Ajoutez ou modifiez les informations de vérification réglementaire."
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: editingVerification ? "Enregistrer" : "Créer",
            onClick: handleSave,
            disabled: !isFormValid,
          },
        }}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicationId">ID de la candidature *</Label>
              <Input
                id="applicationId"
                value={formData.applicationId}
                onChange={(e) =>
                  handleInputChange("applicationId", e.target.value)
                }
                placeholder="Ex: 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnapsNumber">Numéro CNAPS</Label>
              <Input
                id="cnapsNumber"
                value={formData.cnapsNumber}
                onChange={(e) =>
                  handleInputChange("cnapsNumber", e.target.value)
                }
                placeholder="Numéro CNAPS du candidat"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="diplomaFiles">Fichiers de diplômes</Label>
            <div className="space-y-2">
              <Input
                id="diplomaFiles"
                type="file"
                accept=".pdf,.doc,.docx"
                multiple
                onChange={(e) => handleFileChange(e.target.files)}
                className="flex-1"
              />
              {diplomaFiles.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {diplomaFiles.length} fichier(s) sélectionné(s):{" "}
                  {diplomaFiles.map((f) => f.name).join(", ")}
                </div>
              )}
              {formData.diplomaFiles.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {formData.diplomaFiles.length} fichier(s) existant(s)
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formats acceptés: PDF, DOC, DOCX (max 10MB chacun)
            </p>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de la vérification"
        description={
          viewingVerification
            ? `Candidature #${viewingVerification.applicationId}`
            : ""
        }
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {viewingVerification && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Candidature</Label>
                <p className="text-sm font-medium">
                  #{viewingVerification.applicationId}
                </p>
              </div>
              <div>
                <Label>Statut</Label>
                <Badge variant={statusColors[viewingVerification.status]}>
                  {statusLabels[viewingVerification.status]}
                </Badge>
              </div>
              <div>
                <Label>Numéro CNAPS</Label>
                <p className="text-sm font-medium">
                  {viewingVerification.cnapsNumber || "Non fourni"}
                </p>
              </div>
              <div>
                <Label>CNAPS vérifié</Label>
                <div className="flex items-center space-x-2">
                  <Shield
                    className={`h-4 w-4 ${viewingVerification.cnapsVerified ? "text-green-600" : "text-red-600"}`}
                  />
                  <span className="text-sm">
                    {viewingVerification.cnapsVerified ? "Oui" : "Non"}
                  </span>
                </div>
              </div>
              <div>
                <Label>Diplômes vérifiés</Label>
                <div className="flex items-center space-x-2">
                  <GraduationCap
                    className={`h-4 w-4 ${viewingVerification.diplomasVerified ? "text-green-600" : "text-red-600"}`}
                  />
                  <span className="text-sm">
                    {viewingVerification.diplomasVerified ? "Oui" : "Non"}
                  </span>
                </div>
              </div>
            </div>

            {viewingVerification.diplomaFiles.length > 0 && (
              <div>
                <Label>Fichiers de diplômes</Label>
                <div className="space-y-2">
                  {viewingVerification.diplomaFiles.map((file, index) => (
                    <Button key={index} variant="outline" size="sm" asChild>
                      <a href={file} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Diplôme {index + 1}
                      </a>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {viewingVerification.rejectionReason && (
              <div>
                <Label>Raison du rejet</Label>
                <Textarea
                  value={viewingVerification.rejectionReason}
                  readOnly
                  className="min-h-20"
                />
              </div>
            )}

            {viewingVerification.verifiedAt && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vérifiée le</Label>
                  <p className="text-sm font-medium">
                    {viewingVerification.verifiedAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                {viewingVerification.verifiedBy && (
                  <div>
                    <Label>Par</Label>
                    <p className="text-sm font-medium">
                      {viewingVerification.verifiedBy}
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
