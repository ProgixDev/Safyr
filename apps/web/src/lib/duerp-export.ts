/**
 * Exports du DUERP (PDF et Excel) : même habillage que le registre du
 * personnel (en-tête société, titre encadré, filet coloré, pied de page avec
 * la phrase L612-14 sur chaque page).
 */
import type { jsPDF } from "jspdf";
import {
  PDF_FOOTER_RESERVED_MM,
  applyPdfFooters,
  brandedPdfDefaults,
  drawPdfHeader,
  loadPdfBranding,
  pdfTableMargins,
  type PdfBranding,
} from "./pdf-branding";
import { TONS_PDF, teinterCellule, type TonPdf } from "./pdf-tones";
import { exporterExcel } from "./xlsx";

export interface Risk {
  risque: string;
  cause: string;
  gravite: "Grave" | "Moyenne" | "Faible";
  probabilite: "Élevée" | "Moyenne" | "Faible";
  mesures: string;
}

export interface Poste {
  id: string;
  title: string;
  risks: Risk[];
}

/**
 * Cotation d'un risque : gravité (1 à 3) × probabilité (1 à 3).
 * 1-2 faible, 3-4 moyen, 6 élevé, 9 critique (grave ET probable).
 */
export const POINTS_GRAVITE: Record<Risk["gravite"], number> = {
  Faible: 1,
  Moyenne: 2,
  Grave: 3,
};
export const POINTS_PROBABILITE: Record<Risk["probabilite"], number> = {
  Faible: 1,
  Moyenne: 2,
  Élevée: 3,
};

export type Niveau = "Faible" | "Moyen" | "Élevé" | "Critique";

export function scoreRisque(risk: Risk): number {
  return (
    (POINTS_GRAVITE[risk.gravite] ?? 2) *
    (POINTS_PROBABILITE[risk.probabilite] ?? 2)
  );
}

export function niveauDeScore(score: number): Niveau {
  if (score >= 9) return "Critique";
  if (score >= 6) return "Élevé";
  if (score >= 3) return "Moyen";
  return "Faible";
}

export const niveauRisque = (risk: Risk): Niveau =>
  niveauDeScore(scoreRisque(risk));

const TON_NIVEAU: Record<Niveau, TonPdf> = {
  Faible: "vert",
  Moyen: "orange",
  Élevé: "rouge",
  Critique: "critique",
};
const tonGravite = (g: string): TonPdf =>
  g === "Grave" ? "rouge" : g === "Moyenne" ? "orange" : "vert";
const tonProbabilite = (p: string): TonPdf =>
  p === "Élevée" ? "rouge" : p === "Moyenne" ? "orange" : "vert";

const TITRE = "DUERP — DOCUMENT UNIQUE D'ÉVALUATION DES RISQUES PROFESSIONNELS";

const RISK_HEADERS = [
  "Risque identifié",
  "Cause potentielle",
  "Gravité",
  "Probabilité",
  "Niveau",
  "Mesures de prévention",
];

const dateJour = () => new Date().toISOString().slice(0, 10);

function sousTitre(postes: Poste[]): string {
  const risques = postes.reduce((n, p) => n + p.risks.length, 0);
  return `Édité le ${new Date().toLocaleDateString("fr-FR")} — ${postes.length} poste(s), ${risques} risque(s) évalué(s)`;
}

/** Construit le PDF ; séparé du téléchargement pour pouvoir le tester. */
export async function construireDuerpPdf(
  postes: Poste[],
  branding: PdfBranding,
): Promise<jsPDF> {
  const [{ default: JsPdf }, autoTable] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable").then((m) => m.default),
  ]);
  const doc = new JsPdf({ orientation: "landscape" });
  const L = doc.internal.pageSize.getWidth();
  const header = { title: TITRE, subtitle: sousTitre(postes) };
  const margin = pdfTableMargins(branding, { header });
  let y = drawPdfHeader(doc, branding, header);

  // Synthèse : une pastille par niveau de risque.
  const niveaux: Niveau[] = ["Faible", "Moyen", "Élevé", "Critique"];
  const tousLesRisques = postes.flatMap((p) => p.risks);
  const largeurPastille = (L - 2 * margin.left - 3 * 4) / 4;
  niveaux.forEach((niveau, i) => {
    const ton = TONS_PDF[TON_NIVEAU[niveau]];
    const n = tousLesRisques.filter((r) => niveauRisque(r) === niveau).length;
    const x = margin.left + i * (largeurPastille + 4);
    doc.setFillColor(...ton.fill);
    doc.setDrawColor(...ton.text);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, largeurPastille, 8, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...ton.text);
    doc.text(
      `Risque ${niveau.toLowerCase()} : ${n}`,
      x + largeurPastille / 2,
      y + 5.2,
      {
        align: "center",
      },
    );
  });
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  y += 8 + 6;

  const limiteBas = doc.internal.pageSize.getHeight() - PDF_FOOTER_RESERVED_MM;
  for (const poste of postes) {
    // Pas de titre de poste orphelin en bas de page : le bandeau, l'en-tête de
    // colonnes et une première ligne doivent tenir.
    if (y + 30 > limiteBas) {
      doc.addPage();
      y = margin.top;
    }
    autoTable(doc, {
      ...brandedPdfDefaults,
      startY: y,
      margin,
      showHead: "everyPage",
      head: [
        [
          {
            content: `Poste : ${poste.title}   (${poste.risks.length} risque${poste.risks.length > 1 ? "s" : ""})`,
            colSpan: RISK_HEADERS.length,
            styles: {
              halign: "left",
              fillColor: [30, 41, 59],
              fontSize: 9.5,
              cellPadding: 2.4,
            },
          },
        ],
        RISK_HEADERS,
      ],
      body:
        poste.risks.length > 0
          ? poste.risks.map((r) => [
              r.risque,
              r.cause,
              r.gravite,
              r.probabilite,
              niveauRisque(r),
              r.mesures,
            ])
          : [
              [
                {
                  content: "Aucun risque évalué pour ce poste.",
                  colSpan: RISK_HEADERS.length,
                  styles: { halign: "center", fontStyle: "italic" },
                },
              ],
            ],
      columnStyles: {
        0: { cellWidth: 46, fontStyle: "bold" },
        1: { cellWidth: 52 },
        2: { cellWidth: 20 },
        3: { cellWidth: 22 },
        4: { cellWidth: 22 },
        5: { cellWidth: 107 },
      },
      rowPageBreak: "avoid",
      didParseCell: (data) => {
        if (data.section !== "body" || poste.risks.length === 0) return;
        const risque = poste.risks[data.row.index];
        if (!risque) return;
        if (data.column.index === 2)
          teinterCellule(data.cell, tonGravite(risque.gravite));
        else if (data.column.index === 3)
          teinterCellule(data.cell, tonProbabilite(risque.probabilite));
        else if (data.column.index === 4)
          teinterCellule(data.cell, TON_NIVEAU[niveauRisque(risque)]);
      },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 7;
  }

  applyPdfFooters(doc, branding, {
    header: { ...header, skipFirstPage: true },
  });
  return doc;
}

/** Génère et télécharge le DUERP au format PDF. */
export async function exportDuerpToPdf(postes: Poste[]): Promise<void> {
  const branding = await loadPdfBranding();
  const doc = await construireDuerpPdf(postes, branding);
  doc.save(`DUERP_${dateJour()}.pdf`);
}

/** Génère et télécharge le DUERP au format Excel (.xlsx de marque). */
export async function exportDuerpToExcel(postes: Poste[]): Promise<void> {
  await exporterExcel({
    fileName: `DUERP_${dateJour()}`,
    sheetName: "DUERP",
    title: TITRE,
    subtitle: sousTitre(postes),
    columns: [
      { header: "Poste", key: "poste", width: 34 },
      { header: "Risque identifié", key: "risque", width: 30 },
      { header: "Cause potentielle", key: "cause", width: 34 },
      { header: "Gravité", key: "gravite", width: 12, align: "center" },
      { header: "Probabilité", key: "probabilite", width: 13, align: "center" },
      { header: "Niveau", key: "niveau", width: 12, align: "center" },
      { header: "Mesures de prévention", key: "mesures", width: 55 },
    ],
    rows: postes.flatMap((poste) =>
      poste.risks.map((r) => ({
        poste: poste.title,
        risque: r.risque,
        cause: r.cause,
        gravite: r.gravite,
        probabilite: r.probabilite,
        niveau: niveauRisque(r),
        mesures: r.mesures,
      })),
    ),
  });
}
