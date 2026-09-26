/**
 * Écrivain .xlsx (Office Open XML) sans dépendance, de marque : bloc société
 * (logo, coordonnées, dirigeant), titre encadré, filet bleu, en-têtes colorées
 * figées, lignes zébrées, totaux, puis pied de société + phrase L612-14.
 *
 * Exemple :
 *   await exporterExcel({
 *     fileName: "registre-personnel",
 *     sheetName: "Registre",
 *     title: "REGISTRE UNIQUE DU PERSONNEL",
 *     columns: [
 *       { header: "Nom", key: "nom" },
 *       { header: "Entrée", key: "entree", format: "date", align: "center" },
 *       { header: "Salaire", key: "salaire", format: "currency" },
 *     ],
 *     rows: [{ nom: "Dupont", entree: "2024-01-15", salaire: 1823.5 }],
 *     totals: { salaire: 1823.5 },
 *   });
 */
import { createZip } from "./zip";
import {
  MENTION_L612_14,
  PDF_BRAND_RGB,
  PDF_RULE_RGB,
  loadPdfBranding,
  type PdfBranding,
} from "./pdf-branding";

export type FormatColonneExcel = "text" | "number" | "currency" | "date";

export interface ColonneExcel {
  header: string;
  key: string;
  /** Largeur en caractères ; calculée d'après le contenu si absente. */
  width?: number;
  align?: "left" | "center" | "right";
  format?: FormatColonneExcel;
}

export interface OptionsExcel {
  /** Avec ou sans « .xlsx ». */
  fileName: string;
  /** 31 caractères max, sans [ ] : * ? / \ (nettoyé automatiquement). */
  sheetName: string;
  title?: string;
  subtitle?: string;
  columns: ColonneExcel[];
  rows: Record<string, unknown>[];
  /** Valeurs de la ligne de totaux, par `key` de colonne. */
  totals?: Record<string, unknown>;
  /** Chargé automatiquement (loadPdfBranding) si absent. */
  branding?: PdfBranding;
  /** Couleur des en-têtes, « #RRGGBB » ; turquoise par défaut. */
  headerColor?: string;
}

// ─── Utilitaires XML / cellules ─────────────────────────────────────────

const CONTROLES = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

function esc(s: string): string {
  return s
    .replace(CONTROLES, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function lettre(i: number): string {
  let n = i + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

const ref = (col: number, row: number) => `${lettre(col)}${row}`;

function hexArgb(rgb: string): string {
  return `FF${rgb.replace("#", "").toUpperCase()}`;
}
function rgbArgb(c: readonly number[]): string {
  return (
    "FF" +
    c
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

function nomFeuille(brut: string): string {
  const s = brut
    .replace(/[[\]:*?/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31);
  return s || "Feuille1";
}

/** Numéro de série Excel d'une date (fuseau ignoré : date calendaire). */
function serieDate(v: unknown): number | null {
  let y: number, m: number, d: number;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    y = v.getFullYear();
    m = v.getMonth() + 1;
    d = v.getDate();
  } else if (typeof v === "string") {
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
    const fr = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    if (iso) [y, m, d] = [+iso[1], +iso[2], +iso[3]];
    else if (fr) [y, m, d] = [+fr[3], +fr[2], +fr[1]];
    else return null;
  } else return null;
  return Date.UTC(y, m - 1, d) / 86400000 + 25569;
}

function nombre(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && /^-?\d+([.,]\d+)?$/.test(v.trim()))
    return Number(v.trim().replace(",", "."));
  return null;
}

function texte(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Oui" : "Non";
  if (v instanceof Date) return v.toLocaleDateString("fr-FR");
  return String(v);
}

// ─── Styles ─────────────────────────────────────────────────────────────

interface DefStyle {
  font?: number;
  fill?: number;
  border?: number;
  numFmt?: string;
  h?: "left" | "center" | "right";
  wrap?: boolean;
}

class Styles {
  fonts: string[] = [];
  fills: string[] = [
    '<fill><patternFill patternType="none"/></fill>',
    '<fill><patternFill patternType="gray125"/></fill>',
  ];
  borders: string[] = [
    "<border><left/><right/><top/><bottom/><diagonal/></border>",
  ];
  formats: string[] = [];
  xfs: string[] = [];
  private cles = new Map<string, number>();

  constructor() {
    this.font({ sz: 10 });
    this.xf({});
  }

  private push(liste: string[], xml: string): number {
    const i = liste.indexOf(xml);
    if (i >= 0) return i;
    liste.push(xml);
    return liste.length - 1;
  }

  font(o: { b?: boolean; i?: boolean; sz?: number; color?: string }): number {
    const xml =
      "<font>" +
      (o.b ? "<b/>" : "") +
      (o.i ? "<i/>" : "") +
      `<sz val="${o.sz ?? 10}"/>` +
      `<color rgb="${o.color ?? "FF1E293B"}"/>` +
      '<name val="Calibri"/><family val="2"/></font>';
    return this.push(this.fonts, xml);
  }

  fill(argb: string): number {
    return this.push(
      this.fills,
      `<fill><patternFill patternType="solid"><fgColor rgb="${argb}"/><bgColor indexed="64"/></patternFill></fill>`,
    );
  }

  border(o: {
    l?: string;
    r?: string;
    t?: string;
    b?: string;
    color?: string;
  }): number {
    const c = o.color ?? "FFCBD5E1";
    const arete = (nom: string, style?: string) =>
      style
        ? `<${nom} style="${style}"><color rgb="${c}"/></${nom}>`
        : `<${nom}/>`;
    return this.push(
      this.borders,
      `<border>${arete("left", o.l)}${arete("right", o.r)}${arete("top", o.t)}${arete("bottom", o.b)}<diagonal/></border>`,
    );
  }

  /** Identifiants de format personnalisés à partir de 164. */
  private numFmtId(code: string): number {
    const builtin: Record<string, number> = { General: 0 };
    if (code in builtin) return builtin[code];
    let i = this.formats.indexOf(code);
    if (i < 0) {
      this.formats.push(code);
      i = this.formats.length - 1;
    }
    return 164 + i;
  }

  xf(s: DefStyle & { v?: "center" | "top" }): number {
    const cle = JSON.stringify(s);
    const connu = this.cles.get(cle);
    if (connu !== undefined) return connu;
    const numId = s.numFmt ? this.numFmtId(s.numFmt) : 0;
    const align =
      s.h || s.wrap || s.v
        ? `<alignment${s.h ? ` horizontal="${s.h}"` : ""} vertical="${s.v ?? "center"}"${s.wrap ? ' wrapText="1"' : ""}/>`
        : "";
    const xml =
      `<xf numFmtId="${numId}" fontId="${s.font ?? 0}" fillId="${s.fill ?? 0}" borderId="${s.border ?? 0}" xfId="0"` +
      ` applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"${align ? ' applyAlignment="1">' + align + "</xf>" : "/>"}`;
    this.xfs.push(xml);
    this.cles.set(cle, this.xfs.length - 1);
    return this.xfs.length - 1;
  }

  xml(): string {
    const fmts = this.formats.length
      ? `<numFmts count="${this.formats.length}">${this.formats
          .map(
            (f, i) => `<numFmt numFmtId="${164 + i}" formatCode="${esc(f)}"/>`,
          )
          .join("")}</numFmts>`
      : "";
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      fmts +
      `<fonts count="${this.fonts.length}">${this.fonts.join("")}</fonts>` +
      `<fills count="${this.fills.length}">${this.fills.join("")}</fills>` +
      `<borders count="${this.borders.length}">${this.borders.join("")}</borders>` +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      `<cellXfs count="${this.xfs.length}">${this.xfs.join("")}</cellXfs>` +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      "</styleSheet>"
    );
  }
}

const FORMAT_NOMBRE = "#,##0.00";
const FORMAT_ENTIER = "#,##0";
const FORMAT_EURO = '#,##0.00\\ "€"';
const FORMAT_DATE = "dd/mm/yyyy";

// ─── Construction ───────────────────────────────────────────────────────

const CHAR_PX = 7;
const px = (largeurCar: number) => Math.round(largeurCar * CHAR_PX + 5);
const LIGNE_SOCIETE_PT = 16;

function dataUrlVersOctets(dataUrl: string): Uint8Array | null {
  const m = /^data:image\/png;base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  try {
    const bin = atob(m[1]);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Construit le classeur (Uint8Array) ; séparé du téléchargement pour les tests. */
export async function construireXlsx(opts: OptionsExcel): Promise<Uint8Array> {
  const branding = opts.branding ?? (await loadPdfBranding());
  const { columns, rows } = opts;
  const n = columns.length;
  const feuille = nomFeuille(opts.sheetName);
  const st = new Styles();

  const couleurEntete = hexArgb(opts.headerColor ?? rgbHex(PDF_BRAND_RGB));

  // Largeurs : explicites, sinon d'après le contenu.
  const largeurs = columns.map((c) => {
    if (c.width) return c.width;
    let max = c.header.length + 2;
    for (const r of rows.slice(0, 500)) {
      const t = c.format === "date" ? "00/00/0000" : texte(r[c.key]);
      max = Math.max(max, Math.min(t.length, 60) + 2);
    }
    return Math.min(Math.max(max, 8), 45);
  });
  const largeurTotale = largeurs.reduce((a, b) => a + b, 0);

  // Polices, fonds, bordures.
  const fCorps = st.font({ sz: 10 });
  const fEntete = st.font({ b: true, sz: 10, color: "FFFFFFFF" });
  const fTitre = st.font({ b: true, sz: 14, color: "FF0F172A" });
  const fNom = st.font({ b: true, sz: 12, color: "FF0F172A" });
  const fSociete = st.font({ sz: 9, color: "FF334155" });
  const fSousTitre = st.font({ i: true, sz: 9, color: "FF64748B" });
  const fTotal = st.font({ b: true, sz: 10, color: "FF0F172A" });
  const fPied = st.font({ b: true, sz: 8, color: "FF64748B" });
  const fLegal = st.font({ i: true, sz: 7, color: "FF64748B" });
  const fondEntete = st.fill(couleurEntete);
  const fondZebre = st.fill("FFF0F9FB");
  const fondTotal = st.fill("FFE2E8F0");
  const fondFilet = st.fill(rgbArgb(PDF_RULE_RGB));
  const bFin = st.border({ l: "thin", r: "thin", t: "thin", b: "thin" });
  const bTotal = st.border({
    l: "thin",
    r: "thin",
    t: "medium",
    b: "thin",
    color: "FF64748B",
  });

  // Contenu de la feuille.
  const lignes = new Map<number, Map<number, string>>();
  const hauteurs = new Map<number, number>();
  const fusions: string[] = [];
  const poser = (r: number, c: number, xml: string) => {
    if (!lignes.has(r)) lignes.set(r, new Map());
    lignes.get(r)!.set(c, xml);
  };
  const cTexte = (r: number, c: number, s: number, t: string) =>
    poser(
      r,
      c,
      t
        ? `<c r="${ref(c, r)}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${esc(t)}</t></is></c>`
        : `<c r="${ref(c, r)}" s="${s}"/>`,
    );
  const cVide = (r: number, c: number, s: number) =>
    poser(r, c, `<c r="${ref(c, r)}" s="${s}"/>`);
  const fusionner = (r: number, c1: number, c2: number) => {
    if (c2 > c1) fusions.push(`${ref(c1, r)}:${ref(c2, r)}`);
  };
  /** Texte fusionné sur c1..c2 ; toutes les cellules portent le style. */
  const bloc = (r: number, c1: number, c2: number, s: number, t: string) => {
    cTexte(r, c1, s, t);
    for (let c = c1 + 1; c <= c2; c++) cVide(r, c, s);
    fusionner(r, c1, c2);
  };

  let r = 1;

  // ── Bloc société (3 lignes) : logo | société centrée | dirigeant ──
  const aSociete = Boolean(branding.name || branding.logoDataUrl);
  const droite = [
    branding.presidentName ? `Président : ${branding.presidentName}` : "",
    branding.presidentPhone || branding.phone
      ? `Téléphone : ${branding.presidentPhone || branding.phone}`
      : "",
  ];
  const aDroite = droite.some(Boolean);
  const logoOctets = branding.logoDataUrl
    ? dataUrlVersOctets(branding.logoDataUrl)
    : null;
  let logoInfo: { cx: number; cy: number; offX: number; offY: number } | null =
    null;

  if (aSociete) {
    // Zones en colonnes : gauche (logo) et droite (dirigeant).
    let k = 0;
    let m = 0;
    if (n >= 3) {
      if (logoOctets) {
        let cum = 0;
        while (k < n - 2 && cum < 16) cum += largeurs[k++];
      }
      if (aDroite) {
        let cum = 0;
        while (m < n - k - 1 && cum < 22) cum += largeurs[n - 1 - m++];
        // Le bloc société centré garde au moins ~40 caractères de large.
        const centre = (j: number) =>
          largeurs.slice(k, n - j).reduce((x, y) => x + y, 0);
        while (m > 0 && centre(m) < 40) m--;
      }
    }
    const c1 = k;
    const c2 = n - m - 1;
    const sNom = st.xf({ font: fNom, h: "center" });
    const sInfo = st.xf({ font: fSociete, h: "center" });
    const sDroite = st.xf({ font: fSociete, h: "right" });
    const centre = [branding.name, branding.address, branding.email];
    // Sans zone droite dédiée (tableau étroit), le dirigeant passe au centre.
    const lignesCentre =
      m === 0 && aDroite ? [...centre, ...droite.filter(Boolean)] : centre;
    for (let i = 0; i < 3 || i < lignesCentre.length; i++) {
      const row = r + i;
      hauteurs.set(row, LIGNE_SOCIETE_PT);
      bloc(row, c1, c2, i === 0 ? sNom : sInfo, lignesCentre[i] ?? "");
      if (m > 0 && i < 2) bloc(row, n - m, n - 1, sDroite, droite[i]);
    }
    if (logoOctets && k > 0) {
      const zonePx = largeurs.slice(0, k).reduce((a, w) => a + px(w), 0) - 8;
      const hautPx = Math.round((3 * LIGNE_SOCIETE_PT * 96) / 72) - 6;
      const lw = branding.logoWidth ?? 3;
      const lh = branding.logoHeight ?? 1;
      const echelle = Math.min(zonePx / lw, hautPx / lh);
      logoInfo = {
        cx: Math.round(lw * echelle * 9525),
        cy: Math.round(lh * echelle * 9525),
        offX: 4 * 9525,
        offY: 3 * 9525,
      };
    }
    r += Math.max(3, lignesCentre.length);
    hauteurs.set(r, 6);
    r += 1;
  }

  // ── Titre encadré ──
  if (opts.title) {
    hauteurs.set(r, 26);
    for (let c = 0; c < n; c++) {
      const b = st.border({
        l: c === 0 ? "medium" : undefined,
        r: c === n - 1 ? "medium" : undefined,
        t: "medium",
        b: "medium",
        color: "FF0F172A",
      });
      const s = st.xf({ font: fTitre, border: b, h: "center" });
      if (c === 0) cTexte(r, c, s, opts.title);
      else cVide(r, c, s);
    }
    fusionner(r, 0, n - 1);
    r += 1;
  }
  if (opts.subtitle) {
    hauteurs.set(r, 15);
    bloc(r, 0, n - 1, st.xf({ font: fSousTitre, h: "center" }), opts.subtitle);
    r += 1;
  }
  // ── Filet coloré ──
  hauteurs.set(r, 4);
  for (let c = 0; c < n; c++) cVide(r, c, st.xf({ fill: fondFilet }));
  r += 1;
  hauteurs.set(r, 6);
  r += 1;

  // ── En-têtes de colonnes ──
  const ligneEntete = r;
  hauteurs.set(r, 28);
  columns.forEach((c, i) =>
    cTexte(
      r,
      i,
      st.xf({
        font: fEntete,
        fill: fondEntete,
        border: bFin,
        h: "center",
        wrap: true,
      }),
      c.header,
    ),
  );
  r += 1;

  // ── Données ──
  const entiers = columns.map(
    (c) =>
      c.format === "number" &&
      rows.every((row) => {
        const v = nombre(row[c.key]);
        return v === null || Number.isInteger(v);
      }),
  );

  const ecrireValeur = (
    row: number,
    col: number,
    valeur: unknown,
    base: { font: number; fill?: number; border: number },
  ) => {
    const c = columns[col];
    const fmt = c.format ?? "text";
    const h =
      c.align ??
      (fmt === "text" ? "left" : fmt === "date" ? "center" : "right");
    const s = (numFmt?: string) =>
      st.xf({ ...base, numFmt, h, wrap: fmt === "text" });
    if (valeur === null || valeur === undefined || valeur === "") {
      cVide(row, col, s());
      return;
    }
    if (fmt === "date") {
      const serie = serieDate(valeur);
      if (serie !== null) {
        poser(
          row,
          col,
          `<c r="${ref(col, row)}" s="${s(FORMAT_DATE)}"><v>${serie}</v></c>`,
        );
        return;
      }
    } else if (fmt === "number" || fmt === "currency") {
      const v = nombre(valeur);
      if (v !== null) {
        const code =
          fmt === "currency"
            ? FORMAT_EURO
            : entiers[col]
              ? FORMAT_ENTIER
              : FORMAT_NOMBRE;
        poser(
          row,
          col,
          `<c r="${ref(col, row)}" s="${s(code)}"><v>${v}</v></c>`,
        );
        return;
      }
    }
    cTexte(row, col, s(), texte(valeur));
  };

  rows.forEach((ligne, i) => {
    const zebre = i % 2 === 1;
    for (let c = 0; c < n; c++)
      ecrireValeur(r, c, ligne[columns[c].key], {
        font: fCorps,
        fill: zebre ? fondZebre : undefined,
        border: bFin,
      });
    r += 1;
  });
  const derniereDonnee = r - 1;

  // ── Totaux ──
  if (opts.totals) {
    const totals = opts.totals;
    for (let c = 0; c < n; c++) {
      const v = totals[columns[c].key];
      ecrireValeur(r, c, c === 0 && v === undefined ? "TOTAL" : v, {
        font: fTotal,
        fill: fondTotal,
        border: bTotal,
      });
    }
    r += 1;
  }

  // ── Pied : société + phrase L612-14 ──
  r += 1;
  const societePied = [
    [branding.name, branding.capitalLine]
      .filter(Boolean)
      .join(" ")
      .toUpperCase(),
    branding.address.toUpperCase(),
    [
      branding.email ? `e-mail: ${branding.email}` : "",
      branding.siret ? `N° Siret: ${branding.siret}` : "",
    ]
      .filter(Boolean)
      .join("   "),
    branding.authorizationNumber.toUpperCase(),
  ].filter(Boolean);
  const sPied = st.xf({ font: fPied, h: "center" });
  for (const l of societePied) {
    hauteurs.set(r, 12);
    bloc(r, 0, n - 1, sPied, l);
    r += 1;
  }
  const carsParLigne = Math.max(40, Math.floor(largeurTotale * 1.5));
  const lignesLegal = Math.ceil(MENTION_L612_14.length / carsParLigne);
  hauteurs.set(r, Math.max(11, lignesLegal * 10));
  bloc(
    r,
    0,
    n - 1,
    st.xf({ font: fLegal, h: "center", wrap: true }),
    MENTION_L612_14,
  );
  const derniereLigne = r;

  // ── XML de la feuille ──
  // Les espaceurs (hauteur fixe, sans cellule) sont aussi déclarés.
  const numeros = [...new Set([...lignes.keys(), ...hauteurs.keys()])].sort(
    (x, y) => x - y,
  );
  const sheetData = numeros
    .map((num) => {
      const cellules = lignes.get(num);
      const ht = hauteurs.get(num);
      const cx = cellules
        ? [...cellules.keys()]
            .sort((x, y) => x - y)
            .map((c) => cellules.get(c))
            .join("")
        : "";
      return `<row r="${num}"${ht ? ` ht="${ht}" customHeight="1"` : ""}>${cx}</row>`;
    })
    .join("");

  const paysage = n > 6;
  const filtre =
    rows.length > 0
      ? `<autoFilter ref="A${ligneEntete}:${lettre(n - 1)}${derniereDonnee}"/>`
      : "";
  const sheetXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>' +
    `<dimension ref="A1:${lettre(n - 1)}${derniereLigne}"/>` +
    '<sheetViews><sheetView showGridLines="0" workbookViewId="0">' +
    `<pane ySplit="${ligneEntete}" topLeftCell="A${ligneEntete + 1}" activePane="bottomLeft" state="frozen"/>` +
    '<selection pane="bottomLeft" activeCell="A' +
    (ligneEntete + 1) +
    '" sqref="A' +
    (ligneEntete + 1) +
    '"/>' +
    "</sheetView></sheetViews>" +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    "<cols>" +
    largeurs
      .map(
        (w, i) =>
          `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`,
      )
      .join("") +
    "</cols>" +
    `<sheetData>${sheetData}</sheetData>` +
    filtre +
    (fusions.length
      ? `<mergeCells count="${fusions.length}">${fusions.map((f) => `<mergeCell ref="${f}"/>`).join("")}</mergeCells>`
      : "") +
    '<printOptions horizontalCentered="1"/>' +
    '<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.6" header="0.3" footer="0.3"/>' +
    `<pageSetup paperSize="9" orientation="${paysage ? "landscape" : "portrait"}" fitToWidth="1" fitToHeight="0"/>` +
    "<headerFooter><oddFooter>&amp;C&amp;8Page &amp;P / &amp;N</oddFooter></headerFooter>" +
    (logoInfo ? '<drawing r:id="rId1"/>' : "") +
    "</worksheet>";

  const nomQuote = `'${feuille.replace(/'/g, "''")}'`;
  const noms =
    `<definedName name="_xlnm.Print_Titles" localSheetId="0">${esc(nomQuote)}!$${ligneEntete}:$${ligneEntete}</definedName>` +
    (rows.length > 0
      ? `<definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">${esc(nomQuote)}!$A$${ligneEntete}:$${lettre(n - 1)}$${derniereDonnee}</definedName>`
      : "");
  const workbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    '<bookViews><workbookView xWindow="0" yWindow="0" windowWidth="24000" windowHeight="12000"/></bookViews>' +
    `<sheets><sheet name="${esc(feuille)}" sheetId="1" r:id="rId1"/></sheets>` +
    `<definedNames>${noms}</definedNames>` +
    "</workbook>";

  const enc = new TextEncoder();
  const REL =
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const entetes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const entrees: { name: string; data: Uint8Array }[] = [
    {
      name: "[Content_Types].xml",
      data: enc.encode(
        entetes +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          (logoInfo
            ? '<Default Extension="png" ContentType="image/png"/>'
            : "") +
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
          (logoInfo
            ? '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>'
            : "") +
          "</Types>",
      ),
    },
    {
      name: "_rels/.rels",
      data: enc.encode(
        entetes +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          `<Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/>` +
          "</Relationships>",
      ),
    },
    { name: "xl/workbook.xml", data: enc.encode(workbook) },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: enc.encode(
        entetes +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          `<Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/>` +
          `<Relationship Id="rId2" Type="${REL}/styles" Target="styles.xml"/>` +
          "</Relationships>",
      ),
    },
    { name: "xl/styles.xml", data: enc.encode(st.xml()) },
    { name: "xl/worksheets/sheet1.xml", data: enc.encode(sheetXml) },
  ];

  if (logoInfo && logoOctets) {
    entrees.push(
      {
        name: "xl/worksheets/_rels/sheet1.xml.rels",
        data: enc.encode(
          entetes +
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            `<Relationship Id="rId1" Type="${REL}/drawing" Target="../drawings/drawing1.xml"/>` +
            "</Relationships>",
        ),
      },
      {
        name: "xl/drawings/drawing1.xml",
        data: enc.encode(
          entetes +
            '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' +
            "<xdr:oneCellAnchor>" +
            `<xdr:from><xdr:col>0</xdr:col><xdr:colOff>${logoInfo.offX}</xdr:colOff><xdr:row>0</xdr:row><xdr:rowOff>${logoInfo.offY}</xdr:rowOff></xdr:from>` +
            `<xdr:ext cx="${logoInfo.cx}" cy="${logoInfo.cy}"/>` +
            '<xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Logo"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr>' +
            `<xdr:blipFill><a:blip xmlns:r="${REL}" r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>` +
            `<xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${logoInfo.cx}" cy="${logoInfo.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>` +
            "</xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>",
        ),
      },
      {
        name: "xl/drawings/_rels/drawing1.xml.rels",
        data: enc.encode(
          entetes +
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
            `<Relationship Id="rId1" Type="${REL}/image" Target="../media/image1.png"/>` +
            "</Relationships>",
        ),
      },
      { name: "xl/media/image1.png", data: logoOctets },
    );
  }
  return createZip(entrees);
}

function rgbHex(c: readonly number[]): string {
  return c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

/** Télécharge un Blob (Safari : <a download> cliqué, URL révoquée en différé). */
export function telechargerBlob(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Génère et télécharge un vrai fichier .xlsx de marque. */
export async function exporterExcel(opts: OptionsExcel): Promise<void> {
  const octets = await construireXlsx(opts);
  const nom = opts.fileName.endsWith(".xlsx")
    ? opts.fileName
    : `${opts.fileName}.xlsx`;
  telechargerBlob(
    new Blob([octets as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    nom,
  );
}
