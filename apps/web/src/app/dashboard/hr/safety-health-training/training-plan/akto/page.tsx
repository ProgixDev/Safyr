"use client";

import { useState } from "react";

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
  Clock,
  CheckCircle,
  Download,
  Upload,
  Trash2,
} from "lucide-react";
import {
  RowActionsMenu,
  DocumentActionsMenu,
} from "@/components/ui/row-actions-menu";
import { cn } from "@/lib/utils";
import {
  pickAndUploadFile,
  downloadStoredFile,
  type StoredFile,
} from "@/lib/document-files";

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
  employeeId?: string;
  employeeName?: string;
  trainingType: string;
  amount: number;
  status: "À créer" | "En cours" | "Soumis" | "Validé" | "Refusé";
  accountUrl?: string;
  createdAt: string;
  submittedAt?: string;
  validatedAt?: string;
  documents: DossierDocuments;
}

const mockDossiers: AKTOOPCODossier[] = [];

const AKTO_URL = "https://www.akto.fr";

export default function AKTOOPCOPage() {
  const [dossiers, setDossiers] = useState<AKTOOPCODossier[]>(mockDossiers);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] =
    useState<AKTOOPCODossier | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "AKTO" as "AKTO" | "OPCO",
    title: "",
    employeeName: "",
    trainingType: "",
    amount: "",
    accountUrl: "",
  });

  const aktoDossiers = dossiers.filter((d) => d.type === "AKTO");
  const opcoDossiers = dossiers.filter((d) => d.type === "OPCO");
  const inProgress = dossiers.filter((d) => d.status === "En cours").length;
  const validated = dossiers.filter((d) => d.status === "Validé").length;

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
      key: "employeeName",
      label: "Employé",
      render: (dossier) => dossier.employeeName || "Groupe",
    },
    {
      key: "trainingType",
      label: "Formation",
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
      render: (dossier) => {
        const variants: Record<
          string,
          "default" | "secondary" | "outline" | "destructive"
        > = {
          "À créer": "outline",
          "En cours": "default",
          Soumis: "secondary",
          Validé: "default",
          Refusé: "destructive",
        };
        return (
          <Badge variant={variants[dossier.status]}>{dossier.status}</Badge>
        );
      },
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
            <DocumentActionsMenu
              onUpload={() => void handleUploadDocument(dossier, key)}
              onDownload={
                fichier ? () => void downloadStoredFile(fichier) : undefined
              }
              onDelete={
                fichier ? () => handleRemoveDocument(dossier, key) : undefined
              }
            />
          </div>
        );
      },
    })),
  ];

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      type: "AKTO",
      title: "",
      employeeName: "",
      trainingType: "",
      amount: "",
      accountUrl: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (dossier: AKTOOPCODossier) => {
    setEditingId(dossier.id);
    setFormData({
      type: dossier.type,
      title: dossier.title,
      employeeName: dossier.employeeName ?? "",
      trainingType: dossier.trainingType,
      amount: String(dossier.amount),
      accountUrl: dossier.accountUrl ?? "",
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = (dossierId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce dossier ?")) {
      setDossiers(dossiers.filter((d) => d.id !== dossierId));
    }
  };

  const handleSave = () => {
    if (editingId) {
      setDossiers(
        dossiers.map((d) =>
          d.id === editingId
            ? {
                ...d,
                type: formData.type,
                title: formData.title,
                employeeName: formData.employeeName || undefined,
                trainingType: formData.trainingType,
                amount: parseFloat(formData.amount) || 0,
                accountUrl: formData.accountUrl || undefined,
              }
            : d,
        ),
      );
      setEditingId(null);
      setIsCreateModalOpen(false);
      return;
    }
    const typeCount = dossiers.filter((d) => d.type === formData.type).length;
    const newDossier: AKTOOPCODossier = {
      id: (dossiers.length + 1).toString(),
      reference: `${formData.type}-2024-${String(typeCount + 1).padStart(3, "0")}`,
      type: formData.type,
      title: formData.title,
      employeeName: formData.employeeName || undefined,
      trainingType: formData.trainingType,
      amount: parseFloat(formData.amount) || 0,
      status: "À créer",
      accountUrl: formData.accountUrl || undefined,
      createdAt: new Date().toISOString().split("T")[0],
      documents: {},
    };
    setDossiers([...dossiers, newDossier]);
    setIsCreateModalOpen(false);
  };

  const handleRowClick = (dossier: AKTOOPCODossier) => {
    setSelectedDossier(dossier);
    setIsViewModalOpen(true);
  };

  /** Attache (ou remplace) une pièce du dossier : devis, convention, facture. */
  const handleUploadDocument = async (
    dossier: AKTOOPCODossier,
    slot: DocumentSlot,
  ) => {
    let fichier: StoredFile | null = null;
    try {
      fichier = await pickAndUploadFile();
    } catch (e) {
      alert(
        `Échec du téléversement : ${
          e instanceof Error ? e.message : "Erreur inconnue"
        }`,
      );
      return;
    }
    if (!fichier) return;

    const applique = (d: AKTOOPCODossier): AKTOOPCODossier => ({
      ...d,
      documents: { ...d.documents, [slot]: fichier },
    });
    setDossiers((prev) =>
      prev.map((d) => (d.id === dossier.id ? applique(d) : d)),
    );
    // La modale de détail travaille sur une copie : on la met à jour aussi.
    setSelectedDossier((current) =>
      current?.id === dossier.id ? applique(current) : current,
    );
  };

  const handleRemoveDocument = (
    dossier: AKTOOPCODossier,
    slot: DocumentSlot,
  ) => {
    const applique = (d: AKTOOPCODossier): AKTOOPCODossier => {
      const documents = { ...d.documents };
      delete documents[slot];
      return { ...d, documents };
    };
    setDossiers((prev) =>
      prev.map((d) => (d.id === dossier.id ? applique(d) : d)),
    );
    setSelectedDossier((current) =>
      current?.id === dossier.id ? applique(current) : current,
    );
  };

  const handleSubmitDossier = (dossierId: string) => {
    setDossiers(
      dossiers.map((d) =>
        d.id === dossierId
          ? {
              ...d,
              status: "Soumis" as const,
              submittedAt: new Date().toISOString().split("T")[0],
            }
          : d,
      ),
    );
    alert("Dossier soumis avec succès!");
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
        <div className="flex gap-2">
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
          title="Dossiers AKTO"
          value={aktoDossiers.length}
          color="blue"
        />

        <InfoCard
          icon={FileText}
          title="Dossiers OPCO"
          value={opcoDossiers.length}
          color="green"
        />

        <InfoCard
          icon={Clock}
          title="En cours"
          value={inProgress}
          color="orange"
        />

        <InfoCard
          icon={CheckCircle}
          title="Validés"
          value={validated}
          color="green"
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
            <Label htmlFor="employeeName">
              Employé (optionnel - laisser vide pour formation groupe)
            </Label>
            <Input
              id="employeeName"
              value={formData.employeeName}
              onChange={(e) =>
                setFormData({ ...formData, employeeName: e.target.value })
              }
              placeholder="Nom de l'employé"
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

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails du dossier"
        size="lg"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
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

            {selectedDossier.employeeName && (
              <div>
                <Label>Employé</Label>
                <p className="text-sm font-medium">
                  {selectedDossier.employeeName}
                </p>
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
            </div>

            <div>
              <Label>Statut</Label>
              <Badge variant="default">{selectedDossier.status}</Badge>
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
                  {new Date(selectedDossier.createdAt).toLocaleDateString(
                    "fr-FR",
                  )}
                </p>
              </div>
              {selectedDossier.submittedAt && (
                <div>
                  <Label>Date de soumission</Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedDossier.submittedAt).toLocaleDateString(
                      "fr-FR",
                    )}
                  </p>
                </div>
              )}
            </div>

            {selectedDossier.validatedAt && (
              <div>
                <Label>Date de validation</Label>
                <p className="text-sm font-medium text-green-600">
                  {new Date(selectedDossier.validatedAt).toLocaleDateString(
                    "fr-FR",
                  )}
                </p>
              </div>
            )}

            {/* Vue détaillée : une ligne par pièce du dossier de financement */}
            <div className="pt-4 border-t">
              <Label className="text-base font-semibold mb-3 block">
                Documents du dossier
              </Label>
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
                      <div className="flex shrink-0 items-center gap-1">
                        {fichier && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void downloadStoredFile(fichier)}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Télécharger
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            void handleUploadDocument(selectedDossier, key)
                          }
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          {fichier ? "Remplacer" : "Téléverser"}
                        </Button>
                        {fichier && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleRemoveDocument(selectedDossier, key)
                            }
                            title="Supprimer le document"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              {selectedDossier.status === "À créer" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    handleSubmitDossier(selectedDossier.id);
                    setIsViewModalOpen(false);
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Créer et soumettre le dossier
                </Button>
              )}

              {selectedDossier.status === "En cours" && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Dossier en cours de traitement
                  </p>
                </div>
              )}

              {selectedDossier.status === "Validé" && (
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Dossier validé le{" "}
                    {new Date(selectedDossier.validatedAt!).toLocaleDateString(
                      "fr-FR",
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
