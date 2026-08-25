"use client";

import { useCallback, useMemo } from "react";
import type { FiscalRecordType } from "@safyr/api-client";
import type { StoredFile } from "@/lib/document-files";
import { pickFile } from "@/lib/document-files";
import {
  useAttachments,
  useAttachDocument,
  useDeleteAttachment,
} from "@/hooks/contracts";
import {
  useFiscalRecords,
  useCreateFiscalRecord,
  useUpdateFiscalRecord,
  useDeleteFiscalRecord,
} from "./index";

/**
 * Registre administratif persistant (TVA, CFE, prélèvement à la source,
 * courriers fiscaux, dossiers AKTO).
 *
 * Ces écrans gardaient leurs lignes et leurs pièces jointes dans l'état React :
 * le fichier partait bien dans le stockage, mais la ligne disparaissait à la
 * déconnexion. Chaque ligne est désormais un enregistrement en base, et chaque
 * pièce une pièce jointe rattachée à cette ligne.
 */
export interface LigneRegistre {
  id: string;
}

const SCOPE: Record<FiscalRecordType, "tax" | "akto" | "divers"> = {
  tva: "tax",
  cfe: "tax",
  prelevement: "tax",
  courrier: "tax",
  akto: "akto",
  organisme: "divers",
  divers: "divers",
  courrier_organisme: "divers",
  equipement: "divers",
  avantage: "divers",
  entretien_annuel: "divers",
  entretien_professionnel: "divers",
  objectif: "divers",
  avertissement: "divers",
  procedure_disciplinaire: "divers",
  sanction: "divers",
};

export function useRegistre<T extends LigneRegistre>(
  type: FiscalRecordType,
  champsFichiers: readonly string[],
) {
  const scope = SCOPE[type];
  const { data: records = [], isLoading } = useFiscalRecords(type);
  const { data: pieces = [] } = useAttachments(scope);
  const creer = useCreateFiscalRecord();
  const modifier = useUpdateFiscalRecord();
  const supprimerLigneApi = useDeleteFiscalRecord();
  const attacher = useAttachDocument(scope);
  const detacher = useDeleteAttachment(scope);

  /** Lignes reconstruites : métadonnées enregistrées + pièces rattachées. */
  const lignes = useMemo<T[]>(
    () =>
      records.map((record) => {
        const ligne = {
          ...((record.meta ?? {}) as Record<string, unknown>),
          id: record.id,
        } as T;
        for (const champ of champsFichiers) {
          const piece = pieces.find(
            (p) => p.scopeId === record.id && p.slot === champ,
          );
          (ligne as Record<string, unknown>)[champ] = piece
            ? ({ name: piece.name, key: piece.storageKey } as StoredFile)
            : null;
        }
        return ligne;
      }),
    [records, pieces, champsFichiers],
  );

  /** Métadonnées à enregistrer : tout sauf les pièces jointes. */
  const metaDe = useCallback(
    (ligne: T) => {
      const meta: Record<string, unknown> = {};
      for (const [cle, valeur] of Object.entries(ligne)) {
        if (cle === "id" || champsFichiers.includes(cle)) continue;
        meta[cle] = valeur;
      }
      return meta;
    },
    [champsFichiers],
  );

  const enregistrer = useCallback(
    async (
      ligne: T,
      infos: {
        period: string;
        label: string;
        status?: string;
        amount?: number;
      },
    ): Promise<string> => {
      const connue = records.some((r) => r.id === ligne.id);
      if (connue) {
        await modifier.mutateAsync({
          recordId: ligne.id,
          payload: { ...infos, meta: metaDe(ligne) },
        });
        return ligne.id;
      }
      const cree = await creer.mutateAsync({
        type,
        ...infos,
        meta: metaDe(ligne),
      });
      return cree.id;
    },
    [creer, modifier, metaDe, records, type],
  );

  const supprimerLigne = useCallback(
    (id: string) => supprimerLigneApi.mutateAsync(id),
    [supprimerLigneApi],
  );

  /**
   * Choisit un fichier et le rattache à la ligne. La ligne est créée au
   * passage si elle n'existe pas encore en base.
   */
  const televerserPiece = useCallback(
    async (
      ligne: T,
      champ: string,
      infos: {
        period: string;
        label: string;
        status?: string;
        amount?: number;
      },
    ): Promise<{ nom: string } | null> => {
      const fichier = await pickFile();
      if (!fichier) return null;
      const recordId = await enregistrer(ligne, infos);
      await attacher.mutateAsync({
        file: fichier,
        scopeId: recordId,
        slot: champ,
      });
      return { nom: fichier.name };
    },
    [attacher, enregistrer],
  );

  /** Rattache un fichier déjà choisi dans un formulaire à une ligne connue. */
  const attacherFichier = useCallback(
    async (ligneId: string, champ: string, fichier: File) => {
      await attacher.mutateAsync({
        file: fichier,
        scopeId: ligneId,
        slot: champ,
      });
    },
    [attacher],
  );

  const retirerPiece = useCallback(
    async (ligneId: string, champ: string) => {
      const piece = pieces.find(
        (p) => p.scopeId === ligneId && p.slot === champ,
      );
      if (piece) await detacher.mutateAsync(piece.id);
    },
    [detacher, pieces],
  );

  return {
    lignes,
    isLoading,
    enregistrer,
    supprimerLigne,
    televerserPiece,
    attacherFichier,
    retirerPiece,
  };
}
