"use client";

import { useSignedUrl } from "@/hooks/storage";

/**
 * Résout la photo d'un salarié en URL affichable.
 *
 * Le champ `photo` contient une clé de stockage (bucket privé) depuis l'ajout
 * du téléversement de photo. Les anciens enregistrements peuvent encore
 * contenir une URL complète (avatar externe) : on la renvoie telle quelle.
 */
export function useEmployeePhotoUrl(
  photo: string | null | undefined,
): string | undefined {
  const isAbsolute = !!photo && /^(https?:|data:|\/)/.test(photo);
  const { data: signedUrl } = useSignedUrl(isAbsolute ? null : photo);

  if (!photo) return undefined;
  return isAbsolute ? photo : (signedUrl ?? undefined);
}
