"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";

import { Clock, CheckCircle, AlertTriangle, BadgeEuro } from "lucide-react";

// Mock data for overtime counter
const mockOvertimeCounters: {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  accumulatedHours: number;
  paidHours: number;
  remainingHours: number;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  monthlyBreakdown: {
    month: string;
    hours: number;
    status: string;
    type: string;
    days: number;
  }[];
}[] = [];

export function OvertimeCounterOverview() {
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
  const totalRemaining = counters.reduce((sum, c) => sum + c.remainingHours, 0);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">
        Suivi des heures supplémentaires accumulées pour paiement différé.
      </p>

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
              <RowActionsMenu
                onView={() =>
                  alert(
                    `${counter.employeeName}\nCumul: ${counter.accumulatedHours}h\nPayé: ${counter.paidHours}h\nRestant: ${counter.remainingHours}h`,
                  )
                }
                extraItems={[
                  {
                    label: "Valider le paiement",
                    icon: BadgeEuro,
                    tone: "validate",
                    disabled: counter.remainingHours <= 0,
                    onClick: () => handleValiderPaiement(counter.id),
                  },
                ]}
              />
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
