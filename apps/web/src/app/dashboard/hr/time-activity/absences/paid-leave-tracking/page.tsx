"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Download,
  Upload,
  Calendar,
  TrendingUp,
  Edit,
  FileText,
  MoreVertical,
  Eye,
} from "lucide-react";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PaidLeaveData {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;

  // CP N-2
  cpN2Acquired: number;
  cpN2Taken: number;
  cpN2Balance: number;

  // CP N-1
  cpN1Acquired: number;
  cpN1Taken: number;
  cpN1Balance: number;

  // CP N
  cpNAcquired: number;
  cpNTaken: number;
  cpNBalance: number;

  totalBalance: number;
  dataSource: "payroll" | "manual";
}

interface LeaveHistory {
  id: string;
  employeeId: string;
  startDate: Date;
  endDate: Date;
  days: number;
  year: string;
  status: "approved" | "pending" | "cancelled";
}

const mockLeaveData: PaidLeaveData[] = [
  {
    id: "1",
    employeeId: "EMP001",
    employeeName: "Jean Dupont",
    position: "Agent de sécurité",
    cpN2Acquired: 25,
    cpN2Taken: 25,
    cpN2Balance: 0,
    cpN1Acquired: 25,
    cpN1Taken: 20,
    cpN1Balance: 5,
    cpNAcquired: 12.5,
    cpNTaken: 5,
    cpNBalance: 7.5,
    totalBalance: 12.5,
    dataSource: "payroll",
  },
  {
    id: "2",
    employeeId: "EMP002",
    employeeName: "Marie Martin",
    position: "Chef d'équipe",
    cpN2Acquired: 25,
    cpN2Taken: 23,
    cpN2Balance: 2,
    cpN1Acquired: 25,
    cpN1Taken: 22,
    cpN1Balance: 3,
    cpNAcquired: 15,
    cpNTaken: 8,
    cpNBalance: 7,
    totalBalance: 12,
    dataSource: "payroll",
  },
  {
    id: "3",
    employeeId: "EMP003",
    employeeName: "Pierre Bernard",
    position: "Agent de sécurité",
    cpN2Acquired: 25,
    cpN2Taken: 25,
    cpN2Balance: 0,
    cpN1Acquired: 25,
    cpN1Taken: 18,
    cpN1Balance: 7,
    cpNAcquired: 10,
    cpNTaken: 3,
    cpNBalance: 7,
    totalBalance: 14,
    dataSource: "manual",
  },
];

const mockLeaveHistory: LeaveHistory[] = [
  {
    id: "h1",
    employeeId: "EMP001",
    startDate: new Date("2024-08-01"),
    endDate: new Date("2024-08-15"),
    days: 10,
    year: "N (2024)",
    status: "approved",
  },
  {
    id: "h2",
    employeeId: "EMP001",
    startDate: new Date("2023-12-20"),
    endDate: new Date("2024-01-05"),
    days: 10,
    year: "N-1 (2023)",
    status: "approved",
  },
  {
    id: "h3",
    employeeId: "EMP002",
    startDate: new Date("2024-07-10"),
    endDate: new Date("2024-07-20"),
    days: 8,
    year: "N (2024)",
    status: "approved",
  },
];

export default function PaidLeaveTrackingPage() {
  const [leaveData, setLeaveData] = useState<PaidLeaveData[]>(mockLeaveData);
  const [selectedEmployee, setSelectedEmployee] =
    useState<PaidLeaveData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PaidLeaveData>>({});

  const currentYear = new Date().getFullYear();

  const handleViewDetails = (employee: PaidLeaveData) => {
    setSelectedEmployee(employee);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (employee: PaidLeaveData) => {
    setSelectedEmployee(employee);
    setEditForm(employee);
    setIsDetailsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (employee: PaidLeaveData) => {
    setSelectedEmployee(employee);
    setIsDetailsModalOpen(false);
    setIsHistoryModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (selectedEmployee && editForm) {
      setLeaveData(
        leaveData.map((emp) =>
          emp.id === selectedEmployee.id
            ? {
                ...emp,
                ...editForm,
                totalBalance:
                  (editForm.cpN2Balance || 0) +
                  (editForm.cpN1Balance || 0) +
                  (editForm.cpNBalance || 0),
                dataSource: "manual",
              }
            : emp,
        ),
      );
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handleImportFromPayroll = () => {
    alert("Import depuis le module Paie en cours...");
  };

  const handleExportData = () => {
    alert("Export des données en cours...");
  };

  const totalAcquired = leaveData.reduce(
    (sum, emp) => sum + emp.cpNAcquired,
    0,
  );
  const totalTaken = leaveData.reduce((sum, emp) => sum + emp.cpNTaken, 0);
  const totalBalance = leaveData.reduce(
    (sum, emp) => sum + emp.totalBalance,
    0,
  );
  const employeesCount = leaveData.length;

  const columns: ColumnDef<PaidLeaveData>[] = [
    {
      key: "employee",
      label: "Employé",
      sortable: true,
      sortValue: (data) => data.employeeName,
      render: (data) => (
        <div className="min-w-0">
          <p className="font-semibold truncate">{data.employeeName}</p>
          <p className="text-sm text-muted-foreground truncate">
            {data.position}
          </p>
        </div>
      ),
    },
    {
      key: "cpN2Balance",
      label: `CP N-2 (${currentYear - 2})`,
      sortable: true,
      sortValue: (data) => data.cpN2Balance,
      render: (data) => (
        <div>
          <span className="font-semibold">{data.cpN2Balance}j</span>
        </div>
      ),
    },
    {
      key: "cpN1Balance",
      label: `CP N-1 (${currentYear - 1})`,
      sortable: true,
      sortValue: (data) => data.cpN1Balance,
      render: (data) => (
        <div>
          <span className="font-semibold">{data.cpN1Balance}j</span>
        </div>
      ),
    },
    {
      key: "cpNBalance",
      label: `CP N (${currentYear})`,
      sortable: true,
      sortValue: (data) => data.cpNBalance,
      render: (data) => (
        <div>
          <span className="font-semibold">{data.cpNBalance}j</span>
        </div>
      ),
    },
    {
      key: "totalBalance",
      label: "CP Total",
      sortable: true,
      sortValue: (data) => data.totalBalance,
      render: (data) => (
        <div>
          <div className="text-lg font-bold text-primary">
            {data.totalBalance}j
          </div>
          <Badge
            variant={data.dataSource === "payroll" ? "default" : "outline"}
            className="mt-1 text-xs"
          >
            {data.dataSource === "payroll" ? "Auto" : "Manuel"}
          </Badge>
        </div>
      ),
    },
  ];

  const leaveActions = (employee: PaidLeaveData) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-semibold">Actions</div>
        <div className="border-t my-1" />
        <button
          className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
          onClick={() => handleViewDetails(employee)}
        >
          <Eye className="mr-2 h-4 w-4 text-green-600" />
          Voir détails
        </button>
        <button
          className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
          onClick={() => handleEdit(employee)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </button>
        <button
          className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
          onClick={() => handleViewHistory(employee)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Historique
        </button>
      </PopoverContent>
    </Popover>
  );

  const historyColumns: ColumnDef<LeaveHistory>[] = [
    {
      key: "period",
      label: "Période",
      render: (data) => (
        <div className="text-sm">
          <div className="font-medium">
            {data.startDate.toLocaleDateString("fr-FR")} -{" "}
            {data.endDate.toLocaleDateString("fr-FR")}
          </div>
          <div className="text-muted-foreground">{data.year}</div>
        </div>
      ),
    },
    {
      key: "days",
      label: "Jours",
      render: (data) => (
        <span className="font-medium">
          {data.days} jour{data.days > 1 ? "s" : ""}
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (data) => (
        <Badge
          variant={
            data.status === "approved"
              ? "default"
              : data.status === "pending"
                ? "secondary"
                : "outline"
          }
        >
          {data.status === "approved"
            ? "Approuvé"
            : data.status === "pending"
              ? "En attente"
              : "Annulé"}
        </Badge>
      ),
    },
  ];

  const employeeHistory = mockLeaveHistory.filter(
    (h) => h.employeeId === selectedEmployee?.employeeId,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Suivi Congés Payés
          </h1>
          <p className="text-muted-foreground">
            Gestion et suivi des congés payés par année
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportFromPayroll}>
            <Upload className="mr-2 h-4 w-4" />
            Importer depuis Paie
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Calendar}
          title="Employés"
          value={employeesCount}
          subtext="Total employés"
          color="gray"
        />
        <InfoCard
          icon={TrendingUp}
          title="CP Acquis (N)"
          value={`${totalAcquired.toFixed(1)}j`}
          subtext={`Année ${currentYear}`}
          color="blue"
        />
        <InfoCard
          icon={Calendar}
          title="CP Pris (N)"
          value={`${totalTaken.toFixed(1)}j`}
          subtext={`Année ${currentYear}`}
          color="green"
        />
        <InfoCard
          icon={TrendingUp}
          title="Solde Total"
          value={`${totalBalance.toFixed(1)}j`}
          subtext="Tous employés"
          color="orange"
        />
      </InfoCardContainer>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tableau de Suivi des Congés Payés</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={leaveData}
            columns={columns}
            searchKeys={["employeeName", "position"]}
            getSearchValue={(data) => `${data.employeeName} ${data.position}`}
            searchPlaceholder="Rechercher un employé..."
            getRowId={(data) => data.id}
            actions={leaveActions}
          />
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Modal
        open={isDetailsModalOpen}
        onOpenChange={(open) => {
          setIsDetailsModalOpen(open);
          if (!open) setSelectedEmployee(null);
        }}
        type="details"
        title={`Congés Payés - ${selectedEmployee?.employeeName}`}
        description={selectedEmployee?.position}
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setIsDetailsModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: "Modifier",
            onClick: () => handleEdit(selectedEmployee!),
          },
        }}
      >
        {selectedEmployee && (
          <div className="space-y-6">
            {/* Data Source Badge */}
            <div className="flex justify-center">
              <Badge
                variant={
                  selectedEmployee.dataSource === "payroll"
                    ? "default"
                    : "outline"
                }
              >
                {selectedEmployee.dataSource === "payroll"
                  ? "Données depuis Paie"
                  : "Saisie manuelle"}
              </Badge>
            </div>

            {/* CP N-2 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">
                CP N-2 ({currentYear - 2})
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Acquis</p>
                  <p className="text-xl font-bold">
                    {selectedEmployee.cpN2Acquired}j
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Pris</p>
                  <p className="text-xl font-bold">
                    {selectedEmployee.cpN2Taken}j
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-xs text-muted-foreground">Solde</p>
                  <p className="text-xl font-bold text-primary">
                    {selectedEmployee.cpN2Balance}j
                  </p>
                </div>
              </div>
            </div>

            {/* CP N-1 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">
                CP N-1 ({currentYear - 1})
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Acquis</p>
                  <p className="text-xl font-bold">
                    {selectedEmployee.cpN1Acquired}j
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Pris</p>
                  <p className="text-xl font-bold">
                    {selectedEmployee.cpN1Taken}j
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-xs text-muted-foreground">Solde</p>
                  <p className="text-xl font-bold text-primary">
                    {selectedEmployee.cpN1Balance}j
                  </p>
                </div>
              </div>
            </div>

            {/* CP N */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">
                CP N ({currentYear})
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Acquis</p>
                  <p className="text-xl font-bold">
                    {selectedEmployee.cpNAcquired}j
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Pris</p>
                  <p className="text-xl font-bold">
                    {selectedEmployee.cpNTaken}j
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-xs text-muted-foreground">Solde</p>
                  <p className="text-xl font-bold text-primary">
                    {selectedEmployee.cpNBalance}j
                  </p>
                </div>
              </div>
            </div>

            {/* Total Balance */}
            <div className="p-4 rounded-lg bg-primary/20 border-2 border-primary/40">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Solde Total</span>
                <span className="text-3xl font-bold text-primary">
                  {selectedEmployee.totalBalance}j
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleViewHistory(selectedEmployee)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Voir l&apos;historique
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        type="form"
        title="Modifier les Congés Payés"
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsEditModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: "Enregistrer",
            onClick: handleSaveEdit,
          },
        }}
      >
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium">{selectedEmployee.employeeName}</h4>
              <p className="text-sm text-muted-foreground">
                {selectedEmployee.position}
              </p>
            </div>

            {/* CP N-2 */}
            <div className="space-y-4">
              <h4 className="font-medium">CP N-2 ({currentYear - 2})</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpN2Acquired">Acquis (jours)</Label>
                  <Input
                    id="cpN2Acquired"
                    type="number"
                    step="0.5"
                    value={editForm.cpN2Acquired || 0}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        cpN2Acquired: parseFloat(e.target.value) || 0,
                        cpN2Balance:
                          (parseFloat(e.target.value) || 0) -
                          (editForm.cpN2Taken || 0),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpN2Taken">Pris (jours)</Label>
                  <Input
                    id="cpN2Taken"
                    type="number"
                    step="0.5"
                    value={editForm.cpN2Taken || 0}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        cpN2Taken: parseFloat(e.target.value) || 0,
                        cpN2Balance:
                          (editForm.cpN2Acquired || 0) -
                          (parseFloat(e.target.value) || 0),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Solde</Label>
                  <div className="h-10 flex items-center justify-center font-bold text-lg">
                    {(
                      (editForm.cpN2Acquired || 0) - (editForm.cpN2Taken || 0)
                    ).toFixed(1)}
                    j
                  </div>
                </div>
              </div>
            </div>

            {/* CP N-1 */}
            <div className="space-y-4">
              <h4 className="font-medium">CP N-1 ({currentYear - 1})</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpN1Acquired">Acquis (jours)</Label>
                  <Input
                    id="cpN1Acquired"
                    type="number"
                    step="0.5"
                    value={editForm.cpN1Acquired || 0}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        cpN1Acquired: parseFloat(e.target.value) || 0,
                        cpN1Balance:
                          (parseFloat(e.target.value) || 0) -
                          (editForm.cpN1Taken || 0),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpN1Taken">Pris (jours)</Label>
                  <Input
                    id="cpN1Taken"
                    type="number"
                    step="0.5"
                    value={editForm.cpN1Taken || 0}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        cpN1Taken: parseFloat(e.target.value) || 0,
                        cpN1Balance:
                          (editForm.cpN1Acquired || 0) -
                          (parseFloat(e.target.value) || 0),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Solde</Label>
                  <div className="h-10 flex items-center justify-center font-bold text-lg">
                    {(
                      (editForm.cpN1Acquired || 0) - (editForm.cpN1Taken || 0)
                    ).toFixed(1)}
                    j
                  </div>
                </div>
              </div>
            </div>

            {/* CP N */}
            <div className="space-y-4">
              <h4 className="font-medium">CP N ({currentYear})</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpNAcquired">Acquis (jours)</Label>
                  <Input
                    id="cpNAcquired"
                    type="number"
                    step="0.5"
                    value={editForm.cpNAcquired || 0}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        cpNAcquired: parseFloat(e.target.value) || 0,
                        cpNBalance:
                          (parseFloat(e.target.value) || 0) -
                          (editForm.cpNTaken || 0),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpNTaken">Pris (jours)</Label>
                  <Input
                    id="cpNTaken"
                    type="number"
                    step="0.5"
                    value={editForm.cpNTaken || 0}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        cpNTaken: parseFloat(e.target.value) || 0,
                        cpNBalance:
                          (editForm.cpNAcquired || 0) -
                          (parseFloat(e.target.value) || 0),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Solde</Label>
                  <div className="h-10 flex items-center justify-center font-bold text-lg">
                    {(
                      (editForm.cpNAcquired || 0) - (editForm.cpNTaken || 0)
                    ).toFixed(1)}
                    j
                  </div>
                </div>
              </div>
            </div>

            {/* Total Balance */}
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Solde Total</span>
                <span className="text-2xl font-bold text-primary">
                  {(
                    (editForm.cpN2Acquired || 0) -
                    (editForm.cpN2Taken || 0) +
                    ((editForm.cpN1Acquired || 0) - (editForm.cpN1Taken || 0)) +
                    ((editForm.cpNAcquired || 0) - (editForm.cpNTaken || 0))
                  ).toFixed(1)}
                  j
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        open={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
        type="details"
        title="Historique des Congés"
        description={
          selectedEmployee
            ? `${selectedEmployee.employeeName} - Historique des dates de prises des CP`
            : ""
        }
        size="lg"
      >
        {selectedEmployee && (
          <div className="space-y-4">
            {employeeHistory.length > 0 ? (
              <DataTable
                data={employeeHistory}
                columns={historyColumns}
                getRowId={(data) => data.id}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucun historique de congés disponible
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
