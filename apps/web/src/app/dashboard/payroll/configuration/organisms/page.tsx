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
  Building2,
  Users,
  Briefcase,
  Percent,
} from "lucide-react";
import {
  mockOrganismRules,
  organisms,
  PLAFOND_SS_MENSUEL,
} from "@/data/payroll-organisms";
import { OrganismRule } from "@/lib/types.d";

type ModalMode = "view" | "create" | "edit" | null;

const categoryLabels: Record<OrganismRule["category"], string> = {
  health: "Santé",
  retirement: "Retraite",
  unemployment: "Chômage",
  family: "Famille",
  accident: "AT/MP",
  csg: "CSG",
  crds: "CRDS",
  other: "Autres",
};

const appliesToLabels: Record<OrganismRule["appliesTo"], string> = {
  employee: "Salarié",
  employer: "Employeur",
  both: "Les deux",
};

export default function OrganismsConfigurationPage() {
  const [rules, setRules] = useState<OrganismRule[]>(mockOrganismRules);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedRule, setSelectedRule] = useState<OrganismRule | null>(null);
  const [formData, setFormData] = useState<Partial<OrganismRule>>({});
  // Stats
  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.isActive).length,
    employee: rules.filter(
      (r) => r.appliesTo === "employee" || r.appliesTo === "both",
    ).length,
    employer: rules.filter(
      (r) => r.appliesTo === "employer" || r.appliesTo === "both",
    ).length,
  };

  // Filters for DataTable
  const ruleFilters: FilterDef[] = [
    {
      key: "appliesTo",
      label: "S'applique à",
      options: [
        { value: "all", label: "Tous" },
        { value: "employee", label: "Salarié" },
        { value: "employer", label: "Employeur" },
        { value: "both", label: "Les deux" },
      ],
    },
    {
      key: "organism",
      label: "Organisme",
      options: [
        { value: "all", label: "Tous les organismes" },
        ...organisms.map((org) => ({ value: org.name, label: org.name })),
      ],
    },
    {
      key: "category",
      label: "Catégorie",
      options: [
        { value: "all", label: "Toutes les catégories" },
        { value: "health", label: "Santé" },
        { value: "retirement", label: "Retraite" },
        { value: "unemployment", label: "Chômage" },
        { value: "family", label: "Famille" },
        { value: "accident", label: "AT/MP" },
        { value: "csg", label: "CSG" },
        { value: "crds", label: "CRDS" },
        { value: "other", label: "Autres" },
      ],
    },
  ];

  const columns: ColumnDef<OrganismRule>[] = [
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
      key: "organism",
      label: "Organisme",
      sortable: true,
      render: (item) => <Badge variant="outline">{item.organism}</Badge>,
    },
    {
      key: "category",
      label: "Catégorie",
      sortable: true,
      render: (item) => categoryLabels[item.category],
    },
    {
      key: "appliesTo",
      label: "S'applique à",
      sortable: true,
      render: (item) => {
        const colors = {
          employee: "bg-blue-100 text-blue-800 border-blue-200",
          employer: "bg-purple-100 text-purple-800 border-purple-200",
          both: "bg-green-100 text-green-800 border-green-200",
        };
        return (
          <Badge className={colors[item.appliesTo]}>
            {appliesToLabels[item.appliesTo]}
          </Badge>
        );
      },
    },
    {
      key: "rateEmployee",
      label: "Taux Salarié",
      sortable: true,
      render: (item) =>
        item.rateEmployee !== undefined ? `${item.rateEmployee}%` : "-",
    },
    {
      key: "rateEmployer",
      label: "Taux Employeur",
      sortable: true,
      render: (item) =>
        item.rateEmployer !== undefined ? `${item.rateEmployer}%` : "-",
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

  const handleOpenModal = (mode: ModalMode, rule?: OrganismRule) => {
    setModalMode(mode);
    if (rule) {
      setSelectedRule(rule);
      setFormData(rule);
    } else {
      setSelectedRule(null);
      setFormData({
        isActive: true,
        appliesTo: "both",
        category: "other",
        organism: "URSSAF",
        effectiveDate: new Date().toISOString().split("T")[0],
      });
    }
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedRule(null);
    setFormData({});
  };

  const handleSave = () => {
    if (modalMode === "create") {
      const newRule: OrganismRule = {
        id: `org-${Date.now()}`,
        code: formData.code || "",
        name: formData.name || "",
        organism: formData.organism || "URSSAF",
        category: formData.category || "other",
        appliesTo: formData.appliesTo || "both",
        rateEmployee: formData.rateEmployee,
        rateEmployer: formData.rateEmployer,
        ceiling: formData.ceiling,
        tranche: formData.tranche,
        isActive: formData.isActive ?? true,
        effectiveDate: formData.effectiveDate || "",
        endDate: formData.endDate,
        description: formData.description,
      };
      setRules([...rules, newRule]);
    } else if (modalMode === "edit" && selectedRule) {
      setRules(
        rules.map((r) =>
          r.id === selectedRule.id ? { ...r, ...formData } : r,
        ),
      );
    }
    handleCloseModal();
  };

  const handleDelete = (rule: OrganismRule) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${rule.name}" ?`)) {
      setRules(rules.filter((r) => r.id !== rule.id));
    }
  };

  const renderActions = (rule: OrganismRule) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleOpenModal("view", rule)}>
          <Eye className="h-4 w-4 mr-2 text-green-600" />
          Voir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenModal("edit", rule)}>
          <Pencil className="h-4 w-4 mr-2 text-orange-500" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => handleDelete(rule)}
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
          <h1 className="text-3xl font-bold">Règles des Organismes</h1>
          <p className="text-muted-foreground">
            Configuration des cotisations sociales (URSSAF, AGIRC-ARRCO, etc.)
          </p>
        </div>
        <Button onClick={() => handleOpenModal("create")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Règle
        </Button>
      </div>

      {/* Stats */}
      <InfoCardContainer className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          title="Total Règles"
          value={stats.total}
          icon={Building2}
          color="blue"
        />
        <InfoCard
          title="Règles Actives"
          value={stats.active}
          icon={Percent}
          color="green"
        />
        <InfoCard
          title="Cotisations Salariales"
          value={stats.employee}
          icon={Users}
          color="purple"
        />
        <InfoCard
          title="Cotisations Patronales"
          value={stats.employer}
          icon={Briefcase}
          color="orange"
        />
      </InfoCardContainer>

      {/* Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Plafond Sécurité Sociale 2026
            </CardTitle>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Mis à jour automatiquement
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div>
              <p className="text-sm text-muted-foreground">Mensuel</p>
              <p className="text-2xl font-bold">
                {PLAFOND_SS_MENSUEL.toLocaleString("fr-FR")} €
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Annuel</p>
              <p className="text-2xl font-bold">
                {(PLAFOND_SS_MENSUEL * 12).toLocaleString("fr-FR")} €
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Plafond utilisé pour le calcul des tranches A, B et C des
            cotisations sociales
          </p>
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable
        data={rules}
        columns={columns}
        filters={ruleFilters}
        searchKeys={["code", "name", "organism"]}
        searchPlaceholder="Rechercher par code, nom ou organisme..."
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
            ? "Détails de la Règle"
            : modalMode === "edit"
              ? "Modifier la Règle"
              : "Nouvelle Règle"
        }
        description={
          modalMode === "view"
            ? "Informations détaillées de la règle de cotisation"
            : "Configurez les paramètres de la règle de cotisation"
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
              placeholder="ex: MALADIE, CSG_DEDUCTIBLE"
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

          {/* Organism */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="organism" className="text-right">
              Organisme *
            </Label>
            <Select
              value={formData.organism}
              onValueChange={(value) =>
                setFormData({ ...formData, organism: value })
              }
              disabled={modalMode === "view"}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner un organisme" />
              </SelectTrigger>
              <SelectContent>
                {organisms.map((org) => (
                  <SelectItem key={org.id} value={org.name}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Catégorie *
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value: OrganismRule["category"]) =>
                setFormData({ ...formData, category: value })
              }
              disabled={modalMode === "view"}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Applies To */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="appliesTo" className="text-right">
              S&apos;applique à *
            </Label>
            <Select
              value={formData.appliesTo}
              onValueChange={(value: OrganismRule["appliesTo"]) =>
                setFormData({ ...formData, appliesTo: value })
              }
              disabled={modalMode === "view"}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(appliesToLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rate Employee */}
          {(formData.appliesTo === "employee" ||
            formData.appliesTo === "both") && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rateEmployee" className="text-right">
                Taux Salarié (%)
              </Label>
              <Input
                id="rateEmployee"
                type="number"
                step="0.01"
                value={formData.rateEmployee ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rateEmployee: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                disabled={modalMode === "view"}
                className="col-span-3"
              />
            </div>
          )}

          {/* Rate Employer */}
          {(formData.appliesTo === "employer" ||
            formData.appliesTo === "both") && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rateEmployer" className="text-right">
                Taux Employeur (%)
              </Label>
              <Input
                id="rateEmployer"
                type="number"
                step="0.01"
                value={formData.rateEmployer ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rateEmployer: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                disabled={modalMode === "view"}
                className="col-span-3"
              />
            </div>
          )}

          {/* Ceiling */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ceiling" className="text-right">
              Plafond (€)
            </Label>
            <Input
              id="ceiling"
              type="number"
              step="0.01"
              value={formData.ceiling ?? ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ceiling: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
              placeholder="Laisser vide si pas de plafond"
            />
          </div>

          {/* Tranche */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tranche" className="text-right">
              Tranche
            </Label>
            <Select
              value={formData.tranche}
              onValueChange={(value: "A" | "B" | "C" | "all" | "") =>
                setFormData({
                  ...formData,
                  tranche:
                    value === ""
                      ? undefined
                      : (value as "A" | "B" | "C" | "all"),
                })
              }
              disabled={modalMode === "view"}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner une tranche (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Aucune</SelectItem>
                <SelectItem value="A">
                  Tranche A (jusqu&apos;au plafond SS)
                </SelectItem>
                <SelectItem value="B">Tranche B (1 à 4 plafonds SS)</SelectItem>
                <SelectItem value="C">Tranche C (4 à 8 plafonds SS)</SelectItem>
                <SelectItem value="all">Totalité du salaire</SelectItem>
              </SelectContent>
            </Select>
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
