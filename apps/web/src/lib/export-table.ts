/**
 * Export d'un tableau en PDF ou en fichier ouvrable dans Excel.
 *
 * « Excel » = CSV UTF-8 avec BOM et séparateur « ; » : c'est le format que
 * l'Excel français ouvre sans assistant d'import ni avertissement de format
 * (un faux .xls HTML déclenche l'alerte « le format ne correspond pas à
 * l'extension »). Aucune bibliothèque xlsx n'est nécessaire.
 */

export type ValeurCellule = string | number | null | undefined;

export interface ColonneExport<T> {
  titre: string;
  valeur: (ligne: T) => ValeurCellule;
}

export interface OptionsPdf {
  /** Titre affiché en tête du document. */
  titre: string;
  /** Ligne d'information sous le titre (période, client…). */
  sousTitre?: string;
  orientation?: "portrait" | "landscape";
  /** Ligne de total en pied de tableau, une valeur par colonne. */
  pied?: ValeurCellule[];
}

/** Espaces insécables produits par toLocaleString : absents de la police PDF. */
const ESPACES_SPECIAUX = /[  ]/g;

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

function telecharger(blob: Blob, nomFichier: string) {
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  // Safari annule le téléchargement si l'URL est révoquée tout de suite.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Génère un CSV « ; » avec BOM UTF-8, lisible directement dans Excel. */
export function exporterCsvExcel<T>(
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
  telecharger(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" }), nom);
}

/** Génère un PDF (jsPDF + autotable, chargés à la demande). */
export async function exporterPdf<T>(
  nomFichier: string,
  colonnes: ColonneExport<T>[],
  lignes: T[],
  options: OptionsPdf,
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: options.orientation ?? "portrait" });
  doc.setFontSize(14);
  doc.text(options.titre, 14, 16);
  doc.setFontSize(9);
  const info = [
    options.sousTitre,
    `Édité le ${new Date().toLocaleDateString("fr-FR")} — ${lignes.length} ligne(s)`,
  ]
    .filter(Boolean)
    .join(" — ");
  doc.text(info, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [colonnes.map((c) => c.titre)],
    body: lignes.map((l) => colonnes.map((c) => texteCellulePdf(c.valeur(l)))),
    ...(options.pied
      ? { foot: [options.pied.map((v) => texteCellulePdf(v))] }
      : {}),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [34, 211, 238] },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: 20,
      fontStyle: "bold",
    },
  });

  const nom = nomFichier.endsWith(".pdf") ? nomFichier : `${nomFichier}.pdf`;
  doc.save(nom);
}
