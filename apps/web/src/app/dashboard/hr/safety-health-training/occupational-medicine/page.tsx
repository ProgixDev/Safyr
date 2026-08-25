"use client";

import { useState } from "react";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useEmployeeOptions } from "@/hooks/employees";
import { Combobox } from "@/components/ui/combobox";
import {
  mockMedicalVisits,
  type MedicalVisit,
} from "@/data/hr-occupational-medicine";

export default function OccupationalMedicinePage() {
  // Le salarié se choisit dans la liste : c'était une saisie libre,
  // sujette aux fautes de frappe et sans lien avec le dossier.
  const optionsSalaries = useEmployeeOptions().map((salarie) => ({
    value: salarie.name,
    label: salarie.name,
  }));
  const [visits, setVisits] = useState<MedicalVisit[]>(mockMedicalVisits);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<MedicalVisit | null>(null);
  const [formData, setFormData] = useState({
    employeeName: "",
    type: "VM" as MedicalVisit["type"],
    scheduledDate: "",
    doctor: "",
    organization: "Médecine du Travail Paris",
  });

  const toSchedule = visits.filter((v) => v.status === "À planifier").length;
  const overdue = visits.filter((v) => v.status === "En retard").length;
  const completed = visits.filter((v) => v.status === "Effectuée").length;

  const columns: ColumnDef<MedicalVisit>[] = [
    {
      key: "employeeName",
      label: "Employé",
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      render: (visit) => {
        const variants: Record<
          string,
          "default" | "secondary" | "outline" | "destructive"
        > = {
          VM: "default",
          VIP: "secondary",
          "Pré-reprise": "outline",
          Reprise: "outline",
        };
        return <Badge variant={variants[visit.type]}>{visit.type}</Badge>;
      },
    },
    {
      key: "status",
      label: "Statut",
      render: (visit) => {
        const variants: Record<
          string,
          "default" | "secondary" | "outline" | "destructive"
        > = {
          "À planifier": "outline",
          Planifiée: "default",
          Effectuée: "secondary",
          "En retard": "destructive",
        };
        return <Badge variant={variants[visit.status]}>{visit.status}</Badge>;
      },
    },
    {
      key: "scheduledDate",
      label: "Date prévue",
      render: (visit) =>
        visit.scheduledDate
          ? new Date(visit.scheduledDate).toLocaleDateString("fr-FR")
          : "-",
    },
    {
      key: "nextVisitDate",
      label: "Prochaine visite",
      render: (visit) =>
        visit.nextVisitDate
          ? new Date(visit.nextVisitDate).toLocaleDateString("fr-FR")
          : "-",
    },
    {
      key: "fitness",
      label: "Aptitude",
      render: (visit) => {
        const variants: Record<
          string,
          "default" | "secondary" | "outline" | "destructive"
        > = {
          Apte: "default",
          "Apte avec réserves": "secondary",
          "Inapte temporaire": "destructive",
          Inapte: "destructive",
          "-": "outline",
        };
        return <Badge variant={variants[visit.fitness]}>{visit.fitness}</Badge>;
      },
    },
    {
      key: "organization",
      label: "Organisme",
      render: (visit) => <span className="text-sm">{visit.organization}</span>,
    },
    {
      key: "alertSent",
      label: "Alerte",
      render: (visit) =>
        visit.alertSent ? (
          <AlertCircle className="h-4 w-4 text-orange-600" />
        ) : null,
    },
  ];

  const handleCreate = () => {
    setFormData({
      employeeName: "",
      type: "VM",
      scheduledDate: "",
      doctor: "",
      organization: "Médecine du Travail Paris",
    });
    setIsCreateModalOpen(true);
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const newVisit: MedicalVisit = {
      id: (visits.length + 1).toString(),
      employeeId: `emp${visits.length + 1}`,
      employeeName: formData.employeeName,
      employeeNumber: `EMP${String(visits.length + 1).padStart(3, "0")}`,
      type: formData.type,
      status: formData.scheduledDate ? "Planifiée" : "À planifier",
      scheduledDate: formData.scheduledDate || undefined,
      fitness: "-",
      doctor: formData.doctor,
      organization: formData.organization,
      documents: [],
      alertSent: false,
      createdAt: now,
      updatedAt: now,
    };
    setVisits([...visits, newVisit]);
    setIsCreateModalOpen(false);
  };

  const handleRowClick = (visit: MedicalVisit) => {
    setSelectedVisit(visit);
    setIsViewModalOpen(true);
  };

  const handleSendAlert = (visitId: string) => {
    setVisits(
      visits.map((v) => (v.id === visitId ? { ...v, alertSent: true } : v)),
    );
    alert("Alerte envoyée à l'employé et l'organisme de médecine du travail");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Médecine du Travail</h1>
          <p className="text-muted-foreground">
            Suivi complet des visites médicales (VM, VIP, reprise, pré-reprise)
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Planifier une visite
        </Button>
      </div>

      {/* Summary Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Clock}
          title="À planifier"
          value={toSchedule}
          subtext="Visites à organiser"
          color="orange"
        />

        <InfoCard
          icon={AlertCircle}
          title="En retard"
          value={overdue}
          subtext="Visites dépassées"
          color="red"
        />

        <InfoCard
          icon={CheckCircle}
          title="Effectuées"
          value={completed}
          subtext="Cette année"
          color="green"
        />

        <InfoCard
          icon={AlertCircle}
          title="Alertes envoyées"
          value={visits.filter((v) => v.alertSent).length}
          subtext="Ce mois"
          color="blue"
        />
      </InfoCardContainer>

      <DataTable
        data={visits}
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
        title="Planifier une visite médicale"
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
            <Label htmlFor="employeeName">Employé</Label>
            <Combobox
              options={optionsSalaries}
              value={formData.employeeName}
              onValueChange={(valeur) =>
                setFormData({ ...formData, employeeName: valeur })
              }
              placeholder="Sélectionner un employé"
              searchPlaceholder="Rechercher un employé..."
              emptyMessage="Aucun employé trouvé."
            />
          </div>

          <div>
            <Label htmlFor="type">Type de visite</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  type: value as MedicalVisit["type"],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VM">Visite Médicale (VM)</SelectItem>
                <SelectItem value="VIP">
                  Visite Initiale Périodique (VIP)
                </SelectItem>
                <SelectItem value="Pré-reprise">
                  Visite de Pré-reprise
                </SelectItem>
                <SelectItem value="Reprise">Visite de Reprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="organization">Organisme</Label>
            <Input
              id="organization"
              value={formData.organization}
              onChange={(e) =>
                setFormData({ ...formData, organization: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="doctor">Médecin (optionnel)</Label>
            <Input
              id="doctor"
              value={formData.doctor}
              onChange={(e) =>
                setFormData({ ...formData, doctor: e.target.value })
              }
              placeholder="Dr. ..."
            />
          </div>

          <div>
            <Label htmlFor="scheduledDate">Date prévue (optionnel)</Label>
            <Input
              id="scheduledDate"
              type="date"
              value={formData.scheduledDate}
              onChange={(e) =>
                setFormData({ ...formData, scheduledDate: e.target.value })
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
        title="Détails de la visite médicale"
        size="lg"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {selectedVisit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employé</Label>
                <p className="text-sm font-medium">
                  {selectedVisit.employeeName}
                </p>
              </div>
              <div>
                <Label>Type</Label>
                <Badge variant="default">{selectedVisit.type}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statut</Label>
                <Badge variant="secondary">{selectedVisit.status}</Badge>
              </div>
              <div>
                <Label>Aptitude</Label>
                <Badge variant="default">{selectedVisit.fitness}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date prévue</Label>
                <p className="text-sm font-medium">
                  {selectedVisit.scheduledDate
                    ? new Date(selectedVisit.scheduledDate).toLocaleDateString(
                        "fr-FR",
                      )
                    : "Non planifiée"}
                </p>
              </div>
              {selectedVisit.completedDate && (
                <div>
                  <Label>Date d&apos;exécution</Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedVisit.completedDate).toLocaleDateString(
                      "fr-FR",
                    )}
                  </p>
                </div>
              )}
            </div>

            {selectedVisit.nextVisitDate && (
              <div>
                <Label>Prochaine visite</Label>
                <p className="text-sm font-medium">
                  {new Date(selectedVisit.nextVisitDate).toLocaleDateString(
                    "fr-FR",
                  )}
                </p>
              </div>
            )}

            <div>
              <Label>Organisme</Label>
              <p className="text-sm font-medium">
                {selectedVisit.organization}
              </p>
            </div>

            {selectedVisit.doctor && (
              <div>
                <Label>Médecin</Label>
                <p className="text-sm font-medium">{selectedVisit.doctor}</p>
              </div>
            )}

            {selectedVisit.restrictions && (
              <div>
                <Label>Restrictions / Observations</Label>
                <p className="text-sm">{selectedVisit.restrictions}</p>
              </div>
            )}

            {selectedVisit.documents && selectedVisit.documents.length > 0 && (
              <div>
                <Label>Documents</Label>
                <div className="space-y-2 mt-2">
                  {selectedVisit.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <span className="text-sm">{doc}</span>
                      <Button variant="ghost" size="sm">
                        Télécharger
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!selectedVisit.alertSent &&
              (selectedVisit.status === "À planifier" ||
                selectedVisit.status === "En retard") && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    handleSendAlert(selectedVisit.id);
                    setIsViewModalOpen(false);
                  }}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Envoyer une alerte automatique
                </Button>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}
