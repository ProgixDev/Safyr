import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  listSubcontractors,
  getSubcontractor,
  createSubcontractor,
  updateSubcontractor,
  deleteSubcontractor,
  type UpdateClientPayload,
  type UpdateSubcontractorPayload,
} from "@safyr/api-client";
import { clientKeys, subcontractorKeys } from "./keys";

// --- Clients ---

export function useClients() {
  return useQuery({
    queryKey: clientKeys.list(),
    queryFn: listClients,
  });
}

export function useClient(clientId: string) {
  return useQuery({
    queryKey: clientKeys.detail(clientId),
    queryFn: () => getClient(clientId),
    enabled: !!clientId,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.list() });
    },
  });
}

export function useUpdateClient(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateClientPayload) => updateClient(clientId, data),
    onSuccess: (data) => {
      qc.setQueryData(clientKeys.detail(clientId), data);
      qc.invalidateQueries({ queryKey: clientKeys.list() });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.list() });
    },
  });
}

// --- Subcontractors ---

export function useSubcontractors() {
  return useQuery({
    queryKey: subcontractorKeys.list(),
    queryFn: listSubcontractors,
  });
}

export function useSubcontractor(id: string) {
  return useQuery({
    queryKey: subcontractorKeys.detail(id),
    queryFn: () => getSubcontractor(id),
    enabled: !!id,
  });
}

export function useCreateSubcontractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSubcontractor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subcontractorKeys.list() });
    },
  });
}

export function useUpdateSubcontractor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSubcontractorPayload) =>
      updateSubcontractor(id, data),
    onSuccess: (data) => {
      qc.setQueryData(subcontractorKeys.detail(id), data);
      qc.invalidateQueries({ queryKey: subcontractorKeys.list() });
    },
  });
}

export function useDeleteSubcontractor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSubcontractor,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subcontractorKeys.list() });
    },
  });
}
