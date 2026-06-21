"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HoursInput } from "@/components/ui/hours-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Euro,
  Users,
  Calculator,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import type { PersonnelCost } from "@/lib/types";

// Mock data
const mockPersonnelCosts: PersonnelCost[] = [
  {
    employeeId: "EMP001",
    employeeName: "Jean Dupont",
    period: "2024-12",
    grossSalary: 3500,
    netSalary: 2800,
    taxableNet: 2750,
    employeeContributions: 450,
    employerContributions: 875,
    totalEmployerCost: 4375,
    currency: "EUR",
    workedHours: 160,
    costPerHour: 27.34,
    allowances: 150,
    bonuses: 500,
    maintenance: 0,
    totalCost: 4375,
  },
  {
    employeeId: "EMP002",
    employeeName: "Marie Martin",
    period: "2024-12",
    grossSalary: 3200,
    netSalary: 2580,
    taxableNet: 2520,
    employeeContributions: 410,
    employerContributions: 798,
    totalEmployerCost: 3998,
    currency: "EUR",
    workedHours: 155,
    costPerHour: 25.79,
    allowances: 120,
    bonuses: 0,
    maintenance: 200,
    totalCost: 4198,
  },
  {
    employeeId: "EMP003",
    employeeName: "Pierre Durand",
    period: "2024-12",
    grossSalary: 2800,
    netSalary: 2250,
    taxableNet: 2200,
    employeeContributions: 360,
    employerContributions: 700,
    totalEmployerCost: 3500,
    currency: "EUR",
    workedHours: 160,
    costPerHour: 21.88,
    allowances: 80,
    bonuses: 300,
    maintenance: 0,
    totalCost: 3500,
  },
];

const departmentBreakdown = {
  Sécurité: { count: 25, totalCost: 125000, avgCostPerHour: 25.5 },
  Direction: { count: 5, totalCost: 35000, avgCostPerHour: 35.2 },
  RH: { count: 3, totalCost: 18000, avgCostPerHour: 28.75 },
  Commercial: { count: 8, totalCost: 42000, avgCostPerHour: 22.3 },
};

export default function PersonnelCostPage() {
  const [personnelCosts, setPersonnelCosts] =
    useState<PersonnelCost[]>(mockPersonnelCosts);
  const [selectedCost, setSelectedCost] = useState<PersonnelCost | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editGrossSalary, setEditGrossSalary] = useState(0);
  const [editWorkedHours, setEditWorkedHours] = useState(0);

  const handleViewDetails = (cost: PersonnelCost) => {
    setSelectedCost(cost);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (cost: PersonnelCost) => {
    setSelectedCost(cost);
    setEditGrossSalary(cost.grossSalary);
    setEditWorkedHours(cost.workedHours);
    setIsEditModalOpen(true);
  };

  const handleDelete = (cost: PersonnelCost) => {
    setSelectedCost(cost);
    setIsDeleteModalOpen(true);
  };

  const confirmEdit = () => {
    if (selectedCost) {
      setPersonnelCosts(
        personnelCosts.map((c) =>
          c.employeeId === selectedCost.employeeId
            ? {
                ...c,
                grossSalary: editGrossSalary,
                workedHours: editWorkedHours,
              }
            : c,
        ),
      );
      setIsEditModalOpen(false);
      setSelectedCost(null);
    }
  };

  const confirmDelete = () => {
    if (selectedCost) {
      setPersonnelCosts(
        personnelCosts.filter((c) => c.employeeId !== selectedCost.employeeId),
      );
      setIsDeleteModalOpen(false);
      setSelectedCost(null);
    }
  };

  const totalCosts = {
    grossPayroll: personnelCosts.reduce(
      (sum, cost) => sum + cost.grossSalary,
      0,
    ),
    netPayroll: personnelCosts.reduce((sum, cost) => sum + cost.netSalary, 0),
    employerContributions: personnelCosts.reduce(
      (sum, cost) => sum + cost.employerContributions,
      0,
    ),
    totalEmployerCost: personnelCosts.reduce(
      (sum, cost) => sum + cost.totalEmployerCost,
      0,
    ),
    avgCostPerHour:
      personnelCosts.reduce((sum, cost) => sum + cost.costPerHour, 0) /
      personnelCosts.length,
  };

  const columns: ColumnDef<PersonnelCost>[] = [
    {
      key: "employee",
      label: "Employé",
      icon: Users,
      sortable: true,
      sortValue: (cost) => cost.employeeName,
      render: (cost) => (
        <div>
          <div className="font-medium">{cost.employeeName}</div>
          <div className="text-sm text-muted-foreground">{cost.employeeId}</div>
        </div>
      ),
    },
    {
      key: "grossSalary",
      label: "Salaire brut",
      icon: Euro,
      sortable: true,
      render: (cost) => (
        <span className="font-medium">
          {cost.grossSalary.toLocaleString("fr-FR")} €
        </span>
      ),
    },
    {
      key: "netSalary",
      label: "Salaire net",
      sortable: true,
      render: (cost) => <span>{cost.netSalary.toLocaleString("fr-FR")} €</span>,
    },
    {
      key: "employeeContributions",
      label: "Charges salariales",
      sortable: true,
      render: (cost) => (
        <span>{cost.employeeContributions.toLocaleString("fr-FR")} €</span>
      ),
    },
    {
      key: "employerContributions",
      label: "Charges patronales",
      sortable: true,
      render: (cost) => (
        <span>{cost.employerContributions.toLocaleString("fr-FR")} €</span>
      ),
    },
    {
      key: "totalEmployerCost",
      label: "Coût total employeur",
      sortable: true,
      render: (cost) => (
        <span className="font-semibold text-primary">
          {cost.totalEmployerCost.toLocaleString("fr-FR")} €
        </span>
      ),
    },
    {
      key: "workedHours",
      label: "Heures travaillées",
      sortable: true,
      render: (cost) => <span>{cost.workedHours}h</span>,
    },
    {
      key: "costPerHour",
      label: "Coût/heure",
      icon: Calculator,
      sortable: true,
      sortValue: (cost) => cost.costPerHour,
      render: (cost) => (
        <Badge variant="outline" className="font-mono">
          {cost.costPerHour.toFixed(2)} €/h
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Analyse des coûts salariaux
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Coûts par employé, charges sociales et analyse par heure travaillée
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Euro}
          title="Masse salariale brute"
          value={`${totalCosts.grossPayroll.toLocaleString("fr-FR")} €`}
          subtext="+3.2% vs mois dernier"
          color="green"
        />

        <InfoCard
          icon={Euro}
          title="Masse salariale nette"
          value={`${totalCosts.netPayroll.toLocaleString("fr-FR")} €`}
          subtext="80.2% de la masse brute"
          color="blue"
        />

        <InfoCard
          icon={Euro}
          title="Charges patronales"
          value={`${totalCosts.employerContributions.toLocaleString("fr-FR")} €`}
          subtext="25.1% de la masse brute"
          color="orange"
        />

        <InfoCard
          icon={Euro}
          title="Coût total employeur"
          value={`${totalCosts.totalEmployerCost.toLocaleString("fr-FR")} €`}
          subtext="+2.8% vs mois dernier"
          color="purple"
        />

        <InfoCard
          icon={Calculator}
          title="Coût moyen / heure"
          value={`${totalCosts.avgCostPerHour.toFixed(2)} €`}
          subtext="Par heure travaillée"
          color="gray"
        />
      </InfoCardContainer>

      {/* Department Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Répartition par département
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(departmentBreakdown).map(([dept, data]) => (
                <div key={dept} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{dept}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.count} employé{data.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {data.totalCost.toLocaleString("fr-FR")} €
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {data.avgCostPerHour.toFixed(2)} €/h
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Top 5 coûts les plus élevés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {personnelCosts
                .sort((a, b) => b.totalEmployerCost - a.totalEmployerCost)
                .slice(0, 5)
                .map((cost) => (
                  <div
                    key={cost.employeeId}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{cost.employeeName}</div>
                      <div className="text-sm text-muted-foreground">
                        {cost.employeeId}
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {cost.costPerHour.toFixed(2)} €/h
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Détail par employé</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={personnelCosts}
            columns={columns}
            searchKeys={["employeeName", "employeeId"]}
            getSearchValue={(cost) => `${cost.employeeName} ${cost.employeeId}`}
            searchPlaceholder="Rechercher par nom ou numéro d'employé..."
            getRowId={(cost) => cost.employeeId}
            actions={(cost) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleViewDetails(cost)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(cost)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(cost)}>
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
        type="details"
        title="Voir le coût salarial"
        size="lg"
      >
        {selectedCost && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Employé</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedCost.employeeName} ({selectedCost.employeeId})
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Période</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedCost.period}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Salaire brut</Label>
                <p className="text-sm font-mono">
                  {selectedCost.grossSalary.toLocaleString("fr-FR")}{" "}
                  {selectedCost.currency}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Salaire net</Label>
                <p className="text-sm font-mono">
                  {selectedCost.netSalary.toLocaleString("fr-FR")}{" "}
                  {selectedCost.currency}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Charges employeur</Label>
                <p className="text-sm font-mono">
                  {selectedCost.employerContributions.toLocaleString("fr-FR")}{" "}
                  {selectedCost.currency}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Coût total employeur
                </Label>
                <p className="text-sm font-mono">
                  {selectedCost.totalEmployerCost.toLocaleString("fr-FR")}{" "}
                  {selectedCost.currency}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Heures travaillées
                </Label>
                <p className="text-sm font-mono">{selectedCost.workedHours}h</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Coût par heure</Label>
                <p className="text-sm font-mono">
                  {selectedCost.costPerHour.toFixed(2)} {selectedCost.currency}
                  /h
                </p>
              </div>
            </div>

            {(selectedCost.allowances > 0 ||
              selectedCost.bonuses > 0 ||
              selectedCost.maintenance > 0) && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Indemnités</Label>
                  <p className="text-sm font-mono">
                    {selectedCost.allowances.toLocaleString("fr-FR")}{" "}
                    {selectedCost.currency}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Primes</Label>
                  <p className="text-sm font-mono">
                    {selectedCost.bonuses.toLocaleString("fr-FR")}{" "}
                    {selectedCost.currency}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Maintenance</Label>
                  <p className="text-sm font-mono">
                    {selectedCost.maintenance.toLocaleString("fr-FR")}{" "}
                    {selectedCost.currency}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        type="form"
        title="Modifier le coût salarial"
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
        {selectedCost && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium">{selectedCost.employeeName}</h4>
              <p className="text-sm text-muted-foreground">
                {selectedCost.employeeId}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-gross-salary">Salaire brut</Label>
                <Input
                  id="edit-gross-salary"
                  type="number"
                  value={editGrossSalary}
                  onChange={(e) =>
                    setEditGrossSalary(parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-worked-hours">Heures travaillées</Label>
                <HoursInput
                  value={editWorkedHours}
                  onChange={(value) => setEditWorkedHours(value)}
                  step={0.5}
                />
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
        {selectedCost && (
          <p>
            Êtes-vous sûr de vouloir supprimer les coûts pour{" "}
            {selectedCost.employeeName} ?
          </p>
        )}
      </Modal>
    </div>
  );
}
