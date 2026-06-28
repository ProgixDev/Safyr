"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DataTable, ColumnDef } from "@/components/ui/DataTable";

import {
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Eye,
  BadgeEuro,
} from "lucide-react";

// Mock data for overtime counter
const mockOvertimeCounters = [
  {
    id: "1",
    employeeId: "1",
    employeeName: "Jean Dupont",
    employeeNumber: "EMP001",
    department: "Sécurité",
    accumulatedHours: 45.5,
    paidHours: 20,
    remainingHours: 25.5,
    lastPaymentDate: new Date("2024-11-15"),
    nextPaymentDate: new Date("2025-01-15"),
    monthlyBreakdown: [
      {
        month: "Janvier 2024",
        hours: 8.5,
        status: "paid",
        type: "Heures normales",
        days: 5,
      },
      {
        month: "Février 2024",
        hours: 6.0,
        status: "paid",
        type: "Heures normales",
        days: 4,
      },
      {
        month: "Mars 2024",
        hours: 7.5,
        status: "pending",
        type: "Heures normales",
        days: 5,
      },
      {
        month: "Avril 2024",
        hours: 5.0,
        status: "pending",
        type: "Heures de nuit",
        days: 3,
      },
      {
        month: "Mai 2024",
        hours: 9.0,
        status: "pending",
        type: "Weekend",
        days: 6,
      },
      {
        month: "Juin 2024",
        hours: 9.5,
        status: "pending",
        type: "Heures normales",
        days: 6,
      },
    ],
  },
  {
    id: "2",
    employeeId: "2",
    employeeName: "Marie Martin",
    employeeNumber: "EMP002",
    department: "Direction",
    accumulatedHours: 32,
    paidHours: 15,
    remainingHours: 17,
    lastPaymentDate: new Date("2024-10-30"),
    nextPaymentDate: new Date("2024-12-30"),
    monthlyBreakdown: [
      {
        month: "Janvier 2024",
        hours: 4.0,
        status: "paid",
        type: "Heures normales",
        days: 3,
      },
      {
        month: "Février 2024",
        hours: 5.5,
        status: "paid",
        type: "Weekend",
        days: 4,
      },
      {
        month: "Mars 2024",
        hours: 6.0,
        status: "pending",
        type: "Heures normales",
        days: 4,
      },
      {
        month: "Avril 2024",
        hours: 5.5,
        status: "pending",
        type: "Heures de nuit",
        days: 3,
      },
      {
        month: "Mai 2024",
        hours: 6.0,
        status: "pending",
        type: "Heures normales",
        days: 4,
      },
      {
        month: "Juin 2024",
        hours: 5.0,
        status: "pending",
        type: "Weekend",
        days: 3,
      },
    ],
  },
  {
    id: "3",
    employeeId: "5",
    employeeName: "Luc Moreau",
    employeeNumber: "EMP005",
    department: "Sécurité",
    accumulatedHours: 18.5,
    paidHours: 0,
    remainingHours: 18.5,
    lastPaymentDate: null,
    nextPaymentDate: new Date("2025-02-15"),
    monthlyBreakdown: [
      {
        month: "Janvier 2024",
        hours: 3.5,
        status: "pending",
        type: "Heures normales",
        days: 2,
      },
      {
        month: "Février 2024",
        hours: 4.0,
        status: "pending",
        type: "Heures normales",
        days: 3,
      },
      {
        month: "Mars 2024",
        hours: 5.0,
        status: "pending",
        type: "Weekend",
        days: 3,
      },
      {
        month: "Avril 2024",
        hours: 6.0,
        status: "pending",
        type: "Heures de nuit",
        days: 4,
      },
    ],
  },
];

export default function OvertimeCounterPage() {
  const [counters, setCounters] = useState(mockOvertimeCounters);

  const handleValiderPaiement = (id: string) => {
    setCounters((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              paidHours: c.accumulatedHours,
              remainingHours: 0,
              lastPaymentDate: new Date(),
            }
          : c,
      ),
    );
  };

  const renderMonthlyBreakdown = (
    counter: (typeof mockOvertimeCounters)[0],
  ) => {
    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          Répartition mensuelle des heures accumulées
          <span className="text-xs font-normal text-muted-foreground">
            ({counter.monthlyBreakdown.length} mois)
          </span>
        </h4>
        <div className="space-y-2">
          {counter.monthlyBreakdown.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-md border bg-background p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{entry.month}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      entry.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {entry.status === "paid" ? "Payé" : "En attente"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {entry.type}
                  </span>
                  <span>•</span>
                  <span>{entry.days} jours</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-blue-600 text-lg">
                  {entry.hours}h
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Total accumulé</span>
          </div>
          <span className="font-bold text-blue-600 text-xl">
            {counter.accumulatedHours}h
          </span>
        </div>
      </div>
    );
  };

  const overtimeCounterColumns: ColumnDef<(typeof mockOvertimeCounters)[0]>[] =
    [
      {
        key: "employee",
        label: "Employé",
        sortable: true,
        render: (counter) => (
          <div className="min-w-0">
            <p className="font-semibold truncate">{counter.employeeName}</p>
            <p className="text-sm text-muted-foreground truncate">
              {counter.employeeNumber} - {counter.department}
            </p>
          </div>
        ),
      },
      {
        key: "accumulatedHours",
        label: "Heures accumulées",
        sortable: true,
        render: (counter) => (
          <span className="font-semibold text-blue-600">
            {counter.accumulatedHours}h
          </span>
        ),
      },
      {
        key: "paidHours",
        label: "Heures payées",
        sortable: true,
        render: (counter) => (
          <span className="font-semibold text-green-600">
            {counter.paidHours}h
          </span>
        ),
      },
      {
        key: "remainingHours",
        label: "Heures restantes",
        sortable: true,
        render: (counter) => (
          <span className="font-semibold text-orange-600">
            {counter.remainingHours}h
          </span>
        ),
      },
      {
        key: "lastPaymentDate",
        label: "Dernier paiement",
        sortable: true,
        render: (counter) => (
          <span className="text-sm">
            {counter.lastPaymentDate
              ? counter.lastPaymentDate.toLocaleDateString("fr-FR")
              : "Aucun"}
          </span>
        ),
      },
    ];

  const totalAccumulated = counters.reduce(
    (sum, c) => sum + c.accumulatedHours,
    0,
  );
  const totalPaid = counters.reduce((sum, c) => sum + c.paidHours, 0);
  const totalRemaining = counters.reduce(
    (sum, c) => sum + c.remainingHours,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Compteur Heures Supplémentaires
        </h1>
        <p className="text-muted-foreground">
          Suivi des heures supplémentaires accumulées pour paiement différé
        </p>
      </div>

      {/* Stats Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Clock}
          title="Total Accumulé"
          value={`${totalAccumulated}h`}
          subtext="Heures supplémentaires totales"
          color="blue"
        />

        <InfoCard
          icon={CheckCircle}
          title="Total Payé"
          value={`${totalPaid}h`}
          subtext="Déjà payées cette année"
          color="green"
        />

        <InfoCard
          icon={AlertTriangle}
          title="En Attente de Paiement"
          value={`${totalRemaining}h`}
          subtext="À payer prochainement"
          color="orange"
        />
      </InfoCardContainer>

      {/* Overtime Counter Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compteurs par employé</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={counters}
            columns={overtimeCounterColumns}
            searchKeys={["employeeName", "employeeNumber", "department"]}
            searchPlaceholder="Rechercher par nom, numéro ou département..."
            itemsPerPage={10}
            actions={(counter) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      alert(
                        `${counter.employeeName}\nCumul: ${counter.accumulatedHours}h\nPayé: ${counter.paidHours}h\nRestant: ${counter.remainingHours}h`,
                      )
                    }
                  >
                    <Eye className="mr-2 h-4 w-4 text-green-600" />
                    Voir détails
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={counter.remainingHours <= 0}
                    onClick={() => handleValiderPaiement(counter.id)}
                  >
                    <BadgeEuro className="mr-2 h-4 w-4 text-orange-500" />
                    Valider le paiement
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            filters={[
              {
                key: "department",
                label: "Département",
                options: [
                  { value: "all", label: "Tous les départements" },
                  { value: "Sécurité", label: "Sécurité" },
                  { value: "Direction", label: "Direction" },
                  { value: "RH", label: "RH" },
                  { value: "Commercial", label: "Commercial" },
                ],
              },
            ]}
            expandableContent={renderMonthlyBreakdown}
          />
        </CardContent>
      </Card>
    </div>
  );
}
