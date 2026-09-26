"use client";

import { useMemo, useState } from "react";
import { useEmployeeOptions } from "@/hooks/employees";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Download,
  FileText,
  CheckCircle,
  Clock,
  ClipboardCheck,
} from "lucide-react";
import type { OffboardingProcess } from "@/data/hr-offboarding";
import { useRegistre } from "@/hooks/fiscal/use-registre";

const AUCUN_FICHIER = [] as const;

const MOTIFS: Record<OffboardingProcess["reason"], string> = {
  resignation: "Démission",
  end_of_contract: "Fin de contrat",
  dismissal: "Licenciement",
  retirement: "Départ à la retraite",
  other: "Autre",
};

const STATUTS: OffboardingProcess["status"][] = [
  "En cours",
  "Terminé",
  "Annulé",
];

const DOCUMENTS: {
  cle: keyof OffboardingProcess["documentsGenerated"];
  libelle: string;
}[] = [
  { cle: "workCertificate", libelle: "Certificat de travail" },
  { cle: "poleEmploiCertificate", libelle: "Attestation Pôle Emploi" },
  { cle: "finalSettlement", libelle: "Reçu pour solde de tout compte" },
];

const VARIANTES_STATUT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  "En cours": "default",
  Terminé: "secondary",
  Annulé: "destructive",
};

const dateFr = (valeur: string | undefined) =>
  valeur ? new Date(valeur).toLocaleDateString("fr-FR") : "—";

/** Durée du préavis en jours, retrouvée depuis les dates enregistrées. */
const joursPreavis = (p: OffboardingProcess) => {
  const jours = Math.round(
    (new Date(p.noticePeriodEnd).getTime() -
      new Date(p.noticePeriodStart).getTime()) /
      86_400_000,
  );
  return Number.isFinite(jours) && jours >= 0 ? jours : 0;
};

const formulaireVide = () => ({
  employeeId: "",
  contractEndDate: "",
  noticePeriodDays: 30,
  reason: "resignation" as OffboardingProcess["reason"],
  status: "En cours" as OffboardingProcess["status"],
});

export default function OffboardingPage() {
  const employees = useEmployeeOptions();
  // Les sorties sont enregistrées en base (registre « sortie_salarie ») :
  // elles restaient dans l'état React et disparaissaient au rechargement.
  const registre = useRegistre<OffboardingProcess>(
    "sortie_salarie",
    AUCUN_FICHIER,
  );
  const processes = useMemo(
    () =>
      [...registre.lignes].sort((a, b) =>
        (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
      ),
    [registre.lignes],
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Ligne modifiée : son id est celui du serveur (un id local serait ignoré).
  const [editingId, setEditingId] = useState<string | null>(null);
  // « voir » : lecture seule ; « gerer » : documents, export paie, archivage.
  const [ouverte, setOuverte] = useState<{
    id: string;
    mode: "voir" | "gerer";
  } | null>(null);
  const [aSupprimerId, setASupprimerId] = useState<string | null>(null);
  const [suppression, setSuppression] = useState(false);
  // Relues depuis la liste enregistrée pour refléter les modifications.
  const selectedProcess = ouverte
    ? (processes.find((p) => p.id === ouverte.id) ?? null)
    : null;
  const aSupprimer = aSupprimerId
    ? (processes.find((p) => p.id === aSupprimerId) ?? null)
    : null;
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [formData, setFormData] = useState(formulaireVide);

  const inProgress = processes.filter((p) => p.status === "En cours").length;
  const completed = processes.filter((p) => p.status === "Terminé").length;

  const columns: ColumnDef<OffboardingProcess>[] = [
    {
      key: "employeeName",
      label: "Employé",
      sortable: true,
    },
    {
      key: "reason",
      label: "Motif",
      render: (process) => MOTIFS[process.reason] ?? "—",
    },
    {
      key: "contractEndDate",
      label: "Fin de contrat",
      render: (process) => dateFr(process.contractEndDate),
    },
    {
      key: "noticePeriodEnd",
      label: "Fin préavis",
      render: (process) => dateFr(process.noticePeriodEnd),
    },
    {
      key: "status",
      label: "Statut",
      render: (process) => (
        <Badge variant={VARIANTES_STATUT[process.status]}>
          {process.status}
        </Badge>
      ),
    },
    {
      key: "equipmentReturned",
      label: "Matériel",
      render: (process) =>
        process.equipmentReturned ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <Clock className="h-4 w-4 text-orange-600" />
        ),
    },
    {
      key: "documentsGenerated",
      label: "Documents",
      render: (process) => {
        const count = Object.values(process.documentsGenerated).filter(
          Boolean,
        ).length;
        return <Badge variant="outline">{count}/3</Badge>;
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (process) => (
        <RowActionsMenu
          onView={() => setOuverte({ id: process.id, mode: "voir" })}
          onEdit={() => handleEdit(process)}
          extraItems={[
            {
              label: "Documents, export paie et archivage",
              icon: ClipboardCheck,
              tone: "validate",
              onClick: () => setOuverte({ id: process.id, mode: "gerer" }),
            },
          ]}
          onDelete={() => setASupprimerId(process.id)}
        />
      ),
    },
  ];

  const handleCreate = () => {
    setEditingId(null);
    setFormData(formulaireVide());
    setErreur(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (process: OffboardingProcess) => {
    setEditingId(process.id);
    setFormData({
      employeeId: process.employeeId,
      contractEndDate: (process.contractEndDate ?? "").slice(0, 10),
      noticePeriodDays: joursPreavis(process),
      reason: process.reason ?? "other",
      status: process.status ?? "En cours",
    });
    setErreur(null);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async () => {
    if (!aSupprimer) return;
    setSuppression(true);
    try {
      await registre.supprimerLigne(aSupprimer.id);
      if (ouverte?.id === aSupprimer.id) setOuverte(null);
      setASupprimerId(null);
    } catch (e) {
      alert(
        `Échec de la suppression : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    } finally {
      setSuppression(false);
    }
  };

  /** Enregistre la sortie ; l'identifiant réel est celui renvoyé par le serveur. */
  const sauvegarder = (process: OffboardingProcess) =>
    registre.enregistrer(process, {
      period: (process.contractEndDate || new Date().toISOString()).slice(0, 7),
      label: `Sortie — ${process.employeeName}`,
      status: process.status,
    });

  const handleSave = async () => {
    const existante = editingId
      ? processes.find((p) => p.id === editingId)
      : undefined;
    const employee = employees.find((e) => e.id === formData.employeeId);
    // Salarié absent de la liste depuis la création : on garde le nom enregistré.
    if ((!employee && !existante) || !formData.contractEndDate) return;

    const endDate = new Date(formData.contractEndDate);
    const noticeStart = new Date(endDate);
    noticeStart.setDate(noticeStart.getDate() - formData.noticePeriodDays);

    const now = new Date().toISOString();
    const identite = employee
      ? {
          employeeId: employee.id,
          employeeName: employee.name,
          employeeNumber: employee.employeeNumber,
        }
      : {
          employeeId: existante!.employeeId,
          employeeName: existante!.employeeName,
          employeeNumber: existante!.employeeNumber,
        };
    const dates = {
      contractEndDate: formData.contractEndDate,
      noticePeriodStart: noticeStart.toISOString().split("T")[0],
      noticePeriodEnd: formData.contractEndDate,
    };
    setEnregistrement(true);
    setErreur(null);
    try {
      await sauvegarder(
        existante
          ? {
              ...existante,
              ...identite,
              ...dates,
              reason: formData.reason,
              status: formData.status,
              updatedAt: now,
            }
          : {
              id: "",
              ...identite,
              ...dates,
              reason: formData.reason,
              status: "En cours",
              equipmentReturned: false,
              documentsGenerated: {
                workCertificate: false,
                poleEmploiCertificate: false,
                finalSettlement: false,
              },
              payrollExported: false,
              fileArchived: false,
              createdAt: now,
              updatedAt: now,
            },
      );
      setIsCreateModalOpen(false);
    } catch (e) {
      setErreur(
        `Échec de l'enregistrement de la sortie : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    } finally {
      setEnregistrement(false);
    }
  };

  const handleRowClick = (process: OffboardingProcess) =>
    setOuverte({ id: process.id, mode: "gerer" });

  const majProcessus = async (
    processId: string,
    modifs: Partial<OffboardingProcess>,
    succes: string,
  ) => {
    const process = processes.find((p) => p.id === processId);
    if (!process) return;
    try {
      await sauvegarder({
        ...process,
        ...modifs,
        updatedAt: new Date().toISOString(),
      });
      alert(succes);
    } catch (e) {
      alert(
        `Échec de l'enregistrement : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    }
  };

  const handleGenerateDocument = (
    processId: string,
    docType: keyof OffboardingProcess["documentsGenerated"],
  ) => {
    const process = processes.find((p) => p.id === processId);
    if (!process) return;
    void majProcessus(
      processId,
      {
        documentsGenerated: { ...process.documentsGenerated, [docType]: true },
      },
      `Document ${docType} généré avec succès!`,
    );
  };

  const handleExportPayroll = (processId: string) => {
    void majProcessus(
      processId,
      { payrollExported: true },
      "Export paie effectué avec succès!",
    );
  };

  const handleArchiveFile = (processId: string) => {
    void majProcessus(
      processId,
      { fileArchived: true, status: "Terminé" },
      "Dossier archivé avec succès!",
    );
  };

  // Employé absent de la liste (ex. sortie modifiée après suppression du
  // salarié) : la ligne enregistrée reste modifiable, on l'ajoute au menu.
  const salarieInconnu =
    editingId && formData.employeeId
      ? !employees.some((e) => e.id === formData.employeeId)
      : false;
  const nomEnregistre = editingId
    ? (processes.find((p) => p.id === editingId)?.employeeName ?? "")
    : "";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sorties de salariés</h1>
          <p className="text-muted-foreground">
            Gestion des fins de contrat, préavis, retour d&apos;équipement et
            documents obligatoires
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle sortie
        </Button>
      </div>

      {/* Summary Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Clock}
          title="En cours"
          value={inProgress}
          subtext="Processus actifs"
          color="orange"
        />

        <InfoCard
          icon={CheckCircle}
          title="Terminés"
          value={completed}
          subtext="Cette année"
          color="green"
        />
      </InfoCardContainer>

      <DataTable
        data={processes}
        isLoading={registre.isLoading}
        columns={columns}
        searchKey="employeeName"
        searchPlaceholder="Rechercher un employé..."
        onRowClick={handleRowClick}
      />

      {/* Création / modification */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={editingId ? "Modifier la sortie" : "Nouvelle sortie"}
        description={
          editingId
            ? "Modifiez les informations de la sortie. Les documents déjà générés sont conservés."
            : "Enregistrez la fin de contrat d'un salarié et suivez les étapes de son départ."
        }
        size="lg"
        actions={{
          primary: {
            label: enregistrement
              ? "Enregistrement…"
              : editingId
                ? "Enregistrer"
                : "Créer",
            onClick: () => void handleSave(),
            disabled:
              enregistrement ||
              !formData.employeeId ||
              !formData.contractEndDate,
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
            <Label htmlFor="employeeId">Employé</Label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) =>
                setFormData({ ...formData, employeeId: value })
              }
            >
              <SelectTrigger id="employeeId">
                <SelectValue placeholder="Sélectionner un employé..." />
              </SelectTrigger>
              <SelectContent>
                {salarieInconnu && (
                  <SelectItem value={formData.employeeId}>
                    {nomEnregistre}
                  </SelectItem>
                )}
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Motif de la sortie</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  reason: value as OffboardingProcess["reason"],
                })
              }
            >
              <SelectTrigger id="reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MOTIFS).map(([valeur, libelle]) => (
                  <SelectItem key={valeur} value={valeur}>
                    {libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contractEndDate">Date de fin de contrat</Label>
            <Input
              id="contractEndDate"
              type="date"
              value={formData.contractEndDate}
              onChange={(e) =>
                setFormData({ ...formData, contractEndDate: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="noticePeriodDays">Durée du préavis (jours)</Label>
            <Input
              id="noticePeriodDays"
              type="number"
              min="0"
              value={formData.noticePeriodDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  noticePeriodDays: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>

          {editingId && (
            <div>
              <Label htmlFor="statut">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as OffboardingProcess["status"],
                  })
                }
              >
                <SelectTrigger id="statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUTS.map((statut) => (
                    <SelectItem key={statut} value={statut}>
                      {statut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
        </div>
      </Modal>

      {/* Voir : détail en lecture seule */}
      <Modal
        open={!!selectedProcess && ouverte?.mode === "voir"}
        onOpenChange={(open) => !open && setOuverte(null)}
        type="details"
        title="Détail de la sortie"
        size="lg"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setOuverte(null),
          },
        }}
      >
        {selectedProcess && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employé</Label>
                <p className="text-sm font-medium">
                  {selectedProcess.employeeName}
                  {selectedProcess.employeeNumber
                    ? ` (${selectedProcess.employeeNumber})`
                    : ""}
                </p>
              </div>
              <div>
                <Label>Statut</Label>
                <div>
                  <Badge variant={VARIANTES_STATUT[selectedProcess.status]}>
                    {selectedProcess.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Motif</Label>
                <p className="text-sm font-medium">
                  {MOTIFS[selectedProcess.reason] ?? "—"}
                </p>
              </div>
              <div>
                <Label>Durée du préavis</Label>
                <p className="text-sm font-medium">
                  {joursPreavis(selectedProcess)} jours
                </p>
              </div>
              <div>
                <Label>Début du préavis</Label>
                <p className="text-sm font-medium">
                  {dateFr(selectedProcess.noticePeriodStart)}
                </p>
              </div>
              <div>
                <Label>Fin du préavis</Label>
                <p className="text-sm font-medium">
                  {dateFr(selectedProcess.noticePeriodEnd)}
                </p>
              </div>
              <div>
                <Label>Date de fin de contrat</Label>
                <p className="text-sm font-medium">
                  {dateFr(selectedProcess.contractEndDate)}
                </p>
              </div>
              <div>
                <Label>Retour d&apos;équipement</Label>
                <p className="text-sm font-medium">
                  {selectedProcess.equipmentReturned
                    ? `Retourné${selectedProcess.equipmentReturnDate ? ` le ${dateFr(selectedProcess.equipmentReturnDate)}` : ""}`
                    : "Non retourné"}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <Label className="text-base font-semibold block">
                Documents générés
              </Label>
              {DOCUMENTS.map((doc) => (
                <div
                  key={doc.cle}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{doc.libelle}</span>
                  </div>
                  <Badge
                    variant={
                      selectedProcess.documentsGenerated[doc.cle]
                        ? "default"
                        : "outline"
                    }
                  >
                    {selectedProcess.documentsGenerated[doc.cle]
                      ? "Généré"
                      : "À générer"}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t grid grid-cols-2 gap-4">
              <div>
                <Label>Export vers la paie</Label>
                <div>
                  <Badge
                    variant={
                      selectedProcess.payrollExported ? "default" : "outline"
                    }
                  >
                    {selectedProcess.payrollExported ? "Exporté" : "À exporter"}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Archivage du dossier</Label>
                <div>
                  <Badge
                    variant={
                      selectedProcess.fileArchived ? "default" : "outline"
                    }
                  >
                    {selectedProcess.fileArchived ? "Archivé" : "À archiver"}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Créée le</Label>
                <p className="text-sm font-medium">
                  {dateFr(selectedProcess.createdAt)}
                </p>
              </div>
              <div>
                <Label>Dernière modification</Label>
                <p className="text-sm font-medium">
                  {dateFr(selectedProcess.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Documents, export paie et archivage */}
      <Modal
        open={!!selectedProcess && ouverte?.mode === "gerer"}
        onOpenChange={(open) => !open && setOuverte(null)}
        type="details"
        title="Détails du processus de fin de contrat"
        size="lg"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setOuverte(null),
          },
        }}
      >
        {selectedProcess && (
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employé</Label>
                <p className="text-sm font-medium">
                  {selectedProcess.employeeName}
                </p>
              </div>
              <div>
                <Label>Statut</Label>
                <div>
                  <Badge variant="default">{selectedProcess.status}</Badge>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de fin de contrat</Label>
                <p className="text-sm font-medium">
                  {dateFr(selectedProcess.contractEndDate)}
                </p>
              </div>
              <div>
                <Label>Début du préavis</Label>
                <p className="text-sm font-medium">
                  {dateFr(selectedProcess.noticePeriodStart)}
                </p>
              </div>
            </div>

            {/* Equipment Return Checklist */}
            <div className="pt-4 border-t">
              <Label className="text-base font-semibold mb-3 block">
                Retour d&apos;équipement
              </Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedProcess.equipmentReturned}
                    disabled
                  />
                  <Label className="text-sm">
                    Équipement retourné (PPE, radio, clés, etc.)
                  </Label>
                </div>
              </div>
            </div>

            {/* Documents Generation */}
            <div className="pt-4 border-t">
              <Label className="text-base font-semibold mb-3 block">
                Documents obligatoires
              </Label>
              <div className="space-y-3">
                {DOCUMENTS.map((doc) => (
                  <div
                    key={doc.cle}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{doc.libelle}</span>
                    </div>
                    {selectedProcess.documentsGenerated[doc.cle] ? (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Généré
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleGenerateDocument(selectedProcess.id, doc.cle)
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Générer
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t space-y-2">
              {!selectedProcess.payrollExported && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleExportPayroll(selectedProcess.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter vers la paie
                </Button>
              )}

              {!selectedProcess.fileArchived && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleArchiveFile(selectedProcess.id)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Archiver le dossier
                </Button>
              )}

              {selectedProcess.payrollExported &&
                selectedProcess.fileArchived && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">
                      ✓ Processus terminé - Tous les documents ont été générés
                      et le dossier est archivé
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation de suppression */}
      <Modal
        open={!!aSupprimer}
        onOpenChange={(open) => !open && setASupprimerId(null)}
        type="confirmation"
        title="Supprimer cette sortie ?"
        description={
          aSupprimer
            ? `La sortie de ${aSupprimer.employeeName} sera définitivement supprimée du registre. Cette action est irréversible.`
            : ""
        }
        actions={{
          primary: {
            label: suppression ? "Suppression…" : "Supprimer",
            variant: "destructive",
            onClick: () => void handleDelete(),
            disabled: suppression,
          },
          secondary: {
            label: "Annuler",
            variant: "outline",
            onClick: () => setASupprimerId(null),
          },
        }}
      >
        <p className="text-sm text-muted-foreground">
          Les documents déjà remis au salarié ne sont pas concernés.
        </p>
      </Modal>
    </div>
  );
}
