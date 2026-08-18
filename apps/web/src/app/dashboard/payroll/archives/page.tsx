"use client";

import { useSites } from "@/hooks/sites";

import { useState } from "react";
import { useEmployeeOptions } from "@/hooks/employees";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Search,
  Users,
  Building2,
  Calendar,
  Filter,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for payslips
const mockPayslips: {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  siteId: string;
  siteName: string;
  grossSalary: number;
  netSalary: number;
  status: string;
}[] = [];

const months = [
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function PayrollArchivesPage() {
  const { data: mockSites = [] } = useSites();
  const mockEmployees = useEmployeeOptions();
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>(
    currentYear.toString(),
  );
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatMonthYear = (month: number, year: number) => {
    const monthName = months.find((m) => m.value === month.toString())?.label;
    return `${monthName} ${year}`;
  };

  const filterPayslips = (view: "employee" | "site" | "all") => {
    return mockPayslips.filter((payslip) => {
      const matchesMonth =
        selectedMonth === "all" || payslip.month === parseInt(selectedMonth);
      const matchesYear =
        selectedYear === "all" || payslip.year === parseInt(selectedYear);
      const matchesEmployee =
        view === "employee"
          ? selectedEmployee === "all" ||
            payslip.employeeId === selectedEmployee
          : true;
      const matchesSite =
        view === "site"
          ? selectedSite === "all" || payslip.siteId === selectedSite
          : true;
      const matchesSearch =
        searchTerm === "" ||
        payslip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payslip.id.toLowerCase().includes(searchTerm.toLowerCase());

      return (
        matchesMonth &&
        matchesYear &&
        matchesEmployee &&
        matchesSite &&
        matchesSearch
      );
    });
  };

  const handleDownload = (payslipId: string) => {
    console.log(`Downloading payslip: ${payslipId}`);
    // TODO: Implement actual download logic
  };

  const handleBulkDownload = (view: "employee" | "site" | "all") => {
    const filtered = filterPayslips(view);
    console.log(`Bulk downloading ${filtered.length} payslips`);
    // TODO: Implement bulk download logic
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Archives BS</h1>
          <p className="text-muted-foreground">
            Consultez et téléchargez les bulletins de salaire archivés
          </p>
        </div>
      </div>

      <Tabs defaultValue="employee" className="space-y-6">
        <TabsList>
          <TabsTrigger value="employee" className="gap-2">
            <Users className="h-4 w-4" />
            Par Salarié
          </TabsTrigger>
          <TabsTrigger value="site" className="gap-2">
            <Building2 className="h-4 w-4" />
            Par Site
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <FileText className="h-4 w-4" />
            Tous les Salariés
          </TabsTrigger>
        </TabsList>

        {/* Par Salarié */}
        <TabsContent value="employee" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Filtres</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Salarié</label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les salariés" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les salariés</SelectItem>
                    {mockEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mois</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les mois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les mois</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Année</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les années</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Bulletins de Salaire par Salarié
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filterPayslips("employee").length} bulletin(s) trouvé(s)
                </p>
              </div>
              <Button
                onClick={() => handleBulkDownload("employee")}
                disabled={filterPayslips("employee").length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger tout
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Salarié</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Brut</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterPayslips("employee").length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Aucun bulletin trouvé pour les critères sélectionnés
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filterPayslips("employee").map((payslip) => (
                    <TableRow key={payslip.id}>
                      <TableCell className="font-mono text-sm">
                        {payslip.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payslip.employeeName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatMonthYear(payslip.month, payslip.year)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payslip.grossSalary)}
                      </TableCell>
                      <TableCell>{formatCurrency(payslip.netSalary)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50">
                          Validé
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(payslip.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Par Site */}
        <TabsContent value="site" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Filtres</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Site</label>
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les sites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les sites</SelectItem>
                    {mockSites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mois</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les mois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les mois</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Année</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les années</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Bulletins par Site</h3>
                <p className="text-sm text-muted-foreground">
                  {filterPayslips("site").length} bulletin(s) trouvé(s)
                </p>
              </div>
              <Button
                onClick={() => handleBulkDownload("site")}
                disabled={filterPayslips("site").length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger tout
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Salarié</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Brut</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterPayslips("site").length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Aucun bulletin trouvé pour les critères sélectionnés
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filterPayslips("site").map((payslip) => (
                    <TableRow key={payslip.id}>
                      <TableCell className="font-mono text-sm">
                        {payslip.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {payslip.siteName}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {payslip.employeeName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatMonthYear(payslip.month, payslip.year)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payslip.grossSalary)}
                      </TableCell>
                      <TableCell>{formatCurrency(payslip.netSalary)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50">
                          Validé
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(payslip.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Tous les Salariés */}
        <TabsContent value="all" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Filtres</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mois</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les mois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les mois</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Année</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les années</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Tous les Bulletins de Salaire
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filterPayslips("all").length} bulletin(s) trouvé(s)
                </p>
              </div>
              <Button
                onClick={() => handleBulkDownload("all")}
                disabled={filterPayslips("all").length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger tout
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Salarié</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Brut</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filterPayslips("all").length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Aucun bulletin trouvé pour les critères sélectionnés
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filterPayslips("all").map((payslip) => (
                    <TableRow key={payslip.id}>
                      <TableCell className="font-mono text-sm">
                        {payslip.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payslip.employeeName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {payslip.siteName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatMonthYear(payslip.month, payslip.year)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(payslip.grossSalary)}
                      </TableCell>
                      <TableCell>{formatCurrency(payslip.netSalary)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50">
                          Validé
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(payslip.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
