export type ShiftStatus = "planned" | "confirmed" | "cancelled" | "completed";

export interface ShiftSiteRef {
  id: string;
  name: string;
  clientName: string | null;
}

export interface ShiftPostRef {
  id: string;
  name: string;
  site: ShiftSiteRef;
}

export interface Shift {
  id: string;
  organizationId: string;
  postId: string;
  memberId: string | null;
  startAt: string;
  endAt: string;
  status: ShiftStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  post?: ShiftPostRef;
}

export interface CreateShiftPayload {
  postId: string;
  memberId?: string | null;
  startAt: string;
  endAt: string;
  status?: ShiftStatus;
  notes?: string;
}

export type UpdateShiftPayload = Partial<
  Omit<CreateShiftPayload, "postId">
> & {
  postId?: string;
  notes?: string | null;
};

export interface ListShiftsParams {
  siteId?: string;
  postId?: string;
  memberId?: string;
  from?: string;
  to?: string;
  status?: ShiftStatus;
}
