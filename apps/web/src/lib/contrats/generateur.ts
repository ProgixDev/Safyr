/**
 * Fusion des données du salarié / de l'entreprise avec un gabarit de contrat
 * (voir `templates.ts`). Sans dépendance à jsPDF ni à React : sert à la fois à
 * l'aperçu, au PDF et au script de test.
 */
import {
  GABARITS,
  type ArticleGabarit,
  type GabaritContrat,
  type ParagrapheGabarit,
  type TypeGabarit,
} from "./templates";

const NBSP = " ";

export const MOTIFS_CDD = [
  "Remplacement d'un salarié absent",
  "Accroissement temporaire d'activité",
  "Emploi à caractère saisonnier",
  "Attente de l'entrée en service d'un salarié recruté en CDI",
] as const;

export interface DonneesContrat {
  type: "CDI" | "CDD";
  tempsPartiel: boolean;
  entreprise: {
    nom: string;
    /** Ex. « au capital de 5000€ ». */
    capital: string;
    adresse: string;
    siret: string;
    cnaps: string;
    representant: string;
    qualite: string;
  };
  salarie: {
    /** « Monsieur » ou « Madame » ; vide si non renseigné. */
    civilite: string;
    prenom: string;
    nom: string;
    /** ISO yyyy-mm-dd. */
    dateNaissance: string;
    lieuNaissance: string;
    nationalite: string;
    adresse: string;
    numSecu: string;
    cartePro: string;
  };
  emploi: {
    poste: string;
    categorie: string;
    niveau: string;
    echelon: string;
    coefficient: string;
  };
  /** ISO yyyy-mm-dd. */
  dateDebut: string;
  dateFin: string;
  motifCdd: string;
  precisionCdd: string;
  essai: { actif: boolean; fin: string };
  lieuTravail: string;
  /** Heures MENSUELLES telles que saisies (« 151,67 », « 108 »). */
  heuresMensuelles: string;
  /** Temps partiel : répartition entre jours/semaines. */
  repartition: string;
  /** Temps plein : horaires ou organisation (facultatif). */
  horaires: string;
  tauxHoraire: string;
  salaireMensuel: string;
  organismes: string;
  options: { mobilite: boolean; dedit: boolean; tenue: boolean };
  mobiliteZone: string;
  dedit: { formation: string; dureeMois: string; cout: string };
  clausesParticulieres: string;
  signature: { lieu: string; date: string };
}

// ─── Formats ────────────────────────────────────────────────────────────

/** Espaces insécables : la police standard de jsPDF ne gère pas U+202F. */
function normaliserEspaces(s: string): string {
  return s.replace(/[  ]/g, NBSP);
}

export function formaterNombre(n: number, max: number, min = 0): string {
  return normaliserEspaces(
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    }).format(n),
  );
}

/** « 12,5 » ou « 12.5 » → 12.5 ; null si vide ou illisible. */
export function lireNombre(s: string): number | null {
  const t = s.replace(/[\s  ]/g, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** « 2026-09-01 » → « 1er septembre 2026 » ; vide si la date est invalide. */
export function dateLongue(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const jour = Number(m[3]);
  const mois = Number(m[2]);
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return "";
  return `${jour === 1 ? "1er" : jour}${NBSP}${MOIS[mois - 1]}${NBSP}${m[1]}`;
}

function euros(n: number, maxDec: number): string {
  return `${formaterNombre(n, maxDec, 2)}${NBSP}€`;
}

function enUtc(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Ajoute des mois sans déborder (31 janv. + 1 mois = fin février). */
function ajouterMois(d: Date, mois: number): Date {
  const r = new Date(d.getTime());
  const jour = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + mois);
  const dernier = new Date(
    Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0),
  ).getUTCDate();
  r.setUTCDate(Math.min(jour, dernier));
  return r;
}

/** « 2 mois » si la fin d'essai tombe la veille du même quantième, sinon en jours. */
export function dureeEssai(debut: string, fin: string): string {
  const d = enUtc(debut);
  const f = enUtc(fin);
  if (!d || !f) return "";
  for (let k = 1; k <= 8; k++) {
    const veille = ajouterMois(d, k).getTime() - 86_400_000;
    if (veille === f.getTime()) return `${k}${NBSP}mois`;
  }
  const jours = Math.round((f.getTime() - d.getTime()) / 86_400_000) + 1;
  if (jours <= 0) return "";
  return `${jours}${NBSP}jour${jours > 1 ? "s" : ""} calendaire${jours > 1 ? "s" : ""}`;
}

/** « catégorie I (Agent d'exploitation), Niveau 2, Échelon 2, coefficient 120 ». */
function classification(e: DonneesContrat["emploi"]): string {
  const parts: string[] = [];
  const m = /^([IVX]+)\.\s*(.*)$/.exec(e.categorie.trim());
  if (m) parts.push(`catégorie ${m[1]}${m[2] ? ` (${m[2]})` : ""}`);
  else if (e.categorie.trim()) parts.push(`catégorie ${e.categorie.trim()}`);
  if (e.niveau.trim()) parts.push(e.niveau.trim());
  if (e.echelon.trim() && e.echelon.trim() !== "—")
    parts.push(e.echelon.trim());
  if (e.coefficient.trim()) parts.push(`coefficient ${e.coefficient.trim()}`);
  return parts.join(", ");
}

// ─── Variables et indicateurs ───────────────────────────────────────────

/** Libellé affiché quand une variable est vide (« À compléter : … »). */
export const LIBELLES_VARIABLES: Record<string, string> = {
  "entreprise.nom": "Nom de l'entreprise",
  "entreprise.capital": "Capital de l'entreprise",
  "entreprise.adresse": "Adresse de l'entreprise",
  "entreprise.siret": "SIRET de l'entreprise",
  "entreprise.cnaps": "N° d'autorisation CNAPS",
  "entreprise.representant": "Représentant de l'entreprise",
  "entreprise.qualite": "Qualité du représentant",
  "salarie.civilite": "Civilité du salarié",
  "salarie.prenom": "Prénom du salarié",
  "salarie.nom": "Nom du salarié",
  "salarie.dateNaissance": "Date de naissance",
  "salarie.lieuNaissance": "Lieu de naissance",
  "salarie.nationalite": "Nationalité",
  "salarie.adresse": "Adresse du salarié",
  "salarie.numSecu": "N° de sécurité sociale",
  "salarie.cartePro": "N° de carte professionnelle",
  "emploi.poste": "Poste",
  "emploi.classification": "Classification (catégorie, niveau, échelon)",
  "contrat.dateDebut": "Date de début",
  "contrat.dateFin": "Date de fin",
  "cdd.motif": "Motif de recours au CDD",
  "cdd.precision": "Précisions sur le motif",
  "essai.fin": "Fin de la période d'essai",
  "essai.duree": "Durée de la période d'essai",
  "travail.lieu": "Lieu de travail",
  "mobilite.zone": "Zone de mobilité",
  "duree.mensuelle": "Heures mensuelles",
  "duree.repartition": "Répartition des horaires",
  "duree.horaires": "Horaires",
  "remu.salaireMensuel": "Salaire mensuel brut",
  "remu.tauxHoraire": "Taux horaire brut",
  "protection.organismes": "Organismes de retraite et de prévoyance",
  "dedit.formation": "Formation concernée",
  "dedit.duree": "Durée d'engagement (dédit-formation)",
  "dedit.cout": "Coût de la formation",
  "clauses.particulieres": "Clauses particulières",
};

export function construireVariables(d: DonneesContrat): {
  vars: Record<string, string>;
  flags: Record<string, boolean>;
} {
  const heures = lireNombre(d.heuresMensuelles);
  const taux = lireNombre(d.tauxHoraire);
  const salaire = lireNombre(d.salaireMensuel);
  const cout = lireNombre(d.dedit.cout);
  const duree = lireNombre(d.dedit.dureeMois);
  const civ = d.salarie.civilite;
  const nationalite = d.salarie.nationalite.trim();
  const fin = d.essai.actif ? d.essai.fin : "";

  const vars: Record<string, string> = {
    "entreprise.nom": d.entreprise.nom.trim(),
    "entreprise.capital": d.entreprise.capital.trim(),
    "entreprise.adresse": d.entreprise.adresse.trim(),
    "entreprise.siret": d.entreprise.siret.trim(),
    "entreprise.cnaps": d.entreprise.cnaps.trim(),
    "entreprise.representant": d.entreprise.representant.trim(),
    "entreprise.qualite": d.entreprise.qualite.trim(),
    "salarie.civilite": civ,
    "salarie.prenom": d.salarie.prenom.trim(),
    "salarie.nom": d.salarie.nom.trim().toLocaleUpperCase("fr-FR"),
    "salarie.ne":
      civ === "Madame" ? "née" : civ === "Monsieur" ? "né" : "né(e)",
    "salarie.dateNaissance": dateLongue(d.salarie.dateNaissance),
    "salarie.lieuNaissance": d.salarie.lieuNaissance.trim(),
    "salarie.nationalite": nationalite.toLocaleLowerCase("fr-FR"),
    "salarie.adresse": d.salarie.adresse.trim(),
    "salarie.numSecu": d.salarie.numSecu.trim(),
    "salarie.cartePro": d.salarie.cartePro.trim(),
    "emploi.poste": d.emploi.poste.trim(),
    "emploi.classification": classification(d.emploi),
    "contrat.dateDebut": dateLongue(d.dateDebut),
    "contrat.dateFin": d.type === "CDD" ? dateLongue(d.dateFin) : "",
    "cdd.motif": d.motifCdd.trim(),
    "cdd.precision": d.precisionCdd.trim(),
    "essai.fin": dateLongue(fin),
    "essai.duree": fin ? dureeEssai(d.dateDebut, fin) : "",
    "travail.lieu": d.lieuTravail.trim(),
    "mobilite.zone": d.mobiliteZone.trim(),
    // Heures telles que saisies : jamais recalculées ni arrondies.
    "duree.mensuelle": heures === null ? "" : formaterNombre(heures, 4),
    "duree.repartition": d.repartition.trim(),
    "duree.horaires": d.horaires.trim(),
    "remu.salaireMensuel": salaire === null ? "" : euros(salaire, 2),
    "remu.tauxHoraire": taux === null ? "" : euros(taux, 5),
    "protection.organismes": d.organismes.trim(),
    "dedit.formation": d.dedit.formation.trim(),
    "dedit.duree":
      duree === null ? "" : `${formaterNombre(duree, 0)}${NBSP}mois`,
    "dedit.cout": cout === null ? "" : euros(cout, 2),
    "clauses.particulieres": d.clausesParticulieres.trim(),
    "signature.lieu": d.signature.lieu.trim(),
    "signature.date": dateLongue(d.signature.date),
  };

  const flags: Record<string, boolean> = {
    essai: Boolean(d.essai.actif),
    mobilite: d.options.mobilite,
    dedit: d.options.dedit,
    tenue: d.options.tenue,
    cdd: d.type === "CDD",
    partiel: d.tempsPartiel,
    horaires: !d.tempsPartiel && d.horaires.trim() !== "",
    organismes: d.organismes.trim() !== "",
    particulieres: d.clausesParticulieres.trim() !== "",
    duree35: heures !== null && Math.abs(heures - 151.67) < 0.005,
  };
  return { vars, flags };
}

/** `a`, `!a`, `a|b` : vrai si l'un des indicateurs listés est actif. */
function condition(si: string | undefined, flags: Record<string, boolean>) {
  if (!si) return true;
  return si.split("|").some((t) => {
    const nom = t.trim();
    return nom.startsWith("!") ? !flags[nom.slice(1)] : Boolean(flags[nom]);
  });
}

// ─── Rendu ──────────────────────────────────────────────────────────────

export type Segment = { t: string } | { manquant: string };

export interface ParagrapheRendu {
  segments: Segment[];
  style?: "gras" | "centre";
  puce?: boolean;
}

export interface ArticleRendu {
  id: string;
  numero: number;
  titre: string;
  paragraphes: ParagrapheRendu[];
}

export interface ContratRendu {
  gabarit: TypeGabarit;
  titre: string;
  sousTitre: string;
  intro: ParagrapheRendu[];
  articles: ArticleRendu[];
  cloture: ParagrapheRendu;
  signataires: { libelle: string; mention: string }[];
  /** Libellés (uniques, dans l'ordre de lecture) des données manquantes. */
  manquants: string[];
}

/** Pointillés laissés à remplir à la main dans le PDF. */
export const POINTILLES = "………………";

export function choisirGabarit(d: DonneesContrat): TypeGabarit {
  return `${d.type}_${d.tempsPartiel ? "TEMPS_PARTIEL" : "TEMPS_PLEIN"}`;
}

/** Espaces insécables : guillemets, ponctuation double et « n° » ne se séparent plus de leur mot. */
function typographie(s: string): string {
  return s
    .replace(/« /g, `«${NBSP}`)
    .replace(/ »/g, `${NBSP}»`)
    .replace(/ ([:;?!])/g, `${NBSP}$1`)
    .replace(/([nN]°) /g, `$1${NBSP}`);
}

const VARIABLE = /\{\{\s*([\w.]+)(\?)?\s*\}\}/g;

function fusionner(
  texte: string,
  vars: Record<string, string>,
  numeros: Map<string, number>,
  manquants: Set<string>,
): Segment[] {
  const segments: Segment[] = [];
  const ajouterTexte = (brut: string) => {
    const t = typographie(brut);
    if (!t) return;
    const dernier = segments[segments.length - 1];
    if (dernier && "t" in dernier) dernier.t += t;
    else segments.push({ t });
  };
  let curseur = 0;
  for (const m of texte.matchAll(VARIABLE)) {
    ajouterTexte(texte.slice(curseur, m.index));
    curseur = (m.index ?? 0) + m[0].length;
    const nom = m[1];
    if (nom.startsWith("art.")) {
      const n = numeros.get(nom.slice(4));
      ajouterTexte(n === undefined ? "?" : String(n));
      continue;
    }
    const valeur = vars[nom] ?? "";
    if (valeur) ajouterTexte(valeur);
    else if (m[2]) ajouterTexte(POINTILLES);
    else {
      const libelle = LIBELLES_VARIABLES[nom] ?? nom;
      manquants.add(libelle);
      segments.push({ manquant: libelle });
    }
  }
  ajouterTexte(texte.slice(curseur));
  return segments;
}

/** Une saisie multiligne (clauses particulières) devient plusieurs paragraphes. */
function decouperLignes(segments: Segment[]): Segment[][] {
  const lots: Segment[][] = [[]];
  for (const s of segments) {
    if (!("t" in s)) {
      lots[lots.length - 1].push(s);
      continue;
    }
    s.t.split(/\r?\n+/).forEach((morceau, i) => {
      if (i > 0) lots.push([]);
      if (morceau) lots[lots.length - 1].push({ t: morceau });
    });
  }
  return lots.filter((l) => l.length > 0);
}

function rendreParagraphe(
  p: string | ParagrapheGabarit,
  flags: Record<string, boolean>,
  vars: Record<string, string>,
  numeros: Map<string, number>,
  manquants: Set<string>,
): ParagrapheRendu[] {
  const gab = typeof p === "string" ? { texte: p } : p;
  if (!condition(gab.si, flags)) return [];
  const puce = gab.texte.startsWith("- ");
  const texte = puce ? gab.texte.slice(2) : gab.texte;
  return decouperLignes(fusionner(texte, vars, numeros, manquants)).map(
    (segments) => ({
      segments,
      ...("style" in gab && gab.style ? { style: gab.style } : {}),
      ...(puce ? { puce: true } : {}),
    }),
  );
}

export function rendreContrat(
  d: DonneesContrat,
  gabaritId: TypeGabarit = choisirGabarit(d),
): ContratRendu {
  const gabarit: GabaritContrat = GABARITS[gabaritId];
  const { vars, flags } = construireVariables(d);
  const manquants = new Set<string>();

  const retenus: ArticleGabarit[] = gabarit.articles.filter((a) =>
    condition(a.si, flags),
  );
  const numeros = new Map(retenus.map((a, i) => [a.id, i + 1]));

  const rendre = (p: string | ParagrapheGabarit) =>
    rendreParagraphe(p, flags, vars, numeros, manquants);

  const intro = gabarit.intro.flatMap(rendre);
  const articles: ArticleRendu[] = retenus.map((a, i) => ({
    id: a.id,
    numero: i + 1,
    titre: a.titre,
    paragraphes: a.paragraphes.flatMap(rendre),
  }));
  const cloture = rendre(gabarit.cloture)[0] ?? { segments: [] };

  return {
    gabarit: gabaritId,
    titre: gabarit.titre,
    sousTitre: gabarit.sousTitre,
    intro,
    articles,
    cloture,
    signataires: gabarit.signataires,
    manquants: [...manquants],
  };
}

/** Texte brut d'un paragraphe (les données manquantes deviennent des pointillés). */
export function texteParagraphe(p: ParagrapheRendu): string {
  return p.segments.map((s) => ("t" in s ? s.t : POINTILLES)).join("");
}

/** Nom de fichier : contrat-cdi-dupont-jean-2026-09-01.pdf */
export function nomFichierContrat(d: DonneesContrat): string {
  const slug = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/œ/g, "oe")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return (
    [
      "contrat",
      d.type.toLowerCase(),
      slug(d.salarie.nom),
      slug(d.salarie.prenom),
      d.dateDebut,
    ]
      .filter(Boolean)
      .join("-") + ".pdf"
  );
}
