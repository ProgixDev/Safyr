"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listFiscalRecords,
  createFiscalRecord,
  updateFiscalRecord,
  deleteFiscalRecord,
  type FiscalRecordType,
  type CreateFiscalRecordPayload,
  type UpdateFiscalRecordPayload,
} from "@safyr/api-client";

export const fiscalKeys = {
  all: ["fiscal-records"] as const,
  list: (type?: FiscalRecordType, period?: string) =>
    [...fiscalKeys.all, type ?? "tous", period ?? "toutes"] as const,
};

/** Lignes d'un registre administratif, enregistrées en base. */
export function useFiscalRecords(type?: FiscalRecordType, period?: string) {
  return useQuery({
    queryKey: fiscalKeys.list(type, period),
    queryFn: () => listFiscalRecords({ type, period }),
  });
}

function useInvalider() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: fiscalKeys.all });
}

export function useCreateFiscalRecord() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: (payload: CreateFiscalRecordPayload) =>
      createFiscalRecord(payload),
    onSuccess: invalider,
  });
}

export function useUpdateFiscalRecord() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: ({
      recordId,
      payload,
    }: {
      recordId: string;
      payload: UpdateFiscalRecordPayload;
    }) => updateFiscalRecord(recordId, payload),
    onSuccess: invalider,
  });
}

export function useDeleteFiscalRecord() {
  const invalider = useInvalider();
  return useMutation({
    mutationFn: (recordId: string) => deleteFiscalRecord(recordId),
    onSuccess: invalider,
  });
}

export * from "./use-registre";
