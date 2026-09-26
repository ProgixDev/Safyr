import {
  ApiError,
  fetchAttachmentContent,
  getSignedUrl,
} from "@safyr/api-client";
import { createZip, type ZipEntry } from "@/lib/zip";
import {
  assainirNom,
  construireLignes,
  extensionDe,
  genererSommairePdf,
  imageVersJpeg,
  telechargerBlob,
  type AnnexeImage,
  type DossierSousTraitant,
  type LigneDossier,
} from "@/lib/subcontractor-dossier-pdf";

export type MotifNonInclus =
  | "trop_volumineux"
  | "non_recuperable"
  | "sans_fichier";

export interface PieceNonIncluse {
  libelle: string;
  fichier: string;
  motif: MotifNonInclus;
}

export interface ResultatArchive {
  nomArchive: string;
  incluses: number;
  nonIncluses: PieceNonIncluse[];
  octets: number;
}

export interface ResultatSommaire {
  integrees: number;
  /** PDF, Word, Excel… : listés au sommaire, à télécharger à part. */
  jointsSeparement: number;
  nonIncluses: PieceNonIncluse[];
}

interface OptionsGeneration {
  /** Étape en cours (« Récupération 3/12… »), à afficher à l'écran. */
  onProgress?: (message: string) => void;
  signal?: AbortSignal;
}

const EXT_IMAGE = ["jpg", "jpeg", "png", "webp", "gif", "bmp"];
const SIMULTANES = 3;

export const LIBELLE_MOTIF: Record<MotifNonInclus, string> = {
  trop_volumineux: "trop volumineux pour l'archive",
  non_recuperable: "non récupérable",
  sans_fichier: "aucun fichier associé",
};

const MENTION_MOTIF: Record<MotifNonInclus, string> = {
  trop_volumineux:
    "Trop volumineux pour l'archive : à télécharger séparément (Actions > Télécharger)",
  non_recuperable: "Non récupérable",
  sans_fichier: "Aucun fichier associé",
};

type Recuperation =
  | { ok: true; blob: Blob }
  | { ok: false; motif: MotifNonInclus };

/**
 * Lit un fichier stocké. Essai direct sur l'URL signée (aucune limite de
 * taille) ; si le navigateur la refuse (CORS du bucket, réseau), repli sur
 * l'API, limitée à ~4 Mo par les fonctions serverless.
 */
async function recuperer(
  key: string | undefined,
  signal?: AbortSignal,
): Promise<Recuperation> {
  if (!key) return { ok: false, motif: "sans_fichier" };
  try {
    const url = await getSignedUrl(key);
    const reponse = await fetch(url, { signal });
    if (reponse.ok) return { ok: true, blob: await reponse.blob() };
  } catch {
    if (signal?.aborted) throw new DOMException("Annulé", "AbortError");
  }
  try {
    return { ok: true, blob: await fetchAttachmentContent(key, signal) };
  } catch (e) {
    if (signal?.aborted) throw new DOMException("Annulé", "AbortError");
    if (e instanceof ApiError && e.status === 413) {
      return { ok: false, motif: "trop_volumineux" };
    }
    return { ok: false, motif: "non_recuperable" };
  }
}

/** Exécute `fn` sur chaque élément, `SIMULTANES` à la fois, ordre conservé. */
async function enParallele<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  onFait: (fait: number) => void,
  signal?: AbortSignal,
): Promise<R[]> {
  const resultats = new Array<R>(items.length);
  let suivant = 0;
  let fait = 0;
  const ouvrier = async () => {
    while (suivant < items.length) {
      if (signal?.aborted) throw new DOMException("Annulé", "AbortError");
      const i = suivant++;
      resultats[i] = await fn(items[i], i);
      onFait(++fait);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(SIMULTANES, items.length) }, ouvrier),
  );
  return resultats;
}

function dateDuJour(): string {
  return new Date().toISOString().slice(0, 10);
}

function extensionFichier(nom: string, type: string): string {
  const ext = extensionDe(nom)
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);
  if (ext) return ext;
  if (type === "application/pdf") return "pdf";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  return "";
}

/**
 * Télécharge le dossier COMPLET : une archive ZIP contenant le sommaire PDF de
 * marque et toutes les pièces telles que déposées (PDF, images, Word, Excel…),
 * classées par catégorie. Une pièce introuvable ou trop lourde ne fait pas
 * échouer l'archive : elle est signalée au sommaire et dans le résultat.
 */
export async function telechargerDossierComplet(
  dossier: DossierSousTraitant,
  { onProgress, signal }: OptionsGeneration = {},
): Promise<ResultatArchive> {
  const lignes = construireLignes(dossier);
  const presentes = lignes.filter((l) => l.piece);

  onProgress?.(`Récupération 0/${presentes.length}…`);
  const lectures = await enParallele(
    presentes,
    (l) => recuperer(l.piece?.storageKey, signal),
    (fait) => onProgress?.(`Récupération ${fait}/${presentes.length}…`),
    signal,
  );

  const largeurNumero = Math.max(2, String(presentes.length).length);
  const utilises = new Set<string>();
  const fichiers: ZipEntry[] = [];
  const nonIncluses: PieceNonIncluse[] = [];

  for (let i = 0; i < presentes.length; i++) {
    const ligne: LigneDossier = presentes[i];
    const piece = ligne.piece!;
    const lecture = lectures[i];
    if (!lecture.ok) {
      ligne.mention = MENTION_MOTIF[lecture.motif];
      nonIncluses.push({
        libelle: ligne.libelle,
        fichier: piece.name,
        motif: lecture.motif,
      });
      continue;
    }
    const ext = extensionFichier(piece.name, lecture.blob.type);
    const dossierCat = assainirNom(ligne.categorie) || "Pieces";
    const base = `${String(ligne.numero).padStart(largeurNumero, "0")}-${
      assainirNom(ligne.libelle) || "Piece"
    }`;
    let chemin = `${dossierCat}/${base}${ext ? `.${ext}` : ""}`;
    for (let k = 2; utilises.has(chemin.toLowerCase()); k++) {
      chemin = `${dossierCat}/${base}-${k}${ext ? `.${ext}` : ""}`;
    }
    utilises.add(chemin.toLowerCase());
    ligne.mention = chemin;
    fichiers.push({
      name: chemin,
      data: new Uint8Array(await lecture.blob.arrayBuffer()),
    });
  }

  const notes: string[] = [];
  if (nonIncluses.length > 0) {
    notes.push(
      `${fichiers.length} pièce(s) incluse(s), ${nonIncluses.length} non incluse(s) : ${nonIncluses
        .map((n) => `${n.libelle} (${LIBELLE_MOTIF[n.motif]})`)
        .join(", ")}.`,
    );
  }

  onProgress?.("Création du sommaire PDF…");
  const sommaire = await genererSommairePdf({
    dossier,
    lignes,
    colonne: "Dans l'archive",
    notes,
  });
  if (signal?.aborted) throw new DOMException("Annulé", "AbortError");

  onProgress?.("Assemblage de l'archive…");
  const zip = createZip([
    { name: "00-Sommaire.pdf", data: sommaire },
    ...fichiers,
  ]);

  const nomArchive = `Dossier-${assainirNom(dossier.nom) || "sous-traitant"}-${dateDuJour()}.zip`;
  telechargerBlob(
    new Blob([zip as BlobPart], { type: "application/zip" }),
    nomArchive,
  );

  return {
    nomArchive,
    incluses: fichiers.length,
    nonIncluses,
    octets: zip.length,
  };
}

/**
 * PDF léger : sommaire de marque + pièces image en annexe. Les PDF, Word et
 * Excel n'y sont PAS intégrés (fusion impossible sans bibliothèque) : ce
 * n'est pas le dossier complet, seulement une synthèse.
 */
export async function telechargerSommairePdfSeul(
  dossier: DossierSousTraitant,
  { onProgress, signal }: OptionsGeneration = {},
): Promise<ResultatSommaire> {
  const lignes = construireLignes(dossier);
  const presentes = lignes.filter((l) => l.piece);
  const images = presentes.filter((l) =>
    EXT_IMAGE.includes(extensionDe(l.piece!.name)),
  );

  onProgress?.(`Récupération 0/${images.length}…`);
  const lectures = await enParallele(
    images,
    async (l) => {
      const lecture = await recuperer(l.piece?.storageKey, signal);
      if (!lecture.ok) return lecture;
      try {
        return { ok: true as const, image: await imageVersJpeg(lecture.blob) };
      } catch {
        return { ok: false as const, motif: "non_recuperable" as const };
      }
    },
    (fait) => onProgress?.(`Récupération ${fait}/${images.length}…`),
    signal,
  );

  const annexes: AnnexeImage[] = [];
  const nonIncluses: PieceNonIncluse[] = [];
  presentes.forEach((l) => {
    const i = images.indexOf(l);
    if (i === -1) {
      l.mention = "Fichier joint séparément";
      return;
    }
    const lecture = lectures[i];
    if (lecture.ok) {
      annexes.push({
        titre: `Annexe ${annexes.length + 1} - ${l.libelle}`,
        sousTitre: l.piece!.name,
        ...lecture.image,
      });
      l.mention = `Intégré - annexe ${annexes.length}`;
    } else {
      l.mention = MENTION_MOTIF[lecture.motif];
      nonIncluses.push({
        libelle: l.libelle,
        fichier: l.piece!.name,
        motif: lecture.motif,
      });
    }
  });
  const jointsSeparement = presentes.length - images.length;

  const notes = [
    "Ce PDF est un sommaire : les pièces PDF, Word et Excel n'y sont pas intégrées. Pour le dossier complet, utilisez « Télécharger le dossier » (archive ZIP).",
  ];

  onProgress?.("Création du PDF…");
  const pdf = await genererSommairePdf({
    dossier,
    lignes,
    colonne: "Dans ce PDF",
    annexes,
    notes,
  });
  if (signal?.aborted) throw new DOMException("Annulé", "AbortError");

  telechargerBlob(
    new Blob([pdf as BlobPart], { type: "application/pdf" }),
    `Sommaire-${assainirNom(dossier.nom) || "sous-traitant"}-${dateDuJour()}.pdf`,
  );

  return { integrees: annexes.length, jointsSeparement, nonIncluses };
}
