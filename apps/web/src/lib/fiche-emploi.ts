import {
  BASE_HEURES_MENSUELLE,
  salaireProrata,
  tauxHoraireArrondi,
  trouverLigne,
  type LigneGrille,
} from "@/lib/grille-salaires";

/**
 * Fiche « Emploi » d'un salarié : position dans la grille des salaires et
 * période d'essai. Le modèle Member n'a pas ces champs (pas de migration sur la
 * base partagée) : la fiche est tenue dans le registre `fiche_emploi`.
 */
export type BaseHeures = "151.67" | "autres";

export interface FicheEmploi {
  categorie: string;
  niveau: string;
  /** SANS_ECHELON quand la ligne de grille n'en a pas ; "" tant que non choisi. */
  echelon: string;
  coefficient: number | null;
  tauxHoraire: number | null;
  salaireMensuel: number | null;
  base: BaseHeures;
  /** Heures saisies telles quelles avec la base « Autres » (ex. 108). */
  heuresManuelles: number | null;
  debutEssai: string;
  finEssai: string;
}

export const FICHE_EMPLOI_VIDE: FicheEmploi = {
  categorie: "",
  niveau: "",
  echelon: "",
  coefficient: null,
  tauxHoraire: null,
  salaireMensuel: null,
  base: "151.67",
  heuresManuelles: null,
  debutEssai: "",
  finEssai: "",
};

/** Heures retenues pour le calcul : 151,67 h ou la saisie manuelle. */
export function heuresRetenues(fiche: FicheEmploi): number | null {
  if (fiche.base === "151.67") return BASE_HEURES_MENSUELLE;
  return fiche.heuresManuelles && fiche.heuresManuelles > 0
    ? fiche.heuresManuelles
    : null;
}

/**
 * Recalcule coefficient, taux et salaire à partir de la grille. Les heures
 * manuelles ne sont jamais modifiées : elles restent celles saisies.
 */
export function recalculerFiche(fiche: FicheEmploi): FicheEmploi {
  const ligneGrille: LigneGrille | undefined = trouverLigne(
    fiche.categorie,
    fiche.niveau,
    fiche.echelon,
  );
  if (!ligneGrille) {
    return {
      ...fiche,
      coefficient: null,
      tauxHoraire: null,
      salaireMensuel: null,
    };
  }
  const heures = heuresRetenues(fiche);
  return {
    ...fiche,
    coefficient: ligneGrille.coefficient,
    tauxHoraire: tauxHoraireArrondi(ligneGrille),
    salaireMensuel:
      heures === null
        ? null
        : fiche.base === "151.67"
          ? ligneGrille.salaire
          : salaireProrata(ligneGrille, heures),
  };
}

/** Relit une fiche enregistrée (meta JSON) en tolérant les champs absents. */
export function ficheDepuisMeta(meta: Record<string, unknown>): FicheEmploi {
  const texte = (v: unknown) => (typeof v === "string" ? v : "");
  const nombre = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  return {
    categorie: texte(meta.categorie),
    niveau: texte(meta.niveau),
    echelon: texte(meta.echelon),
    coefficient: nombre(meta.coefficient),
    tauxHoraire: nombre(meta.tauxHoraire),
    salaireMensuel: nombre(meta.salaireMensuel),
    base: meta.base === "autres" ? "autres" : "151.67",
    heuresManuelles: nombre(meta.heuresManuelles),
    debutEssai: texte(meta.debutEssai),
    finEssai: texte(meta.finEssai),
  };
}

// --- Période d'essai -------------------------------------------------------

const enUtc = (iso: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const versIso = (d: Date) => d.toISOString().slice(0, 10);

/** Ajoute des mois sans déborder sur le mois suivant (31 janv. + 1 mois = 28/29 févr.). */
function ajouterMois(d: Date, mois: number): Date {
  const r = new Date(d.getTime());
  const jour = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + mois);
  const dernier = new Date(
    Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0),
  ).getUTCDate();
  r.setUTCDate(Math.min(jour, dernier));
  return r;
}

export function ajouterJours(iso: string, jours: number): string {
  const d = enUtc(iso);
  if (!d) return "";
  d.setUTCDate(d.getUTCDate() + jours);
  return versIso(d);
}

/**
 * Fin d'essai proposée (modifiable) selon le type de contrat :
 * - CDI : 2 mois (employés), 3 mois (agents de maîtrise), 4 mois (cadres) ;
 * - CDD : 14 jours (plafond légal pour un contrat de 6 mois au plus) ;
 * - apprentissage : 45 jours. Stage / intérim : pas de période d'essai proposée.
 */
export function finEssaiProposee(
  debut: string,
  contrat: string | undefined,
  categorie: string,
): string {
  const d = enUtc(debut);
  if (!d) return "";
  const veille = (fin: Date) => versIso(new Date(fin.getTime() - 86_400_000));
  if (contrat === "CDI") {
    const mois = categorie.startsWith("III")
      ? 4
      : categorie.startsWith("II.")
        ? 3
        : 2;
    return veille(ajouterMois(d, mois));
  }
  if (contrat === "CDD") return ajouterJours(debut, 13);
  if (contrat === "APPRENTICESHIP") return ajouterJours(debut, 44);
  return "";
}

/** Décalage en jours entre deux dates ISO (null si l'une est invalide). */
export function ecartJours(de: string, a: string): number | null {
  const d1 = enUtc(de);
  const d2 = enUtc(a);
  if (!d1 || !d2) return null;
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000);
}
