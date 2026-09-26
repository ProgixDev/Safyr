"use client";

import { useCallback, useMemo } from "react";
import { useRegistre } from "@/hooks/fiscal/use-registre";
import { ficheDepuisMeta, type FicheEmploi } from "@/lib/fiche-emploi";

interface LigneFicheEmploi extends FicheEmploi {
  id: string;
  employeeId: string;
}

/**
 * Fiches « Emploi » (grille des salaires, période d'essai) des salariés.
 * Une fiche par salarié, tenue dans le registre `fiche_emploi`.
 */
export function useFichesEmploi() {
  const registre = useRegistre<LigneFicheEmploi>("fiche_emploi", []);
  const { lignes, enregistrer, isLoading } = registre;

  const fiches = useMemo(() => {
    const parSalarie = new Map<string, { id: string; fiche: FicheEmploi }>();
    for (const l of lignes) {
      const brut = l as unknown as Record<string, unknown>;
      if (typeof brut.employeeId !== "string") continue;
      parSalarie.set(brut.employeeId, {
        id: l.id,
        fiche: ficheDepuisMeta(brut),
      });
    }
    return parSalarie;
  }, [lignes]);

  const ficheDe = useCallback(
    (employeeId: string): FicheEmploi | null =>
      fiches.get(employeeId)?.fiche ?? null,
    [fiches],
  );

  /** Crée ou met à jour la fiche du salarié. */
  const enregistrerFiche = useCallback(
    async (employeeId: string, nom: string, fiche: FicheEmploi) => {
      const existante = fiches.get(employeeId);
      await enregistrer(
        { ...fiche, id: existante?.id ?? "", employeeId },
        {
          period: String(new Date().getFullYear()),
          label: `Fiche emploi - ${nom}`.slice(0, 160),
        },
      );
    },
    [enregistrer, fiches],
  );

  return { ficheDe, enregistrerFiche, isLoading };
}
