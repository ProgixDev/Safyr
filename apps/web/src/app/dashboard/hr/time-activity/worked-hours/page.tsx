"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HoursInput } from "@/components/ui/hours-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Modal } from "@/components/ui/modal";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Sun,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit3,
  Trash2,
} from "lucide-react";
import { mockWorkedHours } from "@/data/time-management";
import { mockEmployees } from "@/data/employees";

export default function WorkedHoursPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkedHoursContent />
    </Suspense>
  );
}

function WorkedHoursContent() {
  const searchParams = useSearchParams();

  // Compute initial state from URL params
  const getInitialStateFromParams = () => {
    const employeeId = searchParams.get("employeeId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const defaultFormData = {
      employeeId: "",
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString().padStart(2, "0"),
      regularHours: 0,
      supplementaryHours25: 0,
      supplementaryHours50: 0,
      complementaryHours10: 0,
      nightHours: 0,
      sundayHours: 0,
      sundayNightHours: 0,
      holidayHours: 0,
      holidayNightHours: 0,
    };

    if (employeeId && month && year) {
      const hoursRecord = mockWorkedHours.find((h) => {
        const dateObj = new Date(h.date);
        return (
          h.employeeId === employeeId &&
          dateObj.getMonth() + 1 === parseInt(month) &&
          dateObj.getFullYear() === parseInt(year)
        );
      });

      if (hoursRecord) {
        return {
          isDetailsModalOpen: true,
          selectedHours: hoursRecord,
          isEditMode: false,
          formData: defaultFormData,
        };
      } else {
        return {
          isDetailsModalOpen: true,
          selectedHours: null,
          isEditMode: true,
          formData: {
            employeeId: employeeId,
            year: year,
            month: month.padStart(2, "0"),
            regularHours: 0,
            supplementaryHours25: 0,
            supplementaryHours50: 0,
            complementaryHours10: 0,
            nightHours: 0,
            sundayHours: 0,
            sundayNightHours: 0,
            holidayHours: 0,
            holidayNightHours: 0,
          },
        };
      }
    }

    return {
      isDetailsModalOpen: false,
      selectedHours: null,
      isEditMode: false,
      formData: defaultFormData,
    };
  };

  const initialState = getInitialStateFromParams();

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(
    initialState.isDetailsModalOpen,
  );
  const [selectedHours, setSelectedHours] = useState<
    (typeof mockWorkedHours)[0] | null
  >(initialState.selectedHours);
  const [isEditMode, setIsEditMode] = useState(initialState.isEditMode);
  const [groupBy, setGroupBy] = useState<string | undefined>(undefined);
  const [formData, setFormData] = useState(initialState.formData);

  const handleViewDetails = (hours: (typeof mockWorkedHours)[0]) => {
    setSelectedHours(hours);
    setIsEditMode(false);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (hours: (typeof mockWorkedHours)[0]) => {
    const dateObj = new Date(hours.date);
    setSelectedHours(hours);
    setIsEditMode(true);
    setFormData({
      employeeId: hours.employeeId,
      year: dateObj.getFullYear().toString(),
      month: (dateObj.getMonth() + 1).toString().padStart(2, "0"),
      regularHours: hours.regularHours,
      supplementaryHours25: hours.supplementaryHours25,
      supplementaryHours50: hours.supplementaryHours50,
      complementaryHours10: hours.complementaryHours10,
      nightHours: hours.nightHours,
      sundayHours: hours.sundayHours,
      sundayNightHours: hours.sundayNightHours,
      holidayHours: hours.holidayHours,
      holidayNightHours: hours.holidayNightHours,
    });
    setIsDetailsModalOpen(true);
  };

  const handleDelete = (hours: (typeof mockWorkedHours)[0]) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ces heures ?")) {
      // TODO: Implement delete logic
      console.log("Delete hours:", hours.id);
    }
  };

  const totalRegularHours = mockWorkedHours.reduce(
    (sum, h) => sum + h.regularHours,
    0,
  );

  const totalSupplementaryHours25 = mockWorkedHours.reduce(
    (sum, h) => sum + (h.supplementaryHours25 || 0),
    0,
  );
  const totalSupplementaryHours50 = mockWorkedHours.reduce(
    (sum, h) => sum + (h.supplementaryHours50 || 0),
    0,
  );
  const totalComplementaryHours10 = mockWorkedHours.reduce(
    (sum, h) => sum + (h.complementaryHours10 || 0),
    0,
  );

  const allWorkedHoursColumns: ColumnDef<(typeof mockWorkedHours)[0]>[] = [
    {
      key: "employeeName",
      label: "Employé",
      sortable: true,
      render: (hours) => (
        <span className="font-semibold truncate">{hours.employeeName}</span>
      ),
    },
    {
      key: "period",
      label: "Période",
      sortable: true,
      render: (hours) => (
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="h-4 w-4 shrink-0" />
          <span className="text-sm truncate">
            {new Date(hours.date).toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      ),
    },
    {
      key: "regularHours",
      label: "H jour",
      sortable: true,
      render: (hours) => (
        <span className="text-sm font-semibold">{hours.regularHours}h</span>
      ),
    },
    {
      key: "sundayHours",
      label: "H Dimanche",
      sortable: true,
      render: (hours) => (
        <span className="text-sm font-semibold">{hours.sundayHours}h</span>
      ),
    },
    {
      key: "holidayHours",
      label: "H Férié",
      sortable: true,
      render: (hours) => (
        <span className="text-sm font-semibold">{hours.holidayHours}h</span>
      ),
    },
    {
      key: "nightHours",
      label: "H Nuit",
      sortable: true,
      render: (hours) => (
        <span className="text-sm font-semibold">{hours.nightHours}h</span>
      ),
    },
    {
      key: "sundayNightHours",
      label: "H Dimanche Nuit",
      sortable: true,
      render: (hours) => (
        <span className="text-sm font-semibold">{hours.sundayNightHours}h</span>
      ),
    },
    {
      key: "holidayNightHours",
      label: "H Férié Nuit",
      sortable: true,
      render: (hours) => (
        <span className="text-sm font-semibold">
          {hours.holidayNightHours}h
        </span>
      ),
    },
    {
      key: "supplementaryHours25",
      label: "H Supp 25%",
      sortable: true,
      render: (hours) => (
        <span className="text-sm font-semibold">
          {hours.supplementaryHours25}h
        </span>
      ),
    },
    {
      key: "supplementaryHours50",
      label: "H Supp 50%",
      sortable: true,
      render: (hours) => (
        <span className="text-sm font-semibold">
          {hours.supplementaryHours50}h
        </span>
      ),
    },
    {
      key: "complementaryHours10",
      label: "H Compl 10%",
      sortable: true,
      render: (hours) => (
        <span className="text-sm font-semibold">
          {hours.complementaryHours10}h
        </span>
      ),
    },
  ];

  const workedHoursColumns = [
    ...allWorkedHoursColumns,
    {
      key: "actions",
      label: "Actions",
      render: (hours: (typeof mockWorkedHours)[0]) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleViewDetails(hours)}>
              <Eye className="mr-2 h-4 w-4 text-orange-500" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEdit(hours)}>
              <Edit3 className="mr-2 h-4 w-4 text-green-600" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(hours)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Heures Travaillées
          </h1>
          <p className="text-muted-foreground">
            Suivi des heures pour la préparation de la paie
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Sun}
          title="Heures Normales"
          value={`${totalRegularHours}h`}
          subtext="Total du mois"
          color="blue"
        />

        <InfoCard
          icon={Clock}
          title="Heures Supplémentaires"
          value={`${totalSupplementaryHours25 + totalSupplementaryHours50 + totalComplementaryHours10}h`}
          subtext="Toutes majorations"
          color="green"
        />

        <InfoCard
          icon={Clock}
          title="Heures de Nuit"
          value={`${mockWorkedHours.reduce(
            (sum, h) => sum + h.nightHours,
            0,
          )}h`}
          subtext="Base"
          color="purple"
        />

        <InfoCard
          icon={Clock}
          title="Dimanche"
          value={`${mockWorkedHours.reduce(
            (sum, h) => sum + h.sundayHours,
            0,
          )}h`}
          subtext="Base"
          color="orange"
        />

        <InfoCard
          icon={Clock}
          title="Jours Fériés"
          value={`${mockWorkedHours.reduce(
            (sum, h) => sum + h.holidayHours,
            0,
          )}h`}
          subtext="Base"
          color="red"
        />
      </InfoCardContainer>

      {/* Worked Hours Table */}
      <Card>
        <CardHeader>
          <CardTitle>Déclarations d&apos;heures</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={mockWorkedHours}
            columns={workedHoursColumns}
            searchKeys={["employeeName"]}
            searchPlaceholder="Rechercher par nom d'employé..."
            itemsPerPage={10}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            groupByOptions={[
              { value: "employeeName", label: "Employé" },
              { value: "date", label: "Période" },
            ]}
            groupByLabel={(value: unknown) =>
              groupBy === "date"
                ? new Date(value as string).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                  })
                : (value as string)
            }
          />
        </CardContent>
      </Card>

      {/* Details/Edit Modal */}
      <Modal
        open={isDetailsModalOpen}
        onOpenChange={(open) => {
          setIsDetailsModalOpen(open);
          if (!open) {
            setSelectedHours(null);
            setIsEditMode(false);
            setFormData({
              employeeId: "",
              year: new Date().getFullYear().toString(),
              month: (new Date().getMonth() + 1).toString().padStart(2, "0"),
              regularHours: 0,
              supplementaryHours25: 0,
              supplementaryHours50: 0,
              complementaryHours10: 0,
              nightHours: 0,
              sundayHours: 0,
              sundayNightHours: 0,
              holidayHours: 0,
              holidayNightHours: 0,
            });
          }
        }}
        type={isEditMode ? "form" : "details"}
        title={
          isEditMode
            ? "Modifier les heures travaillées"
            : `Heures travaillées - ${selectedHours?.employeeName}`
        }
        description={
          selectedHours
            ? `Déclaration de ${new Date(selectedHours.date).toLocaleDateString(
                "fr-FR",
                {
                  month: "long",
                  year: "numeric",
                },
              )}`
            : ""
        }
        actions={
          isEditMode
            ? {
                primary: {
                  label: "Sauvegarder",
                  onClick: () => {
                    const date = new Date(
                      parseInt(formData.year),
                      parseInt(formData.month) - 1,
                      1,
                    )
                      .toISOString()
                      .split("T")[0];
                    console.log("Saving edited hours:", { ...formData, date });
                    setIsDetailsModalOpen(false);
                    setIsEditMode(false);
                  },
                },
                secondary: {
                  label: "Annuler",
                  onClick: () => setIsDetailsModalOpen(false),
                },
              }
            : {
                secondary: {
                  label: "Fermer",
                  onClick: () => setIsDetailsModalOpen(false),
                  variant: "outline",
                },
              }
        }
      >
        {isEditMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Année</Label>
                <Select
                  value={formData.year}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, year: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'année" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = (
                        new Date().getFullYear() -
                        5 +
                        i
                      ).toString();
                      return (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">Mois</Label>
                <Select
                  value={formData.month}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, month: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le mois" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = (i + 1).toString().padStart(2, "0");
                      const monthName = new Date(2000, i, 1).toLocaleDateString(
                        "fr-FR",
                        { month: "long" },
                      );
                      return (
                        <SelectItem key={month} value={month}>
                          {monthName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regularHours">Heures normales</Label>
                <HoursInput
                  value={formData.regularHours}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      regularHours: value,
                    })
                  }
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplementaryHours25">Heures supp. 25%</Label>
                <HoursInput
                  value={formData.supplementaryHours25}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      supplementaryHours25: value,
                    })
                  }
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplementaryHours50">Heures supp. 50%</Label>
                <HoursInput
                  value={formData.supplementaryHours50}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      supplementaryHours50: value,
                    })
                  }
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complementaryHours10">Heures comp. 10%</Label>
                <HoursInput
                  value={formData.complementaryHours10}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      complementaryHours10: value,
                    })
                  }
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nightHours">Heures de nuit</Label>
                <HoursInput
                  value={formData.nightHours}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      nightHours: value,
                    })
                  }
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sundayHours">Heures dimanche</Label>
                <HoursInput
                  value={formData.sundayHours}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      sundayHours: value,
                    })
                  }
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="holidayHours">Heures jours fériés</Label>
                <HoursInput
                  value={formData.holidayHours}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      holidayHours: value,
                    })
                  }
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sundayNightHours">Heures dimanche nuit</Label>
                <HoursInput
                  value={formData.sundayNightHours}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      sundayNightHours: value,
                    })
                  }
                  step={0.5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="holidayNightHours">
                  Heures jours fériés nuit
                </Label>
                <HoursInput
                  value={formData.holidayNightHours}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      holidayNightHours: value,
                    })
                  }
                  step={0.5}
                />
              </div>
            </div>
          </div>
        ) : (
          selectedHours && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Employé</Label>
                  <p className="text-sm text-muted-foreground">
                    <Link
                      href={`/dashboard/hr/collaborators/${selectedHours.employeeId}`}
                      className="text-primary hover:underline"
                    >
                      {selectedHours.employeeName}
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {
                      mockEmployees.find(
                        (e) => e.id === selectedHours.employeeId,
                      )?.employeeNumber
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Période</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedHours.date).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              </div>

              {/* Hours Breakdown */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Détail des heures</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">
                      Heures normales
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedHours.regularHours}h
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Heures supp. 25%
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedHours.supplementaryHours25}h
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Heures supp. 50%
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedHours.supplementaryHours50}h
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Heures comp. 10%
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedHours.complementaryHours10}h
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Heures de nuit
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedHours.nightHours}h
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Heures dimanche
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedHours.sundayHours}h
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Heures dimanche nuit
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedHours.sundayNightHours}h
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Heures jours fériés
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedHours.holidayHours}h
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">
                      Heures jours fériés nuit
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedHours.holidayNightHours}h
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Total heures
                      </Label>
                      <p className="text-sm font-medium">
                        {selectedHours.regularHours +
                          selectedHours.supplementaryHours25 +
                          selectedHours.supplementaryHours50 +
                          selectedHours.complementaryHours10 +
                          selectedHours.nightHours +
                          selectedHours.sundayHours +
                          selectedHours.sundayNightHours +
                          selectedHours.holidayHours +
                          selectedHours.holidayNightHours}
                        h
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Heures majorées
                      </Label>
                      <p className="text-sm font-medium">
                        {selectedHours.supplementaryHours25 +
                          selectedHours.supplementaryHours50 +
                          selectedHours.complementaryHours10 +
                          selectedHours.nightHours +
                          selectedHours.sundayHours +
                          selectedHours.sundayNightHours +
                          selectedHours.holidayHours +
                          selectedHours.holidayNightHours}
                        h
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  Créée le {selectedHours.createdAt.toLocaleDateString("fr-FR")}
                </div>
                <div>
                  Modifiée le{" "}
                  {selectedHours.updatedAt.toLocaleDateString("fr-FR")}
                </div>
              </div>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
