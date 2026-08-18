"use client";

import { useState } from "react";
import { useEmployeeOptions } from "@/hooks/employees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { IbanInput } from "@/components/ui/IbanInput";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import {
  Plus,
  CreditCard,
  MapPin,
  Heart,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Upload,
  FileText,
  Clock,
} from "lucide-react";
import {
  PersonalInfoChangeRequest,
  HRRequestStatus,
  Employee,
} from "@/lib/types";
import Link from "next/link";

// Mock data - Bank Details Changes
const mockBankDetailsRequests: PersonalInfoChangeRequest[] = [];

// Mock data - Address Changes
const mockAddressRequests: PersonalInfoChangeRequest[] = [];

// Mock data - Civil Status Changes
const mockCivilStatusRequests: PersonalInfoChangeRequest[] = [];

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

const civilStatusLabels: Record<Employee["civilStatus"], string> = {
  single: "Célibataire",
  married: "Marié(e)",
  divorced: "Divorcé(e)",
  widowed: "Veuf/Veuve",
  "civil-union": "Pacsé(e)",
};

export default function PersonalInfoChangePage() {
  const mockEmployees = useEmployeeOptions();
  const [activeTab, setActiveTab] = useState("bank_details");
  const [bankDetailsRequests, setBankDetailsRequests] = useState(
    mockBankDetailsRequests,
  );
  const [addressRequests, setAddressRequests] = useState(mockAddressRequests);
  const [civilStatusRequests, setCivilStatusRequests] = useState(
    mockCivilStatusRequests,
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] =
    useState<PersonalInfoChangeRequest | null>(null);

  const [formData, setFormData] = useState({
    employeeId: "",
    // Bank details
    newIban: "",
    newBic: "",
    newBankName: "",
    // Address
    newStreet: "",
    newCity: "",
    newPostalCode: "",
    newCountry: "France",
    // Civil status
    newCivilStatus: "single" as Employee["civilStatus"],
    effectiveDate: "",
  });

  const handleCreateRequest = () => {
    setFormData({
      employeeId: "",
      newIban: "",
      newBic: "",
      newBankName: "",
      newStreet: "",
      newCity: "",
      newPostalCode: "",
      newCountry: "France",
      newCivilStatus: "single",
      effectiveDate: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleValidate = (request: PersonalInfoChangeRequest) => {
    const updateRequests = (
      prevRequests: PersonalInfoChangeRequest[],
    ): PersonalInfoChangeRequest[] =>
      prevRequests.map((r) =>
        r.id === request.id
          ? {
              ...r,
              status: "validated",
              processedAt: new Date(),
              processedBy: "current-user",
              processedByName: "Utilisateur actuel",
              appliedToSystem: true,
              appliedAt: new Date(),
              updatedAt: new Date(),
            }
          : r,
      );

    if (request.changeType === "bank_details") {
      setBankDetailsRequests(updateRequests);
    } else if (request.changeType === "address") {
      setAddressRequests(updateRequests);
    } else {
      setCivilStatusRequests(updateRequests);
    }

    alert("Demande validée et appliquée au système!");
  };

  const handleRefuse = (request: PersonalInfoChangeRequest) => {
    const reason = prompt("Motif du refus:");
    if (!reason) return;

    const updateRequests = (
      prevRequests: PersonalInfoChangeRequest[],
    ): PersonalInfoChangeRequest[] =>
      prevRequests.map((r) =>
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
      );

    if (request.changeType === "bank_details") {
      setBankDetailsRequests(updateRequests);
    } else if (request.changeType === "address") {
      setAddressRequests(updateRequests);
    } else {
      setCivilStatusRequests(updateRequests);
    }

    alert("Demande refusée");
  };

  const handleSave = () => {
    const employee = mockEmployees.find((e) => e.id === formData.employeeId);
    if (!employee) {
      alert("Veuillez sélectionner un employé");
      return;
    }

    const baseRequest = {
      employeeId: formData.employeeId,
      employeeName: employee.name,
      employeeNumber: `EMP-${formData.employeeId.padStart(3, "0")}`,
      department: employee.department ?? "",
      status: "pending" as HRRequestStatus,
      submittedAt: new Date(),
      approvalRequired: true,
      appliedToSystem: false,
      priority: "normal" as const,
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (activeTab === "bank_details") {
      const newRequest: PersonalInfoChangeRequest = {
        ...baseRequest,
        id: Date.now().toString(),
        type: "bank_details",
        changeType: "bank_details",
        currentBankDetails: {
          iban: "FR76 XXXX XXXX XXXX XXXX XXXX XXX",
          bic: "XXXXXXXX",
          bankName: "Ancienne Banque",
        },
        newBankDetails: {
          iban: formData.newIban,
          bic: formData.newBic,
          bankName: formData.newBankName,
        },
      };
      setBankDetailsRequests([newRequest, ...bankDetailsRequests]);
    } else if (activeTab === "address") {
      const newRequest: PersonalInfoChangeRequest = {
        ...baseRequest,
        id: Date.now().toString(),
        type: "address",
        changeType: "address",
        currentAddress: {
          street: "Ancienne adresse",
          city: "Paris",
          postalCode: "75000",
          country: "France",
        },
        newAddress: {
          street: formData.newStreet,
          city: formData.newCity,
          postalCode: formData.newPostalCode,
          country: formData.newCountry,
        },
      };
      setAddressRequests([newRequest, ...addressRequests]);
    } else {
      const newRequest: PersonalInfoChangeRequest = {
        ...baseRequest,
        id: Date.now().toString(),
        type: "civil_status",
        changeType: "civil_status",
        currentCivilStatus: "single",
        newCivilStatus: formData.newCivilStatus,
        effectiveDate: formData.effectiveDate
          ? new Date(formData.effectiveDate)
          : undefined,
      };
      setCivilStatusRequests([newRequest, ...civilStatusRequests]);
    }

    setIsCreateModalOpen(false);
    alert("Demande créée avec succès!");
  };

  const createColumns = (
    changeType: string,
  ): ColumnDef<PersonalInfoChangeRequest>[] => [
    {
      key: "id",
      label: "N° Demande",
      render: (req: PersonalInfoChangeRequest) => (
        <div className="font-medium">#{req.id}</div>
      ),
    },
    {
      key: "employeeName",
      label: "Employé",
      render: (req: PersonalInfoChangeRequest) => (
        <Link
          href={`/dashboard/hr/collaborators/${req.employeeId}`}
          className="hover:underline"
        >
          <div className="font-medium">{req.employeeName}</div>
          <div className="text-sm text-muted-foreground">{req.department}</div>
        </Link>
      ),
    },
    {
      key: "details",
      label: "Détails du changement",
      render: (req: PersonalInfoChangeRequest) => {
        if (changeType === "bank_details") {
          return (
            <div className="text-sm">
              <div>Nouvelle banque: {req.newBankDetails?.bankName}</div>
              <div className="text-muted-foreground">
                {req.newBankDetails?.iban.substring(0, 20)}...
              </div>
            </div>
          );
        } else if (changeType === "address") {
          return (
            <div className="text-sm">
              <div>{req.newAddress?.street}</div>
              <div className="text-muted-foreground">
                {req.newAddress?.postalCode} {req.newAddress?.city}
              </div>
            </div>
          );
        } else {
          return (
            <div className="text-sm">
              {req.currentCivilStatus &&
                civilStatusLabels[req.currentCivilStatus]}{" "}
              → {req.newCivilStatus && civilStatusLabels[req.newCivilStatus]}
            </div>
          );
        }
      },
    },
    {
      key: "submittedAt",
      label: "Date de soumission",
      render: (req: PersonalInfoChangeRequest) =>
        req.submittedAt.toLocaleDateString("fr-FR"),
    },
    {
      key: "status",
      label: "Statut",
      render: (req: PersonalInfoChangeRequest) => (
        <Badge variant={statusColors[req.status]}>
          {statusLabels[req.status]}
        </Badge>
      ),
    },
    {
      key: "appliedToSystem",
      label: "Appliqué",
      render: (req: PersonalInfoChangeRequest) =>
        req.appliedToSystem ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (req: PersonalInfoChangeRequest) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setViewingRequest(req);
              setIsViewModalOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {req.status === "pending" && (
            <>
              <Button size="sm" onClick={() => handleValidate(req)}>
                <CheckCircle className="mr-1 h-3 w-3" />
                Valider
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRefuse(req)}
              >
                <XCircle className="mr-1 h-3 w-3" />
                Refuser
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const bankDetailsStats = {
    total: bankDetailsRequests.length,
    pending: bankDetailsRequests.filter((r) => r.status === "pending").length,
    validated: bankDetailsRequests.filter((r) => r.status === "validated")
      .length,
  };

  const addressStats = {
    total: addressRequests.length,
    pending: addressRequests.filter((r) => r.status === "pending").length,
    validated: addressRequests.filter((r) => r.status === "validated").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Changements d&apos;Informations Personnelles
          </h1>
          <p className="text-muted-foreground">
            Gestion des demandes de modification de coordonnées bancaires,
            adresse et statut civil
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => alert("Export PDF...")} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button onClick={handleCreateRequest}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle demande
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bank_details">
            <CreditCard className="mr-2 h-4 w-4" />
            Coordonnées Bancaires
          </TabsTrigger>
          <TabsTrigger value="address">
            <MapPin className="mr-2 h-4 w-4" />
            Adresse
          </TabsTrigger>
          <TabsTrigger value="civil_status">
            <Heart className="mr-2 h-4 w-4" />
            Statut Civil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bank_details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bankDetailsStats.total}
                </div>
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
                <div className="text-2xl font-bold">
                  {bankDetailsStats.pending}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Validées</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bankDetailsStats.validated}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>
                Demandes de changement de coordonnées bancaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={createColumns("bank_details")}
                data={bankDetailsRequests}
                onRowClick={(req: PersonalInfoChangeRequest) => {
                  setViewingRequest(req);
                  setIsViewModalOpen(true);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{addressStats.total}</div>
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
                <div className="text-2xl font-bold">{addressStats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Validées</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {addressStats.validated}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Demandes de changement d&apos;adresse</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={createColumns("address")}
                data={addressRequests}
                onRowClick={(req: PersonalInfoChangeRequest) => {
                  setViewingRequest(req);
                  setIsViewModalOpen(true);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="civil_status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de changement de statut civil</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={createColumns("civil_status")}
                data={civilStatusRequests}
                onRowClick={(req: PersonalInfoChangeRequest) => {
                  setViewingRequest(req);
                  setIsViewModalOpen(true);
                }}
              />
              {civilStatusRequests.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  Aucune demande de changement de statut civil
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title={`Nouvelle demande de changement${
          activeTab === "bank_details"
            ? " de coordonnées bancaires"
            : activeTab === "address"
              ? " d&apos;adresse"
              : " de statut civil"
        }`}
        size="lg"
        actions={{
          primary: { label: "Enregistrer", onClick: handleSave },
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
            <Select
              value={formData.employeeId}
              onValueChange={(v) => setFormData({ ...formData, employeeId: v })}
            >
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

          {activeTab === "bank_details" && (
            <>
              <IbanInput
                ibanValue={formData.newIban}
                bicValue={formData.newBic}
                bankNameValue={formData.newBankName}
                onIbanChange={(value) =>
                  setFormData({ ...formData, newIban: value })
                }
                onBicChange={(value) =>
                  setFormData({ ...formData, newBic: value })
                }
                onBankNameChange={(value) =>
                  setFormData({ ...formData, newBankName: value })
                }
                required
              />
              <div>
                <Label>RIB (document justificatif)</Label>
                <Button variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Joindre le RIB
                </Button>
              </div>
            </>
          )}

          {activeTab === "address" && (
            <>
              <div>
                <Label>Rue *</Label>
                <Input
                  value={formData.newStreet}
                  onChange={(e) =>
                    setFormData({ ...formData, newStreet: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Code postal *</Label>
                  <Input
                    value={formData.newPostalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        newPostalCode: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Ville *</Label>
                  <Input
                    value={formData.newCity}
                    onChange={(e) =>
                      setFormData({ ...formData, newCity: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Pays *</Label>
                <Input
                  value={formData.newCountry}
                  onChange={(e) =>
                    setFormData({ ...formData, newCountry: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Justificatif de domicile</Label>
                <Button variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Joindre un justificatif
                </Button>
              </div>
            </>
          )}

          {activeTab === "civil_status" && (
            <>
              <div>
                <Label>Nouveau statut civil *</Label>
                <Select
                  value={formData.newCivilStatus}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      newCivilStatus: v as Employee["civilStatus"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(civilStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date d&apos;effet</Label>
                <Input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) =>
                    setFormData({ ...formData, effectiveDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Document justificatif</Label>
                <Button variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Joindre un document
                </Button>
              </div>
            </>
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
                <p className="font-medium">{viewingRequest.employeeName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Statut</Label>
                <Badge variant={statusColors[viewingRequest.status]}>
                  {statusLabels[viewingRequest.status]}
                </Badge>
              </div>
            </div>

            {viewingRequest.changeType === "bank_details" &&
              viewingRequest.newBankDetails && (
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    Nouvelles coordonnées bancaires
                  </h3>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div>
                      <Label className="text-muted-foreground">Banque</Label>
                      <p>{viewingRequest.newBankDetails.bankName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">IBAN</Label>
                      <p className="font-mono text-sm">
                        {viewingRequest.newBankDetails.iban}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">BIC</Label>
                      <p className="font-mono text-sm">
                        {viewingRequest.newBankDetails.bic}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {viewingRequest.changeType === "address" &&
              viewingRequest.newAddress && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Nouvelle adresse</h3>
                  <div className="rounded-lg border p-4">
                    <p>{viewingRequest.newAddress.street}</p>
                    <p>
                      {viewingRequest.newAddress.postalCode}{" "}
                      {viewingRequest.newAddress.city}
                    </p>
                    <p>{viewingRequest.newAddress.country}</p>
                  </div>
                </div>
              )}

            <div>
              <Label className="text-muted-foreground">
                Date de soumission
              </Label>
              <p>{viewingRequest.submittedAt.toLocaleDateString("fr-FR")}</p>
            </div>

            {viewingRequest.processedAt && (
              <div>
                <Label className="text-muted-foreground">Traité par</Label>
                <p>
                  {viewingRequest.processedByName} le{" "}
                  {viewingRequest.processedAt.toLocaleDateString("fr-FR")}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
