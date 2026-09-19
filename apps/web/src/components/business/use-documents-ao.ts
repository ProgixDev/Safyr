"use client";

import { useCallback } from "react";
import { useRegistre } from "@/hooks/fiscal";
import { downloadStoredFile, pickFile } from "@/lib/document-files";
import {
  CHAMPS_DOCUMENT_AO,
  TYPE_DOCUMENT_PAR_DEFAUT,
  aujourdhui,
  type LigneDocumentAO,
} from "./appel-offre-types";

/** Libellé et période exigés par le registre pour une ligne de document. */
function infosDe(doc: LigneDocumentAO) {
  return {
    period: (doc.date || aujourdhui()).slice(0, 7),
    label: doc.name.trim().slice(0, 160) || "Document",
  };
}

/**
 * Documents des appels d'offre, enregistrés en base avec leur pièce jointe.
 * Partagé par l'écran des appels d'offre (menu « Téléverser », fiche détail)
 * et par l'onglet « Documents ».
 */
export function useDocumentsAO() {
  const registre = useRegistre<LigneDocumentAO>(
    "appel_offre_document",
    CHAMPS_DOCUMENT_AO,
  );
  const { enregistrer, attacherFichier, retirerPiece, supprimerLigne } =
    registre;

  const documentsDe = useCallback(
    (tenderId: string) =>
      registre.lignes.filter((d) => d.tenderId === tenderId),
    [registre.lignes],
  );

  /**
   * Crée ou modifie un document, puis rattache le fichier choisi.
   * Le registre attribue lui-même l'identifiant : on utilise celui qu'il
   * renvoie, jamais l'identifiant local.
   */
  const enregistrerDocument = useCallback(
    async (doc: LigneDocumentAO, fichier?: File | null): Promise<string> => {
      const id = await enregistrer(doc, infosDe(doc));
      if (fichier) {
        try {
          await attacherFichier(id, "fichier", fichier);
        } catch (e) {
          // Une ligne neuve sans fichier n'a aucun intérêt : on la retire.
          if (!doc.id) await supprimerLigne(id);
          throw e;
        }
      }
      return id;
    },
    [enregistrer, attacherFichier, supprimerLigne],
  );

  /**
   * Ouvre le sélecteur de fichier puis crée un document rattaché à l'appel
   * d'offre. À appeler directement depuis le clic : le sélecteur doit s'ouvrir
   * avant tout await (Safari).
   */
  const televerserPourAppelOffre = useCallback(
    async (tenderId: string): Promise<string | null> => {
      const fichier = await pickFile();
      if (!fichier) return null;
      await enregistrerDocument(
        {
          id: "",
          name: fichier.name,
          tenderId,
          type: TYPE_DOCUMENT_PAR_DEFAUT,
          date: aujourdhui(),
        },
        fichier,
      );
      return fichier.name;
    },
    [enregistrerDocument],
  );

  /** Remplace (ou ajoute) le fichier d'un document existant. */
  const remplacerFichier = useCallback(
    async (doc: LigneDocumentAO): Promise<string | null> => {
      const fichier = await pickFile();
      if (!fichier) return null;
      await attacherFichier(doc.id, "fichier", fichier);
      return fichier.name;
    },
    [attacherFichier],
  );

  const supprimerDocument = useCallback(
    async (doc: LigneDocumentAO) => {
      await retirerPiece(doc.id, "fichier").catch(() => undefined);
      await supprimerLigne(doc.id);
    },
    [retirerPiece, supprimerLigne],
  );

  /** Télécharge la pièce jointe ; explique clairement s'il n'y en a pas. */
  const telecharger = useCallback((doc: LigneDocumentAO) => {
    if (!doc.fichier) {
      alert(
        `Aucun fichier n'est joint à « ${doc.name} ». Utilisez « Téléverser » pour en ajouter un.`,
      );
      return;
    }
    void downloadStoredFile(doc.fichier);
  }, []);

  return {
    documents: registre.lignes,
    isLoading: registre.isLoading,
    documentsDe,
    enregistrerDocument,
    televerserPourAppelOffre,
    remplacerFichier,
    supprimerDocument,
    telecharger,
  };
}
