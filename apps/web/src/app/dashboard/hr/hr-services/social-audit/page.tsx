"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import {
  Download,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  Briefcase,
  GraduationCap,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Building2,
  MapPin,
} from "lucide-react";
import { mockEmployees } from "@/data/employees";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";

interface SocialReportData {
  year: number;
  employeeDistribution: {
    total: number;
    byGender: { male: number; female: number; nonDisclosed: number };
    byAge: { "18-25": number; "26-35": number; "36-50": number; "50+": number };
    bySeniority: { "0-1": number; "1-3": number; "3-5": number; "5+": number };
  };
  contracts: {
    cdi: number;
    cdd: number;
    apprentices: number;
    cddRenewed: number;
    averageCddDuration: number;
  };
  turnover: {
    entries: number;
    exits: number;
    globalRate: number;
    bySite: Record<string, number>;
    byContractType: Record<string, number>;
  };
  absences: {
    totalDays: number;
    byType: {
      maladie: number;
      accidentTravail: number;
      conges: number;
      autres: number;
    };
    averageDuration: number;
    cost: number;
  };
  payroll: {
    grossTotal: number;
    netTotal: number;
    employerContributions: number;
    employeeContributions: number;
    totalCost: number;
    averageGross: number;
    averageNet: number;
  };
  genderPayGap: {
    averageMaleGross: number;
    averageFemaleGross: number;
    gap: number;
    gapPercentage: number;
  };
  training: {
    totalExpenses: number;
    participants: number;
    hours: number;
  };
  hourlyCost: {
    average: number;
    byCategory: Record<string, number>;
  };
  comparison: {
    previousYear: number;
    evolution: number;
    evolutionPercentage: number;
  };
}

const generateMockReport = (year: number): SocialReportData => {
  const employees = mockEmployees;
  const total = employees.length;

  return {
    year,
    employeeDistribution: {
      total,
      byGender: {
        male: Math.floor(total * 0.58),
        female: Math.floor(total * 0.33),
        nonDisclosed: Math.max(
          0,
          total - Math.floor(total * 0.58) - Math.floor(total * 0.33),
        ),
      },
      byAge: {
        "18-25": Math.floor(total * 0.15),
        "26-35": Math.floor(total * 0.4),
        "36-50": Math.floor(total * 0.35),
        "50+": Math.floor(total * 0.1),
      },
      bySeniority: {
        "0-1": Math.floor(total * 0.2),
        "1-3": Math.floor(total * 0.35),
        "3-5": Math.floor(total * 0.25),
        "5+": Math.floor(total * 0.2),
      },
    },
    contracts: {
      cdi: Math.floor(total * 0.7),
      cdd: Math.floor(total * 0.25),
      apprentices: Math.floor(total * 0.05),
      cddRenewed: Math.floor(total * 0.15),
      averageCddDuration: 8.5,
    },
    turnover: {
      entries: 12,
      exits: 8,
      globalRate: 12.5,
      bySite: {
        "Site A": 15.2,
        "Site B": 10.5,
        "Site C": 11.8,
      },
      byContractType: {
        CDI: 5.2,
        CDD: 25.8,
      },
    },
    absences: {
      totalDays: 450,
      byType: {
        maladie: 180,
        accidentTravail: 45,
        conges: 200,
        autres: 25,
      },
      averageDuration: 8.5,
      cost: 125000,
    },
    payroll: {
      grossTotal: 2450000,
      netTotal: 1950000,
      employerContributions: 735000,
      employeeContributions: 245000,
      totalCost: 3185000,
      averageGross: 2450,
      averageNet: 1950,
    },
    genderPayGap: {
      averageMaleGross: 2550,
      averageFemaleGross: 2300,
      gap: 250,
      gapPercentage: 9.8,
    },
    training: {
      totalExpenses: 45000,
      participants: 35,
      hours: 280,
    },
    hourlyCost: {
      average: 18.5,
      byCategory: {
        Agent: 16.2,
        "Chef de poste": 20.5,
        Superviseur: 25.8,
      },
    },
    comparison: {
      previousYear: 2300000,
      evolution: 150000,
      evolutionPercentage: 6.5,
    },
  };
};

// Palette de couleurs modernes
const COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  indigo: "#4f46e5",
  violet: "#7c3aed",
};

const GRADIENT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
];

const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#fb7185",
  "#f59e0b",
];

const STATUS_COLORS = {
  good: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

export default function SocialReportPage() {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [report, setReport] = useState<SocialReportData>(
    generateMockReport(2024),
  );

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year);
    setSelectedYear(yearNum);
    setReport(generateMockReport(yearNum));
  };

  const handleExport = () => {
    alert(`Export du bilan social ${selectedYear} en cours...`);
  };

  // Préparation des données pour les graphiques
  const genderData = [
    { name: "Hommes", value: report.employeeDistribution.byGender.male },
    { name: "Femmes", value: report.employeeDistribution.byGender.female },
    {
      name: "Non communiqué",
      value: report.employeeDistribution.byGender.nonDisclosed,
    },
  ];

  const ageData = Object.entries(report.employeeDistribution.byAge).map(
    ([age, count]) => ({
      age: `${age} ans`,
      effectif: count,
    }),
  );

  const seniorityData = Object.entries(
    report.employeeDistribution.bySeniority,
  ).map(([range, count]) => ({
    anciennete: `${range} ans`,
    effectif: count,
  }));

  const contractData = [
    { name: "CDI", value: report.contracts.cdi },
    { name: "CDD", value: report.contracts.cdd },
    { name: "Apprentis", value: report.contracts.apprentices },
  ];

  const absenceData = Object.entries(report.absences.byType).map(
    ([type, days]) => ({
      type:
        type === "maladie"
          ? "Maladie"
          : type === "accidentTravail"
          ? "Accident travail"
          : type === "conges"
          ? "Congés"
          : "Autres",
      jours: days,
    }),
  );

  const hourlyCostData = Object.entries(report.hourlyCost.byCategory).map(
    ([category, cost]) => ({
      categorie: category,
      cout: cost,
    }),
  );

  const payrollComparisonData = [
    {
      annee: `${selectedYear - 1}`,
      masseSalariale: report.comparison.previousYear,
    },
    { annee: `${selectedYear}`, masseSalariale: report.payroll.grossTotal },
  ];

  const genderPayGapData = [
    {
      genre: "Hommes",
      salaire: report.genderPayGap.averageMaleGross,
      fill: "#6366f1",
    },
    {
      genre: "Femmes",
      salaire: report.genderPayGap.averageFemaleGross,
      fill: "#ec4899",
    },
  ];

  // Données pour le graphique radar
  const radarData = [
    {
      subject: "Effectif",
      value: 85,
      fullMark: 100,
    },
    {
      subject: "Formation",
      value: 70,
      fullMark: 100,
    },
    {
      subject: "Turnover",
      value: 55,
      fullMark: 100,
    },
    {
      subject: "Absentéisme",
      value: 65,
      fullMark: 100,
    },
    {
      subject: "Salaire moyen",
      value: 80,
      fullMark: 100,
    },
    {
      subject: "Parité",
      value: 60,
      fullMark: 100,
    },
  ];

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 min-h-screen">
      {/* Header avec design moderne */}
      {/* Header - Design professionnel bleu marine */}
<div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 p-8 text-white shadow-xl border border-slate-600/30">
  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
  <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
  <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
  <div className="absolute right-1/3 top-1/2 h-32 w-32 rounded-full bg-blue-400/5 blur-2xl" />
  
  <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
    <div>
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-500/20 p-2.5 backdrop-blur-sm border border-blue-400/20">
          <BarChart3 className="h-7 w-7 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bilan Social Automatisé
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="inline-flex items-center gap-1.5 text-sm text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Données RH
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Paie
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Planning
            </span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-slate-300 max-w-2xl ml-1">
        Génération automatique du bilan social à partir des données RH, Paie et Planning
      </p>
    </div>
    
    <div className="flex gap-2">
      <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2024">2024</SelectItem>
          <SelectItem value="2023">2023</SelectItem>
          <SelectItem value="2022">2022</SelectItem>
        </SelectContent>
      </Select>
      <Button 
        variant="secondary" 
        onClick={handleExport}
        className="gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
      >
        <Download className="h-4 w-4" />
        Exporter
      </Button>
    </div>
  </div>
</div>

      {/* KPI Cards modernes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 transition-all" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-2">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Effectif total</span>
            </div>
            <p className="mt-2 text-3xl font-bold">
              {report.employeeDistribution.total}
            </p>
            <div className="mt-1 flex items-center gap-1 text-sm text-green-600">
              <ArrowUp className="h-3 w-3" />
              <span>+3.2% vs N-1</span>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full bg-green-500/10 blur-2xl group-hover:bg-green-500/20 transition-all" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-2">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Masse salariale</span>
            </div>
            <p className="mt-2 text-3xl font-bold">
              {report.payroll.grossTotal.toLocaleString("fr-FR")} €
            </p>
            <div className="mt-1 flex items-center gap-1 text-sm text-green-600">
              <ArrowUp className="h-3 w-3" />
              <span>+{report.comparison.evolutionPercentage}% vs N-1</span>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full bg-orange-500/10 blur-2xl group-hover:bg-orange-500/20 transition-all" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-2">
                <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Turnover</span>
            </div>
            <p className="mt-2 text-3xl font-bold">
              {report.turnover.globalRate}%
            </p>
            <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
              <ArrowUp className="h-3 w-3" />
              <span>+1.8% vs N-1</span>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-800 p-6 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
          <div className="absolute right-0 top-0 h-20 w-20 -translate-y-8 translate-x-8 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/20 transition-all" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-2">
                <GraduationCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Formation</span>
            </div>
            <p className="mt-2 text-3xl font-bold">
              {report.training.totalExpenses.toLocaleString("fr-FR")} €
            </p>
            <div className="mt-1 flex items-center gap-1 text-sm text-green-600">
              <ArrowUp className="h-3 w-3" />
              <span>+12% vs N-1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section graphiques modernes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution des effectifs */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-indigo-500/5 blur-2xl" />
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-1.5">
                <PieChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              Répartition des effectifs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => {
                        const name = (props as { name?: string }).name || "";
                        const percent =
                          (props as { percent?: number }).percent || 0;
                        return `${name} ${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={90}
                      innerRadius={45}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {genderData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {genderData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-sm font-bold">
                      {report.employeeDistribution.total}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pyramide des âges moderne */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-purple-500/5 blur-2xl" />
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-1.5">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              Pyramide des âges
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ageData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="age" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar
                    dataKey="effectif"
                    fill="url(#ageGradient)"
                    radius={[0, 8, 8, 0]}
                  >
                    <defs>
                      <linearGradient id="ageGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section contrats et turnover */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contrats */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-green-500/5 blur-2xl" />
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-1.5">
                <Briefcase className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              Types de contrats
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contractData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => {
                        const name = (props as { name?: string }).name || "";
                        const percent =
                          (props as { percent?: number }).percent || 0;
                        return `${name} ${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={90}
                      innerRadius={45}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {contractData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={[
                            "#6366f1",
                            "#8b5cf6",
                            "#a855f7",
                          ][index % 3]}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {contractData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: [
                            "#6366f1",
                            "#8b5cf6",
                            "#a855f7",
                          ][index % 3],
                        }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Durée moyenne CDD</span>
                    <span className="text-sm font-bold">
                      {report.contracts.averageCddDuration} mois
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-medium">CDD renouvelés</span>
                    <span className="text-sm font-bold">
                      {report.contracts.cddRenewed}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Turnover */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-orange-500/5 blur-2xl" />
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-1.5">
                <UserX className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              Turnover
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="text-2xl font-bold text-green-600">
                  +{report.turnover.entries}
                </div>
                <div className="text-xs text-muted-foreground">Entrées</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <div className="text-2xl font-bold text-red-600">
                  -{report.turnover.exits}
                </div>
                <div className="text-xs text-muted-foreground">Sorties</div>
              </div>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(report.turnover.bySite).map(
                  ([site, rate]) => ({ site, taux: rate })
                )}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="site" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="taux" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    <defs>
                      <linearGradient id="turnoverGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section masse salariale et écarts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Masse salariale */}
        <Card className="border-0 shadow-xl overflow-hidden lg:col-span-1">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-500/5 blur-2xl" />
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-1.5">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Masse salariale
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-xs text-muted-foreground">Brut total</div>
                <div className="text-lg font-bold">
                  {report.payroll.grossTotal.toLocaleString("fr-FR")} €
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-xs text-muted-foreground">Net total</div>
                <div className="text-lg font-bold">
                  {report.payroll.netTotal.toLocaleString("fr-FR")} €
                </div>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <div className="text-xs text-muted-foreground">Charges patronales</div>
                <div className="text-lg font-bold text-orange-600">
                  {report.payroll.employerContributions.toLocaleString("fr-FR")} €
                </div>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <div className="text-xs text-muted-foreground">Coût total employeur</div>
                <div className="text-lg font-bold text-indigo-600">
                  {report.payroll.totalCost.toLocaleString("fr-FR")} €
                </div>
              </div>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={payrollComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="annee" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                    }}
                  />
                  <defs>
                    <linearGradient id="payrollGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="masseSalariale"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="url(#payrollGradient)"
                    name="Masse salariale"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Écart salarial */}
        <Card className="border-0 shadow-xl overflow-hidden lg:col-span-1">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-pink-500/5 blur-2xl" />
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="rounded-lg bg-pink-100 dark:bg-pink-900/30 p-1.5">
                <Users className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              Écart salarial Hommes / Femmes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
                <div className="text-xs text-muted-foreground">Hommes</div>
                <div className="text-lg font-bold text-indigo-600">
                  {report.genderPayGap.averageMaleGross.toLocaleString("fr-FR")} €
                </div>
              </div>
              <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl text-center">
                <div className="text-xs text-muted-foreground">Femmes</div>
                <div className="text-lg font-bold text-pink-600">
                  {report.genderPayGap.averageFemaleGross.toLocaleString("fr-FR")} €
                </div>
              </div>
              <div className={`p-3 rounded-xl text-center ${
                report.genderPayGap.gapPercentage < 5 
                  ? "bg-green-50 dark:bg-green-900/20" 
                  : report.genderPayGap.gapPercentage < 10 
                  ? "bg-orange-50 dark:bg-orange-900/20"
                  : "bg-red-50 dark:bg-red-900/20"
              }`}>
                <div className="text-xs text-muted-foreground">Écart</div>
                <div className={`text-lg font-bold ${
                  report.genderPayGap.gapPercentage < 5 
                    ? "text-green-600" 
                    : report.genderPayGap.gapPercentage < 10 
                    ? "text-orange-600"
                    : "text-red-600"
                }`}>
                  {report.genderPayGap.gapPercentage}%
                </div>
              </div>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={genderPayGapData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="genre" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="salaire" radius={[0, 8, 8, 0]}>
                    <defs>
                      <linearGradient id="genderGapGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section absences et formation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absences */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-red-500/5 blur-2xl" />
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-1.5">
                <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Absences
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <div className="text-xs text-muted-foreground">Total jours</div>
                <div className="text-2xl font-bold">
                  {report.absences.totalDays}
                </div>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <div className="text-xs text-muted-foreground">Coût total</div>
                <div className="text-2xl font-bold text-orange-600">
                  {report.absences.cost.toLocaleString("fr-FR")} €
                </div>
              </div>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={absenceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props) => {
                      const type = (props as { type?: string }).type || "";
                      const percent =
                        (props as { percent?: number }).percent || 0;
                      return `${type} ${(percent * 100).toFixed(0)}%`;
                    }}
                    outerRadius={70}
                    innerRadius={35}
                    fill="#8884d8"
                    dataKey="jours"
                    paddingAngle={2}
                  >
                    {absenceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={[
                          "#6366f1",
                          "#8b5cf6",
                          "#a855f7",
                          "#d946ef",
                        ][index % 4]}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Formation */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-500/5 blur-2xl" />
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="rounded-lg bg-cyan-100 dark:bg-cyan-900/30 p-1.5">
                <GraduationCap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              Formation & Coût horaire
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                <div className="text-xs text-muted-foreground">Dépenses</div>
                <div className="text-sm font-bold">
                  {report.training.totalExpenses.toLocaleString("fr-FR")} €
                </div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                <div className="text-xs text-muted-foreground">Participants</div>
                <div className="text-sm font-bold">
                  {report.training.participants}
                </div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                <div className="text-xs text-muted-foreground">Heures</div>
                <div className="text-sm font-bold">
                  {report.training.hours} h
                </div>
              </div>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyCostData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="categorie" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="cout" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                    <defs>
                      <linearGradient id="hourlyCostGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart - Vue d'ensemble */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-indigo-500/5 blur-2xl" />
        <CardHeader className="border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-1.5">
              <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            Vue d'ensemble - Indicateurs clés
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="#6366f1"
                  fillOpacity={0.2}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Footer avec comparaison */}
      <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Année précédente</div>
              <div className="text-2xl font-bold">
                {report.comparison.previousYear.toLocaleString("fr-FR")} €
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Évolution</div>
              <div className="text-2xl font-bold text-green-600">
                +{report.comparison.evolution.toLocaleString("fr-FR")} €
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Pourcentage</div>
              <div className="text-2xl font-bold text-green-600">
                +{report.comparison.evolutionPercentage}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Tendance</div>
              <div className="flex items-center justify-center gap-1">
                <ArrowUp className="h-6 w-6 text-green-500" />
                <span className="text-lg font-medium text-green-600">Croissance</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}