import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Risk {
  risque: string;
  cause: string;
  gravite: string;
  probabilite: string;
  mesures: string;
}

interface Poste {
  id: string;
  title: string;
  risks: Risk[];
}

const RISK_HEADERS = [
  "Risque identifié",
  "Cause potentielle",
  "Gravité",
  "Probabilité",
  "Mesures de prévention",
];

function todayLabel(): string {
  return new Date().toLocaleDateString("fr-FR");
}

/** Génère et télécharge le DUERP au format PDF (conforme à l'impression). */
export function exportDuerpToPdf(postes: Poste[]): void {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("DUERP — Document Unique d'Évaluation des Risques", 14, 18);
  doc.setFontSize(10);
  doc.text(`Édité le ${todayLabel()}`, 14, 25);

  let cursorY = 32;
  postes.forEach((poste) => {
    autoTable(doc, {
      startY: cursorY,
      head: [[`Poste : ${poste.title}`]],
      body: [],
      theme: "plain",
      headStyles: { fontStyle: "bold", fontSize: 12, textColor: [15, 23, 42] },
    });
    autoTable(doc, {
      startY:
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 2,
      head: [RISK_HEADERS],
      body: poste.risks.map((r) => [
        r.risque,
        r.cause,
        r.gravite,
        r.probabilite,
        r.mesures,
      ]),
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      columnStyles: { 4: { cellWidth: 50 } },
    });
    cursorY =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 8;
  });

  doc.save(`DUERP_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Génère et télécharge le DUERP au format Excel (.xls ouvert nativement par Excel). */
export function exportDuerpToExcel(postes: Poste[]): void {
  const rows = postes.flatMap((poste) =>
    poste.risks.map(
      (r) =>
        `<tr><td>${escapeHtml(poste.title)}</td><td>${escapeHtml(
          r.risque,
        )}</td><td>${escapeHtml(r.cause)}</td><td>${escapeHtml(
          r.gravite,
        )}</td><td>${escapeHtml(r.probabilite)}</td><td>${escapeHtml(
          r.mesures,
        )}</td></tr>`,
    ),
  );

  const header = ["Poste", ...RISK_HEADERS]
    .map((h) => `<th>${h}</th>`)
    .join("");

  const html =
    `<html xmlns:o="urn:schemas-microsoft-com:office:office" ` +
    `xmlns:x="urn:schemas-microsoft-com:office:excel" ` +
    `xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8" />` +
    `</head><body><table border="1"><thead><tr>${header}</tr></thead>` +
    `<tbody>${rows.join("")}</tbody></table></body></html>`;

  const blob = new Blob(["﻿", html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `DUERP_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
