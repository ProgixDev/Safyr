"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listContracts,
  createContract,
  updateContract,
  deleteContract,
  listAttachments,
  attachDocument,
  deleteAttachment,
  type CreateContractPayload,
  type UpdateContractPayload,
  listShiftTemplates,
  createShiftTemplate,
  deleteShiftTemplate,
  type AttachedScope,
} from "@safyr/api-client";

export const contractKeys = {
  all: ["contracts"] as const,
  list: (memberId: string) => [...contractKeys.all, "list", memberId] as const,
};

export const attachmentKeys = {
  all: ["attachments"] as const,
  list: (scope: string, scopeId?: string) =>
    [...attachmentKeys.all, scope, scopeId ?? "*"] as const,
};

// ── Contrats de travail ───────────────────────────────────────────────

export function useContracts(memberId: string) {
  return useQuery({
    queryKey: contractKeys.list(memberId),
    queryFn: () => listContracts(memberId),
    enabled: !!memberId,
  });
}

export function useCreateContract(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContractPayload) =>
      createContract(memberId, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: contractKeys.list(memberId) }),
  });
}

export function useUpdateContract(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      contractId,
      payload,
    }: {
      contractId: string;
      payload: UpdateContractPayload;
    }) => updateContract(memberId, contractId, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: contractKeys.list(memberId) }),
  });
}

export function useDeleteContract(memberId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contractId: string) => deleteContract(memberId, contractId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: contractKeys.list(memberId) }),
  });
}

// ── Documents rattachés ───────────────────────────────────────────────

export function useAttachments(scope: AttachedScope, scopeId?: string) {
  return useQuery({
    queryKey: attachmentKeys.list(scope, scopeId),
    queryFn: () => listAttachments(scope, scopeId),
  });
}

export function useAttachDocument(scope: AttachedScope, scopeId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { file: File; scopeId: string; slot: string }) =>
      attachDocument(vars.file, {
        scope,
        scopeId: vars.scopeId,
        slot: vars.slot,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: attachmentKeys.list(scope, scopeId) }),
  });
}

export function useDeleteAttachment(scope: AttachedScope, scopeId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => deleteAttachment(documentId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: attachmentKeys.list(scope, scopeId) }),
  });
}

// ── Modèles de vacation ───────────────────────────────────────────────

export const shiftTemplateKeys = { all: ["shift-templates"] as const };

export function useShiftTemplates() {
  return useQuery({
    queryKey: shiftTemplateKeys.all,
    queryFn: listShiftTemplates,
  });
}

export function useCreateShiftTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createShiftTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftTemplateKeys.all }),
  });
}

export function useDeleteShiftTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteShiftTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: shiftTemplateKeys.all }),
  });
}
