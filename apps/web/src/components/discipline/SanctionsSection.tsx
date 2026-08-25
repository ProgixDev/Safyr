"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useEmployeeOptions } from "@/hooks/employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Modal } from "@/components/ui/modal";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { Download, Plus } from "lucide-react";
import jsPDF from "jspdf";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { useRegistre } from "@/hooks/fiscal/use-registre";

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

/** Ligne enregistrée en base : la date y est une chaîne ISO. */
interface LigneSanction {
  id: string;
  employeeId: string;
  date: string;
  type: string;
  reason: string;
  description: string;
  issuedBy: string;
  severity: "minor" | "major" | "severe";
}

const EPOQUE = new Date(0);
const CHAMPS_FICHIERS = ["document"] as const;

const TYPES_SANCTION = [
  "Mise à pied disciplinaire",
  "Mise à pied conservatoire",
  "Blâme",
  "Rétrogradation",
  "Licenciement pour faute",
];

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

const formulaireVide = {
  employeeId: "",
  date: new Date().toISOString().split("T")[0],
  type: TYPES_SANCTION[0],
  reason: "",
  description: "",
  issuedBy: "",
  severity: "minor" as "minor" | "major" | "severe",
};

export function SanctionsSection() {
  const mockEmployees = useEmployeeOptions();
  const employeeOptions = mockEmployees.map((employee) => ({
    value: employee.id,
    label: employee.name,
  }));
  const getEmployeeName = (employeeId: string) => {
    const employee = mockEmployees.find((e) => e.id === employeeId);
    return employee ? employee.name : "Employé inconnu";
  };

  // Le registre était en lecture seule et sans données : aucune sanction ne
  // pouvait être saisie. Les lignes sont désormais enregistrées en base.
  const registre = useRegistre<LigneSanction>("sanction", CHAMPS_FICHIERS);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [enCoursDeModification, setEnCoursDeModification] =
    useState<MiseAPiedRow | null>(null);
  const [aConsulter, setAConsulter] = useState<MiseAPiedRow | null>(null);
  const [formData, setFormData] = useState(formulaireVide);

  const miseAPiedRows = useMemo<MiseAPiedRow[]>(
    () =>
      registre.lignes
        .map((ligne) => ({
          id: ligne.id,
          employeeId: ligne.employeeId ?? "",
          employeeName: getEmployeeName(ligne.employeeId ?? ""),
          date: ligne.date ? new Date(ligne.date) : EPOQUE,
          type: ligne.type ?? "",
          reason: ligne.reason ?? "",
          description: ligne.description ?? "",
          issuedBy: ligne.issuedBy ?? "",
          severity: ligne.severity ?? "minor",
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registre.lignes, mockEmployees],
  );

  const handleCreate = () => {
    setEnCoursDeModification(null);
    setFormData(formulaireVide);
    setIsFormOpen(true);
  };

  const handleEdit = (row: MiseAPiedRow) => {
    setEnCoursDeModification(row);
    setFormData({
      employeeId: row.employeeId,
      date: row.date.toISOString().split("T")[0],
      type: row.type,
      reason: row.reason,
      description: row.description,
      issuedBy: row.issuedBy,
      severity: row.severity,
    });
    setIsFormOpen(true);
  };

  const handleDelete = (row: MiseAPiedRow) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette sanction ?")) {
      void registre.supprimerLigne(row.id);
    }
  };

  const handleSave = async () => {
    await registre.enregistrer(
      {
        id: enCoursDeModification?.id ?? "",
        employeeId: formData.employeeId,
        date: formData.date,
        type: formData.type,
        reason: formData.reason,
        description: formData.description,
        issuedBy: formData.issuedBy,
        severity: formData.severity,
      },
      {
        period: (formData.date || new Date().toISOString()).slice(0, 7),
        label: `${formData.type} — ${getEmployeeName(formData.employeeId)}`,
        status: formData.severity,
      },
    );
    setIsFormOpen(false);
  };

  const isFormValid = Boolean(
    formData.employeeId && formData.date && formData.reason.trim(),
  );

  const handleExportSinglePDF = (row: MiseAPiedRow) => {
    const doc = new jsPDF();
    doc.text("Mise à pied", 20, 20);
    doc.text(`Employé: ${row.employeeName}`, 20, 40);
    doc.text(`Date: ${row.date.toLocaleDateString("fr-FR")}`, 20, 50);
    doc.text(`Type: ${row.type}`, 20, 60);
    doc.text(`Raison: ${row.reason}`, 20, 70);
    doc.text(`Description: ${row.description}`, 20, 80);
    doc.text(`Émis par: ${row.issuedBy}`, 20, 90);
    doc.text(`Sévérité: ${severityLabels[row.severity]}`, 20, 100);
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
        <RowActionsMenu
          onView={() => setAConsulter(row)}
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDelete(row)}
          extraItems={[
            {
              label: "Exporter en PDF",
              icon: Download,
              tone: "download" as const,
              onClick: () => handleExportSinglePDF(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Registre des mises à pied
          </h1>
          <p className="text-muted-foreground">
            Historique des mises à pied par employé
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle sanction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Registre des mises à pied ({miseAPiedRows.length} mises à pied)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={miseAPiedRows}
            isLoading={registre.isLoading}
            columns={columns}
            searchKeys={["employeeName", "type", "reason"]}
            searchPlaceholder="Rechercher une mise à pied..."
          />
        </CardContent>
      </Card>

      <Modal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        type="form"
        size="lg"
        title={
          enCoursDeModification ? "Modifier la sanction" : "Nouvelle sanction"
        }
        description="Renseignez les informations de la sanction disciplinaire."
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsFormOpen(false),
            variant: "outline",
          },
          primary: {
            label: enCoursDeModification ? "Enregistrer" : "Créer",
            onClick: () => void handleSave(),
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
                  setFormData({ ...formData, employeeId: value })
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
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type de sanction</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Sévérité</Label>
              <Select
                value={formData.severity}
                onValueChange={(value: "minor" | "major" | "severe") =>
                  setFormData({ ...formData, severity: value })
                }
              >
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Choisir une sévérité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Mineure</SelectItem>
                  <SelectItem value="major">Majeure</SelectItem>
                  <SelectItem value="severe">Grave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motif *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Ex : abandon de poste"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuedBy">Émis par</Label>
              <Input
                id="issuedBy"
                value={formData.issuedBy}
                onChange={(e) =>
                  setFormData({ ...formData, issuedBy: e.target.value })
                }
                placeholder="Nom du responsable"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Circonstances et faits reprochés"
              rows={4}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!aConsulter}
        onOpenChange={(open) => !open && setAConsulter(null)}
        type="details"
        size="md"
        title="Détail de la sanction"
      >
        {aConsulter && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Employé : </span>
              {aConsulter.employeeName}
            </p>
            <p>
              <span className="text-muted-foreground">Date : </span>
              {aConsulter.date.toLocaleDateString("fr-FR")}
            </p>
            <p>
              <span className="text-muted-foreground">Type : </span>
              {aConsulter.type}
            </p>
            <p>
              <span className="text-muted-foreground">Motif : </span>
              {aConsulter.reason}
            </p>
            <p>
              <span className="text-muted-foreground">Sévérité : </span>
              {severityLabels[aConsulter.severity]}
            </p>
            <p>
              <span className="text-muted-foreground">Émis par : </span>
              {aConsulter.issuedBy || "—"}
            </p>
            <p className="whitespace-pre-wrap">
              <span className="text-muted-foreground">Description : </span>
              {aConsulter.description || "—"}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
