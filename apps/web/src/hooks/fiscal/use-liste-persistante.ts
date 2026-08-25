"use client";

import { useCallback, useMemo } from "react";
import type { FiscalRecordType } from "@safyr/api-client";

import {
  useFiscalRecords,
  useCreateFiscalRecord,
  useUpdateFiscalRecord,
  useDeleteFiscalRecord,
} from "./index";

/**
 * Remplace `useState<T[]>(...)` sur les écrans dont les lignes doivent être
 * conservées : même signature, mais chaque ajout, modification ou suppression
 * est écrit en base.
 *
 * Ces écrans avaient été construits sur des listes en mémoire : la ligne
 * s'affichait, puis disparaissait au rechargement de la page.
 */
const ISO_COMPLET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

/** Dates → chaînes ISO, pour l'enregistrement. */
function serialiser(valeur: unknown): unknown {
  if (valeur instanceof Date) {
    return Number.isNaN(valeur.getTime()) ? null : valeur.toISOString();
  }
  if (Array.isArray(valeur)) return valeur.map(serialiser);
  if (valeur && typeof valeur === "object") {
    const sortie: Record<string, unknown> = {};
    for (const [cle, v] of Object.entries(valeur as Record<string, unknown>)) {
      sortie[cle] = serialiser(v);
    }
    return sortie;
  }
  return valeur;
}

/** Chaînes ISO → Dates, à la relecture. */
function revivre(valeur: unknown): unknown {
  if (typeof valeur === "string" && ISO_COMPLET.test(valeur)) {
    const d = new Date(valeur);
    return Number.isNaN(d.getTime()) ? valeur : d;
  }
  if (Array.isArray(valeur)) return valeur.map(revivre);
  if (valeur && typeof valeur === "object") {
    const sortie: Record<string, unknown> = {};
    for (const [cle, v] of Object.entries(valeur as Record<string, unknown>)) {
      sortie[cle] = revivre(v);
    }
    return sortie;
  }
  return valeur;
}

/** Libellé affiché dans le registre : premier champ texte parlant. */
function libelleAuto(item: Record<string, unknown>): string {
  for (const cle of [
    "name",
    "title",
    "label",
    "employeeName",
    "reference",
    "number",
    "subject",
    "type",
  ]) {
    const v = item[cle];
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 160);
  }
  return "Ligne";
}

/** Période du registre : première date trouvée, sinon le mois courant. */
function periodeAuto(item: Record<string, unknown>): string {
  for (const v of Object.values(item)) {
    if (v instanceof Date && !Number.isNaN(v.getTime())) {
      return v.toISOString().slice(0, 7);
    }
    if (typeof v === "string" && ISO_COMPLET.test(v)) return v.slice(0, 7);
  }
  return new Date().toISOString().slice(0, 7);
}

export interface OptionsListePersistante<T> {
  /** Libellé enregistré avec la ligne (par défaut : premier champ texte). */
  libelle?: (item: T) => string;
  /** Période enregistrée avec la ligne (par défaut : première date). */
  periode?: (item: T) => string;
  /**
   * Liste de référence livrée avec le logiciel (types d'indemnités URSSAF,
   * règles d'organismes, modèles de courrier…). Elle reste dans le code ;
   * seules les différences du client sont enregistrées : une ligne modifiée
   * remplace la version livrée, une ligne retirée est enregistrée masquée.
   */
  reference?: readonly T[];
  /** Clé stable d'une ligne de référence (par défaut : son identifiant). */
  cle?: (item: T) => string;
}

interface Marques {
  __cle?: string;
  __masque?: boolean;
}

export function useListePersistante<T extends { id: string }>(
  type: FiscalRecordType,
  options: OptionsListePersistante<T> = {},
): [T[], (maj: T[] | ((precedent: T[]) => T[])) => void, boolean] {
  const { data: records = [], isLoading } = useFiscalRecords(type);
  const creer = useCreateFiscalRecord();
  const modifier = useUpdateFiscalRecord();
  const supprimer = useDeleteFiscalRecord();

  const reference = options.reference;
  const cleDe = useCallback(
    (item: T) => options.cle?.(item) ?? item.id,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const enregistrees = useMemo<(T & Marques)[]>(
    () =>
      records.map(
        (record) =>
          ({
            ...(revivre(record.meta ?? {}) as Record<string, unknown>),
            id: record.id,
          }) as T & Marques,
      ),
    [records],
  );

  const liste = useMemo<T[]>(() => {
    if (!reference) return enregistrees;
    const parCle = new Set(
      enregistrees.map((item) => item.__cle ?? cleDe(item)),
    );
    const livrees = reference.filter((item) => !parCle.has(cleDe(item)));
    return [...livrees, ...enregistrees.filter((item) => !item.__masque)];
  }, [enregistrees, reference, cleDe]);

  const infosDe = useCallback(
    (item: T) => {
      const brut = item as unknown as Record<string, unknown>;
      return {
        period: options.periode?.(item) ?? periodeAuto(brut),
        label: options.libelle?.(item) ?? libelleAuto(brut),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const metaDe = useCallback((item: T) => {
    const { id: _ignore, ...reste } = item as unknown as Record<
      string,
      unknown
    >;
    return serialiser(reste) as Record<string, unknown>;
  }, []);

  const appliquer = useCallback(
    (maj: T[] | ((precedent: T[]) => T[])) => {
      const suivant = typeof maj === "function" ? maj(liste) : maj;
      const avant = new Map(liste.map((item) => [item.id, item]));
      const apres = new Map(suivant.map((item) => [item.id, item]));

      const estEnregistree = (id: string) =>
        enregistrees.some((item) => item.id === id);

      for (const [id, item] of apres) {
        const ancien = avant.get(id);
        const meta = metaDe(item);
        if (!ancien) {
          void creer.mutateAsync({ type, ...infosDe(item), meta });
          continue;
        }
        if (JSON.stringify(metaDe(ancien)) === JSON.stringify(meta)) continue;
        if (estEnregistree(id)) {
          void modifier.mutateAsync({
            recordId: id,
            payload: { ...infosDe(item), meta },
          });
        } else {
          // Ligne livrée avec le logiciel : la version du client la remplace.
          void creer.mutateAsync({
            type,
            ...infosDe(item),
            meta: { ...meta, __cle: cleDe(item) },
          });
        }
      }

      for (const [id, item] of avant) {
        if (apres.has(id)) continue;
        if (estEnregistree(id)) {
          void supprimer.mutateAsync(id);
        } else {
          // Ligne livrée : on enregistre qu'elle a été retirée.
          void creer.mutateAsync({
            type,
            ...infosDe(item),
            meta: { ...metaDe(item), __cle: cleDe(item), __masque: true },
          });
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liste, enregistrees, type, infosDe, metaDe, cleDe],
  );

  return [liste, appliquer, isLoading];
}
