import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLogbookEvent,
  deleteLogbookEvent,
  listLogbookEvents,
  updateLogbookEvent,
  validateLogbookEvent,
  type CreateLogbookEventPayload,
  type ListLogbookEventsParams,
  type UpdateLogbookEventPayload,
  type ValidateLogbookEventPayload,
} from "@safyr/api-client";
import { logbookKeys } from "./keys";

export function useLogbookEvents(params: ListLogbookEventsParams = {}) {
  return useQuery({
    queryKey: logbookKeys.list(params),
    queryFn: () => listLogbookEvents(params),
    refetchInterval: 60_000,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: logbookKeys.all });
}

export function useCreateLogbookEvent() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: CreateLogbookEventPayload) => createLogbookEvent(data),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateLogbookEvent() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      eventId,
      data,
    }: {
      eventId: string;
      data: UpdateLogbookEventPayload;
    }) => updateLogbookEvent(eventId, data),
    onSuccess: () => invalidate(),
  });
}

export function useValidateLogbookEvent() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      eventId,
      data,
    }: {
      eventId: string;
      data: ValidateLogbookEventPayload;
    }) => validateLogbookEvent(eventId, data),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteLogbookEvent() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (eventId: string) => deleteLogbookEvent(eventId),
    onSuccess: () => invalidate(),
  });
}
