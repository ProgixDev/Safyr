"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
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
  XCircle,
  Download,
  FolderOpen,
  Building2,
} from "lucide-react";
import { useRegistre } from "@/hooks/fiscal";
import {
  SANS_FICHIER,
  aujourdhui,
  messageErreur,
  type LigneAppelOffre,
} from "@/components/business/appel-offre-types";
import { useDocumentsAO } from "@/components/business/use-documents-ao";
import { TenderDocumentsTab } from "@/components/business/TenderDocumentsTab";
import { DossierEntrepriseTab } from "@/components/business/DossierEntrepriseTab";

type Onglet = "appels" | "documents" | "dossier";

const STATUTS: LigneAppelOffre["status"][] = [
  "À créer",
  "En cours",
  "Soumis",
  "Gagné",
  "Perdu",
  "Annulé",
];

const FORMULAIRE_VIDE = {
  title: "",
  client: "",
  source: "BOAMP" as LigneAppelOffre["source"],
  sourceUrl: "",
  publicationDate: "",
  deadline: "",
  estimatedValue: "",
  status: "À créer" as LigneAppelOffre["status"],
};

/** Libellé et période exigés par le registre pour une ligne d'appel d'offre. */
function infosDe(t: LigneAppelOffre) {
  return {
    period: (t.deadline || t.createdAt || aujourdhui()).slice(0, 7),
    label: `${t.reference} - ${t.title}`.slice(0, 160),
    status: t.status,
    amount: t.estimatedValue,
  };
}

/** Référence suivante de l'année, sans réutiliser un numéro supprimé. */
function prochaineReference(existants: LigneAppelOffre[]): string {
  const annee = new Date().getFullYear();
  const prefixe = `AO-${annee}-`;
  const dernier = existants
    .filter((t) => t.reference.startsWith(prefixe))
    .map((t) => parseInt(t.reference.slice(prefixe.length), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0);
  return `${prefixe}${String(dernier + 1).padStart(3, "0")}`;
}

export default function TendersPage() {
  const [onglet, setOnglet] = useState<Onglet>("appels");
  // Enregistré en base : la liste ne vivait que dans le navigateur.
  const registre = useRegistre<LigneAppelOffre>("appel_offre", SANS_FICHIER);
  const docs = useDocumentsAO();
  const tenders = registre.lignes;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [editingTenderId, setEditingTenderId] = useState<string | null>(null);
  const [tenderToDelete, setTenderToDelete] = useState<LigneAppelOffre | null>(
    null,
  );
  const [formData, setFormData] = useState(FORMULAIRE_VIDE);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  /** Message affiché dans la fiche quand plusieurs fichiers sont joints. */
  const [choixFichier, setChoixFichier] = useState(false);

  const selectedTender = tenders.find((t) => t.id === selectedTenderId) ?? null;

  const inProgress = tenders.filter((t) => t.status === "En cours").length;
  const submitted = tenders.filter((t) => t.status === "Soumis").length;
  const toCreate = tenders.filter((t) => t.status === "À créer").length;

  const columns: ColumnDef<LigneAppelOffre>[] = [
    {
      key: "reference",
      label: "Référence",
      sortable: true,
    },
    {
      key: "title",
      label: "Titre",
      render: (tender) => <span className="font-medium">{tender.title}</span>,
    },
    {
      key: "client",
      label: "Client",
    },
    {
      key: "source",
      label: "Source",
      render: (tender) => <Badge variant="outline">{tender.source}</Badge>,
    },
    {
      key: "deadline",
      label: "Date limite",
      render: (tender) => {
        const deadline = new Date(tender.deadline);
        if (Number.isNaN(deadline.getTime())) return "-";
        const daysLeft = Math.ceil(
          (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        return (
          <div>
            <span className="text-sm">
              {deadline.toLocaleDateString("fr-FR")}
            </span>
            {daysLeft >= 0 && (
              <Badge
                variant={daysLeft < 7 ? "destructive" : "secondary"}
                className="ml-2"
              >
                {daysLeft}j restants
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Statut",
      render: (tender) => {
        const variants: Record<
          string,
          "default" | "secondary" | "outline" | "destructive"
        > = {
          "À créer": "outline",
          "En cours": "default",
          Soumis: "secondary",
          Gagné: "default",
          Perdu: "destructive",
          Annulé: "outline",
        };
        return <Badge variant={variants[tender.status]}>{tender.status}</Badge>;
      },
    },
    {
      key: "dossierCreated",
      label: "Dossier",
      render: (tender) =>
        tender.dossierCreated ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-orange-600" />
        ),
    },
    {
      key: "documents",
      label: "Documents",
      sortable: false,
      render: (tender) => {
        const n = docs.documentsDe(tender.id).length;
        return (
          <span className="text-sm text-muted-foreground">
            {n === 0 ? "Aucun" : n}
          </span>
        );
      },
    },
  ];

  const fermerForm = () => {
    setIsCreateModalOpen(false);
    setEditingTenderId(null);
    setFormError(null);
    setFormData(FORMULAIRE_VIDE);
  };

  const handleCreate = () => {
    setEditingTenderId(null);
    setFormError(null);
    setFormData(FORMULAIRE_VIDE);
    setIsCreateModalOpen(true);
  };

  const handleEditTender = (tender: LigneAppelOffre) => {
    setEditingTenderId(tender.id);
    setFormError(null);
    setFormData({
      title: tender.title,
      client: tender.client,
      source: tender.source,
      sourceUrl: tender.sourceUrl ?? "",
      publicationDate: tender.publicationDate,
      deadline: tender.deadline,
      estimatedValue: tender.estimatedValue?.toString() ?? "",
      status: tender.status,
    });
    setIsCreateModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setFormError("Le titre de l'appel d'offre est obligatoire.");
      return;
    }
    if (!formData.deadline) {
      setFormError("La date limite de réponse est obligatoire.");
      return;
    }
    const valeur = formData.estimatedValue
      ? parseFloat(formData.estimatedValue)
      : undefined;
    if (valeur !== undefined && (Number.isNaN(valeur) || valeur < 0)) {
      setFormError("La valeur estimée doit être un montant positif.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const existant = tenders.find((t) => t.id === editingTenderId);
      const ligne: LigneAppelOffre = existant
        ? {
            ...existant,
            title: formData.title.trim(),
            client: formData.client.trim(),
            source: formData.source,
            sourceUrl: formData.sourceUrl.trim(),
            publicationDate: formData.publicationDate,
            deadline: formData.deadline,
            estimatedValue: valeur,
            status: formData.status,
          }
        : {
            // L'identifiant est attribué par le serveur à la création.
            id: "",
            reference: prochaineReference(tenders),
            title: formData.title.trim(),
            client: formData.client.trim(),
            source: formData.source,
            sourceUrl: formData.sourceUrl.trim(),
            publicationDate: formData.publicationDate,
            deadline: formData.deadline,
            status: "À créer",
            dossierCreated: false,
            estimatedValue: valeur,
            createdAt: aujourdhui(),
          };
      await registre.enregistrer(ligne, infosDe(ligne));
      fermerForm();
    } catch (e) {
      setFormError(`Enregistrement impossible : ${messageErreur(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const ouvrirFiche = (tender: LigneAppelOffre, choix = false) => {
    setChoixFichier(choix);
    setSelectedTenderId(tender.id);
  };

  const handleConfirmDelete = async () => {
    if (!tenderToDelete) return;
    const cible = tenderToDelete;
    setTenderToDelete(null);
    try {
      // Les documents d'un appel d'offre supprimé n'ont plus de rattachement.
      for (const doc of docs.documentsDe(cible.id)) {
        await docs.supprimerDocument(doc);
      }
      await registre.supprimerLigne(cible.id);
      if (selectedTenderId === cible.id) setSelectedTenderId(null);
    } catch (e) {
      alert(`Suppression impossible : ${messageErreur(e)}`);
    }
  };

  /** Téléverse une pièce du dossier : elle devient un document de l'appel d'offre. */
  const handleUploadTenderDocument = async (tender: LigneAppelOffre) => {
    try {
      await docs.televerserPourAppelOffre(tender.id);
    } catch (e) {
      alert(`Téléversement impossible : ${messageErreur(e)}`);
    }
  };

  /** Télécharge le fichier joint ; explique s'il n'y en a pas. */
  const handleDownloadTender = (tender: LigneAppelOffre) => {
    const avecFichier = docs.documentsDe(tender.id).filter((d) => d.fichier);
    if (avecFichier.length === 0) {
      alert(
        `Aucun fichier n'est joint à l'appel d'offre ${tender.reference}. Utilisez « Téléverser » pour en ajouter un.`,
      );
      return;
    }
    if (avecFichier.length === 1) {
      docs.telecharger(avecFichier[0]);
      return;
    }
    // Plusieurs pièces : le choix se fait dans la fiche, document par document.
    ouvrirFiche(tender, true);
  };

  const majTender = async (
    tender: LigneAppelOffre,
    changements: Partial<LigneAppelOffre>,
    succes: string,
  ) => {
    const ligne = { ...tender, ...changements };
    try {
      await registre.enregistrer(ligne, infosDe(ligne));
      alert(succes);
    } catch (e) {
      alert(`Mise à jour impossible : ${messageErreur(e)}`);
    }
  };

  const handleCreateDossier = (tender: LigneAppelOffre) =>
    majTender(
      tender,
      { dossierCreated: true, status: "En cours" },
      "Dossier créé avec succès ! Vous pouvez maintenant ajouter les documents.",
    );

  const handleSubmitTender = (tender: LigneAppelOffre) =>
    majTender(
      tender,
      { status: "Soumis", submittedAt: aujourdhui() },
      "Appel d'offre soumis avec succès !",
    );

  const documentsFiche = selectedTender
    ? docs.documentsDe(selectedTender.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Appels d&apos;Offre</h1>
          <p className="text-muted-foreground">
            Accès aux sites d&apos;appels d&apos;offres, création et suivi des
            dossiers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a
              href="https://www.boamp.fr"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              BOAMP
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://www.marche-public.fr"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Marchés Publics
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://www.akkel.fr/categories-cpv/79710000-services-securite"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Akkel CPV Sécurité
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://marches-publics.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Marchés Publics Gouv
            </a>
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel appel d&apos;offre
          </Button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b">
        <Button
          variant={onglet === "appels" ? "default" : "ghost"}
          onClick={() => setOnglet("appels")}
        >
          <FileText className="h-4 w-4 mr-2" />
          Appels d&apos;offre
        </Button>
        <Button
          variant={onglet === "documents" ? "default" : "ghost"}
          onClick={() => setOnglet("documents")}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Documents
        </Button>
        <Button
          variant={onglet === "dossier" ? "default" : "ghost"}
          onClick={() => setOnglet("dossier")}
        >
          <Building2 className="h-4 w-4 mr-2" />
          Dossier de mon entreprise
        </Button>
      </div>

      {onglet === "appels" && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">À créer</CardTitle>
                <FileText className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{toCreate}</div>
                <p className="text-xs text-muted-foreground">
                  Dossiers à créer
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En cours</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgress}</div>
                <p className="text-xs text-muted-foreground">En préparation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Soumis</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{submitted}</div>
                <p className="text-xs text-muted-foreground">
                  En attente de réponse
                </p>
              </CardContent>
            </Card>
          </div>

          <DataTable
            data={tenders}
            isLoading={registre.isLoading}
            columns={columns}
            searchKey="title"
            searchPlaceholder="Rechercher un appel d'offre..."
            onRowClick={(tender) => ouvrirFiche(tender)}
            actions={(tender) => (
              <RowActionsMenu
                onView={() => ouvrirFiche(tender)}
                onEdit={() => handleEditTender(tender)}
                onUpload={() => void handleUploadTenderDocument(tender)}
                onDownload={() => handleDownloadTender(tender)}
                onDelete={() => setTenderToDelete(tender)}
              />
            )}
          />
        </>
      )}

      {onglet === "documents" && (
        <TenderDocumentsTab tenders={tenders} docs={docs} />
      )}

      {onglet === "dossier" && <DossierEntrepriseTab />}

      {/* Create / Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          if (!open) fermerForm();
        }}
        type="form"
        title={
          editingTenderId ? "Modifier l'appel d'offre" : "Nouvel appel d'offre"
        }
        size="lg"
        actions={{
          primary: {
            label: editingTenderId ? "Enregistrer les modifications" : "Créer",
            onClick: () => void handleSave(),
            loading: saving,
            disabled: saving,
          },
          secondary: {
            label: "Annuler",
            onClick: fermerForm,
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          {formError && (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}
          <div>
            <Label htmlFor="title">Titre de l&apos;appel d&apos;offre</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Prestation de sécurité - Centre Commercial"
            />
          </div>

          <div>
            <Label htmlFor="client">Client / Organisme</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) =>
                setFormData({ ...formData, client: e.target.value })
              }
              placeholder="Nom du client"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="source">Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    source: value as LigneAppelOffre["source"],
                  })
                }
              >
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOAMP">BOAMP</SelectItem>
                  <SelectItem value="Marchés Publics">
                    Marchés Publics
                  </SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingTenderId && (
              <div>
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as LigneAppelOffre["status"],
                    })
                  }
                >
                  <SelectTrigger id="statut">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="sourceUrl">URL de l&apos;avis (optionnel)</Label>
            <Input
              id="sourceUrl"
              type="url"
              value={formData.sourceUrl}
              onChange={(e) =>
                setFormData({ ...formData, sourceUrl: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="publicationDate">Date de publication</Label>
              <Input
                id="publicationDate"
                type="date"
                value={formData.publicationDate}
                onChange={(e) =>
                  setFormData({ ...formData, publicationDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="deadline">Date limite de réponse</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="estimatedValue">
              Valeur estimée (€) - optionnel
            </Label>
            <Input
              id="estimatedValue"
              type="number"
              min={0}
              value={formData.estimatedValue}
              onChange={(e) =>
                setFormData({ ...formData, estimatedValue: e.target.value })
              }
              placeholder="150000"
            />
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={selectedTender !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTenderId(null);
        }}
        type="details"
        title="Détails de l'appel d'offre"
        size="lg"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setSelectedTenderId(null),
          },
        }}
      >
        {selectedTender && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Référence</Label>
                <p className="text-sm font-medium">
                  {selectedTender.reference}
                </p>
              </div>
              <div>
                <Label>Statut</Label>
                <div>
                  <Badge variant="default">{selectedTender.status}</Badge>
                </div>
              </div>
            </div>

            <div>
              <Label>Titre</Label>
              <p className="text-sm font-medium">{selectedTender.title}</p>
            </div>

            <div>
              <Label>Client</Label>
              <p className="text-sm font-medium">
                {selectedTender.client || "Non renseigné"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Source</Label>
                <div>
                  <Badge variant="outline">{selectedTender.source}</Badge>
                </div>
              </div>
              {selectedTender.estimatedValue !== undefined && (
                <div>
                  <Label>Valeur estimée</Label>
                  <p className="text-sm font-medium">
                    {selectedTender.estimatedValue.toLocaleString("fr-FR")} €
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de publication</Label>
                <p className="text-sm font-medium">
                  {selectedTender.publicationDate
                    ? new Date(
                        selectedTender.publicationDate,
                      ).toLocaleDateString("fr-FR")
                    : "Non renseigné"}
                </p>
              </div>
              <div>
                <Label>Date limite</Label>
                <p className="text-sm font-medium">
                  {new Date(selectedTender.deadline).toLocaleDateString(
                    "fr-FR",
                  )}
                </p>
              </div>
            </div>

            {selectedTender.sourceUrl && (
              <div>
                <Label>Lien vers l&apos;avis</Label>
                <Button variant="outline" size="sm" asChild className="mt-2">
                  <a
                    href={selectedTender.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir l&apos;avis
                  </a>
                </Button>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">
                  Documents du dossier
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void handleUploadTenderDocument(selectedTender)
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Téléverser
                </Button>
              </div>
              {choixFichier && (
                <p className="text-sm text-amber-600 mb-2">
                  Plusieurs fichiers sont joints à cet appel d&apos;offre :
                  choisissez celui à télécharger.
                </p>
              )}
              {documentsFiche.length > 0 ? (
                <div className="space-y-2">
                  {documentsFiche.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <span className="text-sm">
                        {doc.name}
                        <span className="text-xs text-muted-foreground ml-2">
                          {doc.type}
                          {doc.fichier ? "" : " - aucun fichier"}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Télécharger ${doc.name}`}
                        onClick={() => docs.telecharger(doc)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun document ajouté
                </p>
              )}
            </div>

            <div className="pt-4 border-t space-y-2">
              {!selectedTender.dossierCreated && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    void handleCreateDossier(selectedTender);
                    setSelectedTenderId(null);
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Créer le dossier
                </Button>
              )}

              {selectedTender.dossierCreated &&
                selectedTender.status === "En cours" && (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      void handleSubmitTender(selectedTender);
                      setSelectedTenderId(null);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Soumettre l&apos;appel d&apos;offre
                  </Button>
                )}

              {selectedTender.status === "Soumis" &&
                selectedTender.submittedAt && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">
                      ✓ Soumis le{" "}
                      {new Date(selectedTender.submittedAt).toLocaleDateString(
                        "fr-FR",
                      )}
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={tenderToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setTenderToDelete(null);
        }}
        type="warning"
        title="Supprimer l'appel d'offre"
        description="Cette action est irréversible."
        actions={{
          primary: {
            label: "Supprimer",
            onClick: () => void handleConfirmDelete(),
            variant: "destructive",
          },
          secondary: {
            label: "Annuler",
            onClick: () => setTenderToDelete(null),
            variant: "outline",
          },
        }}
        closable={false}
      >
        <p className="text-sm text-muted-foreground">
          {tenderToDelete
            ? `Supprimer l'appel d'offre ${tenderToDelete.reference} - ${tenderToDelete.title} ? Les documents qui lui sont rattachés (${docs.documentsDe(tenderToDelete.id).length}) seront également supprimés.`
            : ""}
        </p>
      </Modal>
    </div>
  );
}
