"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import {
  Plus,
  CheckCircle,
  XCircle,
  MoreVertical,
  Award,
  Clock,
  Calendar,
  Users,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import type {
  TrainingCertification,
  CertificationType,
  Employee,
} from "@/lib/types";
import { mockEmployees } from "@/data/employees";

// Mock data for other certifications (H0B0, FIRE, etc.)
const mockCertifications: TrainingCertification[] = [
  {
    id: "1",
    employeeId: "EMP001",
    employeeName: "Jean Dupont",
    type: "H0B0",
    number: "H0B0-2024-001",
    issueDate: new Date("2023-01-15"),
    expiryDate: new Date("2026-01-15"),
    issuer: "Organisme habilité",
    status: "valid",
    validated: true,
    validatedBy: "Admin",
    validatedAt: new Date("2023-01-15"),
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2023-01-15"),
  },
  {
    id: "2",
    employeeId: "EMP002",
    employeeName: "Marie Martin",
    type: "FIRE",
    number: "FIRE-2024-002",
    issueDate: new Date("2023-06-01"),
    expiryDate: new Date("2026-06-01"),
    issuer: "SDIS",
    status: "valid",
    validated: true,
    validatedBy: "Admin",
    validatedAt: new Date("2023-06-01"),
    createdAt: new Date("2023-06-01"),
    updatedAt: new Date("2023-06-01"),
  },
  {
    id: "3",
    employeeId: "EMP003",
    employeeName: "Pierre Durand",
    type: "H0B0",
    number: "H0B0-2024-003",
    issueDate: new Date("2023-03-10"),
    expiryDate: new Date("2025-03-10"),
    issuer: "Organisme habilité",
    status: "expiring-soon",
    validated: true,
    validatedBy: "Admin",
    validatedAt: new Date("2023-03-10"),
    createdAt: new Date("2023-03-10"),
    updatedAt: new Date("2023-03-10"),
  },
];

const certificationTypeLabels: Record<CertificationType, string> = {
  SSIAP1: "SSIAP 1",
  SSIAP2: "SSIAP 2",
  SSIAP3: "SSIAP 3",
  SST: "SST",
  H0B0: "H0B0",
  FIRE: "Habilitation incendie",
  OTHER: "Autre",
};

export default function CertificationsPage() {
  const [certifications, setCertifications] =
    useState<TrainingCertification[]>(mockCertifications);
  const [isCertificationModalOpen, setIsCertificationModalOpen] =
    useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCertification, setSelectedCertification] =
    useState<TrainingCertification | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCertificationForDelete, setSelectedCertificationForDelete] =
    useState<TrainingCertification | null>(null);
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const employeeSearchRef = useRef<HTMLDivElement>(null);
  const [certificationForm, setCertificationForm] = useState({
    employeeId: "",
    employeeName: "",
    type: "H0B0" as CertificationType,
    number: "",
    issueDate: "",
    expiryDate: "",
    issuer: "",
  });

  // Handle click outside to close employee search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        employeeSearchRef.current &&
        !employeeSearchRef.current.contains(event.target as Node)
      ) {
        setEmployeeSearchOpen(false);
        setEmployeeSearchQuery("");
      }
    };

    if (employeeSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [employeeSearchOpen]);

  const handleValidate = (certification: TrainingCertification) => {
    setCertifications(
      certifications.map((c) =>
        c.id === certification.id
          ? {
              ...c,
              validated: true,
              validatedBy: "Admin",
              validatedAt: new Date(),
            }
          : c,
      ),
    );
    setIsViewModalOpen(false);
  };

  const handleReject = (certification: TrainingCertification) => {
    setCertifications(certifications.filter((c) => c.id !== certification.id));
    setIsViewModalOpen(false);
  };

  const handleDeleteCertification = () => {
    if (selectedCertificationForDelete) {
      setCertifications(
        certifications.filter(
          (c) => c.id !== selectedCertificationForDelete.id,
        ),
      );
      setIsDeleteModalOpen(false);
      setSelectedCertificationForDelete(null);
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
    setCertificationForm((prev) => ({
      ...prev,
      employeeId: employee.employeeNumber,
      employeeName: `${employee.firstName} ${employee.lastName}`,
    }));
    setEmployeeSearchOpen(false);
    setEmployeeSearchQuery("");
  };

  const handleViewCertification = (certification: TrainingCertification) => {
    setSelectedCertification(certification);
    setIsViewModalOpen(true);
  };

  const handleEditCertification = (certification: TrainingCertification) => {
    setSelectedCertification(certification);
    setCertificationForm({
      employeeId: certification.employeeId,
      employeeName: certification.employeeName,
      type: certification.type,
      number: certification.number,
      issueDate: certification.issueDate.toISOString().split("T")[0],
      expiryDate: certification.expiryDate.toISOString().split("T")[0],
      issuer: "SDIS",
    });
    setIsEditMode(true);
    setIsCertificationModalOpen(true);
  };

  const handleCreateOrUpdateCertification = () => {
    if (isEditMode && selectedCertification) {
      // Update existing certification
      setCertifications(
        certifications.map((c) =>
          c.id === selectedCertification.id
            ? {
                ...c,
                employeeId: certificationForm.employeeId,
                employeeName: certificationForm.employeeName,
                type: certificationForm.type,
                number: certificationForm.number,
                issueDate: new Date(certificationForm.issueDate),
                expiryDate: new Date(certificationForm.expiryDate),
                issuer: certificationForm.issuer,
                updatedAt: new Date(),
              }
            : c,
        ),
      );
    } else {
      // Create new certification
      const certification: TrainingCertification = {
        id: `CERT${Date.now()}`,
        employeeId: certificationForm.employeeId,
        employeeName: certificationForm.employeeName,
        type: certificationForm.type,
        number: certificationForm.number,
        issueDate: new Date(certificationForm.issueDate),
        expiryDate: new Date(certificationForm.expiryDate),
        issuer: certificationForm.issuer,
        status: "valid",
        validated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCertifications([...certifications, certification]);
    }

    setIsCertificationModalOpen(false);
    setIsEditMode(false);
    setEmployeeSearchOpen(false);
    setEmployeeSearchQuery("");
    setCertificationForm({
      employeeId: "",
      employeeName: "",
      type: "H0B0",
      number: "",
      issueDate: "",
      expiryDate: "",
      issuer: "",
    });
  };

  const filteredEmployees = mockEmployees.filter((employee) =>
    `${employee.firstName} ${employee.lastName} ${employee.employeeNumber}`
      .toLowerCase()
      .includes(employeeSearchQuery.toLowerCase()),
  );

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setCertificationForm({
      employeeId: "",
      employeeName: "",
      type: "H0B0",
      number: "",
      issueDate: "",
      expiryDate: "",
      issuer: "",
    });
    setIsCertificationModalOpen(true);
  };

  const columns: ColumnDef<TrainingCertification>[] = [
    {
      key: "employee",
      label: "Employé",
      icon: Users,
      sortable: true,
      sortValue: (certification) => certification.employeeName,
      render: (certification) => (
        <div>
          <div className="font-medium">{certification.employeeName}</div>
          <div className="text-sm text-muted-foreground">
            {certification.employeeId}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (certification) => (
        <Badge variant="outline">
          {certificationTypeLabels[certification.type]}
        </Badge>
      ),
    },
    {
      key: "number",
      label: "Numéro",
      render: (certification) => (
        <span className="font-mono text-sm">{certification.number}</span>
      ),
    },
    {
      key: "issueDate",
      label: "Date dd'apos;apos;émission",
      icon: Calendar,
      sortable: true,
      render: (certification) => (
        <span className="text-sm">
          {certification.issueDate.toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      key: "expiryDate",
      label: "Date dd'apos;apos;expiration",
      icon: Clock,
      sortable: true,
      render: (certification) => (
        <span className="text-sm">
          {certification.expiryDate.toLocaleDateString("fr-FR")}
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (certification) => (
        <Badge
          variant={
            certification.status === "valid"
              ? "default"
              : certification.status === "expiring-soon"
                ? "secondary"
                : "destructive"
          }
        >
          {certification.status === "valid"
            ? "Valide"
            : certification.status === "expiring-soon"
              ? "Expire bientôt"
              : "Expiré"}
        </Badge>
      ),
    },
  ];

  const validCount = certifications.filter((c) => c.status === "valid").length;
  const expiringSoonCount = certifications.filter(
    (c) => c.status === "expiring-soon",
  ).length;
  const expiredCount = certifications.filter(
    (c) => c.status === "expired",
  ).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Habilitations
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Suivi des habilitations H0B0, incendie et autres certifications
          </p>
        </div>
        <Button onClick={handleOpenCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle habilitation
        </Button>
      </div>

      {/* Stats Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Award}
          title="Total habilitations"
          value={certifications.length}
          subtext="Habilitations actives"
          color="blue"
        />
        <InfoCard
          icon={CheckCircle}
          title="Valides"
          value={validCount}
          subtext="En cours de validité"
          color="green"
        />
        <InfoCard
          icon={Clock}
          title="Expirent bientôt"
          value={expiringSoonCount}
          subtext="Dans les 3 mois"
          color="orange"
        />
        <InfoCard
          icon={XCircle}
          title="Expirées"
          value={expiredCount}
          subtext="À renouveler"
          color="red"
        />
      </InfoCardContainer>

      {/* Certifications DataTable */}
      <DataTable
        data={certifications}
        columns={columns}
        searchKeys={["employeeName", "number"]}
        getSearchValue={(certification) =>
          `${certification.employeeName} ${certification.number}`
        }
        searchPlaceholder="Rechercher par employé ou numéro..."
        getRowId={(certification) => certification.id}
        actions={(certification) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleViewCertification(certification)}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEditCertification(certification)}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCertificationForDelete(certification);
                  setIsDeleteModalOpen(true);
                }}
                className="flex items-center gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      />

      {/* View Certification Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de l'apos;habilitation"
        size="md"
      >
        {selectedCertification && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Employé</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedCertification.employeeName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedCertification.employeeId}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <p className="text-sm text-muted-foreground">
                  {certificationTypeLabels[selectedCertification.type]}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Numéro</Label>
                <p className="text-sm font-mono">
                  {selectedCertification.number}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Émetteur</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedCertification.issuer}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">
                  Date d&apos;émission
                </Label>
                <p className="text-sm text-muted-foreground">
                  {selectedCertification.issueDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Date d&apos;expiration
                </Label>
                <p className="text-sm text-muted-foreground">
                  {selectedCertification.expiryDate.toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedCertification.status === "valid"
                        ? "default"
                        : selectedCertification.status === "expiring-soon"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {selectedCertification.status === "valid"
                      ? "Valide"
                      : selectedCertification.status === "expiring-soon"
                        ? "Expire bientôt"
                        : "Expiré"}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Validé par</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCertification.validatedBy || "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                Créée le{" "}
                {selectedCertification.createdAt.toLocaleDateString("fr-FR")}
              </div>
              <div>
                Modifiée le{" "}
                {selectedCertification.updatedAt.toLocaleDateString("fr-FR")}
              </div>
            </div>
            {!selectedCertification.validated && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => handleValidate(selectedCertification)}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Valider
                </Button>
                <Button
                  onClick={() => handleReject(selectedCertification)}
                  variant="destructive"
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeter
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Certification Modal (Create/Edit) */}
      <Modal
        open={isCertificationModalOpen}
        onOpenChange={(open) => {
          setIsCertificationModalOpen(open);
          if (!open) {
            setEmployeeSearchOpen(false);
            setEmployeeSearchQuery("");
          }
        }}
        type="form"
        title={
          isEditMode ? "Modifier l&apos;habilitation" : "Nouvelle habilitation"
        }
        size="md"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsCertificationModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: isEditMode ? "Mettre à jour" : "Créer",
            onClick: handleCreateOrUpdateCertification,
            disabled:
              !certificationForm.employeeName || !certificationForm.number,
          },
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">
              Employé <span className="text-destructive">*</span>
            </Label>
            <div className="relative" ref={employeeSearchRef}>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setEmployeeSearchOpen(!employeeSearchOpen)}
              >
                {certificationForm.employeeName || "Sélectionner un employé"}
                <Users className="h-4 w-4 opacity-50" />
              </Button>
              {employeeSearchOpen && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
                  <div className="p-2">
                    <Input
                      placeholder="Rechercher un employé..."
                      value={employeeSearchQuery}
                      onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                      className="mb-2"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <button
                          key={employee.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-3"
                          onClick={() => handleSelectEmployee(employee)}
                        >
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                            {employee.firstName[0]}
                            {employee.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {employee.employeeNumber} • {employee.position}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Aucun employé trouvé
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type d&apos;habilitation</Label>
              <Select
                value={certificationForm.type}
                onValueChange={(value: CertificationType) =>
                  setCertificationForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="H0B0">H0B0</SelectItem>
                  <SelectItem value="FIRE">Habilitation incendie</SelectItem>
                  <SelectItem value="OTHER">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issuer">Émetteur</Label>
              <Input
                id="issuer"
                value={certificationForm.issuer}
                onChange={(e) =>
                  setCertificationForm((prev) => ({
                    ...prev,
                    issuer: e.target.value,
                  }))
                }
                placeholder="Organisme habilité, SDIS..."
                readOnly={isEditMode}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="number">
              Numéro d&apos;habilitation{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="number"
              value={certificationForm.number}
              onChange={(e) =>
                setCertificationForm((prev) => ({
                  ...prev,
                  number: e.target.value,
                }))
              }
              placeholder="H0B0-2024-001"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Date d&apos;émission</Label>
              <Input
                id="issueDate"
                type="date"
                value={certificationForm.issueDate}
                onChange={(e) =>
                  setCertificationForm((prev) => ({
                    ...prev,
                    issueDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Date d&apos;expiration</Label>
              <Input
                id="expiryDate"
                type="date"
                value={certificationForm.expiryDate}
                onChange={(e) =>
                  setCertificationForm((prev) => ({
                    ...prev,
                    expiryDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        type="confirmation"
        title="Confirmer la suppression"
        size="sm"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsDeleteModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: "Supprimer",
            onClick: handleDeleteCertification,
            variant: "destructive",
          },
        }}
      >
        <p>Êtes-vous sûr de vouloir supprimer cette habilitation ?</p>
        {selectedCertificationForDelete && (
          <p className="text-sm text-muted-foreground mt-2">
            {selectedCertificationForDelete.employeeName} -{" "}
            {certificationTypeLabels[selectedCertificationForDelete.type]}
          </p>
        )}
      </Modal>
    </div>
  );
}
