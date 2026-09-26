/**
 * Registre de formation : modèle de ligne, types de formation, statut de
 * validité et fusion des sources (sans doublon).
 *
 * Une formation réalisée peut être connue de quatre façons :
 *  - saisie directement dans ce registre (registre « formation_realisee ») ;
 *  - diplôme / certification du dossier du salarié (SSIAP, SST, H0B0, CQP…),
 *    y compris les anciennes lignes des écrans Habilitations ;
 *  - formation du plan de formation passée à « Terminée » ;
 *  - dossier AKTO / OPCO validé dont la formation est terminée.
 * Le registre les réunit et retire les doublons : une même formation (même
 * salarié, même famille, dates proches) n'apparaît qu'une fois, la source la
 * plus riche l'emportant (saisie > dossier salarié > plan > AKTO). Deux lignes
 * d'une même source ne sont jamais fusionnées.
 */
import type { StoredFile } from "@/lib/document-files";

export type TypeFormation =
  | "SSIAP"
  | "SST"
  | "RECYCLAGE"
  | "H0B0"
  | "CQP"
  | "INCENDIE"
  | "REGLEMENTAIRE"
  | "PROFESSIONNELLE"
  | "AUTRE";

export const TYPES_FORMATION: { valeur: TypeFormation; libelle: string }[] = [
  { valeur: "SSIAP", libelle: "SSIAP" },
  { valeur: "SST", libelle: "SST" },
  { valeur: "RECYCLAGE", libelle: "Recyclage / MAC" },
  { valeur: "H0B0", libelle: "H0B0" },
  { valeur: "CQP", libelle: "CQP / APS" },
  { valeur: "INCENDIE", libelle: "Incendie" },
  { valeur: "REGLEMENTAIRE", libelle: "Réglementaire" },
  { valeur: "PROFESSIONNELLE", libelle: "Professionnelle" },
  { valeur: "AUTRE", libelle: "Autre" },
];

export const LIBELLE_TYPE: Record<TypeFormation, string> = Object.fromEntries(
  TYPES_FORMATION.map((t) => [t.valeur, t.libelle]),
) as Record<TypeFormation, string>;

/** Anciennes valeurs enregistrées par l'ancien écran, et libellés libres. */
export function typeDepuisTexte(brut: string | undefined): TypeFormation {
  const t = (brut ?? "").trim();
  if (!t) return "AUTRE";
  if ((TYPES_FORMATION as { valeur: string }[]).some((x) => x.valeur === t))
    return t as TypeFormation;
  if (/mac|recycl|maintien|actualisation/i.test(t)) return "RECYCLAGE";
  if (/ssiap/i.test(t)) return "SSIAP";
  if (/h0.?b0|habilitation [ée]lec/i.test(t)) return "H0B0";
  if (/\bsst\b|secouri/i.test(t)) return "SST";
  if (/cqp|\baps\b/i.test(t)) return "CQP";
  if (/incend|fire/i.test(t)) return "INCENDIE";
  if (/r[ée]glement|regulatory/i.test(t)) return "REGLEMENTAIRE";
  if (/profession/i.test(t)) return "PROFESSIONNELLE";
  return "AUTRE";
}

export type StatutFormation = "valide" | "bientot" | "expire" | "sans_echeance";

export const LIBELLE_STATUT: Record<StatutFormation, string> = {
  valide: "Valide",
  bientot: "Expire bientôt",
  expire: "Expiré",
  sans_echeance: "Sans échéance",
};

/** Seuil de l'alerte « expire bientôt » : le même que les Habilitations. */
export const MOIS_ALERTE = 3;

const deuxChiffres = (n: number) => String(n).padStart(2, "0");
const jourLocal = (d: Date) =>
  `${d.getFullYear()}-${deuxChiffres(d.getMonth() + 1)}-${deuxChiffres(d.getDate())}`;

/** Statut d'après la date de validité (AAAA-MM-JJ) ; comparaison de jours. */
export function statutDe(
  validite?: string,
  aujourdhui = new Date(),
): StatutFormation {
  if (!validite) return "sans_echeance";
  const jour = validite.slice(0, 10);
  if (jour < jourLocal(aujourdhui)) return "expire";
  const limite = new Date(
    aujourdhui.getFullYear(),
    aujourdhui.getMonth() + MOIS_ALERTE,
    aujourdhui.getDate(),
  );
  return jour <= jourLocal(limite) ? "bientot" : "valide";
}

export type OrigineFormation = "saisie" | "dossier" | "plan" | "akto";

export const LIBELLE_ORIGINE: Record<OrigineFormation, string> = {
  saisie: "Saisie au registre",
  dossier: "Dossier salarié",
  plan: "Plan de formation",
  akto: "Dossier AKTO / OPCO",
};

/** Une ligne du registre, quelle que soit sa source. */
export interface LigneFormation {
  /** Unique dans le registre (préfixée par l'origine). */
  cle: string;
  origine: OrigineFormation;
  /** Identifiant de l'enregistrement d'origine. */
  id: string;
  /** Identifiant du salarié quand il est connu (sinon son nom). */
  salarieId: string;
  salarie: string;
  intitule: string;
  organisme: string;
  /** Dates au format AAAA-MM-JJ ; vide si inconnue. */
  debut: string;
  fin: string;
  dureeH: number | null;
  type: TypeFormation;
  certificat: string;
  validite: string;
  statut: StatutFormation;
  document: StoredFile | null;
  notes: string;
}

/** Date quelconque (Date, ISO complet ou court) → AAAA-MM-JJ, sinon "". */
export function jourIso(valeur: unknown): string {
  if (!valeur) return "";
  if (typeof valeur === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valeur))
    return valeur;
  const d = valeur instanceof Date ? valeur : new Date(String(valeur));
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function dateFr(jour: string): string {
  if (!jour) return "";
  const [a, m, j] = jour.slice(0, 10).split("-");
  return `${j}/${m}/${a}`;
}

export const anneeDe = (l: LigneFormation): string =>
  (l.fin || l.debut || l.validite).slice(0, 4);

/** Écart en jours entre deux dates AAAA-MM-JJ (Infinity si l'une manque). */
function ecartJours(a: string, b: string): number {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  return Math.abs(Date.parse(a) - Date.parse(b)) / 86_400_000;
}

/** « SSIAP » + niveau (1, 2, 3) : un SSIAP 1 et un SSIAP 2 sont deux formations. */
function famille(l: LigneFormation): string {
  if (l.type !== "SSIAP") return l.type;
  const niveau = /ssiap\s*([123])/i.exec(l.intitule)?.[1] ?? "";
  return `SSIAP${niveau}`;
}

function memeFamille(a: LigneFormation, b: LigneFormation): boolean {
  if (a.type !== b.type) return false;
  if (a.type !== "SSIAP") return true;
  const fa = famille(a);
  const fb = famille(b);
  // Niveau inconnu d'un côté : on ne peut pas départager, on considère pareil.
  return fa === fb || fa === "SSIAP" || fb === "SSIAP";
}

/** Fenêtre (jours) dans laquelle deux lignes sont la même formation. */
const FENETRE_DOUBLON_JOURS = 60;

function estDoublon(a: LigneFormation, b: LigneFormation): boolean {
  const memePersonne =
    a.salarieId === b.salarieId ||
    a.salarie.trim().toLowerCase() === b.salarie.trim().toLowerCase();
  if (!memePersonne || !memeFamille(a, b)) return false;
  // Même numéro de certificat : c'est forcément la même.
  if (
    a.certificat &&
    b.certificat &&
    a.certificat.trim().toLowerCase() === b.certificat.trim().toLowerCase()
  )
    return true;
  const da = a.fin || a.debut;
  const db = b.fin || b.debut;
  return ecartJours(da, db) <= FENETRE_DOUBLON_JOURS;
}

const PRIORITE: Record<OrigineFormation, number> = {
  saisie: 0,
  dossier: 1,
  plan: 2,
  akto: 3,
};

/**
 * Réunit les sources et retire les doublons. Les lignes sont parcourues de la
 * plus riche à la moins riche ; une ligne est écartée dès qu'une autre déjà
 * retenue décrit la même formation. Tri final : plus récente d'abord.
 */
export function fusionner(lignes: LigneFormation[]): LigneFormation[] {
  const triees = [...lignes].sort(
    (a, b) => PRIORITE[a.origine] - PRIORITE[b.origine],
  );
  const retenues: LigneFormation[] = [];
  for (const ligne of triees) {
    // Deux lignes de la même source ne sont jamais fusionnées : ce sont deux
    // saisies (ou deux certificats) distincts.
    if (
      !retenues.some((r) => r.origine !== ligne.origine && estDoublon(r, ligne))
    )
      retenues.push(ligne);
  }
  return retenues.sort((a, b) =>
    (b.fin || b.debut).localeCompare(a.fin || a.debut),
  );
}
