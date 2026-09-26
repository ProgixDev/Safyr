import type { StoredFile } from "@/lib/document-files";

/**
 * Types de sanction : liste unique, partagée par le formulaire « Nouvelle
 * sanction », les procédures disciplinaires et le registre des sanctions.
 */
export const TYPES_SANCTION = [
  "Avertissement",
  "Blâme",
  "Mise à pied disciplinaire",
  "Mise à pied conservatoire",
  "Mutation disciplinaire",
  "Rétrogradation",
  "Licenciement pour faute",
  "Licenciement pour faute grave",
  "Licenciement pour faute lourde",
] as const;

export const TYPE_SANCTION_PAR_DEFAUT = TYPES_SANCTION[0];

/** Sanction enregistrée (registre « avertissement », affiché « Sanctions »). */
export interface LigneSanction {
  id: string;
  employeeId: string;
  /** Date ISO (AAAA-MM-JJ). */
  date: string;
  /** Absent sur les lignes créées avant l'ajout du type : c'étaient des avertissements. */
  type?: string;
  reason: string;
  description: string;
  issuedBy: string;
  status: "active" | "lifted";
}

/** Ancienne saisie directe du registre (type « sanction »), conservée en lecture. */
export interface LigneSanctionManuelle {
  id: string;
  employeeId: string;
  date: string;
  type: string;
  reason: string;
  description: string;
  issuedBy: string;
}

export interface EtapeProcedure {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  /** Date ISO : l'objet Date ne survit pas à l'enregistrement en base. */
  completedAt?: string;
}

/** Nombre d'étapes qui produisent un courrier (emplacements etape_1 à etape_3). */
export const NB_ETAPES_COURRIER = 3;

export const CHAMPS_FICHIERS_PROCEDURE = [
  "document",
  "etape_1",
  "etape_2",
  "etape_3",
] as const;

export interface LigneProcedure {
  id: string;
  employeeId: string;
  startDate: string;
  steps: EtapeProcedure[];
  currentStep: number;
  status: "ongoing" | "completed" | "cancelled";
  /** Champs ajoutés pour les courriers et le registre des sanctions. */
  reason?: string;
  sanctionType?: string;
  interviewDate?: string;
  interviewTime?: string;
  issuedBy?: string;
  /** Copie de la fonction du signataire : reste lisible si le responsable est supprimé de la liste. */
  issuedByFonction?: string;
  /** Pièces jointes (reconstituées à la lecture, jamais enregistrées en meta). */
  document?: StoredFile | null;
  etape_1?: StoredFile | null;
  etape_2?: StoredFile | null;
  etape_3?: StoredFile | null;
}

/** Responsable pouvant émettre une sanction. */
export interface LigneResponsable {
  id: string;
  nom: string;
  fonction: string;
}

/** « 2026-09-19 » (ou ISO complet) → « 19/09/2026 ». Vide si non renseignée. */
export function dateFr(valeur: string | Date | undefined | null): string {
  if (!valeur) return "";
  if (typeof valeur === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valeur);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const d = valeur instanceof Date ? valeur : new Date(valeur);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR");
}

/** Horodatage numérique d'une date enregistrée, 0 si absente ou invalide. */
export function horodatage(valeur: string | undefined | null): number {
  if (!valeur) return 0;
  const t = new Date(valeur).getTime();
  return Number.isNaN(t) ? 0 : t;
}
