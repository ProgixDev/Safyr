"use client";

import { uploadFile, getSignedUrl } from "@safyr/api-client";

/**
 * Document attaché à une ligne (dossier TVA, CFE, AKTO…).
 *
 * Les écrans se contentaient d'enregistrer un nom de fichier : « Télécharger »
 * fabriquait alors un .txt d'explication au lieu du vrai document. On conserve
 * désormais la clé renvoyée par le stockage, ce qui permet de servir le fichier
 * réellement déposé.
 */
export interface StoredFile {
  /** Nom d'origine, affiché dans l'interface. */
  name: string;
  /** Clé du bucket privé. Absente sur les exemples de démonstration. */
  key?: string;
}

const ACCEPTED_FILES = ".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx";

/** Ouvre le sélecteur de fichier ; résout à null si l'utilisateur annule. */
export function pickFile(accept = ACCEPTED_FILES): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Sélectionne un fichier et l'envoie vers le stockage.
 * Lève une erreur si le téléversement échoue — à afficher côté appelant.
 */
export async function pickAndUploadFile(
  accept?: string,
): Promise<StoredFile | null> {
  const file = await pickFile(accept);
  if (!file) return null;
  const { key } = await uploadFile(file);
  return { name: file.name, key };
}

/**
 * Ouvre le document dans un nouvel onglet via une URL signée.
 * Les documents de démonstration (sans clé) n'ont pas de fichier réel :
 * on le dit explicitement plutôt que de télécharger un texte trompeur.
 */
export async function downloadStoredFile(file: StoredFile): Promise<void> {
  if (!file.key) {
    alert(
      `« ${file.name} » est un exemple de démonstration : aucun fichier n'a été déposé.\n` +
        "Téléversez un document pour pouvoir le télécharger.",
    );
    return;
  }
  const url = await getSignedUrl(file.key);
  window.open(url, "_blank", "noopener,noreferrer");
}
