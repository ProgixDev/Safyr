import type { StoredFile } from "@/lib/document-files";

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
  "Cahier des charges (CCTP)",
  "Règlement de consultation",
  "Mémoire technique",
  "Documents financiers",
  "Références professionnelles",
  "Dossier du personnel",
  "Pièces administratives (DC1, DC2, DUME)",
  "Offre de prix",
  "Courrier / notification",
  "Autre",
] as const;

/** Type par défaut d'un fichier téléversé depuis la ligne d'un appel d'offre. */
export const TYPE_DOCUMENT_PAR_DEFAUT = TYPES_DOCUMENT_AO[0];

export function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Message d'erreur lisible pour une alerte. */
export function messageErreur(e: unknown): string {
  return e instanceof Error ? e.message : "erreur inconnue";
}
