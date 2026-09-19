"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import {
  Euro,
  Users,
  Calculator,
  Download,
  Building2,
  Award,
  Settings,
  AlertTriangle,
} from "lucide-react";
import {
  useCoutsSalaries,
  CLE_TAUX_PATRONAL,
  CLE_TAUX_SALARIAL,
  type CoutSalarie,
} from "@/hooks/payroll";
import {
  arrondi2,
  formaterEuros,
  formaterNombre,
  lireNombre,
  versSaisie,
} from "@/lib/payroll-primes";

// Couleurs des cartes de répartition (attribuées dans l'ordre des postes).
const couleursPostes = [
  {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    icon: "text-blue-500",
  },
  {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-700 dark:text-purple-300",
    icon: "text-purple-500",
  },
  {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
    icon: "text-green-500",
  },
  {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-300",
    icon: "text-orange-500",
  },
];

const HEURES_PAR_SEMAINE_EN_MOIS = 52 / 12;

export default function PersonnelCostPage() {
  const {
    couts: personnelCosts,
    isLoading,
    contratsEnErreur,
    tauxPatronal,
    tauxSalarial,
    parametres,
    modifierRemuneration,
  } = useCoutsSalaries();

  // On garde l'identifiant du salarié, pas l'objet : après une modification,
  // les fenêtres relisent la ligne recalculée.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editGrossSalary, setEditGrossSalary] = useState("");
  const [editWorkedHours, setEditWorkedHours] = useState("");
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [tauxSaisis, setTauxSaisis] = useState<Record<string, string>>({});

  const selectedCost =
    personnelCosts.find((c) => c.memberId === selectedId) ?? null;

  const handleViewDetails = (cost: CoutSalarie) => {
    setSelectedId(cost.memberId);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (cost: CoutSalarie) => {
    setSelectedId(cost.memberId);
    setEditGrossSalary(versSaisie(cost.grossSalary));
    setEditWorkedHours(versSaisie(cost.workedHours));
    setIsEditModalOpen(true);
  };

  // Aperçu immédiat du recalcul avec les valeurs saisies (mêmes formules que
  // le tableau, qui se recalcule ensuite depuis le contrat enregistré).
  const apercuBrut = lireNombre(editGrossSalary);
  const apercuHeures = lireNombre(editWorkedHours);
  const apercuCharges = arrondi2((apercuBrut * tauxPatronal) / 100);
  const apercuTotal = arrondi2(apercuBrut + apercuCharges);
  const apercuHoraire =
    apercuHeures > 0 ? arrondi2(apercuTotal / apercuHeures) : 0;

  const confirmEdit = async () => {
    if (!selectedCost?.contract) return;
    try {
      await modifierRemuneration.mutateAsync({
        memberId: selectedCost.memberId,
        contractId: selectedCost.contract.id,
        grossSalary: apercuBrut,
        heuresMensuelles: apercuHeures,
      });
      setIsEditModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Échec de l'enregistrement du salaire : ${message}`);
    }
  };

  const enregistrerTaux = async () => {
    const valeurs: Record<string, number> = {};
    for (const [cle, saisie] of Object.entries(tauxSaisis)) {
      valeurs[cle] = Math.min(100, Math.max(0, arrondi2(lireNombre(saisie))));
    }
    try {
      if (Object.keys(valeurs).length > 0) {
        await parametres.enregistrer(valeurs);
      }
      setIsRatesModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Échec de l'enregistrement des taux : ${message}`);
    }
  };

  const somme = (choix: (c: CoutSalarie) => number) =>
    arrondi2(personnelCosts.reduce((total, c) => total + choix(c), 0));

  const totalHeures = somme((c) => c.workedHours);
  const totalCosts = {
    grossPayroll: somme((c) => c.grossSalary),
    netPayroll: somme((c) => c.netSalary),
    employerContributions: somme((c) => c.employerContributions),
    totalEmployerCost: somme((c) => c.totalEmployerCost),
    // Coût moyen pondéré : coût total ÷ heures totales (et non moyenne des taux).
    avgCostPerHour:
      totalHeures > 0
        ? arrondi2(somme((c) => c.totalEmployerCost) / totalHeures)
        : 0,
  };
  const partNet =
    totalCosts.grossPayroll > 0
      ? Math.round((totalCosts.netPayroll / totalCosts.grossPayroll) * 1000) /
        10
      : 0;

  // Répartition par poste (le module n'a pas de notion de service).
  const parPoste = Object.entries(
    personnelCosts.reduce<
      Record<string, { count: number; totalCost: number; heures: number }>
    >((acc, c) => {
      const groupe = (acc[c.poste] ??= { count: 0, totalCost: 0, heures: 0 });
      groupe.count += 1;
      groupe.totalCost += c.totalEmployerCost;
      groupe.heures += c.workedHours;
      return acc;
    }, {}),
  ).sort((a, b) => b[1].totalCost - a[1].totalCost);

  const sansContrat = personnelCosts.filter((c) => !c.contract).length;

  const columns: ColumnDef<CoutSalarie>[] = [
    {
      key: "employee",
      label: "Employé",
      icon: Users,
      sortable: true,
      sortValue: (cost) => cost.employeeName,
      render: (cost) => (
        <div>
          <div className="font-medium">{cost.employeeName}</div>
          <div className="text-sm text-muted-foreground">
            {cost.matricule || cost.poste}
          </div>
          {!cost.contract && (
            <Badge variant="outline" className="mt-1 text-xs">
              Sans contrat actif
            </Badge>
          )}
          {cost.brutManquant && (
            <Badge variant="outline" className="mt-1 text-xs">
              Salaire à renseigner
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "grossSalary",
      label: "Salaire brut",
      icon: Euro,
      sortable: true,
      sortValue: (cost) => cost.grossSalary,
      render: (cost) => (
        <span className="font-medium">{formaterEuros(cost.grossSalary)}</span>
      ),
    },
    {
      key: "netSalary",
      label: "Salaire net",
      sortable: true,
      sortValue: (cost) => cost.netSalary,
      render: (cost) => <span>{formaterEuros(cost.netSalary)}</span>,
    },
    {
      key: "employeeContributions",
      label: "Charges salariales",
      sortable: true,
      sortValue: (cost) => cost.employeeContributions,
      render: (cost) => (
        <span>{formaterEuros(cost.employeeContributions)}</span>
      ),
    },
    {
      key: "employerContributions",
      label: "Charges patronales",
      sortable: true,
      sortValue: (cost) => cost.employerContributions,
      render: (cost) => (
        <span>{formaterEuros(cost.employerContributions)}</span>
      ),
    },
    {
      key: "totalEmployerCost",
      label: "Coût total employeur",
      sortable: true,
      sortValue: (cost) => cost.totalEmployerCost,
      render: (cost) => (
        <span className="font-semibold text-primary">
          {formaterEuros(cost.totalEmployerCost)}
        </span>
      ),
    },
    {
      key: "workedHours",
      label: "Heures mensuelles",
      sortable: true,
      sortValue: (cost) => cost.workedHours,
      render: (cost) => (
        <span>
          {formaterNombre(cost.workedHours)} h
          {cost.heuresEstimees && (
            <span className="text-xs text-muted-foreground"> (35 h)</span>
          )}
        </span>
      ),
    },
    {
      key: "costPerHour",
      label: "Coût/heure",
      icon: Calculator,
      sortable: true,
      sortValue: (cost) => cost.costPerHour,
      render: (cost) => (
        <Badge variant="outline" className="font-mono">
          {cost.costPerHour.toFixed(2)} €/h
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (cost) => (
        <RowActionsMenu
          onView={() => handleViewDetails(cost)}
          onEdit={() => handleEdit(cost)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Analyse des coûts salariaux
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Coûts par employé, charges sociales et analyse par heure travaillée
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setTauxSaisis({});
              setIsRatesModalOpen(true);
            }}
          >
            <Settings className="h-4 w-4" />
            Taux de charges
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {(sansContrat > 0 || contratsEnErreur > 0) && !isLoading && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {sansContrat > 0 &&
              `${sansContrat} salarié${sansContrat > 1 ? "s" : ""} sans contrat actif : leur salaire brut n'est pas connu (0 €). Renseignez le contrat dans leur fiche, onglet Contrats. `}
            {contratsEnErreur > 0 &&
              `${contratsEnErreur} contrat${contratsEnErreur > 1 ? "s" : ""} n'ont pas pu être chargés.`}
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <InfoCardContainer>
        <InfoCard
          icon={Euro}
          title="Masse salariale brute"
          value={formaterEuros(totalCosts.grossPayroll)}
          subtext={`${personnelCosts.length} salarié${personnelCosts.length > 1 ? "s" : ""}`}
          color="green"
        />

        <InfoCard
          icon={Euro}
          title="Masse salariale nette"
          value={formaterEuros(totalCosts.netPayroll)}
          subtext={`${formaterNombre(partNet)} % de la masse brute`}
          color="blue"
        />

        <InfoCard
          icon={Euro}
          title="Charges patronales"
          value={formaterEuros(totalCosts.employerContributions)}
          subtext={`Taux estimé : ${formaterNombre(tauxPatronal)} %`}
          color="orange"
        />

        <InfoCard
          icon={Euro}
          title="Coût total employeur"
          value={formaterEuros(totalCosts.totalEmployerCost)}
          subtext="Brut + charges patronales"
          color="purple"
        />

        <InfoCard
          icon={Calculator}
          title="Coût moyen / heure"
          value={formaterEuros(totalCosts.avgCostPerHour)}
          subtext="Coût total ÷ heures mensuelles"
          color="gray"
        />
      </InfoCardContainer>

      {/* Répartition par poste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Répartition par poste
          </CardTitle>
        </CardHeader>
        <CardContent>
          {parPoste.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Chargement…" : "Aucun salarié à analyser."}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {parPoste.map(([poste, data], index) => {
                const colors = couleursPostes[index % couleursPostes.length];
                const moyenne =
                  data.heures > 0 ? arrondi2(data.totalCost / data.heures) : 0;
                return (
                  <div
                    key={poste}
                    className={`rounded-lg border p-4 ${colors.bg} ${colors.border}`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className={`h-4 w-4 ${colors.icon}`} />
                        <h4 className={`font-semibold ${colors.text}`}>
                          {poste}
                        </h4>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        {data.count} employé{data.count !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Coût total
                        </span>
                        <span className="font-semibold">
                          {formaterEuros(data.totalCost)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Coût moyen / h
                        </span>
                        <Badge variant="secondary" className="font-mono">
                          {moyenne.toFixed(2)} €/h
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="text-sm text-muted-foreground">
                          Coût / employé
                        </span>
                        <span className="text-sm font-medium">
                          {formaterEuros(data.totalCost / data.count)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 5 costs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5" />
            Top 5 coûts les plus élevés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {personnelCosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Chargement…" : "Aucun salarié à analyser."}
            </p>
          ) : (
            <div className="space-y-3">
              {[...personnelCosts]
                .sort((a, b) => b.totalEmployerCost - a.totalEmployerCost)
                .slice(0, 5)
                .map((cost, index) => {
                  const colors = [
                    "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30",
                    "border-gray-300 bg-gray-50 dark:bg-gray-950/30",
                    "border-orange-300 bg-orange-50 dark:bg-orange-950/30",
                    "border-blue-200 bg-blue-50 dark:bg-blue-950/30",
                    "border-green-200 bg-green-50 dark:bg-green-950/30",
                  ];
                  const rankColors = [
                    "text-yellow-600 dark:text-yellow-400",
                    "text-gray-500 dark:text-gray-400",
                    "text-orange-600 dark:text-orange-400",
                    "text-blue-600 dark:text-blue-400",
                    "text-green-600 dark:text-green-400",
                  ];
                  return (
                    <div
                      key={cost.memberId}
                      className={`flex items-center justify-between rounded-lg border-2 p-4 ${colors[index]}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
                          <span
                            className={`text-lg font-bold ${rankColors[index]}`}
                          >
                            #{index + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{cost.employeeName}</div>
                          <div className="text-sm text-muted-foreground">
                            {cost.matricule || cost.poste}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {cost.costPerHour.toFixed(2)} €/h
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formaterNombre(cost.workedHours)} h
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {formaterEuros(cost.totalEmployerCost)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Brut : {formaterEuros(cost.grossSalary)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Charges : {formaterEuros(cost.employerContributions)}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Détail par employé</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            onRowClick={handleViewDetails}
            data={personnelCosts}
            isLoading={isLoading}
            columns={columns}
            searchKeys={["employeeName", "matricule"]}
            getSearchValue={(cost) => `${cost.employeeName} ${cost.matricule}`}
            searchPlaceholder="Rechercher par nom ou numéro d'employé..."
            getRowId={(cost) => cost.memberId}
          />
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Modal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        type="details"
        title="Voir le coût salarial"
        size="lg"
        actions={
          selectedCost
            ? {
                primary: {
                  label: "Modifier",
                  onClick: () => {
                    setIsDetailsModalOpen(false);
                    handleEdit(selectedCost);
                  },
                },
              }
            : undefined
        }
      >
        {selectedCost && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Employé</Label>
                <p className="text-sm text-muted-foreground">
                  <Link
                    href={`/dashboard/hr/collaborators/${selectedCost.memberId}`}
                    className="text-primary hover:underline"
                  >
                    {selectedCost.employeeName}
                  </Link>{" "}
                  {selectedCost.matricule && `(${selectedCost.matricule})`}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Période</Label>
                <p className="text-sm capitalize text-muted-foreground">
                  {selectedCost.period}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Salaire brut</Label>
                <p className="font-mono text-sm">
                  {formaterEuros(selectedCost.grossSalary)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Salaire net</Label>
                <p className="font-mono text-sm">
                  {formaterEuros(selectedCost.netSalary)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Charges employeur</Label>
                <p className="font-mono text-sm">
                  {formaterEuros(selectedCost.employerContributions)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  Coût total employeur
                </Label>
                <p className="font-mono text-sm">
                  {formaterEuros(selectedCost.totalEmployerCost)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Heures mensuelles</Label>
                <p className="font-mono text-sm">
                  {formaterNombre(selectedCost.workedHours)} h
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Coût par heure</Label>
                <p className="font-mono text-sm">
                  {selectedCost.costPerHour.toFixed(2)} €/h
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {selectedCost.contract
                ? `Salaire issu du contrat ${selectedCost.contract.type} actif (${selectedCost.poste}). Charges estimées : patronales ${formaterNombre(tauxPatronal)} %, salariales ${formaterNombre(tauxSalarial)} %.`
                : "Aucun contrat actif : renseignez-le dans la fiche salarié, onglet Contrats."}
            </p>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        type="form"
        title="Modifier le coût salarial"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsEditModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: "Enregistrer",
            onClick: confirmEdit,
            loading: modifierRemuneration.isPending,
            disabled: !selectedCost?.contract || apercuBrut <= 0,
          },
        }}
      >
        {selectedCost && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/30 p-4">
              <h4 className="font-medium">{selectedCost.employeeName}</h4>
              <p className="text-sm text-muted-foreground">
                {selectedCost.matricule || selectedCost.poste}
              </p>
            </div>

            {!selectedCost.contract ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                Ce salarié n&apos;a pas de contrat actif : le salaire est lu
                dans le contrat.{" "}
                <Link
                  href={`/dashboard/hr/collaborators/${selectedCost.memberId}`}
                  className="font-medium underline"
                >
                  Ouvrir sa fiche
                </Link>{" "}
                pour créer le contrat.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-gross-salary">
                      Salaire brut mensuel (€)
                    </Label>
                    <Input
                      id="edit-gross-salary"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editGrossSalary}
                      onChange={(e) => setEditGrossSalary(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-worked-hours">Heures mensuelles</Label>
                    <Input
                      id="edit-worked-hours"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editWorkedHours}
                      onChange={(e) => setEditWorkedHours(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enregistré dans le contrat en heures par semaine (
                      {formaterNombre(
                        apercuHeures / HEURES_PAR_SEMAINE_EN_MOIS,
                      )}{" "}
                      h).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 rounded-lg border p-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Charges patronales ({formaterNombre(tauxPatronal)} %)
                    </div>
                    <div className="font-mono">
                      {formaterEuros(apercuCharges)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Coût total employeur
                    </div>
                    <div className="font-mono font-semibold">
                      {formaterEuros(apercuTotal)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Coût / heure
                    </div>
                    <div className="font-mono">
                      {apercuHoraire.toFixed(2)} €/h
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Taux de charges */}
      <Modal
        open={isRatesModalOpen}
        onOpenChange={setIsRatesModalOpen}
        type="form"
        title="Taux de charges"
        description="Estimation appliquée au salaire brut des contrats pour calculer charges, net et coût employeur. Ajustez-les à votre situation (réductions générales, prévoyance…)."
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setIsRatesModalOpen(false),
            variant: "outline",
          },
          primary: {
            label: "Enregistrer",
            onClick: enregistrerTaux,
            loading: parametres.enCours,
            disabled: Object.keys(tauxSaisis).length === 0,
          },
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Charges patronales (% du brut)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={tauxSaisis[CLE_TAUX_PATRONAL] ?? versSaisie(tauxPatronal)}
              onChange={(e) =>
                setTauxSaisis((prev) => ({
                  ...prev,
                  [CLE_TAUX_PATRONAL]: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Charges salariales (% du brut)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={tauxSaisis[CLE_TAUX_SALARIAL] ?? versSaisie(tauxSalarial)}
              onChange={(e) =>
                setTauxSaisis((prev) => ({
                  ...prev,
                  [CLE_TAUX_SALARIAL]: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
