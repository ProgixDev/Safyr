"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Send,
  TrendingUp,
  TrendingDown,
  ExternalLink,
} from "lucide-react";
import { generatePayrollBulletinPDF } from "@/lib/payroll-bulletin-pdf";

interface PageProps {
  params: Promise<{
    employeeId: string;
    month: string;
    year: string;
  }>;
}

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

// Mock data
const mockEmployeeData = {
  "1": {
    name: "Jean Dupont",
    position: "Agent de sécurité SSIAP1",
    matricule: "EMP001",
    address: "12 BOULEVARD LOUIS BRAILLE",
    city: "06300 NICE",
  },
  "2": {
    name: "Marie Martin",
    position: "Chef d'équipe",
    matricule: "EMP002",
    address: "45 RUE DE LA PAIX",
    city: "75002 PARIS",
  },
  "3": {
    name: "Pierre Bernard",
    position: "Agent de sécurité",
    matricule: "EMP003",
    address: "8 AVENUE DES LILAS",
    city: "13001 MARSEILLE",
  },
};

const mockPayrollData = {
  status: "paid" as const,
  calculationDate: "2024-12-15",
  validationDate: "2024-12-18",
  grossSalary: 2756.39,
  netSalary: 2089.25,
  netTaxable: 2100.32,
  employerCharges: 875.5,
  acompte: 500.0,
  impotSource: 89.45,

  // Primes (included in gross salary, subject to contributions)
  primes: [
    { label: "Prime d'ancienneté", amount: 120.0 },
    { label: "Prime temps d'habillage/déshabillage", amount: 30.0 },
    { label: "Majoration heures férié", hours: 7, rate: 5.5, amount: 38.5 },
    { label: "Majoration heures de nuit", hours: 15, rate: 2.5, amount: 37.5 },
    {
      label: "Majoration heures de dimanche",
      hours: 7,
      rate: 3.5,
      amount: 24.5,
    },
  ],

  // Base earnings
  earnings: [
    { label: "Salaire de base", hours: 151.67, rate: 15.5, amount: 2350.89 },
    {
      label: "Heures supplémentaires 25%",
      hours: 8,
      rate: 19.38,
      amount: 155.04,
    },
  ],

  // Indemnités (added to net, not subject to contributions)
  indemnites: [
    {
      label: "Indemnité de panier",
      amount: 118.8,
      description: "22 jours × 5.40€",
    },
    { label: "Indemnité frais restauration", amount: 0.0 },
    {
      label: "Indemnité entretien des tenues",
      amount: 11.0,
      description: "22 jours × 0.50€",
    },
    { label: "Indemnité de transport", amount: 0.0 },
  ],

  deductions: [
    {
      label: "Sécurité sociale",
      base: 2500.0,
      rate: 6.9,
      employee: 172.5,
      employer: 287.5,
    },
    {
      label: "Retraite complémentaire",
      base: 2500.0,
      rate: 7.87,
      employee: 196.75,
      employer: 393.5,
    },
    {
      label: "Assurance chômage",
      base: 2500.0,
      rate: 2.4,
      employee: 0.0,
      employer: 60.0,
    },
    {
      label: "CSG déductible",
      base: 2456.25,
      rate: 6.8,
      employee: 167.03,
      employer: 0.0,
    },
    {
      label: "CSG non déductible",
      base: 2456.25,
      rate: 2.4,
      employee: 58.95,
      employer: 0.0,
    },
    { label: "CRDS", base: 2456.25, rate: 0.5, employee: 12.28, employer: 0.0 },
  ],

  workedHours: {
    contractual: 151.67,
    worked: 159.67,
    overtime25: 8.0,
    overtime50: 0.0,
    absences: 0.0,
  },

  absences: [{ type: "Congés payés", days: 0, impact: 0.0 }],

  variables: [
    { label: "Prime de nuit", amount: 85.0, type: "Indemnité" },
    { label: "Tickets restaurant", amount: 44.0, type: "Avantage" },
  ],
};

export default function EmployeeMonthDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { employeeId, month, year } = use(params);

  const employee =
    mockEmployeeData[employeeId as keyof typeof mockEmployeeData];
  const monthName = MONTHS[parseInt(month) - 1];
  const data = mockPayrollData;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-300"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Payé
          </Badge>
        );
      case "validated":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-300"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Validé
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-300"
          >
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case "overdue":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-300"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            En retard
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";

  const totalEarnings = data.earnings.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const totalPrimes = data.primes.reduce((sum, item) => sum + item.amount, 0);
  const totalIndemnites = data.indemnites.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const totalEmployeeDeductions = data.deductions.reduce(
    (sum, item) => sum + item.employee,
    0,
  );
  const totalEmployerCharges = data.deductions.reduce(
    (sum, item) => sum + item.employer,
    0,
  );

  const handleExportPDF = () => {
    if (!employee) return;

    void generatePayrollBulletinPDF(employee, monthName, year, data, {
      name: "PRODIGE SÉCURITÉ",
      siret: "90820023100011",
      address: "229 rue Saint Honoré",
      codeNaf: "8010Z",
      urssaf: "NC",
      convention: "Prévention et sécurité",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/payroll/calculation")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au calendrier
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <User className="w-6 h-6" />
              {employee?.name || "Employé inconnu"}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {monthName} {year}
              </span>
              <span>•</span>
              <span>{employee?.position}</span>
              <span>•</span>
              <span>Matricule: {employee?.matricule}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(data.status)}
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Bulletin PDF
          </Button>
          <Button size="sm">
            <Send className="w-4 h-4 mr-2" />
            Envoyer
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-light text-muted-foreground">
              Salaire Brut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.grossSalary)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.workedHours.worked}h travaillées
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-light text-muted-foreground">
              Salaire Net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(data.netSalary)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Net imposable: {formatCurrency(data.netTaxable)}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-light text-muted-foreground">
              Charges Salariales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalEmployeeDeductions)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((totalEmployeeDeductions / data.grossSalary) * 100).toFixed(1)}%
              du brut
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-light text-muted-foreground">
              Charges Patronales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalEmployerCharges)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Coût total:{" "}
              {formatCurrency(data.grossSalary + totalEmployerCharges)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="calculation" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculation">Calcul détaillé</TabsTrigger>
          <TabsTrigger value="hours">Heures</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="calculation" className="space-y-4">
          {/* Base Earnings */}
          <Card className="glass-card border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Salaire de base et heures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-5">Libellé</div>
                  <div className="col-span-2 text-right">Heures</div>
                  <div className="col-span-2 text-right">Taux</div>
                  <div className="col-span-3 text-right">Montant</div>
                </div>
                {data.earnings.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 text-sm py-2 hover:bg-muted/50"
                  >
                    <div className="col-span-5">{item.label}</div>
                    <div className="col-span-2 text-right">
                      {item.hours ? item.hours.toFixed(2) : "-"}
                    </div>
                    <div className="col-span-2 text-right">
                      {item.rate ? formatCurrency(item.rate) : "-"}
                    </div>
                    <div className="col-span-3 text-right font-semibold">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-4 text-sm font-bold border-t pt-2 mt-2">
                  <div className="col-span-9 text-right">Sous-total:</div>
                  <div className="col-span-3 text-right">
                    {formatCurrency(totalEarnings)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Primes (included in gross) */}
          <Card className="glass-card border-blue-100 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Primes (incluses dans le brut, soumises à cotisations)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-6">Libellé</div>
                  <div className="col-span-2 text-right">Heures</div>
                  <div className="col-span-1 text-right">Taux</div>
                  <div className="col-span-3 text-right">Montant</div>
                </div>
                {data.primes.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 text-sm py-2 hover:bg-muted/50"
                  >
                    <div className="col-span-6">{item.label}</div>
                    <div className="col-span-2 text-right">
                      {item.hours ? item.hours.toFixed(2) : "-"}
                    </div>
                    <div className="col-span-1 text-right text-xs">
                      {item.rate ? `+${item.rate.toFixed(2)}€` : "-"}
                    </div>
                    <div className="col-span-3 text-right font-semibold text-blue-700">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-4 text-sm font-bold border-t pt-2 mt-2">
                  <div className="col-span-9 text-right text-blue-700">
                    Total Primes:
                  </div>
                  <div className="col-span-3 text-right text-blue-700">
                    {formatCurrency(totalPrimes)}
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4 text-sm font-bold bg-blue-100/50 p-2 rounded">
                  <div className="col-span-9 text-right">TOTAL BRUT:</div>
                  <div className="col-span-3 text-right">
                    {formatCurrency(totalEarnings + totalPrimes)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card className="glass-card border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-destructive" />
                Cotisations et contributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-4">Libellé</div>
                  <div className="col-span-2 text-right">Base</div>
                  <div className="col-span-2 text-right">Taux</div>
                  <div className="col-span-2 text-right">Part salariale</div>
                  <div className="col-span-2 text-right">Part patronale</div>
                </div>
                {data.deductions.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 text-sm py-2 hover:bg-muted/50"
                  >
                    <div className="col-span-4">{item.label}</div>
                    <div className="col-span-2 text-right text-muted-foreground">
                      {formatCurrency(item.base)}
                    </div>
                    <div className="col-span-2 text-right text-muted-foreground">
                      {item.rate.toFixed(2)}%
                    </div>
                    <div className="col-span-2 text-right font-semibold text-destructive">
                      {formatCurrency(item.employee)}
                    </div>
                    <div className="col-span-2 text-right font-semibold text-orange-600">
                      {formatCurrency(item.employer)}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-4 text-sm font-bold border-t pt-2 mt-2">
                  <div className="col-span-8 text-right">Total:</div>
                  <div className="col-span-2 text-right text-destructive">
                    {formatCurrency(totalEmployeeDeductions)}
                  </div>
                  <div className="col-span-2 text-right text-orange-600">
                    {formatCurrency(totalEmployerCharges)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indemnités (added to net) */}
          <Card className="glass-card border-green-100 bg-green-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Indemnités (ajoutées au net, non soumises à cotisations)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-6">Libellé</div>
                  <div className="col-span-3 text-right">Détail</div>
                  <div className="col-span-3 text-right">Montant</div>
                </div>
                {data.indemnites.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 text-sm py-2 hover:bg-muted/50"
                  >
                    <div className="col-span-6">{item.label}</div>
                    <div className="col-span-3 text-right text-xs text-muted-foreground">
                      {item.description || "-"}
                    </div>
                    <div className="col-span-3 text-right font-semibold text-green-700">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-4 text-sm font-bold border-t pt-2 mt-2">
                  <div className="col-span-9 text-right text-green-700">
                    Total Indemnités:
                  </div>
                  <div className="col-span-3 text-right text-green-700">
                    {formatCurrency(totalIndemnites)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retenues sur le net */}
          <Card className="glass-card border-orange-100 bg-orange-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-orange-600" />
                Retenues sur le net
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-9">Libellé</div>
                  <div className="col-span-3 text-right">Montant</div>
                </div>
                <div className="grid grid-cols-12 gap-4 text-sm py-2 hover:bg-muted/50">
                  <div className="col-span-9">
                    Impôt prélèvement à la source
                  </div>
                  <div className="col-span-3 text-right font-semibold text-orange-700">
                    {formatCurrency(data.impotSource)}
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4 text-sm py-2 hover:bg-muted/50">
                  <div className="col-span-9">Acompte versé</div>
                  <div className="col-span-3 text-right font-semibold text-orange-700">
                    {formatCurrency(data.acompte)}
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4 text-sm font-bold border-t pt-2 mt-2">
                  <div className="col-span-9 text-right text-orange-700">
                    Total Retenues:
                  </div>
                  <div className="col-span-3 text-right text-orange-700">
                    {formatCurrency(data.impotSource + data.acompte)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Calculation */}
          <Card className="glass-card bg-emerald-50/50 border-emerald-200/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Salaire brut</span>
                  <span className="font-bold">
                    {formatCurrency(data.grossSalary)}
                  </span>
                </div>
                <div className="flex justify-between text-lg text-destructive">
                  <span className="font-medium">- Cotisations salariales</span>
                  <span className="font-bold">
                    -{formatCurrency(totalEmployeeDeductions)}
                  </span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-medium">
                    = Net à payer avant indemnités
                  </span>
                  <span className="font-bold">
                    {formatCurrency(data.grossSalary - totalEmployeeDeductions)}
                  </span>
                </div>
                <div className="flex justify-between text-lg text-green-700">
                  <span className="font-medium">+ Indemnités non soumises</span>
                  <span className="font-bold">
                    +{formatCurrency(totalIndemnites)}
                  </span>
                </div>
                <div className="flex justify-between text-lg text-orange-600 border-t pt-2">
                  <span className="font-medium">
                    - Impôt prélèvement à la source
                  </span>
                  <span className="font-bold">
                    -{formatCurrency(data.impotSource)}
                  </span>
                </div>
                <div className="flex justify-between text-lg text-orange-600">
                  <span className="font-medium">- Acompte versé</span>
                  <span className="font-bold">
                    -{formatCurrency(data.acompte)}
                  </span>
                </div>
                <div className="border-t-2 border-emerald-300 pt-3 flex justify-between text-2xl">
                  <span className="font-bold">Salaire net à payer</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(data.netSalary)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <Card className="glass-card border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Détail des heures</CardTitle>
                <Link
                  href={`/dashboard/hr/time-management/worked-hours?employeeId=${employeeId}&month=${month}&year=${year}`}
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Voir détails complets
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span>Heures contractuelles</span>
                  <span className="font-semibold">
                    {data.workedHours.contractual}h
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Heures travaillées</span>
                  <span className="font-semibold">
                    {data.workedHours.worked}h
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Heures supplémentaires 25%</span>
                  <span className="font-semibold text-primary">
                    {data.workedHours.overtime25}h
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Heures supplémentaires 50%</span>
                  <span className="font-semibold text-primary">
                    {data.workedHours.overtime50}h
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Heures d&apos;absence</span>
                  <span className="font-semibold text-destructive">
                    {data.workedHours.absences}h
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4">
          <Card className="glass-card border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Variables de paie</CardTitle>
                <Link
                  href={`/dashboard/payroll/variables?employeeId=${employeeId}&month=${month}&year=${year}`}
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Voir toutes les variables
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.variables.length > 0 ? (
                <div className="space-y-2">
                  {data.variables.map((variable, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-3 border-b last:border-b-0"
                    >
                      <div>
                        <div className="font-medium">{variable.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {variable.type}
                        </div>
                      </div>
                      <div className="font-semibold">
                        {formatCurrency(variable.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucune variable pour cette période
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="glass-card border-border/40">
            <CardHeader>
              <CardTitle>Historique des modifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 pb-4 border-b">
                  <div className="w-2 bg-emerald-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Calcul validé</p>
                        <p className="text-sm text-muted-foreground">
                          Validation effectuée par Admin RH
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-300"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Payé
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(data.validationDate || "").toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 pb-4 border-b">
                  <div className="w-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">Calcul effectué</p>
                        <p className="text-sm text-muted-foreground">
                          Calcul automatique de la paie
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-300"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Validé
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(data.calculationDate).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
