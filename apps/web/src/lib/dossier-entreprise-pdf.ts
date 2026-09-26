import type jsPDF from "jspdf";
import type {
  ComplianceItem,
  Client,
  Employee,
  FiscalRecord,
  Invoice,
  Organization,
  Site,
} from "@safyr/api-client";

import {
  PDF_BRAND_RGB,
  PDF_FOOTER_RESERVED_MM,
  applyPdfFooters,
  brandedPdfDefaults,
  drawPdfHeader,
  loadPdfBranding,
  pdfTableMargins,
  type PdfBranding,
  type PdfHeaderOptions,
} from "@/lib/pdf-branding";

/**
 * Dossier de candidature de l'entreprise (appels d'offre) : cinq rubriques
 * compilées automatiquement à partir des données de l'application.
 *
 * Règle commune : une rubrique sans donnée n'est jamais omise ni source
 * d'erreur, elle affiche « Non renseigné » (ou la liste des pièces attendues)
 * pour que l'utilisateur sache exactement ce qu'il reste à compléter.
 * Chaque page porte l'en-tête de marque (logo + coordonnées) et le pied de
 * page de marque (société + article L612-14).
 */

export type Rubrique =
  | "entreprise"
  | "memoire"
  | "financier"
  | "references"
  | "personnel";

export const RUBRIQUES: {
  id: Rubrique;
  titre: string;
  description: string;
}[] = [
  {
    id: "entreprise",
    titre: "Mon entreprise",
    description:
      "Identité, coordonnées, représentant légal, autorisation CNAPS et pièces administratives déposées avec leur validité.",
  },
  {
    id: "memoire",
    titre: "Mémoire technique",
    description:
      "Présentation de l'entreprise, organisation, moyens humains et matériels, engagements qualité.",
  },
  {
    id: "financier",
    titre: "Documents financiers",
    description:
      "Chiffre d'affaires facturé, déclarations et pièces attendues (bilans, attestations URSSAF et fiscale).",
  },
  {
    id: "references",
    titre: "Références professionnelles",
    description: "Clients, contrats en cours et sites sous surveillance.",
  },
  {
    id: "personnel",
    titre: "Dossier du personnel",
    description:
      "Liste nominative des salariés actifs : emploi, contrat, embauche, qualifications et cartes professionnelles avec validité.",
  },
];

const NON_RENSEIGNE = "Non renseigné";

// ── Modèle de données ───────────────────────────────────────────────────

export interface QualificationSalarie {
  code: string;
  libelle: string;
  expiration?: string;
  valide: boolean;
}

export interface SalarieDossier {
  /** « NOM Prénom » : ni date de naissance, ni adresse, ni n° de sécurité sociale. */
  nom: string;
  fonction: string;
  contrat: string;
  embauche?: string;
  qualifications: QualificationSalarie[];
  cartePro: {
    expiration?: string;
    etat: "valide" | "expiree" | "inconnue";
  } | null;
  /** Documents obligatoires ; null quand le dossier du salarié n'a pu être lu. */
  pieces: {
    requises: number;
    presentes: number;
    manquantes: string[];
  } | null;
}

export interface PieceFinanciere {
  libelle: string;
  statut: "Fournie" | "À renouveler" | "Expirée" | "À fournir";
  echeance?: string;
  detail?: string;
}

/** Pièce administrative de « Mon entreprise » avec son état de dépôt. */
export interface PieceEntreprise {
  libelle: string;
  obligatoire: boolean;
  statut: "Valide" | "Expire bientôt" | "Expiré" | "Manquant" | "Non déposé";
  depot?: string;
  echeance?: string;
  /** Faux quand la pièce n'a pas de date de validité. */
  aEcheance: boolean;
}

export interface DonneesDossier {
  entreprise: {
    nom: string;
    formeJuridique: string;
    siret: string;
    siren: string;
    ape: string;
    tva: string;
    capital: string;
    adresse: string;
    email: string;
    telephone: string;
    telephone2: string;
    agrementCnaps: string;
    dirigeant: string;
    fonctionDirigeant: string;
    nominationDirigeant?: string;
  } | null;
  piecesEntreprise: PieceEntreprise[];
  salaries: SalarieDossier[];
  sites: {
    nom: string;
    client: string;
    ville: string;
    postes: number;
    actif: boolean;
  }[];
  clients: { nom: string; secteur: string; ville: string }[];
  contrats: {
    client: string;
    objet: string;
    debut?: string;
    fin?: string;
    statut: "active" | "expired" | "terminated";
  }[];
  ca: {
    annee: string;
    factures: number;
    totalHT: number;
    encaisseHT: number;
  }[];
  pieces: PieceFinanciere[];
  declarations: {
    tva: number;
    tvaDerniere?: string;
    cfe: number;
    cfeDerniere?: string;
  };
  equipements: { libelle: string; quantite: number }[];
}

// ── Construction des données à partir des sources de l'application ─────

export interface SourcesDossier {
  organisation?: Organization | null;
  conformite?: ComplianceItem[];
  salaries?: Employee[];
  sites?: Site[];
  clients?: Client[];
  contrats?: FiscalRecord[];
  factures?: Invoice[];
  equipements?: FiscalRecord[];
  tva?: FiscalRecord[];
  cfe?: FiscalRecord[];
  divers?: FiscalRecord[];
  /** Dossier de conformité de chaque salarié, par identifiant de membre. */
  piecesSalaries?: Record<string, ComplianceItem[] | undefined>;
}

const LIBELLES_QUALIFICATIONS: Record<string, string> = {
  CQP_APS: "CQP APS",
  CNAPS: "Carte professionnelle CNAPS",
  SSIAP1: "SSIAP 1",
  SSIAP2: "SSIAP 2",
  SSIAP3: "SSIAP 3",
  SST: "SST (sauveteur secouriste du travail)",
  H0B0: "Habilitation électrique H0B0",
  FIRE: "Habilitation incendie",
};

const LIBELLES_CONTRATS: Record<string, string> = {
  CDI: "CDI",
  CDD: "CDD",
  INTERIM: "Intérim",
  APPRENTICESHIP: "Apprentissage",
  INTERNSHIP: "Stage",
};

/** Espaces insécables et fines : absents de la police standard du PDF. */
const texte = (v: unknown): string =>
  typeof v === "string" ? v.split(/\s+/).join(" ").trim() : "";

function estPasse(iso?: string | null): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return !Number.isNaN(t) && t < Date.now();
}

/** Documents obligatoires présents ; un document expiré compte comme manquant. */
function piecesSalarie(
  items: ComplianceItem[] | undefined,
): SalarieDossier["pieces"] {
  if (!items) return null;
  const requises = items.filter((i) => i.requirement.isRequired);
  const manquantes = requises
    .filter((i) => !i.document || i.status === "expired")
    .map((i) => i.requirement.name);
  return {
    requises: requises.length,
    presentes: requises.length - manquantes.length,
    manquantes,
  };
}

function salarieDossier(
  e: Employee,
  items: ComplianceItem[] | undefined,
): SalarieDossier {
  const prenom = texte(e.firstName);
  const patronyme = texte(e.lastName).toUpperCase();
  const nom = `${patronyme} ${prenom}`.trim() || e.employeeNumber || "Salarié";

  // La visite médicale relève de la santé du salarié : elle n'a aucune
  // utilité dans un dossier de candidature et n'est donc jamais reprise.
  const utiles = (e.certifications ?? []).filter((c) => c.type !== "VM");
  const qualifications = utiles
    .filter((c) => c.type !== "CNAPS")
    .map<QualificationSalarie>((c) => ({
      code: c.type,
      libelle: LIBELLES_QUALIFICATIONS[c.type] ?? c.type,
      expiration: c.expiryDate || undefined,
      valide: !estPasse(c.expiryDate),
    }));

  const cnaps = utiles.find((c) => c.type === "CNAPS");
  let cartePro: SalarieDossier["cartePro"] = null;
  if (cnaps) {
    cartePro = {
      expiration: cnaps.expiryDate || undefined,
      etat: estPasse(cnaps.expiryDate) ? "expiree" : "valide",
    };
  } else if (e.cartePro) {
    // Numéro connu, échéance inconnue : on ne prétend pas qu'elle est valide.
    cartePro = { etat: "inconnue" };
  }

  return {
    nom,
    fonction: texte(e.position),
    contrat: LIBELLES_CONTRATS[e.contractType ?? ""] ?? texte(e.contractType),
    embauche: e.hireDate || undefined,
    qualifications,
    cartePro,
    pieces: piecesSalarie(items),
  };
}

function statutPiece(item: ComplianceItem | undefined): PieceFinanciere {
  const libelle = item?.requirement.name ?? "";
  if (!item || !item.document) {
    return { libelle, statut: "À fournir" };
  }
  const echeance = item.document.expiryDate?.slice(0, 10);
  if (item.status === "expired") {
    return { libelle, statut: "Expirée", echeance };
  }
  if (item.status === "expiring") {
    return { libelle, statut: "À renouveler", echeance };
  }
  return { libelle, statut: "Fournie", echeance };
}

/**
 * La fiche « Mon entreprise » n'a pas de champ forme juridique : on la déduit
 * de la raison sociale (« ... SARL », « ... SAS »), sinon on ne devine rien.
 */
function formeJuridique(nom: string): string {
  const m = /\b(SASU|SAS|SARL|EURL|SCOP|SNC|SCI|SELARL|SA)\b/i.exec(nom);
  return m ? m[1].toUpperCase() : "";
}

/** Capital saisi à la main (« 5000 », « 5 000 € ») : on n'affiche que des euros. */
function capitalLisible(brut: string): string {
  if (!brut) return "";
  if (/^[\d\s.,]+$/.test(brut)) {
    const n = Number(brut.replace(/\s/g, "").replace(",", "."));
    if (Number.isFinite(n)) return `${nombre(n)} EUR`;
  }
  return brut.replace("€", "EUR");
}

function pieceEntreprise(item: ComplianceItem): PieceEntreprise {
  const doc = item.document;
  const aEcheance = item.requirement.hasExpiry;
  let statut: PieceEntreprise["statut"];
  if (!doc) statut = item.requirement.isRequired ? "Manquant" : "Non déposé";
  else if (item.status === "expired") statut = "Expiré";
  else if (item.status === "expiring") statut = "Expire bientôt";
  else statut = "Valide";
  return {
    libelle: item.requirement.name,
    obligatoire: item.requirement.isRequired,
    statut,
    depot: doc?.createdAt?.slice(0, 10),
    echeance: aEcheance ? doc?.expiryDate?.slice(0, 10) : undefined,
    aEcheance,
  };
}

/** Dernière période (AAAA-MM ou AAAA) d'un registre, pour l'affichage. */
function dernierePeriode(lignes: FiscalRecord[]): string | undefined {
  return lignes.map((l) => l.period).sort((a, b) => b.localeCompare(a))[0];
}

export function construireDonnees(src: SourcesDossier): DonneesDossier {
  const org = src.organisation ?? null;
  const dirigeant = org?.representative;

  const salaries = (src.salaries ?? [])
    .filter((e) => e.status === "active")
    .map((e) => salarieDossier(e, src.piecesSalaries?.[e.id]))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

  const clientsParId = new Map((src.clients ?? []).map((c) => [c.id, c]));

  const contrats = (src.contrats ?? [])
    .filter((r) => r.type === "client_contrat")
    .map((r) => {
      const meta = (r.meta ?? {}) as Record<string, unknown>;
      const statut = texte(meta.status);
      return {
        client:
          clientsParId.get(texte(meta.clientId))?.name ?? "Client supprimé",
        objet: texte(meta.description) || r.label,
        debut: texte(meta.startDate) || undefined,
        fin: texte(meta.endDate) || undefined,
        statut: (statut === "expired" || statut === "terminated"
          ? statut
          : "active") as "active" | "expired" | "terminated",
      };
    });

  // Chiffre d'affaires : factures émises uniquement (ni brouillon ni annulée).
  const parAnnee = new Map<
    string,
    { factures: number; totalHT: number; encaisseHT: number }
  >();
  for (const f of src.factures ?? []) {
    if (f.status === "draft" || f.status === "cancelled") continue;
    const annee = (f.issuedAt ?? f.periodEnd ?? f.createdAt).slice(0, 4);
    const ligne = parAnnee.get(annee) ?? {
      factures: 0,
      totalHT: 0,
      encaisseHT: 0,
    };
    ligne.factures += 1;
    ligne.totalHT += f.subtotal ?? 0;
    if (f.status === "paid") ligne.encaisseHT += f.subtotal ?? 0;
    parAnnee.set(annee, ligne);
  }
  const ca = [...parAnnee.entries()]
    .map(([annee, v]) => ({ annee, ...v }))
    .sort((a, b) => b.annee.localeCompare(a.annee));

  // Pièces attendues : les attestations viennent du dossier de conformité de
  // l'entreprise ; les bilans se cherchent dans « Divers documents ».
  const conformite = src.conformite ?? [];
  const parType = (type: string) =>
    conformite.find((c) => c.requirement.type === type);
  const pieces: PieceFinanciere[] = [];
  const bilans = (src.divers ?? []).filter((r) => {
    if (r.type !== "divers") return false;
    const meta = (r.meta ?? {}) as Record<string, unknown>;
    return /bilan|liasse|compte de r[ée]sultat|comptes? annuels?/i.test(
      `${r.label} ${texte(meta.nom)} ${texte(meta.type)}`,
    );
  });
  pieces.push(
    bilans.length > 0
      ? {
          libelle: "Bilans et comptes de résultat (3 derniers exercices)",
          statut: "Fournie",
          detail: `${bilans.length} document(s) trouvé(s) dans Divers documents`,
        }
      : {
          libelle: "Bilans et comptes de résultat (3 derniers exercices)",
          statut: "À fournir",
          detail: "Aucun bilan enregistré dans Divers documents",
        },
  );
  for (const [type, libelleParDefaut] of [
    ["urssaf", "Attestation de vigilance URSSAF"],
    ["fiscale", "Attestation de régularité fiscale"],
    ["kbis", "Extrait Kbis"],
    ["assurance_rc", "Attestation d'assurance RC professionnelle"],
  ] as const) {
    const item = parType(type);
    pieces.push({ ...statutPiece(item), libelle: libelleParDefaut });
  }

  const tva = (src.tva ?? []).filter((r) => r.type === "tva");
  const cfe = (src.cfe ?? []).filter((r) => r.type === "cfe");

  const equipements = new Map<string, number>();
  for (const r of src.equipements ?? []) {
    if (r.type !== "equipement") continue;
    const cle = r.label.trim() || "Équipement";
    equipements.set(cle, (equipements.get(cle) ?? 0) + 1);
  }

  return {
    entreprise: org
      ? {
          nom: texte(org.name),
          formeJuridique: formeJuridique(texte(org.name)),
          siret: texte(org.siret),
          siren: texte(org.siret).replace(/\D/g, "").slice(0, 9),
          ape: texte(org.ape),
          tva: texte(org.numTVA),
          capital: capitalLisible(texte(org.shareCapital)),
          adresse: texte(org.address),
          email: texte(org.email),
          telephone: texte(org.phone),
          telephone2: texte(org.phone2),
          agrementCnaps: texte(org.authorizationNumber),
          dirigeant: dirigeant
            ? `${texte(dirigeant.firstName)} ${texte(dirigeant.lastName)}`.trim()
            : "",
          fonctionDirigeant: texte(dirigeant?.position),
          nominationDirigeant: dirigeant?.appointmentDate || undefined,
        }
      : null,
    piecesEntreprise: conformite.map(pieceEntreprise),
    salaries,
    sites: (src.sites ?? []).map((s) => ({
      nom: s.name,
      client: texte(s.clientName),
      ville: texte(s.city),
      postes: s.posts?.length ?? 0,
      actif: s.active,
    })),
    clients: (src.clients ?? []).map((c) => ({
      nom: c.name,
      secteur: texte(c.sector),
      ville: texte(c.city),
    })),
    contrats,
    ca,
    pieces,
    declarations: {
      tva: tva.length,
      tvaDerniere: dernierePeriode(tva),
      cfe: cfe.length,
      cfeDerniere: dernierePeriode(cfe),
    },
    equipements: [...equipements.entries()]
      .map(([libelle, quantite]) => ({ libelle, quantite }))
      .sort((a, b) => b.quantite - a.quantite),
  };
}

// ── Synthèse par rubrique (utilisée par l'écran et par les PDF) ─────────

export interface AgregatPersonnel {
  effectif: number;
  parContrat: [string, number][];
  parFonction: [string, number][];
  parQualification: {
    libelle: string;
    total: number;
    valides: number;
    expirees: number;
  }[];
  cartes: {
    valides: number;
    expirees: number;
    inconnues: number;
    total: number;
  };
}

function compter(valeurs: string[]): [string, number][] {
  const map = new Map<string, { libelle: string; n: number }>();
  for (const v of valeurs) {
    const cle = v.toLowerCase();
    const cur = map.get(cle) ?? { libelle: v, n: 0 };
    cur.n += 1;
    map.set(cle, cur);
  }
  return [...map.values()]
    .sort((a, b) => b.n - a.n)
    .map((x) => [x.libelle, x.n] as [string, number]);
}

export function agregerPersonnel(d: DonneesDossier): AgregatPersonnel {
  const parQual = new Map<
    string,
    { libelle: string; total: number; valides: number; expirees: number }
  >();
  for (const s of d.salaries) {
    // Un salarié compte une fois par qualification, même s'il en a deux
    // exemplaires (renouvellement en cours).
    const vues = new Set<string>();
    for (const q of s.qualifications) {
      if (vues.has(q.code)) continue;
      vues.add(q.code);
      const ligne = parQual.get(q.code) ?? {
        libelle: q.libelle,
        total: 0,
        valides: 0,
        expirees: 0,
      };
      ligne.total += 1;
      if (s.qualifications.some((x) => x.code === q.code && x.valide)) {
        ligne.valides += 1;
      } else {
        ligne.expirees += 1;
      }
      parQual.set(q.code, ligne);
    }
  }
  const cartes = { valides: 0, expirees: 0, inconnues: 0, total: 0 };
  for (const s of d.salaries) {
    if (!s.cartePro) continue;
    cartes.total += 1;
    if (s.cartePro.etat === "valide") cartes.valides += 1;
    else if (s.cartePro.etat === "expiree") cartes.expirees += 1;
    else cartes.inconnues += 1;
  }
  return {
    effectif: d.salaries.length,
    parContrat: compter(d.salaries.map((s) => s.contrat || NON_RENSEIGNE)),
    parFonction: compter(d.salaries.map((s) => s.fonction || NON_RENSEIGNE)),
    parQualification: [...parQual.values()].sort((a, b) => b.total - a.total),
    cartes,
  };
}

/** Ce qui manque pour que la rubrique soit complète (vide = complète). */
export function manquesRubrique(d: DonneesDossier, r: Rubrique): string[] {
  const manques: string[] = [];
  const e = d.entreprise;
  if (r === "entreprise") {
    if (!e) return ["Informations de l'entreprise"];
    if (!e.siret) manques.push("SIRET");
    if (!e.adresse) manques.push("Adresse");
    if (!e.agrementCnaps) manques.push("Autorisation CNAPS");
    if (!e.dirigeant) manques.push("Représentant légal");
    for (const p of d.piecesEntreprise) {
      if (
        p.obligatoire &&
        p.statut !== "Valide" &&
        p.statut !== "Expire bientôt"
      )
        manques.push(`${p.libelle} (${p.statut.toLowerCase()})`);
    }
  } else if (r === "memoire") {
    if (!e) return ["Informations de l'entreprise"];
    if (!e.siret) manques.push("SIRET");
    if (!e.adresse) manques.push("Adresse");
    if (!e.agrementCnaps) manques.push("Agrément / autorisation CNAPS");
    if (!e.dirigeant) manques.push("Dirigeant");
    if (d.salaries.length === 0) manques.push("Effectifs");
    if (d.equipements.length === 0) manques.push("Moyens matériels");
  } else if (r === "financier") {
    if (d.ca.length === 0) manques.push("Chiffre d'affaires (aucune facture)");
    for (const p of d.pieces) {
      if (p.statut !== "Fournie") manques.push(`${p.libelle} (${p.statut})`);
    }
  } else if (r === "references") {
    if (d.clients.length === 0) manques.push("Clients");
    if (d.contrats.length === 0) manques.push("Contrats");
  } else {
    if (d.salaries.length === 0) manques.push("Salariés actifs");
    else {
      const ag = agregerPersonnel(d);
      if (ag.parQualification.length === 0) manques.push("Qualifications");
      if (ag.cartes.total === 0) manques.push("Cartes professionnelles");
      if (ag.cartes.expirees > 0)
        manques.push(
          `${ag.cartes.expirees} carte(s) professionnelle(s) expirée(s)`,
        );
    }
  }
  return manques;
}

// ── Mise en forme ───────────────────────────────────────────────────────

/** Espaces ordinaires : l'espace fine de toLocaleString s'affiche mal en PDF. */
function nombre(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const euros = (n: number) => `${nombre(n)} EUR`;

function dateFr(iso?: string | null): string {
  if (!iso) return NON_RENSEIGNE;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return NON_RENSEIGNE;
  return dt.toLocaleDateString("fr-FR");
}

const valeur = (s?: string | null) =>
  s && s.trim() ? s.trim() : NON_RENSEIGNE;

interface Ctx {
  doc: jsPDF;
  autoTable: typeof import("jspdf-autotable").default;
  branding: PdfBranding;
  /** En-tête répété sur chaque page (posé par `applyPdfFooters`). */
  header: PdfHeaderOptions;
  y: number;
  marge: number;
  largeur: number;
  hauteur: number;
  /** Y où commence le contenu sur une page qui n'est pas la première. */
  debutPage: number;
}

function limiteBas(ctx: Ctx): number {
  return ctx.hauteur - PDF_FOOTER_RESERVED_MM;
}

function nouvellePage(ctx: Ctx) {
  ctx.doc.addPage();
  ctx.y = ctx.debutPage;
}

function assurerPlace(ctx: Ctx, hauteurNecessaire: number) {
  if (ctx.y + hauteurNecessaire > limiteBas(ctx)) nouvellePage(ctx);
}

function marges(ctx: Ctx) {
  return pdfTableMargins(ctx.branding, { header: ctx.header });
}

/** Bandeau de rubrique (dossier complet) : une rubrique par page. */
function titreRubrique(ctx: Ctx, titre: string) {
  ctx.doc.setFillColor(...PDF_BRAND_RGB);
  ctx.doc.roundedRect(
    ctx.marge,
    ctx.y - 6.5,
    ctx.largeur - 2 * ctx.marge,
    10,
    1.5,
    1.5,
    "F",
  );
  ctx.doc.setTextColor(255, 255, 255);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(13);
  ctx.doc.text(titre, ctx.marge + 4, ctx.y + 0.2);
  ctx.doc.setTextColor(15, 23, 42);
  ctx.y += 12;
}

function sousTitre(ctx: Ctx, titre: string) {
  assurerPlace(ctx, 22);
  ctx.doc.setTextColor(15, 23, 42);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(11.5);
  ctx.doc.text(titre, ctx.marge, ctx.y);
  ctx.doc.setDrawColor(...PDF_BRAND_RGB);
  ctx.doc.setLineWidth(0.6);
  ctx.doc.line(ctx.marge, ctx.y + 1.5, ctx.marge + 30, ctx.y + 1.5);
  ctx.y += 7;
}

function paragraphe(ctx: Ctx, contenu: string, italique = false) {
  ctx.doc.setFont("helvetica", italique ? "italic" : "normal");
  ctx.doc.setFontSize(9.5);
  ctx.doc.setTextColor(51, 65, 85);
  const lignes = ctx.doc.splitTextToSize(
    contenu,
    ctx.largeur - 2 * ctx.marge,
  ) as string[];
  assurerPlace(ctx, lignes.length * 4.8 + 2);
  ctx.doc.text(lignes, ctx.marge, ctx.y);
  ctx.y += lignes.length * 4.8 + 2;
}

function finTableau(ctx: Ctx) {
  ctx.y =
    (ctx.doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 8;
}

type Cellule = string | { content: string; styles: Record<string, unknown> };

function tableau(
  ctx: Ctx,
  entetes: string[],
  corps: Cellule[][],
  largeurs?: Record<number, number>,
  options: { petit?: boolean } = {},
) {
  ctx.autoTable(ctx.doc, {
    ...brandedPdfDefaults,
    styles: {
      ...brandedPdfDefaults.styles,
      fontSize: options.petit ? 7.5 : 8.5,
      cellPadding: options.petit ? 1.6 : 2,
      valign: "middle",
    },
    startY: ctx.y,
    head: [entetes],
    rowPageBreak: "avoid",
    body: corps,
    columnStyles: Object.fromEntries(
      Object.entries(largeurs ?? {}).map(([i, w]) => [i, { cellWidth: w }]),
    ),
    margin: marges(ctx),
  });
  finTableau(ctx);
}

function cleValeur(ctx: Ctx, lignes: [string, string][]) {
  ctx.autoTable(ctx.doc, {
    startY: ctx.y,
    body: lignes,
    theme: "plain",
    styles: { fontSize: 9.5, cellPadding: 1.8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: [71, 85, 105] },
    },
    margin: marges(ctx),
  });
  finTableau(ctx);
}

/** Rangée de pastilles chiffrées (effectif, cartes valides...). */
function indicateurs(ctx: Ctx, items: [string, string][]) {
  const gouttiere = 3;
  const utile = ctx.largeur - 2 * ctx.marge;
  const largeur = (utile - gouttiere * (items.length - 1)) / items.length;
  const hauteur = 17;
  assurerPlace(ctx, hauteur + 6);
  items.forEach(([libelle, valeurTexte], i) => {
    const x = ctx.marge + i * (largeur + gouttiere);
    ctx.doc.setFillColor(240, 249, 251);
    ctx.doc.setDrawColor(186, 230, 240);
    ctx.doc.setLineWidth(0.25);
    ctx.doc.roundedRect(x, ctx.y, largeur, hauteur, 1.5, 1.5, "FD");
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setFontSize(15);
    ctx.doc.setTextColor(...PDF_BRAND_RGB);
    ctx.doc.text(valeurTexte, x + largeur / 2, ctx.y + 8, { align: "center" });
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(7.5);
    ctx.doc.setTextColor(71, 85, 105);
    const lignes = ctx.doc.splitTextToSize(libelle, largeur - 4) as string[];
    ctx.doc.text(lignes.slice(0, 2), x + largeur / 2, ctx.y + 12.2, {
      align: "center",
    });
  });
  ctx.doc.setTextColor(15, 23, 42);
  ctx.y += hauteur + 6;
}

function absent(ctx: Ctx, message: string) {
  paragraphe(ctx, `${NON_RENSEIGNE} : ${message}`, true);
}

const VERT: [number, number, number] = [21, 128, 61];
const ROUGE: [number, number, number] = [185, 28, 28];
const AMBRE: [number, number, number] = [180, 83, 9];
const GRIS: [number, number, number] = [100, 116, 139];

/** Cellule colorée (statut) : le texte reste lisible en noir et blanc. */
function statut(contenu: string, couleur: [number, number, number]): Cellule {
  return {
    content: contenu,
    styles: { textColor: couleur, fontStyle: "bold" },
  };
}

const HAUT_CONTEXTE = 4;

async function creerContexte(
  titre: string,
  branding?: PdfBranding,
): Promise<Ctx> {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  // loadPdfBranding ne rejette jamais : sans société, l'en-tête reste valable.
  const marque = branding ?? (await loadPdfBranding());
  const doc = new JsPDF({ unit: "mm", format: "a4", compress: true });
  const header: PdfHeaderOptions = {
    title: titre.toUpperCase(),
    subtitle: `Document généré le ${new Date().toLocaleDateString("fr-FR")} à partir des données de l'application - à relire avant transmission`,
  };
  const debut = drawPdfHeader(doc, marque, header);
  return {
    doc,
    autoTable,
    branding: marque,
    header,
    y: debut + HAUT_CONTEXTE,
    marge: 14,
    largeur: doc.internal.pageSize.getWidth(),
    hauteur: doc.internal.pageSize.getHeight(),
    debutPage: pdfTableMargins(marque, { header }).top + HAUT_CONTEXTE,
  };
}

/** À appeler une seule fois, après tout le contenu. */
function finaliser(ctx: Ctx, prefixe: string, d: DonneesDossier): PdfGenere {
  applyPdfFooters(ctx.doc, ctx.branding, {
    header: { ...ctx.header, skipFirstPage: true },
  });
  return {
    blob: ctx.doc.output("blob"),
    nomFichier: nomFichier(prefixe, d),
  };
}

// ── Rubriques ───────────────────────────────────────────────────────────

function rubriqueMemoire(ctx: Ctx, d: DonneesDossier) {
  const e = d.entreprise;
  const ag = agregerPersonnel(d);

  sousTitre(ctx, "1. Présentation de l'entreprise");
  if (!e) {
    absent(ctx, "les informations de l'entreprise ne sont pas disponibles.");
  } else {
    cleValeur(ctx, [
      ["Raison sociale", valeur(e.nom)],
      ["SIRET", valeur(e.siret)],
      ["Code APE / NAF", valeur(e.ape)],
      ["N° TVA intracommunautaire", valeur(e.tva)],
      ["Capital social", valeur(e.capital)],
      ["Adresse du siège", valeur(e.adresse)],
      ["Agrément / autorisation CNAPS", valeur(e.agrementCnaps)],
      ["Email", valeur(e.email)],
      ["Téléphone", valeur(e.telephone)],
    ]);
  }

  sousTitre(ctx, "2. Organisation");
  cleValeur(ctx, [
    [
      "Dirigeant",
      e?.dirigeant
        ? `${e.dirigeant}${e.fonctionDirigeant ? ` (${e.fonctionDirigeant})` : ""}`
        : NON_RENSEIGNE,
    ],
    [
      "Effectif actif",
      ag.effectif > 0 ? `${ag.effectif} salarié(s)` : NON_RENSEIGNE,
    ],
    [
      "Clients suivis",
      d.clients.length > 0 ? String(d.clients.length) : NON_RENSEIGNE,
    ],
    [
      "Sites sous surveillance",
      d.sites.length > 0
        ? `${d.sites.filter((s) => s.actif).length} actif(s) sur ${d.sites.length}, ${d.sites.reduce((n, s) => n + s.postes, 0)} poste(s)`
        : NON_RENSEIGNE,
    ],
  ]);
  if (ag.parFonction.length > 0) {
    paragraphe(ctx, "Répartition de l'effectif par fonction :");
    tableau(
      ctx,
      ["Fonction", "Effectif"],
      ag.parFonction.map(([f, n]) => [f, String(n)]),
      { 1: 30 },
    );
  }

  sousTitre(ctx, "3. Moyens humains");
  if (ag.effectif === 0) {
    absent(ctx, "aucun salarié actif enregistré.");
  } else {
    paragraphe(
      ctx,
      `L'entreprise dispose de ${ag.effectif} salarié(s) actif(s) : ${ag.parContrat
        .map(([c, n]) => `${n} en ${c}`)
        .join(", ")}.`,
    );
    if (ag.parQualification.length > 0 || ag.cartes.total > 0) {
      const lignes: string[][] = ag.parQualification.map((q) => [
        q.libelle,
        String(q.total),
        String(q.valides),
      ]);
      if (ag.cartes.total > 0) {
        lignes.unshift([
          "Carte professionnelle CNAPS",
          String(ag.cartes.total),
          String(ag.cartes.valides),
        ]);
      }
      tableau(ctx, ["Qualification", "Salariés", "Dont valides"], lignes, {
        1: 28,
        2: 32,
      });
    } else {
      absent(ctx, "aucune qualification enregistrée.");
    }
  }

  sousTitre(ctx, "4. Moyens matériels");
  if (d.equipements.length > 0) {
    tableau(
      ctx,
      ["Équipement", "Quantité attribuée"],
      d.equipements.map((q) => [q.libelle, String(q.quantite)]),
      { 1: 40 },
    );
  } else {
    absent(ctx, "aucun équipement attribué n'est enregistré.");
  }
  paragraphe(
    ctx,
    "Pilotage et traçabilité : planning des vacations, géolocalisation des agents, main courante numérique et registre du personnel tenus dans la plateforme Safyr.",
  );

  sousTitre(ctx, "5. Engagements qualité");
  const attestations = d.pieces.filter((p) =>
    p.libelle.startsWith("Attestation"),
  );
  const engagements = [
    e?.agrementCnaps
      ? `Exercice de l'activité de sécurité privée sous l'autorisation CNAPS n° ${e.agrementCnaps}.`
      : `Autorisation CNAPS : ${NON_RENSEIGNE}.`,
    ag.cartes.total > 0
      ? `Agents titulaires d'une carte professionnelle : ${ag.cartes.total} (dont ${ag.cartes.valides} en cours de validité).`
      : `Cartes professionnelles des agents : ${NON_RENSEIGNE}.`,
    ...attestations.map((p) =>
      p.statut === "Fournie"
        ? `${p.libelle} : à jour${p.echeance ? ` (échéance ${dateFr(p.echeance)})` : ""}.`
        : `${p.libelle} : ${p.statut.toLowerCase()}.`,
    ),
    `Certifications qualité (ISO 9001, MASE, etc.) : ${NON_RENSEIGNE}.`,
  ];
  for (const ligne of engagements) paragraphe(ctx, `- ${ligne}`);
}

function rubriqueFinancier(ctx: Ctx, d: DonneesDossier) {
  sousTitre(ctx, "1. Chiffres clés");
  cleValeur(ctx, [
    ["Capital social", valeur(d.entreprise?.capital)],
    [
      "Effectif actif",
      d.salaries.length > 0 ? String(d.salaries.length) : NON_RENSEIGNE,
    ],
  ]);

  sousTitre(ctx, "2. Chiffre d'affaires facturé");
  if (d.ca.length === 0) {
    absent(
      ctx,
      "aucune facture émise dans l'application. Le chiffre d'affaires certifié figure dans les bilans.",
    );
  } else {
    tableau(
      ctx,
      ["Exercice", "Factures émises", "CA facturé HT", "Dont encaissé HT"],
      d.ca.map((c) => [
        c.annee,
        String(c.factures),
        euros(c.totalHT),
        euros(c.encaisseHT),
      ]),
    );
    paragraphe(
      ctx,
      "Montants issus des factures émises dans l'application (hors brouillons et factures annulées) ; ils ne remplacent pas le bilan certifié.",
      true,
    );
  }

  sousTitre(ctx, "3. Pièces financières et administratives attendues");
  tableau(
    ctx,
    ["Pièce", "Statut", "Échéance", "Précision"],
    d.pieces.map((p) => [
      p.libelle,
      p.statut,
      p.echeance ? dateFr(p.echeance) : "-",
      p.detail ?? "",
    ]),
    { 1: 26, 2: 26 },
  );

  sousTitre(ctx, "4. Déclarations enregistrées");
  tableau(
    ctx,
    ["Déclaration", "Enregistrées", "Dernière période"],
    [
      [
        "TVA",
        String(d.declarations.tva),
        d.declarations.tvaDerniere ?? NON_RENSEIGNE,
      ],
      [
        "CFE",
        String(d.declarations.cfe),
        d.declarations.cfeDerniere ?? NON_RENSEIGNE,
      ],
    ],
    { 1: 30 },
  );
}

const LIBELLES_STATUT_CONTRAT = {
  active: "En cours",
  expired: "Échu",
  terminated: "Résilié",
} as const;

function rubriqueReferences(ctx: Ctx, d: DonneesDossier) {
  const enCours = d.contrats.filter(
    (c) => c.statut === "active" && !estPasse(c.fin),
  );

  sousTitre(ctx, "1. Clients");
  if (d.clients.length === 0) {
    absent(ctx, "aucun client enregistré.");
  } else {
    tableau(
      ctx,
      ["Client", "Secteur", "Ville", "Contrats en cours"],
      d.clients.map((c) => [
        c.nom,
        c.secteur || "-",
        c.ville || "-",
        String(enCours.filter((x) => x.client === c.nom).length),
      ]),
      { 3: 34 },
    );
  }

  sousTitre(ctx, `2. Contrats (${enCours.length} en cours)`);
  if (d.contrats.length === 0) {
    absent(ctx, "aucun contrat client enregistré.");
  } else {
    const tries = [...d.contrats].sort(
      (a, b) =>
        Number(b.statut === "active") - Number(a.statut === "active") ||
        (b.debut ?? "").localeCompare(a.debut ?? ""),
    );
    tableau(
      ctx,
      ["Client", "Objet", "Début", "Fin", "Statut"],
      tries.map((c) => [
        c.client,
        c.objet,
        c.debut ? dateFr(c.debut) : "-",
        c.fin ? dateFr(c.fin) : "-",
        c.statut === "active" && estPasse(c.fin)
          ? LIBELLES_STATUT_CONTRAT.expired
          : LIBELLES_STATUT_CONTRAT[c.statut],
      ]),
      { 2: 24, 3: 24, 4: 22 },
    );
  }

  sousTitre(ctx, "3. Sites sous surveillance");
  if (d.sites.length === 0) {
    absent(ctx, "aucun site enregistré.");
  } else {
    tableau(
      ctx,
      ["Site", "Client", "Ville", "Postes", "Statut"],
      d.sites.map((s) => [
        s.nom,
        s.client || "-",
        s.ville || "-",
        String(s.postes),
        s.actif ? "Actif" : "Inactif",
      ]),
      { 3: 20, 4: 22 },
    );
  }
}

function rubriquePersonnel(ctx: Ctx, d: DonneesDossier) {
  const ag = agregerPersonnel(d);

  sousTitre(ctx, "1. Synthèse des effectifs");
  if (ag.effectif === 0) {
    absent(ctx, "aucun salarié actif enregistré.");
    return;
  }
  const avecPieces = d.salaries.filter((s) => s.pieces);
  indicateurs(ctx, [
    ["Salariés actifs", String(ag.effectif)],
    [
      "Cartes professionnelles valides",
      `${ag.cartes.valides} / ${ag.effectif}`,
    ],
    [
      "Salariés qualifiés (SSIAP, SST, H0B0...)",
      String(d.salaries.filter((s) => s.qualifications.length > 0).length),
    ],
    [
      "Dossiers administratifs complets",
      avecPieces.length > 0
        ? `${avecPieces.filter((s) => s.pieces!.manquantes.length === 0).length} / ${avecPieces.length}`
        : "n.c.",
    ],
  ]);
  cleValeur(ctx, [
    [
      "Par type de contrat",
      ag.parContrat.map(([c, n]) => `${c} : ${n}`).join(" - "),
    ],
    ["Par emploi", ag.parFonction.map(([f, n]) => `${f} : ${n}`).join(" - ")],
  ]);

  if (ag.parQualification.length > 0) {
    tableau(
      ctx,
      ["Qualification", "Salariés", "Valides", "Expirées"],
      ag.parQualification.map((q) => [
        q.libelle,
        String(q.total),
        String(q.valides),
        q.expirees > 0 ? statut(String(q.expirees), ROUGE) : "0",
      ]),
      { 1: 26, 2: 26, 3: 26 },
    );
  }

  sousTitre(ctx, "2. Liste nominative du personnel");
  tableau(
    ctx,
    [
      "Salarié",
      "Emploi",
      "Contrat",
      "Embauche",
      "Qualifications",
      "Carte pro. CNAPS",
      "Pièces obligatoires",
    ],
    d.salaries.map((s) => [
      s.nom,
      s.fonction || NON_RENSEIGNE,
      s.contrat || NON_RENSEIGNE,
      s.embauche ? dateFr(s.embauche) : NON_RENSEIGNE,
      s.qualifications.length > 0
        ? {
            content: s.qualifications
              .map(
                (q) =>
                  `${q.libelle}${q.expiration ? ` (${q.valide ? "jusqu'au" : "expirée le"} ${dateFr(q.expiration)})` : ""}`,
              )
              .join("\n"),
            styles: s.qualifications.some((q) => !q.valide)
              ? { textColor: AMBRE }
              : {},
          }
        : "Aucune",
      !s.cartePro
        ? statut("Aucune", GRIS)
        : s.cartePro.etat === "inconnue"
          ? statut("Validité non renseignée", AMBRE)
          : s.cartePro.etat === "valide"
            ? statut(`Valide jusqu'au ${dateFr(s.cartePro.expiration)}`, VERT)
            : statut(`Expirée le ${dateFr(s.cartePro.expiration)}`, ROUGE),
      !s.pieces
        ? statut("Non disponible", GRIS)
        : s.pieces.manquantes.length === 0
          ? statut(
              s.pieces.requises > 0
                ? `Complet (${s.pieces.presentes} / ${s.pieces.requises})`
                : "Aucune exigée",
              VERT,
            )
          : statut(
              `${s.pieces.presentes} / ${s.pieces.requises}\nManque : ${s.pieces.manquantes.slice(0, 2).join(", ")}${s.pieces.manquantes.length > 2 ? ` (+${s.pieces.manquantes.length - 2})` : ""}`,
              AMBRE,
            ),
    ]),
    { 0: 28, 1: 24, 2: 14, 3: 18, 4: 42, 5: 24, 6: 32 },
    { petit: true },
  );
  paragraphe(
    ctx,
    "Seuls les salariés actifs figurent dans ce dossier. Aucune donnée personnelle sensible (adresse, date de naissance, numéro de sécurité sociale, aptitude médicale) n'y est reprise.",
    true,
  );
}

function rubriqueEntreprise(ctx: Ctx, d: DonneesDossier) {
  const e = d.entreprise;

  sousTitre(ctx, "1. Identité de l'entreprise");
  if (!e) {
    absent(ctx, "les informations de l'entreprise ne sont pas disponibles.");
  } else {
    cleValeur(ctx, [
      ["Raison sociale", valeur(e.nom)],
      ["Forme juridique", valeur(e.formeJuridique)],
      ["Capital social", valeur(e.capital)],
      ["SIRET", valeur(e.siret)],
      ["SIREN", valeur(e.siren)],
      ["Code APE / NAF", valeur(e.ape)],
      ["N° TVA intracommunautaire", valeur(e.tva)],
      ["N° d'autorisation CNAPS", valeur(e.agrementCnaps)],
    ]);

    sousTitre(ctx, "2. Coordonnées");
    cleValeur(ctx, [
      ["Adresse du siège", valeur(e.adresse)],
      ["E-mail", valeur(e.email)],
      ["Téléphone", valeur(e.telephone)],
      ...(e.telephone2
        ? ([["Téléphone (2e numéro)", e.telephone2]] as [string, string][])
        : []),
    ]);

    sousTitre(ctx, "3. Représentant légal");
    cleValeur(ctx, [
      ["Nom et prénom", valeur(e.dirigeant)],
      ["Fonction", valeur(e.fonctionDirigeant)],
      [
        "Date de nomination",
        e.nominationDirigeant ? dateFr(e.nominationDirigeant) : NON_RENSEIGNE,
      ],
    ]);
  }

  sousTitre(ctx, "4. Documents administratifs déposés");
  const pieces = d.piecesEntreprise;
  if (pieces.length === 0) {
    absent(ctx, "aucune pièce administrative n'est paramétrée.");
    return;
  }
  const deposees = pieces.filter((p) => p.depot !== undefined).length;
  const requisManquants = pieces.filter(
    (p) =>
      p.obligatoire && p.statut !== "Valide" && p.statut !== "Expire bientôt",
  ).length;
  indicateurs(ctx, [
    ["Pièces déposées", `${deposees} / ${pieces.length}`],
    ["Pièces obligatoires à fournir", String(requisManquants)],
    [
      "Pièces expirées ou à renouveler",
      String(
        pieces.filter(
          (p) => p.statut === "Expiré" || p.statut === "Expire bientôt",
        ).length,
      ),
    ],
  ]);
  const couleurs = {
    Valide: VERT,
    "Expire bientôt": AMBRE,
    Expiré: ROUGE,
    Manquant: ROUGE,
    "Non déposé": GRIS,
  } as const;
  tableau(
    ctx,
    ["Document", "Exigence", "Statut", "Déposé le", "Valable jusqu'au"],
    pieces.map((p) => [
      p.libelle,
      p.obligatoire ? "Obligatoire" : "Facultatif",
      statut(p.statut, couleurs[p.statut]),
      p.depot ? dateFr(p.depot) : "-",
      !p.aEcheance ? "Sans échéance" : p.echeance ? dateFr(p.echeance) : "-",
    ]),
    { 1: 26, 2: 28, 3: 24, 4: 30 },
  );
}

const RENDU: Record<Rubrique, (ctx: Ctx, d: DonneesDossier) => void> = {
  entreprise: rubriqueEntreprise,
  memoire: rubriqueMemoire,
  financier: rubriqueFinancier,
  references: rubriqueReferences,
  personnel: rubriquePersonnel,
};

/** Titre du PDF de chaque rubrique (le plus proche du libellé du client). */
const TITRES_PDF: Record<Rubrique, string> = {
  entreprise: "Dossier de mon entreprise",
  memoire: "Mémoire technique",
  financier: "Documents financiers",
  references: "Références professionnelles",
  personnel: "Dossier du personnel",
};

function nomFichier(prefixe: string, d: DonneesDossier): string {
  const societe = (d.entreprise?.nom || "entreprise")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${prefixe}-${societe || "entreprise"}-${new Date().toISOString().slice(0, 10)}.pdf`;
}

// ── Points d'entrée ────────────────────────────────────────────────────

/** PDF prêt à être téléchargé ou déposé dans le stockage. */
export interface PdfGenere {
  blob: Blob;
  nomFichier: string;
}

/** Génère le PDF d'une rubrique (sans le télécharger). */
export async function construireRubriquePdf(
  rubrique: Rubrique,
  d: DonneesDossier,
  branding?: PdfBranding,
): Promise<PdfGenere> {
  const ctx = await creerContexte(TITRES_PDF[rubrique], branding);
  RENDU[rubrique](ctx, d);
  return finaliser(ctx, rubrique, d);
}

/** Génère un PDF unique réunissant toutes les rubriques. */
export async function construireDossierCompletPdf(
  d: DonneesDossier,
  branding?: PdfBranding,
): Promise<PdfGenere> {
  const ctx = await creerContexte("Dossier de candidature", branding);
  sousTitre(ctx, "Sommaire");
  RUBRIQUES.forEach((r, i) => {
    const manques = manquesRubrique(d, r.id);
    paragraphe(
      ctx,
      `${i + 1}. ${r.titre} - ${manques.length === 0 ? "complet" : `à compléter : ${manques.join(", ")}`}`,
    );
  });
  for (const r of RUBRIQUES) {
    nouvellePage(ctx);
    titreRubrique(ctx, r.titre);
    RENDU[r.id](ctx, d);
  }
  return finaliser(ctx, "dossier-candidature", d);
}

/** Transforme le PDF en fichier, pour le rattacher à un document. */
export function pdfEnFichier(pdf: PdfGenere): File {
  return new File([pdf.blob], pdf.nomFichier, { type: "application/pdf" });
}

/**
 * Télécharge le PDF : Blob + lien <a download> cliqué directement, sans
 * window.open (Safari bloque toute ouverture qui suit un await).
 */
export function telechargerPdf(pdf: PdfGenere): void {
  const url = URL.createObjectURL(pdf.blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = pdf.nomFichier;
  lien.rel = "noopener";
  lien.style.display = "none";
  // Rattaché au document : Safari ignore le clic d'un lien orphelin.
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  // Libération différée : Safari lit le Blob après le retour du clic.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
