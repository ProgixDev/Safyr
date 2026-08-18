"use client";

import { useEmployeeOptions } from "@/hooks/employees";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useState, useMemo } from "react";

interface MonthlyCalendarViewProps {
  year?: number;
  onEmployeeClick: (employeeId: string, month: number, year: number) => void;
}

interface EmployeeMonthData {
  employeeId: string;
  employeeName: string;
  status: "paid" | "validated" | "pending" | "overdue";
  grossSalary?: number;
  netSalary?: number;
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

// Mock data - replace with actual data from API
interface Employee {
  employeeId: string;
  employeeName: string;
  position: string;
  contractType: "CDI" | "CDD";
  hireDate: string; // YYYY-MM-DD
  contractEndDate?: string; // YYYY-MM-DD for CDD
}

// Employee data by employeeId and month
const mockEmployeeMonthData: Record<
  string,
  Record<number, EmployeeMonthData>
> = {
  "1": {
    1: {
      employeeId: "1",
      employeeName: "Jean Dupont",
      status: "paid",
      grossSalary: 2500,
      netSalary: 1950,
    },
    2: {
      employeeId: "1",
      employeeName: "Jean Dupont",
      status: "paid",
      grossSalary: 2500,
      netSalary: 1950,
    },
    3: {
      employeeId: "1",
      employeeName: "Jean Dupont",
      status: "paid",
      grossSalary: 2500,
      netSalary: 1950,
    },
    4: {
      employeeId: "1",
      employeeName: "Jean Dupont",
      status: "validated",
      grossSalary: 2500,
      netSalary: 1950,
    },
    5: {
      employeeId: "1",
      employeeName: "Jean Dupont",
      status: "validated",
      grossSalary: 2500,
      netSalary: 1950,
    },
    6: {
      employeeId: "1",
      employeeName: "Jean Dupont",
      status: "pending",
      grossSalary: 2500,
      netSalary: 1950,
    },
    7: {
      employeeId: "1",
      employeeName: "Jean Dupont",
      status: "pending",
      grossSalary: 2500,
      netSalary: 1950,
    },
    8: {
      employeeId: "1",
      employeeName: "Jean Dupont",
      status: "pending",
      grossSalary: 2500,
      netSalary: 1950,
    },
    9: {
      employeeId: "1",
      employeeName: "Jean Dupont",
      status: "pending",
      grossSalary: 2500,
      netSalary: 1950,
    },
    10: {
      employeeId: "1",
      employeeName: "Jean Dupont",
      status: "pending",
      grossSalary: 2500,
      netSalary: 1950,
    },
    11: {
      employeeId: "1",
      employeeName: "Jean Dupont",
      status: "pending",
      grossSalary: 2500,
      netSalary: 1950,
    },
    12: {
      employeeId: "1",
      employeeName: "Jean Dupont",
      status: "pending",
      grossSalary: 2500,
      netSalary: 1950,
    },
  },
  "2": {
    1: {
      employeeId: "2",
      employeeName: "Marie Martin",
      status: "paid",
      grossSalary: 2800,
      netSalary: 2184,
    },
    2: {
      employeeId: "2",
      employeeName: "Marie Martin",
      status: "paid",
      grossSalary: 2800,
      netSalary: 2184,
    },
    3: {
      employeeId: "2",
      employeeName: "Marie Martin",
      status: "paid",
      grossSalary: 2800,
      netSalary: 2184,
    },
    4: {
      employeeId: "2",
      employeeName: "Marie Martin",
      status: "validated",
      grossSalary: 2800,
      netSalary: 2184,
    },
    5: {
      employeeId: "2",
      employeeName: "Marie Martin",
      status: "validated",
      grossSalary: 2800,
      netSalary: 2184,
    },
    6: {
      employeeId: "2",
      employeeName: "Marie Martin",
      status: "pending",
      grossSalary: 2800,
      netSalary: 2184,
    },
    7: {
      employeeId: "2",
      employeeName: "Marie Martin",
      status: "pending",
      grossSalary: 2800,
      netSalary: 2184,
    },
    8: {
      employeeId: "2",
      employeeName: "Marie Martin",
      status: "pending",
      grossSalary: 2800,
      netSalary: 2184,
    },
    9: {
      employeeId: "2",
      employeeName: "Marie Martin",
      status: "pending",
      grossSalary: 2800,
      netSalary: 2184,
    },
    10: {
      employeeId: "2",
      employeeName: "Marie Martin",
      status: "pending",
      grossSalary: 2800,
      netSalary: 2184,
    },
    11: {
      employeeId: "2",
      employeeName: "Marie Martin",
      status: "pending",
      grossSalary: 2800,
      netSalary: 2184,
    },
    12: {
      employeeId: "2",
      employeeName: "Marie Martin",
      status: "pending",
      grossSalary: 2800,
      netSalary: 2184,
    },
  },
  "3": {
    1: {
      employeeId: "3",
      employeeName: "Pierre Bernard",
      status: "paid",
      grossSalary: 2300,
      netSalary: 1794,
    },
    2: {
      employeeId: "3",
      employeeName: "Pierre Bernard",
      status: "paid",
      grossSalary: 2300,
      netSalary: 1794,
    },
    3: {
      employeeId: "3",
      employeeName: "Pierre Bernard",
      status: "validated",
      grossSalary: 2300,
      netSalary: 1794,
    },
    4: {
      employeeId: "3",
      employeeName: "Pierre Bernard",
      status: "pending",
      grossSalary: 2300,
      netSalary: 1794,
    },
    5: {
      employeeId: "3",
      employeeName: "Pierre Bernard",
      status: "pending",
      grossSalary: 2300,
      netSalary: 1794,
    },
    6: {
      employeeId: "3",
      employeeName: "Pierre Bernard",
      status: "pending",
      grossSalary: 2300,
      netSalary: 1794,
    },
    7: {
      employeeId: "3",
      employeeName: "Pierre Bernard",
      status: "pending",
      grossSalary: 2300,
      netSalary: 1794,
    },
    8: {
      employeeId: "3",
      employeeName: "Pierre Bernard",
      status: "overdue",
      grossSalary: 2300,
      netSalary: 1794,
    },
    9: {
      employeeId: "3",
      employeeName: "Pierre Bernard",
      status: "pending",
      grossSalary: 2300,
      netSalary: 1794,
    },
    10: {
      employeeId: "3",
      employeeName: "Pierre Bernard",
      status: "pending",
      grossSalary: 2300,
      netSalary: 1794,
    },
    11: {
      employeeId: "3",
      employeeName: "Pierre Bernard",
      status: "pending",
      grossSalary: 2300,
      netSalary: 1794,
    },
    12: {
      employeeId: "3",
      employeeName: "Pierre Bernard",
      status: "pending",
      grossSalary: 2300,
      netSalary: 1794,
    },
  },
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "paid":
      return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    case "validated":
      return <CheckCircle className="w-4 h-4 text-blue-600" />;
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-600" />;
    case "overdue":
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    default:
      return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-emerald-50 hover:bg-emerald-100 border-emerald-300";
    case "validated":
      return "bg-blue-50 hover:bg-blue-100 border-blue-300";
    case "pending":
      return "bg-yellow-50 hover:bg-yellow-100 border-yellow-300";
    case "overdue":
      return "bg-red-50 hover:bg-red-100 border-red-300";
    default:
      return "bg-muted/30 hover:bg-muted/50 border-border";
  }
};

export function MonthlyCalendarView({
  onEmployeeClick,
}: MonthlyCalendarViewProps) {
  const salaries = useEmployeeOptions();
  // Le calendrier attend un salarié avec son contrat : on le construit à
  // partir des dossiers réels.
  const mockEmployees = salaries.map((s) => ({
    employeeId: s.id,
    employeeName: s.name,
    employeeNumber: s.matricule,
    position: s.poste,
    contractType: (s.contractType === "CDD" ? "CDD" : "CDI") as "CDI" | "CDD",
    hireDate: s.hiringDate,
    contractEndDate: undefined as string | undefined,
  }));
  // Calculate default view: last 12 months from today
  const today = new Date();
  const defaultEndMonth = today.getMonth() + 1; // 1-12
  const defaultEndYear = today.getFullYear();

  const [endMonth, setEndMonth] = useState(defaultEndMonth);
  const [endYear, setEndYear] = useState(defaultEndYear);

  // Calculate the 12 months to display
  const displayMonths = useMemo(() => {
    const months: Array<{ month: number; year: number; label: string }> = [];
    let currentMonth = endMonth;
    let currentYear = endYear;

    // Go back 12 months
    for (let i = 0; i < 12; i++) {
      months.unshift({
        month: currentMonth,
        year: currentYear,
        label: `${MONTHS[currentMonth - 1]} ${currentYear}`,
      });

      currentMonth--;
      if (currentMonth === 0) {
        currentMonth = 12;
        currentYear--;
      }
    }

    return months;
  }, [endMonth, endYear]);

  const handlePreviousMonth = () => {
    let newMonth = endMonth - 1;
    let newYear = endYear;
    if (newMonth === 0) {
      newMonth = 12;
      newYear--;
    }
    setEndMonth(newMonth);
    setEndYear(newYear);
  };

  const handleNextMonth = () => {
    let newMonth = endMonth + 1;
    let newYear = endYear;
    if (newMonth === 13) {
      newMonth = 1;
      newYear++;
    }
    setEndMonth(newMonth);
    setEndYear(newYear);
  };

  // Check if an employee should have payment data for a given month/year
  const shouldShowPayment = (
    employee: Employee,
    month: number,
    year: number,
  ): boolean => {
    const checkDate = new Date(year, month - 1, 1);
    const hireDate = new Date(employee.hireDate);

    // Employee not hired yet
    if (checkDate < hireDate) {
      return false;
    }

    // For CDD, check if contract has ended
    if (employee.contractType === "CDD" && employee.contractEndDate) {
      const endDate = new Date(employee.contractEndDate);
      // Check if the month is after contract end
      if (checkDate > endDate) {
        return false;
      }
    }

    return true;
  };

  return (
    <div className="space-y-6">
      {/* Month Range Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Calculs de Paie</h2>
          <Badge variant="outline" className="gap-1">
            <Users className="w-3 h-3" />
            {mockEmployees.length} employés
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold text-sm px-4">
            {displayMonths[0].label} - {displayMonths[11].label}
          </span>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Table View - Months on X-axis, Employees on Y-axis */}
      <Card className="glass-card border-border/40 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-medium text-sm sticky left-0 bg-muted/30 z-10 min-w-50">
                    Employé
                  </th>
                  {displayMonths.map((monthData, index) => (
                    <th
                      key={index}
                      className="text-center p-3 font-medium text-xs min-w-25"
                    >
                      <div>{MONTHS[monthData.month - 1]}</div>
                      <div className="text-muted-foreground font-normal">
                        {monthData.year}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockEmployees.map((employee) => (
                  <tr
                    key={employee.employeeId}
                    className="border-b hover:bg-muted/20"
                  >
                    <td className="p-3 font-medium text-sm sticky left-0 bg-background z-10">
                      <div>
                        <div className="font-medium">
                          {employee.employeeName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {employee.position}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {employee.contractType}
                          {employee.contractType === "CDD" &&
                            employee.contractEndDate &&
                            ` (fin: ${new Date(employee.contractEndDate).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })})`}
                        </div>
                      </div>
                    </td>
                    {displayMonths.map((monthData, index) => {
                      const { month: monthNumber, year: yearNumber } =
                        monthData;

                      // Check if employee should have payment for this period
                      const hasContract = shouldShowPayment(
                        employee,
                        monthNumber,
                        yearNumber,
                      );

                      if (!hasContract) {
                        return (
                          <td
                            key={index}
                            className="p-2 text-center bg-muted/20"
                          >
                            <div className="p-2 text-xs text-muted-foreground">
                              N/A
                            </div>
                          </td>
                        );
                      }

                      const paymentData =
                        mockEmployeeMonthData[employee.employeeId]?.[
                          monthNumber
                        ];

                      return (
                        <td key={index} className="p-2 text-center">
                          {paymentData ? (
                            <button
                              onClick={() =>
                                onEmployeeClick(
                                  employee.employeeId,
                                  monthNumber,
                                  yearNumber,
                                )
                              }
                              className={`w-full p-2 rounded transition-colors border ${getStatusColor(paymentData.status)}`}
                            >
                              <div className="flex flex-col items-center gap-1">
                                {getStatusIcon(paymentData.status)}
                                {paymentData.netSalary && (
                                  <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                    {paymentData.netSalary.toLocaleString(
                                      "fr-FR",
                                    )}{" "}
                                    €
                                  </span>
                                )}
                              </div>
                            </button>
                          ) : (
                            <div className="p-2 text-muted-foreground">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
