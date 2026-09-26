/**
 * Grille des salaires 2026 (convention collective de la sécurité privée).
 * Base de référence : 151,67 h par mois.
 *
 * Le salaire mensuel de la grille est la donnée de référence ; le taux horaire
 * est recalculé (salaire / 151,67) plutôt que repris de la capture, dont les
 * arrondis diffèrent d'une ligne à l'autre.
 */

export const BASE_HEURES_MENSUELLE = 151.67;

export interface LigneGrille {
  categorie: string;
  /** « Niveau 2 », « Position II »… */
  niveau: string;
  /** « Échelon 2 », « A »… ; null quand la ligne n'a pas d'échelon. */
  echelon: string | null;
  coefficient: number;
  /** Salaire mensuel 2026 pour 151,67 h (€). */
  salaire: number;
}

const CAT_EXPLOITATION = "I. Agent d'exploitation";
const CAT_MAITRISE = "II. Agents de maîtrise";
const CAT_CADRES = "III. Ingénieurs et cadres";

export const CATEGORIES_GRILLE = [
  CAT_EXPLOITATION,
  CAT_MAITRISE,
  CAT_CADRES,
] as const;

const ligne = (
  categorie: string,
  niveau: string,
  echelon: string | null,
  coefficient: number,
  salaire: number,
): LigneGrille => ({ categorie, niveau, echelon, coefficient, salaire });

export const GRILLE_SALAIRES: readonly LigneGrille[] = [
  ligne(CAT_EXPLOITATION, "Niveau 2", "Échelon 2", 120, 1883.85),
  ligne(CAT_EXPLOITATION, "Niveau 3", "Échelon 1", 130, 1908.54),
  ligne(CAT_EXPLOITATION, "Niveau 3", "Échelon 2", 140, 1965.78),
  ligne(CAT_EXPLOITATION, "Niveau 3", "Échelon 3", 150, 2039.33),
  ligne(CAT_EXPLOITATION, "Niveau 4", "Échelon 1", 160, 2152.09),
  ligne(CAT_EXPLOITATION, "Niveau 4", "Échelon 2", 175, 2327.04),
  ligne(CAT_EXPLOITATION, "Niveau 4", "Échelon 3", 190, 2502.06),
  ligne(CAT_EXPLOITATION, "Niveau 5", "Échelon 1", 210, 2735.99),
  ligne(CAT_EXPLOITATION, "Niveau 5", "Échelon 2", 230, 2969.36),
  ligne(CAT_EXPLOITATION, "Niveau 5", "Échelon 3", 250, 3202.76),
  ligne(CAT_MAITRISE, "Niveau 1", "Échelon 1", 150, 2234.3),
  ligne(CAT_MAITRISE, "Niveau 1", "Échelon 2", 160, 2357.77),
  ligne(CAT_MAITRISE, "Niveau 1", "Échelon 3", 170, 2480.93),
  ligne(CAT_MAITRISE, "Niveau 2", "Échelon 1", 185, 2666.29),
  ligne(CAT_MAITRISE, "Niveau 2", "Échelon 2", 200, 2851.2),
  ligne(CAT_MAITRISE, "Niveau 2", "Échelon 3", 215, 3036.16),
  ligne(CAT_MAITRISE, "Niveau 3", "Échelon 1", 235, 3282.88),
  ligne(CAT_MAITRISE, "Niveau 3", "Échelon 2", 255, 3529.58),
  ligne(CAT_MAITRISE, "Niveau 3", "Échelon 3", 275, 3776.29),
  ligne(CAT_CADRES, "Position I", null, 300, 2968.47),
  ligne(CAT_CADRES, "Position II", "A", 400, 3756.63),
  ligne(CAT_CADRES, "Position II", "B", 470, 4307.92),
  ligne(CAT_CADRES, "Position III", "A", 530, 4780.86),
  ligne(CAT_CADRES, "Position III", "B", 620, 5489.93),
  ligne(CAT_CADRES, "Position III", "C", 800, 6908.48),
];

/** Valeur stockée quand la ligne n'a pas d'échelon. */
export const SANS_ECHELON = "—";

const unique = (valeurs: string[]) => [...new Set(valeurs)];

/** Niveaux / positions proposés pour une catégorie. */
export function niveauxDe(categorie: string): string[] {
  return unique(
    GRILLE_SALAIRES.filter((l) => l.categorie === categorie).map(
      (l) => l.niveau,
    ),
  );
}

/** Échelons proposés pour un niveau (vide si le niveau n'a pas d'échelon). */
export function echelonsDe(categorie: string, niveau: string): string[] {
  return GRILLE_SALAIRES.filter(
    (l) => l.categorie === categorie && l.niveau === niveau && l.echelon,
  ).map((l) => l.echelon as string);
}

export function trouverLigne(
  categorie: string,
  niveau: string,
  echelon: string | null | undefined,
): LigneGrille | undefined {
  const cible = !echelon || echelon === SANS_ECHELON ? null : echelon;
  return GRILLE_SALAIRES.find(
    (l) =>
      l.categorie === categorie && l.niveau === niveau && l.echelon === cible,
  );
}

/** Taux horaire non arrondi : salaire de la grille / 151,67 h. */
export function tauxHoraire(ligneGrille: Pick<LigneGrille, "salaire">): number {
  return ligneGrille.salaire / BASE_HEURES_MENSUELLE;
}

const arrondi = (n: number, decimales: number) => {
  const f = 10 ** decimales;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/** Taux horaire arrondi à 5 décimales, comme dans la grille de référence. */
export function tauxHoraireArrondi(
  ligneGrille: Pick<LigneGrille, "salaire">,
): number {
  return arrondi(tauxHoraire(ligneGrille), 5);
}

/**
 * Salaire mensuel pour un nombre d'heures donné : taux/h × heures, arrondi au
 * centime. Les heures ne sont jamais déduites d'un ratio salaire/taux, elles
 * restent celles saisies par l'utilisateur.
 */
export function salaireProrata(
  ligneGrille: Pick<LigneGrille, "salaire">,
  heures: number,
): number {
  if (!Number.isFinite(heures) || heures <= 0) return 0;
  // salaire × heures / base : une seule division, pour limiter l'erreur.
  return arrondi((ligneGrille.salaire * heures) / BASE_HEURES_MENSUELLE, 2);
}

const formatEuro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export const formaterEuros = (n: number) => formatEuro.format(n);

/** « 12,42072 € / h » : 5 décimales conservées, zéros de fin retirés au-delà de 2. */
export function formaterTaux(n: number): string {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  }).format(n)} € / h`;
}

/** Nombre d'heures tel que saisi : « 108 », « 151,67 ». */
export function formaterHeures(h: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(h)} h`;
}
