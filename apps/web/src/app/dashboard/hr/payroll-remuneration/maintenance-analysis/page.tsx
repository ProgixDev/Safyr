"use client";

import { useState } from "react";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  TrendingDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

interface SalaryMaintenance {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "Maladie" | "Accident de travail" | "Maternité/Paternité";
  startDate: string;
  endDate?: string;
  days: number;
  grossSalary: number;
  ijss: number; // Social Security daily allowance
  employerMaintenance: number;
  totalPaid: number;
  maintenanceRate: number; // %
  status: "En cours" | "Terminé";
}

const mockMaintenanceData: SalaryMaintenance[] = [
  {
    id: "1",
    employeeId: "emp1",
    employeeName: "Jean Dupont",
    type: "Maladie",
    startDate: "2024-12-01",
    endDate: "2024-12-15",
    days: 15,
    grossSalary: 2400.0,
    ijss: 42.5,
    employerMaintenance: 37.5,
    totalPaid: 1200.0,
    maintenanceRate: 90,
    status: "Terminé",
  },
  {
    id: "2",
    employeeId: "emp2",
    employeeName: "Marie Martin",
    type: "Accident de travail",
    startDate: "2024-11-20",
    endDate: "2024-12-20",
    days: 31,
    grossSalary: 2600.0,
    ijss: 52.0,
    employerMaintenance: 34.67,
    totalPaid: 2686.77,
    maintenanceRate: 100,
    status: "En cours",
  },
  {
    id: "3",
    employeeId: "emp3",
    employeeName: "Sophie Bernard",
    type: "Maternité/Paternité",
    startDate: "2024-10-01",
    endDate: "2024-12-15",
    days: 76,
    grossSalary: 2800.0,
    ijss: 89.0,
    employerMaintenance: 4.67,
    totalPaid: 7116.92,
    maintenanceRate: 100,
    status: "Terminé",
  },
];

export default function SalaryMaintenanceAnalysisPage() {
  const [maintenances, setMaintenances] =
    useState<SalaryMaintenance[]>(mockMaintenanceData);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] =
    useState<SalaryMaintenance | null>(null);
  const [editType, setEditType] =
    useState<SalaryMaintenance["type"]>("Maladie");
  const [editMaintenanceRate, setEditMaintenanceRate] = useState(0);

  const totalIJSS = maintenances.reduce((sum, m) => sum + m.ijss * m.days, 0);
  const totalEmployerMaintenance = maintenances.reduce(
    (sum, m) => sum + m.employerMaintenance * m.days,
    0,
  );
  const totalPaid = maintenances.reduce((sum, m) => sum + m.totalPaid, 0);

  const columns: ColumnDef<SalaryMaintenance>[] = [
    {
      key: "employeeName",
      label: "Employé",
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      render: (maintenance) => {
        const variants: Record<string, "default" | "secondary" | "outline"> = {
          Maladie: "secondary",
          "Accident de travail": "outline",
          "Maternité/Paternité": "default",
        };
        return (
          <Badge variant={variants[maintenance.type] || "outline"}>
            {maintenance.type}
          </Badge>
        );
      },
    },
    {
      key: "startDate",
      label: "Début",
      render: (maintenance) =>
        new Date(maintenance.startDate).toLocaleDateString("fr-FR"),
    },
    {
      key: "endDate",
      label: "Fin",
      render: (maintenance) =>
        maintenance.endDate
          ? new Date(maintenance.endDate).toLocaleDateString("fr-FR")
          : "-",
    },
    {
      key: "days",
      label: "Jours",
      render: (maintenance) => (
        <span className="font-medium">{maintenance.days}j</span>
      ),
    },
    {
      key: "ijss",
      label: "IJSS/jour",
      render: (maintenance) => (
        <span className="text-sm">{maintenance.ijss.toFixed(2)} €</span>
      ),
    },
    {
      key: "employerMaintenance",
      label: "Maintien/jour",
      render: (maintenance) => (
        <span className="text-sm font-semibold text-orange-600">
          {maintenance.employerMaintenance.toFixed(2)} €
        </span>
      ),
    },
    {
      key: "totalPaid",
      label: "Total payé",
      render: (maintenance) => (
        <span className="font-semibold">
          {maintenance.totalPaid.toLocaleString("fr-FR")} €
        </span>
      ),
    },
    {
      key: "maintenanceRate",
      label: "Taux",
      render: (maintenance) => (
        <Badge variant="outline">{maintenance.maintenanceRate}%</Badge>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (maintenance) => (
        <Badge
          variant={maintenance.status === "En cours" ? "default" : "secondary"}
        >
          {maintenance.status}
        </Badge>
      ),
    },
  ];

  const handleViewDetails = (maintenance: SalaryMaintenance) => {
    setSelectedMaintenance(maintenance);
    setIsViewModalOpen(true);
  };

  const handleEdit = (maintenance: SalaryMaintenance) => {
    setSelectedMaintenance(maintenance);
    setEditType(maintenance.type);
    setEditMaintenanceRate(maintenance.maintenanceRate);
    setIsEditModalOpen(true);
  };

  const handleDelete = (maintenance: SalaryMaintenance) => {
    setSelectedMaintenance(maintenance);
    setIsDeleteModalOpen(true);
  };

  const confirmEdit = () => {
    if (selectedMaintenance) {
      setMaintenances(
        maintenances.map((m) =>
          m.id === selectedMaintenance.id
            ? {
                ...m,
                type: editType,
                maintenanceRate: editMaintenanceRate,
              }
            : m,
        ),
      );
      setIsEditModalOpen(false);
      setSelectedMaintenance(null);
    }
  };

  const confirmDelete = () => {
    if (selectedMaintenance) {
      setMaintenances(
        maintenances.filter((m) => m.id !== selectedMaintenance.id),
      );
      setIsDeleteModalOpen(false);
      setSelectedMaintenance(null);
    }
  };

  const handleExport = () => {
    alert("Export des analyses de maintien de salaire en cours...");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Analyses de Maintien de Salaire
          </h1>
          <p className="text-muted-foreground">
            Suivi des IJSS, calculs de maintien (maladie, AT, maternité…)
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Summary Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={TrendingDown}
          title="Total IJSS reçues"
          value={`${totalIJSS.toLocaleString("fr-FR")} €`}
          subtext="Remboursées par la Sécurité Sociale"
          color="green"
        />

        <InfoCard
          icon={TrendingDown}
          title="Maintien employeur"
          value={`${totalEmployerMaintenance.toLocaleString("fr-FR")} €`}
          subtext="À charge de l'entreprise"
          color="orange"
        />

        <InfoCard
          icon={TrendingDown}
          title="Total versé"
          value={`${totalPaid.toLocaleString("fr-FR")} €`}
          subtext="Somme totale payée aux employés"
          color="blue"
        />
      </InfoCardContainer>

      <DataTable
        data={maintenances}
        columns={columns}
        searchKeys={["employeeName"]}
        getSearchValue={(maintenance) => maintenance.employeeName}
        searchPlaceholder="Rechercher un employé..."
        getRowId={(maintenance) => maintenance.id}
        actions={(maintenance) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleViewDetails(maintenance)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(maintenance)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(maintenance)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* Examine Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Voir le maintien de salaire"
        size="lg"
      >
        {selectedMaintenance && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employé</Label>
                <p className="text-sm font-medium">
                  {selectedMaintenance.employeeName}
                </p>
              </div>
              <div>
                <Label>Type d&apos;absence</Label>
                <Badge variant="secondary">{selectedMaintenance.type}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de début</Label>
                <p className="text-sm font-medium">
                  {new Date(selectedMaintenance.startDate).toLocaleDateString(
                    "fr-FR",
                  )}
                </p>
              </div>
              <div>
                <Label>Date de fin</Label>
                <p className="text-sm font-medium">
                  {selectedMaintenance.endDate
                    ? new Date(selectedMaintenance.endDate).toLocaleDateString(
                        "fr-FR",
                      )
                    : "En cours"}
                </p>
              </div>
            </div>

            <div>
              <Label>Nombre de jours</Label>
              <p className="text-sm font-medium">
                {selectedMaintenance.days} jours
              </p>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-base font-semibold">Calculs</Label>
              <div className="space-y-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-sm">
                    Salaire journalier de référence:
                  </span>
                  <span className="text-sm font-medium">
                    {(selectedMaintenance.grossSalary / 21.67).toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">IJSS par jour:</span>
                  <span className="text-sm font-medium text-green-600">
                    {selectedMaintenance.ijss.toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Maintien employeur par jour:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {selectedMaintenance.employerMaintenance.toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-sm font-semibold">
                    Total IJSS reçues:
                  </span>
                  <span className="text-sm font-semibold text-green-600">
                    {(
                      selectedMaintenance.ijss * selectedMaintenance.days
                    ).toFixed(2)}{" "}
                    €
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold">
                    Total maintien employeur:
                  </span>
                  <span className="text-sm font-semibold text-orange-600">
                    {(
                      selectedMaintenance.employerMaintenance *
                      selectedMaintenance.days
                    ).toFixed(2)}{" "}
                    €
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-base font-bold">
                    Total versé à l&apos;employé:
                  </span>
                  <span className="text-base font-bold text-blue-600">
                    {selectedMaintenance.totalPaid.toLocaleString("fr-FR")} €
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label>Taux de maintien</Label>
              <p className="text-2xl font-bold">
                {selectedMaintenance.maintenanceRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Selon la convention collective et l&apos;ancienneté
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        type="form"
        title="Modifier le maintien de salaire"
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
        {selectedMaintenance && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium">
                {selectedMaintenance.employeeName}
              </h4>
              <p className="text-sm text-muted-foreground">
                {selectedMaintenance.type}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={editType}
                  onValueChange={(value) =>
                    setEditType(value as SalaryMaintenance["type"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Maladie">Maladie</SelectItem>
                    <SelectItem value="Accident de travail">
                      Accident de travail
                    </SelectItem>
                    <SelectItem value="Maternité/Paternité">
                      Maternité/Paternité
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-rate">Taux de maintien (%)</Label>
                <Input
                  id="edit-rate"
                  type="number"
                  value={editMaintenanceRate}
                  onChange={(e) =>
                    setEditMaintenanceRate(parseFloat(e.target.value) || 0)
                  }
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
        {selectedMaintenance && (
          <p>
            Êtes-vous sûr de vouloir supprimer ce maintien de salaire pour{" "}
            {selectedMaintenance.employeeName} ?
          </p>
        )}
      </Modal>
    </div>
  );
}
