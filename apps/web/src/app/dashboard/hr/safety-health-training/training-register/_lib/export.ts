/**
 * Exports du registre de formation (PDF et Excel de marque) : le tableau tel
 * qu'affiché, avec ses filtres.
 */
import type { jsPDF } from "jspdf";
import {
  applyPdfFooters,
  brandedPdfDefaults,
  drawPdfHeader,
  loadPdfBranding,
  pdfTableMargins,
  type PdfBranding,
} from "@/lib/pdf-branding";
import { TONS_PDF, teinterCellule, type TonPdf } from "@/lib/pdf-tones";
import { exporterExcel } from "@/lib/xlsx";
import {
  LIBELLE_STATUT,
  LIBELLE_TYPE,
  dateFr,
  type LigneFormation,
  type StatutFormation,
} from "./formations";

const TITRE = "REGISTRE DE FORMATION";

const TON_STATUT: Record<StatutFormation, TonPdf> = {
  valide: "vert",
  bientot: "orange",
  expire: "rouge",
  sans_echeance: "gris",
};

const dateJour = () => new Date().toISOString().slice(0, 10);

export interface OptionsExportFormations {
  /** Rappel des filtres appliqués, affiché sous le titre. */
  filtres?: string;
}

function sousTitre(n: number, filtres?: string): string {
  return [
    filtres,
    `Édité le ${new Date().toLocaleDateString("fr-FR")} — ${n} formation(s)`,
  ]
    .filter(Boolean)
    .join(" — ");
}

const heures = (l: LigneFormation) => l.dureeH ?? 0;

/** Construit le PDF ; séparé du téléchargement pour pouvoir le tester. */
export async function construireRegistrePdf(
  lignes: LigneFormation[],
  opts: OptionsExportFormations,
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
    subtitle: sousTitre(lignes.length, opts.filtres),
  };
  const margin = pdfTableMargins(branding, { header });
  let y = drawPdfHeader(doc, branding, header);

  // Synthèse : cinq pastilles colorées.
  const nb = (s: StatutFormation) =>
    lignes.filter((l) => l.statut === s).length;
  const totalH = lignes.reduce((n, l) => n + heures(l), 0);
  const pastilles: { texte: string; ton: TonPdf }[] = [
    { texte: `Formations : ${lignes.length}`, ton: "bleu" },
    {
      texte: `Heures : ${totalH.toLocaleString("fr-FR").replace(/\s/g, " ")} h`,
      ton: "gris",
    },
    { texte: `Valides : ${nb("valide")}`, ton: "vert" },
    { texte: `Expirent bientôt : ${nb("bientot")}`, ton: "orange" },
    { texte: `Expirées : ${nb("expire")}`, ton: "rouge" },
  ];
  const largeur = (L - 2 * margin.left - 4 * 4) / pastilles.length;
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

  autoTable(doc, {
    ...brandedPdfDefaults,
    startY: y,
    margin,
    showHead: "everyPage",
    rowPageBreak: "avoid",
    head: [
      [
        "Salarié",
        "Intitulé de la formation",
        "Organisme",
        "Début",
        "Fin",
        "Durée (h)",
        "Type",
        "N° certificat / attestation",
        "Validité",
        "Statut",
        "Document",
      ],
    ],
    body: lignes.map((l) => [
      l.salarie,
      l.intitule,
      l.organisme,
      dateFr(l.debut),
      dateFr(l.fin),
      l.dureeH === null ? "" : String(l.dureeH).replace(".", ","),
      LIBELLE_TYPE[l.type],
      l.certificat,
      dateFr(l.validite),
      LIBELLE_STATUT[l.statut],
      l.document ? "Joint" : "",
    ]),
    foot: [
      [
        {
          content: `${lignes.length} formation(s)`,
          colSpan: 5,
          styles: { halign: "left" },
        },
        {
          content: String(totalH).replace(".", ","),
          styles: { halign: "center" },
        },
        { content: "", colSpan: 5 },
      ],
    ],
    showFoot: "lastPage",
    columnStyles: {
      0: { cellWidth: 30, fontStyle: "bold" },
      1: { cellWidth: 46 },
      2: { cellWidth: 32 },
      3: { cellWidth: 18, halign: "center" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 14, halign: "center" },
      6: { cellWidth: 24, halign: "center" },
      7: { cellWidth: 28 },
      8: { cellWidth: 18, halign: "center" },
      9: { cellWidth: 24 },
      10: { cellWidth: 17, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const l = lignes[data.row.index];
      if (!l) return;
      if (data.column.index === 9)
        teinterCellule(data.cell, TON_STATUT[l.statut]);
      else if (data.column.index === 8 && l.validite && l.statut !== "valide")
        data.cell.styles.textColor = TONS_PDF[TON_STATUT[l.statut]].text;
      else if (data.column.index === 10 && l.document)
        teinterCellule(data.cell, "bleu");
    },
  });

  applyPdfFooters(doc, branding, {
    header: { ...header, skipFirstPage: true },
  });
  return doc;
}

/** Télécharge le registre affiché au format PDF. */
export async function exporterRegistrePdf(
  lignes: LigneFormation[],
  opts: OptionsExportFormations = {},
): Promise<void> {
  const branding = await loadPdfBranding();
  const doc = await construireRegistrePdf(lignes, opts, branding);
  doc.save(`registre-de-formation-${dateJour()}.pdf`);
}

/** Télécharge le registre affiché au format Excel (.xlsx de marque). */
export async function exporterRegistreExcel(
  lignes: LigneFormation[],
  opts: OptionsExportFormations = {},
): Promise<void> {
  await exporterExcel({
    fileName: `registre-de-formation-${dateJour()}`,
    sheetName: "Registre de formation",
    title: TITRE,
    subtitle: sousTitre(lignes.length, opts.filtres),
    columns: [
      { header: "Salarié", key: "salarie", width: 26 },
      { header: "Intitulé de la formation", key: "intitule", width: 34 },
      { header: "Organisme", key: "organisme", width: 26 },
      { header: "Date de début", key: "debut", format: "date", width: 13 },
      { header: "Date de fin", key: "fin", format: "date", width: 13 },
      { header: "Durée (h)", key: "duree", format: "number", width: 10 },
      { header: "Type", key: "type", width: 16, align: "center" },
      { header: "N° certificat / attestation", key: "certificat", width: 24 },
      {
        header: "Date de validité",
        key: "validite",
        format: "date",
        width: 14,
      },
      { header: "Statut", key: "statut", width: 16, align: "center" },
      { header: "Document", key: "document", width: 28 },
    ],
    rows: lignes.map((l) => ({
      salarie: l.salarie,
      intitule: l.intitule,
      organisme: l.organisme,
      debut: l.debut,
      fin: l.fin,
      duree: l.dureeH,
      type: LIBELLE_TYPE[l.type],
      certificat: l.certificat,
      validite: l.validite,
      statut: LIBELLE_STATUT[l.statut],
      document: l.document?.name ?? "",
    })),
    totals: { duree: lignes.reduce((n, l) => n + heures(l), 0) },
  });
}
