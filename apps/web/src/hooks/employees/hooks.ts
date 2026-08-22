import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listEmployees,
  getEmployee,
  getEmployeeStats,
  getEmployeeCompliance,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  resendEmployeeInvite,
  uploadMemberDocument,
  deleteMemberDocument,
  createCertification,
  updateCertification,
  deleteCertification,
  type UpdateEmployeePayload,
  type CreateCertificationPayload,
  type UpdateCertificationPayload,
} from "@safyr/api-client";
import { employeeKeys } from "./keys";

export function useEmployees() {
  return useQuery({
    queryKey: employeeKeys.list(),
    queryFn: listEmployees,
  });
}

export function useEmployee(memberId: string) {
  return useQuery({
    queryKey: employeeKeys.detail(memberId),
    queryFn: () => getEmployee(memberId),
    enabled: !!memberId,
  });
}

export function useEmployeeStats() {
  return useQuery({
    queryKey: employeeKeys.stats(),
    queryFn: getEmployeeStats,
  });
}

export function useEmployeeCompliance(memberId: string) {
  return useQuery({
    queryKey: employeeKeys.compliance(memberId),
    queryFn: () => getEmployeeCompliance(memberId),
    enabled: !!memberId,
  });
}

function useInvalidateEmployees() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: employeeKeys.list() });
    qc.invalidateQueries({ queryKey: employeeKeys.stats() });
  };
}

export function useCreateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationKey: employeeKeys.create(),
    mutationFn: createEmployee,
    onSuccess: () => invalidate(),
  });
}

export function useUpdateEmployee(memberId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (data: UpdateEmployeePayload) => updateEmployee(memberId, data),
    onSuccess: (data) => {
      qc.setQueryData(employeeKeys.detail(memberId), data);
      invalidate();
    },
  });
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationKey: employeeKeys.delete(),
    mutationFn: deleteEmployee,
    onSuccess: () => invalidate(),
  });
}

export function useResendEmployeeInvite() {
  return useMutation({ mutationFn: resendEmployeeInvite });
}

export function useUploadMemberDocument(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      requirementId,
      expiryDate,
    }: {
      file: File;
      requirementId: string;
      expiryDate?: string;
    }) =>
      uploadMemberDocument(
        memberId,
        file,
        requirementId,
        expiryDate ? { expiryDate } : undefined,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employeeKeys.detail(memberId) });
      qc.invalidateQueries({ queryKey: employeeKeys.compliance(memberId) });
    },
  });
}

export function useDeleteMemberDocument(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requirementId: string) =>
      deleteMemberDocument(memberId, requirementId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: employeeKeys.compliance(memberId) }),
  });
}

export function useCreateCertification(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCertificationPayload) =>
      createCertification(memberId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: employeeKeys.detail(memberId) }),
  });
}

export function useUpdateCertification(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      certId,
      data,
    }: {
      certId: string;
      data: UpdateCertificationPayload;
    }) => updateCertification(memberId, certId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: employeeKeys.detail(memberId) }),
  });
}

export function useDeleteCertification(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (certId: string) => deleteCertification(memberId, certId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: employeeKeys.detail(memberId) }),
  });
}
