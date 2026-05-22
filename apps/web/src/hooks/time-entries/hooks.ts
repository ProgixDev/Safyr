import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clockIn,
  clockOut,
  getActiveTimeEntry,
  listActivePositions,
  listTimeEntries,
  type ClockInPayload,
  type ClockOutPayload,
  type ListTimeEntriesParams,
} from "@safyr/api-client";
import { timeEntryKeys } from "./keys";

export function useActiveTimeEntry() {
  return useQuery({
    queryKey: timeEntryKeys.active(),
    queryFn: getActiveTimeEntry,
    refetchInterval: 30_000,
  });
}

export function useActivePositions() {
  return useQuery({
    queryKey: [...timeEntryKeys.all, "active-positions"] as const,
    queryFn: listActivePositions,
    refetchInterval: 15_000,
  });
}

export function useTimeEntries(params: ListTimeEntriesParams = {}) {
  return useQuery({
    queryKey: timeEntryKeys.list(params),
    queryFn: () => listTimeEntries(params),
    refetchInterval: 30_000,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: timeEntryKeys.all });
  };
}

export function useClockIn() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: ClockInPayload) => clockIn(data),
    onSuccess: () => invalidate(),
  });
}

export function useClockOut() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: ClockOutPayload) => clockOut(data),
    onSuccess: () => invalidate(),
  });
}
