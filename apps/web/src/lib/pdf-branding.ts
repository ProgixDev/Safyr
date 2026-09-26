/**
 * Habillage de marque des documents PDF : en-tête (logo + société + dirigeant),
 * pied de page (société + phrase légale L612-14) et styles de tableau.
 *
 * Aucune information de société n'est codée en dur : tout vient de
 * l'organisation (« Mon entreprise »). Seule la phrase L612-14 est constante.
 *
 * Usage type :
 *   const branding = await loadPdfBranding();
 *   const doc = new jsPDF();
 *   const header = { title: "REGISTRE UNIQUE DU PERSONNEL" };
 *   const y = drawPdfHeader(doc, branding, header);
 *   autoTable(doc, { startY: y, ...brandedPdfDefaults, margin: pdfTableMargins(branding, { header }), ... });
 *   applyPdfFooters(doc, branding, { header: { ...header, skipFirstPage: true } });
 *   doc.save("fichier.pdf");
 */
import type { jsPDF } from "jspdf";
import { getActiveOrganization, getSignedUrl } from "@safyr/api-client";

/** Phrase légale à faire figurer, en petit, au bas de tous les documents. */
export const MENTION_L612_14 =
  "Article L612-14 du Code de la Sécurité Intérieure \"L'autorisation d'exercice ne confère aucune prérogative de puissance publique à l'entreprise ou aux personnes qui en bénéficient. Elle n'engage en aucune manière la responsabilité des pouvoirs publics.\"";

export interface PdfBranding {
  name: string;
  /** Ex. « au capital de 5000€ » ; vide si le capital n'est pas renseigné. */
  capitalLine: string;
  address: string;
  email: string;
  phone?: string;
  siret: string;
  authorizationNumber: string;
  presidentName?: string;
  presidentPhone?: string;
  /** Logo converti en PNG (data URL) ; absent si indisponible. */
  logoDataUrl?: string;
  /** Dimensions en pixels du logo PNG (pour conserver les proportions). */
  logoWidth?: number;
  logoHeight?: number;
}

export interface PdfHeaderOptions {
  title?: string;
  subtitle?: string;
}

export type PdfRgb = [number, number, number];

/** Turquoise des en-têtes de tableau (texte blanc dessus : contraste correct). */
export const PDF_BRAND_RGB: PdfRgb = [8, 145, 178];
/** Bleu du filet sous l'en-tête. */
export const PDF_RULE_RGB: PdfRgb = [30, 90, 168];
const GRIS_TEXTE: PdfRgb = [100, 100, 100];

const MARGE = 14;
const HAUT = 8;
const BLOC_SOCIETE_MM = 18;
const ZONE_LOGO_MM = 40;
const ZONE_DROITE_MM = 50;
const TITRE_HAUTEUR_MM = 8.5;
const BAS = 5;

/**
 * Hauteur réservée en bas de page pour le pied de page (pire cas : 4 lignes
 * société + phrase légale sur 3 lignes en A4 portrait).
 */
export const PDF_FOOTER_RESERVED_MM = 28;

const BRANDING_VIDE: PdfBranding = {
  name: "",
  capitalLine: "",
  address: "",
  email: "",
  siret: "",
  authorizationNumber: "",
};

// ─── Chargement de l'organisation ───────────────────────────────────────

const TTL_MS = 60_000;
let cache: { at: number; promise: Promise<PdfBranding> } | null = null;

/** À appeler après une modification de l'organisation (logo, adresse…). */
export function invalidatePdfBranding(): void {
  cache = null;
}

function formaterCapital(brut?: string): string {
  const v = (brut ?? "").replace(/[  ]/g, " ").trim();
  if (!v) return "";
  if (v.includes("€")) return `au capital de ${v}`;
  return /^[\d\s.,]+$/.test(v) ? `au capital de ${v}€` : `au capital de ${v}`;
}

function chargerImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image illisible"));
    img.src = src;
  });
}

/**
 * Récupère le logo et le convertit en PNG (data URL, 500 px max). Passer par
 * un canvas uniformise les formats (webp, svg…) pour jsPDF et l'Excel.
 * Retourne null en cas d'échec (CORS, réseau, format) : le logo est optionnel.
 */
async function logoEnPng(
  logo: string,
): Promise<{ url: string; w: number; h: number } | null> {
  try {
    const source = /^(https?:|data:|blob:)/.test(logo)
      ? logo
      : await getSignedUrl(logo);
    const res = await fetch(source);
    if (!res.ok) return null;
    const blob = await res.blob();
    const objet = URL.createObjectURL(blob);
    try {
      const img = await chargerImage(objet);
      const ratio = Math.min(
        1,
        500 / Math.max(img.naturalWidth, img.naturalHeight, 1),
      );
      const w = Math.max(1, Math.round(img.naturalWidth * ratio));
      const h = Math.max(1, Math.round(img.naturalHeight * ratio));
      if (!img.naturalWidth || !img.naturalHeight) return null;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, w, h);
      return { url: canvas.toDataURL("image/png"), w, h };
    } finally {
      URL.revokeObjectURL(objet);
    }
  } catch {
    return null;
  }
}

async function chargerDepuisApi(): Promise<PdfBranding> {
  const org = await getActiveOrganization();
  const rep = org.representative;
  const branding: PdfBranding = {
    name: org.name ?? "",
    capitalLine: formaterCapital(org.shareCapital),
    address: org.address ?? "",
    email: org.email ?? "",
    phone: org.phone || undefined,
    siret: org.siret ?? "",
    authorizationNumber: org.authorizationNumber ?? "",
    presidentName: rep
      ? [rep.firstName, rep.lastName].filter(Boolean).join(" ") || undefined
      : undefined,
    presidentPhone: rep?.phone || undefined,
  };
  if (org.logo) {
    const logo = await logoEnPng(org.logo);
    if (logo) {
      branding.logoDataUrl = logo.url;
      branding.logoWidth = logo.w;
      branding.logoHeight = logo.h;
    }
  }
  return branding;
}

/**
 * Charge les informations de société (cache 60 s). Ne rejette jamais : en cas
 * d'échec de l'API, renvoie un habillage vide (documents sans en-tête société).
 */
export function loadPdfBranding(): Promise<PdfBranding> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.promise;
  const promise = chargerDepuisApi().catch(() => {
    cache = null;
    return { ...BRANDING_VIDE };
  });
  cache = { at: now, promise };
  return promise;
}

// ─── Mise en page ───────────────────────────────────────────────────────

function aSociete(b: PdfBranding): boolean {
  return Boolean(b.name || b.logoDataUrl);
}

function lignesDroite(b: PdfBranding): string[] {
  const tel = b.presidentPhone || b.phone;
  return [
    b.presidentName ? `Président : ${b.presidentName}` : "",
    tel ? `Téléphone : ${tel}` : "",
  ].filter(Boolean);
}

interface Mise {
  titreY: number;
  sousTitreY: number | null;
  filetY: number | null;
  fin: number;
}

function miseEnPage(b: PdfBranding, header?: PdfHeaderOptions): Mise {
  let y = HAUT;
  if (aSociete(b)) y += BLOC_SOCIETE_MM + 2;
  const titreY = y;
  let sousTitreY: number | null = null;
  if (header?.title) {
    y += TITRE_HAUTEUR_MM;
    if (header.subtitle) {
      sousTitreY = y + 4;
      y += 5.5;
    }
  } else if (header?.subtitle) {
    sousTitreY = y + 3;
    y += 5;
  }
  const filet = header?.title || aSociete(b);
  const filetY = filet ? y + 1.5 : null;
  return { titreY, sousTitreY, filetY, fin: (filetY ?? y) + (filet ? 5 : 2) };
}

/** Hauteur (mm) occupée par l'en-tête : Y où commence le contenu. */
export function pdfHeaderHeight(
  branding: PdfBranding,
  header?: PdfHeaderOptions,
): number {
  return miseEnPage(branding, header).fin;
}

/** Marges à passer à `autoTable({ margin })` pour ne jamais chevaucher. */
export function pdfTableMargins(
  branding: PdfBranding,
  opts: {
    header?: PdfHeaderOptions | false;
    left?: number;
    right?: number;
  } = {},
): { top: number; bottom: number; left: number; right: number } {
  return {
    top:
      opts.header === false
        ? MARGE
        : pdfHeaderHeight(branding, opts.header ?? undefined),
    bottom: PDF_FOOTER_RESERVED_MM,
    left: opts.left ?? MARGE,
    right: opts.right ?? MARGE,
  };
}

/** Styles autotable de marque : en-têtes turquoise, zébrures, filets fins. */
export const brandedPdfDefaults = {
  theme: "grid" as const,
  styles: {
    fontSize: 8,
    cellPadding: 1.8,
    lineColor: [203, 213, 225] as PdfRgb,
    lineWidth: 0.15,
    textColor: [30, 41, 59] as PdfRgb,
    overflow: "linebreak" as const,
  },
  headStyles: {
    fillColor: PDF_BRAND_RGB,
    textColor: [255, 255, 255] as PdfRgb,
    fontStyle: "bold" as const,
    halign: "center" as const,
    valign: "middle" as const,
  },
  alternateRowStyles: { fillColor: [240, 249, 251] as PdfRgb },
  footStyles: {
    fillColor: [226, 232, 240] as PdfRgb,
    textColor: [15, 23, 42] as PdfRgb,
    fontStyle: "bold" as const,
  },
};

function formatImage(dataUrl: string): "PNG" | "JPEG" {
  return /^data:image\/jpe?g/i.test(dataUrl) ? "JPEG" : "PNG";
}

/** Réduit la police jusqu'à ce que le texte tienne sur `largeur` mm. */
function ajusterPolice(
  doc: jsPDF,
  texte: string,
  largeur: number,
  taille: number,
  min: number,
): void {
  let t = taille;
  doc.setFontSize(t);
  while (t > min && doc.getTextWidth(texte) > largeur) {
    t -= 0.25;
    doc.setFontSize(t);
  }
}

/**
 * Dessine l'en-tête sur la page courante (logo à gauche, société au centre,
 * président/téléphone à droite, titre encadré, filet bleu).
 * Renvoie le Y (mm) où commencer le contenu.
 */
export function drawPdfHeader(
  doc: jsPDF,
  branding: PdfBranding,
  header: PdfHeaderOptions = {},
): number {
  const W = doc.internal.pageSize.getWidth();
  const mise = miseEnPage(branding, header);

  if (aSociete(branding)) {
    const droite = lignesDroite(branding);
    const gauche = branding.logoDataUrl ? ZONE_LOGO_MM : 0;
    const droit = droite.length ? ZONE_DROITE_MM : 0;

    if (branding.logoDataUrl) {
      try {
        let lw = branding.logoWidth;
        let lh = branding.logoHeight;
        if (!lw || !lh) {
          const p = doc.getImageProperties(branding.logoDataUrl);
          lw = p.width;
          lh = p.height;
        }
        const maxW = ZONE_LOGO_MM - 4;
        const echelle = Math.min(maxW / lw, BLOC_SOCIETE_MM / lh);
        const w = lw * echelle;
        const h = lh * echelle;
        doc.addImage(
          branding.logoDataUrl,
          formatImage(branding.logoDataUrl),
          MARGE,
          HAUT + (BLOC_SOCIETE_MM - h) / 2,
          w,
          h,
        );
      } catch {
        // Logo illisible : l'en-tête reste valable sans lui.
      }
    }

    const zoneG = MARGE + gauche + (gauche ? 3 : 0);
    const zoneD = W - MARGE - droit - (droit ? 3 : 0);
    const centre = (zoneG + zoneD) / 2;
    const largeurCentre = zoneD - zoneG;

    // Bloc société centré : nom en gras puis adresse et e-mail.
    const blocs: { texte: string; taille: number; gras: boolean }[] = [];
    if (branding.name)
      blocs.push({ texte: branding.name, taille: 10.5, gras: true });
    if (branding.address)
      blocs.push({ texte: branding.address, taille: 8, gras: false });
    if (branding.email)
      blocs.push({ texte: branding.email, taille: 8, gras: false });
    const lignes: { texte: string; taille: number; gras: boolean }[] = [];
    for (const b of blocs) {
      doc.setFont("helvetica", b.gras ? "bold" : "normal");
      doc.setFontSize(b.taille);
      for (const l of doc.splitTextToSize(b.texte, largeurCentre) as string[])
        lignes.push({ ...b, texte: l });
    }
    const pas = 4.2;
    const visibles = lignes.slice(0, Math.floor(BLOC_SOCIETE_MM / pas));
    let y = HAUT + (BLOC_SOCIETE_MM - visibles.length * pas) / 2 + pas * 0.75;
    doc.setTextColor(20, 20, 20);
    for (const l of visibles) {
      doc.setFont("helvetica", l.gras ? "bold" : "normal");
      doc.setFontSize(l.taille);
      doc.text(l.texte, centre, y, { align: "center" });
      y += pas;
    }

    // Bloc dirigeant aligné à droite.
    if (droite.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const l2 = droite.flatMap(
        (t) => doc.splitTextToSize(t, ZONE_DROITE_MM) as string[],
      );
      const vis = l2.slice(0, Math.floor(BLOC_SOCIETE_MM / 4.6));
      let yd = HAUT + (BLOC_SOCIETE_MM - vis.length * 4.6) / 2 + 3.4;
      for (const t of vis) {
        doc.text(t, W - MARGE, yd, { align: "right" });
        yd += 4.6;
      }
    }
  }

  if (header.title) {
    doc.setFont("helvetica", "bold");
    ajusterPolice(doc, header.title, W - 2 * MARGE - 8, 12, 8);
    const largeur = Math.min(
      W - 2 * MARGE,
      Math.max(80, doc.getTextWidth(header.title) + 14),
    );
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.4);
    doc.rect((W - largeur) / 2, mise.titreY, largeur, TITRE_HAUTEUR_MM - 1);
    doc.setTextColor(15, 23, 42);
    doc.text(
      header.title,
      W / 2,
      mise.titreY + (TITRE_HAUTEUR_MM - 1) / 2 + 1.6,
      {
        align: "center",
      },
    );
  }
  if (header.subtitle && mise.sousTitreY !== null) {
    doc.setFont("helvetica", "normal");
    ajusterPolice(doc, header.subtitle, W - 2 * MARGE, 8.5, 6);
    doc.setTextColor(...GRIS_TEXTE);
    doc.text(header.subtitle, W / 2, mise.sousTitreY, { align: "center" });
  }
  if (mise.filetY !== null) {
    doc.setDrawColor(...PDF_RULE_RGB);
    doc.setLineWidth(0.8);
    doc.line(MARGE, mise.filetY, W - MARGE, mise.filetY);
  }

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  return mise.fin;
}

function lignesSocietePied(b: PdfBranding): string[] {
  const l1 = [b.name, b.capitalLine].filter(Boolean).join(" ").toUpperCase();
  const l2 = b.address.toUpperCase();
  const l3 = [
    b.email ? `e-mail: ${b.email}` : "",
    b.siret ? `N° Siret: ${b.siret}` : "",
  ]
    .filter(Boolean)
    .join("   ");
  const l4 = b.authorizationNumber.toUpperCase();
  return [l1, l2, l3, l4].filter(Boolean);
}

/**
 * Dessine le pied de page sur la page courante : bloc société centré (petites
 * capitales grises) puis phrase L612-14 en 5 pt. `pageLabel` (ex. « Page 1 / 3 »)
 * est affiché à droite. Avec `compact`, seule la phrase légale est dessinée
 * (pour les documents déjà très denses, comme le bulletin de paie).
 */
export function drawPdfFooter(
  doc: jsPDF,
  branding: PdfBranding,
  opts: { pageLabel?: string; compact?: boolean; bottom?: number } = {},
): void {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const bas = opts.bottom ?? H - BAS;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  const legal = doc.splitTextToSize(MENTION_L612_14, W - 2 * MARGE) as string[];
  const pasLegal = 2.1;
  const societe = opts.compact ? [] : lignesSocietePied(branding);
  const pasSociete = 3;

  const hauteur =
    legal.length * pasLegal +
    (societe.length ? 1.2 + societe.length * pasSociete : 0);
  const haut = bas - hauteur;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(MARGE, haut - 2, W - MARGE, haut - 2);

  let y = haut + 2;
  doc.setTextColor(...GRIS_TEXTE);
  if (societe.length) {
    doc.setFont("helvetica", "bold");
    for (const l of societe) {
      ajusterPolice(doc, l, W - 2 * MARGE - 30, 6.5, 4.5);
      doc.text(l, W / 2, y, { align: "center" });
      y += pasSociete;
    }
    y += 1.2;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(120, 120, 120);
  for (const l of legal) {
    doc.text(l, W / 2, y, { align: "center" });
    y += pasLegal;
  }

  if (opts.pageLabel) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS_TEXTE);
    doc.text(opts.pageLabel, W - MARGE, haut + 2, { align: "right" });
  }
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
}

/**
 * À appeler UNE FOIS, après tout le contenu : parcourt les pages et pose le
 * pied de page + « Page x / y ». Avec `header`, l'en-tête est aussi posé sur
 * chaque page ; passer `skipFirstPage: true` si `drawPdfHeader` a déjà été
 * appelé pour la page 1.
 */
export function applyPdfFooters(
  doc: jsPDF,
  branding: PdfBranding,
  opts: {
    header?: PdfHeaderOptions & { skipFirstPage?: boolean };
    compact?: boolean;
    /** Sans « Page x / y » (documents d'une seule page). */
    hidePageNumbers?: boolean;
  } = {},
): void {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (opts.header && !(i === 1 && opts.header.skipFirstPage)) {
      drawPdfHeader(doc, branding, opts.header);
    }
    drawPdfFooter(doc, branding, {
      compact: opts.compact,
      pageLabel: opts.hidePageNumbers ? undefined : `Page ${i} / ${total}`,
    });
  }
}
