import { apiFetch } from "../client";
import type {
  Employee,
  EmployeeStats,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  Certification,
  CreateCertificationPayload,
  UpdateCertificationPayload,
} from "./types";
import type { ComplianceItem, Document } from "../organization/types";

export * from "./types";

export async function listEmployees(): Promise<Employee[]> {
  return apiFetch<Employee[]>("/organization/employees");
}

export async function getEmployeeStats(): Promise<EmployeeStats> {
  return apiFetch<EmployeeStats>("/organization/employees/stats");
}

export async function getEmployee(memberId: string): Promise<Employee> {
  return apiFetch<Employee>(`/organization/employees/${memberId}`);
}

export async function getEmployeeCompliance(
  memberId: string,
): Promise<ComplianceItem[]> {
  return apiFetch<ComplianceItem[]>(
    `/organization/employees/${memberId}/compliance`,
  );
}

export async function createEmployee(
  data: CreateEmployeePayload,
): Promise<Employee> {
  return apiFetch<Employee>("/organization/employees", {
    method: "POST",
    body: data,
  });
}

export async function updateEmployee(
  memberId: string,
  data: UpdateEmployeePayload,
): Promise<Employee> {
  return apiFetch<Employee>(`/organization/employees/${memberId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteEmployee(memberId: string): Promise<Employee> {
  return apiFetch<Employee>(`/organization/employees/${memberId}`, {
    method: "DELETE",
  });
}

export async function resendEmployeeInvite(
  memberId: string,
): Promise<{ sent: boolean; email: string }> {
  return apiFetch(`/organization/employees/${memberId}/resend-invite`, {
    method: "POST",
  });
}

/** Retire la pièce déposée pour une exigence du dossier salarié. */
export function deleteMemberDocument(
  memberId: string,
  requirementId: string,
): Promise<{ id: string; requirementId: string }> {
  return apiFetch(
    `/organization/employees/${memberId}/documents/${requirementId}`,
    { method: "DELETE" },
  );
}

export async function uploadMemberDocument(
  memberId: string,
  file: File,
  requirementId: string,
  opts?: { expiryDate?: string },
): Promise<Document> {
  const formData = new FormData();
  formData.append("requirementId", requirementId);
  if (opts?.expiryDate) formData.append("expiryDate", opts.expiryDate);
  formData.append("file", file);
  return apiFetch<Document>(`/organization/employees/${memberId}/documents`, {
    method: "POST",
    body: formData,
  });
}

export async function createCertification(
  memberId: string,
  data: CreateCertificationPayload,
): Promise<Certification> {
  return apiFetch<Certification>(
    `/organization/employees/${memberId}/certifications`,
    { method: "POST", body: data },
  );
}

export async function updateCertification(
  memberId: string,
  certId: string,
  data: UpdateCertificationPayload,
): Promise<Certification> {
  return apiFetch<Certification>(
    `/organization/employees/${memberId}/certifications/${certId}`,
    { method: "PATCH", body: data },
  );
}

export async function deleteCertification(
  memberId: string,
  certId: string,
): Promise<Certification> {
  return apiFetch<Certification>(
    `/organization/employees/${memberId}/certifications/${certId}`,
    { method: "DELETE" },
  );
}
