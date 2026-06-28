"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  Eye,
  Plus,
  Calendar,
  DollarSign,
  Clock,
  Edit,
} from "lucide-react";
import type { Employee, Contract } from "@/lib/types";

interface EmployeeContractsTabProps {
  employee: Employee;
}

export function EmployeeContractsTab({}: EmployeeContractsTabProps) {
  const [contracts, setContracts] = useState<Contract[]>([
    {
      id: "1",
      type: "CDI",
      contractType: "full-time",
      startDate: new Date("2020-01-15"),
      position: "Agent de sécurité",
      department: "Sécurité",
      salary: {
        gross: 2200,
        net: 1700,
        currency: "EUR",
      },
      hourlyRate: 14.5,
      category: "Agent de sécurité",
      level: "Niveau II",
      echelon: "Échelon 3",
      coefficient: 140,
      workingHours: 151.67,
      fileUrl: "/contracts/cdi-2020.pdf",
      signedAt: new Date("2020-01-14"),
      signedByEmployee: true,
      signedByEmployer: true,
      probationPeriod: {
        duration: 2,
        unit: "months",
      },
      probationStartDate: new Date("2020-01-15"),
      probationEndDate: new Date("2020-03-15"),
      probationRenewed: false,
      probationStatus: "completed",
      amendments: [
        {
          id: "1",
          contractId: "1",
          date: new Date("2022-03-01"),
          reason: "Augmentation de salaire",
          changes: [
            {
              field: "Salaire brut",
              oldValue: "2000 EUR",
              newValue: "2200 EUR",
            },
          ],
          fileUrl: "/contracts/amendment-2022.pdf",
          signedAt: new Date("2022-02-28"),
        },
      ],
      status: "active",
      createdAt: new Date("2020-01-10"),
      updatedAt: new Date("2022-03-01"),
    },
    {
      id: "2",
      type: "CDD",
      contractType: "full-time",
      startDate: new Date("2019-07-01"),
      endDate: new Date("2019-12-31"),
      position: "Agent de sécurité stagiaire",
      department: "Sécurité",
      salary: {
        gross: 1800,
        net: 1400,
        currency: "EUR",
      },
      hourlyRate: 11.86,
      category: "Agent de sécurité",
      level: "Niveau I",
      echelon: "Échelon 1",
      coefficient: 120,
      workingHours: 151.67,
      fileUrl: "/contracts/cdd-2019.pdf",
      signedAt: new Date("2019-06-25"),
      signedByEmployee: true,
      signedByEmployer: true,
      probationPeriod: {
        duration: 2,
        unit: "weeks",
      },
      probationStartDate: new Date("2019-07-01"),
      probationEndDate: new Date("2019-07-15"),
      probationRenewed: false,
      probationStatus: "completed",
      amendments: [],
      status: "terminated",
      createdAt: new Date("2019-06-20"),
      updatedAt: new Date("2020-01-05"),
    },
  ]);

  const handleRenewProbation = (contractId: string) => {
    setContracts((prevContracts) =>
      prevContracts.map((contract) => {
        if (contract.id === contractId && contract.probationPeriod) {
          const renewalEndDate = new Date(contract.probationEndDate!);
          renewalEndDate.setMonth(
            renewalEndDate.getMonth() + contract.probationPeriod.duration,
          );
          return {
            ...contract,
            probationRenewed: true,
            probationRenewalDate: new Date(),
            probationRenewalEndDate: renewalEndDate,
            probationStatus: "renewed",
          };
        }
        return contract;
      }),
    );
  };

  const getContractTypeBadge = (type: Contract["type"]) => {
    const config = {
      CDI: { variant: "default" as const, label: "CDI" },
      CDD: { variant: "secondary" as const, label: "CDD" },
      INTERIM: { variant: "outline" as const, label: "Intérim" },
      APPRENTICESHIP: { variant: "outline" as const, label: "Apprentissage" },
      INTERNSHIP: { variant: "outline" as const, label: "Stage" },
    };
    return config[type];
  };

  const getContractStatusBadge = (status: Contract["status"]) => {
    const config = {
      draft: {
        variant: "outline" as const,
        label: "Brouillon",
        color: "bg-gray-500",
      },
      "pending-signature": {
        variant: "secondary" as const,
        label: "En attente de signature",
        color: "bg-orange-500",
      },
      active: {
        variant: "default" as const,
        label: "Actif",
        color: "bg-green-500",
      },
      terminated: {
        variant: "destructive" as const,
        label: "Terminé",
        color: "bg-red-500",
      },
      expired: {
        variant: "secondary" as const,
        label: "Expiré",
        color: "bg-gray-500",
      },
    };
    return config[status];
  };

  return (
    <div className="space-y-6">
      {/* Contract History Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historique des contrats</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              CDD, CDI et avenants
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau contrat
          </Button>
        </CardHeader>
      </Card>

      {/* Contracts List */}
      {contracts.map((contract) => {
        const typeConfig = getContractTypeBadge(contract.type);
        const statusConfig = getContractStatusBadge(contract.status);

        return (
          <Card key={contract.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={typeConfig.variant}>
                      {typeConfig.label}
                    </Badge>
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold">{contract.position}</h3>
                  <p className="text-sm text-muted-foreground">
                    {contract.department}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4 text-green-600" />
                    Voir
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Contract Type */}
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Type de contrat</p>
                    <p className="text-sm text-muted-foreground">
                      {contract.contractType === "full-time"
                        ? "Temps complet (151.67h)"
                        : "Temps partiel"}
                    </p>
                  </div>
                </div>

                {/* Contract Dates */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Période</p>
                    <p className="text-sm text-muted-foreground">
                      {contract.startDate.toLocaleDateString("fr-FR")}
                      {contract.endDate
                        ? ` - ${contract.endDate.toLocaleDateString("fr-FR")}`
                        : " - En cours"}
                    </p>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Temps de travail</p>
                    <p className="text-sm text-muted-foreground">
                      {contract.workingHours} heures/mois
                    </p>
                  </div>
                </div>

                {/* Category */}
                {contract.category && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Catégorie</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.category}
                      </p>
                    </div>
                  </div>
                )}

                {/* Level and Echelon */}
                {(contract.level || contract.echelon) && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Classification</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.level}
                        {contract.level && contract.echelon && " - "}
                        {contract.echelon}
                      </p>
                    </div>
                  </div>
                )}

                {/* Coefficient */}
                {contract.coefficient && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Coefficient</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.coefficient}
                      </p>
                    </div>
                  </div>
                )}

                {/* Hourly Rate */}
                {contract.hourlyRate && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Taux horaire brut</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.hourlyRate.toFixed(2)}{" "}
                        {contract.salary.currency}/h
                      </p>
                    </div>
                  </div>
                )}

                {/* Salary */}
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Salaire mensuel</p>
                    <p className="text-sm text-muted-foreground">
                      {contract.salary.gross.toLocaleString("fr-FR")}{" "}
                      {contract.salary.currency} brut
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contract.salary.net.toLocaleString("fr-FR")}{" "}
                      {contract.salary.currency} net
                    </p>
                  </div>
                </div>
              </div>

              {/* Signature Status */}
              {contract.signedAt && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-700 dark:text-green-400">
                      Contrat signé le{" "}
                      {contract.signedAt.toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              )}

              {/* Probation Period */}
              {contract.probationPeriod && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-700 dark:text-blue-400">
                      Période d&apos;essai
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Du{" "}
                    {contract.probationStartDate?.toLocaleDateString("fr-FR")}{" "}
                    au {contract.probationEndDate?.toLocaleDateString("fr-FR")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Statut:{" "}
                    {contract.probationStatus === "active"
                      ? "En cours"
                      : contract.probationStatus === "completed"
                        ? "Terminée"
                        : contract.probationStatus === "renewed"
                          ? "Renouvelée"
                          : "Échouée"}
                  </p>
                  {contract.probationStatus === "active" &&
                    !contract.probationRenewed &&
                    contract.type !== "CDD" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleRenewProbation(contract.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Renouveler la période d&apos;essai
                      </Button>
                    )}
                </div>
              )}

              {/* Amendments */}
              {contract.amendments.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="text-sm font-semibold mb-3">
                      Avenants ({contract.amendments.length})
                    </h4>
                    <div className="space-y-3">
                      {contract.amendments.map((amendment) => (
                        <div
                          key={amendment.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">
                                  {amendment.reason}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {amendment.date.toLocaleDateString("fr-FR")}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                {amendment.changes.map((change, idx) => (
                                  <div
                                    key={idx}
                                    className="text-sm text-muted-foreground"
                                  >
                                    <span className="font-medium">
                                      {change.field}:
                                    </span>{" "}
                                    <span className="line-through">
                                      {change.oldValue}
                                    </span>{" "}
                                    →{" "}
                                    <span className="text-foreground font-medium">
                                      {change.newValue}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Add Amendment Button */}
              {contract.status === "active" && (
                <div className="mt-4">
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un avenant
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
