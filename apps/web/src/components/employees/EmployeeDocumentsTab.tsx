"use client";

import { useMemo, useRef, useState } from "react";
import {
  useDeleteCertification,
  useEmployee,
  useEmployeeCompliance,
  useUploadMemberDocument,
} from "@/hooks/employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  Eye,
  Trash2,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  ExternalLink,
  AlertCircle,
  Clock,
  XCircle,
  Pencil,
} from "lucide-react";
import type { Employee, Document, CNAPSAccess } from "@/lib/types";
import type { Certification as ApiCertification } from "@safyr/api-client";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { CertificationFormDialog } from "./CertificationFormDialog";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/date-utils";

type CertStatus = "valid" | "expired" | "expiring-soon" | "pending-renewal";

function computeCertStatus(expiryIso: string): CertStatus {
  const expiry = new Date(expiryIso).getTime();
  if (Number.isNaN(expiry)) return "pending-renewal";
  const now = Date.now();
  const days = (expiry - now) / 86_400_000;
  if (days < 0) return "expired";
  if (days <= 60) return "expiring-soon";
  return "valid";
}

const CERTIFICATION_LABELS: Record<ApiCertification["type"], string> = {
  CQP_APS: "CQP/APS",
  CNAPS: "Carte Professionnelle CNAPS",
  SSIAP1: "SSIAP 1",
  SSIAP2: "SSIAP 2",
  SSIAP3: "SSIAP 3",
  SST: "SST",
  VM: "Visite Médicale",
  H0B0: "H0B0",
  FIRE: "Habilitation Incendie",
};

interface EmployeeDocumentsTabProps {
  employee: Employee;
}

export function EmployeeDocumentsTab({ employee }: EmployeeDocumentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingRequirementId, setPendingRequirementId] = useState<
    string | null
  >(null);
  const { data: compliance } = useEmployeeCompliance(employee.id);
  const { data: apiEmployee } = useEmployee(employee.id);
  const uploadMutation = useUploadMemberDocument(employee.id);
  const deleteCertMutation = useDeleteCertification(employee.id);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [certEditing, setCertEditing] = useState<ApiCertification | null>(null);
  const [certToDelete, setCertToDelete] = useState<ApiCertification | null>(
    null,
  );

  const apiCertifications = useMemo<ApiCertification[]>(
    () => apiEmployee?.certifications ?? [],
    [apiEmployee],
  );

  const openFilePicker = (requirementId: string) => {
    setPendingRequirementId(requirementId);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !pendingRequirementId) return;
    try {
      await uploadMutation.mutateAsync({
        file,
        requirementId: pendingRequirementId,
      });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setPendingRequirementId(null);
    }
  };

  const firstMemberRequirementId = compliance?.[0]?.requirement.id ?? null;

  const [documents] = useState<Document[]>([
    {
      id: "1",
      name: "Carte d'identité",
      type: "id-card",
      fileUrl: "/documents/id-card.pdf",
      uploadedAt: new Date("2024-01-15"),
      uploadedBy: "admin@safyr.com",
      expiresAt: new Date("2029-01-15"),
      verified: true,
    },
    {
      id: "2",
      name: "Carte Vitale",
      type: "health-card",
      fileUrl: "/documents/health-card.pdf",
      uploadedAt: new Date("2024-02-01"),
      uploadedBy: "admin@safyr.com",
      verified: true,
    },
    {
      id: "3",
      name: "CV",
      type: "cv",
      fileUrl: "/documents/cv.pdf",
      uploadedAt: new Date("2020-01-10"),
      uploadedBy: "jean.dupont@safyr.com",
      verified: true,
    },
    {
      id: "4",
      name: "Justificatif de domicile",
      type: "proof-address",
      fileUrl: "/documents/proof-address.pdf",
      uploadedAt: new Date("2024-11-01"),
      uploadedBy: "admin@safyr.com",
      expiresAt: new Date("2025-11-01"),
      verified: true,
    },
    {
      id: "5",
      name: "DPAE",
      type: "dpae",
      fileUrl: "/documents/dpae.pdf",
      uploadedAt: new Date("2020-01-14"),
      uploadedBy: "rh@safyr.com",
      verified: true,
    },
  ]);

  const getCertificationStatusBadge = (status: CertStatus) => {
    const config = {
      valid: {
        variant: "default" as const,
        label: "Valide",
        color: "bg-green-500",
      },
      expired: {
        variant: "destructive" as const,
        label: "Expiré",
        color: "bg-red-500",
      },
      "expiring-soon": {
        variant: "secondary" as const,
        label: "Expire bientôt",
        color: "bg-orange-500",
      },
      "pending-renewal": {
        variant: "outline" as const,
        label: "À renouveler",
        color: "bg-yellow-500",
      },
    };
    return config[status];
  };

  const getCertificationLabel = (type: ApiCertification["type"]) =>
    CERTIFICATION_LABELS[type] ?? type;

  const documentColumns: ColumnDef<Document>[] = [
    {
      key: "icon",
      label: "",
      render: (doc) => (
        <div className="p-2 bg-primary/10 rounded-lg">
          {doc.type === "id-card" || doc.type === "health-card" ? (
            <ImageIcon className="h-5 w-5 text-primary" />
          ) : doc.type === "dpae" || doc.type === "due" ? (
            <FileText className="h-5 w-5 text-green-600" />
          ) : (
            <FileText className="h-5 w-5 text-primary" />
          )}
        </div>
      ),
    },
    {
      key: "name",
      label: "Document",
      sortable: true,
      render: (doc) => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold truncate">{doc.name}</span>
          {doc.verified && (
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          )}
        </div>
      ),
    },
    {
      key: "uploadedAt",
      label: "Date d'ajout",
      sortable: true,
      render: (doc) => doc.uploadedAt.toLocaleDateString("fr-FR"),
    },
    {
      key: "expiresAt",
      label: "Date d'expiration",
      sortable: true,
      render: (doc) =>
        doc.expiresAt ? doc.expiresAt.toLocaleDateString("fr-FR") : "-",
    },
  ];

  const certificationColumns: ColumnDef<ApiCertification>[] = [
    {
      key: "status",
      label: "Statut",
      render: (cert) => {
        const status = computeCertStatus(cert.expiryDate);
        const statusConfig = getCertificationStatusBadge(status);
        return <div className={`w-3 h-3 rounded-full ${statusConfig.color}`} />;
      },
    },
    {
      key: "type",
      label: "Certification",
      sortable: true,
      render: (cert) => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold truncate">
            {getCertificationLabel(cert.type)}
          </span>
          {cert.verified && (
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          )}
        </div>
      ),
    },
    {
      key: "number",
      label: "Numéro",
      render: (cert) => <span className="truncate">{cert.number}</span>,
    },
    {
      key: "issuer",
      label: "Émetteur",
      render: (cert) => <span className="truncate">{cert.issuer}</span>,
    },
    {
      key: "expiryDate",
      label: "Date d'expiration",
      sortable: true,
      render: (cert) => {
        const status = computeCertStatus(cert.expiryDate);
        const statusConfig = getCertificationStatusBadge(status);
        const expiryMs = new Date(cert.expiryDate).getTime();
        const daysUntilExpiry = Number.isNaN(expiryMs)
          ? null
          : Math.ceil((expiryMs - Date.now()) / 86_400_000);
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span>{formatDate(cert.expiryDate)}</span>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            {status !== "expired" &&
              daysUntilExpiry !== null &&
              daysUntilExpiry <= 90 && (
                <span className="text-xs text-orange-600 font-medium">
                  {daysUntilExpiry} jours restants
                </span>
              )}
          </div>
        );
      },
    },
  ];

  const [cnapsData] = useState<CNAPSAccess | null>({
    employeeId: employee.id,
    cnapsNumber: "CNAPS-2024-001234",
    lastChecked: new Date("2024-12-15T10:30:00"),
    status: "valid",
    dracarLink: `https://dracar.cnaps-securite.fr/employee/${employee.id}`,
  });

  const [verificationHistory] = useState([
    {
      id: "1",
      date: new Date("2024-12-15T10:30:00"),
      status: "valid" as const,
      checkedBy: "admin@safyr.com",
      notes: "Carte professionnelle valide jusqu'au 10/01/2025",
    },
    {
      id: "2",
      date: new Date("2024-11-15T09:15:00"),
      status: "valid" as const,
      checkedBy: "admin@safyr.com",
      notes: "Vérification mensuelle - Tout est en ordre",
    },
    {
      id: "3",
      date: new Date("2024-10-15T14:20:00"),
      status: "valid" as const,
      checkedBy: "admin@safyr.com",
      notes: "Renouvellement de la carte effectué",
    },
  ]);

  const getCNAPSStatusBadge = (status: CNAPSAccess["status"]) => {
    const variants = {
      valid: {
        variant: "default" as const,
        label: "Valide",
        color: "bg-green-500",
        icon: CheckCircle,
      },
      invalid: {
        variant: "destructive" as const,
        label: "Invalide",
        color: "bg-red-500",
        icon: XCircle,
      },
      pending: {
        variant: "secondary" as const,
        label: "En attente",
        color: "bg-yellow-500",
        icon: Clock,
      },
      error: {
        variant: "outline" as const,
        label: "Erreur",
        color: "bg-gray-500",
        icon: AlertCircle,
      },
    };
    return variants[status];
  };

  const handleOpenDRACAR = () => {
    if (cnapsData?.dracarLink) {
      window.open(cnapsData.dracarLink, "_blank", "noopener,noreferrer");
    } else {
      window.open(
        "https://www.cnaps-securite.fr/service-dracar/",
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  const verificationColumns: ColumnDef<(typeof verificationHistory)[0]>[] = [
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (verification) => {
        const config = getCNAPSStatusBadge(verification.status);
        return (
          <div className="flex items-center gap-2">
            <config.icon
              className={`h-5 w-5 text-${config.color.split("-")[1]}-600`}
            />
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        );
      },
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (verification) => (
        <span className="text-sm">
          {verification.date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "notes",
      label: "Notes",
      render: (verification) => (
        <span className="text-sm truncate block max-w-md">
          {verification.notes}
        </span>
      ),
    },
    {
      key: "checkedBy",
      label: "Vérifié par",
      render: (verification) => (
        <span className="text-xs text-muted-foreground">
          {verification.checkedBy}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* DPAE/DUE Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            DPAE / DUE
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Déclaration Préalable À l&apos;Embauche / Déclaration Unique
            d&apos;Embauche
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {documents.filter((doc) => doc.type === "dpae" || doc.type === "due")
            .length > 0 ? (
            <div className="space-y-3">
              {documents
                .filter((doc) => doc.type === "dpae" || doc.type === "due")
                .map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{doc.name}</p>
                          {doc.verified && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Ajouté le {doc.uploadedAt.toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4 text-orange-500" />
                        Voir
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground mb-4">
                Aucune DPAE/DUE enregistrée
              </p>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Ajouter une DPAE/DUE
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documents</CardTitle>
          <Button
            disabled={!firstMemberRequirementId || uploadMutation.isPending}
            onClick={() =>
              firstMemberRequirementId &&
              openFilePicker(firstMemberRequirementId)
            }
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploadMutation.isPending ? "Envoi..." : "Ajouter un document"}
          </Button>
        </CardHeader>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelected}
        />
        <CardContent>
          <DataTable
            data={documents.filter(
              (doc) => doc.type !== "dpae" && doc.type !== "due",
            )}
            columns={documentColumns}
            searchKeys={["name", "type"]}
            searchPlaceholder="Rechercher un document..."
            actions={() => (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Diplomas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Diplômes & Certifications</CardTitle>
          <Button
            onClick={() => {
              setCertEditing(null);
              setCertDialogOpen(true);
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            Ajouter une certification
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            data={apiCertifications}
            columns={certificationColumns}
            searchKeys={["type", "number", "issuer"]}
            searchPlaceholder="Rechercher une certification..."
            itemsPerPage={10}
            actions={(cert) => (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCertEditing(cert);
                    setCertDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCertToDelete(cert)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <CertificationFormDialog
        open={certDialogOpen}
        onOpenChange={(open) => {
          setCertDialogOpen(open);
          if (!open) setCertEditing(null);
        }}
        memberId={employee.id}
        existing={certEditing}
      />

      <Modal
        open={!!certToDelete}
        onOpenChange={(open) => !open && setCertToDelete(null)}
        type="warning"
        title="Supprimer la certification"
        description="Cette action est irréversible."
        closable={false}
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setCertToDelete(null),
            variant: "outline",
          },
          primary: {
            label: deleteCertMutation.isPending ? "Suppression..." : "Supprimer",
            variant: "destructive",
            disabled: deleteCertMutation.isPending,
            onClick: async () => {
              if (!certToDelete) return;
              await deleteCertMutation.mutateAsync(certToDelete.id);
              setCertToDelete(null);
            },
          },
        }}
      >
        {certToDelete && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {getCertificationLabel(certToDelete.type)}
            </span>{" "}
            — n° {certToDelete.number}
          </p>
        )}
      </Modal>

      {/* Direct DRACAR Access */}
      <Card>
        <CardHeader>
          <CardTitle>Accès Direct DRACAR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Accédez directement au système CNAPS DRACAR pour consulter ou
              mettre à jour les informations de cet employé.
            </p>

            <div className="flex gap-2">
              <Button onClick={handleOpenDRACAR}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir DRACAR
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Télécharger attestation
              </Button>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4 text-orange-500" />
                Voir carte numérique
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={verificationHistory}
            columns={verificationColumns}
            searchKeys={["notes", "checkedBy"]}
            searchPlaceholder="Rechercher dans l'historique..."
            itemsPerPage={10}
            filters={[
              {
                key: "status",
                label: "Statut",
                options: [
                  { value: "all", label: "Tous" },
                  { value: "valid", label: "Valide" },
                  { value: "invalid", label: "Invalide" },
                  { value: "pending", label: "En attente" },
                  { value: "error", label: "Erreur" },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
