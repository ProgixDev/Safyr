/**
 * Couleur par onglet du dossier salarié. Les classes sont écrites en toutes
 * lettres (Tailwind ne détecte pas les noms de classes assemblés) ; les
 * sélecteurs sur `data-slot` colorent les cartes de l'onglet sans toucher à
 * leur contenu.
 */
export interface ThemeOnglet {
  /** Onglet actif dans la barre. */
  actif: string;
  /** Icône de l'onglet dans la barre. */
  icone: string;
  /** Bandeau d'en-tête de la page. */
  bandeau: string;
  /** Pastille de l'icône du bandeau. */
  pastille: string;
  /** Titre du bandeau. */
  titre: string;
  /** Cartes de la page : liseré supérieur et titres colorés. */
  contenu: string;
}

export const THEMES_ONGLETS: Record<string, ThemeOnglet> = {
  info: {
    actif:
      "data-[state=active]:bg-sky-500/15 data-[state=active]:text-sky-700 data-[state=active]:border-sky-500/40 dark:data-[state=active]:text-sky-300",
    icone: "text-sky-600 dark:text-sky-400",
    bandeau:
      "border-sky-200 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/30",
    pastille: "bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300",
    titre: "text-sky-800 dark:text-sky-200",
    contenu:
      "[&_[data-slot=card]]:border-t-2 [&_[data-slot=card]]:border-t-sky-500/70 [&_[data-slot=card-title]]:text-sky-700 dark:[&_[data-slot=card-title]]:text-sky-300",
  },
  documents: {
    actif:
      "data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-700 data-[state=active]:border-violet-500/40 dark:data-[state=active]:text-violet-300",
    icone: "text-violet-600 dark:text-violet-400",
    bandeau:
      "border-violet-200 bg-violet-50 dark:border-violet-900/60 dark:bg-violet-950/30",
    pastille:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
    titre: "text-violet-800 dark:text-violet-200",
    contenu:
      "[&_[data-slot=card]]:border-t-2 [&_[data-slot=card]]:border-t-violet-500/70 [&_[data-slot=card-title]]:text-violet-700 dark:[&_[data-slot=card-title]]:text-violet-300",
  },
  contracts: {
    actif:
      "data-[state=active]:bg-indigo-500/15 data-[state=active]:text-indigo-700 data-[state=active]:border-indigo-500/40 dark:data-[state=active]:text-indigo-300",
    icone: "text-indigo-600 dark:text-indigo-400",
    bandeau:
      "border-indigo-200 bg-indigo-50 dark:border-indigo-900/60 dark:bg-indigo-950/30",
    pastille:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
    titre: "text-indigo-800 dark:text-indigo-200",
    contenu:
      "[&_[data-slot=card]]:border-t-2 [&_[data-slot=card]]:border-t-indigo-500/70 [&_[data-slot=card-title]]:text-indigo-700 dark:[&_[data-slot=card-title]]:text-indigo-300",
  },
  avantage: {
    actif:
      "data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-700 data-[state=active]:border-amber-500/40 dark:data-[state=active]:text-amber-300",
    icone: "text-amber-600 dark:text-amber-400",
    bandeau:
      "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30",
    pastille:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
    titre: "text-amber-800 dark:text-amber-200",
    contenu:
      "[&_[data-slot=card]]:border-t-2 [&_[data-slot=card]]:border-t-amber-500/70 [&_[data-slot=card-title]]:text-amber-700 dark:[&_[data-slot=card-title]]:text-amber-300",
  },
  equipment: {
    actif:
      "data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-700 data-[state=active]:border-orange-500/40 dark:data-[state=active]:text-orange-300",
    icone: "text-orange-600 dark:text-orange-400",
    bandeau:
      "border-orange-200 bg-orange-50 dark:border-orange-900/60 dark:bg-orange-950/30",
    pastille:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300",
    titre: "text-orange-800 dark:text-orange-200",
    contenu:
      "[&_[data-slot=card]]:border-t-2 [&_[data-slot=card]]:border-t-orange-500/70 [&_[data-slot=card-title]]:text-orange-700 dark:[&_[data-slot=card-title]]:text-orange-300",
  },
  badges: {
    actif:
      "data-[state=active]:bg-teal-500/15 data-[state=active]:text-teal-700 data-[state=active]:border-teal-500/40 dark:data-[state=active]:text-teal-300",
    icone: "text-teal-600 dark:text-teal-400",
    bandeau:
      "border-teal-200 bg-teal-50 dark:border-teal-900/60 dark:bg-teal-950/30",
    pastille:
      "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300",
    titre: "text-teal-800 dark:text-teal-200",
    contenu:
      "[&_[data-slot=card]]:border-t-2 [&_[data-slot=card]]:border-t-teal-500/70 [&_[data-slot=card-title]]:text-teal-700 dark:[&_[data-slot=card-title]]:text-teal-300",
  },
  savings: {
    actif:
      "data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-500/40 dark:data-[state=active]:text-emerald-300",
    icone: "text-emerald-600 dark:text-emerald-400",
    bandeau:
      "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30",
    pastille:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
    titre: "text-emerald-800 dark:text-emerald-200",
    contenu:
      "[&_[data-slot=card]]:border-t-2 [&_[data-slot=card]]:border-t-emerald-500/70 [&_[data-slot=card-title]]:text-emerald-700 dark:[&_[data-slot=card-title]]:text-emerald-300",
  },
  discipline: {
    actif:
      "data-[state=active]:bg-rose-500/15 data-[state=active]:text-rose-700 data-[state=active]:border-rose-500/40 dark:data-[state=active]:text-rose-300",
    icone: "text-rose-600 dark:text-rose-400",
    bandeau:
      "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30",
    pastille:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
    titre: "text-rose-800 dark:text-rose-200",
    contenu:
      "[&_[data-slot=card]]:border-t-2 [&_[data-slot=card]]:border-t-rose-500/70 [&_[data-slot=card-title]]:text-rose-700 dark:[&_[data-slot=card-title]]:text-rose-300",
  },
  cse: {
    actif:
      "data-[state=active]:bg-fuchsia-500/15 data-[state=active]:text-fuchsia-700 data-[state=active]:border-fuchsia-500/40 dark:data-[state=active]:text-fuchsia-300",
    icone: "text-fuchsia-600 dark:text-fuchsia-400",
    bandeau:
      "border-fuchsia-200 bg-fuchsia-50 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/30",
    pastille:
      "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/60 dark:text-fuchsia-300",
    titre: "text-fuchsia-800 dark:text-fuchsia-200",
    contenu:
      "[&_[data-slot=card]]:border-t-2 [&_[data-slot=card]]:border-t-fuchsia-500/70 [&_[data-slot=card-title]]:text-fuchsia-700 dark:[&_[data-slot=card-title]]:text-fuchsia-300",
  },
  geolocation: {
    actif:
      "data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-700 data-[state=active]:border-cyan-500/40 dark:data-[state=active]:text-cyan-300",
    icone: "text-cyan-600 dark:text-cyan-400",
    bandeau:
      "border-cyan-200 bg-cyan-50 dark:border-cyan-900/60 dark:bg-cyan-950/30",
    pastille:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300",
    titre: "text-cyan-800 dark:text-cyan-200",
    contenu:
      "[&_[data-slot=card]]:border-t-2 [&_[data-slot=card]]:border-t-cyan-500/70 [&_[data-slot=card-title]]:text-cyan-700 dark:[&_[data-slot=card-title]]:text-cyan-300",
  },
};
