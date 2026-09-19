export type CouleurPoste =
  | "blue"
  | "violet"
  | "fuchsia"
  | "emerald"
  | "amber"
  | "teal"
  | "sky"
  | "rose"
  | "orange"
  | "slate";

/**
 * Classes complètes (Tailwind ne détecte pas les noms assemblés) : teinte 700
 * en clair pour rester lisible sur fond blanc, teinte 300 en sombre.
 */
export const CLASSES_POSTE: Record<
  CouleurPoste,
  { nom: string; pastille: string; ligne: string }
> = {
  blue: {
    nom: "text-blue-700 dark:text-blue-300",
    pastille:
      "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    ligne: "border-l-blue-500 bg-blue-500/5",
  },
  violet: {
    nom: "text-violet-700 dark:text-violet-300",
    pastille:
      "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    ligne: "border-l-violet-500 bg-violet-500/5",
  },
  fuchsia: {
    nom: "text-fuchsia-700 dark:text-fuchsia-300",
    pastille:
      "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    ligne: "border-l-fuchsia-500 bg-fuchsia-500/5",
  },
  emerald: {
    nom: "text-emerald-700 dark:text-emerald-300",
    pastille:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    ligne: "border-l-emerald-500 bg-emerald-500/5",
  },
  amber: {
    nom: "text-amber-700 dark:text-amber-300",
    pastille:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    ligne: "border-l-amber-500 bg-amber-500/5",
  },
  teal: {
    nom: "text-teal-700 dark:text-teal-300",
    pastille:
      "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300",
    ligne: "border-l-teal-500 bg-teal-500/5",
  },
  sky: {
    nom: "text-sky-700 dark:text-sky-300",
    pastille: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    ligne: "border-l-sky-500 bg-sky-500/5",
  },
  rose: {
    nom: "text-rose-700 dark:text-rose-300",
    pastille:
      "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    ligne: "border-l-rose-500 bg-rose-500/5",
  },
  orange: {
    nom: "text-orange-700 dark:text-orange-300",
    pastille:
      "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    ligne: "border-l-orange-500 bg-orange-500/5",
  },
  slate: {
    nom: "text-slate-700 dark:text-slate-300",
    pastille:
      "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    ligne: "border-l-slate-500 bg-slate-500/5",
  },
};

/** Couleur d'une qualification (SSIAP 1, SST, CQP/APS…). */
const COULEUR_CERTIFICATION: Record<string, CouleurPoste> = {
  SSIAP1: "blue",
  SSIAP2: "violet",
  SSIAP3: "fuchsia",
  CQP_APS: "emerald",
  CNAPS: "teal",
  SST: "rose",
  VM: "orange",
  H0B0: "amber",
  FIRE: "orange",
};

export function couleurCertification(code: string): CouleurPoste {
  return COULEUR_CERTIFICATION[code] ?? "slate";
}

/**
 * Couleur par type de poste. Les variantes (« SSIAP1 WEEK-END »,
 * « SSIAP2 DIMANCHE »…) gardent la couleur de leur type : on lit d'abord le
 * nom, puis à défaut la qualification exigée.
 */
export function couleurPoste(
  nom: string,
  certifications: string[] = [],
): CouleurPoste {
  const texte = nom
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toUpperCase()
    .replace(/[\s-]+/g, "");

  if (texte.includes("SSIAP3")) return "fuchsia";
  if (texte.includes("SSIAP2")) return "violet";
  if (texte.includes("SSIAP1") || texte.includes("SSIAP")) return "blue";
  if (texte.includes("CHEFDEPOSTE") || texte.includes("CHEF")) return "amber";
  if (
    texte.includes("MAITRECHIEN") ||
    texte.includes("CYNO") ||
    texte.includes("RONDE") ||
    texte.includes("RONDIER")
  )
    return "teal";
  if (texte.includes("SST") || texte.includes("SECOURIS")) return "rose";
  if (
    texte.includes("ACCUEIL") ||
    texte.includes("HOTE") ||
    texte.includes("STANDARD")
  )
    return "sky";
  if (
    texte.includes("APS") ||
    texte.includes("AGENT") ||
    texte.includes("SURVEILLANCE") ||
    texte.includes("GARDIEN")
  )
    return "emerald";
  if (texte.includes("VIDEO") || texte.includes("PCSECURITE")) return "orange";

  if (certifications.includes("SSIAP3")) return "fuchsia";
  if (certifications.includes("SSIAP2")) return "violet";
  if (certifications.includes("SSIAP1")) return "blue";
  if (certifications.includes("CQP_APS")) return "emerald";
  if (certifications.includes("SST")) return "rose";

  const palette: CouleurPoste[] = [
    "blue",
    "violet",
    "emerald",
    "amber",
    "teal",
    "sky",
    "rose",
    "orange",
  ];
  let hash = 0;
  for (const c of texte) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}
