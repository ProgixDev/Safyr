"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GitBranch,
  FileText,
  Award,
  CreditCard,
  MapPin,
  Heart,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Download,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { HRRequest, HRRequestStatus, WorkflowStats } from "@/lib/types";

const mockRequests: HRRequest[] = [
  {
    id: "1",
    employeeId: "1",
    employeeName: "Marie Dupont",
    employeeNumber: "EMP-001",
    department: "Sécurité",
    type: "certificate",
    status: "pending",
    submittedAt: new Date("2024-12-20T10:30:00"),
    priority: "normal",
    history: [],
    createdAt: new Date("2024-12-20T10:30:00"),
    updatedAt: new Date("2024-12-20T10:30:00"),
  },
  {
    id: "2",
    employeeId: "2",
    employeeName: "Jean Martin",
    employeeNumber: "EMP-002",
    department: "Surveillance",
    type: "document",
    status: "in_progress",
    submittedAt: new Date("2024-12-19T14:15:00"),
    assignedTo: "hr-manager",
    assignedToName: "Alice Dubois",
    priority: "high",
    history: [],
    createdAt: new Date("2024-12-19T14:15:00"),
    updatedAt: new Date("2024-12-20T09:00:00"),
  },
  {
    id: "3",
    employeeId: "3",
    employeeName: "Sophie Leroy",
    employeeNumber: "EMP-003",
    department: "Administration",
    type: "bank_details",
    status: "validated",
    submittedAt: new Date("2024-12-18T11:00:00"),
    processedAt: new Date("2024-12-19T16:30:00"),
    processedBy: "hr-manager",
    processedByName: "Alice Dubois",
    priority: "normal",
    history: [],
    createdAt: new Date("2024-12-18T11:00:00"),
    updatedAt: new Date("2024-12-19T16:30:00"),
  },
  {
    id: "4",
    employeeId: "4",
    employeeName: "Pierre Durand",
    employeeNumber: "EMP-004",
    department: "Sécurité",
    type: "address",
    status: "pending",
    submittedAt: new Date("2024-12-17T09:45:00"),
    priority: "low",
    history: [],
    createdAt: new Date("2024-12-17T09:45:00"),
    updatedAt: new Date("2024-12-17T09:45:00"),
  },
];

const statusLabels: Record<HRRequestStatus, string> = {
  pending: "En attente",
  in_progress: "En cours",
  validated: "Validée",
  refused: "Refusée",
  cancelled: "Annulée",
};

const statusColors: Record<
  HRRequestStatus,
  "default" | "secondary" | "destructive"
> = {
  pending: "default",
  in_progress: "secondary",
  validated: "secondary",
  refused: "destructive",
  cancelled: "default",
};

const requestTypeLabels: Record<string, string> = {
  certificate: "Certificat",
  document: "Document",
  bank_details: "Coordonnées bancaires",
  address: "Adresse",
  civil_status: "Statut civil",
};

const requestTypeIcons: Record<string, React.ElementType> = {
  certificate: Award,
  document: FileText,
  bank_details: CreditCard,
  address: MapPin,
  civil_status: Heart,
};

const priorityLabels = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente",
};

const priorityColors: Record<string, "default" | "secondary" | "destructive"> =
  {
    low: "secondary",
    normal: "default",
    high: "default",
    urgent: "destructive",
  };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Statistiques dérivées des demandes réelles.
 *
 * Elles étaient auparavant figées dans un objet constant : le « temps de
 * traitement moyen » affichait 18,5 h et la « plus ancienne demande en
 * attente » pointait vers une date absente de la liste — les deux tuiles ne
 * reflétaient donc jamais les demandes affichées juste en dessous.
 */
function computeStats(requests: HRRequest[], now: number): WorkflowStats {
  const countByStatus = (status: HRRequestStatus) =>
    requests.filter((r) => r.status === status).length;
  const countByType = (type: string) =>
    requests.filter((r) => r.type === type).length;

  // Temps de traitement : écart soumission → traitement, sur les demandes
  // effectivement traitées (validées ou refusées).
  const processed = requests.filter((r) => r.processedAt);
  const averageProcessingTime = processed.length
    ? processed.reduce(
        (sum, r) =>
          sum +
          (r.processedAt!.getTime() - r.submittedAt.getTime()) /
            (60 * 60 * 1000),
        0,
      ) / processed.length
    : 0;

  // Plus ancienne demande encore ouverte (en attente ou en cours).
  const stillOpen = requests.filter(
    (r) => r.status === "pending" || r.status === "in_progress",
  );
  const oldestPendingRequest = stillOpen.length
    ? new Date(Math.min(...stillOpen.map((r) => r.submittedAt.getTime())))
    : undefined;

  return {
    totalRequests: requests.length,
    pendingRequests: countByStatus("pending"),
    inProgressRequests: countByStatus("in_progress"),
    validatedRequests: countByStatus("validated"),
    refusedRequests: countByStatus("refused"),
    cancelledRequests: countByStatus("cancelled"),
    certificateRequests: countByType("certificate"),
    documentRequests: countByType("document"),
    personalInfoChangeRequests: requests.filter((r) =>
      ["bank_details", "address", "civil_status"].includes(r.type),
    ).length,
    averageProcessingTime,
    requestsByPriority: {
      low: requests.filter((r) => r.priority === "low").length,
      normal: requests.filter((r) => r.priority === "normal").length,
      high: requests.filter((r) => r.priority === "high").length,
      urgent: requests.filter((r) => r.priority === "urgent").length,
    },
    requestsThisWeek: requests.filter(
      (r) => now - r.submittedAt.getTime() <= 7 * DAY_MS,
    ).length,
    requestsThisMonth: requests.filter(
      (r) => now - r.submittedAt.getTime() <= 30 * DAY_MS,
    ).length,
    oldestPendingRequest,
  };
}

export default function WorkflowsRequestsPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const stats = useMemo(
    () => computeStats(mockRequests, new Date().getTime()),
    [],
  );
  const processedCount = mockRequests.filter((r) => r.processedAt).length;
  const oldestPendingDays = stats.oldestPendingRequest
    ? Math.floor(
        (new Date().getTime() - stats.oldestPendingRequest.getTime()) / DAY_MS,
      )
    : null;

  // Apply filters
  let filteredRequests = mockRequests;

  if (filterStatus !== "all") {
    filteredRequests = filteredRequests.filter(
      (r) => r.status === filterStatus,
    );
  }

  if (filterType !== "all") {
    filteredRequests = filteredRequests.filter((r) => r.type === filterType);
  }

  const handleExportPDF = () => {
    alert("Export PDF des demandes RH en cours...");
  };

  const columns: ColumnDef<HRRequest>[] = [
    {
      key: "id",
      label: "N° Demande",
      render: (request: HRRequest) => (
        <div className="font-medium">#{request.id}</div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (request: HRRequest) => {
        const Icon = requestTypeIcons[request.type];
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{requestTypeLabels[request.type]}</span>
          </div>
        );
      },
    },
    {
      key: "employeeName",
      label: "Employé",
      render: (request: HRRequest) => (
        <Link
          href={`/dashboard/hr/collaborators/${request.employeeId}`}
          className="hover:underline"
        >
          <div className="font-medium">{request.employeeName}</div>
          <div className="text-sm text-muted-foreground">
            {request.employeeNumber} • {request.department}
          </div>
        </Link>
      ),
    },
    {
      key: "submittedAt",
      label: "Date de soumission",
      render: (request: HRRequest) => (
        <div className="text-sm">
          {request.submittedAt.toLocaleDateString("fr-FR")}
          <div className="text-xs text-muted-foreground">
            {request.submittedAt.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ),
    },
    {
      key: "priority",
      label: "Priorité",
      render: (request: HRRequest) => (
        <Badge variant={priorityColors[request.priority]}>
          {priorityLabels[request.priority]}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (request: HRRequest) => (
        <Badge variant={statusColors[request.status]}>
          {statusLabels[request.status]}
        </Badge>
      ),
    },
    {
      key: "assignedTo",
      label: "Assigné à",
      render: (request: HRRequest) =>
        request.assignedToName || (
          <span className="text-muted-foreground">-</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Demandes RH</h1>
          <p className="text-muted-foreground">
            Gestion centralisée des demandes et workflows RH
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Link href="/dashboard/hr/hr-services/automation">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Automatisation
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.requestsThisWeek} cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              À traiter rapidement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressRequests}</div>
            <p className="text-xs text-muted-foreground">En traitement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.validatedRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.requestsThisMonth} ce mois-ci
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/hr/hr-services/document-requests/certificate">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Demandes de certificats
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.certificateRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                Certificats de travail, salaire, emploi...
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/hr/hr-services/document-requests">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Demandes de documents
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.documentRequests}</div>
              <p className="text-xs text-muted-foreground">
                Bulletins, contrats, attestations...
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/hr/hr-services/bank-details">
          <Card className="cursor-pointer transition-colors hover:bg-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Changements d&apos;informations
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.personalInfoChangeRequests}
              </div>
              <p className="text-xs text-muted-foreground">
                Coordonnées bancaires, adresse, statut civil...
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Temps de traitement moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {processedCount > 0 ? (
              <>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold">
                    {stats.averageProcessingTime.toFixed(1)} h
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sur {processedCount} demande{processedCount > 1 ? "s" : ""}{" "}
                  traitée{processedCount > 1 ? "s" : ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune demande traitée pour le moment
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Plus ancienne demande en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {oldestPendingDays !== null ? (
              <>
                <div className="text-3xl font-bold">
                  {oldestPendingDays} jour{oldestPendingDays > 1 ? "s" : ""}
                </div>
                <p className="text-xs text-muted-foreground">
                  Depuis le{" "}
                  {stats.oldestPendingRequest?.toLocaleDateString("fr-FR")}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune demande en attente
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Demandes récentes</CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="validated">Validées</SelectItem>
                  <SelectItem value="refused">Refusées</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="certificate">Certificats</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="bank_details">Banque</SelectItem>
                  <SelectItem value="address">Adresse</SelectItem>
                  <SelectItem value="civil_status">Statut civil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredRequests} />
        </CardContent>
      </Card>
    </div>
  );
}
