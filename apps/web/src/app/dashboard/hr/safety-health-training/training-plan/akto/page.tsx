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
import { Plus, ExternalLink, FileText, Clock, CheckCircle } from "lucide-react";

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
  documents: string[];
}

const mockDossiers: AKTOOPCODossier[] = [
  {
    id: "1",
    reference: "AKTO-2024-001",
    type: "AKTO",
    title: "Formation SSIAP 1 - Jean Dupont",
    employeeId: "emp1",
    employeeName: "Jean Dupont",
    trainingType: "SSIAP 1",
    amount: 1200,
    status: "Validé",
    accountUrl: "https://akto.fr/compte/123456",
    createdAt: "2024-10-15",
    submittedAt: "2024-10-20",
    validatedAt: "2024-11-05",
    documents: ["dossier_formation.pdf", "facture.pdf"],
  },
  {
    id: "2",
    reference: "OPCO-2024-002",
    type: "OPCO",
    title: "Formation SST - Marie Martin",
    employeeId: "emp2",
    employeeName: "Marie Martin",
    trainingType: "SST",
    amount: 800,
    status: "En cours",
    accountUrl: "https://opco.fr/compte/789012",
    createdAt: "2024-11-10",
    submittedAt: "2024-11-15",
    documents: ["dossier_formation.pdf"],
  },
  {
    id: "3",
    reference: "AKTO-2024-003",
    type: "AKTO",
    title: "Formation H0B0 - Groupe",
    trainingType: "H0B0",
    amount: 3500,
    status: "À créer",
    createdAt: "2024-12-01",
    documents: [],
  },
];

const AKTO_URL = "https://www.akto.fr";

export default function AKTOOPCOPage() {
  const [dossiers, setDossiers] = useState<AKTOOPCODossier[]>(mockDossiers);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] =
    useState<AKTOOPCODossier | null>(null);
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
  ];

  const handleCreate = () => {
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

  const handleSave = () => {
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
      documents: [],
    };
    setDossiers([...dossiers, newDossier]);
    setIsCreateModalOpen(false);
  };

  const handleRowClick = (dossier: AKTOOPCODossier) => {
    setSelectedDossier(dossier);
    setIsViewModalOpen(true);
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
      />

      {/* Create Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title="Nouveau dossier AKTO/OPCO"
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

            <div className="pt-4 border-t">
              <Label className="text-base font-semibold mb-3 block">
                Documents
              </Label>
              {selectedDossier.documents.length > 0 ? (
                <div className="space-y-2">
                  {selectedDossier.documents.map((doc, index) => (
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
