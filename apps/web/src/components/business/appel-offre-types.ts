import type { StoredFile } from "@/lib/document-files";
import type { Rubrique } from "@/lib/dossier-entreprise-pdf";

/** Ligne du registre « appel_offre » (une ligne = un appel d'offre). */
export interface LigneAppelOffre {
  id: string;
  reference: string;
  title: string;
  client: string;
  source: "BOAMP" | "Marchés Publics" | "Autre";
  sourceUrl: string;
  publicationDate: string;
  deadline: string;
  status: "À créer" | "En cours" | "Soumis" | "Gagné" | "Perdu" | "Annulé";
  dossierCreated: boolean;
  estimatedValue?: number;
  createdAt?: string;
  submittedAt?: string;
}

/** Ligne du registre « appel_offre_document » (une pièce rattachée). */
export interface LigneDocumentAO {
  id: string;
  /** Nom d'affichage du document. */
  name: string;
  /** Appel d'offre lié ; vide pour un document général. */
  tenderId: string;
  type: string;
  /** Date du document, au format AAAA-MM-JJ. */
  date: string;
  notes?: string;
  /** Pièce jointe, reconstruite par le registre depuis les fichiers rattachés. */
  fichier?: StoredFile | null;
}

/** Appels d'offre : aucune pièce jointe directe, elles passent par les documents. */
export const SANS_FICHIER: readonly string[] = [];
export const CHAMPS_DOCUMENT_AO: readonly string[] = ["fichier"];

export const TYPES_DOCUMENT_AO = [
  "Dossier de réponse",
  "Mon entreprise",
  "Dossier du personnel",
  "Mémoire technique",
  "Documents financiers",
  "Références professionnelles",
  "Cahier des charges (CCTP)",
  "Règlement de consultation",
  "Pièces administratives (DC1, DC2, DUME)",
  "Offre de prix",
  "Courrier / notification",
  "Autre",
] as const;

export type TypeDocumentAO = (typeof TYPES_DOCUMENT_AO)[number];

/** Type par défaut d'un fichier téléversé depuis la ligne d'un appel d'offre. */
export const TYPE_DOCUMENT_PAR_DEFAUT: TypeDocumentAO = "Dossier de réponse";

/**
 * Types de document qui se génèrent automatiquement en PDF à partir des
 * données de l'application, et la rubrique du dossier qui les produit.
 */
export const RUBRIQUE_PAR_TYPE: Partial<Record<string, Rubrique>> = {
  "Mon entreprise": "entreprise",
  "Dossier du personnel": "personnel",
  "Mémoire technique": "memoire",
  "Documents financiers": "financier",
  "Références professionnelles": "references",
};

/** Type de document créé quand on ajoute le PDF d'une rubrique. */
export const TYPE_PAR_RUBRIQUE: Record<Rubrique, TypeDocumentAO> = {
  entreprise: "Mon entreprise",
  personnel: "Dossier du personnel",
  memoire: "Mémoire technique",
  financier: "Documents financiers",
  references: "Références professionnelles",
};

/** Types dont le PDF est produit dès qu'on les choisit dans le formulaire. */
export const TYPES_AUTO_GENERES: readonly string[] = [
  "Mon entreprise",
  "Dossier du personnel",
];

export function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Message d'erreur lisible pour une alerte. */
export function messageErreur(e: unknown): string {
  return e instanceof Error ? e.message : "erreur inconnue";
}
