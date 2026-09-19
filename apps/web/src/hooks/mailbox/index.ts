"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  connectMailbox,
  disconnectMailbox,
  getMailboxStatus,
  type ConnectMailboxPayload,
} from "@safyr/api-client";

export const mailboxKeys = {
  status: ["mailbox", "status"] as const,
};

/** État de la boîte mail de la société (aucun secret n'y figure). */
export function useMailboxStatus() {
  return useQuery({
    queryKey: mailboxKeys.status,
    queryFn: getMailboxStatus,
    staleTime: 60_000,
  });
}

export function useConnectMailbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConnectMailboxPayload) => connectMailbox(payload),
    onSuccess: (status) => qc.setQueryData(mailboxKeys.status, status),
    // Le mot de passe ne doit pas rester dans le cache des mutations.
    gcTime: 0,
  });
}

export function useDisconnectMailbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: disconnectMailbox,
    onSuccess: (status) => qc.setQueryData(mailboxKeys.status, status),
  });
}
