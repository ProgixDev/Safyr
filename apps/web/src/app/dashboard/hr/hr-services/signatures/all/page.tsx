"use client";

import { useState } from "react";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import {
  FileText,
  Scale,
  Package,
  CheckSquare,
  FileCheck,
  Plus,
  Eye,
  Download,
  Send,
  CheckCircle,
  Clock,
  PenTool,
} from "lucide-react";
import { SignatureWorkflow, SignatureStatus, SignatureType } from "@/lib/types";
import Link from "next/link";

// Mock employees
const mockEmployees = [
  { id: "1", name: "Marie Dupont", email: "marie.dupont@example.com" },
  { id: "2", name: "Jean Martin", email: "jean.martin@example.com" },
  { id: "3", name: "Sophie Leroy", email: "sophie.leroy@example.com" },
];

const statusLabels: Record<SignatureStatus, string> = {
  pending: "En attente",
  sent: "Envoyée",
  signed: "Signée",
  refused: "Refusée",
  expired: "Expirée",
  cancelled: "Annulée",
};

const statusColors: Record<
  SignatureStatus,
  "default" | "secondary" | "destructive"
> = {
  pending: "default",
  sent: "secondary",
  signed: "secondary",
  refused: "destructive",
  expired: "destructive",
  cancelled: "default",
};

// Type-specific labels and data
const pageConfig: Record<
  SignatureType,
  {
    title: string;
    description: string;
    icon: React.ElementType;
    createLabel: string;
  }
> = {
  contract: {
    title: "Signatures de Contrats",
    description:
      "Signature électronique eIDAS des contrats de travail (CDI, CDD, avenants)",
    icon: FileText,
    createLabel: "Nouveau workflow de contrat",
  },
  disciplinary_sanction: {
    title: "Signatures de Sanctions Disciplinaires",
    description:
      "Notification et signature électronique des sanctions (avertissements, blâmes, suspensions)",
    icon: Scale,
    createLabel: "Nouveau workflow de sanction",
  },
  equipment_delivery: {
    title: "Signatures Équipements (EPI)",
    description:
      "Remise et restitution des équipements de protection individuelle",
    icon: Package,
    createLabel: "Nouveau bordereau de remise",
  },
  equipment_return: {
    title: "Restitution Équipements",
    description: "Restitution des équipements de protection individuelle",
    icon: Package,
    createLabel: "Nouveau bordereau de restitution",
  },
  acknowledgment: {
    title: "Accusés de Réception Électroniques",
    description: "Accusés de réception de documents, procédures, formations",
    icon: CheckSquare,
    createLabel: "Nouvel accusé de réception",
  },
  hr_validation: {
    title: "Validation RH Interne",
    description:
      "Workflows de validation interne sécurisés (congés, frais, primes, promotions)",
    icon: FileCheck,
    createLabel: "Nouveau workflow de validation",
  },
};

export default function SignatureTypePage() {
  const [activeTab, setActiveTab] = useState<SignatureType>("contract");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] =
    useState<SignatureWorkflow | null>(null);

  const config = pageConfig[activeTab];

  // Mock data for each type
  const mockWorkflows: Record<SignatureType, SignatureWorkflow[]> = {
    contract: [
      {
        id: "1",
        type: "contract",
        title: "CDI - Marie Dupont",
        description: "Contrat à durée indéterminée",
        status: "signed",
        documents: [
          {
            id: "doc1",
            name: "CDI_Marie_Dupont.pdf",
            type: "contract",
            documentUrl: "/contracts/cdi-marie.pdf",
            signedDocumentUrl: "/contracts/cdi-marie-signed.pdf",
            createdAt: new Date("2024-12-10"),
          },
        ],
        participants: [
          {
            id: "p1",
            name: "Marie Dupont",
            email: "marie@example.com",
            role: "signer",
            status: "signed",
            signedAt: new Date("2024-12-11T10:30:00"),
          },
        ],
        initiatedBy: "hr",
        initiatedByName: "Alice Dubois",
        employeeId: "1",
        employeeName: "Marie Dupont",
        requiresEidas: true,
        signatureMethod: "eidas",
        sequentialSigning: false,
        reminderEnabled: true,
        completedAt: new Date("2024-12-11"),
        auditTrail: [],
        createdAt: new Date("2024-12-10"),
        updatedAt: new Date("2024-12-11"),
      },
    ],
    disciplinary_sanction: [
      {
        id: "2",
        type: "disciplinary_sanction",
        title: "Avertissement - Sophie Leroy",
        status: "sent",
        documents: [
          {
            id: "doc2",
            name: "Avertissement_Sophie.pdf",
            type: "disciplinary_sanction",
            documentUrl: "/sanctions/warning.pdf",
            createdAt: new Date("2024-12-19"),
          },
        ],
        participants: [
          {
            id: "p2",
            name: "Sophie Leroy",
            email: "sophie@example.com",
            role: "signer",
            status: "pending",
          },
        ],
        initiatedBy: "hr",
        initiatedByName: "Alice Dubois",
        employeeId: "3",
        employeeName: "Sophie Leroy",
        requiresEidas: true,
        signatureMethod: "eidas",
        sequentialSigning: false,
        reminderEnabled: true,
        sentAt: new Date("2024-12-19"),
        expiresAt: new Date("2024-12-26"),
        auditTrail: [],
        createdAt: new Date("2024-12-19"),
        updatedAt: new Date("2024-12-19"),
      },
    ],
    equipment_delivery: [
      {
        id: "3",
        type: "equipment_delivery",
        title: "Remise EPI - Jean Martin",
        status: "signed",
        documents: [
          {
            id: "doc3",
            name: "Bordereau_EPI_Jean.pdf",
            type: "equipment_delivery",
            documentUrl: "/equipment/epi-jean.pdf",
            signedDocumentUrl: "/equipment/epi-jean-signed.pdf",
            createdAt: new Date("2024-12-15"),
          },
        ],
        participants: [
          {
            id: "p3",
            name: "Jean Martin",
            email: "jean@example.com",
            role: "signer",
            status: "signed",
            signedAt: new Date("2024-12-15T11:00:00"),
          },
        ],
        initiatedBy: "equipment",
        initiatedByName: "Pierre Durand",
        employeeId: "2",
        employeeName: "Jean Martin",
        requiresEidas: false,
        signatureMethod: "simple",
        sequentialSigning: false,
        reminderEnabled: false,
        completedAt: new Date("2024-12-15"),
        auditTrail: [],
        createdAt: new Date("2024-12-15"),
        updatedAt: new Date("2024-12-15"),
      },
    ],
    equipment_return: [],
    acknowledgment: [],
    hr_validation: [],
  };

  const workflows = mockWorkflows[activeTab] || [];

  const createColumns = (): ColumnDef<SignatureWorkflow>[] => [
    {
      key: "id",
      label: "N°",
      render: (w: SignatureWorkflow) => (
        <div className="font-medium">#{w.id}</div>
      ),
    },
    {
      key: "title",
      label: "Titre",
      render: (w: SignatureWorkflow) => (
        <div>
          <div className="font-medium">{w.title}</div>
          {w.description && (
            <div className="text-sm text-muted-foreground">{w.description}</div>
          )}
        </div>
      ),
    },
    {
      key: "employee",
      label: "Employé",
      render: (w: SignatureWorkflow) =>
        w.employeeName ? (
          <Link
            href={`/dashboard/hr/collaborators/${w.employeeId}`}
            className="hover:underline"
          >
            {w.employeeName}
          </Link>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "participants",
      label: "Signataires",
      render: (w: SignatureWorkflow) => {
        const signed = w.participants.filter(
          (p) => p.status === "signed",
        ).length;
        const total = w.participants.length;
        return (
          <div className="text-sm">
            {signed} / {total}
          </div>
        );
      },
    },
    {
      key: "method",
      label: "Méthode",
      render: (w: SignatureWorkflow) =>
        w.requiresEidas ? (
          <Badge variant="outline" className="text-xs">
            <PenTool className="mr-1 h-3 w-3" />
            eIDAS
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Simple</span>
        ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (w: SignatureWorkflow) => w.createdAt.toLocaleDateString("fr-FR"),
    },
    {
      key: "status",
      label: "Statut",
      render: (w: SignatureWorkflow) => (
        <Badge variant={statusColors[w.status]}>{statusLabels[w.status]}</Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (w: SignatureWorkflow) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewingRequest(w);
              setIsViewModalOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {w.status === "pending" && (
            <Button
              size="sm"
              onClick={() => alert("Envoyer pour signature...")}
            >
              <Send className="mr-1 h-3 w-3" />
              Envoyer
            </Button>
          )}
        </div>
      ),
    },
  ];

  const stats = {
    total: workflows.length,
    pending: workflows.filter((w) => w.status === "pending").length,
    sent: workflows.filter((w) => w.status === "sent").length,
    signed: workflows.filter((w) => w.status === "signed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Signatures Électroniques</h1>
          <p className="text-muted-foreground">
            Gestion des workflows de signature électronique eIDAS
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => alert("Export...")} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau workflow
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as SignatureType)}
      >
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="contract">
            <FileText className="mr-2 h-4 w-4" />
            Contrats
          </TabsTrigger>
          <TabsTrigger value="disciplinary_sanction">
            <Scale className="mr-2 h-4 w-4" />
            Sanctions
          </TabsTrigger>
          <TabsTrigger value="equipment_delivery">
            <Package className="mr-2 h-4 w-4" />
            EPI Remise
          </TabsTrigger>
          <TabsTrigger value="equipment_return">
            <Package className="mr-2 h-4 w-4" />
            EPI Retour
          </TabsTrigger>
          <TabsTrigger value="acknowledgment">
            <CheckSquare className="mr-2 h-4 w-4" />
            Accusés
          </TabsTrigger>
          <TabsTrigger value="hr_validation">
            <FileCheck className="mr-2 h-4 w-4" />
            Validations
          </TabsTrigger>
        </TabsList>

        {Object.keys(pageConfig).map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(config.icon, { className: "h-5 w-5" })}
                  {config.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </CardHeader>
            </Card>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <PenTool className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    En attente
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Envoyées
                  </CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.sent}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Signées</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.signed}</div>
                </CardContent>
              </Card>
            </div>

            {/* Workflows Table */}
            <Card>
              <CardHeader>
                <CardTitle>Workflows ({workflows.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {workflows.length > 0 ? (
                  <DataTable
                    onRowClick={(w) => {
                      setViewingRequest(w);
                      setIsViewModalOpen(true);
                    }}
                    columns={createColumns()}
                    data={workflows}
                  />
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    Aucun workflow de signature pour cette catégorie
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={config.createLabel}
        size="lg"
        actions={{
          primary: {
            label: "Créer le workflow",
            onClick: () => {
              setIsCreateModalOpen(false);
              alert("Workflow créé!");
            },
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
            <Label>Employé *</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {mockEmployees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Titre du workflow *</Label>
            <Input placeholder="Ex: CDI - Marie Dupont" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={3} placeholder="Description optionnelle..." />
          </div>
          <div>
            <Label>Méthode de signature *</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eidas">
                  eIDAS (Signature qualifiée européenne)
                </SelectItem>
                <SelectItem value="advanced">Signature avancée</SelectItem>
                <SelectItem value="simple">
                  Signature électronique simple
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails du workflow"
        size="lg"
      >
        {viewingRequest && (
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Titre</Label>
              <p className="font-medium">{viewingRequest.title}</p>
            </div>
            {viewingRequest.description && (
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm">{viewingRequest.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Statut</Label>
                <Badge variant={statusColors[viewingRequest.status]}>
                  {statusLabels[viewingRequest.status]}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Méthode</Label>
                <p>{viewingRequest.requiresEidas ? "eIDAS" : "Simple"}</p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Signataires</Label>
              <div className="mt-2 space-y-2">
                {viewingRequest.participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.email}</p>
                    </div>
                    <Badge
                      variant={p.status === "signed" ? "secondary" : "default"}
                    >
                      {p.status === "signed" ? "Signé" : "En attente"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
