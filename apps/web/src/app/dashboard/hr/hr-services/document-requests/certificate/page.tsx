"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Eye,
  Pencil,
  Download,
  MoreVertical,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import {
  CertificateRequest,
  CertificateType,
  HRRequestStatus,
} from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";

// Mock employees
const mockEmployees = [
  { id: "1", name: "Marie Dupont", department: "Sécurité" },
  { id: "2", name: "Jean Martin", department: "Surveillance" },
  { id: "3", name: "Sophie Leroy", department: "Administration" },
  { id: "4", name: "Pierre Durand", department: "Sécurité" },
];

// Mock data
const mockCertificateRequests: CertificateRequest[] = [
  {
    id: "1",
    employeeId: "1",
    employeeName: "Marie Dupont",
    employeeNumber: "EMP-001",
    department: "Sécurité",
    type: "certificate",
    certificateType: "employment",
    reason: "Demande de prêt bancaire",
    quantity: 2,
    language: "fr",
    deliveryMethod: "email",
    status: "validated",
    submittedAt: new Date("2024-12-18T10:30:00"),
    processedAt: new Date("2024-12-18T14:20:00"),
    processedBy: "hr-manager",
    processedByName: "Alice Dubois",
    generatedCertificateUrl: "/documents/cert-emp-001.pdf",
    generatedAt: new Date("2024-12-18T14:20:00"),
    priority: "normal",
    history: [],
    createdAt: new Date("2024-12-18T10:30:00"),
    updatedAt: new Date("2024-12-18T14:20:00"),
  },
  {
    id: "2",
    employeeId: "2",
    employeeName: "Jean Martin",
    employeeNumber: "EMP-002",
    department: "Surveillance",
    type: "certificate",
    certificateType: "salary",
    reason: "Dossier location appartement",
    quantity: 1,
    language: "fr",
    deliveryMethod: "email",
    status: "pending",
    submittedAt: new Date("2024-12-20T09:15:00"),
    priority: "high",
    history: [],
    createdAt: new Date("2024-12-20T09:15:00"),
    updatedAt: new Date("2024-12-20T09:15:00"),
  },
  {
    id: "3",
    employeeId: "3",
    employeeName: "Sophie Leroy",
    employeeNumber: "EMP-003",
    department: "Administration",
    type: "certificate",
    certificateType: "work",
    reason: "Constitution dossier retraite",
    quantity: 1,
    language: "fr",
    deliveryMethod: "pickup",
    status: "in_progress",
    submittedAt: new Date("2024-12-19T16:45:00"),
    assignedTo: "hr-manager",
    assignedToName: "Alice Dubois",
    priority: "normal",
    history: [],
    createdAt: new Date("2024-12-19T16:45:00"),
    updatedAt: new Date("2024-12-20T08:30:00"),
  },
];

const certificateTypeLabels: Record<CertificateType, string> = {
  employment: "Certificat d'emploi",
  salary: "Certificat de salaire",
  work: "Certificat de travail",
  internship: "Attestation de stage",
  other: "Autre",
};

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

const deliveryMethodLabels = {
  email: "Email",
  pickup: "À retirer sur place",
  mail: "Courrier postal",
};

export default function CertificateRequestsPage() {
  const [requests, setRequests] = useState<CertificateRequest[]>(
    mockCertificateRequests,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] =
    useState<CertificateRequest | null>(null);
  const [viewingRequest, setViewingRequest] =
    useState<CertificateRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCertType, setFilterCertType] = useState<string>("all");

  const [formData, setFormData] = useState({
    employeeId: "",
    certificateType: "employment" as CertificateType,
    reason: "",
    quantity: "1",
    language: "fr" as "fr" | "en",
    deliveryMethod: "email" as "email" | "pickup" | "mail",
    deliveryAddress: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
  });

  const handleCreate = () => {
    setEditingRequest(null);
    setFormData({
      employeeId: "",
      certificateType: "employment",
      reason: "",
      quantity: "1",
      language: "fr",
      deliveryMethod: "email",
      deliveryAddress: "",
      priority: "normal",
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (request: CertificateRequest) => {
    setEditingRequest(request);
    setFormData({
      employeeId: request.employeeId,
      certificateType: request.certificateType,
      reason: request.reason,
      quantity: request.quantity.toString(),
      language: request.language,
      deliveryMethod: request.deliveryMethod,
      deliveryAddress: request.deliveryAddress || "",
      priority: request.priority,
    });
    setIsCreateModalOpen(true);
  };

  const handleView = (request: CertificateRequest) => {
    setViewingRequest(request);
    setIsViewModalOpen(true);
  };

  const handleValidate = (request: CertificateRequest) => {
    setRequests(
      requests.map((r) =>
        r.id === request.id
          ? {
              ...r,
              status: "validated",
              processedAt: new Date(),
              processedBy: "current-user",
              processedByName: "Utilisateur actuel",
              generatedCertificateUrl: `/documents/cert-${request.id}.pdf`,
              generatedAt: new Date(),
              updatedAt: new Date(),
            }
          : r,
      ),
    );
    alert("Demande validée avec succès!");
  };

  const handleRefuse = (request: CertificateRequest) => {
    const reason = prompt("Motif du refus:");
    if (reason) {
      setRequests(
        requests.map((r) =>
          r.id === request.id
            ? {
                ...r,
                status: "refused",
                processedAt: new Date(),
                processedBy: "current-user",
                processedByName: "Utilisateur actuel",
                refusalReason: reason,
                updatedAt: new Date(),
              }
            : r,
        ),
      );
      alert("Demande refusée");
    }
  };

  const handleSave = () => {
    const employee = mockEmployees.find((e) => e.id === formData.employeeId);
    if (!employee) {
      alert("Veuillez sélectionner un employé");
      return;
    }

    const requestData: Partial<CertificateRequest> = {
      employeeId: formData.employeeId,
      employeeName: employee.name,
      employeeNumber: `EMP-${formData.employeeId.padStart(3, "0")}`,
      department: employee.department,
      certificateType: formData.certificateType,
      reason: formData.reason,
      quantity: Number(formData.quantity),
      language: formData.language,
      deliveryMethod: formData.deliveryMethod,
      deliveryAddress: formData.deliveryAddress || undefined,
      priority: formData.priority,
    };

    if (editingRequest) {
      setRequests(
        requests.map((request) =>
          request.id === editingRequest.id
            ? {
                ...request,
                ...requestData,
                updatedAt: new Date(),
              }
            : request,
        ),
      );
    } else {
      const newRequest: CertificateRequest = {
        id: Date.now().toString(),
        type: "certificate",
        status: "pending",
        submittedAt: new Date(),
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...requestData,
      } as CertificateRequest;
      setRequests([newRequest, ...requests]);
    }

    setIsCreateModalOpen(false);
  };

  const handleExportPDF = () => {
    alert("Export PDF des demandes de certificats...");
  };

  // Apply filters
  let filteredRequests = requests;

  if (filterStatus !== "all") {
    filteredRequests = filteredRequests.filter(
      (r) => r.status === filterStatus,
    );
  }

  if (filterCertType !== "all") {
    filteredRequests = filteredRequests.filter(
      (r) => r.certificateType === filterCertType,
    );
  }

  const columns: ColumnDef<CertificateRequest>[] = [
    {
      key: "id",
      label: "N° Demande",
      render: (request: CertificateRequest) => (
        <div className="font-medium">#{request.id}</div>
      ),
    },
    {
      key: "employeeName",
      label: "Employé",
      render: (request: CertificateRequest) => (
        <Link
          href={`/dashboard/hr/collaborators/${request.employeeId}`}
          className="hover:underline"
        >
          <div className="font-medium">{request.employeeName}</div>
          <div className="text-sm text-muted-foreground">
            {request.department}
          </div>
        </Link>
      ),
    },
    {
      key: "certificateType",
      label: "Type de certificat",
      render: (request: CertificateRequest) => (
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-muted-foreground" />
          {certificateTypeLabels[request.certificateType]}
        </div>
      ),
    },
    {
      key: "submittedAt",
      label: "Date de soumission",
      render: (request: CertificateRequest) =>
        request.submittedAt.toLocaleDateString("fr-FR"),
    },
    {
      key: "quantity",
      label: "Quantité",
      render: (request: CertificateRequest) => request.quantity,
    },
    {
      key: "status",
      label: "Statut",
      render: (request: CertificateRequest) => (
        <Badge variant={statusColors[request.status]}>
          {statusLabels[request.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (request: CertificateRequest) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(request)}>
              <Eye className="mr-2 h-4 w-4 text-green-600" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(request)}>
              <Pencil className="mr-2 h-4 w-4 text-orange-500" />
              Modifier
            </DropdownMenuItem>
            {request.status === "pending" && (
              <>
                <DropdownMenuItem onClick={() => handleValidate(request)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Valider
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleRefuse(request)}
                  className="text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Refuser
                </DropdownMenuItem>
              </>
            )}
            {request.generatedCertificateUrl && (
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Calculate stats
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const validatedRequests = requests.filter(
    (r) => r.status === "validated",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Demandes de Certificats</h1>
          <p className="text-muted-foreground">
            Gestion des demandes de certificats de travail, emploi et salaire
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter PDF
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle demande
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">Demandes totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validatedRequests}</div>
            <p className="text-xs text-muted-foreground">Certificats émis</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Demandes ({filteredRequests.length})</CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="validated">Validées</SelectItem>
                  <SelectItem value="refused">Refusées</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterCertType} onValueChange={setFilterCertType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="employment">Emploi</SelectItem>
                  <SelectItem value="salary">Salaire</SelectItem>
                  <SelectItem value="work">Travail</SelectItem>
                  <SelectItem value="internship">Stage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredRequests} />
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={
          editingRequest
            ? "Modifier la demande"
            : "Nouvelle demande de certificat"
        }
        size="lg"
        actions={{
          primary: {
            label: "Enregistrer",
            onClick: handleSave,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="employeeId">Employé *</Label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) =>
                setFormData({ ...formData, employeeId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {mockEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} - {employee.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="certificateType">Type de certificat *</Label>
            <Select
              value={formData.certificateType}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  certificateType: value as CertificateType,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employment">
                  Certificat d&apos;emploi
                </SelectItem>
                <SelectItem value="salary">Certificat de salaire</SelectItem>
                <SelectItem value="work">Certificat de travail</SelectItem>
                <SelectItem value="internship">Attestation de stage</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Motif de la demande *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="Ex: Demande de prêt bancaire, location appartement..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Nombre d&apos;exemplaires *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="10"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="language">Langue *</Label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  setFormData({ ...formData, language: value as "fr" | "en" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">Anglais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="deliveryMethod">Mode de remise *</Label>
            <Select
              value={formData.deliveryMethod}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  deliveryMethod: value as "email" | "pickup" | "mail",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="pickup">À retirer sur place</SelectItem>
                <SelectItem value="mail">Courrier postal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.deliveryMethod === "mail" && (
            <div>
              <Label htmlFor="deliveryAddress">Adresse de livraison</Label>
              <Textarea
                id="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryAddress: e.target.value })
                }
                rows={3}
                placeholder="Adresse complète..."
              />
            </div>
          )}
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de la demande"
        size="lg"
      >
        {viewingRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Employé</Label>
                <p className="text-sm font-medium">
                  {viewingRequest.employeeName}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Département</Label>
                <p className="text-sm font-medium">
                  {viewingRequest.department}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">
                Type de certificat
              </Label>
              <p className="text-sm font-medium">
                {certificateTypeLabels[viewingRequest.certificateType]}
              </p>
            </div>

            <div>
              <Label className="text-muted-foreground">Motif</Label>
              <p className="text-sm">{viewingRequest.reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Quantité</Label>
                <p className="text-sm font-medium">{viewingRequest.quantity}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Langue</Label>
                <p className="text-sm font-medium">
                  {viewingRequest.language === "fr" ? "Français" : "Anglais"}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Mode de remise</Label>
              <p className="text-sm font-medium">
                {deliveryMethodLabels[viewingRequest.deliveryMethod]}
              </p>
            </div>

            {viewingRequest.deliveryAddress && (
              <div>
                <Label className="text-muted-foreground">
                  Adresse de livraison
                </Label>
                <p className="text-sm">{viewingRequest.deliveryAddress}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">
                  Date de soumission
                </Label>
                <p className="text-sm font-medium">
                  {viewingRequest.submittedAt.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Statut</Label>
                <Badge variant={statusColors[viewingRequest.status]}>
                  {statusLabels[viewingRequest.status]}
                </Badge>
              </div>
            </div>

            {viewingRequest.processedAt && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Traité le</Label>
                  <p className="text-sm font-medium">
                    {viewingRequest.processedAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Traité par</Label>
                  <p className="text-sm font-medium">
                    {viewingRequest.processedByName}
                  </p>
                </div>
              </div>
            )}

            {viewingRequest.refusalReason && (
              <div>
                <Label className="text-muted-foreground">Motif du refus</Label>
                <p className="text-sm">{viewingRequest.refusalReason}</p>
              </div>
            )}

            {viewingRequest.generatedCertificateUrl && (
              <div>
                <Label className="text-muted-foreground">
                  Certificat généré
                </Label>
                <Button variant="outline" size="sm" className="mt-2">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le certificat
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
