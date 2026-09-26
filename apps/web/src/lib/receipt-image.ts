const COTE_MAX = 1600;
const TAILLE_ENVOI_MAX = 3 * 1024 * 1024;

/** Vrai pour les photos que la lecture automatique sait analyser. */
export function estPhotoLisible(fichier: File): boolean {
  if (/^image\/(jpeg|png|webp)$/.test(fichier.type)) return true;
  // Certains navigateurs ne renseignent pas le type : on se fie à l'extension.
  return fichier.type === "" && /\.(jpe?g|png|webp)$/i.test(fichier.name);
}

/**
 * Réduit une photo avant l'envoi à la lecture automatique : une photo de
 * téléphone dépasse vite les 3 Mo acceptés par le serveur, et un ticket reste
 * parfaitement lisible à 1600 px. Le fichier stocké, lui, reste l'original.
 * Si le navigateur ne sait pas décoder l'image, l'original est envoyé tel quel
 * (tant qu'il reste sous la limite).
 */
export async function preparerPhotoPourLecture(fichier: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(fichier, {
      imageOrientation: "from-image",
    });
    const echelle = Math.min(
      1,
      COTE_MAX / Math.max(bitmap.width, bitmap.height),
    );
    const largeur = Math.round(bitmap.width * echelle);
    const hauteur = Math.round(bitmap.height * echelle);
    const canvas = document.createElement("canvas");
    canvas.width = largeur;
    canvas.height = hauteur;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas indisponible");
    // Fond blanc : un PNG transparent deviendrait noir une fois en JPEG.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, largeur, hauteur);
    ctx.drawImage(bitmap, 0, 0, largeur, hauteur);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob) throw new Error("encodage impossible");
    return new File([blob], "ticket.jpg", { type: "image/jpeg" });
  } catch {
    if (fichier.size > TAILLE_ENVOI_MAX) {
      throw new Error(
        "Photo trop volumineuse pour la lecture automatique. Saisissez les champs manuellement.",
      );
    }
    return fichier;
  }
}
