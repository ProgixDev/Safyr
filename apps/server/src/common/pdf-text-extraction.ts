import { join } from "node:path";
import { pathToFileURL } from "node:url";

// pdfjs-dist (utilisé en interne par pdf-parse) référence plusieurs API
// navigateur — DOMMatrix, Path2D, ImageData, Image, OffscreenCanvas —
// absentes de l'environnement Node serverless de Vercel. On les fournit via
// @napi-rs/canvas (binaires natifs précompilés par plateforme, donc fiable
// en serverless — contrairement au paquet `canvas` classique qui nécessite
// une compilation locale). Voir contract-extraction.service.ts pour le
// même correctif, découvert et validé en production sur cette fonction.
//
// pdfjs-dist essaie aussi de charger son "worker" (le moteur d'analyse du
// PDF) via un import() dynamique dont Vercel ne trace pas correctement le
// fichier cible. La commande de build copie ce fichier dans notre propre
// dist/ (voir vercel.json) et on indique explicitement ce chemin à
// pdf-parse via PDFParse.setWorker(...).
const WORKER_PATH = pathToFileURL(join(__dirname, "..", "pdf.worker.mjs")).href;

/** En dessous de ce nombre de caractères, le PDF est presque certainement un
 * scan sans couche de texte : l'extraire donnerait un résultat vide ou du
 * bruit plutôt que le contenu réel du document. */
export const TEXTE_PDF_MINIMUM = 40;

export async function importPdfParse() {
  const globalObject = globalThis as {
    DOMMatrix?: unknown;
    Path2D?: unknown;
    ImageData?: unknown;
    Image?: unknown;
    OffscreenCanvas?: unknown;
  };
  if (typeof globalObject.DOMMatrix === "undefined") {
    const canvas = await import("@napi-rs/canvas");
    globalObject.DOMMatrix = canvas.DOMMatrix;
    globalObject.Path2D = canvas.Path2D;
    globalObject.ImageData = canvas.ImageData;
    globalObject.Image = canvas.Image;
    globalObject.OffscreenCanvas = canvas.Canvas;
  }
  const mod = await import("pdf-parse");
  mod.PDFParse.setWorker(WORKER_PATH);
  return mod;
}

/** Texte brut d'un PDF, ou null s'il n'a pas de couche de texte exploitable. */
export async function extractPdfText(buffer: Buffer): Promise<string | null> {
  const pdfParseModule = await importPdfParse();
  const parser = new pdfParseModule.PDFParse({ data: buffer });
  try {
    const resultat = await parser.getText();
    const texte = resultat.text;
    return texte.trim().length >= TEXTE_PDF_MINIMUM ? texte : null;
  } finally {
    await parser.destroy();
  }
}
