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
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { DocumentRequest, DocumentType, HRRequestStatus } from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";

import { mockDocumentRequests } from "@/data/hr-workflows";

// Mock employees for dropdown (simplified) - use inline for compatibility
const mockEmployees = [
  { id: "1", name: "Marie Dupont", department: "Sécurité" },
  { id: "2", name: "Jean Martin", department: "Surveillance" },
  { id: "3", name: "Sophie Leroy", department: "Administration" },
  { id: "4", name: "Pierre Durand", department: "Sécurité" },
];

// Mock data - use data from file, convert dates
const mockDocumentRequestsData: DocumentRequest[] = mockDocumentRequests.map(
  (req) => ({
    id: req.id,
    employeeId: req.employeeId,
    employeeName: req.employeeName,
    employeeNumber: req.employeeNumber,
    department: req.department || "Sécurité",
    type: "document" as const,
    documentType: req.documentType,
    documentDescription: req.documentDescription,
    period: req.period,
    year: req.year,
    specificDetails: req.specificDetails,
    deliveryMethod: req.deliveryMethod === "post" ? "mail" : req.deliveryMethod,
    status: req.status as HRRequestStatus,
    submittedAt: new Date(req.submittedAt),
    processedAt: req.processedAt ? new Date(req.processedAt) : undefined,
    processedBy: req.processedBy,
    processedByName: req.processedBy ? "Sophie Dubois" : undefined,
    providedAt: req.providedAt ? new Date(req.providedAt) : undefined,
    documentUrl: req.documentUrl,
    priority: req.priority,
    history: [],
    createdAt: new Date(req.createdAt),
    updatedAt: new Date(req.updatedAt),
  }),
);

const documentTypeLabels: Record<DocumentType, string> = {
  payslip: "Bulletin de paie",
  contract: "Contrat de travail",
  attestation: "Attestation",
  tax_document: "Document fiscal",
  social_security: "Sécurité sociale",
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

export default function DocumentRequestsPage() {
  const [requests, setRequests] = useState<DocumentRequest[]>(
    mockDocumentRequestsData,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<DocumentRequest | null>(
    null,
  );
  const [viewingRequest, setViewingRequest] = useState<DocumentRequest | null>(
    null,
  );
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDocType, setFilterDocType] = useState<string>("all");

  const [formData, setFormData] = useState({
    employeeId: "",
    documentType: "payslip" as DocumentType,
    documentDescription: "",
    period: "",
    year: "",
    specificDetails: "",
    deliveryMethod: "email" as "email" | "pickup" | "mail",
    deliveryAddress: "",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
  });

  const handleCreate = () => {
    setEditingRequest(null);
    setFormData({
      employeeId: "",
      documentType: "payslip",
      documentDescription: "",
      period: "",
      year: "",
      specificDetails: "",
      deliveryMethod: "email",
      deliveryAddress: "",
      priority: "normal",
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (request: DocumentRequest) => {
    setEditingRequest(request);
    setFormData({
      employeeId: request.employeeId,
      documentType: request.documentType,
      documentDescription: request.documentDescription,
      period: request.period || "",
      year: request.year?.toString() || "",
      specificDetails: request.specificDetails || "",
      deliveryMethod: request.deliveryMethod,
      deliveryAddress: request.deliveryAddress || "",
      priority: request.priority,
    });
    setIsCreateModalOpen(true);
  };

  const handleView = (request: DocumentRequest) => {
    setViewingRequest(request);
    setIsViewModalOpen(true);
  };

  const handleValidate = (request: DocumentRequest) => {
    setRequests(
      requests.map((r) =>
        r.id === request.id
          ? {
              ...r,
              status: "validated",
              processedAt: new Date(),
              processedBy: "current-user",
              processedByName: "Utilisateur actuel",
              documentUrl: `/documents/${request.documentType}-${request.id}.pdf`,
              providedAt: new Date(),
              updatedAt: new Date(),
            }
          : r,
      ),
    );
    alert("Demande validée et document fourni!");
  };

  const handleRefuse = (request: DocumentRequest) => {
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

    const requestData: Partial<DocumentRequest> = {
      employeeId: formData.employeeId,
      employeeName: employee.name,
      employeeNumber: `EMP-${formData.employeeId.padStart(3, "0")}`,
      department: employee.department,
      documentType: formData.documentType,
      documentDescription: formData.documentDescription,
      period: formData.period || undefined,
      year: formData.year ? Number(formData.year) : undefined,
      specificDetails: formData.specificDetails || undefined,
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
      const newRequest: DocumentRequest = {
        id: Date.now().toString(),
        type: "document",
        status: "pending",
        submittedAt: new Date(),
        history: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...requestData,
      } as DocumentRequest;
      setRequests([newRequest, ...requests]);
    }

    setIsCreateModalOpen(false);
  };

  const handleExportPDF = () => {
    alert("Export PDF des demandes de documents...");
  };

  // Apply filters
  let filteredRequests = requests;

  if (filterStatus !== "all") {
    filteredRequests = filteredRequests.filter(
      (r) => r.status === filterStatus,
    );
  }

  if (filterDocType !== "all") {
    filteredRequests = filteredRequests.filter(
      (r) => r.documentType === filterDocType,
    );
  }

  const columns: ColumnDef<DocumentRequest>[] = [
    {
      key: "id",
      label: "N° Demande",
      render: (request: DocumentRequest) => (
        <div className="font-medium">#{request.id}</div>
      ),
    },
    {
      key: "employeeName",
      label: "Employé",
      render: (request: DocumentRequest) => (
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
      key: "documentType",
      label: "Type de document",
      render: (request: DocumentRequest) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {documentTypeLabels[request.documentType]}
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (request: DocumentRequest) => (
        <div className="max-w-xs truncate text-sm">
          {request.documentDescription}
        </div>
      ),
    },
    {
      key: "submittedAt",
      label: "Date de soumission",
      render: (request: DocumentRequest) =>
        request.submittedAt.toLocaleDateString("fr-FR"),
    },
    {
      key: "status",
      label: "Statut",
      render: (request: DocumentRequest) => (
        <Badge variant={statusColors[request.status]}>
          {statusLabels[request.status]}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (request: DocumentRequest) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(request)}>
              <Eye className="mr-2 h-4 w-4 text-orange-500" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(request)}>
              <Pencil className="mr-2 h-4 w-4 text-green-600" />
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
            {request.documentUrl && (
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
          <h1 className="text-3xl font-bold">Demandes de Documents</h1>
          <p className="text-muted-foreground">
            Gestion des demandes de bulletins de paie, contrats et attestations
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
            <p className="text-xs text-muted-foreground">Documents fournis</p>
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

              <Select value={filterDocType} onValueChange={setFilterDocType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="payslip">Bulletin de paie</SelectItem>
                  <SelectItem value="contract">Contrat</SelectItem>
                  <SelectItem value="attestation">Attestation</SelectItem>
                  <SelectItem value="tax_document">Document fiscal</SelectItem>
                  <SelectItem value="social_security">
                    Sécurité sociale
                  </SelectItem>
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
            : "Nouvelle demande de document"
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
            <Label htmlFor="documentType">Type de document *</Label>
            <Select
              value={formData.documentType}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  documentType: value as DocumentType,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payslip">Bulletin de paie</SelectItem>
                <SelectItem value="contract">Contrat de travail</SelectItem>
                <SelectItem value="attestation">Attestation</SelectItem>
                <SelectItem value="tax_document">Document fiscal</SelectItem>
                <SelectItem value="social_security">
                  Sécurité sociale
                </SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="documentDescription">
              Description du document *
            </Label>
            <Textarea
              id="documentDescription"
              value={formData.documentDescription}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  documentDescription: e.target.value,
                })
              }
              placeholder="Ex: Bulletins de paie du mois de décembre 2024"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period">Période (pour bulletins)</Label>
              <Input
                id="period"
                value={formData.period}
                onChange={(e) =>
                  setFormData({ ...formData, period: e.target.value })
                }
                placeholder="Ex: 2024-12"
              />
            </div>

            <div>
              <Label htmlFor="year">Année (pour documents annuels)</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                placeholder="Ex: 2024"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="specificDetails">Détails spécifiques</Label>
            <Textarea
              id="specificDetails"
              value={formData.specificDetails}
              onChange={(e) =>
                setFormData({ ...formData, specificDetails: e.target.value })
              }
              rows={2}
              placeholder="Informations complémentaires..."
            />
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
              <Label className="text-muted-foreground">Type de document</Label>
              <p className="text-sm font-medium">
                {documentTypeLabels[viewingRequest.documentType]}
              </p>
            </div>

            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm">{viewingRequest.documentDescription}</p>
            </div>

            {viewingRequest.period && (
              <div>
                <Label className="text-muted-foreground">Période</Label>
                <p className="text-sm font-medium">{viewingRequest.period}</p>
              </div>
            )}

            {viewingRequest.year && (
              <div>
                <Label className="text-muted-foreground">Année</Label>
                <p className="text-sm font-medium">{viewingRequest.year}</p>
              </div>
            )}

            {viewingRequest.specificDetails && (
              <div>
                <Label className="text-muted-foreground">
                  Détails spécifiques
                </Label>
                <p className="text-sm">{viewingRequest.specificDetails}</p>
              </div>
            )}

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

            {viewingRequest.documentUrl && (
              <div>
                <Label className="text-muted-foreground">Document fourni</Label>
                <Button variant="outline" size="sm" className="mt-2">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le document
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
