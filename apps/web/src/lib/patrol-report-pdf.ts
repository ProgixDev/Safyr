import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  PatrolExecution,
  PatrolCheckpoint,
} from "@/data/geolocation-patrols";
import { getPatrolDisplayStatus } from "@/data/geolocation-patrols";
import {
  PDF_FOOTER_RESERVED_MM,
  applyPdfFooters,
  brandedPdfDefaults,
  drawPdfHeader,
  loadPdfBranding,
  pdfHeaderHeight,
  pdfTableMargins,
} from "@/lib/pdf-branding";

function formatFrDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatFrDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDistance(meters: number | null): string {
  if (meters === null) return "—";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}

export async function generatePatrolReport(
  execution: PatrolExecution,
  checkpoints: PatrolCheckpoint[],
): Promise<void> {
  const branding = await loadPdfBranding();
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const displayStatus = getPatrolDisplayStatus(execution);
  const statusLabel =
    displayStatus === "complete"
      ? "Complète"
      : displayStatus === "incident"
        ? "Incident"
        : "Incomplète";

  // ── Header ────────────────────────────────────────────────────────
  const header = {
    title: "RAPPORT DE RONDE",
    subtitle: `Généré le ${formatFrDateTime(new Date().toISOString())} — Document confidentiel`,
  };
  let y = drawPdfHeader(doc, branding, header);
  const margins = pdfTableMargins(branding, { header });

  // ── Summary section ───────────────────────────────────────────────
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Informations de la ronde", 14, y);

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  const summaryRows: [string, string][] = [
    ["Site", execution.site],
    ["Client", execution.client ?? "—"],
    ["Agent", execution.agentName],
    ["Itinéraire", execution.routeName],
    ["Date", formatFrDate(execution.startedAt)],
    ["Heure de début", formatFrDateTime(execution.startedAt)],
    [
      "Heure de fin",
      execution.endedAt ? formatFrDateTime(execution.endedAt) : "—",
    ],
    [
      "Durée",
      execution.actualDurationMinutes !== null
        ? `${execution.actualDurationMinutes} min`
        : "—",
    ],
    ["Distance parcourue", formatDistance(execution.actualDistanceMeters)],
    ["Taux de complétion", `${execution.completionRate}%`],
    ["Statut", statusLabel],
  ];

  for (const [label, value] of summaryRows) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label} :`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 75, y);
    y += 5;
  }

  // ── Checkpoint table ──────────────────────────────────────────────
  y += 4;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Détail des points de contrôle", 14, y);
  y += 3;

  const checkpointRows = execution.checkpointScans.map((scan, index) => {
    const checkpoint = checkpoints.find((cp) => cp.id === scan.checkpointId);
    const checkpointName = checkpoint ? checkpoint.name : `Point ${index + 1}`;
    const scannedTime = scan.scannedAt ? formatFrDateTime(scan.scannedAt) : "—";
    const statusLabel =
      scan.status === "validated"
        ? "Validé"
        : scan.status === "missed"
          ? "Manqué"
          : "En attente";
    const comment = scan.comment ?? "";

    return [
      String(index + 1),
      checkpointName,
      scannedTime,
      statusLabel,
      comment,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [
      ["#", "Point de contrôle", "Heure de scan", "Statut", "Commentaire"],
    ],
    body: checkpointRows,
    ...brandedPdfDefaults,
    styles: { ...brandedPdfDefaults.styles, fontSize: 7, cellPadding: 2 },
    headStyles: {
      ...brandedPdfDefaults.headStyles,
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 45 },
      2: { cellWidth: 35 },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 60 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const val = data.cell.raw as string;
        if (val === "Manqué") {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        } else if (val === "Validé") {
          data.cell.styles.textColor = [52, 211, 153];
        }
      }
    },
    margin: margins,
  });

  // ── Incidents section ─────────────────────────────────────────────
  const incidentScans = execution.checkpointScans.filter(
    (s) => s.status === "missed" && (s.incidentDescription ?? s.comment),
  );

  if (incidentScans.length > 0) {
    let afterTableY =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 8;
    // Évite que le titre « Incidents » tombe dans la zone du pied de page.
    if (afterTableY > pageHeight - PDF_FOOTER_RESERVED_MM - 15) {
      doc.addPage();
      afterTableY = pdfHeaderHeight(branding, header) + 4;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Incidents", 14, afterTableY);

    const incidentRows = incidentScans.map((scan, i) => {
      const checkpoint = checkpoints.find((cp) => cp.id === scan.checkpointId);
      const scanIndex = execution.checkpointScans.indexOf(scan);
      const name = checkpoint ? checkpoint.name : `Point ${scanIndex + 1}`;
      const time = scan.scannedAt ? formatFrDateTime(scan.scannedAt) : "—";
      const desc = scan.incidentDescription ?? scan.comment ?? "";
      return [String(i + 1), name, time, desc];
    });

    autoTable(doc, {
      startY: afterTableY + 3,
      head: [["#", "Point de contrôle", "Heure", "Description de l'incident"]],
      body: incidentRows,
      ...brandedPdfDefaults,
      styles: { ...brandedPdfDefaults.styles, fontSize: 7, cellPadding: 2 },
      headStyles: {
        ...brandedPdfDefaults.headStyles,
        fillColor: [127, 29, 29],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 90 },
      },
      margin: margins,
    });
  }

  // ── Footer ────────────────────────────────────────────────────────
  applyPdfFooters(doc, branding, {
    header: { ...header, skipFirstPage: true },
  });

  // ── Save ──────────────────────────────────────────────────────────
  const dateSlug = execution.startedAt.slice(0, 10);
  const siteSlug = execution.site
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 20);
  doc.save(`rapport-ronde-${siteSlug}-${dateSlug}.pdf`);
}
