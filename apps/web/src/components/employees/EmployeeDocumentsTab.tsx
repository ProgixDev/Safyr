"use client";

import { useMemo, useRef, useState } from "react";
import {
  useDeleteCertification,
  useEmployee,
  useEmployeeCompliance,
  useUploadMemberDocument,
  useDeleteMemberDocument,
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
import {
  getSignedUrl,
  type Certification as ApiCertification,
} from "@safyr/api-client";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { CertificationFormDialog } from "./CertificationFormDialog";
import { Modal } from "@/components/ui/modal";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { formatDate } from "@/lib/date-utils";
import { CNAPS_TELESERVICES_URL, openExternal } from "@/lib/external-links";

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
  const suppressionDocument = useDeleteMemberDocument(employee.id);
  // Retrait d'une pièce du dossier : confirmé, comme sur « Mon entreprise ».
  const [docASupprimer, setDocASupprimer] = useState<{
    requirement: { id: string; name: string };
  } | null>(null);
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

  const [televersementErreur, setTeleversementErreur] = useState<string | null>(
    null,
  );

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !pendingRequirementId) return;
    setTeleversementErreur(null);
    try {
      await uploadMutation.mutateAsync({
        file,
        requirementId: pendingRequirementId,
      });
    } catch (err) {
      // L'echec etait avale dans la console : le salarie ne voyait rien.
      setTeleversementErreur(
        `Échec du téléversement : ${
          err instanceof Error ? err.message : "erreur inconnue"
        }`,
      );
    } finally {
      setPendingRequirementId(null);
    }
  };

  /** Ouvre un document stocke via une URL signee. */
  const ouvrirDocument = async (storageKey: string) => {
    try {
      const url = await getSignedUrl(storageKey);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setTeleversementErreur(
        `Impossible d'ouvrir le document : ${
          err instanceof Error ? err.message : "erreur inconnue"
        }`,
      );
    }
  };

  /**
   * Documents réels du salarié. L'onglet affichait une liste locale toujours
   * vide : même après un téléversement réussi, le tableau restait sur
   * « Aucun résultat ». On lit désormais la conformité renvoyée par l'API.
   */
  const exigences = useMemo(() => compliance ?? [], [compliance]);

  const documentsDeposes = useMemo(
    () => exigences.filter((c) => c.document),
    [exigences],
  );

  /** Exigence correspondant à un type donné (DPAE, DUE...), par son nom. */
  const trouverExigence = (motif: RegExp) =>
    exigences.find((c) => motif.test(c.requirement.name))?.requirement.id ??
    null;

  const exigenceDpae = trouverExigence(/dpae|d[ée]claration pr[ée]alable/i);
  const exigenceDue = trouverExigence(/^due$|d[ée]claration unique/i);
  const dpaeDeposees = documentsDeposes.filter((c) =>
    /dpae|due|d[ée]claration/i.test(c.requirement.name),
  );
  const autresDocuments = documentsDeposes.filter(
    (c) => !/dpae|due|d[ée]claration/i.test(c.requirement.name),
  );

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
    dracarLink: CNAPS_TELESERVICES_URL,
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
    openExternal(cnapsData?.dracarLink ?? CNAPS_TELESERVICES_URL);
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
      {/* DPAE/DUE */}
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
          {dpaeDeposees.length > 0 ? (
            <div className="space-y-3">
              {dpaeDeposees.map((c) => (
                <div
                  key={c.requirement.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{c.requirement.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.document?.name} — ajouté le{" "}
                        {formatDate(c.document!.createdAt)}
                      </p>
                    </div>
                  </div>
                  <RowActionsMenu
                    onView={() => void ouvrirDocument(c.document!.storageKey)}
                    onUpload={() => openFilePicker(c.requirement.id)}
                    uploadLabel="Remplacer"
                    onDownload={() =>
                      void ouvrirDocument(c.document!.storageKey)
                    }
                    onDelete={() => setDocASupprimer(c)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground mb-4">
                Aucune DPAE/DUE enregistrée
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  disabled={!exigenceDpae || uploadMutation.isPending}
                  onClick={() => exigenceDpae && openFilePicker(exigenceDpae)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Ajouter une DPAE
                </Button>
                <Button
                  variant="outline"
                  disabled={!exigenceDue || uploadMutation.isPending}
                  onClick={() => exigenceDue && openFilePicker(exigenceDue)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Ajouter une DUE
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <p className="text-sm text-muted-foreground">
            Chaque document correspond à une pièce attendue au dossier.
          </p>
        </CardHeader>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelected}
        />
        <CardContent>
          {exigences.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune pièce n&apos;est attendue pour ce salarié.
            </p>
          ) : (
            <ul className="space-y-2">
              {exigences
                .filter(
                  (c) => !/dpae|due|d[ée]claration/i.test(c.requirement.name),
                )
                .map((c) => (
                  <li
                    key={c.requirement.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {c.requirement.name}
                          {c.requirement.isRequired && (
                            <span className="ml-1 text-destructive">*</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.document
                            ? `${c.document.name} — ajouté le ${formatDate(c.document.createdAt)}`
                            : "Non fourni"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <RowActionsMenu
                        onView={
                          c.document
                            ? () => void ouvrirDocument(c.document!.storageKey)
                            : undefined
                        }
                        onUpload={() => openFilePicker(c.requirement.id)}
                        uploadLabel={c.document ? "Remplacer" : "Téléverser"}
                        onDownload={
                          c.document
                            ? () => void ouvrirDocument(c.document!.storageKey)
                            : undefined
                        }
                        onDelete={
                          c.document ? () => setDocASupprimer(c) : undefined
                        }
                        disabled={uploadMutation.isPending}
                      />
                    </div>
                  </li>
                ))}
            </ul>
          )}
          {televersementErreur && (
            <p className="mt-3 text-sm text-destructive">
              {televersementErreur}
            </p>
          )}
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
            label: deleteCertMutation.isPending
              ? "Suppression..."
              : "Supprimer",
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
                <Eye className="mr-2 h-4 w-4 text-green-600" />
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

      <Modal
        open={!!docASupprimer}
        onOpenChange={(ouvert) => !ouvert && setDocASupprimer(null)}
        type="confirmation"
        title="Retirer ce document ?"
        description={docASupprimer?.requirement.name}
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setDocASupprimer(null),
            variant: "outline",
          },
          primary: {
            label: suppressionDocument.isPending ? "Suppression…" : "Retirer",
            variant: "destructive",
            disabled: suppressionDocument.isPending,
            onClick: async () => {
              if (!docASupprimer) return;
              try {
                await suppressionDocument.mutateAsync(
                  docASupprimer.requirement.id,
                );
                setDocASupprimer(null);
              } catch (e) {
                setTeleversementErreur(
                  e instanceof Error ? e.message : "La suppression a échoué.",
                );
              }
            },
          },
        }}
      >
        <p className="text-sm text-muted-foreground">
          La pièce sera retirée du dossier et supprimée du stockage. Le salarié
          restera signalé comme non conforme tant qu&apos;aucune nouvelle pièce
          n&apos;est déposée.
        </p>
      </Modal>
    </div>
  );
}
