import type { CellHookData, RowInput } from "jspdf-autotable";
import {
  PDF_FOOTER_RESERVED_MM,
  applyPdfFooters,
  brandedPdfDefaults,
  drawPdfHeader,
  loadPdfBranding,
  pdfHeaderHeight,
  pdfTableMargins,
} from "@/lib/pdf-branding";

/** Pièce attendue du dossier (obligatoire ou facultative). */
export interface ExigencePiece {
  /** Identifiant d'emplacement, égal au « slot » des pièces déposées. */
  type: string;
  libelle: string;
  categorie: string;
  obligatoire: boolean;
}

export interface PieceDossier {
  /** Emplacement de la pièce (correspond à `ExigencePiece.type`). */
  slot: string;
  /** Nom du fichier déposé. */
  name: string;
  /** Date de dépôt, au format AAAA-MM-JJ. */
  uploadDate: string;
  expiryDate?: string;
  /** Clé du bucket privé : sans elle, la pièce ne peut pas être lue. */
  storageKey?: string;
}

export interface DossierSousTraitant {
  nom: string;
  siret?: string;
  numeroAutorisation?: string;
  adresse?: string;
  exigences: ExigencePiece[];
  pieces: PieceDossier[];
}

/** Une ligne du sommaire : pièce déposée, ou pièce obligatoire manquante. */
export interface LigneDossier {
  /** Numéro d'ordre des pièces présentes ; null pour une pièce manquante. */
  numero: number | null;
  categorie: string;
  libelle: string;
  obligatoire: boolean;
  piece?: PieceDossier;
  /** Dernière colonne du sommaire : emplacement dans l'archive, annexe… */
  mention: string;
}

export interface AnnexeImage {
  titre: string;
  sousTitre: string;
  data: string;
  largeur: number;
  hauteur: number;
}

const CATEGORIES: Record<string, string> = {
  dirigeant: "Dirigeant",
  entreprise: "Entreprise",
  attestations: "Attestations",
  bancaire: "Bancaire",
  juridique: "Juridique",
};
const CATEGORIE_AUTRES = "Autres pièces";
const DIMENSION_MAX = 1800;

export function libelleCategorie(brut: string): string {
  return (
    CATEGORIES[brut] ?? (brut ? brut[0].toUpperCase() + brut.slice(1) : "")
  );
}

export function extensionDe(nom: string): string {
  const i = nom.lastIndexOf(".");
  return i === -1 ? "" : nom.slice(i + 1).toLowerCase();
}

function dateFr(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR");
}

function statut(ligne: LigneDossier): string {
  if (!ligne.piece) return "Manquante";
  const echeance = ligne.piece.expiryDate;
  if (!echeance) return "Présente";
  const fin = new Date(echeance).getTime();
  if (fin < Date.now()) return "Expirée";
  if (fin <= Date.now() + 30 * 86_400_000) return "Expire bientôt";
  return "Valide";
}

/**
 * Lignes du sommaire dans l'ordre des exigences : toutes les pièces
 * obligatoires (présentes ou non), les facultatives seulement si déposées, puis
 * les pièces déposées hors exigence.
 */
export function construireLignes(dossier: DossierSousTraitant): LigneDossier[] {
  const lignes: LigneDossier[] = [];
  const utilisees = new Set<PieceDossier>();
  for (const e of dossier.exigences) {
    const deposees = dossier.pieces.filter((p) => p.slot === e.type);
    deposees.forEach((piece) => {
      utilisees.add(piece);
      lignes.push({
        numero: null,
        categorie: libelleCategorie(e.categorie),
        libelle: e.libelle,
        obligatoire: e.obligatoire,
        piece,
        mention: "",
      });
    });
    if (deposees.length === 0 && e.obligatoire) {
      lignes.push({
        numero: null,
        categorie: libelleCategorie(e.categorie),
        libelle: e.libelle,
        obligatoire: true,
        mention: "",
      });
    }
  }
  for (const piece of dossier.pieces) {
    if (utilisees.has(piece)) continue;
    lignes.push({
      numero: null,
      categorie: CATEGORIE_AUTRES,
      libelle: piece.slot,
      obligatoire: false,
      piece,
      mention: "",
    });
  }

  // Les lignes d'une même catégorie doivent être contiguës pour le sommaire.
  const ordre = [...new Set(lignes.map((l) => l.categorie))];
  lignes.sort(
    (a, b) => ordre.indexOf(a.categorie) - ordre.indexOf(b.categorie),
  );
  let n = 0;
  for (const l of lignes) if (l.piece) l.numero = ++n;
  return lignes;
}

/** Recharge l'image dans un canvas : format normalisé et poids maîtrisé. */
export function imageVersJpeg(blob: Blob): Promise<{
  data: string;
  largeur: number;
  hauteur: number;
}> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const echelle = Math.min(
        1,
        DIMENSION_MAX / Math.max(img.naturalWidth, img.naturalHeight),
      );
      const largeur = Math.max(1, Math.round(img.naturalWidth * echelle));
      const hauteur = Math.max(1, Math.round(img.naturalHeight * echelle));
      const canvas = document.createElement("canvas");
      canvas.width = largeur;
      canvas.height = hauteur;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas indisponible"));
        return;
      }
      // Fond blanc : un PNG transparent deviendrait noir en JPEG.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, largeur, hauteur);
      ctx.drawImage(img, 0, 0, largeur, hauteur);
      URL.revokeObjectURL(url);
      resolve({ data: canvas.toDataURL("image/jpeg", 0.85), largeur, hauteur });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    img.src = url;
  });
}

/** Nom de fichier sûr : accents conservés, caractères interdits retirés. */
export function assainirNom(nom: string): string {
  return nom
    .replace(/[\u0000-\u001f\u007f\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
}

/**
 * Télécharge un contenu en mémoire. Blob + <a download> : sur Safari,
 * window.open après un await est bloqué, le lien de téléchargement non.
 */
export function telechargerBlob(blob: Blob, nom: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Révocation différée : Safari lit le blob après le clic.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Sommaire PDF de marque : page de garde puis tableau de TOUTES les pièces
 * requises (statut, échéance, présente ou manquante) et, en option, une page
 * d'annexe par image.
 */
export async function genererSommairePdf(options: {
  dossier: DossierSousTraitant;
  lignes: LigneDossier[];
  /** Titre de la dernière colonne (« Dans l'archive », « Dans ce PDF »). */
  colonne: string;
  annexes?: AnnexeImage[];
  /** Avertissements affichés sur la page de garde. */
  notes?: string[];
}): Promise<Uint8Array> {
  const { dossier, lignes, colonne, annexes = [], notes = [] } = options;
  const [{ default: jsPDF }, { default: autoTable }, branding] =
    await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
      loadPdfBranding(),
    ]);

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const marge = 14;
  const header = {
    title: "DOSSIER DE CONTRÔLE - SOUS-TRAITANT",
    subtitle: dossier.nom,
  };
  const finTableau = () =>
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY;

  // Page de garde
  let y = drawPdfHeader(doc, branding, header) + 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  const titre = doc.splitTextToSize(dossier.nom, W - 2 * marge) as string[];
  doc.text(titre, marge, y);
  y += titre.length * 8.5 + 2;

  const obligatoires = lignes.filter((l) => l.obligatoire);
  const presentes = obligatoires.filter((l) => l.piece).length;
  const info: [string, string][] = [
    ["SIRET", dossier.siret || "-"],
    ["N° d'autorisation CNAPS", dossier.numeroAutorisation || "-"],
    ["Adresse", dossier.adresse || "-"],
    ["Date d'édition", new Date().toLocaleDateString("fr-FR")],
    ["Pièces déposées", String(dossier.pieces.length)],
    [
      "Pièces obligatoires",
      `${presentes} présente(s) sur ${obligatoires.length}`,
    ],
  ];
  autoTable(doc, {
    startY: y,
    body: info,
    theme: "plain",
    styles: { fontSize: 10.5, cellPadding: 2.2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: [71, 85, 105] },
    },
    margin: { left: marge, right: marge },
  });
  if (notes.length > 0) {
    autoTable(doc, {
      startY: finTableau() + 8,
      head: [["À noter"]],
      body: notes.map((n) => [n]),
      ...brandedPdfDefaults,
      styles: { ...brandedPdfDefaults.styles, fontSize: 9 },
      headStyles: {
        ...brandedPdfDefaults.headStyles,
        halign: "left" as const,
        fillColor: [185, 28, 28],
      },
      margin: { left: marge, right: marge },
    });
  }

  // Sommaire
  doc.addPage();
  const corps: RowInput[] = [];
  let categorie = "";
  for (const l of lignes) {
    if (l.categorie !== categorie) {
      categorie = l.categorie;
      corps.push([
        {
          content: categorie,
          colSpan: 7,
          styles: {
            fillColor: [226, 232, 240],
            fontStyle: "bold",
            textColor: [15, 23, 42],
          },
        },
      ]);
    }
    corps.push([
      l.numero ? String(l.numero).padStart(2, "0") : "-",
      l.libelle + (l.obligatoire ? "" : " (facultative)"),
      l.piece?.name ?? "-",
      dateFr(l.piece?.uploadDate),
      dateFr(l.piece?.expiryDate),
      statut(l),
      l.mention || (l.piece ? "" : "Pièce à fournir"),
    ]);
  }
  autoTable(doc, {
    startY: pdfHeaderHeight(branding, header) + 2,
    head: [
      [
        "N°",
        "Pièce",
        "Fichier déposé",
        "Déposé le",
        "Échéance",
        "Statut",
        colonne,
      ],
    ],
    body: corps,
    ...brandedPdfDefaults,
    styles: { ...brandedPdfDefaults.styles, fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 32 },
      2: { cellWidth: 34 },
      3: { cellWidth: 16 },
      4: { cellWidth: 16 },
      5: { cellWidth: 19 },
    },
    margin: pdfTableMargins(branding, { header }),
    didParseCell: (data: CellHookData) => {
      if (data.section !== "body" || data.column.index !== 5) return;
      const texte = data.cell.text.join(" ");
      if (texte === "Manquante" || texte === "Expirée") {
        data.cell.styles.textColor = [185, 28, 28];
        data.cell.styles.fontStyle = "bold";
      } else if (texte === "Expire bientôt") {
        data.cell.styles.textColor = [180, 83, 9];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Annexes : une page par image
  const haut = pdfHeaderHeight(branding, header) + 2;
  annexes.forEach((a) => {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(a.titre, marge, haut + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(a.sousTitre, marge, haut + 9.5);

    const largeurMax = W - 2 * marge;
    const hauteurMax = H - PDF_FOOTER_RESERVED_MM - (haut + 14);
    const ratio = Math.min(largeurMax / a.largeur, hauteurMax / a.hauteur);
    const w = a.largeur * ratio;
    const h = a.hauteur * ratio;
    doc.addImage(
      a.data,
      "JPEG",
      marge + (largeurMax - w) / 2,
      haut + 14,
      w,
      h,
      undefined,
      "FAST",
    );
  });

  applyPdfFooters(doc, branding, {
    header: { ...header, skipFirstPage: true },
  });

  return new Uint8Array(doc.output("arraybuffer"));
}
