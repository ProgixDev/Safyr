"use client";

import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { downloadStoredFile, type StoredFile } from "@/lib/document-files";

/**
 * Menu 3 points d'une pièce de dossier AKTO (devis, convention, facture) :
 * Voir · Remplacer/Téléverser · Télécharger · Supprimer.
 *
 * « Voir » ouvre directement le fichier dans un nouvel onglet ; les actions
 * qui n'ont pas de sens sans fichier (voir, télécharger, supprimer) ne sont
 * proposées que lorsqu'il y en a un.
 */
export function MenuPiece({
  fichier,
  onUpload,
  onDelete,
}: {
  fichier?: StoredFile | null;
  onUpload: () => void;
  onDelete: () => void;
}) {
  return (
    <RowActionsMenu
      onView={fichier ? () => void downloadStoredFile(fichier) : undefined}
      onUpload={onUpload}
      uploadLabel={fichier ? "Remplacer" : "Téléverser"}
      onDownload={fichier ? () => void downloadStoredFile(fichier) : undefined}
      onDelete={fichier ? onDelete : undefined}
    />
  );
}
