/**
 * Exports du registre des accidents du travail (PDF et Excel) : même habillage
 * que le registre du personnel (en-tête société, titre encadré, filet coloré,
 * pied de page avec la phrase L612-14 sur chaque page).
 */
import type { jsPDF } from "jspdf";
import {
  applyPdfFooters,
  brandedPdfDefaults,
  drawPdfHeader,
  loadPdfBranding,
  pdfTableMargins,
  type PdfBranding,
} from "./pdf-branding";
import { TONS_PDF, teinterCellule, type TonPdf } from "./pdf-tones";
import { exporterExcel } from "./xlsx";
import type { WorkAccident } from "./types";

export const LIBELLES_GRAVITE: Record<WorkAccident["severity"], string> = {
  minor: "Bénin",
  moderate: "Modéré",
  severe: "Grave",
  fatal: "Mortel",
};

export const LIBELLES_STATUT_ACCIDENT: Record<WorkAccident["status"], string> =
  {
    declared: "Déclaré",
    investigating: "En investigation",
    closed: "Clôturé",
  };

const TON_GRAVITE: Record<WorkAccident["severity"], TonPdf> = {
  minor: "vert",
  moderate: "orange",
  severe: "rouge",
  fatal: "critique",
};
const TON_STATUT: Record<WorkAccident["status"], TonPdf> = {
  declared: "bleu",
  investigating: "orange",
  closed: "vert",
};

const TITRE = "REGISTRE DES ACCIDENTS DU TRAVAIL";

/** Date saisie (minuit UTC) → jj/mm/aaaa, sans décalage de fuseau. */
function jourFr(valeur?: Date | string | null): string {
  if (!valeur) return "";
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return "";
  const [a, m, j] = d.toISOString().slice(0, 10).split("-");
  return `${j}/${m}/${a}`;
}

const dateJour = () => new Date().toISOString().slice(0, 10);

export interface OptionsExportAccidents {
  /** Nom du salarié d'après son identifiant. */
  nomSalarie: (employeeId: string) => string;
  /** Rappel des filtres appliqués, affiché sous le titre. */
  filtres?: string;
}

function sousTitre(n: number, filtres?: string): string {
  return [
    filtres,
    `Édité le ${new Date().toLocaleDateString("fr-FR")} — ${n} accident(s)`,
  ]
    .filter(Boolean)
    .join(" — ");
}

/** Construit le PDF ; séparé du téléchargement pour pouvoir le tester. */
export async function construireAccidentsPdf(
  accidents: WorkAccident[],
  opts: OptionsExportAccidents,
  branding: PdfBranding,
): Promise<jsPDF> {
  const [{ default: JsPdf }, autoTable] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable").then((m) => m.default),
  ]);
  const doc = new JsPdf({ orientation: "landscape" });
  const L = doc.internal.pageSize.getWidth();
  const header = {
    title: TITRE,
    subtitle: sousTitre(accidents.length, opts.filtres),
  };
  const margin = pdfTableMargins(branding, { header });
  let y = drawPdfHeader(doc, branding, header);

  // Synthèse : quatre pastilles colorées.
  const pastilles: { texte: string; ton: TonPdf }[] = [
    { texte: `Accidents : ${accidents.length}`, ton: "bleu" },
    {
      texte: `Avec arrêt de travail : ${accidents.filter((a) => a.workStoppage).length}`,
      ton: "orange",
    },
    {
      texte: `Graves ou mortels : ${accidents.filter((a) => a.severity === "severe" || a.severity === "fatal").length}`,
      ton: "rouge",
    },
    {
      texte: `Clôturés : ${accidents.filter((a) => a.status === "closed").length}`,
      ton: "vert",
    },
  ];
  const largeur = (L - 2 * margin.left - 3 * 4) / pastilles.length;
  pastilles.forEach((p, i) => {
    const ton = TONS_PDF[p.ton];
    const x = margin.left + i * (largeur + 4);
    doc.setFillColor(...ton.fill);
    doc.setDrawColor(...ton.text);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, largeur, 8, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...ton.text);
    doc.text(p.texte, x + largeur / 2, y + 5.2, { align: "center" });
  });
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  y += 8 + 6;

  const arret = (a: WorkAccident) =>
    a.workStoppage
      ? [
          a.workStoppageStart ? `Du ${jourFr(a.workStoppageStart)}` : "Oui",
          a.workStoppageEnd ? `au ${jourFr(a.workStoppageEnd)}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "Non";

  autoTable(doc, {
    ...brandedPdfDefaults,
    startY: y,
    margin,
    showHead: "everyPage",
    rowPageBreak: "avoid",
    head: [
      [
        "Salarié",
        "Date et heure",
        "Lieu",
        "Description",
        "Lésions",
        "Gravité",
        "Statut",
        "Déclaration",
        "Arrêt de travail",
        "Reprise",
        "CPAM notifiée",
      ],
    ],
    body: accidents.map((a) => [
      opts.nomSalarie(a.employeeId),
      [jourFr(a.accidentDate), a.accidentTime].filter(Boolean).join("\n"),
      a.location,
      a.description,
      a.injuries,
      LIBELLES_GRAVITE[a.severity] ?? "",
      LIBELLES_STATUT_ACCIDENT[a.status] ?? "",
      [
        a.declarationNumber ? `N° ${a.declarationNumber}` : "",
        jourFr(a.declarationDate),
      ]
        .filter(Boolean)
        .join("\n"),
      arret(a),
      jourFr(a.returnToWork),
      a.cpamNotified ? "Oui" : "Non",
    ]),
    columnStyles: {
      0: { cellWidth: 26, fontStyle: "bold" },
      1: { cellWidth: 20 },
      2: { cellWidth: 26 },
      5: { cellWidth: 17 },
      6: { cellWidth: 21 },
      7: { cellWidth: 25 },
      8: { cellWidth: 24 },
      9: { cellWidth: 18 },
      10: { cellWidth: 16, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const a = accidents[data.row.index];
      if (!a) return;
      if (data.column.index === 5)
        teinterCellule(data.cell, TON_GRAVITE[a.severity]);
      else if (data.column.index === 6)
        teinterCellule(data.cell, TON_STATUT[a.status]);
      else if (data.column.index === 10)
        teinterCellule(data.cell, a.cpamNotified ? "vert" : "gris");
    },
  });

  applyPdfFooters(doc, branding, {
    header: { ...header, skipFirstPage: true },
  });
  return doc;
}

/** Génère et télécharge le registre au format PDF. */
export async function exportAccidentsToPdf(
  accidents: WorkAccident[],
  opts: OptionsExportAccidents,
): Promise<void> {
  const branding = await loadPdfBranding();
  const doc = await construireAccidentsPdf(accidents, opts, branding);
  doc.save(`registre-accidents-travail-${dateJour()}.pdf`);
}

/** Génère et télécharge le registre au format Excel (.xlsx de marque). */
export async function exportAccidentsToExcel(
  accidents: WorkAccident[],
  opts: OptionsExportAccidents,
): Promise<void> {
  await exporterExcel({
    fileName: `registre-accidents-travail-${dateJour()}`,
    sheetName: "Accidents du travail",
    title: TITRE,
    subtitle: sousTitre(accidents.length, opts.filtres),
    columns: [
      { header: "Salarié", key: "salarie", width: 24 },
      { header: "Date de l'accident", key: "date", format: "date", width: 14 },
      { header: "Heure", key: "heure", width: 8, align: "center" },
      { header: "Lieu", key: "lieu", width: 24 },
      { header: "Description", key: "description", width: 42 },
      { header: "Lésions", key: "lesions", width: 30 },
      { header: "Gravité", key: "gravite", width: 11, align: "center" },
      { header: "Statut", key: "statut", width: 16, align: "center" },
      { header: "N° de déclaration", key: "numero", width: 16 },
      {
        header: "Date de déclaration",
        key: "declaration",
        format: "date",
        width: 14,
      },
      { header: "Arrêt de travail", key: "arret", width: 10, align: "center" },
      { header: "Début d'arrêt", key: "debut", format: "date", width: 13 },
      { header: "Fin d'arrêt", key: "fin", format: "date", width: 13 },
      { header: "Reprise", key: "reprise", format: "date", width: 13 },
      { header: "CPAM notifiée", key: "cpam", width: 10, align: "center" },
      {
        header: "Date de notification CPAM",
        key: "cpamDate",
        format: "date",
        width: 14,
      },
      { header: "Témoins", key: "temoins", width: 24 },
      { header: "Notes", key: "notes", width: 30 },
    ],
    rows: accidents.map((a) => ({
      salarie: opts.nomSalarie(a.employeeId),
      date: jourFr(a.accidentDate),
      heure: a.accidentTime,
      lieu: a.location,
      description: a.description,
      lesions: a.injuries,
      gravite: LIBELLES_GRAVITE[a.severity] ?? "",
      statut: LIBELLES_STATUT_ACCIDENT[a.status] ?? "",
      numero: a.declarationNumber ?? "",
      declaration: jourFr(a.declarationDate),
      arret: a.workStoppage ? "Oui" : "Non",
      debut: jourFr(a.workStoppageStart),
      fin: jourFr(a.workStoppageEnd),
      reprise: jourFr(a.returnToWork),
      cpam: a.cpamNotified ? "Oui" : "Non",
      cpamDate: jourFr(a.cpamNotificationDate),
      temoins: a.witnesses?.join(", ") ?? "",
      notes: a.notes ?? "",
    })),
  });
}
