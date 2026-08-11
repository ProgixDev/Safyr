import type { Site, Poste, SiteStats, Client } from "@/lib/types";

export const mockClients: Client[] = [];

export const mockPostes: Poste[] = [];

export const mockSites: Site[] = [];

export const mockSiteStats: SiteStats = {
  total: 7,
  active: 5,
  inactive: 0,
  suspended: 1,
  totalPostes: 7,
  activePostes: 7,
  agentsDeployed: 6,
  coverageRate: 85.7, // 6/7 postes couverts
};
