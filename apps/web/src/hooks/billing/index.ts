"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  generateInvoiceFromPlanning,
  type CreateInvoicePayload,
  type UpdateInvoicePayload,
  type GenerateInvoicePayload,
} from "@safyr/api-client";

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: () => [...invoiceKeys.all, "list"] as const,
};

export function useInvoices() {
  return useQuery({ queryKey: invoiceKeys.list(), queryFn: listInvoices });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: invoiceKeys.all });
}

export function useCreateInvoice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => createInvoice(payload),
    onSuccess: invalidate,
  });
}

/** Facture construite depuis les vacations planifiées du client. */
export function useGenerateInvoice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: GenerateInvoicePayload) =>
      generateInvoiceFromPlanning(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateInvoice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      invoiceId,
      payload,
    }: {
      invoiceId: string;
      payload: UpdateInvoicePayload;
    }) => updateInvoice(invoiceId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteInvoice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (invoiceId: string) => deleteInvoice(invoiceId),
    onSuccess: invalidate,
  });
}
