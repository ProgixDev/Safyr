import { apiFetch } from "../client";
import type {
  Organization,
  UpdateOrganizationPayload,
  CreateRepresentativePayload,
  ComplianceItem,
  Document,
} from "./types";

export * from "./types";

export async function uploadOrganizationDocument(
  file: File,
  requirementId: string,
  opts?: { expiryDate?: string },
): Promise<Document> {
  const formData = new FormData();
  formData.append("requirementId", requirementId);
  if (opts?.expiryDate) formData.append("expiryDate", opts.expiryDate);
  formData.append("file", file);
  return apiFetch<Document>("/organization/documents", {
    method: "POST",
    body: formData,
  });
}

export async function deleteOrganizationDocument(
  requirementId: string,
): Promise<{ id: string; requirementId: string }> {
  return apiFetch<{ id: string; requirementId: string }>(
    `/organization/documents/${requirementId}`,
    { method: "DELETE" },
  );
}

export async function getActiveOrganization(): Promise<Organization> {
  return apiFetch<Organization>("/organization");
}

export async function updateActiveOrganization(
  data: UpdateOrganizationPayload,
): Promise<Organization> {
  return apiFetch<Organization>("/organization", {
    method: "PATCH",
    body: data,
  });
}

export async function createRepresentative(
  data: CreateRepresentativePayload,
): Promise<Organization> {
  return apiFetch<Organization>("/organization/representative", {
    method: "POST",
    body: data,
  });
}

export async function getOrganizationCompliance(): Promise<ComplianceItem[]> {
  return apiFetch<ComplianceItem[]>("/organization/compliance");
}
