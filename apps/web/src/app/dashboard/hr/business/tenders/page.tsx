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
} from "lucide-react";
import { mockTenders, type Tender } from "@/data/hr-tenders";

export default function TendersPage() {
  const [tenders, setTenders] = useState<Tender[]>(mockTenders);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [editingTenderId, setEditingTenderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    client: "",
    source: "BOAMP",
    sourceUrl: "",
    publicationDate: "",
    deadline: "",
    estimatedValue: "",
  });

  const inProgress = tenders.filter((t) => t.status === "En cours").length;
  const submitted = tenders.filter((t) => t.status === "Soumis").length;
  const toCreate = tenders.filter((t) => t.status === "À créer").length;

  const columns: ColumnDef<Tender>[] = [
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
        const today = new Date();
        const daysLeft = Math.ceil(
          (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
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
  ];

  const handleCreate = () => {
    setEditingTenderId(null);
    setFormData({
      title: "",
      client: "",
      source: "BOAMP",
      sourceUrl: "",
      publicationDate: "",
      deadline: "",
      estimatedValue: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleSave = () => {
    if (editingTenderId) {
      setTenders((prev) =>
        prev.map((t) =>
          t.id === editingTenderId
            ? {
                ...t,
                title: formData.title,
                client: formData.client,
                source: formData.source as Tender["source"],
                sourceUrl: formData.sourceUrl,
                publicationDate: formData.publicationDate,
                deadline: formData.deadline,
                estimatedValue: formData.estimatedValue
                  ? parseFloat(formData.estimatedValue)
                  : undefined,
              }
            : t,
        ),
      );
      setEditingTenderId(null);
      setIsCreateModalOpen(false);
      return;
    }

    const newTender: Tender = {
      id: (tenders.length + 1).toString(),
      reference: `AO-2024-${String(tenders.length + 1).padStart(3, "0")}`,
      title: formData.title,
      client: formData.client,
      source: formData.source as "BOAMP" | "Marchés Publics" | "Autre",
      sourceUrl: formData.sourceUrl,
      publicationDate: formData.publicationDate,
      deadline: formData.deadline,
      status: "À créer",
      dossierCreated: false,
      documents: [],
      estimatedValue: formData.estimatedValue
        ? parseFloat(formData.estimatedValue)
        : undefined,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTenders([...tenders, newTender]);
    setIsCreateModalOpen(false);
  };

  const handleRowClick = (tender: Tender) => {
    setSelectedTender(tender);
    setIsViewModalOpen(true);
  };

  const handleEditTender = (tender: Tender) => {
    setEditingTenderId(tender.id);
    setFormData({
      title: tender.title,
      client: tender.client,
      source: tender.source,
      sourceUrl: tender.sourceUrl ?? "",
      publicationDate: tender.publicationDate,
      deadline: tender.deadline,
      estimatedValue: tender.estimatedValue?.toString() ?? "",
    });
    setIsCreateModalOpen(true);
  };

  const handleDeleteTender = (tender: Tender) => {
    setTenders((prev) => prev.filter((t) => t.id !== tender.id));
  };

  /** Téléverse une pièce du dossier d'appel d'offre. */
  const handleUploadTenderDocument = (tender: Tender) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      setTenders((prev) =>
        prev.map((t) =>
          t.id === tender.id
            ? { ...t, documents: [...(t.documents ?? []), file.name] }
            : t,
        ),
      );
    };
    input.click();
  };

  /** Exporte la fiche de l'appel d'offre et la liste de ses pièces. */
  const handleDownloadTender = (tender: Tender) => {
    const lines = [
      `Appel d'offre : ${tender.reference}`,
      `Objet : ${tender.title}`,
      `Client : ${tender.client}`,
      `Source : ${tender.source}${tender.sourceUrl ? ` (${tender.sourceUrl})` : ""}`,
      `Publication : ${tender.publicationDate}`,
      `Date limite : ${tender.deadline}`,
      `Statut : ${tender.status}`,
      "",
      "Pièces du dossier :",
      ...(tender.documents?.length
        ? tender.documents.map((d) => ` - ${d}`)
        : [" (aucune pièce)"]),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tender.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateDossier = (tenderId: string) => {
    setTenders(
      tenders.map((t) =>
        t.id === tenderId
          ? { ...t, dossierCreated: true, status: "En cours" as const }
          : t,
      ),
    );
    alert(
      "Dossier créé avec succès! Vous pouvez maintenant ajouter les documents.",
    );
  };

  const handleSubmitTender = (tenderId: string) => {
    setTenders(
      tenders.map((t) =>
        t.id === tenderId
          ? {
              ...t,
              status: "Soumis" as const,
              submittedAt: new Date().toISOString().split("T")[0],
            }
          : t,
      ),
    );
    alert("Appel d'offre soumis avec succès!");
  };

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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À créer</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toCreate}</div>
            <p className="text-xs text-muted-foreground">Dossiers à créer</p>
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
        columns={columns}
        searchKey="title"
        searchPlaceholder="Rechercher un appel d'offre..."
        onRowClick={handleRowClick}
        actions={(tender) => (
          <RowActionsMenu
            onView={() => handleRowClick(tender)}
            onEdit={() => handleEditTender(tender)}
            onUpload={() => handleUploadTenderDocument(tender)}
            onDownload={() => handleDownloadTender(tender)}
            onDelete={() => handleDeleteTender(tender)}
          />
        )}
      />

      {/* Create Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={
          editingTenderId ? "Modifier l'appel d'offre" : "Nouvel appel d'offre"
        }
        size="lg"
        actions={{
          primary: {
            label: "Créer",
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

          <div>
            <Label htmlFor="source">Source</Label>
            <Select
              value={formData.source}
              onValueChange={(value) =>
                setFormData({ ...formData, source: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOAMP">BOAMP</SelectItem>
                <SelectItem value="Marchés Publics">Marchés Publics</SelectItem>
                <SelectItem value="Autre">Autre</SelectItem>
              </SelectContent>
            </Select>
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
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de l'appel d'offre"
        size="lg"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
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
                <Badge variant="default">{selectedTender.status}</Badge>
              </div>
            </div>

            <div>
              <Label>Titre</Label>
              <p className="text-sm font-medium">{selectedTender.title}</p>
            </div>

            <div>
              <Label>Client</Label>
              <p className="text-sm font-medium">{selectedTender.client}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Source</Label>
                <Badge variant="outline">{selectedTender.source}</Badge>
              </div>
              {selectedTender.estimatedValue && (
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
                  {new Date(selectedTender.publicationDate).toLocaleDateString(
                    "fr-FR",
                  )}
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
              <Label className="text-base font-semibold mb-3 block">
                Documents du dossier
              </Label>
              {selectedTender.documents.length > 0 ? (
                <div className="space-y-2">
                  {selectedTender.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <span className="text-sm">{doc}</span>
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
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
                    handleCreateDossier(selectedTender.id);
                    setIsViewModalOpen(false);
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
                      handleSubmitTender(selectedTender.id);
                      setIsViewModalOpen(false);
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
    </div>
  );
}
