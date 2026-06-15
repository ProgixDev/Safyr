"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import type { PayrollAnomaly, PayrollAnomalyType } from "@/lib/types";

// Mock data
const mockAnomalies: PayrollAnomaly[] = [
  {
    id: "1",
    employeeId: "EMP001",
    employeeName: "Jean Dupont",
    type: "missing_hours",
    description: "Heures travaillées manquantes pour décembre 2024",
    severity: "high",
    period: "2024-12",
    expectedValue: 160,
    actualValue: 145,
    status: "open",
    createdAt: new Date("2024-12-20"),
    updatedAt: new Date("2024-12-20"),
  },
  {
    id: "2",
    employeeId: "EMP002",
    employeeName: "Marie Martin",
    type: "contribution_error",
    description: "Erreur dans le calcul des cotisations sociales",
    severity: "medium",
    period: "2024-12",
    expectedValue: 410,
    actualValue: 380,
    currency: "EUR",
    status: "investigating",
    createdAt: new Date("2024-12-19"),
    updatedAt: new Date("2024-12-20"),
  },
  {
    id: "3",
    employeeId: "EMP003",
    employeeName: "Pierre Durand",
    type: "incorrect_rate",
    description: "Taux horaire incorrect appliqué",
    severity: "critical",
    period: "2024-12",
    expectedValue: 21.5,
    actualValue: 19.8,
    currency: "EUR",
    status: "open",
    createdAt: new Date("2024-12-18"),
    updatedAt: new Date("2024-12-18"),
  },
  {
    id: "4",
    employeeId: "EMP004",
    employeeName: "Sophie Leroy",
    type: "duplicate_payment",
    description: "Paiement du même montant effectué deux fois",
    severity: "high",
    period: "2024-12",
    expectedValue: 2800,
    actualValue: 5600,
    currency: "EUR",
    status: "resolved",
    resolvedBy: "Admin",
    resolvedAt: new Date("2024-12-17"),
    notes: "Doublon identifié et corrigé",
    createdAt: new Date("2024-12-16"),
    updatedAt: new Date("2024-12-17"),
  },
  {
    id: "5",
    employeeId: "EMP005",
    employeeName: "Lucas Moreau",
    type: "missing_allowance",
    description: "Indemnité de repas non versée",
    severity: "low",
    period: "2024-12",
    expectedValue: 120,
    actualValue: 0,
    currency: "EUR",
    status: "resolved",
    resolvedBy: "Admin",
    resolvedAt: new Date("2024-12-15"),
    notes: "Indemnité ajoutée manuellement",
    createdAt: new Date("2024-12-14"),
    updatedAt: new Date("2024-12-15"),
  },
];

const anomalyTypeLabels: Record<PayrollAnomalyType, string> = {
  missing_hours: "Heures manquantes",
  incorrect_rate: "Taux incorrect",
  duplicate_payment: "Paiement doublon",
  missing_allowance: "Indemnité manquante",
  contribution_error: "Erreur cotisations",
  tax_calculation_error: "Erreur impôts",
  hours_vs_planning: "Heures vs Planning",
  duplicate_entry: "Saisie en doublon",
  missing_entry: "Saisie manquante",
  excessive_hours: "Heures excessives",
  insufficient_rest: "Repos insuffisant",
  bonus_inconsistency: "Incohérence prime",
  ijss_mismatch: "IJSS incorrect",
  ijss_missing: "IJSS manquant",
  overtime_limit: "Limite heures sup.",
  other: "Autre",
};

const severityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
  info: "bg-gray-100 text-gray-800",
  warning: "bg-yellow-100 text-yellow-800",
};

const statusLabels = {
  open: "Ouvert",
  investigating: "En cours",
  resolved: "Résolu",
  dismissed: "Rejeté",
  pending: "En attente",
  reviewed: "Examiné",
  corrected: "Corrigé",
  ignored: "Ignoré",
  false_positive: "Faux positif",
};

export default function PayrollControlPage() {
  const [anomalies, setAnomalies] = useState<PayrollAnomaly[]>(mockAnomalies);
  const [selectedAnomaly, setSelectedAnomaly] = useState<PayrollAnomaly | null>(
    null,
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [editSeverity, setEditSeverity] = useState<
    "low" | "medium" | "high" | "critical" | "info" | "warning"
  >("low");
  const [editType, setEditType] = useState<PayrollAnomalyType>("missing_hours");

  const handleViewDetails = (anomaly: PayrollAnomaly) => {
    setSelectedAnomaly(anomaly);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (anomaly: PayrollAnomaly) => {
    setSelectedAnomaly(anomaly);
    setEditDescription(anomaly.description);
    setEditSeverity(anomaly.severity);
    setEditType(anomaly.type);
    setIsEditModalOpen(true);
  };

  const handleDelete = (anomaly: PayrollAnomaly) => {
    setSelectedAnomaly(anomaly);
    setIsDeleteModalOpen(true);
  };

  const confirmResolve = (notes: string) => {
    if (selectedAnomaly) {
      setAnomalies(
        anomalies.map((a) =>
          a.id === selectedAnomaly.id
            ? {
                ...a,
                status: "resolved",
                resolvedBy: "Admin",
                resolvedAt: new Date(),
                notes,
                updatedAt: new Date(),
              }
            : a,
        ),
      );
      setSelectedAnomaly(null);
    }
  };

  const confirmEdit = () => {
    if (selectedAnomaly) {
      setAnomalies(
        anomalies.map((a) =>
          a.id === selectedAnomaly.id
            ? {
                ...a,
                description: editDescription,
                severity: editSeverity,
                type: editType,
                updatedAt: new Date(),
              }
            : a,
        ),
      );
      setIsEditModalOpen(false);
      setSelectedAnomaly(null);
    }
  };

  const confirmDelete = () => {
    if (selectedAnomaly) {
      setAnomalies(anomalies.filter((a) => a.id !== selectedAnomaly.id));
      setIsDeleteModalOpen(false);
      setSelectedAnomaly(null);
    }
  };

  const handleDismiss = (anomaly: PayrollAnomaly) => {
    setAnomalies(
      anomalies.map((a) =>
        a.id === anomaly.id
          ? {
              ...a,
              status: "dismissed",
              resolvedBy: "Admin",
              resolvedAt: new Date(),
              updatedAt: new Date(),
            }
          : a,
      ),
    );
  };

  const columns: ColumnDef<PayrollAnomaly>[] = [
    {
      key: "employee",
      label: "Employé",
      icon: Users,
      sortable: true,
      sortValue: (anomaly) => anomaly.employeeName,
      render: (anomaly) => (
        <div>
          <div className="font-medium">{anomaly.employeeName}</div>
          <div className="text-sm text-muted-foreground">
            {anomaly.employeeId}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type d'anomalie",
      sortable: true,
      render: (anomaly) => (
        <Badge variant="outline">{anomalyTypeLabels[anomaly.type]}</Badge>
      ),
    },
    {
      key: "severity",
      label: "Sévérité",
      sortable: true,
      render: (anomaly) => (
        <Badge className={severityColors[anomaly.severity]}>
          {anomaly.severity === "low"
            ? "Faible"
            : anomaly.severity === "medium"
              ? "Moyen"
              : anomaly.severity === "high"
                ? "Élevé"
                : "Critique"}
        </Badge>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (anomaly) => (
        <span className="text-sm">{anomaly.description}</span>
      ),
    },
    {
      key: "period",
      label: "Période",
      sortable: true,
      render: (anomaly) => <span className="text-sm">{anomaly.period}</span>,
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (anomaly) => (
        <Badge
          variant={
            anomaly.status === "resolved"
              ? "default"
              : anomaly.status === "investigating"
                ? "secondary"
                : anomaly.status === "dismissed"
                  ? "outline"
                  : "destructive"
          }
        >
          {statusLabels[anomaly.status]}
        </Badge>
      ),
    },
  ];

  const stats = {
    total: anomalies.length,
    open: anomalies.filter((a) => a.status === "open").length,
    investigating: anomalies.filter((a) => a.status === "investigating").length,
    resolved: anomalies.filter((a) => a.status === "resolved").length,
    critical: anomalies.filter((a) => a.severity === "critical").length,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Contrôle de paie
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Détection et résolution des anomalies de paie
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Analyser
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Rapport
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={AlertTriangle}
          title="Total anomalies"
          value={stats.total}
          subtext="Ce mois-ci"
          color="gray"
        />

        <InfoCard
          icon={AlertCircle}
          title="Ouvertes"
          value={stats.open}
          subtext="Nécessitent attention"
          color="red"
        />

        <InfoCard
          icon={RefreshCw}
          title="En cours"
          value={stats.investigating}
          subtext="En investigation"
          color="orange"
        />

        <InfoCard
          icon={CheckCircle}
          title="Résolues"
          value={stats.resolved}
          subtext="Ce mois-ci"
          color="green"
        />

        <InfoCard
          icon={XCircle}
          title="Critiques"
          value={stats.critical}
          subtext="Priorité haute"
          color="red"
        />
      </InfoCardContainer>

      {/* Anomalies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anomalies détectées</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={anomalies}
            columns={columns}
            searchKeys={["employeeName", "description"]}
            getSearchValue={(anomaly) =>
              `${anomaly.employeeName} ${anomaly.description}`
            }
            searchPlaceholder="Rechercher par employé ou description..."
            getRowId={(anomaly) => anomaly.id}
            actions={(anomaly) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleViewDetails(anomaly)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(anomaly)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(anomaly)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Modal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        type="form"
        title="Voir l'anomalie"
        size="lg"
        actions={
          selectedAnomaly?.status === "open"
            ? {
                secondary: {
                  label: "Refuser",
                  onClick: () => {
                    if (selectedAnomaly) {
                      handleDismiss(selectedAnomaly);
                      setIsDetailsModalOpen(false);
                    }
                  },
                  variant: "outline",
                },
                primary: {
                  label: "Approuver",
                  onClick: () => {
                    if (selectedAnomaly) {
                      const notes =
                        (
                          document.getElementById(
                            "examine-notes",
                          ) as HTMLTextAreaElement
                        )?.value || "";
                      confirmResolve(notes);
                      setIsDetailsModalOpen(false);
                    }
                  },
                },
              }
            : undefined
        }
      >
        {selectedAnomaly && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Employé</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedAnomaly.employeeName} ({selectedAnomaly.employeeId})
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <p className="text-sm text-muted-foreground">
                  {anomalyTypeLabels[selectedAnomaly.type]}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Sévérité</Label>
                <Badge className={severityColors[selectedAnomaly.severity]}>
                  {selectedAnomaly.severity === "low"
                    ? "Faible"
                    : selectedAnomaly.severity === "medium"
                      ? "Moyen"
                      : selectedAnomaly.severity === "high"
                        ? "Élevé"
                        : "Critique"}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <Badge
                  variant={
                    selectedAnomaly.status === "resolved"
                      ? "default"
                      : selectedAnomaly.status === "investigating"
                        ? "secondary"
                        : selectedAnomaly.status === "dismissed"
                          ? "outline"
                          : "destructive"
                  }
                >
                  {statusLabels[selectedAnomaly.status]}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedAnomaly.description}
              </p>
            </div>

            {(selectedAnomaly.expectedValue || selectedAnomaly.actualValue) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Valeur attendue</Label>
                  <p className="text-sm font-mono">
                    {selectedAnomaly.expectedValue}
                    {selectedAnomaly.currency && ` ${selectedAnomaly.currency}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Valeur actuelle</Label>
                  <p className="text-sm font-mono">
                    {selectedAnomaly.actualValue}
                    {selectedAnomaly.currency && ` ${selectedAnomaly.currency}`}
                  </p>
                </div>
              </div>
            )}

            {selectedAnomaly.notes && (
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedAnomaly.notes}
                </p>
              </div>
            )}

            {selectedAnomaly.status === "open" && (
              <div className="space-y-2">
                <Label htmlFor="examine-notes">Notes de résolution</Label>
                <Textarea
                  id="examine-notes"
                  placeholder="Décrivez la résolution apportée..."
                  rows={3}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                Créée le {selectedAnomaly.createdAt.toLocaleDateString("fr-FR")}
              </div>
              <div>
                Modifiée le{" "}
                {selectedAnomaly.updatedAt.toLocaleDateString("fr-FR")}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        type="form"
        title="Modifier l'anomalie"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsEditModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: "Enregistrer",
            onClick: confirmEdit,
          },
        }}
      >
        {selectedAnomaly && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium">{selectedAnomaly.employeeName}</h4>
              <p className="text-sm text-muted-foreground">
                {selectedAnomaly.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-severity">Sévérité</Label>
                <Select
                  value={editSeverity}
                  onValueChange={(value) =>
                    setEditSeverity(
                      value as "low" | "medium" | "high" | "critical",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="high">Élevé</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={editType}
                  onValueChange={(value) =>
                    setEditType(value as PayrollAnomalyType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(anomalyTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        type="form"
        title="Confirmer la suppression"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsDeleteModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: "Supprimer",
            onClick: confirmDelete,
          },
        }}
      >
        {selectedAnomaly && (
          <p>
            Êtes-vous sûr de vouloir supprimer cette anomalie pour{" "}
            {selectedAnomaly.employeeName} ?
          </p>
        )}
      </Modal>
    </div>
  );
}
