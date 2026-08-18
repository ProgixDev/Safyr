"use client";

import { useState } from "react";
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
import { Plus, CheckCircle } from "lucide-react";
import { Warning } from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Combobox } from "@/components/ui/combobox";

// Mock data - replace with API call
const mockWarnings: Warning[] = [];

const statusLabels = {
  active: "Active",
  lifted: "Levée",
};

const statusColors = {
  active: "destructive",
  lifted: "secondary",
} as const;

export function WarningsSection() {
  const mockEmployees = useEmployeeOptions();
  const employeeOptions = mockEmployees.map((employee) => ({
    value: employee.id,
    label: employee.name,
  }));
  const [warnings, setWarnings] = useState<Warning[]>(mockWarnings);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingWarning, setEditingWarning] = useState<Warning | null>(null);
  const [viewingWarning, setViewingWarning] = useState<Warning | null>(null);
  const [formData, setFormData] = useState({
    employeeId: "",
    date: "",
    reason: "",
    description: "",
    issuedBy: "Alice Dubois", // Mock current user
    status: "active" as "active" | "lifted",
  });

  const handleCreate = () => {
    setEditingWarning(null);
    setFormData({
      employeeId: "",
      date: new Date().toISOString().split("T")[0],
      reason: "",
      description: "",
      issuedBy: "Alice Dubois",
      status: "active",
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (warning: Warning) => {
    setEditingWarning(warning);
    setFormData({
      employeeId: warning.employeeId,
      date: warning.date.toISOString().split("T")[0],
      reason: warning.reason,
      description: warning.description,
      issuedBy: warning.issuedBy,
      status: warning.status,
    });
    setIsCreateModalOpen(true);
  };

  const handleView = (warning: Warning) => {
    setViewingWarning(warning);
    setIsViewModalOpen(true);
  };

  const handleDelete = (warningId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet avertissement ?")) {
      setWarnings(warnings.filter((w) => w.id !== warningId));
    }
  };

  const handleSave = () => {
    const warningData = {
      employeeId: formData.employeeId,
      date: new Date(formData.date),
      reason: formData.reason,
      description: formData.description,
      issuedBy: formData.issuedBy,
      status: formData.status,
    };

    if (editingWarning) {
      setWarnings(
        warnings.map((w) =>
          w.id === editingWarning.id
            ? { ...w, ...warningData, updatedAt: new Date() }
            : w,
        ),
      );
    } else {
      const newWarning: Warning = {
        id: Date.now().toString(),
        ...warningData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setWarnings([...warnings, newWarning]);
    }
    setIsCreateModalOpen(false);
  };

  const handleStatusChange = (
    warningId: string,
    newStatus: Warning["status"],
  ) => {
    setWarnings(
      warnings.map((w) =>
        w.id === warningId
          ? { ...w, status: newStatus, updatedAt: new Date() }
          : w,
      ),
    );
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    formData.employeeId &&
    formData.date &&
    formData.reason &&
    formData.description;

  const getEmployeeName = (employeeId: string) => {
    const employee = mockEmployees.find((e) => e.id === employeeId);
    return employee ? employee.name : "Employé inconnu";
  };

  const columns: ColumnDef<Warning>[] = [
    {
      key: "employeeId",
      label: "Employé",
      render: (warning: Warning) => (
        <div>
          <div className="font-medium">
            <Link
              href={`/dashboard/hr/employees/${warning.employeeId}`}
              className="text-primary hover:underline"
            >
              {getEmployeeName(warning.employeeId)}
            </Link>
          </div>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (warning: Warning) => warning.date.toLocaleDateString("fr-FR"),
    },
    {
      key: "reason",
      label: "Motif",
      render: (warning: Warning) => warning.reason,
    },
    {
      key: "status",
      label: "Statut",
      render: (warning: Warning) => (
        <Badge variant={statusColors[warning.status]}>
          {statusLabels[warning.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (warning: Warning) => (
        <RowActionsMenu
          onView={() => handleView(warning)}
          onEdit={() => handleEdit(warning)}
          extraItems={
            warning.status === "active"
              ? [
                  {
                    label: "Lever l'avertissement",
                    icon: CheckCircle,
                    tone: "validate",
                    onClick: () => handleStatusChange(warning.id, "lifted"),
                  },
                ]
              : []
          }
          onDelete={() => handleDelete(warning.id)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Avertissements</h1>
          <p className="text-muted-foreground">
            Gestion des avertissements disciplinaires
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel avertissement
        </Button>
      </div>

      {/* Warnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Avertissements ({warnings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={warnings}
            columns={columns}
            searchKeys={["reason", "description"]}
            searchPlaceholder="Rechercher des avertissements..."
          />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={
          editingWarning ? "Modifier l'avertissement" : "Nouvel avertissement"
        }
        description="Ajoutez ou modifiez les informations de l'avertissement."
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: editingWarning ? "Enregistrer" : "Créer",
            onClick: handleSave,
            disabled: !isFormValid,
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="lifted">Levée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Détails de l'avertissement..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuedBy">Émis par</Label>
            <Input
              id="issuedBy"
              value={formData.issuedBy}
              onChange={(e) => handleInputChange("issuedBy", e.target.value)}
              placeholder="Nom de l'émetteur"
            />
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de l'avertissement"
        description={
          viewingWarning
            ? `${getEmployeeName(viewingWarning.employeeId)} - ${viewingWarning.reason}`
            : ""
        }
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {viewingWarning && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employé</Label>
                <p className="text-sm font-medium">
                  {getEmployeeName(viewingWarning.employeeId)}
                </p>
              </div>
              <div>
                <Label>Date</Label>
                <p className="text-sm font-medium">
                  {viewingWarning.date.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label>Motif</Label>
                <p className="text-sm font-medium">{viewingWarning.reason}</p>
              </div>
              <div>
                <Label>Statut</Label>
                <Badge variant={statusColors[viewingWarning.status]}>
                  {statusLabels[viewingWarning.status]}
                </Badge>
              </div>
              <div>
                <Label>Émis par</Label>
                <p className="text-sm font-medium">{viewingWarning.issuedBy}</p>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={viewingWarning.description}
                readOnly
                className="min-h-20"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
