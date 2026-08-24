"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Building2,
  ArrowLeftRight,
} from "lucide-react";
import {
  mockCompanyStructures,
  mockAccountingTransfers,
  CompanyStructure,
  AccountingTransfer,
} from "@/data/payroll-company-config";

type EntityType = "structure" | "transfer";
type ModalMode = "view" | "create" | "edit" | null;

export default function CompanyConfigurationPage() {
  const [activeTab, setActiveTab] = useState("structures");
  const [structures, setStructures] = useState<CompanyStructure[]>(
    mockCompanyStructures,
  );
  const [transfers, setTransfers] = useState<AccountingTransfer[]>(
    mockAccountingTransfers,
  );

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [selectedItem, setSelectedItem] = useState<
    CompanyStructure | AccountingTransfer | null
  >(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Columns for Structures
  const structureColumns: ColumnDef<CompanyStructure>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
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
      render: (item) => <Badge variant="outline">{item.type}</Badge>,
    },
    {
      key: "siret",
      label: "SIRET",
      render: (item) => item.siret || "-",
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (item) => (
        <Badge variant={item.status === "Actif" ? "default" : "secondary"}>
          {item.status}
        </Badge>
      ),
    },
  ];

  // Columns for Accounting Transfers
  const transferColumns: ColumnDef<AccountingTransfer>[] = [
    {
      key: "name",
      label: "Nom",
      sortable: true,
    },
    {
      key: "transferType",
      label: "Type",
      sortable: true,
      render: (item) => <Badge variant="outline">{item.transferType}</Badge>,
    },
    {
      key: "accountPrefix",
      label: "Préfixe Compte",
      sortable: true,
    },
    {
      key: "analyticalAxis",
      label: "Axe Analytique",
      render: (item) => item.analyticalAxis || "-",
    },
    {
      key: "automaticTransfer",
      label: "Transfert Auto",
      render: (item) => (
        <Badge variant={item.automaticTransfer ? "default" : "secondary"}>
          {item.automaticTransfer ? "Oui" : "Non"}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (item) => (
        <Badge variant={item.status === "Actif" ? "default" : "secondary"}>
          {item.status}
        </Badge>
      ),
    },
  ];

  const handleOpenModal = (
    mode: ModalMode,
    type: EntityType,
    item?: CompanyStructure | AccountingTransfer,
  ) => {
    setModalMode(mode);
    setEntityType(type);
    if (item) {
      setSelectedItem(item);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFormData(item as Record<string, any>);
    } else {
      setSelectedItem(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFormData(getDefaultFormData(type) as Record<string, any>);
    }
  };

  const getDefaultFormData = (type: EntityType) => {
    switch (type) {
      case "structure":
        return { status: "Actif", type: "établissement" };
      case "transfer":
        return {
          status: "Actif",
          transferType: "Paie",
          automaticTransfer: false,
        };
      default:
        return {};
    }
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setEntityType(null);
    setSelectedItem(null);
    setFormData({});
  };

  const handleSave = () => {
    if (modalMode === "create") {
      const newId = `${Date.now()}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newItem = { id: newId, ...formData } as any;

      switch (entityType) {
        case "structure":
          setStructures([...structures, newItem as CompanyStructure]);
          break;
        case "transfer":
          setTransfers([...transfers, newItem as AccountingTransfer]);
          break;
      }
    } else if (modalMode === "edit" && selectedItem) {
      switch (entityType) {
        case "structure":
          setStructures(
            structures.map((s) =>
              s.id === selectedItem.id ? { ...s, ...formData } : s,
            ),
          );
          break;
        case "transfer":
          setTransfers(
            transfers.map((t) =>
              t.id === selectedItem.id ? { ...t, ...formData } : t,
            ),
          );
          break;
      }
    }
    handleCloseModal();
  };

  const handleDelete = (
    type: EntityType,
    item: CompanyStructure | AccountingTransfer,
  ) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer cet élément ?`)) {
      switch (type) {
        case "structure":
          setStructures(structures.filter((s) => s.id !== item.id));
          break;
        case "transfer":
          setTransfers(transfers.filter((t) => t.id !== item.id));
          break;
      }
    }
  };

  const renderActions = (
    type: EntityType,
    item: CompanyStructure | AccountingTransfer,
  ) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleOpenModal("view", type, item)}>
          <Eye className="h-4 w-4 mr-2 text-green-600" />
          Voir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenModal("edit", type, item)}>
          <Pencil className="h-4 w-4 mr-2 text-orange-500" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDelete(type, item)}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2 text-red-600" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderFormFields = () => {
    if (!entityType) return null;

    const isView = modalMode === "view";

    switch (entityType) {
      case "structure":
        return (
          <>
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
                disabled={isView}
                className="col-span-3"
              />
            </div>
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
                disabled={isView}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type *
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
                disabled={isView}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="société">Société</SelectItem>
                  <SelectItem value="établissement">Établissement</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="siret" className="text-right">
                SIRET
              </Label>
              <Input
                id="siret"
                value={formData.siret || ""}
                onChange={(e) =>
                  setFormData({ ...formData, siret: e.target.value })
                }
                disabled={isView}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Adresse
              </Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                disabled={isView}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Statut
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
                disabled={isView}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "transfer":
        return (
          <>
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
                disabled={isView}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transferType" className="text-right">
                Type *
              </Label>
              <Select
                value={formData.transferType}
                onValueChange={(value) =>
                  setFormData({ ...formData, transferType: value })
                }
                disabled={isView}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paie">Paie</SelectItem>
                  <SelectItem value="Charges">Charges</SelectItem>
                  <SelectItem value="Provisions">Provisions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountPrefix" className="text-right">
                Préfixe Compte *
              </Label>
              <Input
                id="accountPrefix"
                value={formData.accountPrefix || ""}
                onChange={(e) =>
                  setFormData({ ...formData, accountPrefix: e.target.value })
                }
                disabled={isView}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="analyticalAxis" className="text-right">
                Axe Analytique
              </Label>
              <Input
                id="analyticalAxis"
                value={formData.analyticalAxis || ""}
                onChange={(e) =>
                  setFormData({ ...formData, analyticalAxis: e.target.value })
                }
                disabled={isView}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="automaticTransfer" className="text-right">
                Transfert Automatique
              </Label>
              <div className="col-span-3 flex items-center">
                <Switch
                  id="automaticTransfer"
                  checked={formData.automaticTransfer || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, automaticTransfer: checked })
                  }
                  disabled={isView}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Statut
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
                disabled={isView}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    const entityName = {
      structure: "Organisme",
      transfer: "Transfert Comptable",
    }[entityType || "structure"];

    return modalMode === "view"
      ? `Détails ${entityName}`
      : modalMode === "edit"
        ? `Modifier ${entityName}`
        : `Nouveau ${entityName}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuration Organisme Social</h1>
        <p className="text-muted-foreground">
          Organismes et paramètres comptables
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="structures">
            <Building2 className="h-4 w-4 mr-2" />
            Organismes
          </TabsTrigger>
          <TabsTrigger value="transfers">
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Transferts Comptables
          </TabsTrigger>
        </TabsList>

        {/* Structures Tab */}
        <TabsContent value="structures" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Organismes</h2>
              <p className="text-sm text-muted-foreground">
                Sociétés, établissements et services
              </p>
            </div>
            <Button onClick={() => handleOpenModal("create", "structure")}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Organisme
            </Button>
          </div>
          <DataTable
            data={structures}
            columns={structureColumns}
            searchKeys={["code", "name", "type"]}
            searchPlaceholder="Rechercher..."
            actions={(item) => renderActions("structure", item)}
            onRowClick={(item) => handleOpenModal("view", "structure", item)}
          />
        </TabsContent>

        {/* Accounting Transfers Tab */}
        <TabsContent value="transfers" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Transferts Comptables</h2>
              <p className="text-sm text-muted-foreground">
                Configuration des exports vers la comptabilité
              </p>
            </div>
            <Button onClick={() => handleOpenModal("create", "transfer")}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Transfert
            </Button>
          </div>
          <DataTable
            data={transfers}
            columns={transferColumns}
            searchKeys={["name", "transferType"]}
            searchPlaceholder="Rechercher..."
            actions={(item) => renderActions("transfer", item)}
            onRowClick={(item) => handleOpenModal("view", "transfer", item)}
          />
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Modal
        open={modalMode !== null}
        onOpenChange={handleCloseModal}
        type={modalMode === "view" ? "details" : "form"}
        title={getModalTitle()}
        description={
          modalMode === "view"
            ? "Informations détaillées"
            : "Renseignez les informations"
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
        <div className="grid gap-4 py-4">{renderFormFields()}</div>
      </Modal>
    </div>
  );
}
