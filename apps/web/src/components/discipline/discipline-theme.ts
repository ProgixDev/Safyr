/**
 * Couleurs de l'écran Discipline : une teinte par section (Sanctions = ambre,
 * Procédures = violet, Registre = vert). Les classes sont écrites en entier
 * pour que Tailwind les détecte, et lisibles en thème clair comme sombre.
 */
export type SectionDiscipline = "sanctions" | "procedures" | "registre";

interface Teinte {
  /** Onglet : repos, survol et état actif (plein, texte blanc). */
  onglet: string;
  /** Pastille de l'icône de titre. */
  pastille: string;
  /** Bouton principal de la section. */
  bouton: string;
  /** Carte du tableau. */
  carte: string;
  /** En-tête de la carte du tableau. */
  entete: string;
  /** Titre de la carte. */
  titre: string;
}

export const TEINTES: Record<SectionDiscipline, Teinte> = {
  sanctions: {
    onglet:
      "border border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200 data-[state=active]:border-amber-500 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:hover:bg-amber-600 data-[state=active]:hover:text-white dark:data-[state=active]:text-white",
    pastille: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    bouton:
      "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950",
    carte: "border-amber-500/30",
    entete: "border-b border-amber-500/20 bg-amber-500/10",
    titre: "text-amber-700 dark:text-amber-300",
  },
  procedures: {
    onglet:
      "border border-violet-500/30 bg-violet-500/10 text-violet-700 hover:bg-violet-500/20 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200 data-[state=active]:border-violet-500 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:hover:bg-violet-600 data-[state=active]:hover:text-white dark:data-[state=active]:text-white",
    pastille: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    bouton:
      "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400 dark:text-slate-950",
    carte: "border-violet-500/30",
    entete: "border-b border-violet-500/20 bg-violet-500/10",
    titre: "text-violet-700 dark:text-violet-300",
  },
  registre: {
    onglet:
      "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200 data-[state=active]:border-emerald-500 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:hover:bg-emerald-600 data-[state=active]:hover:text-white dark:data-[state=active]:text-white",
    pastille: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    bouton:
      "border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/15 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200",
    carte: "border-emerald-500/30",
    entete: "border-b border-emerald-500/20 bg-emerald-500/10",
    titre: "text-emerald-700 dark:text-emerald-300",
  },
};

/** Pastilles de statut : couleur pleine et lisible en clair comme en sombre. */
export const BADGE_ROUGE =
  "border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300";
export const BADGE_VERT =
  "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
export const BADGE_BLEU =
  "border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300";
export const BADGE_GRIS =
  "border-slate-500/40 bg-slate-500/15 text-slate-700 dark:text-slate-300";
export const BADGE_ORANGE =
  "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300";
export const BADGE_VIOLET =
  "border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-300";
