"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Radio,
  Key,
  Shield,
  Car,
  FileSignature,
  UserCheck,
  UserX,
  Gift,
  Briefcase,
  Fuel,
  Utensils,
  Calendar,
  Archive,
} from "lucide-react";
import type { Employee, Equipment } from "@/lib/types";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";

interface EmployeeAvantageTabProps {
  employee: Employee;
}

export function EmployeeAvantageTab({ employee }: EmployeeAvantageTabProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([
    {
      id: "6",
      name: "Chèque Vacances 2024",
      type: "VACATION_VOUCHER",
      description: "Chèque Vacances annuel",
      assignedAt: new Date("2024-01-01"),
      assignedBy: "admin@safyr.com",
      issuanceSignature: {
        signedAt: new Date("2024-01-01T09:00:00"),
        signedBy: "Jean Dupont",
        signatureData: "base64_signature_data",
      },
      condition: "good",
      status: "assigned",
    },
    {
      id: "7",
      name: "Carte Cadeau Noël",
      type: "GIFT_CARD",
      description: "Carte cadeau de fin d'année",
      assignedAt: new Date("2023-12-20"),
      assignedBy: "admin@safyr.com",
      issuanceSignature: {
        signedAt: new Date("2023-12-20T10:00:00"),
        signedBy: "Jean Dupont",
        signatureData: "base64_signature_data",
      },
      condition: "good",
      status: "assigned",
    },
    {
      id: "8",
      name: "CESU Services",
      type: "CESU",
      description: "Chèque Emploi Service Universel",
      assignedAt: new Date("2024-01-15"),
      assignedBy: "admin@safyr.com",
      issuanceSignature: {
        signedAt: new Date("2024-01-15T11:00:00"),
        signedBy: "Jean Dupont",
        signatureData: "base64_signature_data",
      },
      condition: "good",
      status: "assigned",
    },
    {
      id: "9",
      name: "Carte Carburant",
      type: "FUEL_CARD",
      serialNumber: "FUEL-2024-001",
      description: "Carte carburant professionnelle",
      quantity: 200,
      consumable: true,
      assignedAt: new Date("2024-02-01"),
      assignedBy: "admin@safyr.com",
      issuanceSignature: {
        signedAt: new Date("2024-02-01T14:00:00"),
        signedBy: "Jean Dupont",
        signatureData: "base64_signature_data",
      },
      condition: "good",
      status: "assigned",
    },
    {
      id: "10",
      name: "Titre Restaurant",
      type: "MEAL_VOUCHER",
      description: "Titre restaurant mensuel",
      quantity: 20,
      consumable: true,
      assignedAt: new Date("2024-01-01"),
      assignedBy: "admin@safyr.com",
      issuanceSignature: {
        signedAt: new Date("2024-01-01T09:30:00"),
        signedBy: "Jean Dupont",
        signatureData: "base64_signature_data",
      },
      condition: "good",
      status: "assigned",
    },
    {
      id: "11",
      name: "Carte Carburant 2023",
      type: "FUEL_CARD",
      serialNumber: "FUEL-2023-001",
      description: "Carte carburant professionnelle - épuisée",
      quantity: 0,
      consumable: true,
      assignedAt: new Date("2023-01-01"),
      assignedBy: "admin@safyr.com",
      returnedAt: new Date("2023-12-31"),
      returnedBy: "admin@safyr.com",
      issuanceSignature: {
        signedAt: new Date("2023-01-01T09:00:00"),
        signedBy: "Jean Dupont",
        signatureData: "base64_signature_data",
      },
      returnSignature: {
        signedAt: new Date("2023-12-31T17:00:00"),
        signedBy: "Jean Dupont",
        signatureData: "base64_signature_data",
      },
      condition: "good",
      status: "exhausted",
      notes: "Carte épuisée fin 2023",
    },
  ]);

  // Available avantage pool (mock data)
  const [availableEquipment] = useState<Equipment[]>([
    {
      id: "15",
      name: "Chèque Vacances 2024",
      type: "VACATION_VOUCHER",
      description: "Chèque Vacances annuel - disponible",
      assignedAt: new Date("2024-01-01"), // Placeholder for available equipment
      assignedBy: "system", // Placeholder
      condition: "new",
      status: "assigned", // This would be "available" in real app
    },
    {
      id: "16",
      name: "Carte Cadeau",
      type: "GIFT_CARD",
      description: "Carte cadeau - disponible",
      assignedAt: new Date("2024-01-01"), // Placeholder for available equipment
      assignedBy: "system", // Placeholder
      condition: "new",
      status: "assigned", // This would be "available" in real app
    },
    {
      id: "17",
      name: "CESU Services",
      type: "CESU",
      description: "Chèque Emploi Service Universel - disponible",
      assignedAt: new Date("2024-01-01"), // Placeholder for available equipment
      assignedBy: "system", // Placeholder
      condition: "new",
      status: "assigned", // This would be "available" in real app
    },
    {
      id: "18",
      name: "Carte Carburant",
      type: "FUEL_CARD",
      serialNumber: "FUEL-2024-002",
      description: "Carte carburant professionnelle - disponible",
      quantity: 300,
      consumable: true,
      assignedAt: new Date("2024-01-01"), // Placeholder for available equipment
      assignedBy: "system", // Placeholder
      condition: "new",
      status: "assigned", // This would be "available" in real app
    },
    {
      id: "19",
      name: "Titre Restaurant",
      type: "MEAL_VOUCHER",
      description: "Titre restaurant mensuel - disponible",
      quantity: 22,
      consumable: true,
      assignedAt: new Date("2024-01-01"), // Placeholder for available equipment
      assignedBy: "system", // Placeholder
      condition: "new",
      status: "assigned", // This would be "available" in real app
    },
  ]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showExhaustModal, setShowExhaustModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [returnEquipmentId, setReturnEquipmentId] = useState<string>("");
  const [exhaustEquipmentId, setExhaustEquipmentId] = useState<string>("");
  const [detailsEquipmentId, setDetailsEquipmentId] = useState<string>("");
  const [returnCondition, setReturnCondition] =
    useState<Equipment["condition"]>("good");
  const [returnNotes, setReturnNotes] = useState<string>("");
  const [newEquipmentData, setNewEquipmentData] = useState({
    name: "",
    type: "VACATION_VOUCHER" as Equipment["type"],
    description: "",
    serialNumber: "",
    quantity: 1,
    consumable: false,
  });

  const getEquipmentIcon = (type: Equipment["type"]) => {
    const icons = {
      PPE: Shield,
      RADIO: Radio,
      KEYS: Key,
      UNIFORM: Package,
      BADGE: FileSignature,
      VEHICLE: Car,
      VACATION_VOUCHER: Calendar,
      GIFT_CARD: Gift,
      CESU: Briefcase,
      FUEL_CARD: Fuel,
      MEAL_VOUCHER: Utensils,
      OTHER: Package,
    };
    return icons[type] || Package;
  };

  const getEquipmentTypeLabel = (type: Equipment["type"]) => {
    const labels = {
      PPE: "EPI",
      RADIO: "Radio",
      KEYS: "Clés",
      UNIFORM: "Uniforme",
      BADGE: "Badge",
      VEHICLE: "Véhicule",
      VACATION_VOUCHER: "Chèque Vacances",
      GIFT_CARD: "Carte Cadeau",
      CESU: "CESU",
      FUEL_CARD: "Carte Carburant",
      MEAL_VOUCHER: "Titre Restaurant",
      OTHER: "Autre",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: Equipment["status"]) => {
    const config = {
      assigned: {
        variant: "default" as const,
        label: "Assigné",
        icon: CheckCircle,
        color: "text-green-600",
      },
      returned: {
        variant: "secondary" as const,
        label: "Retourné",
        icon: CheckCircle,
        color: "text-blue-600",
      },
      exhausted: {
        variant: "secondary" as const,
        label: "Épuisé",
        icon: Archive,
        color: "text-purple-600",
      },
      lost: {
        variant: "destructive" as const,
        label: "Perdu",
        icon: XCircle,
        color: "text-red-600",
      },
      damaged: {
        variant: "destructive" as const,
        label: "Endommagé",
        icon: AlertCircle,
        color: "text-orange-600",
      },
    };
    return config[status];
  };

  const getConditionLabel = (condition: Equipment["condition"]) => {
    const labels = {
      new: "Neuf",
      good: "Bon état",
      fair: "État moyen",
      poor: "Mauvais état",
      damaged: "Endommagé",
    };
    return labels[condition] || condition;
  };

  const assignedEquipment = equipment.filter((eq) => eq.status === "assigned");
  const returnedEquipment = equipment.filter(
    (eq) => eq.status === "returned" || eq.status === "exhausted",
  );

  const handleAssignEquipment = () => {
    if (!selectedEquipmentId) return;

    let equipmentToAssign: Equipment;

    if (selectedEquipmentId === "add-new") {
      // Create new avantage
      equipmentToAssign = {
        id: `AV-${Date.now()}`,
        name: newEquipmentData.name,
        type: newEquipmentData.type,
        description: newEquipmentData.description,
        serialNumber: newEquipmentData.serialNumber || undefined,
        quantity: newEquipmentData.consumable
          ? newEquipmentData.quantity
          : undefined,
        consumable: newEquipmentData.consumable,
        assignedAt: new Date(),
        assignedBy: "admin@safyr.com", // In real app, get from current user
        condition: "new",
        status: "assigned",
        issuanceSignature: {
          signedAt: new Date(),
          signedBy: `${employee.firstName} ${employee.lastName}`,
          signatureData: "simulated_signature", // In real app, get actual signature
          ipAddress: "192.168.1.100",
        },
      };
    } else {
      const found = availableEquipment.find(
        (eq) => eq.id === selectedEquipmentId,
      );
      if (!found) return;
      equipmentToAssign = {
        ...found,
        assignedAt: new Date(),
        assignedBy: "admin@safyr.com", // In real app, get from current user
        status: "assigned",
        issuanceSignature: {
          signedAt: new Date(),
          signedBy: `${employee.firstName} ${employee.lastName}`,
          signatureData: "simulated_signature", // In real app, get actual signature
          ipAddress: "192.168.1.100",
        },
      };
    }

    setEquipment((prev) => [...prev, equipmentToAssign]);
    setShowAssignModal(false);
    setSelectedEquipmentId("");
    setNewEquipmentData({
      name: "",
      type: "VACATION_VOUCHER",
      description: "",
      serialNumber: "",
      quantity: 1,
      consumable: false,
    });
  };

  const handleReturnEquipment = () => {
    if (!returnEquipmentId) return;

    setEquipment((prev) =>
      prev.map((eq) => {
        if (eq.id === returnEquipmentId) {
          return {
            ...eq,
            returnedAt: new Date(),
            returnedBy: "admin@safyr.com", // In real app, get from current user
            status: "returned",
            condition: returnCondition,
            notes: returnNotes || eq.notes,
            returnSignature: {
              signedAt: new Date(),
              signedBy: `${employee.firstName} ${employee.lastName}`,
              signatureData: "simulated_signature", // In real app, get actual signature
            },
          };
        }
        return eq;
      }),
    );

    setShowReturnModal(false);
    setReturnEquipmentId("");
    setReturnCondition("good");
    setReturnNotes("");
  };

  const handleExhaustEquipment = () => {
    if (!exhaustEquipmentId) return;

    setEquipment((prev) =>
      prev.map((eq) => {
        if (eq.id === exhaustEquipmentId) {
          return {
            ...eq,
            returnedAt: new Date(),
            returnedBy: "admin@safyr.com", // In real app, get from current user
            status: "exhausted",
            condition: "good",
            notes: returnNotes || eq.notes,
            returnSignature: {
              signedAt: new Date(),
              signedBy: `${employee.firstName} ${employee.lastName}`,
              signatureData: "simulated_signature", // In real app, get actual signature
            },
          };
        }
        return eq;
      }),
    );

    setShowExhaustModal(false);
    setExhaustEquipmentId("");
    setReturnNotes("");
  };

  const equipmentColumns: ColumnDef<Equipment>[] = [
    {
      key: "icon",
      label: "",
      render: (item) => {
        const Icon = getEquipmentIcon(item.type);
        return (
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        );
      },
    },
    {
      key: "name",
      label: "Équipement",
      sortable: true,
      render: (item) => {
        const statusConfig = getStatusBadge(item.status);
        const StatusIcon = statusConfig.icon;
        return (
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="font-semibold truncate">{item.name}</span>
              <Badge variant={statusConfig.variant} className="shrink-0">
                <StatusIcon className="mr-1 h-3 w-3" />
                {statusConfig.label}
              </Badge>
            </div>
            {item.serialNumber && (
              <p className="text-sm text-muted-foreground truncate">
                N° série: {item.serialNumber}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (item) => (
        <Badge variant="outline" className="shrink-0">
          {getEquipmentTypeLabel(item.type)}
        </Badge>
      ),
    },
    {
      key: "quantity",
      label: "Quantité",
      sortable: true,
      render: (item) => (
        <span className="text-sm">
          {item.quantity !== undefined ? item.quantity : "-"}
        </span>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (item) => (
        <span className="text-sm text-muted-foreground truncate block max-w-xs">
          {item.description || "-"}
        </span>
      ),
    },
    {
      key: "assignedAt",
      label: "Date d'assignation",
      sortable: true,
      render: (item) => (
        <span className="text-sm">
          {item.assignedAt.toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      key: "condition",
      label: "État",
      sortable: true,
      render: (item) => (
        <div className="space-y-1">
          <span className="text-sm">{getConditionLabel(item.condition)}</span>
          {item.issuanceSignature && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileSignature className="h-3 w-3" />
              Signé
            </div>
          )}
        </div>
      ),
    },
  ];

  const returnedEquipmentColumns: ColumnDef<Equipment>[] = [
    {
      key: "icon",
      label: "",
      render: (item) => {
        const Icon = getEquipmentIcon(item.type);
        return (
          <div className="p-2 bg-muted rounded-lg">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        );
      },
    },
    {
      key: "name",
      label: "Équipement",
      sortable: true,
      render: (item) => {
        const statusConfig = getStatusBadge(item.status);
        const StatusIcon = statusConfig.icon;
        return (
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-semibold truncate">{item.name}</span>
            <Badge variant={statusConfig.variant} className="shrink-0">
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (item) => (
        <Badge variant="outline" className="shrink-0">
          {getEquipmentTypeLabel(item.type)}
        </Badge>
      ),
    },
    {
      key: "quantity",
      label: "Quantité",
      sortable: true,
      render: (item) => (
        <span className="text-sm">
          {item.quantity !== undefined ? item.quantity : "-"}
        </span>
      ),
    },
    {
      key: "assignedAt",
      label: "Période",
      render: (item) => (
        <div className="text-xs text-muted-foreground">
          {item.assignedAt.toLocaleDateString("fr-FR")} →{" "}
          {item.returnedAt?.toLocaleDateString("fr-FR")}
        </div>
      ),
    },
    {
      key: "returnSignature",
      label: "Retour",
      render: (item) => (
        <>
          {item.returnSignature && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileSignature className="h-3 w-3" />
              Retour signé
            </div>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Avantage Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Avantages assignés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedEquipment.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total historique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{equipment.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {equipment.filter((eq) => eq.issuanceSignature).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Avantages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Avantages actuellement assignés</CardTitle>
          <Button onClick={() => setShowAssignModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Assigner avantage
          </Button>
        </CardHeader>
        <CardContent>
          {assignedEquipment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun équipement assigné
            </div>
          ) : (
            <DataTable
              data={assignedEquipment}
              columns={equipmentColumns}
              searchKeys={[
                "name",
                "serialNumber",
                "description",
                "type",
                "quantity",
              ]}
              searchPlaceholder="Rechercher un équipement..."
              itemsPerPage={10}
              filters={[
                {
                  key: "type",
                  label: "Type",
                  options: [
                    { value: "all", label: "Tous" },
                    { value: "VACATION_VOUCHER", label: "Chèque Vacances" },
                    { value: "GIFT_CARD", label: "Carte Cadeau" },
                    { value: "CESU", label: "CESU" },
                    { value: "FUEL_CARD", label: "Carte Carburant" },
                    { value: "MEAL_VOUCHER", label: "Titre Restaurant" },
                  ],
                },
                {
                  key: "condition",
                  label: "État",
                  options: [
                    { value: "all", label: "Tous" },
                    { value: "new", label: "Neuf" },
                    { value: "good", label: "Bon état" },
                    { value: "fair", label: "État moyen" },
                    { value: "poor", label: "Mauvais état" },
                    { value: "damaged", label: "Endommagé" },
                  ],
                },
              ]}
              actions={(item) => (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDetailsEquipmentId(item.id);
                      setShowDetailsModal(true);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4 text-green-600" />
                    Détails
                  </Button>
                  {item.consumable ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExhaustEquipmentId(item.id);
                        setShowExhaustModal(true);
                      }}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Épuiser
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReturnEquipmentId(item.id);
                        setShowReturnModal(true);
                      }}
                    >
                      <FileSignature className="mr-2 h-4 w-4" />
                      Retour
                    </Button>
                  )}
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Returned Avantages History */}
      {returnedEquipment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des avantages retournés</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={returnedEquipment}
              columns={returnedEquipmentColumns}
              searchKeys={["name", "serialNumber", "type", "quantity"]}
              searchPlaceholder="Rechercher dans l'historique..."
              itemsPerPage={10}
              actions={() => (
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            />
          </CardContent>
        </Card>
      )}

      {/* Digital Signature Info */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <FileSignature className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Signature électronique des avantages
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Chaque attribution et retour d&apos;avantage est signé
                numériquement par l&apos;employé. Les signatures sont horodatées
                et sécurisées pour garantir la traçabilité complète.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assign Equipment Modal */}
      <Modal
        open={showAssignModal}
        onOpenChange={setShowAssignModal}
        type="form"
        title="Assigner un avantage"
        description={`Sélectionnez un avantage à assigner à ${employee.firstName} ${employee.lastName}`}
        actions={{
          primary: {
            label: "Assigner",
            onClick: handleAssignEquipment,
            disabled:
              !selectedEquipmentId ||
              (selectedEquipmentId === "add-new" && !newEquipmentData.name),
            icon: <UserCheck className="h-4 w-4" />,
          },
          secondary: {
            label: "Annuler",
            onClick: () => {
              setShowAssignModal(false);
              setSelectedEquipmentId("");
              setNewEquipmentData({
                name: "",
                type: "VACATION_VOUCHER",
                description: "",
                serialNumber: "",
                quantity: 1,
                consumable: false,
              });
            },
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="equipment-select">Avantage disponible</Label>
            <Select
              value={selectedEquipmentId}
              onValueChange={setSelectedEquipmentId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez un avantage..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add-new">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">
                      Ajouter un nouvel avantage
                    </span>
                  </div>
                </SelectItem>
                {availableEquipment.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{eq.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {getEquipmentTypeLabel(eq.type)}
                      </Badge>
                      {eq.serialNumber && (
                        <span className="text-xs text-muted-foreground">
                          ({eq.serialNumber})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedEquipmentId === "add-new" && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Nouvel avantage</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-name">
                    Nom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="new-name"
                    value={newEquipmentData.name}
                    onChange={(e) =>
                      setNewEquipmentData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Nom de l'avantage"
                  />
                </div>
                <div>
                  <Label htmlFor="new-type">Type</Label>
                  <Select
                    value={newEquipmentData.type}
                    onValueChange={(value: Equipment["type"]) =>
                      setNewEquipmentData((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VACATION_VOUCHER">
                        Chèque Vacances
                      </SelectItem>
                      <SelectItem value="GIFT_CARD">Carte Cadeau</SelectItem>
                      <SelectItem value="CESU">CESU</SelectItem>
                      <SelectItem value="FUEL_CARD">Carte Carburant</SelectItem>
                      <SelectItem value="MEAL_VOUCHER">
                        Titre Restaurant
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="new-description">Description</Label>
                  <Input
                    id="new-description"
                    value={newEquipmentData.description}
                    onChange={(e) =>
                      setNewEquipmentData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description de l'avantage"
                  />
                </div>
                <div>
                  <Label htmlFor="new-serial">N° série</Label>
                  <Input
                    id="new-serial"
                    value={newEquipmentData.serialNumber}
                    onChange={(e) =>
                      setNewEquipmentData((prev) => ({
                        ...prev,
                        serialNumber: e.target.value,
                      }))
                    }
                    placeholder="Numéro de série"
                  />
                </div>
                <div>
                  <Label htmlFor="new-consumable">Consommable</Label>
                  <Select
                    value={newEquipmentData.consumable ? "true" : "false"}
                    onValueChange={(value) =>
                      setNewEquipmentData((prev) => ({
                        ...prev,
                        consumable: value === "true",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Non</SelectItem>
                      <SelectItem value="true">Oui</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newEquipmentData.consumable && (
                  <div>
                    <Label htmlFor="new-quantity">Quantité</Label>
                    <Input
                      id="new-quantity"
                      type="number"
                      min="1"
                      value={newEquipmentData.quantity}
                      onChange={(e) =>
                        setNewEquipmentData((prev) => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 1,
                        }))
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedEquipmentId && selectedEquipmentId !== "add-new" && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Détails de l&apos;avantage</h4>
              {(() => {
                const eq = availableEquipment.find(
                  (e) => e.id === selectedEquipmentId,
                );
                return eq ? (
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Nom:</strong> {eq.name}
                    </p>
                    <p>
                      <strong>Type:</strong> {getEquipmentTypeLabel(eq.type)}
                    </p>
                    <p>
                      <strong>État:</strong> {getConditionLabel(eq.condition)}
                    </p>
                    {eq.description && (
                      <p>
                        <strong>Description:</strong> {eq.description}
                      </p>
                    )}
                    {eq.serialNumber && (
                      <p>
                        <strong>N° série:</strong> {eq.serialNumber}
                      </p>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      </Modal>

      {/* Return Equipment Modal */}
      <Modal
        open={showReturnModal}
        onOpenChange={setShowReturnModal}
        type="form"
        title="Retour d'avantage"
        description="Confirmer le retour de l'avantage et son état"
        actions={{
          primary: {
            label: "Confirmer le retour",
            onClick: handleReturnEquipment,
            variant: "destructive",
            icon: <UserX className="h-4 w-4" />,
          },
          secondary: {
            label: "Annuler",
            onClick: () => {
              setShowReturnModal(false);
              setReturnEquipmentId("");
              setReturnCondition("good");
              setReturnNotes("");
            },
          },
        }}
      >
        <div className="space-y-4">
          {returnEquipmentId && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Avantage à retourner</h4>
              {(() => {
                const eq = equipment.find((e) => e.id === returnEquipmentId);
                return eq ? (
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Nom:</strong> {eq.name}
                    </p>
                    <p>
                      <strong>Type:</strong> {getEquipmentTypeLabel(eq.type)}
                    </p>
                    {eq.serialNumber && (
                      <p>
                        <strong>N° série:</strong> {eq.serialNumber}
                      </p>
                    )}
                    <p>
                      <strong>Assigné le:</strong>{" "}
                      {eq.assignedAt.toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <div>
            <Label htmlFor="condition-select">État de retour</Label>
            <Select
              value={returnCondition}
              onValueChange={(value: Equipment["condition"]) =>
                setReturnCondition(value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Neuf</SelectItem>
                <SelectItem value="good">Bon état</SelectItem>
                <SelectItem value="fair">État moyen</SelectItem>
                <SelectItem value="poor">Mauvais état</SelectItem>
                <SelectItem value="damaged">Endommagé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="return-notes">Notes (optionnel)</Label>
            <textarea
              id="return-notes"
              className="w-full min-h-20 p-3 border rounded-md resize-none"
              placeholder="Ajouter des notes sur l'état de l'équipement..."
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Exhaust Equipment Modal */}
      <Modal
        open={showExhaustModal}
        onOpenChange={setShowExhaustModal}
        type="form"
        title="Épuisement d'avantage"
        description="Confirmer l'épuisement de l'avantage consommable"
        actions={{
          primary: {
            label: "Confirmer l'épuisement",
            onClick: handleExhaustEquipment,
            variant: "destructive",
            icon: <Archive className="h-4 w-4" />,
          },
          secondary: {
            label: "Annuler",
            onClick: () => {
              setShowExhaustModal(false);
              setExhaustEquipmentId("");
              setReturnNotes("");
            },
          },
        }}
      >
        <div className="space-y-4">
          {exhaustEquipmentId && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Avantage à épuiser</h4>
              {(() => {
                const eq = equipment.find((e) => e.id === exhaustEquipmentId);
                return eq ? (
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Nom:</strong> {eq.name}
                    </p>
                    <p>
                      <strong>Type:</strong> {getEquipmentTypeLabel(eq.type)}
                    </p>
                    {eq.quantity !== undefined && (
                      <p>
                        <strong>Quantité restante:</strong> {eq.quantity}
                      </p>
                    )}
                    {eq.serialNumber && (
                      <p>
                        <strong>N° série:</strong> {eq.serialNumber}
                      </p>
                    )}
                    <p>
                      <strong>Assigné le:</strong>{" "}
                      {eq.assignedAt.toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <div>
            <Label htmlFor="exhaust-notes">Notes (optionnel)</Label>
            <textarea
              id="exhaust-notes"
              className="w-full min-h-20 p-3 border rounded-md resize-none"
              placeholder="Ajouter des notes sur l'épuisement..."
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Equipment Details Modal */}
      <Modal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        type="details"
        title="Détails de l'avantage"
        description="Informations complètes sur l'avantage"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => {
              setShowDetailsModal(false);
              setDetailsEquipmentId("");
            },
          },
        }}
      >
        <div className="space-y-6">
          {detailsEquipmentId &&
            (() => {
              const eq = equipment.find((e) => e.id === detailsEquipmentId);
              return eq ? (
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nom</Label>
                      <p className="text-sm">{eq.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Type</Label>
                      <p className="text-sm">
                        {getEquipmentTypeLabel(eq.type)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">N° série</Label>
                      <p className="text-sm">{eq.serialNumber || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">État</Label>
                      <p className="text-sm">
                        {getConditionLabel(eq.condition)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {eq.description && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm">{eq.description}</p>
                    </div>
                  )}

                  {/* Assignment Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Date d&apos;assignation
                      </Label>
                      <p className="text-sm">
                        {eq.assignedAt.toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Assigné par</Label>
                      <p className="text-sm">{eq.assignedBy}</p>
                    </div>
                  </div>

                  {/* Return Information */}
                  {eq.returnedAt && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Date de retour
                        </Label>
                        <p className="text-sm">
                          {eq.returnedAt.toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Retourné par
                        </Label>
                        <p className="text-sm">{eq.returnedBy}</p>
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <Label className="text-sm font-medium">Statut</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const statusConfig = getStatusBadge(eq.status);
                        const StatusIcon = statusConfig.icon;
                        return (
                          <Badge variant={statusConfig.variant}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Notes */}
                  {eq.notes && (
                    <div>
                      <Label className="text-sm font-medium">Notes</Label>
                      <p className="text-sm">{eq.notes}</p>
                    </div>
                  )}

                  {/* Signature Information */}
                  {eq.issuanceSignature && (
                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium">
                        Signature d&apos;émission
                      </Label>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Signé le
                          </Label>
                          <p>
                            {eq.issuanceSignature.signedAt.toLocaleDateString(
                              "fr-FR",
                            )}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Signé par
                          </Label>
                          <p>{eq.issuanceSignature.signedBy}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Return Signature */}
                  {eq.returnSignature && (
                    <div className="border-t pt-4">
                      <Label className="text-sm font-medium">
                        Signature de retour
                      </Label>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Signé le
                          </Label>
                          <p>
                            {eq.returnSignature.signedAt.toLocaleDateString(
                              "fr-FR",
                            )}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Signé par
                          </Label>
                          <p>{eq.returnSignature.signedBy}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  Équipement non trouvé
                </p>
              );
            })()}
        </div>
      </Modal>
    </div>
  );
}
