import { getSignedUrl } from "@safyr/api-client";

export interface PieceDossier {
  /** Libellé du type de pièce (Kbis, RIB…). */
  type: string;
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
  pieces: PieceDossier[];
  /** Libellés des pièces obligatoires encore absentes du dossier. */
  piecesManquantes: string[];
}

export interface ResultatDossier {
  /** Pièces dont l'image a été intégrée au PDF. */
  integrees: number;
  /** PDF et autres formats : listés au récapitulatif, à joindre à part. */
  jointsSeparement: number;
  /** Pièces qu'il a été impossible de récupérer. */
  illisibles: string[];
}

const EXT_IMAGE = ["jpg", "jpeg", "png", "webp", "gif", "bmp"];
const DIMENSION_MAX = 1800;

function extension(nom: string): string {
  const i = nom.lastIndexOf(".");
  return i === -1 ? "" : nom.slice(i + 1).toLowerCase();
}

function dateFr(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR");
}

function statut(expiryDate?: string): string {
  if (!expiryDate) return "Valide";
  const fin = new Date(expiryDate).getTime();
  if (fin < Date.now()) return "Expiré";
  if (fin <= Date.now() + 30 * 86_400_000) return "Expire bientôt";
  return "Valide";
}

/** Recharge l'image dans un canvas : format normalisé et poids maîtrisé. */
function versJpeg(blob: Blob): Promise<{
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

type EtatPiece =
  | { etat: "image"; data: string; largeur: number; hauteur: number }
  | { etat: "separe" }
  | { etat: "illisible" };

async function lirePiece(piece: PieceDossier): Promise<EtatPiece> {
  if (!piece.storageKey) return { etat: "illisible" };
  const ext = extension(piece.name);
  const estImage = EXT_IMAGE.includes(ext);
  // Les PDF et autres formats ne sont pas téléchargés : on ne sait pas les
  // fusionner sans bibliothèque PDF, inutile de les charger pour rien.
  if (!estImage) return { etat: "separe" };
  try {
    const url = await getSignedUrl(piece.storageKey);
    const reponse = await fetch(url);
    if (!reponse.ok) return { etat: "illisible" };
    const blob = await reponse.blob();
    if (blob.type && !blob.type.startsWith("image/")) return { etat: "separe" };
    const image = await versJpeg(blob);
    return { etat: "image", ...image };
  } catch {
    return { etat: "illisible" };
  }
}

function nomFichier(nom: string): string {
  const propre = nom
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `Dossier-${propre || "sous-traitant"}-${date}.pdf`;
}

/**
 * Génère et télécharge UN SEUL PDF « dossier de contrôle » : page de garde,
 * récapitulatif des pièces, puis une annexe par pièce image (CNI, cartes…).
 *
 * Limite : sans bibliothèque de fusion PDF, les pièces au format PDF ou autre
 * ne sont pas intégrées ; elles figurent au récapitulatif avec la mention
 * « joint séparément ».
 */
export async function telechargerDossierSousTraitant(
  dossier: DossierSousTraitant,
): Promise<ResultatDossier> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const lectures = await Promise.all(dossier.pieces.map(lirePiece));

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const largeurPage = doc.internal.pageSize.getWidth();
  const hauteurPage = doc.internal.pageSize.getHeight();
  const marge = 15;

  // Page de garde
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, largeurPage, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("Dossier sous-traitant", marge, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(34, 211, 238);
  doc.text("Dossier de contrôle - pièces administratives", marge, 42);

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  const titre = doc.splitTextToSize(dossier.nom, largeurPage - 2 * marge);
  doc.text(titre, marge, 82);

  const lignes: [string, string][] = [
    ["SIRET", dossier.siret || "-"],
    ["N° d'autorisation CNAPS", dossier.numeroAutorisation || "-"],
    ["Adresse", dossier.adresse || "-"],
    ["Date d'édition", new Date().toLocaleDateString("fr-FR")],
    ["Nombre de pièces", String(dossier.pieces.length)],
  ];
  autoTable(doc, {
    startY: 82 + titre.length * 9 + 4,
    body: lignes,
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 2.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: [71, 85, 105] },
    },
    margin: { left: marge, right: marge },
  });

  // Récapitulatif
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("Récapitulatif des pièces", marge, 20);

  let annexe = 0;
  const corps = dossier.pieces.map((piece, i) => {
    const lecture = lectures[i];
    let integration = "Fichier joint séparément";
    if (lecture.etat === "image") {
      annexe += 1;
      integration = `Intégré - annexe ${annexe}`;
    } else if (lecture.etat === "illisible") {
      integration = "Non récupérable";
    }
    return [
      String(i + 1),
      piece.type,
      piece.name,
      dateFr(piece.uploadDate),
      dateFr(piece.expiryDate),
      statut(piece.expiryDate),
      integration,
    ];
  });

  const finTableau = (d: typeof doc) =>
    (d as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY;

  autoTable(doc, {
    startY: 26,
    head: [
      [
        "N°",
        "Type de pièce",
        "Fichier",
        "Déposé le",
        "Échéance",
        "Statut",
        "Dans ce PDF",
      ],
    ],
    body: corps,
    styles: { fontSize: 9, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 0: { cellWidth: 10 } },
    margin: { left: marge, right: marge },
  });

  if (dossier.piecesManquantes.length > 0) {
    autoTable(doc, {
      startY: finTableau(doc) + 10,
      head: [["Pièces obligatoires manquantes"]],
      body: dossier.piecesManquantes.map((p) => [p]),
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [185, 28, 28], textColor: 255 },
      margin: { left: marge, right: marge },
    });
  }

  // Annexes : une page par image
  let numero = 0;
  dossier.pieces.forEach((piece, i) => {
    const lecture = lectures[i];
    if (lecture.etat !== "image") return;
    numero += 1;
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`Annexe ${numero} - ${piece.type}`, marge, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${piece.name} - déposé le ${dateFr(piece.uploadDate)}`,
      marge,
      24,
    );

    const largeurMax = largeurPage - 2 * marge;
    const hauteurMax = hauteurPage - 30 - marge - 8;
    const ratio = Math.min(
      largeurMax / lecture.largeur,
      hauteurMax / lecture.hauteur,
    );
    const w = lecture.largeur * ratio;
    const h = lecture.hauteur * ratio;
    doc.addImage(
      lecture.data,
      "JPEG",
      marge + (largeurMax - w) / 2,
      30,
      w,
      h,
      undefined,
      "FAST",
    );
  });

  // Pied de page numéroté
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${dossier.nom} - dossier sous-traitant`, marge, hauteurPage - 8);
    doc.text(`Page ${p}/${total}`, largeurPage - marge, hauteurPage - 8, {
      align: "right",
    });
  }

  doc.save(nomFichier(dossier.nom));

  return {
    integrees: lectures.filter((l) => l.etat === "image").length,
    jointsSeparement: lectures.filter((l) => l.etat === "separe").length,
    illisibles: dossier.pieces
      .filter((_, i) => lectures[i].etat === "illisible")
      .map((p) => p.name),
  };
}
