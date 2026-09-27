"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoCard } from "@/components/ui/info-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Euro,
  Calendar,
  AlertTriangle,
  UserCheck,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getPayrollSocialReport } from "@/data/payroll-social-report";
import { PayrollSocialReport } from "@/lib/types";

const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#295F8E",
  male: "#3b82f6",
  female: "#ec4899",
  cdi: "#22c55e",
  cdd: "#f59e0b",
  apprentice: "#8b5cf6",
  interim: "#295F8E",
};

export default function PayrollSocialReportPage() {
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(
    undefined,
  );
  const [report, setReport] = useState<PayrollSocialReport>(
    getPayrollSocialReport(2024),
  );

  const handlePeriodChange = (year: number, month?: number) => {
    setSelectedMonth(month);
    setReport(getPayrollSocialReport(year, month));
  };

  const handleExport = () => {
    console.log("Exporting social report...");
    alert("Export en cours... (fonctionnalité à implémenter)");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Chart data transformations
  const genderChartData = [
    {
      name: "Hommes",
      value: report.demographics.byGender.male,
      fill: COLORS.male,
    },
    {
      name: "Femmes",
      value: report.demographics.byGender.female,
      fill: COLORS.female,
    },
  ];

  const ageChartData = report.demographics.byAge.map((item) => ({
    tranche: item.range,
    effectif: item.count,
  }));

  const seniorityChartData = report.demographics.bySeniority.map((item) => ({
    anciennete: item.range,
    effectif: item.count,
  }));

  const contractTypeChartData = [
    {
      name: "CDI",
      value: report.demographics.byContractType.cdi,
      fill: COLORS.cdi,
    },
    {
      name: "CDD",
      value: report.demographics.byContractType.cdd,
      fill: COLORS.cdd,
    },
    {
      name: "Apprentis",
      value: report.demographics.byContractType.apprentices,
      fill: COLORS.apprentice,
    },
    {
      name: "Intérim",
      value: report.demographics.byContractType.interim,
      fill: COLORS.interim,
    },
  ];

  const absenceTypeChartData = report.absences.byType.map((item) => ({
    type: item.label,
    jours: item.days,
    cout: item.cost,
  }));

  const hourlyCostChartData = report.costAnalysis.hourlyCostByCategory.map(
    (item) => ({
      categorie: item.category,
      cout: item.cost,
    }),
  );

  const turnoverBySiteData = report.turnover.bySite.map((item) => ({
    site: item.siteName,
    taux: item.rate,
  }));

  const exitReasonsData = report.turnover.exitReasons.map((item) => ({
    motif: item.reason,
    nombre: item.count,
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bilan Social Automatique</h1>
          <p className="text-muted-foreground mt-1">
            Analyse complète des indicateurs sociaux et de la masse salariale
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Période :</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant={!selectedMonth ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange(2024)}
            >
              Année 2024
            </Button>
            <Button
              variant={selectedMonth === 12 ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodChange(2024, 12)}
            >
              Décembre 2024
            </Button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Généré le{" "}
              {report.generatedAt.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="masses">Masses & Coûts</TabsTrigger>
          <TabsTrigger value="demographics">Démographie</TabsTrigger>
          <TabsTrigger value="turnover">Turnover</TabsTrigger>
          <TabsTrigger value="absences">Absences & AT</TabsTrigger>
          <TabsTrigger value="comparison">Comparatif N/N-1</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              title="Effectif Total"
              value={report.demographics.total.toString()}
              icon={Users}
              color="blue"
              subtext={
                report.comparison
                  ? `${report.comparison.headcountEvolution > 0 ? "+" : ""}${report.comparison.headcountEvolution} vs année précédente`
                  : undefined
              }
            />
            <InfoCard
              title="Masse Salariale Brute"
              value={formatCurrency(report.masses.grossTotal)}
              icon={Euro}
              color="green"
              subtext={
                report.comparison
                  ? `+${formatPercentage(report.comparison.grossMassEvolutionPercentage)} vs année précédente`
                  : undefined
              }
            />
            <InfoCard
              title="Coût Employeur"
              value={formatCurrency(report.masses.totalEmployerCost)}
              icon={TrendingUp}
              color="purple"
              subtext={
                report.comparison
                  ? `+${formatPercentage(report.comparison.totalCostEvolutionPercentage)} vs année précédente`
                  : undefined
              }
            />
            <InfoCard
              title="Coût Horaire Moyen"
              value={`${report.costAnalysis.averageHourlyCost.toFixed(2)} €/h`}
              icon={TrendingUp}
              color="orange"
              subtext={
                report.comparison
                  ? `+${formatPercentage(report.comparison.hourlyCostEvolutionPercentage)} vs année précédente`
                  : undefined
              }
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Gender Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Répartition Hommes / Femmes
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genderChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS.male }}
                  />
                  <span className="text-sm">
                    {report.demographics.byGender.male} hommes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS.female }}
                  />
                  <span className="text-sm">
                    {report.demographics.byGender.female} femmes
                  </span>
                </div>
              </div>
            </Card>

            {/* Contract Types */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Répartition par Type de Contrat
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={contractTypeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {contractTypeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Turnover Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Turnover & Mouvements
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Taux de turnover
                  </span>
                  <Badge variant="outline" className="text-base">
                    {formatPercentage(report.turnover.globalRate)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Entrées</span>
                  <span className="text-lg font-semibold text-green-600">
                    +{report.turnover.entries}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sorties</span>
                  <span className="text-lg font-semibold text-red-600">
                    -{report.turnover.exits}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Solde net</span>
                  <span
                    className={`text-lg font-bold ${
                      report.turnover.entries - report.turnover.exits >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {report.turnover.entries - report.turnover.exits >= 0
                      ? "+"
                      : ""}
                    {report.turnover.entries - report.turnover.exits}
                  </span>
                </div>
              </div>
            </Card>

            {/* Absences Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Absences & AT</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Taux d&apos;absence global
                  </span>
                  <Badge
                    variant={
                      report.absences.globalRate > 5 ? "destructive" : "outline"
                    }
                  >
                    {formatPercentage(report.absences.globalRate)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total jours d&apos;absence
                  </span>
                  <span className="text-lg font-semibold">
                    {report.absences.totalDays}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Accidents du travail
                  </span>
                  <span className="text-lg font-semibold text-orange-600">
                    {report.workAccidents.total}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Coût total</span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(report.absences.totalCost)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Masses & Costs Tab */}
        <TabsContent value="masses" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <InfoCard
              title="Masse Salariale Brute"
              value={formatCurrency(report.masses.grossTotal)}
              icon={Euro}
              color="green"
            />
            <InfoCard
              title="Masse Salariale Nette"
              value={formatCurrency(report.masses.netTotal)}
              icon={Euro}
              color="blue"
            />
            <InfoCard
              title="Net Imposable"
              value={formatCurrency(report.masses.netTaxable)}
              icon={Euro}
              color="purple"
            />
            <InfoCard
              title="Charges Patronales"
              value={formatCurrency(report.masses.employerContributions)}
              icon={TrendingUp}
              color="orange"
            />
            <InfoCard
              title="Charges Salariales"
              value={formatCurrency(report.masses.employeeContributions)}
              icon={TrendingUp}
              color="red"
            />
            <InfoCard
              title="Coût Total Employeur"
              value={formatCurrency(report.masses.totalEmployerCost)}
              icon={TrendingUp}
              color="blue"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Salaires Moyens par Catégorie
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Salaire brut moyen</span>
                  <span className="font-semibold">
                    {formatCurrency(report.costAnalysis.averageGrossSalary)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Salaire net moyen</span>
                  <span className="font-semibold">
                    {formatCurrency(report.costAnalysis.averageNetSalary)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">
                    Coût employeur moyen
                  </span>
                  <span className="font-bold text-lg">
                    {formatCurrency(report.costAnalysis.averageEmployerCost)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Coût Horaire</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Coût horaire moyen
                  </span>
                  <Badge variant="outline" className="text-base">
                    {report.costAnalysis.averageHourlyCost.toFixed(2)} €/h
                  </Badge>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={hourlyCostChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="categorie"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cout" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              title="Effectif Total"
              value={report.demographics.total.toString()}
              icon={Users}
              color="blue"
            />
            <InfoCard
              title="CDI"
              value={report.demographics.byContractType.cdi.toString()}
              icon={UserCheck}
              color="green"
            />
            <InfoCard
              title="CDD"
              value={report.demographics.byContractType.cdd.toString()}
              icon={UserCheck}
              color="orange"
            />
            <InfoCard
              title="Apprentis"
              value={report.demographics.byContractType.apprentices.toString()}
              icon={UserCheck}
              color="purple"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Répartition par Âge
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tranche" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="effectif" fill={COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Répartition par Ancienneté
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={seniorityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="anciennete" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="effectif" fill={COLORS.secondary} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Répartition par Statut
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Agents</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (report.demographics.byStatus.agent /
                              report.demographics.total) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">
                      {report.demographics.byStatus.agent}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Administratifs</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (report.demographics.byStatus.administrative /
                              report.demographics.total) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">
                      {report.demographics.byStatus.administrative}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cadres</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (report.demographics.byStatus.manager /
                              report.demographics.total) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">
                      {report.demographics.byStatus.manager}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contrats CDD</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total CDD
                  </span>
                  <span className="text-lg font-semibold">
                    {report.contracts.cddCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    CDD renouvelés
                  </span>
                  <span className="text-lg font-semibold">
                    {report.contracts.cddRenewed}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Durée moyenne</span>
                  <Badge variant="outline">
                    {report.contracts.averageCddDuration.toFixed(1)} mois
                  </Badge>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Distribution des durées :
                  </p>
                  <div className="space-y-1">
                    {report.contracts.durationDistribution.map((d) => (
                      <div
                        key={d.range}
                        className="flex items-center justify-between text-xs"
                      >
                        <span>{d.range}</span>
                        <span className="font-medium">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Turnover Tab */}
        <TabsContent value="turnover" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              title="Taux de Turnover"
              value={formatPercentage(report.turnover.globalRate)}
              icon={TrendingUp}
              color={report.turnover.globalRate > 25 ? "red" : "orange"}
            />
            <InfoCard
              title="Entrées"
              value={report.turnover.entries.toString()}
              icon={Users}
              color="green"
            />
            <InfoCard
              title="Sorties"
              value={report.turnover.exits.toString()}
              icon={Users}
              color="red"
            />
            <InfoCard
              title="Solde Net"
              value={`${
                report.turnover.entries - report.turnover.exits >= 0 ? "+" : ""
              }${report.turnover.entries - report.turnover.exits}`}
              icon={Users}
              color={
                report.turnover.entries - report.turnover.exits >= 0
                  ? "green"
                  : "red"
              }
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Turnover par Site</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={turnoverBySiteData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="site" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="taux" fill={COLORS.warning} name="Taux (%)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Turnover par Type de Contrat
              </h3>
              <div className="space-y-4">
                {report.turnover.byContractType.map((item) => (
                  <div key={item.contractType} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {item.contractType}
                      </span>
                      <Badge
                        variant={item.rate > 30 ? "destructive" : "outline"}
                      >
                        {formatPercentage(item.rate)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Entrées: {item.entries}</span>
                      <span>Sorties: {item.exits}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Motifs de Départ</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={exitReasonsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="motif"
                    type="category"
                    width={150}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="nombre" fill={COLORS.danger} name="Nombre" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Détail des Mouvements
              </h3>
              <div className="space-y-3">
                <div className="border-b pb-3">
                  <p className="text-xs text-muted-foreground mb-2">Par site</p>
                  {report.turnover.bySite.map((site) => (
                    <div
                      key={site.siteId}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm">{site.siteName}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-600">+{site.entries}</span>
                        <span className="text-red-600">-{site.exits}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Absences Tab */}
        <TabsContent value="absences" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              title="Taux d'Absence"
              value={formatPercentage(report.absences.globalRate)}
              icon={AlertTriangle}
              color={report.absences.globalRate > 5 ? "red" : "orange"}
            />
            <InfoCard
              title="Jours d'Absence"
              value={report.absences.totalDays.toString()}
              icon={Calendar}
              color="blue"
            />
            <InfoCard
              title="Coût Total"
              value={formatCurrency(report.absences.totalCost)}
              icon={Euro}
              color="red"
            />
            <InfoCard
              title="Durée Moyenne"
              value={`${report.absences.averageDuration.toFixed(1)} jours`}
              icon={Calendar}
              color="purple"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Absences par Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={absenceTypeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="type"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="jours" fill={COLORS.warning} name="Jours" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Coût des Absences par Type
              </h3>
              <div className="space-y-3">
                {report.absences.byType.map((item) => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.days} jours • Taux: {formatPercentage(item.rate)}
                      </p>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(item.cost)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <p className="text-sm font-medium">Coût direct</p>
                    <p className="text-xs text-muted-foreground">
                      Remplacement & indemnités
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(report.absences.directCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Coût indirect</p>
                    <p className="text-xs text-muted-foreground">
                      Perte de productivité
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(report.absences.indirectCost)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Accidents du Travail</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Total accidents
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {report.workAccidents.total}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Avec arrêt</p>
                <p className="text-2xl font-bold text-red-600">
                  {report.workAccidents.withStoppage}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Sans arrêt</p>
                <p className="text-2xl font-bold text-green-600">
                  {report.workAccidents.withoutStoppage}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Durée moyenne arrêt
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {report.workAccidents.averageStoppageDays} j
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Taux de fréquence</span>
                <Badge variant="outline">
                  {report.workAccidents.frequencyRate.toFixed(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Taux de gravité</span>
                <Badge variant="outline">
                  {report.workAccidents.gravityRate.toFixed(2)}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Coût total</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(report.workAccidents.cost)}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          {report.comparison ? (
            <>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Évolution Année {report.comparison.previousYear} → Année{" "}
                  {report.comparison.currentYear}
                </h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Masse Salariale Brute
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">
                        {formatCurrency(report.comparison.grossMassEvolution)}
                      </span>
                      <Badge
                        variant={
                          report.comparison.grossMassEvolutionPercentage > 0
                            ? "default"
                            : "destructive"
                        }
                      >
                        {report.comparison.grossMassEvolutionPercentage > 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {formatPercentage(
                          Math.abs(
                            report.comparison.grossMassEvolutionPercentage,
                          ),
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Charges Patronales
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">
                        {formatCurrency(
                          report.comparison.employerContributionsEvolution,
                        )}
                      </span>
                      <Badge
                        variant={
                          report.comparison
                            .employerContributionsEvolutionPercentage > 0
                            ? "default"
                            : "destructive"
                        }
                      >
                        {report.comparison
                          .employerContributionsEvolutionPercentage > 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {formatPercentage(
                          Math.abs(
                            report.comparison
                              .employerContributionsEvolutionPercentage,
                          ),
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Charges Salariales
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">
                        {formatCurrency(
                          report.comparison.employeeContributionsEvolution,
                        )}
                      </span>
                      <Badge
                        variant={
                          report.comparison
                            .employeeContributionsEvolutionPercentage > 0
                            ? "default"
                            : "destructive"
                        }
                      >
                        {report.comparison
                          .employeeContributionsEvolutionPercentage > 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {formatPercentage(
                          Math.abs(
                            report.comparison
                              .employeeContributionsEvolutionPercentage,
                          ),
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Coût Total Employeur
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">
                        {formatCurrency(report.comparison.totalCostEvolution)}
                      </span>
                      <Badge
                        variant={
                          report.comparison.totalCostEvolutionPercentage > 0
                            ? "default"
                            : "destructive"
                        }
                      >
                        {report.comparison.totalCostEvolutionPercentage > 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {formatPercentage(
                          Math.abs(
                            report.comparison.totalCostEvolutionPercentage,
                          ),
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Coût Horaire
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">
                        {report.comparison.hourlyCostEvolution > 0 ? "+" : ""}
                        {report.comparison.hourlyCostEvolution.toFixed(2)} €/h
                      </span>
                      <Badge
                        variant={
                          report.comparison.hourlyCostEvolutionPercentage > 0
                            ? "default"
                            : "destructive"
                        }
                      >
                        {report.comparison.hourlyCostEvolutionPercentage > 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {formatPercentage(
                          Math.abs(
                            report.comparison.hourlyCostEvolutionPercentage,
                          ),
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Effectif
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">
                        {report.comparison.headcountEvolution > 0 ? "+" : ""}
                        {report.comparison.headcountEvolution}
                      </span>
                      <Badge
                        variant={
                          report.comparison.headcountEvolutionPercentage > 0
                            ? "default"
                            : "destructive"
                        }
                      >
                        {report.comparison.headcountEvolutionPercentage > 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3" />
                        )}
                        {formatPercentage(
                          Math.abs(
                            report.comparison.headcountEvolutionPercentage,
                          ),
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Évolution des Masses Salariales
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      {
                        annee: report.comparison.previousYear.toString(),
                        brute:
                          report.masses.grossTotal -
                          report.comparison.grossMassEvolution,
                        employeur:
                          report.masses.totalEmployerCost -
                          report.comparison.totalCostEvolution,
                      },
                      {
                        annee: report.comparison.currentYear.toString(),
                        brute: report.masses.grossTotal,
                        employeur: report.masses.totalEmployerCost,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="annee" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="brute"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      name="Masse brute"
                    />
                    <Line
                      type="monotone"
                      dataKey="employeur"
                      stroke={COLORS.secondary}
                      strokeWidth={2}
                      name="Coût employeur"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucune donnée comparative disponible
              </h3>
              <p className="text-muted-foreground">
                Les données de l&apos;année précédente ne sont pas disponibles
                pour établir une comparaison.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
