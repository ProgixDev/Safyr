/**
 * Couleurs communes des écrans Santé & Formation (AKTO, médecine du travail,
 * DUERP). Le client attend partout la même lecture : vert = validé / apte /
 * faible, orange = créé / en attente / moyen, rouge = refusé / inapte /
 * élevé, bleu = archivé.
 *
 * Chaque teinte porte fond, bordure et texte en clair ET en sombre : un badge
 * seulement teinté en clair devenait illisible sur le thème sombre.
 */
export const TEINTES = {
  vert: "border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300",
  orange:
    "border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  rouge:
    "border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300",
  bleu: "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  violet:
    "border-violet-300 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  gris: "border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300",
  /** Rouge foncé plein : niveau « critique » du DUERP, plus grave que « élevé ». */
  critique:
    "border-red-900 bg-red-800 text-white dark:border-red-700 dark:bg-red-900 dark:text-red-50",
} as const;

export type Teinte = keyof typeof TEINTES;

/** Pastille d'un cadre de synthèse (fond, bordure, titre et icône). */
export const CADRES = {
  vert: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
    icon: "text-green-500",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-700 dark:text-orange-300",
    icon: "text-orange-500",
  },
  rouge: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    icon: "text-red-500",
  },
  bleu: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    icon: "text-blue-500",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    text: "text-violet-700 dark:text-violet-300",
    icon: "text-violet-500",
  },
  critique: {
    bg: "bg-red-100 dark:bg-red-950/60",
    border: "border-red-800 dark:border-red-700",
    text: "text-red-900 dark:text-red-200",
    icon: "text-red-800 dark:text-red-400",
  },
} as const;

/** Statuts d'un dossier AKTO / OPCO. */
export const STATUTS_DOSSIER = ["Créé", "Refusé", "Validé", "Archivé"] as const;
export type StatutDossier = (typeof STATUTS_DOSSIER)[number];

export const TEINTE_STATUT_DOSSIER: Record<StatutDossier, Teinte> = {
  Créé: "orange",
  Refusé: "rouge",
  Validé: "vert",
  Archivé: "bleu",
};

/**
 * Les dossiers enregistrés avant la simplification à quatre statuts portent
 * « À créer », « En cours » ou « Soumis » : ils comptent comme « Créé ».
 */
export function normaliserStatutDossier(statut: unknown): StatutDossier {
  return (STATUTS_DOSSIER as readonly string[]).includes(statut as string)
    ? (statut as StatutDossier)
    : "Créé";
}
