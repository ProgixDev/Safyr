"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
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
import {
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Info,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  mockLegalConventions,
  LegalConvention,
} from "@/data/payroll-company-config";
import { autoPopulateConventionParameters } from "@/data/payroll-conventions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConventionAutoPopulate } from "@/hooks/useConvention";
import { getLegifranceURL, isValidIDCC } from "@/services/legifrance-api";

type ModalMode = "view" | "create" | "edit" | null;

export default function LegalConfigurationPage() {
  const [conventions, setConventions] =
    useState<LegalConvention[]>(mockLegalConventions);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedConvention, setSelectedConvention] =
    useState<LegalConvention | null>(null);
  const [formData, setFormData] = useState<Partial<LegalConvention>>({});
  const { autoPopulate, populating, populateError } =
    useConventionAutoPopulate();
  const [apiSuccess, setApiSuccess] = useState(false);

  const columns: ColumnDef<LegalConvention>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
    },
    {
      key: "name",
      label: "Convention Collective",
      sortable: true,
    },
    {
      key: "idcc",
      label: "IDCC",
      sortable: true,
    },
    {
      key: "hourlyRate",
      label: "Taux Horaire Base",
      sortable: true,
      render: (item) => `${item.hourlyRate.toFixed(2)} €`,
    },
    {
      key: "overtime50",
      label: "Majoration 50%",
      render: (item) => `${item.overtime50}%`,
    },
    {
      key: "overtime100",
      label: "Majoration 100%",
      render: (item) => `${item.overtime100}%`,
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

  const handleOpenModal = (mode: ModalMode, convention?: LegalConvention) => {
    setModalMode(mode);
    if (convention) {
      setSelectedConvention(convention);
      setFormData(convention);
    } else {
      setSelectedConvention(null);
      setFormData({
        status: "Actif",
        overtime50: 25,
        overtime100: 50,
        nightBonus: 15,
        sundayBonus: 40,
        holidayBonus: 100,
      });
    }
  };

  // Auto-populate convention data when IDCC changes
  const handleIDCCChange = async (idcc: string) => {
    setFormData({ ...formData, idcc });
    setApiSuccess(false);

    if (!idcc || !isValidIDCC(idcc)) {
      return;
    }

    // Try to fetch from Légifrance API first
    const apiData = await autoPopulate(idcc);
    if (apiData) {
      setFormData({
        ...formData,
        idcc,
        name: apiData.name || formData.name,
        code: apiData.idcc || formData.code,
        hourlyRate: apiData.minimumWage || formData.hourlyRate,
        overtime50: apiData.overtimeRate || formData.overtime50,
        overtime100: 50, // Default
        nightBonus: apiData.nightBonus || formData.nightBonus,
        sundayBonus: apiData.sundayBonus || formData.sundayBonus,
        holidayBonus: apiData.holidayBonus || formData.holidayBonus,
      });
      setApiSuccess(true);
      return;
    }

    // Fallback to local mock data
    const autoData = autoPopulateConventionParameters(idcc);
    if (autoData && autoData.idcc === idcc) {
      setFormData({
        ...formData,
        idcc,
        name: autoData.name || formData.name,
        code: autoData.idcc || formData.code,
        hourlyRate: autoData.minimumWage || formData.hourlyRate,
        overtime50: autoData.overtimeRate || formData.overtime50,
        overtime100: 50, // Default
        nightBonus: autoData.nightBonus || formData.nightBonus,
        sundayBonus: autoData.sundayBonus || formData.sundayBonus,
        holidayBonus: autoData.holidayBonus || formData.holidayBonus,
      });
    }
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedConvention(null);
    setFormData({});
  };

  const handleSave = () => {
    if (modalMode === "create") {
      const newConvention: LegalConvention = {
        id: `${conventions.length + 1}`,
        code: formData.code || "",
        name: formData.name || "",
        idcc: formData.idcc || "",
        hourlyRate: formData.hourlyRate || 0,
        overtime50: formData.overtime50 || 25,
        overtime100: formData.overtime100 || 50,
        nightBonus: formData.nightBonus || 0,
        sundayBonus: formData.sundayBonus || 0,
        holidayBonus: formData.holidayBonus || 0,
        status: formData.status || "Actif",
      };
      setConventions([...conventions, newConvention]);
    } else if (modalMode === "edit" && selectedConvention) {
      setConventions(
        conventions.map((c) =>
          c.id === selectedConvention.id ? { ...c, ...formData } : c,
        ),
      );
    }
    handleCloseModal();
  };

  const handleDelete = (convention: LegalConvention) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${convention.name}" ?`)) {
      setConventions(conventions.filter((c) => c.id !== convention.id));
    }
  };

  const renderActions = (convention: LegalConvention) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleOpenModal("view", convention)}>
          <Eye className="h-4 w-4 mr-2 text-green-600" />
          Voir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenModal("edit", convention)}>
          <Pencil className="h-4 w-4 mr-2 text-orange-500" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDelete(convention)}
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
          <h1 className="text-3xl font-bold">Paramétrage Légal</h1>
          <p className="text-muted-foreground">
            Configuration des conventions collectives et paramètres légaux de
            paie
          </p>
        </div>
        <Button onClick={() => handleOpenModal("create")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Convention
        </Button>
      </div>

      {/* DataTable */}
      <DataTable
        data={conventions}
        columns={columns}
        searchKeys={["code", "name", "idcc"]}
        searchPlaceholder="Rechercher par code, nom ou IDCC..."
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
            ? "Détails de la Convention"
            : modalMode === "edit"
              ? "Modifier la Convention"
              : "Nouvelle Convention"
        }
        description={
          modalMode === "view"
            ? "Informations détaillées de la convention collective"
            : "Renseignez les informations de la convention collective"
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
          {modalMode === "create" && (
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Saisissez l&apos;IDCC pour récupérer automatiquement les
                paramètres depuis la base officielle Légifrance (taux horaire,
                majorations, primes, etc.). Les données sont mises à jour depuis
                les sources officielles.
              </AlertDescription>
            </Alert>
          )}

          {populateError && modalMode === "create" && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {populateError} - Utilisation des données locales par défaut.
              </AlertDescription>
            </Alert>
          )}

          {/* IDCC - Move to top for auto-population */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="idcc" className="text-right">
              IDCC *
            </Label>
            <div className="col-span-3">
              <div className="flex gap-2">
                <Input
                  id="idcc"
                  placeholder="Ex: 1351, 3199, 4127"
                  value={formData.idcc || ""}
                  onChange={(e) => handleIDCCChange(e.target.value)}
                  disabled={modalMode === "view" || populating}
                />
                {populating && (
                  <Loader2 className="h-4 w-4 animate-spin mt-2" />
                )}
                {formData.idcc && isValidIDCC(formData.idcc) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        getLegifranceURL(formData.idcc!, formData.code),
                        "_blank",
                      )
                    }
                    disabled={modalMode === "view"}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {modalMode === "create" && apiSuccess && formData.name && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Convention IDCC {formData.idcc} récupérée depuis Légifrance
                  - Paramètres chargés automatiquement
                </p>
              )}
              {modalMode === "create" &&
                formData.idcc &&
                formData.name &&
                !apiSuccess && (
                  <p className="text-xs text-blue-600 mt-1">
                    ✓ Convention IDCC {formData.idcc} reconnue localement -
                    Paramètres chargés
                  </p>
                )}
            </div>
          </div>

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

          {/* Hourly Rate */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hourlyRate" className="text-right">
              Taux Horaire Base (€) *
            </Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              placeholder="Ex: 12.00"
              value={formData.hourlyRate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hourlyRate: parseFloat(e.target.value),
                })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
            />
          </div>

          {/* Overtime 50% */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="overtime50" className="text-right">
              Maj. Heures Sup. (%)
            </Label>
            <Input
              id="overtime50"
              type="number"
              placeholder="Ex: 25"
              value={formData.overtime50 || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  overtime50: parseFloat(e.target.value),
                })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
            />
          </div>

          {/* Overtime 100% */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="overtime100" className="text-right">
              Majoration 100% (%)
            </Label>
            <Input
              id="overtime100"
              type="number"
              value={formData.overtime100 || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  overtime100: parseFloat(e.target.value),
                })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
            />
          </div>

          {/* Night Bonus */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nightBonus" className="text-right">
              Maj. Nuit (%)
            </Label>
            <Input
              id="nightBonus"
              type="number"
              placeholder="Ex: 10"
              value={formData.nightBonus || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nightBonus: parseFloat(e.target.value),
                })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
            />
          </div>

          {/* Sunday Bonus */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sundayBonus" className="text-right">
              Maj. Dimanche (%)
            </Label>
            <Input
              id="sundayBonus"
              type="number"
              placeholder="Ex: 40"
              value={formData.sundayBonus || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sundayBonus: parseFloat(e.target.value),
                })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
            />
          </div>

          {/* Holiday Bonus */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="holidayBonus" className="text-right">
              Maj. Férié (%)
            </Label>
            <Input
              id="holidayBonus"
              type="number"
              placeholder="Ex: 100"
              value={formData.holidayBonus || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  holidayBonus: parseFloat(e.target.value),
                })
              }
              disabled={modalMode === "view"}
              className="col-span-3"
            />
          </div>

          {/* Status */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Statut
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: "Actif" | "Inactif") =>
                setFormData({ ...formData, status: value })
              }
              disabled={modalMode === "view"}
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
        </div>
      </Modal>
    </div>
  );
}
