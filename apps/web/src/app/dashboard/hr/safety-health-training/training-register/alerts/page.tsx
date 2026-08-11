"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  MoreVertical,
  Eye,
  Bell,
  Award,
  Users,
} from "lucide-react";
import type { TrainingCertification, CertificationType } from "@/lib/types";

// Mock alerts data based on certifications
const mockAlerts: (TrainingCertification & {
  daysUntilExpiry: number;
  severity: "low" | "medium" | "high" | "critical";
})[] = [];

const certificationTypeLabels: Record<CertificationType, string> = {
  SSIAP1: "SSIAP 1",
  SSIAP2: "SSIAP 2",
  SSIAP3: "SSIAP 3",
  SST: "SST",
  H0B0: "H0B0",
  FIRE: "Habilitation incendie",
  OTHER: "Autre",
};

export default function TrainingAlertsPage() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<
    (typeof mockAlerts)[0] | null
  >(null);

  const handleViewAlert = (alert: (typeof mockAlerts)[0]) => {
    setSelectedAlert(alert);
    setIsViewModalOpen(true);
  };

  const handleAcknowledgeAlert = (alert: (typeof mockAlerts)[0]) => {
    setAlerts(
      alerts.map((a) =>
        a.id === alert.id ? { ...a, status: "acknowledged" as const } : a,
      ),
    );
  };

  const columns: ColumnDef<(typeof mockAlerts)[0]>[] = [
    {
      key: "employee",
      label: "Employé",
      icon: Users,
      sortable: true,
      sortValue: (alert) => alert.employeeName,
      render: (alert) => (
        <div>
          <div className="font-medium">{alert.employeeName}</div>
          <div className="text-sm text-muted-foreground">
            {alert.employeeId}
          </div>
        </div>
      ),
    },
    {
      key: "certification",
      label: "Certification",
      icon: Award,
      sortable: true,
      render: (alert) => (
        <div>
          <div className="font-medium">
            {certificationTypeLabels[alert.type]}{" "}
            {alert.level ? `Niveau ${alert.level}` : ""}
          </div>
          <div className="text-sm text-muted-foreground">{alert.number}</div>
        </div>
      ),
    },
    {
      key: "expiryDate",
      label: "Expiration",
      icon: Clock,
      sortable: true,
      render: (alert) => (
        <span className="text-sm">
          {alert.expiryDate.toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      key: "daysUntilExpiry",
      label: "Jours restants",
      sortable: true,
      sortValue: (alert) => alert.daysUntilExpiry,
      render: (alert) => (
        <span
          className={`text-sm font-medium ${
            alert.daysUntilExpiry < 0
              ? "text-red-600"
              : alert.daysUntilExpiry <= 30
                ? "text-orange-600"
                : "text-green-600"
          }`}
        >
          {alert.daysUntilExpiry < 0
            ? `Expiré il y a ${Math.abs(alert.daysUntilExpiry)} jour${Math.abs(alert.daysUntilExpiry) !== 1 ? "s" : ""}`
            : `${alert.daysUntilExpiry} jour${alert.daysUntilExpiry !== 1 ? "s" : ""}`}
        </span>
      ),
    },
    {
      key: "severity",
      label: "Sévérité",
      sortable: true,
      render: (alert) => (
        <Badge
          variant={
            alert.severity === "critical"
              ? "destructive"
              : alert.severity === "high"
                ? "default"
                : alert.severity === "medium"
                  ? "secondary"
                  : "outline"
          }
        >
          {alert.severity === "critical"
            ? "Critique"
            : alert.severity === "high"
              ? "Élevé"
              : alert.severity === "medium"
                ? "Moyen"
                : "Faible"}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (alert) => (
        <Badge
          variant={alert.status === "acknowledged" ? "default" : "secondary"}
        >
          {alert.status === "acknowledged" ? "Acquitté" : "En attente"}
        </Badge>
      ),
    },
  ];

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const highCount = alerts.filter((a) => a.severity === "high").length;
  const mediumCount = alerts.filter((a) => a.severity === "medium").length;
  const acknowledgedCount = alerts.filter(
    (a) => a.status === "acknowledged",
  ).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Alertes d&apos;expiration
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Alertes automatiques pour les certifications arrivant à expiration
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Bell}
          title="Total alertes"
          value={alerts.length}
          subtext="Alertes actives"
          color="blue"
        />
        <InfoCard
          icon={AlertTriangle}
          title="Critiques"
          value={criticalCount}
          subtext="Action immédiate requise"
          color="red"
        />
        <InfoCard
          icon={Clock}
          title="Élevées"
          value={highCount}
          subtext="Renouvellement urgent"
          color="orange"
        />
        <InfoCard
          icon={CheckCircle}
          title="Moyennes"
          value={mediumCount}
          subtext="À surveiller"
          color="yellow"
        />
        <InfoCard
          icon={CheckCircle}
          title="Acquittées"
          value={acknowledgedCount}
          subtext="Traitées"
          color="green"
        />
      </InfoCardContainer>

      {/* Alerts DataTable */}
      <DataTable
        onRowClick={handleViewAlert}
        data={alerts}
        columns={columns}
        searchKeys={["employeeName", "number"]}
        getSearchValue={(alert) => `${alert.employeeName} ${alert.number}`}
        searchPlaceholder="Rechercher par employé ou numéro..."
        getRowId={(alert) => alert.id}
        actions={(alert) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleViewAlert(alert)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir
              </DropdownMenuItem>
              {alert.status !== "acknowledged" && (
                <DropdownMenuItem
                  onClick={() => handleAcknowledgeAlert(alert)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Acquitter
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* View Alert Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de l'alerte"
        size="md"
      >
        {selectedAlert && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Employé</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedAlert.employeeName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedAlert.employeeId}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Certification</Label>
                <p className="text-sm text-muted-foreground">
                  {certificationTypeLabels[selectedAlert.type]}{" "}
                  {selectedAlert.level ? `Niveau ${selectedAlert.level}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedAlert.number}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Émetteur</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedAlert.issuer}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Sévérité</Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedAlert.severity === "critical"
                        ? "destructive"
                        : selectedAlert.severity === "high"
                          ? "default"
                          : selectedAlert.severity === "medium"
                            ? "secondary"
                            : "outline"
                    }
                  >
                    {selectedAlert.severity === "critical"
                      ? "Critique"
                      : selectedAlert.severity === "high"
                        ? "Élevé"
                        : selectedAlert.severity === "medium"
                          ? "Moyen"
                          : "Faible"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">
                  Date d&apos;émission
                </Label>
                <p className="text-sm text-muted-foreground">
                  {selectedAlert.issueDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Date d&apos;expiration
                </Label>
                <p className="text-sm text-muted-foreground">
                  {selectedAlert.expiryDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label className="text-sm font-medium">Jours restants</Label>
                <p
                  className={`text-sm font-medium ${
                    selectedAlert.daysUntilExpiry < 0
                      ? "text-red-600"
                      : selectedAlert.daysUntilExpiry <= 30
                        ? "text-orange-600"
                        : "text-green-600"
                  }`}
                >
                  {selectedAlert.daysUntilExpiry < 0
                    ? `Expiré il y a ${Math.abs(selectedAlert.daysUntilExpiry)} jour${Math.abs(selectedAlert.daysUntilExpiry) !== 1 ? "s" : ""}`
                    : `${selectedAlert.daysUntilExpiry} jour${selectedAlert.daysUntilExpiry !== 1 ? "s" : ""}`}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedAlert.status === "acknowledged"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {selectedAlert.status === "acknowledged"
                      ? "Acquitté"
                      : "En attente"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                Créée le {selectedAlert.createdAt.toLocaleDateString("fr-FR")}
              </div>
              <div>
                Modifiée le{" "}
                {selectedAlert.updatedAt.toLocaleDateString("fr-FR")}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
