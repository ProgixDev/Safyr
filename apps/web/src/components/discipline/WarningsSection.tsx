"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { useEmployeeOptions } from "@/hooks/employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CheckCircle, Send } from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Combobox } from "@/components/ui/combobox";
import { useRegistre } from "@/hooks/fiscal/use-registre";
import { useOrganization } from "@/hooks/organization";
import { CourrierDialog } from "./CourrierDialog";
import { ResponsableSelect } from "./ResponsableSelect";
import {
  TYPES_SANCTION,
  TYPE_SANCTION_PAR_DEFAUT,
  dateFr,
  horodatage,
  type LigneSanction,
} from "./discipline-shared";

const CHAMPS_FICHIERS = ["document"] as const;

const statusLabels = {
  active: "Active",
  lifted: "Levée",
};

const statusColors = {
  active: "destructive",
  lifted: "secondary",
} as const;

/** Les sanctions saisies avant l'ajout du type étaient des avertissements. */
const typeDe = (ligne: { type?: string }) =>
  ligne.type || TYPE_SANCTION_PAR_DEFAUT;

const formulaireVide = () => ({
  employeeId: "",
  date: new Date().toISOString().split("T")[0],
  type: TYPE_SANCTION_PAR_DEFAUT as string,
  reason: "",
  description: "",
  issuedBy: "",
  status: "active" as "active" | "lifted",
});

export function WarningsSection() {
  const employees = useEmployeeOptions();
  const { data: organisation } = useOrganization();
  const employeeOptions = employees.map((employee) => ({
    value: employee.id,
    label: employee.name,
  }));
  // Les sanctions sont enregistrées en base (registre « avertissement » : la
  // clé n'a pas changé pour retrouver les lignes déjà saisies).
  const registre = useRegistre<LigneSanction>("avertissement", CHAMPS_FICHIERS);
  const sanctions = useMemo(
    () =>
      [...registre.lignes].sort(
        (a, b) => horodatage(b.date) - horodatage(a.date),
      ),
    [registre.lignes],
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<LigneSanction | null>(null);
  const [courrierSanction, setCourrierSanction] =
    useState<LigneSanction | null>(null);
  const [formData, setFormData] = useState(formulaireVide);
  const [erreurSauvegarde, setErreurSauvegarde] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? employee.name : "Employé inconnu";
  };

  const handleCreate = () => {
    setEditingId(null);
    // Par défaut vide : le responsable est choisi dans la liste enregistrée.
    setFormData(formulaireVide());
    setErreurSauvegarde(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (sanction: LigneSanction) => {
    setEditingId(sanction.id);
    setFormData({
      employeeId: sanction.employeeId,
      date: (sanction.date ?? "").slice(0, 10),
      type: typeDe(sanction),
      reason: sanction.reason ?? "",
      description: sanction.description ?? "",
      issuedBy: sanction.issuedBy ?? "",
      status: sanction.status ?? "active",
    });
    setErreurSauvegarde(null);
    setIsCreateModalOpen(true);
  };

  const handleView = (sanction: LigneSanction) => {
    setViewing(sanction);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette sanction ?")) {
      void registre.supprimerLigne(id);
    }
  };

  const enregistrer = async (ligne: LigneSanction) => {
    await registre.enregistrer(ligne, {
      period: (ligne.date || new Date().toISOString()).slice(0, 7),
      label: `${typeDe(ligne)} — ${getEmployeeName(ligne.employeeId)}`,
      status: ligne.status,
    });
  };

  const handleSave = async () => {
    setEnregistrement(true);
    setErreurSauvegarde(null);
    try {
      await enregistrer({
        id: editingId ?? "",
        employeeId: formData.employeeId,
        date: formData.date,
        type: formData.type,
        reason: formData.reason,
        description: formData.description,
        issuedBy: formData.issuedBy,
        status: formData.status,
      });
      setIsCreateModalOpen(false);
    } catch (e) {
      setErreurSauvegarde(
        `Échec de l'enregistrement : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    } finally {
      setEnregistrement(false);
    }
  };

  const handleStatusChange = (
    id: string,
    newStatus: LigneSanction["status"],
  ) => {
    const sanction = sanctions.find((s) => s.id === id);
    if (!sanction) return;
    void enregistrer({ ...sanction, status: newStatus });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const modeleCourrier = (sanction: LigneSanction) => {
    const type = typeDe(sanction);
    return {
      objet: `${type} du ${dateFr(sanction.date)}`,
      corps: [
        "Madame, Monsieur,",
        "",
        `Nous vous notifions par la présente la sanction disciplinaire suivante : ${type.toLowerCase()}, pour le motif suivant : ${sanction.reason}.`,
        "",
        sanction.description,
        "",
        "Cordialement,",
        sanction.issuedBy || organisation?.name || "La Direction",
      ].join("\n"),
    };
  };

  const isFormValid =
    formData.employeeId &&
    formData.date &&
    formData.type &&
    formData.reason &&
    formData.description;

  const columns: ColumnDef<LigneSanction>[] = [
    {
      key: "employeeId",
      label: "Employé",
      render: (sanction) => (
        <div>
          <div className="font-medium">
            <Link
              href={`/dashboard/hr/employees/${sanction.employeeId}`}
              className="text-primary hover:underline"
            >
              {getEmployeeName(sanction.employeeId)}
            </Link>
          </div>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (sanction) => dateFr(sanction.date),
    },
    {
      key: "type",
      label: "Type de sanction",
      render: (sanction) => typeDe(sanction),
    },
    {
      key: "reason",
      label: "Motif",
      render: (sanction) => sanction.reason,
    },
    {
      key: "status",
      label: "Statut",
      render: (sanction) => (
        <Badge variant={statusColors[sanction.status ?? "active"]}>
          {statusLabels[sanction.status ?? "active"]}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (sanction) => (
        <RowActionsMenu
          onView={() => handleView(sanction)}
          onEdit={() => handleEdit(sanction)}
          extraItems={[
            {
              label: "Envoyer un courrier",
              icon: Send,
              tone: "send",
              onClick: () => setCourrierSanction(sanction),
            },
            ...(sanction.status !== "lifted"
              ? [
                  {
                    label: "Lever la sanction",
                    icon: CheckCircle,
                    tone: "validate" as const,
                    onClick: () => handleStatusChange(sanction.id, "lifted"),
                  },
                ]
              : []),
          ]}
          onDelete={() => handleDelete(sanction.id)}
        />
      ),
    },
  ];

  const courrierEmployee = courrierSanction
    ? employees.find((e) => e.id === courrierSanction.employeeId)
    : undefined;
  const courrierModele = courrierSanction
    ? modeleCourrier(courrierSanction)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sanctions</h1>
          <p className="text-muted-foreground">
            Gestion des sanctions disciplinaires
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle sanction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sanctions ({sanctions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={sanctions}
            isLoading={registre.isLoading}
            columns={columns}
            getSearchValue={(s) =>
              `${getEmployeeName(s.employeeId)} ${typeDe(s)} ${s.reason ?? ""} ${s.description ?? ""}`
            }
            searchPlaceholder="Rechercher des sanctions..."
          />
        </CardContent>
      </Card>

      {/* Création / modification */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={editingId ? "Modifier la sanction" : "Nouvelle sanction"}
        description="Ajoutez ou modifiez les informations de la sanction."
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: enregistrement
              ? "Enregistrement…"
              : editingId
                ? "Enregistrer"
                : "Créer",
            onClick: () => void handleSave(),
            disabled: !isFormValid || enregistrement,
          },
        }}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employé *</Label>
              <Combobox
                options={employeeOptions}
                value={formData.employeeId}
                onValueChange={(value) =>
                  handleInputChange("employeeId", value)
                }
                placeholder="Sélectionner un employé"
                searchPlaceholder="Rechercher un employé..."
                emptyMessage="Aucun employé trouvé."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de sanction *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_SANCTION.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                  {/* Type saisi autrefois et absent de la liste actuelle. */}
                  {formData.type &&
                    !(TYPES_SANCTION as readonly string[]).includes(
                      formData.type,
                    ) && (
                      <SelectItem value={formData.type}>
                        {formData.type}
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motif *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange("reason", e.target.value)}
                placeholder="Ex: Retard répété"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "lifted") =>
                  handleInputChange("status", value)
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="lifted">Levée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuedBy">Émis par</Label>
              <ResponsableSelect
                id="issuedBy"
                value={formData.issuedBy}
                onChange={(nom) => handleInputChange("issuedBy", nom)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Détails de la sanction..."
              rows={3}
              required
            />
          </div>

          {erreurSauvegarde && (
            <p className="text-sm text-destructive">{erreurSauvegarde}</p>
          )}
        </div>
      </Modal>

      {/* Détails */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de la sanction"
        description={
          viewing
            ? `${getEmployeeName(viewing.employeeId)} - ${viewing.reason}`
            : ""
        }
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employé</Label>
                <p className="text-sm font-medium">
                  {getEmployeeName(viewing.employeeId)}
                </p>
              </div>
              <div>
                <Label>Date</Label>
                <p className="text-sm font-medium">{dateFr(viewing.date)}</p>
              </div>
              <div>
                <Label>Type de sanction</Label>
                <p className="text-sm font-medium">{typeDe(viewing)}</p>
              </div>
              <div>
                <Label>Motif</Label>
                <p className="text-sm font-medium">{viewing.reason}</p>
              </div>
              <div>
                <Label>Statut</Label>
                <Badge variant={statusColors[viewing.status ?? "active"]}>
                  {statusLabels[viewing.status ?? "active"]}
                </Badge>
              </div>
              <div>
                <Label>Émis par</Label>
                <p className="text-sm font-medium">{viewing.issuedBy || "—"}</p>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={viewing.description}
                readOnly
                className="min-h-20"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Envoi d'un courrier au salarié concerné */}
      {courrierSanction && courrierModele && (
        <CourrierDialog
          key={courrierSanction.id}
          destinataireNom={getEmployeeName(courrierSanction.employeeId)}
          destinataireEmail={courrierEmployee?.email ?? ""}
          objetInitial={courrierModele.objet}
          corpsInitial={courrierModele.corps}
          onClose={() => setCourrierSanction(null)}
        />
      )}
    </div>
  );
}
