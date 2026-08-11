"use client";

import { useState } from "react";
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
  Calendar,
  Filter,
  User,
} from "lucide-react";

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

const mockEmployees: {
  id: string;
  name: string;
  department?: string;
  email?: string;
  hiringDate?: string;
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

export default function HREmployeeArchivesPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(
    currentYear.toString(),
  );
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
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

  const filterPayslips = () => {
    return mockPayslips.filter((payslip) => {
      const matchesMonth =
        !selectedMonth || payslip.month === parseInt(selectedMonth);
      const matchesYear =
        !selectedYear || payslip.year === parseInt(selectedYear);
      const matchesEmployee =
        selectedEmployee === "" || payslip.employeeId === selectedEmployee;
      const matchesSearch =
        searchTerm === "" ||
        payslip.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payslip.id.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesMonth && matchesYear && matchesEmployee && matchesSearch;
    });
  };

  const handleDownload = (payslipId: string) => {
    console.log(`Downloading payslip: ${payslipId}`);
    // TODO: Implement actual download logic
  };

  const handleBulkDownload = () => {
    const filtered = filterPayslips();
    console.log(`Bulk downloading ${filtered.length} payslips`);
    // TODO: Implement bulk download logic
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Archives BS - Salariés
          </h1>
          <p className="text-muted-foreground">
            Consultez et téléchargez les bulletins de salaire archivés des
            employés
          </p>
        </div>
      </div>

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
                <SelectItem value="null">Tous les salariés</SelectItem>
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
                <SelectItem value="null">Tous les mois</SelectItem>
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
                <SelectItem value="null">Toutes les années</SelectItem>
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
            <h3 className="text-lg font-semibold">Bulletins de Salaire</h3>
            <p className="text-sm text-muted-foreground">
              {filterPayslips().length} bulletin(s) trouvé(s)
            </p>
          </div>
          <Button
            onClick={handleBulkDownload}
            disabled={filterPayslips().length === 0}
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
            {filterPayslips().length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Aucun bulletin trouvé pour les critères sélectionnés
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filterPayslips().map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell className="font-mono text-sm">
                    {payslip.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {payslip.employeeName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatMonthYear(payslip.month, payslip.year)}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(payslip.grossSalary)}</TableCell>
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
    </div>
  );
}
