"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef, FilterDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Coins,
  CheckCircle,
  XCircle,
  Receipt,
} from "lucide-react";
import {
  mockIndemniteTypes,
  indemniteCategoryLabels,
  URSSAF_LIMITS_CURRENT,
} from "@/data/payroll-indemnites";
import { IndemniteType } from "@/lib/types.d";
import { useListePersistante } from "@/hooks/fiscal/use-liste-persistante";

type ModalMode = "view" | "create" | "edit" | null;

const calculationMethodLabels: Record<
  IndemniteType["calculationMethod"],
  string
> = {
  fixed: "Montant fixe",
  per_day: "Par jour",
  per_hour: "Par heure",
  percentage: "Pourcentage",
  custom: "Personnalisé",
};

export default function IndemnitesConfigurationPage() {
  // La liste livrée reste dans le code ; les ajouts et modifications
  // du client sont enregistrés en base.
  const [indemnites, setIndemnites] = useListePersistante<IndemniteType>(
    "indemnite",
    {
      reference: mockIndemniteTypes,
      cle: (ligne) => ligne.code,
    },
  );
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedIndemnite, setSelectedIndemnite] =
    useState<IndemniteType | null>(null);
  const [formData, setFormData] = useState<Partial<IndemniteType>>({});
  // Stats
  const stats = {
    total: indemnites.length,
    active: indemnites.filter((i) => i.isActive).length,
    taxable: indemnites.filter((i) => i.taxable).length,
    nonTaxable: indemnites.filter((i) => !i.taxable).length,
  };

  // Convert taxable boolean to string for filtering
  const enrichedIndemnites = indemnites.map((ind) => ({
    ...ind,
    taxableFilter: ind.taxable ? "taxable" : "non-taxable",
  }));

  // Filters for DataTable
  const indemniteFilters: FilterDef[] = [
    {
      key: "taxableFilter",
      label: "Fiscalité",
      options: [
        { value: "all", label: "Tous" },
        { value: "taxable", label: "Imposables" },
        { value: "non-taxable", label: "Non imposables" },
      ],
    },
    {
      key: "category",
      label: "Catégorie",
      options: [
        { value: "all", label: "Toutes les catégories" },
        { value: "transport", label: "Transport" },
        { value: "repas", label: "Repas" },
        { value: "anciennete", label: "Ancienneté" },
        { value: "risque", label: "Risque" },
        { value: "teletravail", label: "Télétravail" },
        { value: "other", label: "Autres" },
      ],
    },
  ];

  const columns: ColumnDef<IndemniteType>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (item) => <span className="font-mono text-sm">{item.code}</span>,
    },
    {
      key: "name",
      label: "Nom",
      sortable: true,
    },
    {
      key: "category",
      label: "Catégorie",
      sortable: true,
      render: (item) => (
        <Badge variant="outline">
          {indemniteCategoryLabels[item.category]}
        </Badge>
      ),
    },
    {
      key: "calculationMethod",
      label: "Méthode de calcul",
      sortable: true,
      render: (item) => calculationMethodLabels[item.calculationMethod],
    },
    {
      key: "defaultAmount",
      label: "Montant par défaut",
      render: (item) =>
        item.defaultAmount !== undefined
          ? `${item.defaultAmount.toLocaleString("fr-FR")} €`
          : "-",
    },
    {
      key: "taxable",
      label: "Imposable",
      sortable: true,
      render: (item) => (
        <Badge
          className={
            item.taxable
              ? "bg-red-100 text-red-800 border-red-200"
              : "bg-green-100 text-green-800 border-green-200"
          }
        >
          {item.taxable ? "Oui" : "Non"}
        </Badge>
      ),
    },
    {
      key: "subjectToContributions",
      label: "Cotisations",
      sortable: true,
      render: (item) => (
        <Badge
          className={
            item.subjectToContributions
              ? "bg-orange-100 text-orange-800 border-orange-200"
              : "bg-blue-100 text-blue-800 border-blue-200"
          }
        >
          {item.subjectToContributions ? "Oui" : "Non"}
        </Badge>
      ),
    },
    {
      key: "isActive",
      label: "Statut",
      sortable: true,
      render: (item) => (
        <Badge variant={item.isActive ? "default" : "secondary"}>
          {item.isActive ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
  ];

  const handleOpenModal = (mode: ModalMode, indemnite?: IndemniteType) => {
    setModalMode(mode);
    if (indemnite) {
      setSelectedIndemnite(indemnite);
      setFormData(indemnite);
    } else {
      setSelectedIndemnite(null);
      setFormData({
        isActive: true,
        taxable: false,
        subjectToContributions: false,
        category: "other",
        calculationMethod: "fixed",
      });
    }
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedIndemnite(null);
    setFormData({});
  };

  const handleSave = () => {
    if (modalMode === "create") {
      const newIndemnite: IndemniteType = {
        id: `ind-${Date.now()}`,
        code: formData.code || "",
        name: formData.name || "",
        category: formData.category || "other",
        taxable: formData.taxable ?? false,
        subjectToContributions: formData.subjectToContributions ?? false,
        defaultAmount: formData.defaultAmount,
        calculationMethod: formData.calculationMethod || "fixed",
        isActive: formData.isActive ?? true,
        description: formData.description,
      };
      setIndemnites([...indemnites, newIndemnite]);
    } else if (modalMode === "edit" && selectedIndemnite) {
      setIndemnites(
        indemnites.map((i) =>
          i.id === selectedIndemnite.id ? { ...i, ...formData } : i,
        ),
      );
    }
    handleCloseModal();
  };

  const handleDelete = (indemnite: IndemniteType) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${indemnite.name}" ?`)) {
      setIndemnites(indemnites.filter((i) => i.id !== indemnite.id));
    }
  };

  const renderActions = (indemnite: IndemniteType) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleOpenModal("view", indemnite)}>
          <Eye className="h-4 w-4 mr-2 text-green-600" />
          Voir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenModal("edit", indemnite)}>
          <Pencil className="h-4 w-4 mr-2 text-orange-500" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => handleDelete(indemnite)}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2 text-red-600" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Indemnités</h1>
          <p className="text-muted-foreground">
            Configuration des indemnités et primes (transport, panier,
            ancienneté, etc.)
          </p>
        </div>
        <Button onClick={() => handleOpenModal("create")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Indemnité
        </Button>
      </div>

      {/* Stats */}
      <InfoCardContainer className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          title="Total Indemnités"
          value={stats.total}
          icon={Coins}
          color="blue"
        />
        <InfoCard
          title="Actives"
          value={stats.active}
          icon={Receipt}
          color="green"
        />
        <InfoCard
          title="Imposables"
          value={stats.taxable}
          icon={XCircle}
          color="red"
        />
        <InfoCard
          title="Non imposables"
          value={stats.nonTaxable}
          icon={CheckCircle}
          color="purple"
        />
      </InfoCardContainer>

      {/* URSSAF Limits Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Limites URSSAF 2026 (exonération)
            </CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Mis à jour automatiquement
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Panier repas</p>
              <p className="text-xl font-bold">
                {URSSAF_LIMITS_CURRENT.panierJour.toLocaleString("fr-FR")}{" "}
                €/jour
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Titre-restaurant</p>
              <p className="text-xl font-bold">
                {URSSAF_LIMITS_CURRENT.ticketRestaurant.toLocaleString("fr-FR")}{" "}
                €/jour
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Télétravail</p>
              <p className="text-xl font-bold">
                {URSSAF_LIMITS_CURRENT.teletravailJour.toLocaleString("fr-FR")}{" "}
                €/jour
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Télétravail (mensuel)
              </p>
              <p className="text-xl font-bold">
                {URSSAF_LIMITS_CURRENT.teletravailMois.toLocaleString("fr-FR")}{" "}
                €/mois
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mobilité durable</p>
              <p className="text-xl font-bold">
                {URSSAF_LIMITS_CURRENT.mobiliteDurable.toLocaleString("fr-FR")}{" "}
                €/an
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Les limites sont automatiquement mises à jour à partir du site
            urssaf.fr (mock)
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable
        data={enrichedIndemnites}
        columns={columns}
        filters={indemniteFilters}
        searchKeys={["code", "name"]}
        searchPlaceholder="Rechercher par code ou nom..."
        actions={renderActions}
        onRowClick={(item) => handleOpenModal("view", item)}
      />

      {/* Modal */}
      <Modal
        open={modalMode !== null}
        onOpenChange={handleCloseModal}
        type={modalMode === "view" ? "details" : "form"}
        title={
          modalMode === "view"
            ? "Détails de l'Indemnité"
            : modalMode === "edit"
              ? "Modifier l'Indemnité"
              : "Nouvelle Indemnité"
        }
        description={
          modalMode === "view"
            ? "Informations détaillées de l'indemnité"
            : "Configurez les paramètres de l'indemnité"
        }
        size="lg"
        actions={{
          primary:
            modalMode !== "view"
              ? {
                  label: "Enregistrer",
                  onClick: handleSave,
                }
              : undefined,
          secondary: {
            label: modalMode === "view" ? "Fermer" : "Annuler",
            onClick: handleCloseModal,
            variant: "outline",
          },
        }}
      >
        <div className="grid gap-4 py-4">
          {/* Code */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Code *
            </Label>
            <Input
              id="code"
              value={formData.code || ""}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
              placeholder="ex: PANIER_JOUR, TRANSPORT"
            />
          </div>

          {/* Name */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nom *
            </Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Catégorie *
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value: IndemniteType["category"]) =>
                setFormData({ ...formData, category: value })
              }
              disabled={modalMode === "view"}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(indemniteCategoryLabels).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Calculation Method */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="calculationMethod" className="text-right">
              Méthode de calcul *
            </Label>
            <Select
              value={formData.calculationMethod}
              onValueChange={(value: IndemniteType["calculationMethod"]) =>
                setFormData({ ...formData, calculationMethod: value })
              }
              disabled={modalMode === "view"}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner une méthode" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(calculationMethodLabels).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Default Amount */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="defaultAmount" className="text-right">
              Montant par défaut (€)
            </Label>
            <Input
              id="defaultAmount"
              type="number"
              step="0.01"
              value={formData.defaultAmount ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultAmount: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
              placeholder="Laisser vide si variable"
            />
          </div>

          {/* Taxable */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="taxable" className="text-right">
              Imposable
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Switch
                id="taxable"
                checked={formData.taxable ?? false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, taxable: checked })
                }
                disabled={modalMode === "view"}
              />
              <span className="text-sm text-muted-foreground">
                {formData.taxable
                  ? "Soumis à l'impôt sur le revenu"
                  : "Exonéré d'impôt sur le revenu"}
              </span>
            </div>
          </div>

          {/* Subject to Contributions */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subjectToContributions" className="text-right">
              Cotisations sociales
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Switch
                id="subjectToContributions"
                checked={formData.subjectToContributions ?? false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, subjectToContributions: checked })
                }
                disabled={modalMode === "view"}
              />
              <span className="text-sm text-muted-foreground">
                {formData.subjectToContributions
                  ? "Soumis aux cotisations sociales"
                  : "Exonéré de cotisations sociales"}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
            />
          </div>

          {/* Status */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isActive" className="text-right">
              Statut
            </Label>
            <Select
              value={formData.isActive ? "true" : "false"}
              onValueChange={(value) =>
                setFormData({ ...formData, isActive: value === "true" })
              }
              disabled={modalMode === "view"}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Actif</SelectItem>
                <SelectItem value="false">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
