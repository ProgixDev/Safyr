import { apiFetch } from "../client";
import type {
  CreateShiftPayload,
  ListShiftsParams,
  Shift,
  UpdateShiftPayload,
} from "./types";

export * from "./types";

export function listShifts(params: ListShiftsParams = {}): Promise<Shift[]> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") qs.set(k, String(v));
  }
  const search = qs.toString();
  return apiFetch<Shift[]>(`/shifts${search ? `?${search}` : ""}`);
}

export const createShift = (data: CreateShiftPayload) =>
  apiFetch<Shift>("/shifts", { method: "POST", body: data });

export const updateShift = (shiftId: string, data: UpdateShiftPayload) =>
  apiFetch<Shift>(`/shifts/${shiftId}`, { method: "PATCH", body: data });

export const deleteShift = (shiftId: string) =>
  apiFetch<Shift>(`/shifts/${shiftId}`, { method: "DELETE" });
