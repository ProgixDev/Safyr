import { apiFetch } from "../client";

export type FiscalRecordType =
  | "tva"
  | "cfe"
  | "prelevement"
  | "courrier"
  | "akto"
  | "organisme"
  | "divers"
  | "courrier_organisme"
  | "equipement"
  | "avantage";

/** Ligne d'un registre administratif (TVA, CFE, PAS, courrier, AKTO). */
export interface FiscalRecord {
  id: string;
  organizationId: string;
  type: FiscalRecordType;
  period: string;
  label: string;
  status: string;
  amount: number | null;
  dueDate: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFiscalRecordPayload {
  type: FiscalRecordType;
  period: string;
  label: string;
  status?: string;
  amount?: number;
  dueDate?: string;
  meta?: Record<string, unknown>;
}

export type UpdateFiscalRecordPayload = Partial<CreateFiscalRecordPayload>;

export function listFiscalRecords(params: {
  type?: FiscalRecordType;
  period?: string;
}): Promise<FiscalRecord[]> {
  const qs = new URLSearchParams();
  if (params.type) qs.set("type", params.type);
  if (params.period) qs.set("period", params.period);
  const suffixe = qs.toString();
  return apiFetch<FiscalRecord[]>(
    `/organization/fiscal-records${suffixe ? `?${suffixe}` : ""}`,
  );
}

export const createFiscalRecord = (data: CreateFiscalRecordPayload) =>
  apiFetch<FiscalRecord>("/organization/fiscal-records", {
    method: "POST",
    body: data,
  });

export const updateFiscalRecord = (
  recordId: string,
  data: UpdateFiscalRecordPayload,
) =>
  apiFetch<FiscalRecord>(`/organization/fiscal-records/${recordId}`, {
    method: "PATCH",
    body: data,
  });

export const deleteFiscalRecord = (recordId: string) =>
  apiFetch<FiscalRecord>(`/organization/fiscal-records/${recordId}`, {
    method: "DELETE",
  });
