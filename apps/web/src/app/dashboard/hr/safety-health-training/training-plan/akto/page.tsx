"use client";

import { useState } from "react";
import Link from "next/link";

import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ExternalLink,
  FileText,
  FolderOpen,
  RefreshCcw,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { cn } from "@/lib/utils";
import { type StoredFile } from "@/lib/document-files";
import { useRegistre } from "@/hooks/fiscal";
import { useEmployeeOptions } from "@/hooks/employees";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  STATUTS_DOSSIER,
  TEINTES,
  TEINTE_STATUT_DOSSIER,
  normaliserStatutDossier,
  type StatutDossier,
} from "@/components/safety-training/couleurs";
import { SelectStatutDossier } from "@/components/safety-training/statut-dossier";
import { MenuPiece } from "@/components/safety-training/menu-piece";

/**
 * Pièces attendues d'un dossier de financement : devis du prestataire,
 * convention de formation signée, puis facture. Elles étaient auparavant
 * mélangées dans une simple liste de noms de fichiers, sans possibilité de
 * savoir laquelle manquait.
 */
const DOCUMENT_SLOTS = [
  { key: "devis", label: "Devis" },
  { key: "convention", label: "Convention de formation" },
  { key: "facture", label: "Facture" },
] as const;

type DocumentSlot = (typeof DOCUMENT_SLOTS)[number]["key"];

type DossierDocuments = Partial<Record<DocumentSlot, StoredFile>>;

interface AKTOOPCODossier {
  id: string;
  reference: string;
  type: "AKTO" | "OPCO";
  title: string;
  /** Salariés concernés : identifiants, et noms figés à l'enregistrement. */
  employeeIds?: string[];
  employeeNames?: string[];
  /** Ancien champ à salarié unique, lu pour les dossiers déjà enregistrés. */
  employeeName?: string;
  trainingType: string;
  /** Dates de la formation (AAAA-MM-JJ). */
  startDate?: string;
  endDate?: string;
  amount: number;
  status: StatutDossier;
  accountUrl?: string;
  createdAt: string;
  validatedAt?: string;
  documents: DossierDocuments;
}

const CHAMPS_PIECES = ["devis", "convention", "facture"] as const;

/** Dossier tel qu'enregistré : les pièces sont des champs de premier niveau. */
type DossierEnregistre = Omit<AKTOOPCODossier, "documents"> &
  Partial<Record<DocumentSlot, StoredFile | null>>;

/** Retire les pièces (déjà rattachées à part) avant d'enregistrer la ligne. */
function versEnregistre(dossier: AKTOOPCODossier): DossierEnregistre {
  const { documents, ...reste } = dossier;
  void documents;
  return reste as DossierEnregistre;
}

const AKTO_URL = "https://www.akto.fr";
const URL_DOCUMENTS =
  "/dashboard/hr/safety-health-training/training-plan/akto/documents";

const FORMULAIRE_VIDE = {
  type: "AKTO" as "AKTO" | "OPCO",
  title: "",
  employeeIds: [] as string[],
  trainingType: "",
  startDate: "",
  endDate: "",
  amount: "",
  accountUrl: "",
};

const dateFr = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";

/** Noms des salariés d'un dossier, y compris pour l'ancien champ à salarié unique. */
function nomsSalaries(dossier: AKTOOPCODossier): string[] {
  if (dossier.employeeNames?.length) return dossier.employeeNames;
  return dossier.employeeName ? [dossier.employeeName] : [];
}

export default function AKTOOPCOPage() {
  // Les salariés se choisissent dans la liste (plusieurs possibles) : c'était
  // une saisie libre, sujette aux fautes de frappe et sans lien avec le dossier.
  const salaries = useEmployeeOptions();
  const optionsSalaries = salaries.map((salarie) => ({
    value: salarie.id,
    label: salarie.name,
    description: salarie.matricule || undefined,
  }));
  const nomDe = (id: string) =>
    salaries.find((salarie) => salarie.id === id)?.name ?? id;

  // Dossiers enregistrés en base : ils ne vivaient qu'en mémoire, et les
  // pièces déposées disparaissaient à la déconnexion.
  const registre = useRegistre<DossierEnregistre>("akto", CHAMPS_PIECES);
  const dossiers: AKTOOPCODossier[] = registre.lignes.map((ligne) => ({
    ...(ligne as unknown as AKTOOPCODossier),
    status: normaliserStatutDossier(ligne.status),
    documents: Object.fromEntries(
      CHAMPS_PIECES.filter((champ) => ligne[champ]).map((champ) => [
        champ,
        ligne[champ] as StoredFile,
      ]),
    ) as DossierDocuments,
  }));

  const infosDossier = (d: AKTOOPCODossier) => ({
    period: (d.startDate || d.createdAt || "").slice(0, 4),
    label: d.title,
    status: d.status,
    amount: d.amount,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // On garde l'identifiant, pas une copie du dossier : la fiche reflète ainsi
  // les pièces déposées ou le statut modifié sans avoir à être rouverte.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statutId, setStatutId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(FORMULAIRE_VIDE);

  const selectedDossier = dossiers.find((d) => d.id === selectedId) ?? null;
  const dossierStatut = dossiers.find((d) => d.id === statutId) ?? null;

  const aktoDossiers = dossiers.filter((d) => d.type === "AKTO");
  const opcoDossiers = dossiers.filter((d) => d.type === "OPCO");
  const parStatut = (statut: StatutDossier) =>
    dossiers.filter((d) => d.status === statut).length;

  const periodeInvalide =
    Boolean(formData.startDate && formData.endDate) &&
    formData.endDate < formData.startDate;

  const columns: ColumnDef<AKTOOPCODossier>[] = [
    {
      key: "reference",
      label: "Référence",
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      render: (dossier) => {
        const variants: Record<string, "default" | "secondary"> = {
          AKTO: "default",
          OPCO: "secondary",
        };
        return <Badge variant={variants[dossier.type]}>{dossier.type}</Badge>;
      },
    },
    {
      key: "title",
      label: "Titre",
      render: (dossier) => <span className="font-medium">{dossier.title}</span>,
    },
    {
      key: "employeeNames",
      label: "Salariés",
      render: (dossier) => {
        const noms = nomsSalaries(dossier);
        if (noms.length === 0) return "Groupe";
        return (
          <span title={noms.join(", ")}>
            {noms.length <= 2
              ? noms.join(", ")
              : `${noms[0]} +${noms.length - 1}`}
          </span>
        );
      },
    },
    {
      key: "trainingType",
      label: "Formation",
    },
    {
      key: "startDate",
      label: "Début",
      sortable: true,
      render: (dossier) => dateFr(dossier.startDate),
    },
    {
      key: "endDate",
      label: "Fin",
      sortable: true,
      render: (dossier) => dateFr(dossier.endDate),
    },
    {
      key: "amount",
      label: "Montant",
      render: (dossier) => (
        <span className="font-semibold">
          {dossier.amount.toLocaleString("fr-FR")} €
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      // Modifiable directement dans le tableau : Créé, Refusé, Validé, Archivé.
      render: (dossier) => (
        <SelectStatutDossier
          statut={dossier.status}
          onChange={(statut) => changerStatut(dossier, statut)}
        />
      ),
    },
    // Vue globale : une colonne par pièce, pour voir d'un coup d'œil ce qui
    // manque sur chaque dossier sans avoir à l'ouvrir.
    ...DOCUMENT_SLOTS.map<ColumnDef<AKTOOPCODossier>>(({ key, label }) => ({
      key,
      label,
      // Un menu d'actions par colonne plutot qu'une paire de boutons : avec
      // trois pieces par dossier le tableau devenait illisible.
      render: (dossier) => {
        const fichier = dossier.documents[key];
        return (
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-xs",
                fichier ? "text-foreground" : "text-muted-foreground",
              )}
              title={fichier?.name}
            >
              {fichier ? fichier.name : "Non fourni"}
            </span>
            <MenuPiece
              fichier={fichier}
              onUpload={() => void handleUploadDocument(dossier, key)}
              onDelete={() => handleRemoveDocument(dossier, key)}
            />
          </div>
        );
      },
    })),
  ];

  const handleCreate = () => {
    setEditingId(null);
    setFormData(FORMULAIRE_VIDE);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (dossier: AKTOOPCODossier) => {
    setEditingId(dossier.id);
    // Un dossier ancien n'a que le nom du salarié : on retrouve son identifiant
    // dans la liste, sinon on garde le nom tel quel pour ne pas le perdre.
    const ids =
      dossier.employeeIds && dossier.employeeIds.length > 0
        ? dossier.employeeIds
        : nomsSalaries(dossier).map(
            (nom) => salaries.find((s) => s.name === nom)?.id ?? nom,
          );
    setFormData({
      type: dossier.type,
      title: dossier.title,
      employeeIds: ids,
      trainingType: dossier.trainingType,
      startDate: dossier.startDate ?? "",
      endDate: dossier.endDate ?? "",
      amount: String(dossier.amount),
      accountUrl: dossier.accountUrl ?? "",
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (dossierId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce dossier ?")) {
      if (selectedId === dossierId) setSelectedId(null);
      void registre.supprimerLigne(dossierId);
    }
  };

  const handleSave = () => {
    const champsFormulaire = {
      type: formData.type,
      title: formData.title,
      employeeIds: formData.employeeIds,
      employeeNames: formData.employeeIds.map(nomDe),
      // L'ancien champ à salarié unique est remplacé par la liste.
      employeeName: undefined,
      trainingType: formData.trainingType,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      amount: parseFloat(formData.amount) || 0,
      accountUrl: formData.accountUrl || undefined,
    };
    if (editingId) {
      const existant = dossiers.find((d) => d.id === editingId);
      if (existant) {
        const misAJour: AKTOOPCODossier = { ...existant, ...champsFormulaire };
        void registre.enregistrer(
          versEnregistre(misAJour),
          infosDossier(misAJour),
        );
      }
      setEditingId(null);
      setIsCreateModalOpen(false);
      return;
    }
    // Numéro suivant : le plus grand déjà attribué + 1 (et non le nombre de
    // dossiers, qui redonnait un numéro existant après une suppression).
    const annee = new Date().getFullYear();
    const prefixe = `${formData.type}-${annee}-`;
    const dernier = Math.max(
      0,
      ...dossiers
        .filter((d) => d.reference?.startsWith(prefixe))
        .map((d) => parseInt(d.reference.slice(prefixe.length), 10) || 0),
    );
    const newDossier: AKTOOPCODossier = {
      ...champsFormulaire,
      // Ignoré à la création : c'est le serveur qui attribue l'identifiant.
      id: "",
      reference: `${prefixe}${String(dernier + 1).padStart(3, "0")}`,
      status: "Créé",
      createdAt: new Date().toISOString().split("T")[0],
      documents: {},
    };
    void registre.enregistrer(
      versEnregistre(newDossier),
      infosDossier(newDossier),
    );
    setIsCreateModalOpen(false);
  };

  const handleRowClick = (dossier: AKTOOPCODossier) => {
    setSelectedId(dossier.id);
  };

  /** Change le statut du dossier ; la date de validation suit le statut « Validé ». */
  const changerStatut = (dossier: AKTOOPCODossier, statut: StatutDossier) => {
    if (statut === dossier.status) return;
    const misAJour: AKTOOPCODossier = {
      ...dossier,
      status: statut,
      validatedAt:
        statut === "Validé"
          ? new Date().toISOString().split("T")[0]
          : dossier.validatedAt,
    };
    void registre.enregistrer(versEnregistre(misAJour), infosDossier(misAJour));
  };

  /** Attache (ou remplace) une pièce du dossier : devis, convention, facture. */
  const handleUploadDocument = async (
    dossier: AKTOOPCODossier,
    slot: DocumentSlot,
  ) => {
    try {
      await registre.televerserPiece(
        versEnregistre(dossier),
        slot,
        infosDossier(dossier),
      );
    } catch (e) {
      alert(
        `Échec du téléversement : ${
          e instanceof Error ? e.message : "Erreur inconnue"
        }`,
      );
    }
  };

  const handleRemoveDocument = (
    dossier: AKTOOPCODossier,
    slot: DocumentSlot,
  ) => {
    void registre.retirerPiece(dossier.id, slot);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AKTO et OPCO</h1>
          <p className="text-muted-foreground">
            Accès direct aux comptes, création et suivi des dossiers de
            formation
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={URL_DOCUMENTS}>
              <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
              Documents AKTO
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={AKTO_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              AKTO
            </a>
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau dossier
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={FileText}
          title="Dossiers"
          value={dossiers.length}
          subtext={`${aktoDossiers.length} AKTO · ${opcoDossiers.length} OPCO · ${parStatut("Archivé")} archivé(s)`}
          color="blue"
        />

        <InfoCard
          icon={Clock}
          title="Créés"
          value={parStatut("Créé")}
          subtext="En attente de réponse"
          color="orange"
        />

        <InfoCard
          icon={CheckCircle}
          title="Validés"
          value={parStatut("Validé")}
          color="green"
        />

        <InfoCard
          icon={XCircle}
          title="Refusés"
          value={parStatut("Refusé")}
          color="red"
        />
      </InfoCardContainer>

      <DataTable
        data={dossiers}
        columns={columns}
        searchKey="title"
        searchPlaceholder="Rechercher un dossier..."
        onRowClick={handleRowClick}
        actions={(dossier) => (
          <RowActionsMenu
            onView={() => handleRowClick(dossier)}
            onEdit={() => handleEdit(dossier)}
            extraItems={[
              {
                label: "Modifier le statut",
                icon: RefreshCcw,
                tone: "neutral",
                onClick: () => setStatutId(dossier.id),
              },
            ]}
            onDelete={() => handleDelete(dossier.id)}
          />
        )}
      />

      {/* Create Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={
          editingId
            ? "Modifier le dossier AKTO/OPCO"
            : "Nouveau dossier AKTO/OPCO"
        }
        size="lg"
        actions={{
          primary: {
            label: editingId ? "Enregistrer" : "Créer",
            onClick: handleSave,
            disabled: !formData.title.trim() || periodeInvalide,
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
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as "AKTO" | "OPCO" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AKTO">AKTO</SelectItem>
                <SelectItem value="OPCO">OPCO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Titre du dossier</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Formation SSIAP 1 - Jean Dupont"
            />
          </div>

          <div>
            <Label htmlFor="employeeIds">
              Salariés (optionnel - laisser vide pour formation groupe)
            </Label>
            <MultiSelect
              id="employeeIds"
              options={optionsSalaries}
              value={formData.employeeIds}
              onValueChange={(ids) =>
                setFormData({ ...formData, employeeIds: ids })
              }
              placeholder="Sélectionner un ou plusieurs salariés"
              searchPlaceholder="Rechercher un salarié..."
              emptyMessage="Aucun salarié trouvé."
            />
          </div>

          <div>
            <Label htmlFor="trainingType">Type de formation</Label>
            <Select
              value={formData.trainingType}
              onValueChange={(value) =>
                setFormData({ ...formData, trainingType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SSIAP 1">SSIAP 1</SelectItem>
                <SelectItem value="SSIAP 2">SSIAP 2</SelectItem>
                <SelectItem value="SSIAP 3">SSIAP 3</SelectItem>
                <SelectItem value="SST">SST</SelectItem>
                <SelectItem value="MAC/CQP">MAC / CQP</SelectItem>
                <SelectItem value="MAC/SST">MAC / SST</SelectItem>
                <SelectItem value="H0B0">H0B0</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Date de début de la formation</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="endDate">Date de fin de la formation</Label>
              <Input
                id="endDate"
                type="date"
                min={formData.startDate || undefined}
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                aria-invalid={periodeInvalide}
              />
            </div>
            {periodeInvalide && (
              <p className="col-span-2 text-xs text-destructive">
                La date de fin doit être postérieure ou égale à la date de
                début.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Montant (€)</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="1200"
            />
          </div>

          <div>
            <Label htmlFor="accountUrl">URL du compte (optionnel)</Label>
            <Input
              id="accountUrl"
              type="url"
              value={formData.accountUrl}
              onChange={(e) =>
                setFormData({ ...formData, accountUrl: e.target.value })
              }
              placeholder="https://..."
            />
          </div>
        </div>
      </Modal>

      {/* Modifier le statut (menu d'actions) */}
      <Modal
        open={dossierStatut !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setStatutId(null);
        }}
        type="form"
        title="Modifier le statut du dossier"
        description={dossierStatut?.title}
        size="sm"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setStatutId(null),
            variant: "outline",
          },
        }}
      >
        {dossierStatut && (
          <div className="grid gap-2">
            {STATUTS_DOSSIER.map((statut) => (
              <Button
                key={statut}
                type="button"
                variant="outline"
                className={cn(
                  "justify-between border",
                  TEINTES[TEINTE_STATUT_DOSSIER[statut]],
                  dossierStatut.status === statut && "ring-2 ring-offset-1",
                )}
                onClick={() => {
                  changerStatut(dossierStatut, statut);
                  setStatutId(null);
                }}
              >
                {statut}
                {dossierStatut.status === statut && (
                  <span className="text-xs font-normal">Statut actuel</span>
                )}
              </Button>
            ))}
          </div>
        )}
      </Modal>

      {/* View Modal */}
      <Modal
        open={selectedDossier !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setSelectedId(null);
        }}
        type="details"
        title="Détails du dossier"
        size="lg"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setSelectedId(null),
          },
        }}
      >
        {selectedDossier && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Référence</Label>
                <p className="text-sm font-medium">
                  {selectedDossier.reference}
                </p>
              </div>
              <div>
                <Label>Type</Label>
                <Badge
                  variant={
                    selectedDossier.type === "AKTO" ? "default" : "secondary"
                  }
                >
                  {selectedDossier.type}
                </Badge>
              </div>
            </div>

            <div>
              <Label>Titre</Label>
              <p className="text-sm font-medium">{selectedDossier.title}</p>
            </div>

            {nomsSalaries(selectedDossier).length > 0 && (
              <div>
                <Label>Salariés</Label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {nomsSalaries(selectedDossier).map((nom) => (
                    <Badge key={nom} variant="secondary">
                      {nom}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de formation</Label>
                <p className="text-sm font-medium">
                  {selectedDossier.trainingType}
                </p>
              </div>
              <div>
                <Label>Montant</Label>
                <p className="text-sm font-semibold">
                  {selectedDossier.amount.toLocaleString("fr-FR")} €
                </p>
              </div>
              <div>
                <Label>Début de la formation</Label>
                <p className="text-sm font-medium">
                  {dateFr(selectedDossier.startDate)}
                </p>
              </div>
              <div>
                <Label>Fin de la formation</Label>
                <p className="text-sm font-medium">
                  {dateFr(selectedDossier.endDate)}
                </p>
              </div>
            </div>

            <div>
              <Label>Statut</Label>
              <div className="mt-1">
                <SelectStatutDossier
                  statut={selectedDossier.status}
                  onChange={(statut) => changerStatut(selectedDossier, statut)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {selectedDossier.accountUrl && (
              <div>
                <Label>Lien vers le compte</Label>
                <Button variant="outline" size="sm" asChild className="mt-2">
                  <a
                    href={selectedDossier.accountUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir le compte
                  </a>
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label>Date de création</Label>
                <p className="text-sm font-medium">
                  {dateFr(selectedDossier.createdAt)}
                </p>
              </div>
              {selectedDossier.status === "Validé" &&
                selectedDossier.validatedAt && (
                  <div>
                    <Label>Date de validation</Label>
                    <p className="text-sm font-medium text-green-600">
                      {dateFr(selectedDossier.validatedAt)}
                    </p>
                  </div>
                )}
            </div>

            {/* Vue détaillée : une ligne par pièce du dossier de financement */}
            <div className="pt-4 border-t">
              <div className="mb-3 flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Documents du dossier
                </Label>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={URL_DOCUMENTS}>
                    <FolderOpen className="h-3.5 w-3.5 mr-1 text-blue-500" />
                    Tous les documents AKTO
                  </Link>
                </Button>
              </div>
              <div className="space-y-2">
                {DOCUMENT_SLOTS.map(({ key, label }) => {
                  const fichier = selectedDossier.documents[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-lg border p-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {fichier?.name ?? "Non fourni"}
                        </p>
                      </div>
                      <MenuPiece
                        fichier={fichier}
                        onUpload={() =>
                          void handleUploadDocument(selectedDossier, key)
                        }
                        onDelete={() =>
                          handleRemoveDocument(selectedDossier, key)
                        }
                      />
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
