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
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  HandCoins,
  TrendingDown,
  Calculator,
  CheckCircle,
} from "lucide-react";
import {
  mockStateHelps,
  SMIC_MENSUEL_2024,
  SMIC_HORAIRE_2024,
} from "@/data/payroll-state-help";
import { StateHelp } from "@/lib/types.d";
import { useListePersistante } from "@/hooks/fiscal/use-liste-persistante";

type ModalMode = "view" | "create" | "edit" | null;

const typeLabels: Record<StateHelp["type"], string> = {
  reduction: "Réduction",
  credit: "Crédit",
  exoneration: "Exonération",
};

const typeColors: Record<StateHelp["type"], string> = {
  reduction: "bg-blue-100 text-blue-800 border-blue-200",
  credit: "bg-green-100 text-green-800 border-green-200",
  exoneration: "bg-purple-100 text-purple-800 border-purple-200",
};

const calculationMethodLabels: Record<StateHelp["calculationMethod"], string> =
  {
    percentage: "Pourcentage",
    fixed: "Montant fixe",
    formula: "Formule",
  };

export default function StateHelpConfigurationPage() {
  // La liste livrée reste dans le code ; les ajouts et modifications
  // du client sont enregistrés en base.
  const [helps, setHelps] = useListePersistante<StateHelp>("aide_etat", {
    reference: mockStateHelps,
    cle: (ligne) => ligne.code,
  });
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedHelp, setSelectedHelp] = useState<StateHelp | null>(null);
  const [formData, setFormData] = useState<Partial<StateHelp>>({});

  // Stats
  const stats = {
    total: helps.length,
    active: helps.filter((h) => h.isActive).length,
    reductions: helps.filter((h) => h.type === "reduction").length,
    credits: helps.filter((h) => h.type === "credit").length,
    exonerations: helps.filter((h) => h.type === "exoneration").length,
  };

  // Enrich data with active status string for filtering
  const enrichedHelps = helps.map((h) => ({
    ...h,
    activeFilter: h.isActive ? "active" : "inactive",
  }));

  // Filters for DataTable
  const helpFilters: FilterDef[] = [
    {
      key: "type",
      label: "Type",
      options: [
        { value: "all", label: "Tous les types" },
        { value: "reduction", label: "Réductions" },
        { value: "credit", label: "Crédits" },
        { value: "exoneration", label: "Exonérations" },
      ],
    },
    {
      key: "calculationMethod",
      label: "Méthode de calcul",
      options: [
        { value: "all", label: "Toutes les méthodes" },
        { value: "percentage", label: "Pourcentage" },
        { value: "fixed", label: "Montant fixe" },
        { value: "formula", label: "Formule" },
      ],
    },
    {
      key: "activeFilter",
      label: "Statut",
      options: [
        { value: "all", label: "Tous" },
        { value: "active", label: "Actifs" },
        { value: "inactive", label: "Inactifs" },
      ],
    },
  ];

  const columns: ColumnDef<StateHelp>[] = [
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
      key: "type",
      label: "Type",
      sortable: true,
      render: (item) => (
        <Badge className={typeColors[item.type]}>{typeLabels[item.type]}</Badge>
      ),
    },
    {
      key: "calculationMethod",
      label: "Méthode de calcul",
      sortable: true,
      render: (item) => calculationMethodLabels[item.calculationMethod],
    },
    {
      key: "rate",
      label: "Taux/Montant",
      render: (item) => {
        if (item.calculationMethod === "percentage" && item.rate) {
          return `${item.rate}%`;
        }
        if (item.calculationMethod === "fixed" && item.amount) {
          return `${item.amount.toLocaleString("fr-FR")} €`;
        }
        if (item.calculationMethod === "formula") {
          return "Formule";
        }
        return "-";
      },
    },
    {
      key: "maxAmount",
      label: "Plafond",
      render: (item) =>
        item.maxAmount ? `${item.maxAmount.toLocaleString("fr-FR")} €` : "-",
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

  const handleOpenModal = (mode: ModalMode, help?: StateHelp) => {
    setModalMode(mode);
    if (help) {
      setSelectedHelp(help);
      setFormData(help);
    } else {
      setSelectedHelp(null);
      setFormData({
        isActive: true,
        type: "reduction",
        calculationMethod: "percentage",
        conditions: [],
        effectiveDate: new Date().toISOString().split("T")[0],
      });
    }
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedHelp(null);
    setFormData({});
  };

  const handleSave = () => {
    if (modalMode === "create") {
      const newHelp: StateHelp = {
        id: `sh-${Date.now()}`,
        code: formData.code || "",
        name: formData.name || "",
        type: formData.type || "reduction",
        calculationMethod: formData.calculationMethod || "percentage",
        rate: formData.rate,
        amount: formData.amount,
        formula: formData.formula,
        conditions: formData.conditions || [],
        maxAmount: formData.maxAmount,
        isActive: formData.isActive ?? true,
        effectiveDate: formData.effectiveDate || "",
        endDate: formData.endDate,
        description: formData.description,
      };
      setHelps([...helps, newHelp]);
    } else if (modalMode === "edit" && selectedHelp) {
      setHelps(
        helps.map((h) =>
          h.id === selectedHelp.id ? { ...h, ...formData } : h,
        ),
      );
    }
    handleCloseModal();
  };

  const handleDelete = (help: StateHelp) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${help.name}" ?`)) {
      setHelps(helps.filter((h) => h.id !== help.id));
    }
  };

  const renderActions = (help: StateHelp) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleOpenModal("view", help)}>
          <Eye className="h-4 w-4 mr-2 text-green-600" />
          Voir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenModal("edit", help)}>
          <Pencil className="h-4 w-4 mr-2 text-orange-500" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => handleDelete(help)}
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
          <h1 className="text-3xl font-bold">Aides de l&apos;État</h1>
          <p className="text-muted-foreground">
            Configuration des réductions et exonérations employeur (Fillon,
            aides à l&apos;embauche, etc.)
          </p>
        </div>
        <Button onClick={() => handleOpenModal("create")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Aide
        </Button>
      </div>

      {/* Stats */}
      <InfoCardContainer className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          title="Total Aides"
          value={stats.total}
          icon={HandCoins}
          color="blue"
        />
        <InfoCard
          title="Réductions"
          value={stats.reductions}
          icon={TrendingDown}
          color="green"
        />
        <InfoCard
          title="Crédits"
          value={stats.credits}
          icon={Calculator}
          color="purple"
        />
        <InfoCard
          title="Exonérations"
          value={stats.exonerations}
          icon={CheckCircle}
          color="orange"
        />
      </InfoCardContainer>

      {/* Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Références SMIC 2024</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-sm text-muted-foreground">SMIC Horaire</p>
              <p className="text-2xl font-bold">
                {SMIC_HORAIRE_2024.toLocaleString("fr-FR")} €
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SMIC Mensuel</p>
              <p className="text-2xl font-bold">
                {SMIC_MENSUEL_2024.toLocaleString("fr-FR")} €
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                1.6 SMIC (plafond Fillon)
              </p>
              <p className="text-2xl font-bold">
                {(SMIC_MENSUEL_2024 * 1.6).toLocaleString("fr-FR")} €
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <DataTable
        data={enrichedHelps}
        columns={columns}
        filters={helpFilters}
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
            ? "Détails de l'Aide"
            : modalMode === "edit"
              ? "Modifier l'Aide"
              : "Nouvelle Aide"
        }
        description={
          modalMode === "view"
            ? "Informations détaillées de l'aide employeur"
            : "Configurez les paramètres de l'aide employeur"
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
              placeholder="ex: FILLON, APPRENTI"
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

          {/* Type */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type *
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: StateHelp["type"]) =>
                setFormData({ ...formData, type: value })
              }
              disabled={modalMode === "view"}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
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
              onValueChange={(value: StateHelp["calculationMethod"]) =>
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

          {/* Rate (for percentage) */}
          {formData.calculationMethod === "percentage" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rate" className="text-right">
                Taux (%)
              </Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rate: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                disabled={modalMode === "view"}
                className="col-span-3"
              />
            </div>
          )}

          {/* Amount (for fixed) */}
          {formData.calculationMethod === "fixed" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Montant (€)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                disabled={modalMode === "view"}
                className="col-span-3"
              />
            </div>
          )}

          {/* Formula (for formula) */}
          {formData.calculationMethod === "formula" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="formula" className="text-right">
                Formule
              </Label>
              <Input
                id="formula"
                value={formData.formula || ""}
                onChange={(e) =>
                  setFormData({ ...formData, formula: e.target.value })
                }
                disabled={modalMode === "view"}
                className="col-span-3"
                placeholder="ex: T × (1.6 × SMIC / salaire - 1)"
              />
            </div>
          )}

          {/* Max Amount */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="maxAmount" className="text-right">
              Plafond (€)
            </Label>
            <Input
              id="maxAmount"
              type="number"
              step="0.01"
              value={formData.maxAmount ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxAmount: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
              placeholder="Laisser vide si pas de plafond"
            />
          </div>

          {/* Effective Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="effectiveDate" className="text-right">
              Date d&apos;effet *
            </Label>
            <Input
              id="effectiveDate"
              type="date"
              value={formData.effectiveDate || ""}
              onChange={(e) =>
                setFormData({ ...formData, effectiveDate: e.target.value })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
            />
          </div>

          {/* End Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endDate" className="text-right">
              Date de fin
            </Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  endDate: e.target.value || undefined,
                })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
            />
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

          {/* Conditions (view mode only) */}
          {modalMode === "view" &&
            formData.conditions &&
            formData.conditions.length > 0 && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Conditions</Label>
                <div className="col-span-3 space-y-1">
                  {formData.conditions.map((condition, index) => (
                    <p key={index} className="text-sm text-muted-foreground">
                      • {condition}
                    </p>
                  ))}
                </div>
              </div>
            )}

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
