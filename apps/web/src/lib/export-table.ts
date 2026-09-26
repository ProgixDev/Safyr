/**
 * Export d'un tableau en PDF de marque ou en vrai fichier .xlsx.
 *
 * Le PDF porte l'en-tête société (logo, coordonnées, dirigeant), le pied de
 * page société + phrase L612-14 et « Page x / y » sur chaque page. Le fichier
 * Excel est un .xlsx (formats numériques et dates réels, en-têtes figées).
 */
import {
  applyPdfFooters,
  brandedPdfDefaults,
  drawPdfHeader,
  loadPdfBranding,
  pdfTableMargins,
  type PdfBranding,
} from "./pdf-branding";
import {
  exporterExcel,
  telechargerBlob,
  type ColonneExcel,
  type FormatColonneExcel,
} from "./xlsx";

export { exporterExcel } from "./xlsx";

export type ValeurCellule = string | number | null | undefined;

export interface ColonneExport<T> {
  titre: string;
  valeur: (ligne: T) => ValeurCellule;
  /** Format Excel forcé ; détecté sinon (nombres, dates jj/mm/aaaa). */
  format?: FormatColonneExcel;
}

export interface OptionsPdf {
  /** Titre encadré affiché sous l'en-tête société. */
  titre: string;
  /** Ligne d'information sous le titre (période, client…). */
  sousTitre?: string;
  orientation?: "portrait" | "landscape";
  /** Ligne de total en pied de tableau, une valeur par colonne. */
  pied?: ValeurCellule[];
  /** Habillage déjà chargé ; sinon chargé via loadPdfBranding(). */
  branding?: PdfBranding;
}

/** Options facultatives de l'export Excel d'un tableau. */
export interface OptionsExcelTableau {
  titre?: string;
  sousTitre?: string;
  /** Ligne de totaux, une valeur par colonne (comme `pied` du PDF). */
  pied?: ValeurCellule[];
  branding?: PdfBranding;
  /** Nom de l'onglet (« Export » par défaut). */
  nomFeuille?: string;
}

/** Espaces insécables produits par toLocaleString : absents de la police PDF. */
const ESPACES_SPECIAUX = /[  ]/g;
const DATE_FR = /^\d{2}\/\d{2}\/\d{4}$/;

function nombreFr(n: number, separateurMilliers: boolean): string {
  return n
    .toLocaleString("fr-FR", {
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
      useGrouping: separateurMilliers,
    })
    .replace(ESPACES_SPECIAUX, " ");
}

function texteCsv(v: ValeurCellule): string {
  if (v === null || v === undefined) return "";
  // Nombre sans séparateur de milliers pour qu'Excel le reconnaisse comme tel.
  const brut = typeof v === "number" ? nombreFr(v, false) : String(v);
  // Neutralise l'injection de formule (=, +, -, @ en début de texte libre).
  const sur =
    typeof v === "string" && /^[=+\-@]/.test(brut) ? `'${brut}` : brut;
  return `"${sur.replace(/"/g, '""')}"`;
}

function texteCellulePdf(v: ValeurCellule): string {
  if (v === null || v === undefined) return "";
  return typeof v === "number" ? nombreFr(v, true) : String(v);
}

/** Génère un CSV « ; » avec BOM UTF-8 (ancien format, conservé au besoin). */
export function exporterCsv<T>(
  nomFichier: string,
  colonnes: ColonneExport<T>[],
  lignes: T[],
): void {
  const entete = colonnes.map((c) => texteCsv(c.titre)).join(";");
  const corps = lignes.map((l) =>
    colonnes.map((c) => texteCsv(c.valeur(l))).join(";"),
  );
  const csv = [entete, ...corps].join("\r\n");
  const nom = nomFichier.endsWith(".csv") ? nomFichier : `${nomFichier}.csv`;
  telechargerBlob(
    new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" }),
    nom,
  );
}

function formatDetecte(valeurs: ValeurCellule[]): FormatColonneExcel {
  const pleines = valeurs.filter(
    (v) => v !== null && v !== undefined && v !== "",
  );
  if (pleines.length === 0) return "text";
  if (pleines.every((v) => typeof v === "number")) return "number";
  if (pleines.every((v) => typeof v === "string" && DATE_FR.test(v)))
    return "date";
  return "text";
}

/**
 * Export « Excel » d'un tableau : produit un vrai .xlsx de marque (le nom
 * historique est conservé pour les appelants existants). En cas d'échec de
 * génération, repli sur le CSV pour ne jamais laisser l'utilisateur sans fichier.
 */
export async function exporterCsvExcel<T>(
  nomFichier: string,
  colonnes: ColonneExport<T>[],
  lignes: T[],
  options: OptionsExcelTableau = {},
): Promise<void> {
  try {
    const valeurs = lignes.map((l) => colonnes.map((c) => c.valeur(l)));
    const cols: ColonneExcel[] = colonnes.map((c, i) => {
      const format = c.format ?? formatDetecte(valeurs.map((v) => v[i]));
      return {
        header: c.titre,
        key: `c${i}`,
        format,
        align:
          format === "text"
            ? undefined
            : format === "date"
              ? "center"
              : "right",
      };
    });
    const rows = valeurs.map((v) =>
      Object.fromEntries(v.map((val, i) => [`c${i}`, val])),
    );
    const totals = options.pied
      ? Object.fromEntries(
          options.pied.map((val, i) => [`c${i}`, val === "" ? undefined : val]),
        )
      : undefined;
    await exporterExcel({
      fileName: nomFichier,
      sheetName: options.nomFeuille ?? "Export",
      title: options.titre,
      subtitle: options.sousTitre,
      columns: cols,
      rows,
      totals,
      branding: options.branding,
    });
  } catch {
    exporterCsv(nomFichier, colonnes, lignes);
  }
}

/** Génère un PDF de marque (jsPDF + autotable, chargés à la demande). */
export async function exporterPdf<T>(
  nomFichier: string,
  colonnes: ColonneExport<T>[],
  lignes: T[],
  options: OptionsPdf,
): Promise<void> {
  const [{ default: jsPDF }, autoTable, branding] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable").then((m) => m.default),
    options.branding ?? loadPdfBranding(),
  ]);

  const doc = new jsPDF({ orientation: options.orientation ?? "portrait" });
  const header = {
    title: options.titre,
    subtitle: [
      options.sousTitre,
      `Édité le ${new Date().toLocaleDateString("fr-FR")} — ${lignes.length} ligne(s)`,
    ]
      .filter(Boolean)
      .join(" — "),
  };
  const startY = drawPdfHeader(doc, branding, header);

  // Colonnes numériques alignées à droite (comme dans Excel).
  const alignements: Record<number, { halign: "right" }> = {};
  colonnes.forEach((c, i) => {
    if (
      lignes.length > 0 &&
      lignes.every((l) => typeof c.valeur(l) === "number")
    )
      alignements[i] = { halign: "right" };
  });

  autoTable(doc, {
    ...brandedPdfDefaults,
    startY,
    margin: pdfTableMargins(branding, { header }),
    head: [colonnes.map((c) => c.titre)],
    body: lignes.map((l) => colonnes.map((c) => texteCellulePdf(c.valeur(l)))),
    ...(options.pied
      ? { foot: [options.pied.map((v) => texteCellulePdf(v))] }
      : {}),
    columnStyles: alignements,
  });

  applyPdfFooters(doc, branding, {
    header: { ...header, skipFirstPage: true },
  });

  const nom = nomFichier.endsWith(".pdf") ? nomFichier : `${nomFichier}.pdf`;
  doc.save(nom);
}
