import { apiFetch } from "../client";
import { attachDocument, type AttachedDocument } from "../contracts";
import type { UploadResponse } from "../storage";

export interface Dirigeant {
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  nationalite?: string;
  adresse?: string;
  email?: string;
  telephone?: string;
  fonction?: string;
  dateNomination?: string;
  numeroSecuriteSociale?: string;
}

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  siret?: string | null;
  numTVA?: string | null;
  sector?: string | null;
  dirigeant?: Dirigeant | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientPayload {
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  siret?: string;
  numTVA?: string;
  sector?: string;
  dirigeant?: Dirigeant;
}

export type UpdateClientPayload = Partial<CreateClientPayload>;

export interface Subcontractor {
  id: string;
  organizationId: string;
  name: string;
  siret?: string | null;
  address?: string | null;
  email?: string | null;
  telephone?: string | null;
  capitalSocial?: string | null;
  numeroAutorisation?: string | null;
  dateDebut?: string | null;
  statut: "actif" | "inactif" | "suspendu";
  prochainRenouvellement?: string | null;
  dirigeant?: Dirigeant | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubcontractorPayload {
  name: string;
  siret?: string;
  address?: string;
  email?: string;
  telephone?: string;
  capitalSocial?: string;
  numeroAutorisation?: string;
  dateDebut?: string;
  statut?: "actif" | "inactif" | "suspendu";
  prochainRenouvellement?: string;
  dirigeant?: Dirigeant;
}

export type UpdateSubcontractorPayload = Partial<CreateSubcontractorPayload>;

// --- Clients ---

export async function listClients(): Promise<Client[]> {
  return apiFetch<Client[]>("/organization/clients");
}

export async function getClient(clientId: string): Promise<Client> {
  return apiFetch<Client>(`/organization/clients/${clientId}`);
}

export async function createClient(data: CreateClientPayload): Promise<Client> {
  return apiFetch<Client>("/organization/clients", {
    method: "POST",
    body: data,
  });
}

export async function updateClient(
  clientId: string,
  data: UpdateClientPayload,
): Promise<Client> {
  return apiFetch<Client>(`/organization/clients/${clientId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteClient(clientId: string): Promise<Client> {
  return apiFetch<Client>(`/organization/clients/${clientId}`, {
    method: "DELETE",
  });
}

// --- Subcontractors ---

export async function listSubcontractors(): Promise<Subcontractor[]> {
  return apiFetch<Subcontractor[]>("/organization/subcontractors");
}

export async function getSubcontractor(id: string): Promise<Subcontractor> {
  return apiFetch<Subcontractor>(`/organization/subcontractors/${id}`);
}

export async function createSubcontractor(
  data: CreateSubcontractorPayload,
): Promise<Subcontractor> {
  return apiFetch<Subcontractor>("/organization/subcontractors", {
    method: "POST",
    body: data,
  });
}

export async function updateSubcontractor(
  id: string,
  data: UpdateSubcontractorPayload,
): Promise<Subcontractor> {
  return apiFetch<Subcontractor>(`/organization/subcontractors/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteSubcontractor(id: string): Promise<Subcontractor> {
  return apiFetch<Subcontractor>(`/organization/subcontractors/${id}`, {
    method: "DELETE",
  });
}

// --- Lecture automatique d'un ticket de caisse / d'une facture ---

export interface ExtractedReceiptFields {
  /** Date ISO YYYY-MM-DD. */
  date: string | null;
  montantHT: number | null;
  tva: number | null;
  montantTTC: number | null;
  description: string | null;
  /** Vrai si HT/TVA ont été déduits du TTC avec un taux plausible. */
  estime?: boolean;
  /** Taux de TVA (en %) utilisé pour l'estimation. */
  tauxEstime?: number | null;
}

export function extractReceiptFile(
  file: File,
): Promise<ExtractedReceiptFields> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<ExtractedReceiptFields>("/organization/receipts/extract", {
    method: "POST",
    body: form,
  });
}

/**
 * Rattache à une ligne un fichier déjà téléversé (uploadFile), sans le renvoyer.
 * Sur un serveur qui ne connaît pas encore cette route, retombe sur l'envoi
 * classique du fichier (un second transfert, mais rien n'est perdu).
 */
export async function attachUploadedFile(
  file: File,
  uploaded: UploadResponse,
  target: { scope: "client"; scopeId: string; slot: string },
): Promise<AttachedDocument> {
  try {
    return await apiFetch<AttachedDocument>("/organization/attachments/link", {
      method: "POST",
      body: {
        ...target,
        storageKey: uploaded.key,
        name: file.name,
        mimeType: uploaded.mimeType || file.type || "application/octet-stream",
        size: uploaded.size ?? file.size,
      },
    });
  } catch (error) {
    if ((error as { status?: number }).status === 404) {
      return attachDocument(file, target);
    }
    throw error;
  }
}
