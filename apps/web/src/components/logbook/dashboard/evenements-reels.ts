"use client";

import { useMemo } from "react";
import { useLogbookEvents } from "@/hooks/logbook";
import type { LogbookEvent } from "@/data/logbook-events";
import type { LogbookEvent as ApiLogbookEvent } from "@safyr/api-client";

/**
 * Les tableaux de bord de la main courante ont ete ecrits sur des donnees de
 * demonstration (`mockLogbookEvents`). Cet adaptateur les alimente avec les
 * evenements reellement enregistres, sans reecrire chaque calcul.
 */
export function versEvenementLocal(e: ApiLogbookEvent): LogbookEvent {
  return {
    id: e.id,
    type: e.type === "event" ? "routine" : e.type,
    severity: e.severity,
    title: e.title,
    description: e.description ?? "",
    site: e.site?.name ?? "Site non renseigné",
    zone: undefined,
    agentId: e.memberId ?? "",
    agentName: e.member
      ? `${e.member.firstName ?? ""} ${e.member.lastName ?? ""}`.trim()
      : "",
    timestamp: e.occurredAt,
    validatedAt: e.validatedAt ?? undefined,
    status:
      e.status === "validated" || e.status === "closed" ? "resolved" : "open",
    tags: [],
  } as unknown as LogbookEvent;
}

/** Evenements de la main courante au format attendu par les tableaux de bord. */
export function useEvenementsMainCourante(): LogbookEvent[] {
  const { data: evenements = [] } = useLogbookEvents({});
  return useMemo(() => evenements.map(versEvenementLocal), [evenements]);
}
