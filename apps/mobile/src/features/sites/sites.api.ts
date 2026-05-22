import { apiRequest } from "@/lib/api-client";

export type Post = {
  id: string;
  name: string;
  defaultStartTime: string | null;
  defaultEndTime: string | null;
  active: boolean;
};

export type Site = {
  id: string;
  name: string;
  clientName: string | null;
  city: string | null;
  active: boolean;
  posts: Post[];
};

export function listSites(): Promise<Site[]> {
  return apiRequest<Site[]>("/sites");
}
