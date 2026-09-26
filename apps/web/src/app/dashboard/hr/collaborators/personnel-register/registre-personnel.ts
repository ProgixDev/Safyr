import type { Employee as EmployeeApi } from "@safyr/api-client";
import type { Contract, PersonnelRegisterEntry } from "@/lib/types";
import type { FicheEmploi } from "@/lib/fiche-emploi";
import type { OffboardingProcess } from "@/data/hr-offboarding";
import { estDateRenseignee, formatDateFr } from "@/lib/employee-adapter";
import {
  applyPdfFooters,
  brandedPdfDefaults,
  drawPdfHeader,
  loadPdfBranding,
  pdfTableMargins,
} from "@/lib/pdf-branding";
import { exporterExcel, type ColonneExcel } from "@/lib/xlsx";

/**
 * Registre unique du personnel : une ligne par salarié, construite à partir
 * des données réelles (dossier salarié, fiche emploi, sorties, contrats).
 * Rien n'est codé en dur : une information absente reste vide (« — »).
 */

export type StatutCadre = "Cadre" | "Non cadre";

/** Champs modifiables depuis l'écran, en plus de ceux de l'entrée d'origine. */
export interface ExtrasRegistre {
  statutCadre?: StatutCadre;
  /** Date d'expiration de la carte professionnelle (CAR). */
  carteProExpiration?: Date;
  /** Heures du contrat à temps partiel (ex. 24 ou 108). */
  heures?: number;
}

export type EntreeRegistre = PersonnelRegisterEntry & ExtrasRegistre;

/** Ligne enregistrée en base : seules les valeurs modifiées à la main. */
export type EnregistrementRegistre = Partial<EntreeRegistre> & {
  id: string;
  employeeId: string;
  /** Vrai pour une ligne écrite par une modification faite sur cet écran. */
  edite?: boolean;
};

export interface LigneRegistre {
  id: string;
  entree: EntreeRegistre;
  nom: string;
  prenom: string;
  /** Vrai si le salarié est sorti (date de sortie passée ou statut terminé). */
  sorti: boolean;
  /** Ex. « CDI Partiel 108h » ; « — » si le type de contrat est inconnu. */
  typeContrat: string;
}

// ─── Utilitaires ────────────────────────────────────────────────────────

const ABSENTE = new Date(0);

/** Date lue depuis une valeur API/enregistrée (Date ou chaîne), sinon null. */
function enDate(v: unknown): Date | null {
  if (v instanceof Date) return estDateRenseignee(v) ? v : null;
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    return estDateRenseignee(d) ? d : null;
  }
  return null;
}

const jourIso = (d: Date | null | undefined): string =>
  estDateRenseignee(d) ? d.toISOString().slice(0, 10) : "";

const dateMs = (d: Date | undefined) =>
  d instanceof Date && !Number.isNaN(d.getTime()) ? d.getTime() : 0;

const texte = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** Adresse complète : « 229 rue Saint-Honoré, 75001 Paris ». */
export function adresseComplete(a: {
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
}): string {
  const ville = [a.postalCode, a.city]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(" ");
  return [(a.street ?? "").trim(), ville].filter(Boolean).join(", ");
}

const CATEGORIE_CADRES = /^III\b|ing[ée]nieurs?\s+et\s+cadres?/i;

/**
 * Cadre / Non cadre d'après la catégorie de la grille des salaires (fiche
 * emploi) : « III. Ingénieurs et cadres » ⇒ Cadre, toute autre catégorie
 * (agents d'exploitation, agents de maîtrise) ⇒ Non cadre. Catégorie vide ⇒ null.
 */
export function statutCadreDe(
  categorie: string | undefined,
): StatutCadre | null {
  const c = (categorie ?? "").trim();
  if (!c) return null;
  return CATEGORIE_CADRES.test(c) ? "Cadre" : "Non cadre";
}

const LIBELLES_CONTRAT: Record<PersonnelRegisterEntry["contractType"], string> =
  {
    CDI: "CDI",
    CDD: "CDD",
    apprentice: "Apprentissage",
    interim: "Intérim",
    other: "Autre",
  };

export const OPTIONS_TYPE_CONTRAT = [
  "CDI",
  "CDD",
  "interim",
  "apprentice",
  "other",
] as const;

export const libelleContrat = (t: PersonnelRegisterEntry["contractType"]) =>
  LIBELLES_CONTRAT[t] ?? t;

function contratDepuisApi(
  v: string | null | undefined,
): PersonnelRegisterEntry["contractType"] | null {
  switch ((v ?? "").toUpperCase()) {
    case "CDI":
      return "CDI";
    case "CDD":
      return "CDD";
    case "INTERIM":
      return "interim";
    case "APPRENTICESHIP":
      return "apprentice";
    case "INTERNSHIP":
      return "other";
    default:
      return null;
  }
}

const formaterHeures = (h: number) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(h)}h`;

/** « CDI Complet », « CDD Partiel 6h »… (le temps ne concerne que CDI/CDD). */
export function typeContratLibelle(
  type: PersonnelRegisterEntry["contractType"] | null,
  temps: PersonnelRegisterEntry["contractWorkTime"] | undefined,
  heures: number | undefined,
): string {
  if (!type) return "—";
  const base = libelleContrat(type);
  if (type !== "CDI" && type !== "CDD") return base;
  if (temps === "complet") return `${base} Complet`;
  if (temps === "partiel") {
    return heures && heures > 0
      ? `${base} Partiel ${formaterHeures(heures)}`
      : `${base} Partiel`;
  }
  return base;
}

// ─── Construction des lignes ────────────────────────────────────────────

export interface SourcesRegistre {
  employes: EmployeeApi[];
  ficheDe: (employeeId: string) => FicheEmploi | null;
  sorties: OffboardingProcess[];
  contrats: Contract[];
  enregistrees: EnregistrementRegistre[];
  /** Date du jour (injectable pour les tests). */
  aujourdhui?: Date;
}

/** Carte pro : numéro du salarié, sinon celle de sa certification CNAPS. */
function carteProDe(e: EmployeeApi): { numero: string; expiration?: Date } {
  const cnaps = (e.certifications ?? [])
    .filter((c) => c.type === "CNAPS")
    .sort(
      (a, b) =>
        dateMs(enDate(b.expiryDate) ?? ABSENTE) -
        dateMs(enDate(a.expiryDate) ?? ABSENTE),
    );
  const numero = texte(e.cartePro);
  // On associe l'échéance à la certification du même numéro, sinon à la plus récente.
  const cert =
    cnaps.find((c) => numero && texte(c.number) === numero) ?? cnaps[0];
  return {
    numero: numero || texte(cert?.number),
    expiration: enDate(cert?.expiryDate) ?? undefined,
  };
}

/** Dernière sortie non annulée du salarié (registre `sortie_salarie`). */
function sortieDe(
  employeeId: string,
  sorties: OffboardingProcess[],
): { date: Date | null; terminee: boolean } {
  let date: Date | null = null;
  let terminee = false;
  for (const s of sorties) {
    if (s.employeeId !== employeeId || s.status === "Annulé") continue;
    const d = enDate(s.contractEndDate);
    if (s.status === "Terminé") terminee = true;
    if (d && (!date || d.getTime() > date.getTime())) date = d;
  }
  return { date, terminee };
}

/** Heures du temps partiel : saisie « Autres » de la fiche, sinon contrat. */
function heuresDe(
  fiche: FicheEmploi | null,
  contrat: Contract | undefined,
): number | undefined {
  if (fiche?.base === "autres" && (fiche.heuresManuelles ?? 0) > 0) {
    return fiche.heuresManuelles ?? undefined;
  }
  if (contrat?.contractType === "part-time" && contrat.workingHours > 0) {
    return contrat.workingHours;
  }
  return undefined;
}

/** Contrat le plus récent d'un salarié (registre `contrat_rh`). */
function contratRecent(
  employeeId: string,
  contrats: Contract[],
): Contract | undefined {
  return contrats
    .filter((c) => c.employeeId === employeeId)
    .sort(
      (a, b) =>
        dateMs(enDate(b.startDate) ?? ABSENTE) -
        dateMs(enDate(a.startDate) ?? ABSENTE),
    )[0];
}

/** Ligne construite uniquement depuis les données réelles (sans modification manuelle). */
export function entreeDeBase(
  e: EmployeeApi,
  rang: number,
  src: Pick<SourcesRegistre, "ficheDe" | "sorties" | "contrats">,
): EntreeRegistre {
  const fiche = src.ficheDe(e.id);
  const contrat = contratRecent(e.id, src.contrats);
  const sortie = sortieDe(e.id, src.sorties);
  const carte = carteProDe(e);
  const temps: PersonnelRegisterEntry["contractWorkTime"] =
    e.workSchedule === "part-time"
      ? "partiel"
      : e.workSchedule === "full-time"
        ? "complet"
        : contrat?.contractType === "part-time"
          ? "partiel"
          : contrat?.contractType === "full-time"
            ? "complet"
            : undefined;
  const cree = enDate(e.createdAt) ?? ABSENTE;
  const sortieDate = sortie.date ?? enDate(e.terminatedAt) ?? undefined;

  return {
    id: e.id,
    employeeId: e.id,
    registrationNumber:
      texte(e.employeeNumber) || String(rang + 1).padStart(4, "0"),
    entryDate: enDate(e.hireDate) ?? ABSENTE,
    exitDate: sortieDate,
    contractType: contratDepuisApi(e.contractType) ?? "other",
    contractWorkTime: temps,
    position: texte(e.position),
    qualification: texte(e.position),
    nationality: texte(e.nationality),
    sex: e.gender === "female" ? "F" : e.gender === "male" ? "M" : undefined,
    birthDate: enDate(e.birthDate) ?? ABSENTE,
    birthPlace: texte(e.birthPlace),
    address: e.addressRecord ? adresseComplete(e.addressRecord) : "",
    phone: texte(e.phone),
    email: texte(e.email) || texte(e.user?.email),
    socialSecurityNumber: texte(e.socialSecurityNumber),
    cnapsProfessionalCardNumber: carte.numero,
    statutCadre: statutCadreDe(fiche?.categorie) ?? undefined,
    carteProExpiration: carte.expiration,
    heures: temps === "partiel" ? heuresDe(fiche, contrat) : undefined,
    createdAt: cree,
    updatedAt: cree,
  };
}

/**
 * Une ligne enregistrée ne compte que si elle vient d'une modification faite
 * ici. Les copies automatiques créées par l'ancienne version de l'écran (valeurs
 * par défaut, dates du jour) ne doivent pas écraser les données du dossier.
 */
function estModifiee(o: EnregistrementRegistre): boolean {
  if (o.edite) return true;
  return dateMs(o.updatedAt) - dateMs(o.createdAt) > 2000;
}

const CHAMPS_TEXTE = [
  "registrationNumber",
  "position",
  "qualification",
  "nationality",
  "birthPlace",
  "address",
  "phone",
  "email",
  "socialSecurityNumber",
  "cnapsProfessionalCardNumber",
  "ssiapDiplomaNumber",
  "notes",
] as const;

const CHAMPS_DATE = [
  "entryDate",
  "exitDate",
  "birthDate",
  "carteProExpiration",
] as const;

/** Les valeurs saisies sur l'écran complètent (ou corrigent) celles du dossier. */
function appliquerModifications(
  base: EntreeRegistre,
  o: EnregistrementRegistre | undefined,
): EntreeRegistre {
  if (!o || !estModifiee(o)) return base;
  const r: EntreeRegistre = { ...base };
  const cible = r as unknown as Record<string, unknown>;
  for (const c of CHAMPS_TEXTE) {
    const v = texte(o[c]);
    if (v) cible[c] = v;
  }
  for (const c of CHAMPS_DATE) {
    const d = enDate(o[c]);
    if (d) cible[c] = d;
  }
  if (o.contractType) r.contractType = o.contractType;
  if (o.contractWorkTime) r.contractWorkTime = o.contractWorkTime;
  if (o.sex) r.sex = o.sex;
  if (o.statutCadre) r.statutCadre = o.statutCadre;
  if (typeof o.heures === "number" && o.heures > 0) r.heures = o.heures;
  return r;
}

/** Enregistrement le plus récent de chaque salarié (les doublons sont écartés). */
function dernierParSalarie(
  liste: EnregistrementRegistre[],
): Map<string, EnregistrementRegistre> {
  const m = new Map<string, EnregistrementRegistre>();
  for (const e of liste) {
    const courant = m.get(e.employeeId);
    if (!courant || dateMs(e.updatedAt) >= dateMs(courant.updatedAt)) {
      m.set(e.employeeId, e);
    }
  }
  return m;
}

function versLigne(
  entree: EntreeRegistre,
  e: EmployeeApi,
  auj: Date,
  contratConnu: boolean,
): LigneRegistre {
  const sortiePassee =
    !!entree.exitDate && entree.exitDate.getTime() <= auj.getTime();
  return {
    id: entree.id,
    entree,
    nom: texte(e.lastName),
    prenom: texte(e.firstName),
    sorti: sortiePassee || e.status === "terminated",
    typeContrat: typeContratLibelle(
      contratConnu ? entree.contractType : null,
      entree.contractWorkTime,
      entree.heures,
    ),
  };
}

/**
 * Lignes du registre, dans l'ordre des embauches (date la plus ancienne
 * d'abord ; sans date d'embauche en dernier), un salarié = une ligne.
 */
export function construireLignes(src: SourcesRegistre): LigneRegistre[] {
  const auj = src.aujourdhui ?? new Date();
  const parSalarie = dernierParSalarie(src.enregistrees);
  const vus = new Set<string>();
  const uniques = src.employes.filter((e) => {
    if (vus.has(e.id)) return false;
    vus.add(e.id);
    return true;
  });
  const lignes = uniques.map((e, i) => {
    const modif = parSalarie.get(e.id);
    const entree = appliquerModifications(entreeDeBase(e, i, src), modif);
    // Type de contrat inconnu tant que ni le dossier ni l'écran ne le donnent.
    const contratConnu =
      contratDepuisApi(e.contractType) !== null ||
      (!!modif && estModifiee(modif) && !!modif.contractType);
    return versLigne(entree, e, auj, contratConnu);
  });
  return lignes.sort((a, b) => {
    const ha = estDateRenseignee(a.entree.entryDate)
      ? a.entree.entryDate.getTime()
      : Infinity;
    const hb = estDateRenseignee(b.entree.entryDate)
      ? b.entree.entryDate.getTime()
      : Infinity;
    if (ha !== hb) return ha < hb ? -1 : 1;
    return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr");
  });
}

/**
 * Enregistrement à écrire après une modification : seulement les valeurs qui
 * diffèrent des données du dossier, pour que le dossier reste la référence.
 */
export function differences(
  saisie: EntreeRegistre,
  base: EntreeRegistre,
): Partial<EntreeRegistre> {
  const diff: Record<string, unknown> = {};
  const s = saisie as unknown as Record<string, unknown>;
  const b = base as unknown as Record<string, unknown>;
  const garder = (cle: string, valeur: unknown, ref: unknown) => {
    if (valeur !== ref) diff[cle] = valeur;
  };
  for (const c of CHAMPS_TEXTE) {
    const v = texte(s[c]);
    if (v) garder(c, v, texte(b[c]));
  }
  for (const c of CHAMPS_DATE) {
    const d = enDate(s[c]);
    if (d && jourIso(d) !== jourIso(enDate(b[c]))) diff[c] = d;
  }
  if (saisie.contractType !== base.contractType)
    diff.contractType = saisie.contractType;
  if (saisie.contractWorkTime !== base.contractWorkTime)
    diff.contractWorkTime = saisie.contractWorkTime;
  if (saisie.sex && saisie.sex !== base.sex) diff.sex = saisie.sex;
  if (saisie.statutCadre && saisie.statutCadre !== base.statutCadre)
    diff.statutCadre = saisie.statutCadre;
  if (saisie.heures && saisie.heures !== base.heures)
    diff.heures = saisie.heures;
  return diff as Partial<EntreeRegistre>;
}

// ─── Colonnes communes (écran, PDF, Excel) ──────────────────────────────

const jourLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Vrai si la carte pro a expiré (le jour d'expiration lui-même reste valide). */
export function carteExpiree(d: Date | undefined, auj = new Date()): boolean {
  return estDateRenseignee(d) && jourIso(d) < jourLocal(auj);
}

const ou = (v: string | undefined) => (v && v.trim() ? v.trim() : "—");

/** Naissance : « 04/02/1979 » (date) et « BOGHNI » (lieu). */
function naissance(l: LigneRegistre): { date: string; lieu: string } {
  return {
    date: formatDateFr(l.entree.birthDate),
    lieu: l.entree.birthPlace.trim().toUpperCase(),
  };
}

export const ENTETES_REGISTRE = [
  "Noms",
  "Prénoms",
  "Date de naissance",
  "NSS",
  "Date d'embauche",
  "Type de contrat",
  "Emploi",
  "Statut",
  "Date de sortie",
  "Adresse",
  "Carte Professionnelle",
  "Date expiration CAR",
] as const;

/** Valeurs d'une ligne pour l'export, dans l'ordre de ENTETES_REGISTRE. */
function valeursExport(l: LigneRegistre, sepNaissance: string): string[] {
  const e = l.entree;
  const n = naissance(l);
  return [
    ou(l.nom.toUpperCase()),
    ou(l.prenom),
    [n.date, n.lieu].filter((s) => s && s !== "—").join(sepNaissance) || "—",
    ou(e.socialSecurityNumber),
    formatDateFr(e.entryDate),
    l.typeContrat,
    ou(e.position),
    e.statutCadre ?? "—",
    formatDateFr(e.exitDate),
    ou(e.address),
    ou(e.cnapsProfessionalCardNumber),
    formatDateFr(e.carteProExpiration),
  ];
}

/** Retour à la ligne dans un long numéro pour qu'il tienne dans sa colonne PDF. */
function coupeNumero(v: string): string {
  if (v.length <= 20) return v;
  const milieu = v.length / 2;
  let coupe = -1;
  for (let i = 0; i < v.length; i++) {
    if (
      v[i] === "-" &&
      (coupe < 0 || Math.abs(i - milieu) < Math.abs(coupe - milieu))
    )
      coupe = i;
  }
  return coupe < 0 ? v : `${v.slice(0, coupe + 1)}\n${v.slice(coupe + 1)}`;
}

const nomFichier = (ext: string) =>
  `registre-unique-du-personnel-${new Date().toISOString().slice(0, 10)}.${ext}`;

const TITRE = "REGISTRE UNIQUE DU PERSONNEL";

const sousTitre = (n: number) =>
  `Édité le ${new Date().toLocaleDateString("fr-FR")} - ${n} salarié${n > 1 ? "s" : ""}`;

// ─── Export PDF ─────────────────────────────────────────────────────────

const TURQUOISE_LIGNE: [number, number, number] = [222, 244, 248];
const TURQUOISE_ZEBRE: [number, number, number] = [238, 250, 252];
const ROSE_LIGNE: [number, number, number] = [252, 228, 234];
const ROSE_ENTETE: [number, number, number] = [190, 65, 100];
const ROUGE: [number, number, number] = [200, 30, 40];

/** Colonne « Date de sortie » (index dans ENTETES_REGISTRE). */
const COL_SORTIE = 8;
const COL_EXPIRATION = 11;

export async function exporterRegistrePdf(
  lignes: LigneRegistre[],
): Promise<void> {
  const [{ default: jsPDF }, autoTable, branding] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable").then((m) => m.default),
    loadPdfBranding(),
  ]);
  const doc = new jsPDF({ orientation: "landscape", format: "a4" });
  const header = { title: TITRE, subtitle: sousTitre(lignes.length) };
  const y = drawPdfHeader(doc, branding, header);

  const body = lignes.map((l) => {
    const v = valeursExport(l, "\n");
    v[10] = coupeNumero(v[10]);
    return v;
  });
  const expirees = lignes.map((l) => carteExpiree(l.entree.carteProExpiration));

  autoTable(doc, {
    ...brandedPdfDefaults,
    startY: y,
    margin: pdfTableMargins(branding, { header }),
    head: [[...ENTETES_REGISTRE]],
    body,
    // Une ligne ne se coupe jamais entre deux pages.
    rowPageBreak: "avoid",
    styles: {
      ...brandedPdfDefaults.styles,
      fontSize: 6.8,
      cellPadding: { top: 1.6, bottom: 1.6, left: 1.3, right: 1.3 },
      lineColor: [150, 200, 210],
      valign: "middle",
    },
    headStyles: {
      ...brandedPdfDefaults.headStyles,
      fontSize: 7,
      cellPadding: 1.8,
    },
    bodyStyles: { fillColor: TURQUOISE_LIGNE },
    alternateRowStyles: { fillColor: TURQUOISE_ZEBRE },
    // Largeurs en mm (A4 paysage : 269 mm utiles) ; l'adresse prend le reste.
    columnStyles: {
      0: { cellWidth: 27, fontStyle: "bold" },
      1: { cellWidth: 21 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 27 },
      4: { cellWidth: 19, halign: "center" },
      5: { cellWidth: 21, halign: "center" },
      6: { cellWidth: 26 },
      7: { cellWidth: 14, halign: "center" },
      8: { cellWidth: 17, halign: "center" },
      10: { cellWidth: 28 },
      11: { cellWidth: 17, halign: "center" },
    },
    didParseCell: (d) => {
      if (d.column.index === COL_SORTIE) {
        if (d.section === "head") d.cell.styles.fillColor = ROSE_ENTETE;
        else d.cell.styles.fillColor = ROSE_LIGNE;
      }
      if (
        d.section === "body" &&
        d.column.index === COL_EXPIRATION &&
        expirees[d.row.index]
      ) {
        d.cell.styles.textColor = ROUGE;
        d.cell.styles.fontStyle = "bold";
      }
      if (
        d.section === "body" &&
        d.column.index === 7 &&
        d.cell.raw === "Cadre"
      ) {
        d.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Pied de marque (société + L612-14) et en-tête sur les pages suivantes.
  applyPdfFooters(doc, branding, {
    header: { ...header, skipFirstPage: true },
  });
  doc.save(nomFichier("pdf"));
}

// ─── Export Excel ───────────────────────────────────────────────────────

export async function exporterRegistreExcel(
  lignes: LigneRegistre[],
): Promise<void> {
  const largeurs = [18, 16, 20, 20, 14, 18, 22, 11, 14, 42, 32, 14];
  const centre = new Set([2, 4, 5, 7, 8, 11]);
  const colonnes: ColonneExcel[] = ENTETES_REGISTRE.map((header, i) => ({
    header,
    key: `c${i}`,
    width: largeurs[i],
    align: centre.has(i) ? "center" : "left",
    format: i === 4 || i === 8 || i === 11 ? "date" : "text",
  }));
  const rows = lignes.map((l) => {
    const e = l.entree;
    const v = valeursExport(l, " ");
    // Les dates restent de vraies dates Excel (triables) quand elles existent.
    const date = (d: Date | undefined, texteAffiche: string) =>
      estDateRenseignee(d) ? jourIso(d) : texteAffiche;
    v[4] = date(e.entryDate, v[4]);
    v[8] = date(e.exitDate, v[8]);
    v[11] = date(e.carteProExpiration, v[11]);
    return Object.fromEntries(v.map((val, i) => [`c${i}`, val]));
  });
  await exporterExcel({
    fileName: nomFichier("xlsx"),
    sheetName: "Registre du personnel",
    title: TITRE,
    subtitle: sousTitre(lignes.length),
    columns: colonnes,
    rows,
  });
}
