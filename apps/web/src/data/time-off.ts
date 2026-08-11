import type { TimeOffRequest } from "@/lib/types";

// Helper function to generate dates
const createDate = (daysOffset: number = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

export const mockTimeOffRequests: TimeOffRequest[] = [];
