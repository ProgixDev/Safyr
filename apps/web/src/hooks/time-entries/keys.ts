import type { ListTimeEntriesParams } from "@safyr/api-client";

export const timeEntryKeys = {
  all: ["time-entries"] as const,
  active: () => [...timeEntryKeys.all, "active"] as const,
  list: (params: ListTimeEntriesParams = {}) =>
    [...timeEntryKeys.all, "list", params] as const,
};
