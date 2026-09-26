/**
 * Teintes des cellules de tableau dans les PDF : mêmes familles que les badges
 * de l'écran (vert = valide / faible, orange = à surveiller / moyen, rouge =
 * expiré / grave, rouge foncé = critique / mortel).
 */
import type { Styles } from "jspdf-autotable";

export type TonPdf = "vert" | "orange" | "rouge" | "critique" | "bleu" | "gris";

type Rgb = [number, number, number];

export const TONS_PDF: Record<TonPdf, { fill: Rgb; text: Rgb }> = {
  vert: { fill: [220, 252, 231], text: [21, 128, 61] },
  orange: { fill: [255, 237, 213], text: [194, 65, 12] },
  rouge: { fill: [254, 226, 226], text: [185, 28, 28] },
  critique: { fill: [153, 27, 27], text: [255, 255, 255] },
  bleu: { fill: [219, 234, 254], text: [29, 78, 216] },
  gris: { fill: [241, 245, 249], text: [71, 85, 105] },
};

/** Applique une teinte à une cellule autotable (`didParseCell`). */
export function teinterCellule(
  cell: { styles: Partial<Styles> },
  ton: TonPdf,
): void {
  const t = TONS_PDF[ton];
  cell.styles.fillColor = t.fill;
  cell.styles.textColor = t.text;
  cell.styles.fontStyle = "bold";
  cell.styles.halign = "center";
}
