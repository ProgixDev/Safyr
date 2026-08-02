import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getActiveOrganization,
  updateActiveOrganization,
  createRepresentative,
  getOrganizationCompliance,
  uploadOrganizationDocument,
  deleteOrganizationDocument,
} from "@safyr/api-client";
import { organizationKeys } from "./keys";

export function useOrganization() {
  return useQuery({
    queryKey: organizationKeys.active(),
    queryFn: getActiveOrganization,
  });
}

export function useOrganizationCompliance() {
  return useQuery({
    queryKey: organizationKeys.compliance(),
    queryFn: getOrganizationCompliance,
  });
}

function useOrgWriteSuccess() {
  const qc = useQueryClient();
  return (data: Awaited<ReturnType<typeof getActiveOrganization>>) => {
    qc.setQueryData(organizationKeys.active(), data);
    qc.invalidateQueries({ queryKey: organizationKeys.compliance() });
  };
}

export function useUpdateOrganization() {
  const onSuccess = useOrgWriteSuccess();
  return useMutation({ mutationFn: updateActiveOrganization, onSuccess });
}

export function useCreateRepresentative() {
  const onSuccess = useOrgWriteSuccess();
  return useMutation({ mutationFn: createRepresentative, onSuccess });
}

export function useUploadOrganizationDocument() {
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
      uploadOrganizationDocument(
        file,
        requirementId,
        expiryDate ? { expiryDate } : undefined,
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: organizationKeys.compliance() }),
  });
}

export function useDeleteOrganizationDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requirementId: string) =>
      deleteOrganizationDocument(requirementId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: organizationKeys.compliance() }),
  });
}
