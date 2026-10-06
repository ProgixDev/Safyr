"use client";

import { useMemo } from "react";
import { useRegistre } from "@/hooks/fiscal/use-registre";
import type { SiteAgentAssignment } from "@/lib/types";

/**
 * Rattachements manuels agent↔site, enregistrés en base (registre
 * `site_agent_assignment`).
 *
 * La grille déduisait déjà un rattachement des vacations réellement
 * enregistrées (un agent avec une vacation sur un site y apparaît), mais le
 * rattachement MANUEL (« Affecter un agent » avant toute vacation) ne vivait
 * que dans l'état React de l'écran : il disparaissait au rechargement.
 */

const AUCUN_FICHIER: readonly string[] = [];

interface LigneAffectation {
  id: string;
  siteId?: string;
  agentId?: string;
  agentName?: string;
  assignedAt?: string;
}

export function usePlanningSiteAgents() {
  const registre = useRegistre<LigneAffectation>(
    "site_agent_assignment",
    AUCUN_FICHIER,
  );

  const assignments = useMemo<SiteAgentAssignment[]>(
    () =>
      registre.lignes
        .filter((l): l is LigneAffectation & { siteId: string; agentId: string } =>
          !!l.siteId && !!l.agentId,
        )
        .map((l) => ({
          id: l.id,
          siteId: l.siteId,
          agentId: l.agentId,
          agentName: l.agentName ?? "Agent",
          assignedAt: l.assignedAt ? new Date(l.assignedAt) : new Date(),
          active: true,
        })),
    [registre.lignes],
  );

  const assigner = (siteId: string, agentId: string, agentName: string) =>
    registre.enregistrer(
      {
        id: "",
        siteId,
        agentId,
        agentName,
        assignedAt: new Date().toISOString(),
      },
      { period: String(new Date().getFullYear()), label: agentName },
    );

  const retirer = (siteId: string, agentId: string) => {
    const ligne = registre.lignes.find(
      (l) => l.siteId === siteId && l.agentId === agentId,
    );
    return ligne ? registre.supprimerLigne(ligne.id) : Promise.resolve();
  };

  return { assignments, assigner, retirer, isLoading: registre.isLoading };
}
