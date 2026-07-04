"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Eye,
  BadgeEuro,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  History,
  FileText,
  Download,
  Filter,
  BarChart3,
  AlertCircle,
  UserCheck,
  Hourglass,
  Timer,
  Award,
  Settings,
} from "lucide-react";

// Types
type ContractType = "full_time" | "part_time";
type OvertimeStatus = "pending" | "validated" | "paid" | "carried_over" | "rejected";

interface MonthlyOvertime {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  month: string;
  year: number;
  contractHours: number;
  actualHours: number;
  overtimeHours: number;
  status: OvertimeStatus;
  type: string;
  days: number;
  notes?: string;
  validatedBy?: string;
  validatedAt?: Date;
  paidAt?: Date;
}

interface EmployeeContract {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  contractType: ContractType;
  monthlyContractHours: number;
  annualOvertimeLimit: number;
  totalOvertimeAccumulated: number;
  totalOvertimePaid: number;
  totalOvertimePending: number;
}

// Données mockées
const mockEmployees: EmployeeContract[] = [
  {
    employeeId: "EMP001",
    employeeName: "Jean Dupont",
    employeeNumber: "EMP001",
    department: "Sécurité",
    contractType: "full_time",
    monthlyContractHours: 151.67,
    annualOvertimeLimit: 220,
    totalOvertimeAccumulated: 45.5,
    totalOvertimePaid: 20,
    totalOvertimePending: 25.5,
  },
  {
    employeeId: "EMP002",
    employeeName: "Marie Martin",
    employeeNumber: "EMP002",
    department: "Direction",
    contractType: "full_time",
    monthlyContractHours: 151.67,
    annualOvertimeLimit: 220,
    totalOvertimeAccumulated: 32,
    totalOvertimePaid: 15,
    totalOvertimePending: 17,
  },
  {
    employeeId: "EMP005",
    employeeName: "Luc Moreau",
    employeeNumber: "EMP005",
    department: "Sécurité",
    contractType: "part_time",
    monthlyContractHours: 80,
    annualOvertimeLimit: 160,
    totalOvertimeAccumulated: 18.5,
    totalOvertimePaid: 0,
    totalOvertimePending: 18.5,
  },
];

const mockMonthlyOvertime: MonthlyOvertime[] = [
  {
    id: "1",
    employeeId: "EMP001",
    employeeName: "Jean Dupont",
    employeeNumber: "EMP001",
    department: "Sécurité",
    month: "Janvier",
    year: 2024,
    contractHours: 151.67,
    actualHours: 160.17,
    overtimeHours: 8.5,
    status: "paid",
    type: "Heures normales",
    days: 5,
    validatedBy: "Admin",
    validatedAt: new Date("2024-02-01"),
    paidAt: new Date("2024-02-15"),
  },
  {
    id: "2",
    employeeId: "EMP001",
    employeeName: "Jean Dupont",
    employeeNumber: "EMP001",
    department: "Sécurité",
    month: "Février",
    year: 2024,
    contractHours: 151.67,
    actualHours: 157.67,
    overtimeHours: 6.0,
    status: "paid",
    type: "Heures normales",
    days: 4,
    validatedBy: "Admin",
    validatedAt: new Date("2024-03-01"),
    paidAt: new Date("2024-03-15"),
  },
  {
    id: "3",
    employeeId: "EMP001",
    employeeName: "Jean Dupont",
    employeeNumber: "EMP001",
    department: "Sécurité",
    month: "Mars",
    year: 2024,
    contractHours: 151.67,
    actualHours: 159.17,
    overtimeHours: 7.5,
    status: "pending",
    type: "Heures normales",
    days: 5,
  },
  {
    id: "4",
    employeeId: "EMP001",
    employeeName: "Jean Dupont",
    employeeNumber: "EMP001",
    department: "Sécurité",
    month: "Avril",
    year: 2024,
    contractHours: 151.67,
    actualHours: 156.67,
    overtimeHours: 5.0,
    status: "pending",
    type: "Heures de nuit",
    days: 3,
  },
  {
    id: "5",
    employeeId: "EMP002",
    employeeName: "Marie Martin",
    employeeNumber: "EMP002",
    department: "Direction",
    month: "Janvier",
    year: 2024,
    contractHours: 151.67,
    actualHours: 155.67,
    overtimeHours: 4.0,
    status: "paid",
    type: "Heures normales",
    days: 3,
    validatedBy: "Admin",
    validatedAt: new Date("2024-02-01"),
    paidAt: new Date("2024-02-15"),
  },
  {
    id: "6",
    employeeId: "EMP002",
    employeeName: "Marie Martin",
    employeeNumber: "EMP002",
    department: "Direction",
    month: "Février",
    year: 2024,
    contractHours: 151.67,
    actualHours: 157.17,
    overtimeHours: 5.5,
    status: "pending",
    type: "Weekend",
    days: 4,
  },
  {
    id: "7",
    employeeId: "EMP005",
    employeeName: "Luc Moreau",
    employeeNumber: "EMP005",
    department: "Sécurité",
    month: "Janvier",
    year: 2024,
    contractHours: 80,
    actualHours: 83.5,
    overtimeHours: 3.5,
    status: "pending",
    type: "Heures normales",
    days: 2,
  },
  {
    id: "8",
    employeeId: "EMP005",
    employeeName: "Luc Moreau",
    employeeNumber: "EMP005",
    department: "Sécurité",
    month: "Février",
    year: 2024,
    contractHours: 80,
    actualHours: 84.0,
    overtimeHours: 4.0,
    status: "pending",
    type: "Heures normales",
    days: 3,
  },
];

export default function OvertimeTrackingPage() {
  const [employees, setEmployees] = useState(mockEmployees);
  const [monthlyData, setMonthlyData] = useState(mockMonthlyOvertime);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeContract | null>(null);
  const [selectedOvertime, setSelectedOvertime] = useState<MonthlyOvertime | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"summary" | "detailed">("summary");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");

  // Statistiques globales
  const stats = useMemo(() => {
    const totalOvertime = monthlyData.reduce((sum, m) => sum + m.overtimeHours, 0);
    const totalPaid = monthlyData.filter(m => m.status === "paid").reduce((sum, m) => sum + m.overtimeHours, 0);
    const totalPending = monthlyData.filter(m => m.status === "pending").reduce((sum, m) => sum + m.overtimeHours, 0);
    const totalValidated = monthlyData.filter(m => m.status === "validated").reduce((sum, m) => sum + m.overtimeHours, 0);
    
    const employeesWithOvertime = new Set(monthlyData.map(m => m.employeeId)).size;
    
    return {
      totalOvertime,
      totalPaid,
      totalPending,
      totalValidated,
      employeesWithOvertime,
      averageOvertime: employeesWithOvertime > 0 ? totalOvertime / employeesWithOvertime : 0,
    };
  }, [monthlyData]);

  // Calcul des heures par employé
  const employeeOvertimeSummary = useMemo(() => {
    return employees.map(emp => {
      const empData = monthlyData.filter(m => m.employeeId === emp.employeeId);
      const total = empData.reduce((sum, m) => sum + m.overtimeHours, 0);
      const paid = empData.filter(m => m.status === "paid").reduce((sum, m) => sum + m.overtimeHours, 0);
      const pending = empData.filter(m => m.status === "pending").reduce((sum, m) => sum + m.overtimeHours, 0);
      const validated = empData.filter(m => m.status === "validated").reduce((sum, m) => sum + m.overtimeHours, 0);
      
      return {
        ...emp,
        totalOvertime: total,
        paidOvertime: paid,
        pendingOvertime: pending,
        validatedOvertime: validated,
        monthCount: empData.length,
        overLimit: total > emp.annualOvertimeLimit,
      };
    });
  }, [employees, monthlyData]);

  const getStatusBadge = (status: OvertimeStatus) => {
    const config = {
      pending: { variant: "secondary", label: "En attente", icon: Clock },
      validated: { variant: "default", label: "Validé", icon: CheckCircle },
      paid: { variant: "success", label: "Payé", icon: BadgeEuro },
      carried_over: { variant: "warning", label: "Reporté", icon: Hourglass },
      rejected: { variant: "destructive", label: "Rejeté", icon: AlertCircle },
    };
    const { variant, label, icon: Icon } = config[status] || config.pending;
    return (
      <Badge variant={variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const handleValidateOvertime = (id: string) => {
    setMonthlyData(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, status: "validated", validatedBy: "Admin", validatedAt: new Date() }
          : m
      )
    );
  };

  const handlePayOvertime = (id: string) => {
    setMonthlyData(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, status: "paid", paidAt: new Date() }
          : m
      )
    );
  };

  const handleRejectOvertime = (id: string) => {
    setMonthlyData(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, status: "rejected" }
          : m
      )
    );
  };

  const handleAddOvertime = (data: any) => {
    const newEntry: MonthlyOvertime = {
      id: `m${Date.now()}`,
      ...data,
      status: "pending",
    };
    setMonthlyData(prev => [...prev, newEntry]);
  };

  // Colonnes pour la vue synthétique
  const summaryColumns: ColumnDef<EmployeeContract & {
    totalOvertime: number;
    paidOvertime: number;
    pendingOvertime: number;
    validatedOvertime: number;
    monthCount: number;
    overLimit: boolean;
  }>[] = [
    {
      key: "employee",
      label: "Employé",
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">{item.employeeName}</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{item.employeeNumber}</span>
            <span>•</span>
            <span>{item.department}</span>
            <Badge variant="outline" className="text-xs">
              {item.contractType === "full_time" ? "Temps plein" : "Temps partiel"}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      key: "totalOvertime",
      label: "Total heures sup",
      sortable: true,
      render: (item) => (
        <span className={`font-semibold ${item.overLimit ? "text-red-600" : "text-blue-600"}`}>
          {item.totalOvertime.toFixed(1)}h
        </span>
      ),
    },
    {
      key: "pendingOvertime",
      label: "En attente",
      sortable: true,
      render: (item) => (
        <span className="text-orange-600 font-medium">
          {item.pendingOvertime.toFixed(1)}h
        </span>
      ),
    },
    {
      key: "validatedOvertime",
      label: "Validé",
      sortable: true,
      render: (item) => (
        <span className="text-blue-600 font-medium">
          {item.validatedOvertime.toFixed(1)}h
        </span>
      ),
    },
    {
      key: "paidOvertime",
      label: "Payé",
      sortable: true,
      render: (item) => (
        <span className="text-green-600 font-medium">
          {item.paidOvertime.toFixed(1)}h
        </span>
      ),
    },
    {
      key: "monthCount",
      label: "Mois",
      sortable: true,
      render: (item) => (
        <span className="text-sm">{item.monthCount} mois</span>
      ),
    },
  ];

  // Colonnes pour la vue détaillée
  const detailedColumns: ColumnDef<MonthlyOvertime>[] = [
    {
      key: "employee",
      label: "Employé",
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">{item.employeeName}</div>
          <div className="text-sm text-muted-foreground">{item.employeeNumber}</div>
        </div>
      ),
    },
    {
      key: "period",
      label: "Période",
      sortable: true,
      render: (item) => (
        <span>{item.month} {item.year}</span>
      ),
    },
    {
      key: "contractHours",
      label: "Quota",
      sortable: true,
      render: (item) => (
        <span className="text-sm">{item.contractHours}h</span>
      ),
    },
    {
      key: "actualHours",
      label: "Réalisé",
      sortable: true,
      render: (item) => (
        <span className="font-medium">{item.actualHours.toFixed(1)}h</span>
      ),
    },
    {
      key: "overtimeHours",
      label: "Heures sup",
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-blue-600">
          +{item.overtimeHours.toFixed(1)}h
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (item) => (
        <Badge variant="outline">{item.type}</Badge>
      ),
    },
  ];

  // Filtres pour la vue détaillée
  const filteredDetailedData = useMemo(() => {
    return monthlyData.filter(item => {
      const statusMatch = filterStatus === "all" || item.status === filterStatus;
      const deptMatch = filterDepartment === "all" || item.department === filterDepartment;
      return statusMatch && deptMatch;
    });
  }, [monthlyData, filterStatus, filterDepartment]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Suivi des Heures Supplémentaires
          </h1>
          <p className="text-muted-foreground">
            Gestion et suivi des heures supplémentaires par employé
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button className="gap-2" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <InfoCardContainer>
        <InfoCard
          icon={Clock}
          title="Total Heures Sup"
          value={`${stats.totalOvertime.toFixed(1)}h`}
          subtext={`${stats.employeesWithOvertime} employés concernés`}
          color="blue"
        />
        <InfoCard
          icon={AlertCircle}
          title="En Attente"
          value={`${stats.totalPending.toFixed(1)}h`}
          subtext="À valider ou payer"
          color="orange"
        />
        <InfoCard
          icon={CheckCircle}
          title="Validé"
          value={`${stats.totalValidated.toFixed(1)}h`}
          subtext="En attente de paiement"
          color="green"
        />
        <InfoCard
          icon={BadgeEuro}
          title="Payé"
          value={`${stats.totalPaid.toFixed(1)}h`}
          subtext="Déjà réglé"
          color="purple"
        />
      </InfoCardContainer>

      {/* Vue Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "summary" | "detailed")} className="w-full">
          <TabsList>
            <TabsTrigger value="summary">Vue Synthétique</TabsTrigger>
            <TabsTrigger value="detailed">Vue Détaillée</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {viewMode === "detailed" && (
          <div className="flex gap-2 ml-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="validated">Validé</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-40">
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Sécurité">Sécurité</SelectItem>
                <SelectItem value="Direction">Direction</SelectItem>
                <SelectItem value="RH">RH</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Tableau Synthétique */}
      {viewMode === "summary" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Récapitulatif par employé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={employeeOvertimeSummary}
              columns={summaryColumns}
              searchKeys={["employeeName", "employeeNumber", "department"]}
              searchPlaceholder="Rechercher un employé..."
              getRowId={(item) => item.employeeId}
              onRowClick={(item) => {
                setSelectedEmployee(item);
                setIsDetailsModalOpen(true);
              }}
              rowClassName={(item) => 
                item.overLimit ? "bg-red-50 dark:bg-red-950/20" : ""
              }
              actions={(item) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedEmployee(item);
                        setIsDetailsModalOpen(true);
                      }}
                      className="text-green-600 focus:text-green-700 focus:bg-green-50"
                    >
                      <Eye className="mr-2 h-4 w-4 text-green-600" />
                      Voir détails
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                    >
                      <History className="mr-2 h-4 w-4 text-blue-600" />
                      Historique
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-purple-600 focus:text-purple-700 focus:bg-purple-50"
                    >
                      <Settings className="mr-2 h-4 w-4 text-purple-600" />
                      Gérer le quota
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Tableau Détaillé */}
      {viewMode === "detailed" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Suivi mensuel détaillé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredDetailedData}
              columns={detailedColumns}
              searchKeys={["employeeName", "employeeNumber", "month"]}
              searchPlaceholder="Rechercher..."
              getRowId={(item) => item.id}
              actions={(item) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedOvertime(item);
                        setIsDetailsModalOpen(true);
                      }}
                      className="text-green-600 focus:text-green-700 focus:bg-green-50"
                    >
                      <Eye className="mr-2 h-4 w-4 text-green-600" />
                      Voir détails
                    </DropdownMenuItem>
                    
                    {item.status === "pending" && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleValidateOvertime(item.id)}
                          className="text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
                          Valider
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRejectOvertime(item.id)}
                          className="text-red-600 focus:text-red-700 focus:bg-red-50"
                        >
                          <AlertCircle className="mr-2 h-4 w-4 text-red-600" />
                          Rejeter
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {item.status === "validated" && (
                      <DropdownMenuItem
                        onClick={() => handlePayOvertime(item.id)}
                        className="text-purple-600 focus:text-purple-700 focus:bg-purple-50"
                      >
                        <BadgeEuro className="mr-2 h-4 w-4 text-purple-600" />
                        Marquer comme payé
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-700 focus:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Modal Détails */}
      <Modal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        type="details"
        title={selectedEmployee ? `Détails - ${selectedEmployee.employeeName}` : "Détails"}
        size="lg"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Employé</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedEmployee.employeeName} ({selectedEmployee.employeeNumber})
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Département</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedEmployee.department}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Type de contrat</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedEmployee.contractType === "full_time" ? "Temps plein" : "Temps partiel"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Quota mensuel</Label>
                <p className="text-sm font-medium">
                  {selectedEmployee.monthlyContractHours}h
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <Label className="text-sm font-medium">Total</Label>
                <p className="text-xl font-bold text-blue-600">
                  {selectedEmployee.totalOvertimeAccumulated}h
                </p>
              </div>
              <div className="text-center">
                <Label className="text-sm font-medium">Payé</Label>
                <p className="text-xl font-bold text-green-600">
                  {selectedEmployee.totalOvertimePaid}h
                </p>
              </div>
              <div className="text-center">
                <Label className="text-sm font-medium">En attente</Label>
                <p className="text-xl font-bold text-orange-600">
                  {selectedEmployee.totalOvertimePending}h
                </p>
              </div>
              <div className="text-center">
                <Label className="text-sm font-medium">Plafond</Label>
                <p className="text-xl font-bold text-purple-600">
                  {selectedEmployee.annualOvertimeLimit}h
                </p>
              </div>
            </div>

            {/* Barre de progression */}
            <div>
              <Label className="text-sm font-medium">Utilisation du plafond</Label>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>{selectedEmployee.totalOvertimeAccumulated}h utilisés</span>
                  <span>{selectedEmployee.annualOvertimeLimit}h max</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      selectedEmployee.totalOvertimeAccumulated / selectedEmployee.annualOvertimeLimit > 0.8
                        ? "bg-red-500"
                        : selectedEmployee.totalOvertimeAccumulated / selectedEmployee.annualOvertimeLimit > 0.5
                          ? "bg-orange-500"
                          : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (selectedEmployee.totalOvertimeAccumulated / selectedEmployee.annualOvertimeLimit) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Ajout */}
      <Modal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        type="form"
        title="Ajouter des heures supplémentaires"
        size="lg"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsAddModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: "Ajouter",
            onClick: () => setIsAddModalOpen(false),
          },
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Employé</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.employeeId} value={emp.employeeId}>
                    {emp.employeeName} ({emp.employeeNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mois</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent>
                  {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Année</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Heures contractuelles</Label>
              <Input type="number" step="0.01" placeholder="151.67" />
            </div>
            <div className="space-y-2">
              <Label>Heures réalisées</Label>
              <Input type="number" step="0.01" placeholder="160.17" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type d'heures</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Heures normales</SelectItem>
                <SelectItem value="night">Heures de nuit</SelectItem>
                <SelectItem value="weekend">Weekend</SelectItem>
                <SelectItem value="holiday">Jours fériés</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nombre de jours</Label>
            <Input type="number" placeholder="5" />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea placeholder="Informations complémentaires..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}