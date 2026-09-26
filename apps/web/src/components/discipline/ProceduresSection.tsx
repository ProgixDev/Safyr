"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useEmployeeOptions } from "@/hooks/employees";
import { useOrganization } from "@/hooks/organization";
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
import { Plus, CheckCircle, XCircle, FileText, Send } from "lucide-react";
import {
  BADGE_ROUGE,
  BADGE_VERT,
  BADGE_VIOLET,
  TEINTES,
} from "./discipline-theme";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Combobox } from "@/components/ui/combobox";
import { useRegistre } from "@/hooks/fiscal/use-registre";
import { downloadStoredFile, type StoredFile } from "@/lib/document-files";
import { CourrierDialog } from "./CourrierDialog";
import { ResponsableSelect, useResponsables } from "./ResponsableSelect";
import {
  CHAMPS_FICHIERS_PROCEDURE,
  NB_ETAPES_COURRIER,
  TYPES_SANCTION,
  dateFr,
  horodatage,
  type EtapeProcedure,
  type LigneProcedure,
} from "./discipline-shared";
import {
  genererPdfCourrier,
  modeleCourrier,
  type ContexteCourrier,
} from "./procedure-courriers";

const standardSteps: EtapeProcedure[] = [
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

const statusLabels = {
  ongoing: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

const statusClasses = {
  ongoing: BADGE_VIOLET,
  completed: BADGE_VERT,
  cancelled: BADGE_ROUGE,
} as const;

const teinte = TEINTES.procedures;

/** Valeur du menu « Sanction envisagée » qui efface le choix. */
const A_DEFINIR = "__a_definir__";

const formulaireVide = () => ({
  employeeId: "",
  startDate: new Date().toISOString().split("T")[0],
  steps: standardSteps.map((step) => ({ ...step })),
  status: "ongoing" as LigneProcedure["status"],
  reason: "",
  sanctionType: "",
  interviewDate: "",
  interviewTime: "",
  issuedBy: "",
});

type Formulaire = ReturnType<typeof formulaireVide>;

/** Document PDF généré à « Oui », rattaché à l'enregistrement de la procédure. */
interface DocumentEnAttente {
  file: File;
  /** Texte modifié à la main dans le courrier : on ne le régénère pas. */
  edite: boolean;
}

/** Courrier ouvert dans le dialogue d'envoi. */
interface CourrierOuvert {
  indice: number;
  /** Procédure déjà enregistrée : le document y est rattaché tout de suite. */
  procedureId: string | null;
  valeurs: Pick<
    Formulaire,
    | "employeeId"
    | "reason"
    | "sanctionType"
    | "interviewDate"
    | "interviewTime"
    | "issuedBy"
  > & { issuedByFonction?: string };
}

const pieceDeEtape = (
  procedure: LigneProcedure,
  indice: number,
): StoredFile | null =>
  (procedure[`etape_${indice + 1}` as "etape_1"] as
    | StoredFile
    | null
    | undefined) ?? null;

export function ProceduresSection() {
  const employees = useEmployeeOptions();
  const { data: organisation } = useOrganization();
  const { fonctionDe } = useResponsables();
  const employeeOptions = employees.map((employee) => ({
    value: employee.id,
    label: employee.name,
  }));
  // Les procédures sont enregistrées en base : elles restaient auparavant
  // dans l'état React et disparaissaient au rechargement de la page.
  const registre = useRegistre<LigneProcedure>(
    "procedure_disciplinaire",
    CHAMPS_FICHIERS_PROCEDURE,
  );
  const procedures = useMemo(
    () =>
      [...registre.lignes].sort(
        (a, b) => horodatage(b.startDate) - horodatage(a.startDate),
      ),
    [registre.lignes],
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Formulaire>(formulaireVide);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [docsEnAttente, setDocsEnAttente] = useState<
    Record<string, DocumentEnAttente>
  >({});
  const [courrier, setCourrier] = useState<CourrierOuvert | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  // Identifiant réel de la ligne créée : si l'envoi d'une pièce échoue après la
  // création, un nouvel essai met à jour cette ligne au lieu d'en créer une autre.
  const idCreeRef = useRef<string | null>(null);

  const viewingProcedure = viewingId
    ? (procedures.find((p) => p.id === viewingId) ?? null)
    : null;
  const editingProcedure = editingId
    ? (procedures.find((p) => p.id === editingId) ?? null)
    : null;

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? employee.name : "Employé inconnu";
  };

  const contexte = (v: CourrierOuvert["valeurs"]): ContexteCourrier => ({
    salarie: getEmployeeName(v.employeeId),
    entreprise: organisation?.name ?? "",
    adresseEntreprise: organisation?.address || undefined,
    motif: v.reason?.trim() || undefined,
    sanction: v.sanctionType || undefined,
    dateEntretien: v.interviewDate || undefined,
    heureEntretien: v.interviewTime || undefined,
    responsable: v.issuedBy || undefined,
    fonction: fonctionDe(v.issuedBy) || v.issuedByFonction || undefined,
  });

  const handleCreate = () => {
    setEditingId(null);
    idCreeRef.current = null;
    setFormData(formulaireVide());
    setDocumentFile(null);
    setDocsEnAttente({});
    setErreur(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (procedure: LigneProcedure) => {
    setEditingId(procedure.id);
    idCreeRef.current = null;
    setFormData({
      employeeId: procedure.employeeId ?? "",
      startDate: (procedure.startDate ?? "").slice(0, 10),
      steps: (procedure.steps ?? []).map((step) => ({ ...step })),
      status: procedure.status ?? "ongoing",
      reason: procedure.reason ?? "",
      sanctionType: procedure.sanctionType ?? "",
      interviewDate: procedure.interviewDate ?? "",
      interviewTime: procedure.interviewTime ?? "",
      issuedBy: procedure.issuedBy ?? "",
    });
    setDocumentFile(null);
    setDocsEnAttente({});
    setErreur(null);
    setIsCreateModalOpen(true);
  };

  const handleDelete = (procedureId: string) => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir supprimer cette procédure disciplinaire ?",
      )
    ) {
      void registre.supprimerLigne(procedureId);
    }
  };

  /** Enregistre la ligne (création ou mise à jour) et renvoie son identifiant réel. */
  const enregistrer = (ligne: LigneProcedure): Promise<string> =>
    registre.enregistrer(ligne, {
      period: (ligne.startDate || new Date().toISOString()).slice(0, 7),
      label: `Procédure disciplinaire — ${getEmployeeName(ligne.employeeId)}`,
      status: ligne.status,
    });

  const handleSave = async () => {
    setEnregistrement(true);
    setErreur(null);
    try {
      const ctx = contexte(formData);
      const id = await enregistrer({
        id: editingId ?? idCreeRef.current ?? "",
        employeeId: formData.employeeId,
        startDate: formData.startDate,
        steps: formData.steps,
        currentStep:
          formData.steps.findIndex((s) => !s.completed) + 1 ||
          formData.steps.length,
        status: formData.status,
        reason: formData.reason.trim(),
        sanctionType: formData.sanctionType,
        interviewDate: formData.interviewDate,
        interviewTime: formData.interviewTime,
        issuedBy: formData.issuedBy,
        issuedByFonction:
          fonctionDe(formData.issuedBy) ||
          (editingProcedure?.issuedBy === formData.issuedBy
            ? editingProcedure.issuedByFonction
            : "") ||
          "",
      });
      if (!editingId) idCreeRef.current = id;

      // Documents générés à « Oui » : rattachés à la procédure enregistrée.
      for (const [stepId, doc] of Object.entries(docsEnAttente)) {
        const indice = formData.steps.findIndex((s) => s.id === stepId);
        if (indice < 0 || indice >= NB_ETAPES_COURRIER) continue;
        // Date d'entretien, motif ou sanction ont pu changer depuis le « Oui ».
        const fichier = doc.edite
          ? doc.file
          : await genererPdfCourrier(indice, modeleCourrier(indice, ctx), ctx);
        await registre.attacherFichier(id, `etape_${indice + 1}`, fichier);
      }
      if (documentFile) {
        await registre.attacherFichier(id, "document", documentFile);
      }
      setDocsEnAttente({});
      setDocumentFile(null);
      setIsCreateModalOpen(false);
    } catch (e) {
      setErreur(
        `Échec de l'enregistrement : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    } finally {
      setEnregistrement(false);
    }
  };

  const handleStatusChange = (
    procedure: LigneProcedure,
    newStatus: LigneProcedure["status"],
  ) => {
    void enregistrer({ ...procedure, status: newStatus });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * « Terminée : Oui » génère aussitôt le courrier de l'étape en PDF (texte du
   * modèle), rattaché à la procédure à l'enregistrement. « Non » l'écarte.
   */
  const handleStepCompleted = async (
    indice: number,
    stepId: string,
    terminee: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              completed: terminee,
              completedAt: terminee
                ? (step.completedAt ?? new Date().toISOString())
                : undefined,
            }
          : step,
      ),
    }));
    if (!terminee) {
      setDocsEnAttente((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([cle]) => cle !== stepId),
        ),
      );
      return;
    }
    if (indice >= NB_ETAPES_COURRIER) return;
    try {
      const ctx = contexte(formData);
      const file = await genererPdfCourrier(
        indice,
        modeleCourrier(indice, ctx),
        ctx,
      );
      setDocsEnAttente((prev) => ({
        ...prev,
        [stepId]: { file, edite: false },
      }));
    } catch (e) {
      setErreur(
        `Le document de l'étape n'a pas pu être généré : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    }
  };

  // Depuis le formulaire, le document reste en attente jusqu'à l'enregistrement
  // (les valeurs saisies ne sont pas encore celles de la procédure).
  const ouvrirCourrierDepuisFormulaire = (indice: number) =>
    setCourrier({ indice, procedureId: null, valeurs: formData });

  const ouvrirCourrierProcedure = (
    procedure: LigneProcedure,
    indice?: number,
  ) => {
    const nb = Math.max((procedure.steps ?? []).length, 1);
    setCourrier({
      indice:
        indice ??
        Math.min(Math.max((procedure.currentStep ?? 1) - 1, 0), nb - 1),
      procedureId: procedure.id,
      valeurs: {
        employeeId: procedure.employeeId ?? "",
        reason: procedure.reason ?? "",
        sanctionType: procedure.sanctionType ?? "",
        interviewDate: procedure.interviewDate ?? "",
        interviewTime: procedure.interviewTime ?? "",
        issuedBy: procedure.issuedBy ?? "",
        issuedByFonction: procedure.issuedByFonction,
      },
    });
  };

  /**
   * Génère le PDF du courrier tel qu'il a été relu par l'utilisateur, et le
   * rattache : tout de suite si la procédure existe, sinon à l'enregistrement.
   */
  const produireDocument = async (
    ouvert: CourrierOuvert,
    objet: string,
    corps: string,
  ) => {
    const ctx = contexte(ouvert.valeurs);
    const modele = modeleCourrier(ouvert.indice, ctx);
    const fichier = await genererPdfCourrier(
      ouvert.indice,
      { ...modele, objet, corps },
      ctx,
    );
    if (ouvert.indice >= NB_ETAPES_COURRIER) return;
    if (ouvert.procedureId) {
      await registre.attacherFichier(
        ouvert.procedureId,
        `etape_${ouvert.indice + 1}`,
        fichier,
      );
      return;
    }
    const etape = formData.steps[ouvert.indice];
    if (etape) {
      setDocsEnAttente((prev) => ({
        ...prev,
        [etape.id]: { file: fichier, edite: true },
      }));
    }
  };

  const isFormValid = formData.employeeId && formData.startDate;

  const columns: ColumnDef<LigneProcedure>[] = [
    {
      key: "employeeId",
      label: "Employé",
      render: (procedure) => (
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
      key: "reason",
      label: "Motif",
      render: (procedure) => procedure.reason || "—",
    },
    {
      key: "startDate",
      label: "Date de début",
      render: (procedure) => dateFr(procedure.startDate),
    },
    {
      key: "currentStep",
      label: "Étape actuelle",
      render: (procedure) => (
        <div>
          Étape {procedure.currentStep} sur {(procedure.steps ?? []).length}
        </div>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (procedure) => (
        <Badge
          variant="outline"
          className={statusClasses[procedure.status ?? "ongoing"]}
        >
          {statusLabels[procedure.status ?? "ongoing"]}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (procedure) => (
        <RowActionsMenu
          onView={() => setViewingId(procedure.id)}
          onEdit={() => handleEdit(procedure)}
          onDelete={() => handleDelete(procedure.id)}
          extraItems={[
            {
              label: "Envoyer le courrier de l'étape",
              icon: Send,
              tone: "send",
              onClick: () => ouvrirCourrierProcedure(procedure),
            },
            ...(procedure.status === "ongoing"
              ? [
                  {
                    label: "Marquer terminée",
                    icon: CheckCircle,
                    tone: "validate" as const,
                    onClick: () => handleStatusChange(procedure, "completed"),
                  },
                  {
                    label: "Annuler",
                    icon: XCircle,
                    tone: "delete" as const,
                    destructive: true,
                    onClick: () => handleStatusChange(procedure, "cancelled"),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  const courrierEmployee = courrier
    ? employees.find((e) => e.id === courrier.valeurs.employeeId)
    : undefined;
  const courrierModele = courrier
    ? modeleCourrier(courrier.indice, contexte(courrier.valeurs))
    : null;
  const courrierEtapes = courrier
    ? courrier.procedureId
      ? (procedures.find((p) => p.id === courrier.procedureId)?.steps ?? [])
      : formData.steps
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`rounded-xl p-3 ${teinte.pastille}`}>
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${teinte.titre}`}>
              Procédures disciplinaires
            </h1>
            <p className="text-muted-foreground">
              Gestion des procédures disciplinaires
            </p>
          </div>
        </div>
        <Button
          onClick={handleCreate}
          size="lg"
          className={`gap-2 ${teinte.bouton}`}
        >
          <Plus className="h-4 w-4" />
          Nouvelle procédure
        </Button>
      </div>

      <Card className={teinte.carte}>
        <CardHeader className={`rounded-t-xl ${teinte.entete}`}>
          <CardTitle className={teinte.titre}>
            Procédures disciplinaires ({procedures.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={procedures}
            isLoading={registre.isLoading}
            columns={columns}
            getSearchValue={(p) =>
              `${getEmployeeName(p.employeeId)} ${p.reason ?? ""} ${p.sanctionType ?? ""}`
            }
            searchPlaceholder="Rechercher des procédures..."
          />
        </CardContent>
      </Card>

      {/* Création / modification */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={
          editingId
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
            label: enregistrement
              ? "Enregistrement…"
              : editingId
                ? "Enregistrer"
                : "Créer",
            onClick: () => void handleSave(),
            disabled: !isFormValid || enregistrement,
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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reason">Motif</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange("reason", e.target.value)}
                placeholder="Ex : abandon de poste"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sanctionType">Sanction envisagée</Label>
              <Select
                value={formData.sanctionType || undefined}
                onValueChange={(value) =>
                  handleInputChange(
                    "sanctionType",
                    value === A_DEFINIR ? "" : value,
                  )
                }
              >
                <SelectTrigger id="sanctionType">
                  <SelectValue placeholder="À définir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={A_DEFINIR}>À définir</SelectItem>
                  {TYPES_SANCTION.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuedBy">Responsable (signataire)</Label>
              <ResponsableSelect
                id="issuedBy"
                value={formData.issuedBy}
                onChange={(nom) => handleInputChange("issuedBy", nom)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewDate">Date de l&apos;entretien</Label>
              <Input
                id="interviewDate"
                type="date"
                value={formData.interviewDate}
                onChange={(e) =>
                  handleInputChange("interviewDate", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interviewTime">Heure de l&apos;entretien</Label>
              <Input
                id="interviewTime"
                type="time"
                value={formData.interviewTime}
                onChange={(e) =>
                  handleInputChange("interviewTime", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: LigneProcedure["status"]) =>
                  handleInputChange("status", value)
                }
              >
                <SelectTrigger id="status">
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

          {/* Étapes : un courrier prêt à envoyer par étape */}
          <div className="space-y-4">
            <Label>Étapes de la procédure</Label>
            <div className="space-y-4">
              {formData.steps.map((step, index) => {
                const enAttente = docsEnAttente[step.id];
                const rattache = editingProcedure
                  ? pieceDeEtape(editingProcedure, index)
                  : null;
                return (
                  <div
                    key={step.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium">
                        Étape {index + 1} : {step.title}
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!formData.employeeId}
                        onClick={() => ouvrirCourrierDepuisFormulaire(index)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Courrier prêt à envoyer
                      </Button>
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
                        disabled={!formData.employeeId}
                        onValueChange={(value) =>
                          void handleStepCompleted(
                            index,
                            step.id,
                            value === "true",
                          )
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
                      {!formData.employeeId ? (
                        <p className="text-xs text-muted-foreground">
                          Sélectionnez d&apos;abord un employé.
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Le document de l&apos;étape est généré automatiquement
                          (PDF) dès que vous choisissez « Oui ».
                        </p>
                      )}
                    </div>
                    {enAttente && (
                      <p className="text-sm">
                        <FileText className="inline h-4 w-4 mr-1 text-primary" />
                        Document généré : {enAttente.file.name} (rattaché à
                        l&apos;enregistrement)
                      </p>
                    )}
                    {!enAttente && rattache && (
                      <p className="text-sm">
                        <FileText className="inline h-4 w-4 mr-1 text-primary" />
                        Document rattaché :{" "}
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => void downloadStoredFile(rattache)}
                        >
                          {rattache.name}
                        </button>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">Document</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="document"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
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

          {erreur && <p className="text-sm text-destructive">{erreur}</p>}
        </div>
      </Modal>

      {/* Détails */}
      <Modal
        open={!!viewingProcedure}
        onOpenChange={(open) => !open && setViewingId(null)}
        type="details"
        title="Détails de la procédure disciplinaire"
        description={
          viewingProcedure
            ? `${getEmployeeName(viewingProcedure.employeeId)} - Étape ${viewingProcedure.currentStep} sur ${(viewingProcedure.steps ?? []).length}`
            : ""
        }
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setViewingId(null),
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
                  {dateFr(viewingProcedure.startDate)}
                </p>
              </div>
              <div>
                <Label>Motif</Label>
                <p className="text-sm font-medium">
                  {viewingProcedure.reason || "—"}
                </p>
              </div>
              <div>
                <Label>Sanction envisagée</Label>
                <p className="text-sm font-medium">
                  {viewingProcedure.sanctionType || "—"}
                </p>
              </div>
              <div>
                <Label>Entretien préalable</Label>
                <p className="text-sm font-medium">
                  {viewingProcedure.interviewDate
                    ? `${dateFr(viewingProcedure.interviewDate)}${viewingProcedure.interviewTime ? ` à ${viewingProcedure.interviewTime}` : ""}`
                    : "—"}
                </p>
              </div>
              <div>
                <Label>Responsable</Label>
                <p className="text-sm font-medium">
                  {viewingProcedure.issuedBy || "—"}
                </p>
              </div>
              <div>
                <Label>Étape actuelle</Label>
                <p className="text-sm font-medium">
                  {viewingProcedure.currentStep} sur{" "}
                  {(viewingProcedure.steps ?? []).length}
                </p>
              </div>
              <div>
                <Label>Statut</Label>
                <Badge
                  variant="outline"
                  className={
                    statusClasses[viewingProcedure.status ?? "ongoing"]
                  }
                >
                  {statusLabels[viewingProcedure.status ?? "ongoing"]}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Étapes</Label>
              <div className="space-y-2">
                {(viewingProcedure.steps ?? []).map((step, index) => {
                  const piece = pieceDeEtape(viewingProcedure, index);
                  return (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          Étape {index + 1} : {step.title}
                        </h4>
                        <Badge
                          variant={step.completed ? "default" : "secondary"}
                        >
                          {step.completed ? "Terminée" : "En cours"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {step.description}
                      </p>
                      {step.completed && step.completedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Terminée le {dateFr(step.completedAt)}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {piece && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void downloadStoredFile(piece)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ouvrir le document
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            ouvrirCourrierProcedure(viewingProcedure, index)
                          }
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Courrier prêt à envoyer
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {viewingProcedure.document && (
              <div>
                <Label>Document joint</Label>
                <div className="mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void downloadStoredFile(viewingProcedure.document!)
                    }
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {viewingProcedure.document.name}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Courrier de l'étape : modèle prêt à envoyer, document généré ensuite */}
      {courrier && courrierModele && (
        <CourrierDialog
          key={`${courrier.procedureId ?? "nouvelle"}-${courrier.indice}`}
          titre={`Courrier de l'étape ${courrier.indice + 1}${courrierEtapes[courrier.indice] ? ` : ${courrierEtapes[courrier.indice].title}` : ""}`}
          destinataireNom={getEmployeeName(courrier.valeurs.employeeId)}
          destinataireEmail={courrierEmployee?.email ?? ""}
          objetInitial={courrierModele.objet}
          corpsInitial={courrierModele.corps}
          note={
            courrierModele.mention
              ? `L'e-mail sert de copie : ce courrier doit aussi être adressé par ${courrierModele.mention.charAt(0).toLowerCase()}${courrierModele.mention.slice(1)}. Le document PDF généré porte cette mention. Une fois le courrier envoyé, le document est généré automatiquement et rattaché à la procédure.`
              : undefined
          }
          libelleGenerer="Générer le document (sans envoi)"
          onClose={() => setCourrier(null)}
          onEnvoye={(objet, corps) => produireDocument(courrier, objet, corps)}
          onGenerer={(objet, corps) => produireDocument(courrier, objet, corps)}
        />
      )}
    </div>
  );
}
