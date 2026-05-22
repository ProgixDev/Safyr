import type { ListShiftsParams } from "@safyr/api-client";

export const shiftKeys = {
  all: ["shifts"] as const,
  list: (params: ListShiftsParams = {}) =>
    [...shiftKeys.all, "list", params] as const,
};
