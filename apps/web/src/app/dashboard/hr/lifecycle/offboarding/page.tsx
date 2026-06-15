"use client";

import { useState } from "react";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Download, FileText, CheckCircle, Clock } from "lucide-react";
import { mockEmployees } from "@/data/employees";
import {
  mockOffboardingProcesses,
  type OffboardingProcess,
} from "@/data/hr-offboarding";

export default function OffboardingPage() {
  const [processes, setProcesses] = useState<OffboardingProcess[]>(
    mockOffboardingProcesses,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] =
    useState<OffboardingProcess | null>(null);
  const [formData, setFormData] = useState({
    employeeId: "",
    contractEndDate: "",
    noticePeriodDays: 30,
  });

  const inProgress = processes.filter((p) => p.status === "En cours").length;
  const completed = processes.filter((p) => p.status === "Terminé").length;

  const columns: ColumnDef<OffboardingProcess>[] = [
    {
      key: "employeeName",
      label: "Employé",
      sortable: true,
    },
    {
      key: "contractEndDate",
      label: "Fin de contrat",
      render: (process) =>
        new Date(process.contractEndDate).toLocaleDateString("fr-FR"),
    },
    {
      key: "noticePeriodEnd",
      label: "Fin préavis",
      render: (process) =>
        new Date(process.noticePeriodEnd).toLocaleDateString("fr-FR"),
    },
    {
      key: "status",
      label: "Statut",
      render: (process) => {
        const variants: Record<
          string,
          "default" | "secondary" | "outline" | "destructive"
        > = {
          "En cours": "default",
          Terminé: "secondary",
          Annulé: "destructive",
        };
        return (
          <Badge variant={variants[process.status]}>{process.status}</Badge>
        );
      },
    },
    {
      key: "equipmentReturned",
      label: "Matériel",
      render: (process) =>
        process.equipmentReturned ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <Clock className="h-4 w-4 text-orange-600" />
        ),
    },
    {
      key: "documentsGenerated",
      label: "Documents",
      render: (process) => {
        const count = Object.values(process.documentsGenerated).filter(
          Boolean,
        ).length;
        return <Badge variant="outline">{count}/3</Badge>;
      },
    },
  ];

  const handleCreate = () => {
    setFormData({
      employeeId: "",
      contractEndDate: "",
      noticePeriodDays: 30,
    });
    setIsCreateModalOpen(true);
  };

  const handleSave = () => {
    const employee = mockEmployees.find((e) => e.id === formData.employeeId);
    if (!employee) return;

    const endDate = new Date(formData.contractEndDate);
    const noticeStart = new Date(endDate);
    noticeStart.setDate(noticeStart.getDate() - formData.noticePeriodDays);

    const now = new Date().toISOString();
    const newProcess: OffboardingProcess = {
      id: (processes.length + 1).toString(),
      employeeId: formData.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeNumber: employee.employeeNumber,
      contractEndDate: formData.contractEndDate,
      noticePeriodStart: noticeStart.toISOString().split("T")[0],
      noticePeriodEnd: formData.contractEndDate,
      reason: "resignation", // Default, can be updated later
      status: "En cours",
      equipmentReturned: false,
      documentsGenerated: {
        workCertificate: false,
        poleEmploiCertificate: false,
        finalSettlement: false,
      },
      payrollExported: false,
      fileArchived: false,
      createdAt: now,
      updatedAt: now,
    };
    setProcesses([...processes, newProcess]);
    setIsCreateModalOpen(false);
  };

  const handleRowClick = (process: OffboardingProcess) => {
    setSelectedProcess(process);
    setIsViewModalOpen(true);
  };

  const handleGenerateDocument = (
    processId: string,
    docType: keyof OffboardingProcess["documentsGenerated"],
  ) => {
    setProcesses(
      processes.map((p) =>
        p.id === processId
          ? {
              ...p,
              documentsGenerated: { ...p.documentsGenerated, [docType]: true },
            }
          : p,
      ),
    );
    alert(`Document ${docType} généré avec succès!`);
  };

  const handleExportPayroll = (processId: string) => {
    setProcesses(
      processes.map((p) =>
        p.id === processId ? { ...p, payrollExported: true } : p,
      ),
    );
    alert("Export paie effectué avec succès!");
  };

  const handleArchiveFile = (processId: string) => {
    setProcesses(
      processes.map((p) =>
        p.id === processId
          ? { ...p, fileArchived: true, status: "Terminé" as const }
          : p,
      ),
    );
    alert("Dossier archivé avec succès!");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Parcours de départ</h1>
          <p className="text-muted-foreground">
            Gestion des fins de contrat, préavis, retour d&apos;équipement et
            documents obligatoires
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau processus
        </Button>
      </div>

      {/* Summary Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Clock}
          title="En cours"
          value={inProgress}
          subtext="Processus actifs"
          color="orange"
        />

        <InfoCard
          icon={CheckCircle}
          title="Terminés"
          value={completed}
          subtext="Cette année"
          color="green"
        />
      </InfoCardContainer>

      <DataTable
        data={processes}
        columns={columns}
        searchKey="employeeName"
        searchPlaceholder="Rechercher un employé..."
        onRowClick={handleRowClick}
      />

      {/* Create Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        type="form"
        title="Nouveau processus de fin de contrat"
        size="lg"
        actions={{
          primary: {
            label: "Créer",
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
            <Label htmlFor="employeeId">Employé</Label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) =>
                setFormData({ ...formData, employeeId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un employé..." />
              </SelectTrigger>
              <SelectContent>
                {mockEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contractEndDate">Date de fin de contrat</Label>
            <Input
              id="contractEndDate"
              type="date"
              value={formData.contractEndDate}
              onChange={(e) =>
                setFormData({ ...formData, contractEndDate: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="noticePeriodDays">Durée du préavis (jours)</Label>
            <Input
              id="noticePeriodDays"
              type="number"
              min="0"
              value={formData.noticePeriodDays}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  noticePeriodDays: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails du processus de fin de contrat"
        size="lg"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {selectedProcess && (
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employé</Label>
                <p className="text-sm font-medium">
                  {selectedProcess.employeeName}
                </p>
              </div>
              <div>
                <Label>Statut</Label>
                <Badge variant="default">{selectedProcess.status}</Badge>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de fin de contrat</Label>
                <p className="text-sm font-medium">
                  {new Date(selectedProcess.contractEndDate).toLocaleDateString(
                    "fr-FR",
                  )}
                </p>
              </div>
              <div>
                <Label>Début du préavis</Label>
                <p className="text-sm font-medium">
                  {new Date(
                    selectedProcess.noticePeriodStart,
                  ).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>

            {/* Equipment Return Checklist */}
            <div className="pt-4 border-t">
              <Label className="text-base font-semibold mb-3 block">
                Retour d&apos;équipement
              </Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedProcess.equipmentReturned}
                    disabled
                  />
                  <Label className="text-sm">
                    Équipement retourné (PPE, radio, clés, etc.)
                  </Label>
                </div>
              </div>
            </div>

            {/* Documents Generation */}
            <div className="pt-4 border-t">
              <Label className="text-base font-semibold mb-3 block">
                Documents obligatoires
              </Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Certificat de travail</span>
                  </div>
                  {selectedProcess.documentsGenerated.workCertificate ? (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Généré
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleGenerateDocument(
                          selectedProcess.id,
                          "workCertificate",
                        )
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Générer
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Attestation Pôle Emploi</span>
                  </div>
                  {selectedProcess.documentsGenerated.poleEmploiCertificate ? (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Généré
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleGenerateDocument(
                          selectedProcess.id,
                          "poleEmploiCertificate",
                        )
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Générer
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">
                      Reçu pour solde de tout compte
                    </span>
                  </div>
                  {selectedProcess.documentsGenerated.finalSettlement ? (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Généré
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleGenerateDocument(
                          selectedProcess.id,
                          "finalSettlement",
                        )
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Générer
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t space-y-2">
              {!selectedProcess.payrollExported && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleExportPayroll(selectedProcess.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter vers la paie
                </Button>
              )}

              {!selectedProcess.fileArchived && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleArchiveFile(selectedProcess.id)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Archiver le dossier
                </Button>
              )}

              {selectedProcess.payrollExported &&
                selectedProcess.fileArchived && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">
                      ✓ Processus terminé - Tous les documents ont été générés
                      et le dossier est archivé
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
