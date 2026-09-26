/**
 * Mise en page PDF d'un contrat rendu par `generateur.ts` : en-tête et pied de
 * page de marque, articles numérotés, paragraphes justifiés, sauts de page
 * propres (jamais de titre d'article orphelin, ni de ligne seule en haut ou en
 * bas de page) et bloc de signatures insécable.
 *
 * Aucun texte de contrat ici : il vit dans `templates.ts`.
 */
import type { jsPDF } from "jspdf";
import {
  applyPdfFooters,
  drawPdfHeader,
  pdfHeaderHeight,
  PDF_FOOTER_RESERVED_MM,
  type PdfBranding,
} from "@/lib/pdf-branding";
import { texteParagraphe, type ContratRendu } from "./generateur";

/** Trace des textes posés : sert aux tests (débordement, pagination). */
export interface TraceTexte {
  page: number;
  texte: string;
  x: number;
  /** Ligne de base (mm depuis le haut de la page). */
  y: number;
  /** Largeur du texte tel que dessiné (mm), hors espacement de justification. */
  largeur: number;
  genre: "titre-article" | "paragraphe" | "signature" | "intro";
}

export interface OptionsPdfContrat {
  trace?: TraceTexte[];
}

const MARGE_X = 18;
const TAILLE = 10;
const INTERLIGNE = 4.7;
const ESPACE_PARAGRAPHE = 2.2;
const AVANT_ARTICLE = 4.5;
const TAILLE_TITRE_ARTICLE = 10.5;
const HAUTEUR_TITRE_ARTICLE = 5.4;
const RETRAIT_PUCE = 6;
const HAUTEUR_SIGNATURES = 46;

export async function construirePdfContrat(
  contrat: ContratRendu,
  branding: PdfBranding,
  options: OptionsPdfContrat = {},
): Promise<jsPDF> {
  const { default: JsPdf } = await import("jspdf");
  const doc = new JsPdf({ unit: "mm", format: "a4" });
  const L = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const largeur = L - 2 * MARGE_X;
  const bas = H - PDF_FOOTER_RESERVED_MM;
  const trace = options.trace;

  doc.setProperties({ title: contrat.titre, subject: contrat.sousTitre });

  const titreEntete = { title: contrat.titre, subtitle: contrat.sousTitre };
  const hautSuite = pdfHeaderHeight(branding, {}) + 4;
  let y = drawPdfHeader(doc, branding, titreEntete) + 5;

  const page = () => doc.getNumberOfPages();
  const nouvellePage = () => {
    doc.addPage();
    y = hautSuite;
  };
  /** Saute de page si `hauteur` mm ne tiennent pas. */
  const reserver = (hauteur: number) => {
    if (y + hauteur > bas + 0.01) nouvellePage();
  };

  const police = (style: "normal" | "bold" | "italic", taille = TAILLE) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(taille);
    doc.setTextColor(20, 20, 20);
  };

  const poser = (
    texte: string,
    x: number,
    base: number,
    genre: TraceTexte["genre"],
    opts: { align?: "left" | "center" | "justify"; maxWidth?: number } = {},
  ) => {
    if (opts.align === "justify") {
      // Le dernier élément d'un tableau n'est jamais justifié par jsPDF : la
      // ligne vide qui suit garantit que la ligne réelle l'est.
      doc.text([texte, ""], x, base, {
        align: "justify",
        maxWidth: opts.maxWidth,
      });
    } else if (opts.align === "center") {
      doc.text(texte, x, base, { align: "center" });
    } else {
      doc.text(texte, x, base);
    }
    trace?.push({
      page: page(),
      texte,
      x: opts.align === "center" ? x - doc.getTextWidth(texte) / 2 : x,
      y: base,
      largeur: doc.getTextWidth(texte),
      genre,
    });
  };

  const coupe = (texte: string, w: number): string[] =>
    doc.splitTextToSize(texte, w) as string[];

  /**
   * Pose un paragraphe en gérant les sauts de page : au moins 2 lignes en bas
   * de page et au moins 2 lignes reportées en haut de la suivante.
   */
  const paragraphe = (
    lignes: string[],
    x: number,
    w: number,
    genre: TraceTexte["genre"],
    alignement: "justify" | "left" | "center",
    puce = false,
  ) => {
    let i = 0;
    while (i < lignes.length) {
      const place = Math.floor((bas - y + 0.01) / INTERLIGNE);
      const reste = lignes.length - i;
      let k = reste;
      if (reste > place) {
        k = place;
        if (i === 0 && k < 2) k = 0;
        else if (reste - k === 1) k -= 1;
        if (i === 0 && k < 2) k = 0;
      }
      if (k <= 0) {
        nouvellePage();
        continue;
      }
      for (let j = 0; j < k; j++) {
        const derniere = i + j === lignes.length - 1;
        const base = y + 3.4;
        if (puce && i + j === 0) poser("-", x - 4, base, genre);
        poser(lignes[i + j], alignement === "center" ? L / 2 : x, base, genre, {
          align:
            alignement === "justify" && !derniere
              ? "justify"
              : alignement === "center"
                ? "center"
                : "left",
          maxWidth: w,
        });
        y += INTERLIGNE;
      }
      i += k;
      if (i < lignes.length) nouvellePage();
    }
    y += ESPACE_PARAGRAPHE;
  };

  // Clôture + signatures : bloc insécable, et on y rattache le dernier
  // paragraphe (jamais de page ne portant que les signatures).
  police("normal");
  const lignesCloture = coupe(texteParagraphe(contrat.cloture), largeur);
  const hauteurBlocFinal =
    3 + lignesCloture.length * INTERLIGNE + 4 + HAUTEUR_SIGNATURES;
  const hauteurParagraphe = (lignes: string[]) =>
    lignes.length * INTERLIGNE + ESPACE_PARAGRAPHE;

  // ── Comparution des parties ──
  contrat.intro.forEach((p) => {
    const texte = texteParagraphe(p);
    if (p.style === "gras" || p.style === "centre") {
      police("bold");
      reserver(INTERLIGNE + 2);
      paragraphe(coupe(texte, largeur), MARGE_X, largeur, "intro", "center");
    } else {
      police("normal");
      paragraphe(coupe(texte, largeur), MARGE_X, largeur, "intro", "justify");
    }
  });

  // ── Articles ──
  contrat.articles.forEach((article, indice) => {
    const dernierArticle = indice === contrat.articles.length - 1;
    police("normal");
    const premier = article.paragraphes[0];
    const lignesPremier = premier
      ? coupe(
          texteParagraphe(premier),
          premier.puce ? largeur - RETRAIT_PUCE : largeur,
        )
      : [];
    // Le titre suit toujours le début du texte : 2 lignes si le paragraphe peut
    // être coupé (4 lignes ou plus), sinon le paragraphe entier (jamais 1 + 2).
    const lignesAvecTitre =
      lignesPremier.length >= 4 ? 2 : lignesPremier.length;
    const seulParagraphe = dernierArticle && article.paragraphes.length === 1;
    reserver(
      AVANT_ARTICLE +
        HAUTEUR_TITRE_ARTICLE +
        (seulParagraphe
          ? hauteurParagraphe(lignesPremier) + hauteurBlocFinal
          : lignesAvecTitre * INTERLIGNE),
    );
    y += AVANT_ARTICLE;
    police("bold", TAILLE_TITRE_ARTICLE);
    const titre = `Article ${article.numero} – ${article.titre}`;
    poser(titre, MARGE_X, y + 3.6, "titre-article");
    y += HAUTEUR_TITRE_ARTICLE;

    police("normal");
    article.paragraphes.forEach((p, j) => {
      const x = p.puce ? MARGE_X + RETRAIT_PUCE : MARGE_X;
      const w = p.puce ? largeur - RETRAIT_PUCE : largeur;
      const lignes = coupe(texteParagraphe(p), w);
      if (
        dernierArticle &&
        j === article.paragraphes.length - 1 &&
        lignes.length <= 10
      ) {
        reserver(hauteurParagraphe(lignes) + hauteurBlocFinal);
      }
      paragraphe(lignes, x, w, "paragraphe", "justify", p.puce);
    });
  });

  // ── Clôture et signatures (bloc insécable) ──
  police("normal");
  y += 3;
  reserver(hauteurBlocFinal - 3);
  paragraphe(lignesCloture, MARGE_X, largeur, "paragraphe", "left");
  y += 2;

  const colonne = (largeur - 10) / 2;
  contrat.signataires.slice(0, 2).forEach((s, i) => {
    const x = MARGE_X + i * (colonne + 10);
    police("bold");
    poser(s.libelle, x, y + 3.6, "signature");
    police("italic", 8);
    let yy = y + 3.6 + 4.2;
    for (const l of coupe(s.mention, colonne)) {
      poser(l, x, yy, "signature");
      yy += 3.6;
    }
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.2);
    doc.rect(x, y + 13, colonne, HAUTEUR_SIGNATURES - 18);
  });
  y += HAUTEUR_SIGNATURES;

  applyPdfFooters(doc, branding, { header: { skipFirstPage: true } });
  return doc;
}

/** PDF final sous forme de fichier, prêt à être téléchargé ou rattaché. */
export async function fichierPdfContrat(
  contrat: ContratRendu,
  branding: PdfBranding,
  nom: string,
): Promise<File> {
  const doc = await construirePdfContrat(contrat, branding);
  return new File([doc.output("blob")], nom, { type: "application/pdf" });
}
