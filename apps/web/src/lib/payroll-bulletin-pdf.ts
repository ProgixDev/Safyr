import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { applyPdfFooters, loadPdfBranding } from "@/lib/pdf-branding";

export interface PayrollBulletinEmployee {
  name: string;
  position: string;
  matricule: string;
  address?: string;
  city?: string;
}

export interface PayrollBulletinEarning {
  label: string;
  hours: number | null;
  rate: number | null;
  amount: number;
}

export interface PayrollBulletinDeduction {
  label: string;
  base: number;
  rate: number;
  employee: number;
  employer: number;
}

export interface PayrollBulletinWorkedHours {
  contractual: number;
  worked: number;
  overtime25: number;
  overtime50: number;
  absences: number;
}

export interface PayrollBulletinVariable {
  label: string;
  amount: number;
  type: string;
}

export interface PayrollBulletinData {
  status: string;
  calculationDate: string;
  validationDate?: string;
  grossSalary: number;
  netSalary: number;
  netTaxable: number;
  employerCharges: number;
  earnings: PayrollBulletinEarning[];
  deductions: PayrollBulletinDeduction[];
  workedHours: PayrollBulletinWorkedHours;
  absences?: Array<{ type: string; days: number; impact: number }>;
  variables?: PayrollBulletinVariable[];
}

export interface PayrollBulletinCompanyInfo {
  name?: string;
  logo?: string;
  siret?: string;
  address?: string;
  codeNaf?: string;
  urssaf?: string;
  convention?: string;
}

export async function generatePayrollBulletinPDF(
  employee: PayrollBulletinEmployee,
  month: string,
  year: string,
  data: PayrollBulletinData,
  companyInfo?: PayrollBulletinCompanyInfo,
): Promise<void> {
  const branding = await loadPdfBranding();
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Helper functions
  const fmt = (n: number) => {
    const fixed = n.toFixed(2);
    const [intPart, decPart] = fixed.split(".");
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${formatted},${decPart}`;
  };
  const fmtRate = (r: number) => r.toFixed(4).replace(".", ",");

  // Calculate totals from actual data
  const totalEarnings = data.earnings.reduce((s, e) => s + e.amount, 0);
  const totalEmployeeDeductions = data.deductions.reduce(
    (s, d) => s + d.employee,
    0,
  );
  const totalEmployerCharges = data.deductions.reduce(
    (s, d) => s + d.employer,
    0,
  );
  const totalVariables = data.variables?.reduce((s, v) => s + v.amount, 0) || 0;

  // Group variables by type
  const variablesByType: Record<string, PayrollBulletinVariable[]> = {};
  data.variables?.forEach((v) => {
    if (!variablesByType[v.type]) {
      variablesByType[v.type] = [];
    }
    variablesByType[v.type].push(v);
  });

  // ========== HEADER SECTION ==========
  const y = 12;

  // Company info (left)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(companyInfo?.name || "PRODIGE SÉCURITÉ", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("PRODIGE SÉCURITÉ PRIVÉE", 14, y + 4);
  doc.text(companyInfo?.address || "229 rue Saint Honoré", 14, y + 8);
  doc.text("75001 PARIS", 14, y + 12);
  doc.text(
    `Siret : ${companyInfo?.siret || "90820023100011"}    Code Naf : ${companyInfo?.codeNaf || "8010Z"}`,
    14,
    y + 18,
  );
  doc.text(`Urssaf/Msa : ${companyInfo?.urssaf || "NC"}`, 14, y + 22);

  // Employee details (left, below company)
  doc.setFontSize(6.5);
  doc.text(`Matricule : ${employee.matricule}`, 20, y + 28);
  doc.text(`N° SS : 1670608834154`, 20, y + 32);
  doc.text(`Iban RIB : FR45 2004 1010 0816 0953 4H02 905`, 20, y + 36);
  doc.text(`Emploi : ${employee.position}`, 20, y + 40);
  doc.text(`Statut professionnel : Employé`, 20, y + 44);
  doc.text(`Niveau : III`, 20, y + 48);
  doc.text(`Echelon : 21`, 20, y + 52);
  doc.text(`Coefficient : 140`, 20, y + 56);
  doc.setTextColor(255, 0, 0);
  doc.text(`Entrée : 01/09/2019`, 20, y + 62);
  doc.text(`Ancienneté : 6 ans et 3 mois`, 20, y + 66);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Convention collective : ${companyInfo?.convention || "Prévention et sécurité"}`,
    20,
    y + 70,
  );

  // Title (center)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("BULLETIN DE SALAIRE", pageWidth / 2, y + 4, { align: "center" });
  doc.setFontSize(10);
  doc.setTextColor(255, 0, 0);
  doc.text(`Période : ${month} ${year}`, pageWidth / 2, y + 10, {
    align: "center",
  });
  doc.setTextColor(0, 0, 0);

  // Reference (right)
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `MAD${employee.matricule.replace(/\D/g, "").padStart(5, "0")}`,
    pageWidth - 14,
    y + 4,
    { align: "right" },
  );

  // Employee address box (right)
  const empBoxX = pageWidth - 75;
  const empBoxY = y + 18;
  doc.setFillColor(200, 220, 255);
  doc.setDrawColor(0, 0, 200);
  doc.setLineWidth(0.3);
  doc.rect(empBoxX, empBoxY, 61, 22, "FD");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`Monsieur ${employee.name}`, empBoxX + 2, empBoxY + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    employee.address || "12 BOULEVARD LOUIS BRAILLE",
    empBoxX + 2,
    empBoxY + 12,
  );
  doc.text(employee.city || "06300 NICE", empBoxX + 2, empBoxY + 17);

  // ========== MAIN TABLE ==========
  const tableY = y + 78;
  const tableRows: (
    | string
    | { content: string; styles?: Record<string, unknown> }
  )[][] = [];

  // Header row
  const headerStyle = {
    fillColor: [0, 0, 139] as [number, number, number],
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: "bold" as const,
    halign: "center" as const,
  };
  tableRows.push([
    { content: "Éléments de paie", styles: headerStyle },
    { content: "Base", styles: headerStyle },
    { content: "Taux", styles: headerStyle },
    { content: "A déduire", styles: headerStyle },
    { content: "A payer", styles: headerStyle },
    { content: "Charges patronales", styles: headerStyle },
  ]);

  // EARNINGS SECTION
  // Salaire de base (first earning)
  const baseSalary = data.earnings.find((e) =>
    e.label.toLowerCase().includes("base"),
  );
  if (baseSalary) {
    tableRows.push([
      "Salaire de base",
      baseSalary.hours ? fmt(baseSalary.hours) : "",
      baseSalary.rate ? fmt(baseSalary.rate) : "",
      "",
      fmt(baseSalary.amount),
      "",
    ]);
  }

  // Overtime and other hourly earnings
  const hourlyEarnings = data.earnings.filter(
    (e) => e.hours && e.rate && !e.label.toLowerCase().includes("base"),
  );
  hourlyEarnings.forEach((earning) => {
    tableRows.push([
      earning.label,
      fmt(earning.hours!),
      fmt(earning.rate!),
      "",
      fmt(earning.amount),
      "",
    ]);
  });

  // Fixed earnings (primes without hours)
  const fixedEarnings = data.earnings.filter(
    (e) => !e.hours && !e.rate && !e.label.toLowerCase().includes("base"),
  );
  fixedEarnings.forEach((earning) => {
    tableRows.push([earning.label, "", "", "", fmt(earning.amount), ""]);
  });

  // Gross salary row
  tableRows.push([
    { content: "Salaire brut", styles: { fontStyle: "bold" as const } },
    "",
    "",
    "",
    { content: fmt(totalEarnings), styles: { fontStyle: "bold" as const } },
    "",
  ]);

  // Empty row as separator
  tableRows.push(["", "", "", "", "", ""]);

  // DEDUCTIONS SECTION - Group by category
  const healthDeductions = data.deductions.filter(
    (d) =>
      d.label.toLowerCase().includes("sécurité") ||
      d.label.toLowerCase().includes("maladie") ||
      d.label.toLowerCase().includes("santé"),
  );

  const retirementDeductions = data.deductions.filter(
    (d) =>
      d.label.toLowerCase().includes("retraite") ||
      d.label.toLowerCase().includes("vieillesse"),
  );

  const otherDeductions = data.deductions.filter(
    (d) => !healthDeductions.includes(d) && !retirementDeductions.includes(d),
  );

  // Santé section
  if (healthDeductions.length > 0) {
    tableRows.push([
      {
        content: "Santé",
        styles: {
          fontStyle: "bold" as const,
          fillColor: [240, 240, 240] as [number, number, number],
        },
      },
      {
        content: "",
        styles: { fillColor: [240, 240, 240] as [number, number, number] },
      },
      {
        content: "",
        styles: { fillColor: [240, 240, 240] as [number, number, number] },
      },
      {
        content: "",
        styles: { fillColor: [240, 240, 240] as [number, number, number] },
      },
      {
        content: "",
        styles: { fillColor: [240, 240, 240] as [number, number, number] },
      },
      {
        content: "",
        styles: { fillColor: [240, 240, 240] as [number, number, number] },
      },
    ]);
    healthDeductions.forEach((d) => {
      tableRows.push([
        d.label,
        fmt(d.base),
        fmtRate(d.rate),
        d.employee > 0 ? fmt(d.employee) : "",
        "",
        d.employer > 0 ? fmt(d.employer) : "",
      ]);
    });
  }

  // Retraite section
  if (retirementDeductions.length > 0) {
    tableRows.push([
      {
        content: "Retraite",
        styles: {
          fontStyle: "bold" as const,
          fillColor: [240, 240, 240] as [number, number, number],
        },
      },
      {
        content: "",
        styles: { fillColor: [240, 240, 240] as [number, number, number] },
      },
      {
        content: "",
        styles: { fillColor: [240, 240, 240] as [number, number, number] },
      },
      {
        content: "",
        styles: { fillColor: [240, 240, 240] as [number, number, number] },
      },
      {
        content: "",
        styles: { fillColor: [240, 240, 240] as [number, number, number] },
      },
      {
        content: "",
        styles: { fillColor: [240, 240, 240] as [number, number, number] },
      },
    ]);
    retirementDeductions.forEach((d) => {
      tableRows.push([
        d.label,
        fmt(d.base),
        fmtRate(d.rate),
        d.employee > 0 ? fmt(d.employee) : "",
        "",
        d.employer > 0 ? fmt(d.employer) : "",
      ]);
    });
  }

  // Other deductions (CSG, CRDS, chômage, etc.)
  otherDeductions.forEach((d) => {
    tableRows.push([
      d.label,
      fmt(d.base),
      fmtRate(d.rate),
      d.employee > 0 ? fmt(d.employee) : "",
      "",
      d.employer > 0 ? fmt(d.employer) : "",
    ]);
  });

  // Total cotisations row
  tableRows.push([
    {
      content: "Total des cotisations et contributions",
      styles: { fontStyle: "bold" as const },
    },
    "",
    "",
    {
      content: fmt(totalEmployeeDeductions),
      styles: { fontStyle: "bold" as const },
    },
    "",
    {
      content: fmt(totalEmployerCharges),
      styles: { fontStyle: "bold" as const },
    },
  ]);

  // Empty separator
  tableRows.push(["", "", "", "", "", ""]);

  // INDEMNITÉS SECTION - Group by type
  if (data.variables && data.variables.length > 0) {
    Object.entries(variablesByType).forEach(([type, variables]) => {
      tableRows.push([
        {
          content: type,
          styles: {
            fontStyle: "bold" as const,
            fillColor: [240, 240, 240] as [number, number, number],
          },
        },
        {
          content: "",
          styles: { fillColor: [240, 240, 240] as [number, number, number] },
        },
        {
          content: "",
          styles: { fillColor: [240, 240, 240] as [number, number, number] },
        },
        {
          content: "",
          styles: { fillColor: [240, 240, 240] as [number, number, number] },
        },
        {
          content: "",
          styles: { fillColor: [240, 240, 240] as [number, number, number] },
        },
        {
          content: "",
          styles: { fillColor: [240, 240, 240] as [number, number, number] },
        },
      ]);
      variables.forEach((v) => {
        tableRows.push([v.label, "", "", "", fmt(v.amount), ""]);
      });
    });

    // Total indemnités
    tableRows.push([
      { content: "Total indemnités", styles: { fontStyle: "bold" as const } },
      "",
      "",
      "",
      { content: fmt(totalVariables), styles: { fontStyle: "bold" as const } },
      "",
    ]);
  }

  // Montant net social
  const netSocial = totalEarnings - totalEmployeeDeductions + totalVariables;
  tableRows.push(["Montant net social", fmt(netSocial), "", "", "", ""]);

  // Total dû
  tableRows.push([
    { content: "Total dû", styles: { fontStyle: "bold" as const } },
    "",
    "",
    fmt(totalEmployeeDeductions),
    { content: fmt(data.netSalary), styles: { fontStyle: "bold" as const } },
    "",
  ]);

  // Empty separator
  tableRows.push(["", "", "", "", "", ""]);

  // Net à payer avant impôt
  const yellowBg = { fillColor: [255, 255, 200] as [number, number, number] };
  tableRows.push([
    {
      content: "Net à payer avant impôt sur le revenu",
      styles: { fontStyle: "bold" as const, ...yellowBg },
    },
    { content: "", styles: yellowBg },
    { content: "", styles: yellowBg },
    { content: "", styles: yellowBg },
    {
      content: fmt(data.netSalary),
      styles: { fontStyle: "bold" as const, ...yellowBg },
    },
    { content: "", styles: yellowBg },
  ]);

  // PAS (impôt à la source)
  const pasRate = 0.0; // Default to 0, would come from employee data
  const pasAmount = data.netTaxable * pasRate;
  tableRows.push([
    "Impôt sur le revenu prélevé à la source - PAS",
    fmt(data.netTaxable),
    fmtRate(pasRate),
    fmt(pasAmount),
    "",
    "",
  ]);
  tableRows.push([
    { content: "Taux personnalisé", styles: { fontSize: 6 } },
    "",
    "",
    "",
    "",
    "",
  ]);

  // Net payé final
  tableRows.push([
    {
      content: "Net payé",
      styles: { fontStyle: "bold" as const, ...yellowBg },
    },
    { content: "", styles: yellowBg },
    { content: "", styles: yellowBg },
    { content: "", styles: yellowBg },
    {
      content: fmt(data.netSalary - pasAmount),
      styles: { fontStyle: "bold" as const, ...yellowBg },
    },
    { content: "", styles: yellowBg },
  ]);

  // Generate main table
  autoTable(doc, {
    startY: tableY,
    body: tableRows,
    theme: "grid",
    styles: {
      fontSize: 6,
      cellPadding: 1,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 58 },
      1: { cellWidth: 22, halign: "right" },
      2: { cellWidth: 18, halign: "right" },
      3: { cellWidth: 22, halign: "right" },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 28, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  // ========== HOURS SUMMARY TABLE ==========
  const hoursTableY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 4;

  const blueHeader = {
    fillColor: [0, 0, 139] as [number, number, number],
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: "bold" as const,
  };
  const hoursRows = [
    [
      { content: "", styles: blueHeader },
      { content: "Heures", styles: blueHeader },
      { content: "Heures suppl.", styles: blueHeader },
      { content: "Brut", styles: blueHeader },
      { content: "Plafond S.S.", styles: blueHeader },
      { content: "Net imposable", styles: blueHeader },
      { content: "Ch. patronales", styles: blueHeader },
      { content: "Coût Global", styles: blueHeader },
      { content: "Total versé", styles: blueHeader },
      { content: "Allégements", styles: blueHeader },
    ],
    [
      "Mensuel",
      fmt(data.workedHours.contractual),
      fmt(data.workedHours.overtime25 + data.workedHours.overtime50),
      fmt(totalEarnings),
      fmt(3925.0),
      fmt(data.netTaxable),
      fmt(totalEmployerCharges),
      fmt(totalEarnings + totalEmployerCharges),
      fmt(data.netSalary),
      fmt(totalEmployerCharges * 0.08),
    ],
    [
      "Annuel",
      fmt(data.workedHours.contractual * 12),
      fmt((data.workedHours.overtime25 + data.workedHours.overtime50) * 12),
      fmt(totalEarnings * 12),
      fmt(47100.0),
      fmt(data.netTaxable * 12),
      fmt(totalEmployerCharges * 12),
      fmt((totalEarnings + totalEmployerCharges) * 12),
      fmt(data.netSalary * 12),
      fmt(totalEmployerCharges * 0.08 * 12),
    ],
  ];

  autoTable(doc, {
    startY: hoursTableY,
    body: hoursRows,
    theme: "grid",
    styles: {
      fontSize: 5.5,
      cellPadding: 1,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 18, halign: "right" },
      2: { cellWidth: 18, halign: "right" },
      3: { cellWidth: 20, halign: "right" },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 20, halign: "right" },
      7: { cellWidth: 20, halign: "right" },
      8: { cellWidth: 20, halign: "right" },
      9: { cellWidth: 18, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  // ========== BOTTOM SECTION ==========
  const bottomY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 4;

  // Congés table (left)
  const congesRows = [
    [
      { content: "", styles: blueHeader },
      { content: "Congés N-1", styles: blueHeader },
      { content: "Congés N", styles: blueHeader },
      { content: "Repos C.", styles: blueHeader },
    ],
    ["Acquis", "43.33", "17.50", "0.08"],
    ["Pris", "18.00", "", ""],
    ["Solde", "25.33", "17.50", "0.08"],
  ];

  autoTable(doc, {
    startY: bottomY,
    body: congesRows,
    theme: "grid",
    styles: {
      fontSize: 6,
      cellPadding: 1,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 22, halign: "right" },
      2: { cellWidth: 22, halign: "right" },
      3: { cellWidth: 18, halign: "right" },
    },
    margin: { left: 14, right: pageWidth / 2 + 10 },
  });

  // Net payé box (right)
  const netBoxX = pageWidth / 2 + 5;
  const netBoxY = bottomY;
  const netBoxW = pageWidth - netBoxX - 14;
  const netBoxH = 16;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(netBoxX, netBoxY, netBoxW, netBoxH);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Net payé: ${fmt(data.netSalary)} euros`,
    netBoxX + netBoxW / 2,
    netBoxY + 7,
    { align: "center" },
  );

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const paymentDate = new Date(data.validationDate || data.calculationDate);
  doc.text(
    `Paiement le ${paymentDate.toLocaleDateString("fr-FR")} par Virement`,
    netBoxX + netBoxW / 2,
    netBoxY + 12,
    { align: "center" },
  );

  // ========== FOOTER ==========
  // Mention légale L612-14 en bas de page (pied compact : la mise en page du
  // bulletin est dense, le bloc société est déjà en tête du document).
  const footerY = pageHeight - 17;
  doc.setFontSize(5);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Dans votre intérêt, et pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée. Informations complémentaires : www.service-public.fr",
    pageWidth / 2,
    footerY,
    { align: "center", maxWidth: pageWidth - 28 },
  );

  applyPdfFooters(doc, branding, { compact: true, hidePageNumbers: true });

  // Save PDF
  const fileName = `Bulletin_${employee.name.replace(/\s+/g, "_")}_${month}_${year}.pdf`;
  doc.save(fileName);
}
