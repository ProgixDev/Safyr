import { dateFr } from "./discipline-shared";

/** Informations injectées dans les modèles de courrier d'une procédure. */
export interface ContexteCourrier {
  salarie: string;
  entreprise: string;
  adresseEntreprise?: string;
  motif?: string;
  /** Sanction envisagée (une valeur de TYPES_SANCTION). */
  sanction?: string;
  /** Date de l'entretien préalable, ISO. */
  dateEntretien?: string;
  heureEntretien?: string;
  /** Nom du signataire et sa fonction. */
  responsable?: string;
  fonction?: string;
}

export interface Courrier {
  objet: string;
  corps: string;
  /** Mode d'envoi à respecter, imprimé sur le document PDF. */
  mention?: string;
}

const MENTION_ENVOI =
  "Lettre recommandée avec accusé de réception ou remise en main propre contre décharge";

/** Texte à compléter à la main : visible, pour ne pas partir vide par oubli. */
const A_PRECISER = (quoi: string) => `[${quoi} à préciser]`;

function signature(ctx: ContexteCourrier): string {
  return [
    "Cordialement,",
    "",
    ctx.responsable || "La Direction",
    ...(ctx.fonction ? [ctx.fonction] : []),
    ctx.entreprise,
  ].join("\n");
}

const estLicenciement = (s?: string) => /licenci/i.test(s ?? "");

/** Suite de « procédure disciplinaire », ou rien tant que la sanction n'est pas choisie. */
function jusquA(sanction?: string): string {
  if (!sanction) return "";
  return estLicenciement(sanction)
    ? " pouvant aller jusqu'au licenciement"
    : ` susceptible d'aboutir à la sanction suivante : ${sanction.toLowerCase()}`;
}

function courrierMiseEnDemeure(ctx: ContexteCourrier): Courrier {
  const faits = ctx.motif || "les faits qui vous ont été signalés";
  return {
    objet: `Mise en demeure${ctx.motif ? ` - ${ctx.motif}` : ""}`,
    corps: [
      "Madame, Monsieur,",
      "",
      `Nous constatons à ce jour les faits suivants : ${faits}.`,
      "",
      "Par la présente, nous vous mettons en demeure de nous adresser, sous 48 heures à compter de la réception de ce courrier, vos explications écrites accompagnées de tout justificatif et, le cas échéant, de reprendre votre poste sans délai.",
      "",
      `À défaut de réponse de votre part, nous serons contraints d'engager à votre encontre une procédure disciplinaire${jusquA(ctx.sanction)}.`,
      "",
      signature(ctx),
    ].join("\n"),
    mention: MENTION_ENVOI,
  };
}

function courrierConvocation(ctx: ContexteCourrier): Courrier {
  const date = dateFr(ctx.dateEntretien) || A_PRECISER("date");
  const heure = ctx.heureEntretien || A_PRECISER("heure");
  const licenciement = estLicenciement(ctx.sanction);
  const envisagee = !ctx.sanction
    ? "une sanction disciplinaire"
    : licenciement
      ? "une sanction disciplinaire pouvant aller jusqu'au licenciement"
      : `la sanction disciplinaire suivante : ${ctx.sanction.toLowerCase()}`;
  const assistance = licenciement
    ? "Lors de cet entretien, vous pourrez vous faire assister par une personne de votre choix appartenant au personnel de l'entreprise ou, en l'absence de représentants du personnel, par un conseiller du salarié inscrit sur la liste départementale (consultable en mairie et auprès de l'inspection du travail)."
    : "Lors de cet entretien, vous pourrez vous faire assister par une personne de votre choix appartenant au personnel de l'entreprise.";
  return {
    objet: "Convocation à un entretien préalable",
    corps: [
      "Madame, Monsieur,",
      "",
      `Nous envisageons de prendre à votre encontre ${envisagee}, en raison des faits suivants : ${ctx.motif || A_PRECISER("motif")}.`,
      "",
      `Conformément à l'article L. 1332-2 du Code du travail, nous vous convoquons à un entretien préalable le ${date} à ${heure}, au siège de l'entreprise${ctx.adresseEntreprise ? ` (${ctx.adresseEntreprise})` : ""}.`,
      "",
      assistance,
      ...(licenciement
        ? [
            "",
            "Cet entretien ne peut avoir lieu moins de cinq jours ouvrables après la présentation de la présente lettre.",
          ]
        : []),
      "",
      "Nous vous invitons à vous y présenter muni de tout élément utile à votre défense.",
      "",
      signature(ctx),
    ].join("\n"),
    mention: MENTION_ENVOI,
  };
}

function courrierNotification(ctx: ContexteCourrier): Courrier {
  const date = dateFr(ctx.dateEntretien) || A_PRECISER("date de l'entretien");
  const faits = ctx.motif || A_PRECISER("motif");
  const sanction = ctx.sanction ?? "";
  let decision: string[];
  if (estLicenciement(sanction)) {
    const grave = /grave|lourde/i.test(sanction);
    decision = [
      `Nous vous notifions par la présente votre licenciement pour ${/lourde/i.test(sanction) ? "faute lourde" : grave ? "faute grave" : "faute"}, en raison des faits suivants : ${faits}.`,
      "",
      grave
        ? "Compte tenu de la gravité de ces faits, votre maintien dans l'entreprise est impossible : le licenciement prend effet à la première présentation de cette lettre, sans préavis ni indemnité de licenciement."
        : "Votre préavis, d'une durée conforme à votre contrat de travail et à la convention collective applicable, débutera à la première présentation de cette lettre.",
      "",
      "Votre certificat de travail, votre attestation destinée à France Travail et votre reçu pour solde de tout compte seront tenus à votre disposition à l'issue de votre contrat.",
    ];
  } else {
    decision = [
      `Nous vous notifions la sanction suivante : ${sanction || A_PRECISER("sanction")}, en raison des faits suivants : ${faits}.`,
      "",
      "Cette sanction prend effet à compter de la première présentation de la présente lettre.",
    ];
  }
  return {
    objet: `Notification de sanction${sanction ? ` - ${sanction}` : ""}`,
    corps: [
      "Madame, Monsieur,",
      "",
      `Suite à l'entretien préalable du ${date}, et après examen de vos explications, nous avons pris la décision suivante.`,
      "",
      ...decision,
      "",
      signature(ctx),
    ].join("\n"),
    mention: MENTION_ENVOI,
  };
}

/** Modèle de courrier d'une étape (indice à partir de 0), prêt à envoyer. */
export function modeleCourrier(
  indiceEtape: number,
  ctx: ContexteCourrier,
): Courrier {
  if (indiceEtape === 0) return courrierMiseEnDemeure(ctx);
  if (indiceEtape === 1) return courrierConvocation(ctx);
  return courrierNotification(ctx);
}

function slug(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

/**
 * Génère le courrier en PDF (jsPDF chargé à la demande). Le fichier est
 * renvoyé pour être rattaché à la procédure.
 */
export async function genererPdfCourrier(
  indiceEtape: number,
  courrier: Courrier,
  ctx: ContexteCourrier,
): Promise<File> {
  const { default: jsPDF } = await import("jspdf");
  const { PDF_FOOTER_RESERVED_MM, applyPdfFooters, loadPdfBranding } =
    await import("@/lib/pdf-branding");
  const branding = await loadPdfBranding();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marge = 20;
  const largeur = 210 - marge * 2;
  // Le texte s'arrête au-dessus du pied de page (société + L612-14).
  const bas = 297 - PDF_FOOTER_RESERVED_MM;
  let y = 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(ctx.entreprise || "Entreprise", marge, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  if (ctx.adresseEntreprise) {
    for (const ligne of doc.splitTextToSize(ctx.adresseEntreprise, 90)) {
      doc.text(ligne, marge, y);
      y += 4.5;
    }
  }
  doc.setTextColor(0);

  doc.setFontSize(10);
  doc.text(`Le ${dateFr(new Date())}`, 210 - marge, 22, { align: "right" });
  doc.text(ctx.salarie, 210 - marge, 28, { align: "right" });

  y = Math.max(y, 40) + 6;
  if (courrier.mention) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    for (const ligne of doc.splitTextToSize(courrier.mention, largeur)) {
      doc.text(ligne, marge, y);
      y += 4.5;
    }
    y += 3;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  for (const ligne of doc.splitTextToSize(
    `Objet : ${courrier.objet}`,
    largeur,
  )) {
    doc.text(ligne, marge, y);
    y += 5.5;
  }
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  for (const ligne of doc.splitTextToSize(courrier.corps, largeur)) {
    if (y > bas) {
      doc.addPage();
      y = 22;
    }
    doc.text(ligne, marge, y);
    y += 5.2;
  }

  applyPdfFooters(doc, branding);

  const blob = doc.output("blob");
  const nom = `courrier-etape-${indiceEtape + 1}-${slug(ctx.salarie) || "salarie"}.pdf`;
  return new File([blob], nom, { type: "application/pdf" });
}
