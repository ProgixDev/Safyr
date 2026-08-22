/**
 * Règles de validité et d'alerte des documents administratifs.
 *
 * Chaque pièce a sa propre durée de validité et son propre préavis : le
 * système appliquait un préavis unique de 30 jours à toutes, et réclamait une
 * date d'expiration même aux pièces qui n'en ont pas (la CNI, par exemple).
 * Règles fournies par le client, alignées sur les usages CNAPS et URSSAF.
 */
export interface RegleDocument {
  /** Durée de validité en mois. */
  validiteMois: number;
  /** Préavis d'alerte, en jours avant l'échéance. */
  preavisJours: number;
}

const TROIS_MOIS = 90;
const QUINZE_JOURS = 15;

export const REGLES_DOCUMENTS: Record<string, RegleDocument> = {
  // Attestations : validité courte, préavis de quinze jours.
  fiscale: { validiteMois: 6, preavisJours: QUINZE_JOURS },
  urssaf: { validiteMois: 6, preavisJours: QUINZE_JOURS },
  kbis: { validiteMois: 3, preavisJours: QUINZE_JOURS },
  assurance_rc: { validiteMois: 12, preavisJours: QUINZE_JOURS },

  // Cartes professionnelles et autorisation d'exercice : préavis de trois mois.
  carte_pro_dirigeant: { validiteMois: 60, preavisJours: TROIS_MOIS },
  carte_pro_member: { validiteMois: 60, preavisJours: TROIS_MOIS },
  carte_pro_entreprise: { validiteMois: 99 * 12, preavisJours: TROIS_MOIS },
};

/** Documents sans échéance : ni date d'expiration demandée, ni alerte. */
export const DOCUMENTS_SANS_EXPIRATION = new Set([
  "cni_dirigeant",
  "id_card",
  "health_card",
  "cv",
  "proof_address",
  "dpae",
  "due",
  "rib",
  "statuts",
  "pv_ag",
]);

export function regleDe(type: string): RegleDocument | null {
  if (DOCUMENTS_SANS_EXPIRATION.has(type)) return null;
  return REGLES_DOCUMENTS[type] ?? null;
}

/**
 * Statut d'une pièce au regard de son échéance : `expired`, `expiring`
 * (dans le préavis propre au document) ou `valid`.
 */
export function statutEcheance(
  type: string,
  expiryDate: Date | null | undefined,
): string {
  const regle = regleDe(type);
  if (!regle || !expiryDate) return "valid";
  const maintenant = Date.now();
  const echeance = expiryDate.getTime();
  if (echeance < maintenant) return "expired";
  if (echeance < maintenant + regle.preavisJours * 24 * 60 * 60 * 1000)
    return "expiring";
  return "valid";
}

/** Date d'expiration déduite de la date de dépôt, selon la règle du document. */
export function echeanceDepuisDepot(type: string, depot: Date): Date | null {
  const regle = regleDe(type);
  if (!regle) return null;
  const echeance = new Date(depot);
  echeance.setMonth(echeance.getMonth() + regle.validiteMois);
  return echeance;
}
