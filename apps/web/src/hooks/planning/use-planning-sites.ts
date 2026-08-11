"use client";

import { useMemo } from "react";
import { useSites } from "@/hooks/sites";
import { SITE_COLOR_OPTIONS } from "@/lib/site-colors";
import type { Site as UiSite, Poste, Client } from "@/lib/types";
import type { Site as ApiSite, Post as ApiPost } from "@safyr/api-client";

/**
 * Sites, postes et clients du planning, construits à partir des sites réels
 * de l'organisation.
 *
 * Le module planning lisait `mockSites` / `mockPostes` / `mockClients` : les
 * sites créés dans « Entreprise → Sites & Postes » n'y apparaissaient pas, et
 * une fois les données de démonstration retirées le planning s'affichait vide.
 */

const CERTIF_LABELS: Record<string, string> = {
  CQP_APS: "CQP APS",
  CNAPS: "Carte Professionnelle",
  SSIAP1: "SSIAP 1",
  SSIAP2: "SSIAP 2",
  SSIAP3: "SSIAP 3",
  SST: "SST",
  H0B0: "H0B0",
  VM: "Visite médicale",
  FIRE: "Incendie",
};

/** Durée par défaut d'une vacation, déduite des horaires du poste. */
function dureeVacation(post: ApiPost): number {
  if (!post.defaultStartTime || !post.defaultEndTime) return 8;
  const [hd, md] = post.defaultStartTime.split(":").map(Number);
  const [hf, mf] = post.defaultEndTime.split(":").map(Number);
  let minutes = hf * 60 + mf - (hd * 60 + md);
  if (minutes <= 0) minutes += 24 * 60; // vacation de nuit
  return Math.round((minutes / 60) * 10) / 10;
}

function toPoste(post: ApiPost): Poste {
  const debut = post.defaultStartTime ?? "";
  const heureDebut = Number(debut.split(":")[0] ?? 0);
  return {
    id: post.id,
    siteId: post.siteId,
    name: post.name,
    type: "surveillance",
    description: post.description ?? undefined,
    requirements: {
      requiredCertifications: post.requiredCertifications.map(
        (c) => CERTIF_LABELS[c] ?? c,
      ),
    },
    schedule: {
      defaultShiftDuration: dureeVacation(post),
      nightShift: heureDebut >= 20 || heureDebut < 6,
      weekendWork: false,
      rotatingShift: false,
      vacationStart: post.defaultStartTime ?? undefined,
      vacationEnd: post.defaultEndTime ?? undefined,
    },
    capacity: { minAgents: 1, maxAgents: 2 },
    status: post.active ? "active" : "inactive",
    createdAt: new Date(post.createdAt),
    updatedAt: new Date(post.updatedAt),
  } as unknown as Poste;
}

function toSite(site: ApiSite, index: number): UiSite {
  return {
    id: site.id,
    name: site.name,
    color: SITE_COLOR_OPTIONS[index % SITE_COLOR_OPTIONS.length],
    clientId: site.clientName ?? "",
    clientName: site.clientName ?? "Client non renseigné",
    address: {
      street: site.address ?? "",
      city: site.city ?? "",
      postalCode: site.postalCode ?? "",
      country: site.country,
    },
    contact: { name: "", phone: "", email: "" },
    constraints: { requiredCertifications: [] },
    billing: { hourlyRate: 0 },
    status: site.active ? "active" : "inactive",
    contractStartDate: new Date(site.createdAt),
    postes: site.posts.map(toPoste),
    createdAt: new Date(site.createdAt),
    updatedAt: new Date(site.updatedAt),
    notes: site.notes ?? undefined,
  } as unknown as UiSite;
}

export function usePlanningSites() {
  const { data: apiSites = [], isLoading } = useSites();

  const sites = useMemo(() => apiSites.map(toSite), [apiSites]);

  const postes = useMemo(() => sites.flatMap((s) => s.postes), [sites]);

  /** Les clients du planning sont déduits des sites (un site porte son client). */
  const clients = useMemo<Client[]>(() => {
    const parNom = new Map<string, Client>();
    for (const s of sites) {
      const nom = s.clientName;
      if (!nom || parNom.has(nom)) continue;
      parNom.set(nom, {
        id: nom,
        name: nom,
        city: s.address.city,
        postalCode: s.address.postalCode,
      } as Client);
    }
    return [...parNom.values()];
  }, [sites]);

  return { sites, postes, clients, isLoading };
}
