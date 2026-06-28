"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  FileWarning,
  Gavel,
  Eye,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import type {
  Employee,
  Warning,
  DisciplinaryProcedure,
  Sanction,
} from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import {
  getEmployeeGeolocationSummary,
  HSE_TYPE_CONFIG,
  HSE_STATUS_CONFIG,
  type HSEIncident,
} from "@/data/hr-geolocation";

interface EmployeeDisciplineTabProps {
  employee: Employee;
}

const hseColumns: ColumnDef<HSEIncident>[] = [
  {
    key: "date",
    label: "Date",
    render: (item) =>
      new Date(item.date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
  },
  {
    key: "type",
    label: "Type",
    render: (item) => {
      const config = HSE_TYPE_CONFIG[item.type];
      return (
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      );
    },
  },
  { key: "site", label: "Site" },
  {
    key: "status",
    label: "Statut",
    render: (item) => {
      const config = HSE_STATUS_CONFIG[item.status];
      return (
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      );
    },
  },
  { key: "description", label: "Description" },
];

export function EmployeeDisciplineTab({
  employee,
}: EmployeeDisciplineTabProps) {
  // Mock data - in real app, this would come from API
  const [warnings] = useState<Warning[]>([
    {
      id: "1",
      employeeId: employee.id,
      date: new Date("2024-01-15"),
      reason: "Retard répété",
      description: "Plusieurs retards non justifiés cette semaine",
      issuedBy: "Alice Dubois",
      status: "active",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
  ]);

  const [procedures] = useState<DisciplinaryProcedure[]>([
    {
      id: "1",
      employeeId: employee.id,
      startDate: new Date("2024-01-15"),
      steps: [
        {
          id: "1",
          title: "Avertissement verbal",
          description: "Discussion avec l'employé",
          completed: true,
          completedAt: new Date("2024-01-15"),
        },
        {
          id: "2",
          title: "Avertissement écrit",
          description: "Envoi d'un avertissement écrit",
          completed: false,
        },
      ],
      currentStep: 1,
      status: "ongoing",
      documents: ["/files/avertissement_marie.pdf"],
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
  ]);

  const [sanctions] = useState<Sanction[]>([
    {
      id: "1",
      employeeId: employee.id,
      date: new Date("2024-01-15"),
      type: "Avertissement",
      reason: "Retard répété",
      description: "Plusieurs retards non justifiés cette semaine",
      issuedBy: "Alice Dubois",
      severity: "minor",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      employeeId: employee.id,
      date: new Date("2024-01-10"),
      type: "Suspension",
      reason: "Comportement inapproprié",
      description: "Incident avec un collègue",
      issuedBy: "Alice Dubois",
      severity: "major",
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-10"),
    },
  ]);

  const geolocationSummary = getEmployeeGeolocationSummary(employee.id);
  const hseIncidents = geolocationSummary?.hseIncidents ?? [];

  const getStatusBadge = (
    status: string,
    type: "warning" | "procedure",
  ): {
    variant: "default" | "destructive" | "outline" | "secondary";
    label: string;
  } => {
    const configs = {
      warning: {
        active: { variant: "destructive" as const, label: "Active" },
        lifted: { variant: "secondary" as const, label: "Levée" },
      },
      procedure: {
        ongoing: { variant: "default" as const, label: "En cours" },
        completed: { variant: "secondary" as const, label: "Terminée" },
        cancelled: { variant: "outline" as const, label: "Annulée" },
      },
    };
    return (
      (
        configs[type] as Record<
          string,
          {
            variant: "default" | "destructive" | "outline" | "secondary";
            label: string;
          }
        >
      )[status] || {
        variant: "outline" as const,
        label: status,
      }
    );
  };

  const getSeverityBadge = (severity: Sanction["severity"]) => {
    const configs = {
      minor: { variant: "secondary" as const, label: "Mineure" },
      major: { variant: "default" as const, label: "Majeure" },
      severe: { variant: "destructive" as const, label: "Grave" },
    };
    return configs[severity];
  };

  const warningColumns: ColumnDef<Warning>[] = [
    {
      key: "date",
      label: "Date",
      render: (warning) => warning.date.toLocaleDateString("fr-FR"),
    },
    {
      key: "reason",
      label: "Motif",
      render: (warning) => warning.reason,
    },
    {
      key: "status",
      label: "Statut",
      render: (warning) => {
        const config = getStatusBadge(warning.status, "warning");
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: "issuedBy",
      label: "Émis par",
      render: (warning) => warning.issuedBy,
    },
    {
      key: "actions",
      label: "Actions",
      render: () => (
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/hr/collaborators/discipline?tab=warnings">
            <Eye className="mr-2 h-4 w-4 text-green-600" />
            Voir
          </Link>
        </Button>
      ),
    },
  ];

  const procedureColumns: ColumnDef<DisciplinaryProcedure>[] = [
    {
      key: "startDate",
      label: "Date de début",
      render: (procedure) => procedure.startDate.toLocaleDateString("fr-FR"),
    },
    {
      key: "currentStep",
      label: "Étape actuelle",
      render: (procedure) =>
        `Étape ${procedure.currentStep} sur ${procedure.steps.length}`,
    },
    {
      key: "status",
      label: "Statut",
      render: (procedure) => {
        const config = getStatusBadge(procedure.status, "procedure");
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: () => (
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/hr/collaborators/discipline?tab=procedures">
            <Eye className="mr-2 h-4 w-4 text-green-600" />
            Voir
          </Link>
        </Button>
      ),
    },
  ];

  const sanctionColumns: ColumnDef<Sanction>[] = [
    {
      key: "date",
      label: "Date",
      render: (sanction) => sanction.date.toLocaleDateString("fr-FR"),
    },
    {
      key: "type",
      label: "Type",
      render: (sanction) => sanction.type,
    },
    {
      key: "reason",
      label: "Motif",
      render: (sanction) => sanction.reason,
    },
    {
      key: "severity",
      label: "Gravité",
      render: (sanction) => {
        const config = getSeverityBadge(sanction.severity);
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: () => (
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/hr/collaborators/discipline?tab=sanctions">
            <Eye className="mr-2 h-4 w-4 text-green-600" />
            Voir
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Discipline Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Avertissements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warnings.length}</div>
            <p className="text-xs text-muted-foreground">
              {warnings.filter((w) => w.status === "active").length} actif(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gavel className="h-4 w-4 text-blue-600" />
              Procédures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{procedures.length}</div>
            <p className="text-xs text-muted-foreground">
              {procedures.filter((p) => p.status === "ongoing").length} en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-purple-600" />
              Sanctions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sanctions.length}</div>
            <p className="text-xs text-muted-foreground">Total des sanctions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              Incidents HSE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hseIncidents.length}</div>
            <p className="text-xs text-muted-foreground">
              {hseIncidents.filter((i) => i.status === "Ouvert").length}{" "}
              ouvert(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Avertissements ({warnings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {warnings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucun avertissement
              </h3>
              <p className="text-sm text-muted-foreground">
                Cet employé n&apos;a reçu aucun avertissement
              </p>
            </div>
          ) : (
            <DataTable
              data={warnings}
              columns={warningColumns}
              searchKeys={["reason", "description"]}
              searchPlaceholder="Rechercher des avertissements..."
            />
          )}
        </CardContent>
      </Card>

      {/* Disciplinary Procedures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-blue-600" />
            Procédures disciplinaires ({procedures.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {procedures.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune procédure</h3>
              <p className="text-sm text-muted-foreground">
                Aucune procédure disciplinaire n&apos;a été initiée
              </p>
            </div>
          ) : (
            <DataTable
              data={procedures}
              columns={procedureColumns}
              searchKeys={["steps"]}
              searchPlaceholder="Rechercher des procédures..."
            />
          )}
        </CardContent>
      </Card>

      {/* Sanctions Register */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-purple-600" />
            Registre des sanctions ({sanctions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sanctions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune sanction</h3>
              <p className="text-sm text-muted-foreground">
                Le registre des sanctions est vierge pour cet employé
              </p>
            </div>
          ) : (
            <DataTable
              data={sanctions}
              columns={sanctionColumns}
              searchKeys={["type", "reason", "description"]}
              searchPlaceholder="Rechercher des sanctions..."
            />
          )}
        </CardContent>
      </Card>

      {/* HSE Incidents (Geolocation) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            Incidents HSE — Géolocalisation ({hseIncidents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hseIncidents.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun incident HSE</h3>
              <p className="text-sm text-muted-foreground">
                Aucun incident SOS ou immobilité enregistré via la
                géolocalisation
              </p>
            </div>
          ) : (
            <DataTable
              data={hseIncidents}
              columns={hseColumns}
              searchKeys={["description", "site"]}
              searchPlaceholder="Rechercher des incidents..."
            />
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gray-50 dark:bg-gray-900/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">Actions disciplinaires</h4>
              <p className="text-sm text-muted-foreground">
                Gérer les mesures disciplinaires pour cet employé
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/hr/collaborators/discipline?tab=warnings">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Nouvel avertissement
                </Link>
              </Button>

              <Button variant="outline" asChild>
                <Link href="/dashboard/hr/collaborators/discipline?tab=procedures">
                  <Gavel className="mr-2 h-4 w-4" />
                  Nouvelle procédure
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
