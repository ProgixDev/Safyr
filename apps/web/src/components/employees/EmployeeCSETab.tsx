"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Calendar,
  Clock,
  Award,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus,
} from "lucide-react";
import type { Employee, CSERole } from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";

interface EmployeeCSETabProps {
  employee: Employee;
}

export function EmployeeCSETab({ employee }: EmployeeCSETabProps) {
  const [cseRole] = useState<CSERole | undefined>(employee.cseRole);

  // Mock data for CSE members without a role
  const mockCSEData: CSERole = {
    role: "member",
    startDate: new Date("2023-01-15"),
    endDate: new Date("2027-01-15"),
    delegationHours: 20,
    usedHours: 12,
    remainingHours: 8,
    isElected: true,
    electionDate: new Date("2023-01-10"),
  };

  const displayRole = cseRole || mockCSEData;
  const hasCSERole = !!cseRole;

  const getRoleLabel = (role: CSERole["role"]) => {
    const labels = {
      member: "Membre titulaire",
      alternate: "Suppléant",
      secretary: "Secrétaire",
      treasurer: "Trésorier",
      president: "Président",
    };
    return labels[role] || role;
  };

  const getRoleBadge = (role: CSERole["role"]) => {
    const config = {
      president: { variant: "default" as const, icon: Award },
      secretary: { variant: "default" as const, icon: Award },
      treasurer: { variant: "default" as const, icon: Award },
      member: { variant: "secondary" as const, icon: Users },
      alternate: { variant: "outline" as const, icon: Users },
    };
    return config[role];
  };

  const usagePercentage =
    (displayRole.usedHours / displayRole.delegationHours) * 100;

  // Historique des heures de délégation (données de démonstration)
  const [delegationHistory, setDelegationHistory] = useState([
    {
      id: "1",
      date: new Date("2024-12-10"),
      hours: 3,
      reason: "Réunion CSE mensuelle",
      validated: true,
      validatedBy: "admin@safyr.com",
    },
    {
      id: "2",
      date: new Date("2024-12-05"),
      hours: 4,
      reason: "Formation santé et sécurité",
      validated: true,
      validatedBy: "admin@safyr.com",
    },
    {
      id: "3",
      date: new Date("2024-11-28"),
      hours: 5,
      reason: "Préparation réunion extraordinaire",
      validated: true,
      validatedBy: "admin@safyr.com",
    },
    {
      id: "4",
      date: new Date("2024-11-15"),
      hours: 2,
      reason: "Consultation documents sociaux",
      validated: false,
    },
  ]);

  const validerHeures = (id: string) => {
    setDelegationHistory((entrees) =>
      entrees.map((e) =>
        e.id === id
          ? { ...e, validated: true, validatedBy: "admin@safyr.com" }
          : e,
      ),
    );
  };

  const delegationColumns: ColumnDef<(typeof delegationHistory)[0]>[] = [
    {
      key: "icon",
      label: "",
      render: () => (
        <div className="p-2 bg-primary/10 rounded-lg">
          <Clock className="h-5 w-5 text-primary" />
        </div>
      ),
    },
    {
      key: "reason",
      label: "Motif",
      sortable: true,
      render: (entry) => (
        <div className="space-y-1 min-w-0">
          <span className="font-semibold truncate block">{entry.reason}</span>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (entry) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{entry.date.toLocaleDateString("fr-FR")}</span>
        </div>
      ),
    },
    {
      key: "hours",
      label: "Heures",
      sortable: true,
      render: (entry) => (
        <span className="font-medium">{entry.hours} heures</span>
      ),
    },
    {
      key: "validated",
      label: "Statut",
      sortable: true,
      render: (entry) => (
        <div>
          {entry.validated ? (
            <Badge variant="default">
              <CheckCircle className="mr-1 h-3 w-3" />
              Validé
            </Badge>
          ) : (
            <Badge variant="secondary">
              <AlertCircle className="mr-1 h-3 w-3" />
              En attente
            </Badge>
          )}
          {entry.validated && entry.validatedBy && (
            <div className="text-xs text-muted-foreground mt-1">
              par {entry.validatedBy}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {!hasCSERole ? (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Pas de rôle CSE assigné
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Cet employé n&apos;a pas de fonction au sein du CSE
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Assigner un rôle CSE
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* CSE Role Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {(() => {
                      const config = getRoleBadge(displayRole.role);
                      const Icon = config.icon;
                      return (
                        <>
                          <Icon className="h-5 w-5" />
                          {getRoleLabel(displayRole.role)}
                        </>
                      );
                    })()}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comité Social et Économique
                  </p>
                </div>
                <div className="flex gap-2">
                  {displayRole.isElected && (
                    <Badge variant="default">
                      <Award className="mr-1 h-3 w-3" />
                      Élu
                    </Badge>
                  )}
                  <Badge variant="outline">Actif</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Mandat</p>
                    <p className="text-sm text-muted-foreground">
                      {displayRole.startDate.toLocaleDateString("fr-FR")} -{" "}
                      {displayRole.endDate
                        ? displayRole.endDate.toLocaleDateString("fr-FR")
                        : "En cours"}
                    </p>
                    {displayRole.isElected && displayRole.electionDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Élu le{" "}
                        {displayRole.electionDate.toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      Heures de délégation mensuelles
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {displayRole.delegationHours} heures / mois
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delegation Hours Usage */}
          <Card>
            <CardHeader>
              <CardTitle>
                Consommation des heures de délégation (Mois en cours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        Heures disponibles
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {displayRole.delegationHours}h
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">
                        Heures utilisées
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      {displayRole.usedHours}h
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">
                        Heures restantes
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {displayRole.remainingHours}h
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progression</span>
                    <span className="font-medium">
                      {usagePercentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                  {usagePercentage >= 90 && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        Attention: Plus de 90% des heures de délégation ont été
                        utilisées
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delegation Hours History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historique des heures de délégation</CardTitle>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Déclarer des heures
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={delegationHistory}
                columns={delegationColumns}
                searchKeys={["reason"]}
                searchPlaceholder="Rechercher une déclaration..."
                itemsPerPage={10}
                filters={[
                  {
                    key: "validated",
                    label: "Statut",
                    options: [
                      { value: "all", label: "Tous" },
                      { value: "true", label: "Validé" },
                      { value: "false", label: "En attente" },
                    ],
                  },
                ]}
                actions={(entry) =>
                  entry.validated ? null : (
                    <RowActionsMenu
                      extraItems={[
                        {
                          label: "Valider les heures",
                          icon: CheckCircle,
                          tone: "validate" as const,
                          onClick: () => validerHeures(entry.id),
                        },
                      ]}
                    />
                  )
                }
              />
            </CardContent>
          </Card>

          {/* CSE Information */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Gestion CSE
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Le Comité Social et Économique (CSE) bénéficie d&apos;heures
                    de délégation pour exercer ses missions. Ces heures sont
                    suivies mensuellement et validées par l&apos;administration
                    RH.
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                    <li>Réunions CSE et préparation</li>
                    <li>Consultations et enquêtes</li>
                    <li>Formation des élus</li>
                    <li>Activités sociales et culturelles</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
