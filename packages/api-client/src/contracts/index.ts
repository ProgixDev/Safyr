import { apiFetch } from "../client";

export interface Contract {
  id: string;
  organizationId: string;
  memberId: string;
  type: "CDI" | "CDD" | "INTERIM" | "APPRENTICESHIP" | "INTERNSHIP";
  position: string;
  startDate: string;
  endDate: string | null;
  workingHours: number | null;
  grossSalary: number | null;
  trialPeriodEndDate: string | null;
  status: "draft" | "active" | "ended" | "terminated";
  signedByEmployee: boolean;
  signedByEmployer: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContractPayload {
  type: Contract["type"];
  position: string;
  startDate: string;
  endDate?: string;
  workingHours?: number;
  grossSalary?: number;
  trialPeriodEndDate?: string;
  status?: Contract["status"];
  signedByEmployee?: boolean;
  signedByEmployer?: boolean;
  notes?: string;
}

export type UpdateContractPayload = Partial<CreateContractPayload>;

const base = (memberId: string) =>
  `/organization/employees/${memberId}/contracts`;

export function listContracts(memberId: string): Promise<Contract[]> {
  return apiFetch<Contract[]>(base(memberId));
}

export function createContract(
  memberId: string,
  payload: CreateContractPayload,
): Promise<Contract> {
  return apiFetch<Contract>(base(memberId), {
    method: "POST",
    body: payload,
  });
}

export function updateContract(
  memberId: string,
  contractId: string,
  payload: UpdateContractPayload,
): Promise<Contract> {
  return apiFetch<Contract>(`${base(memberId)}/${contractId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteContract(
  memberId: string,
  contractId: string,
): Promise<Contract> {
  return apiFetch<Contract>(`${base(memberId)}/${contractId}`, {
    method: "DELETE",
  });
}

// ── Documents rattachés (sous-traitants, fiscal, AKTO/OPCO) ───────────────

export type AttachedScope = "subcontractor" | "tax" | "akto";

export interface AttachedDocument {
  id: string;
  name: string;
  storageKey: string;
  mimeType: string;
  size: number;
  scope: AttachedScope;
  scopeId: string;
  slot: string;
  createdAt: string;
}

export function listAttachments(
  scope: AttachedScope,
  scopeId?: string,
): Promise<AttachedDocument[]> {
  const qs = new URLSearchParams({ scope });
  if (scopeId) qs.set("scopeId", scopeId);
  return apiFetch<AttachedDocument[]>(
    `/organization/attachments?${qs.toString()}`,
  );
}

export function attachDocument(
  file: File,
  target: { scope: AttachedScope; scopeId: string; slot: string },
): Promise<AttachedDocument> {
  const form = new FormData();
  form.append("scope", target.scope);
  form.append("scopeId", target.scopeId);
  form.append("slot", target.slot);
  form.append("file", file);
  return apiFetch<AttachedDocument>("/organization/attachments", {
    method: "POST",
    body: form,
  });
}

export function deleteAttachment(documentId: string): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(
    `/organization/attachments/${documentId}`,
    { method: "DELETE" },
  );
}

// ── Modèles de vacation (planning) ────────────────────────────────────

export interface ShiftTemplate {
  id: string;
  organizationId: string;
  siteId: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type ShiftTemplatePayload = {
  siteId: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration?: number;
  color?: string;
};

export function listShiftTemplates(): Promise<ShiftTemplate[]> {
  return apiFetch<ShiftTemplate[]>("/shift-templates");
}

export function createShiftTemplate(
  payload: ShiftTemplatePayload,
): Promise<ShiftTemplate> {
  return apiFetch<ShiftTemplate>("/shift-templates", {
    method: "POST",
    body: payload,
  });
}

export function deleteShiftTemplate(id: string): Promise<ShiftTemplate> {
  return apiFetch<ShiftTemplate>(`/shift-templates/${id}`, {
    method: "DELETE",
  });
}
