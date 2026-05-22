import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createShift,
  deleteShift,
  listShifts,
  updateShift,
  type CreateShiftPayload,
  type ListShiftsParams,
  type UpdateShiftPayload,
} from "@safyr/api-client";
import { shiftKeys } from "./keys";

export function useShifts(params: ListShiftsParams = {}) {
  return useQuery({
    queryKey: shiftKeys.list(params),
    queryFn: () => listShifts(params),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: shiftKeys.all });
}

export function useCreateShift() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: CreateShiftPayload) => createShift(data),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateShift() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      shiftId,
      data,
    }: {
      shiftId: string;
      data: UpdateShiftPayload;
    }) => updateShift(shiftId, data),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteShift() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (shiftId: string) => deleteShift(shiftId),
    onSuccess: () => invalidate(),
  });
}
