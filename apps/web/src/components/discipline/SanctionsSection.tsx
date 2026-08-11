"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import { MiseAPied, MisesAPiedRegister } from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";

interface MiseAPiedRow {
  id: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  type: string;
  reason: string;
  description: string;
  issuedBy: string;
  severity: "minor" | "major" | "severe";
}

// Mock employees for selection
const mockEmployees: {
  id: string;
  name: string;
  department?: string;
  email?: string;
  hiringDate?: string;
}[] = [];

// Mock data - replace with API call
const mockMisesAPiedRegisters: MisesAPiedRegister[] = [];

const severityLabels = {
  minor: "Mineure",
  major: "Majeure",
  severe: "Grave",
};

const severityColors = {
  minor: "secondary",
  major: "default",
  severe: "destructive",
} as const;

export function SanctionsSection() {
  const getEmployeeName = (employeeId: string) => {
    const employee = mockEmployees.find((e) => e.id === employeeId);
    return employee ? employee.name : "Employé inconnu";
  };

  // Flatten mises à pied data, excluding suspensions
  const miseAPiedRows: MiseAPiedRow[] = mockMisesAPiedRegisters
    .flatMap((register) =>
      register.misesAPied
        .filter((miseAPied: MiseAPied) => miseAPied.type !== "Suspension")
        .map((miseAPied: MiseAPied) => ({
          ...miseAPied,
          employeeId: miseAPied.employeeId,
          employeeName: getEmployeeName(miseAPied.employeeId),
        })),
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleExportSinglePDF = (row: MiseAPiedRow) => {
    const doc = new jsPDF();
    doc.text("Mise à pied", 20, 20);
    doc.text(
      "Note: Ceci est un exemple de PDF et non l'implémentation finale.",
      20,
      30,
    );
    doc.text(`Employé: ${row.employeeName}`, 20, 50);
    doc.text(`Date: ${row.date.toLocaleDateString("fr-FR")}`, 20, 60);
    doc.text(`Type: ${row.type}`, 20, 70);
    doc.text(`Raison: ${row.reason}`, 20, 80);
    doc.text(`Description: ${row.description}`, 20, 90);
    doc.text(`Émis par: ${row.issuedBy}`, 20, 100);
    doc.text(`Sévérité: ${severityLabels[row.severity]}`, 20, 110);
    doc.save(`mise-a-pied-${row.id}.pdf`);
  };

  const columns: ColumnDef<MiseAPiedRow>[] = [
    {
      key: "employeeName",
      label: "Employé",
      render: (row: MiseAPiedRow) => (
        <div className="font-medium">
          <Link
            href={`/dashboard/hr/employees/${row.employeeId}`}
            className="text-primary hover:underline"
          >
            {row.employeeName}
          </Link>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (row: MiseAPiedRow) => row.date.toLocaleDateString("fr-FR"),
    },
    {
      key: "type",
      label: "Type",
      render: (row: MiseAPiedRow) => row.type,
    },
    {
      key: "reason",
      label: "Raison",
      render: (row: MiseAPiedRow) => row.reason,
    },
    {
      key: "description",
      label: "Description",
      render: (row: MiseAPiedRow) => (
        <div className="max-w-xs truncate" title={row.description}>
          {row.description}
        </div>
      ),
    },
    {
      key: "issuedBy",
      label: "Émis par",
      render: (row: MiseAPiedRow) => row.issuedBy,
    },
    {
      key: "severity",
      label: "Sévérité",
      render: (row: MiseAPiedRow) => (
        <Badge variant={severityColors[row.severity]}>
          {severityLabels[row.severity]}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: MiseAPiedRow) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleExportSinglePDF(row)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Exporter PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Registre des mises à pied
        </h1>
        <p className="text-muted-foreground">
          Historique des mises à pied par employé
        </p>
      </div>

      {/* Mises à pied Register Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Registre des mises à pied ({miseAPiedRows.length} mises à pied)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={miseAPiedRows}
            columns={columns}
            searchKeys={["employeeName", "type", "reason"]}
            searchPlaceholder="Rechercher une mise à pied..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
