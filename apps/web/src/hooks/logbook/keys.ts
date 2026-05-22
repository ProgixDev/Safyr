import type { ListLogbookEventsParams } from "@safyr/api-client";

export const logbookKeys = {
  all: ["logbook-events"] as const,
  list: (params: ListLogbookEventsParams = {}) =>
    [...logbookKeys.all, "list", params] as const,
};
