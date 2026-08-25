"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  Trash2,
  Download,
  FileText,
  Shield,
  GraduationCap,
} from "lucide-react";
import { RegulatoryVerification } from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { CNAPS_TELESERVICES_URL, openExternal } from "@/lib/external-links";
import { useListePersistante } from "@/hooks/fiscal/use-liste-persistante";

// Mock data - replace with API call
const mockVerifications: RegulatoryVerification[] = [];

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

// Ouvre la vérification de la carte pro sur les téléservices CNAPS (DRACAR).
// Le portail ne permet pas de pré-remplir le numéro par URL : on ouvre
// l'accueil et le numéro reste affiché dans le tableau pour la saisie.
function openDracar() {
  openExternal(CNAPS_TELESERVICES_URL);
}

// Téléchargement d'un document attaché. Placeholder tant que le stockage
// n'est pas branché sur ce module (le nom réel du fichier est conservé).
function downloadDocument(path: string) {
  const filename = path.split("/").pop() || path;
  const blob = new Blob(
    [
      `Document : ${filename}\n(Placeholder — le vrai fichier sera servi par le backend une fois branché.)`,
    ],
    { type: "text/plain" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".txt") ? filename : `${filename}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VerificationsPage() {
  // Enregistré en base : la liste ne vivait que dans le navigateur.
  const [verifications, setVerifications] =
    useListePersistante<RegulatoryVerification>("verification");
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

  const handleCreate = () => {
    setEditingVerification(null);
    setFormData({
      applicationId: "",
      cnapsNumber: "",
      diplomaFiles: [],
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (verification: RegulatoryVerification) => {
    setEditingVerification(verification);
    setFormData({
      applicationId: verification.applicationId,
      cnapsNumber: verification.cnapsNumber || "",
      diplomaFiles: verification.diplomaFiles,
    });
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
      // On conserve le nom réel des fichiers déposés : le formulaire
      // fabriquait auparavant des chemins fictifs (/files/diploma_<ts>.pdf),
      // qui écrasaient les documents existants et donnaient des liens morts.
      diplomaFiles: formData.diplomaFiles,
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

  /** Ajoute les fichiers choisis à la liste (sans écraser les précédents). */
  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const noms = Array.from(files).map((f) => f.name);
    setFormData((prev) => ({
      ...prev,
      diplomaFiles: [
        ...prev.diplomaFiles,
        ...noms.filter((n) => !prev.diplomaFiles.includes(n)),
      ],
    }));
  };

  const handleRemoveFile = (nom: string) => {
    setFormData((prev) => ({
      ...prev,
      diplomaFiles: prev.diplomaFiles.filter((f) => f !== nom),
    }));
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
            onClick={() => openDracar()}
            className="gap-1 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Shield className="h-4 w-4" />
            DRACAR
          </Button>
          <RowActionsMenu
            onView={() => handleView(verif)}
            onEdit={() => handleEdit(verif)}
            extraItems={[
              {
                label: "Vérifier sur DRACAR",
                icon: Shield,
                tone: "history",
                onClick: () => openDracar(),
              },
              ...(verif.status === "pending"
                ? [
                    {
                      label: "Marquer conforme",
                      icon: CheckCircle,
                      tone: "validate" as const,
                      onClick: () => handleVerify(verif.id),
                    },
                    {
                      label: "Marquer non conforme",
                      icon: XCircle,
                      tone: "delete" as const,
                      onClick: () => handleReject(verif.id),
                    },
                  ]
                : []),
            ]}
            onDelete={() => handleDelete(verif.id)}
          />
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
            onRowClick={handleView}
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
            <Label htmlFor="diplomaFiles">
              Documents (diplômes, carte pro…)
            </Label>
            <Input
              id="diplomaFiles"
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              multiple
              onChange={(e) => {
                handleFileChange(e.target.files);
                e.target.value = "";
              }}
            />
            {formData.diplomaFiles.length > 0 ? (
              <ul className="space-y-2">
                {formData.diplomaFiles.map((nom) => (
                  <li
                    key={nom}
                    className="flex items-center justify-between gap-3 rounded border px-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {nom}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => downloadDocument(nom)}
                        title="Télécharger"
                      >
                        <Download className="h-3.5 w-3.5 text-violet-500" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleRemoveFile(nom)}
                        title="Retirer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun document attaché.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Formats acceptés : PDF, DOC, DOCX, PNG, JPG (max 10 Mo chacun)
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

            <div>
              <Label>Documents</Label>
              {viewingVerification.diplomaFiles.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {viewingVerification.diplomaFiles.map((file) => (
                    <li
                      key={file}
                      className="flex items-center justify-between gap-3 rounded border px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {file.split("/").pop()}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDocument(file)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Télécharger
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Aucun document attaché.
                </p>
              )}
            </div>

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
