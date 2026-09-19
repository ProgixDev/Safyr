"use client";

import { useCallback, useMemo } from "react";
import {
  useFiscalRecords,
  useCreateFiscalRecord,
  useUpdateFiscalRecord,
} from "@/hooks/fiscal";
import { primeParId } from "@/lib/payroll-primes";

/**
 * Paramètres annuels de la paie : montant unitaire des primes (panier,
 * restauration, taux d'habillage…) et taux de charges de l'analyse des coûts.
 *
 * Un enregistrement par année (`parametre_paie`, période = « 2026 »). Pour une
 * année sans réglage, on reprend le dernier réglage d'une année précédente,
 * puis la valeur livrée avec le logiciel.
 */
export const cleMontantPrime = (primeId: string) => `prime:${primeId}`;
export const CLE_TAUX_PATRONAL = "taux_charges_patronales";
export const CLE_TAUX_SALARIAL = "taux_charges_salariales";

/** Estimation moyenne (hors réductions) pour la sécurité privée, à ajuster. */
export const TAUX_PATRONAL_DEFAUT = 42;
export const TAUX_SALARIAL_DEFAUT = 22;

interface ReglageAnnee {
  id: string;
  valeurs: Record<string, number>;
}

export function useParametresPaie(annee: number) {
  const {
    data: records = [],
    isLoading,
    isError,
  } = useFiscalRecords("parametre_paie");
  const creer = useCreateFiscalRecord();
  const modifier = useUpdateFiscalRecord();

  const parAnnee = useMemo(() => {
    const map = new Map<number, ReglageAnnee>();
    for (const r of records) {
      // Serveur pas encore redéployé : un type inconnu renvoie tous les registres.
      if (r.type !== "parametre_paie") continue;
      const a = Number(r.period);
      if (!Number.isFinite(a)) continue;
      const brutes = (r.meta?.valeurs ?? {}) as Record<string, unknown>;
      const valeurs: Record<string, number> = {};
      for (const [cle, v] of Object.entries(brutes)) {
        if (typeof v === "number" && Number.isFinite(v)) valeurs[cle] = v;
      }
      map.set(a, { id: r.id, valeurs });
    }
    return map;
  }, [records]);

  const valeur = useCallback(
    (cle: string, defaut: number): number => {
      const courant = parAnnee.get(annee)?.valeurs[cle];
      if (typeof courant === "number") return courant;
      const anterieures = [...parAnnee.keys()]
        .filter((a) => a < annee)
        .sort((a, b) => b - a);
      for (const a of anterieures) {
        const v = parAnnee.get(a)?.valeurs[cle];
        if (typeof v === "number") return v;
      }
      return defaut;
    },
    [parAnnee, annee],
  );

  /** Montant unitaire (ou global) courant d'une prime pour l'année. */
  const montantPrime = useCallback(
    (primeId: string): number =>
      valeur(cleMontantPrime(primeId), primeParId(primeId)?.montantDefaut ?? 0),
    [valeur],
  );

  const enregistrer = useCallback(
    async (nouvelles: Record<string, number>) => {
      const existant = parAnnee.get(annee);
      const payload = {
        period: String(annee),
        label: `Paramètres de paie ${annee}`,
        meta: { valeurs: { ...(existant?.valeurs ?? {}), ...nouvelles } },
      };
      if (existant) {
        await modifier.mutateAsync({ recordId: existant.id, payload });
      } else {
        await creer.mutateAsync({ type: "parametre_paie", ...payload });
      }
    },
    [annee, parAnnee, creer, modifier],
  );

  return {
    annee,
    isLoading,
    isError,
    valeur,
    montantPrime,
    enregistrer,
    enCours: creer.isPending || modifier.isPending,
  };
}
