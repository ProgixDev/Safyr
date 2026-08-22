import type { ComplianceItem } from "@safyr/api-client";

/**
 * Règles de renouvellement des documents administratifs, telles que définies
 * par le client.
 *
 * Chaque pièce a sa propre durée de validité et son propre préavis : le calcul
 * précédent appliquait un préavis unique et alertait sur des documents qui ne
 * sont pas soumis à échéance, comme la CNI.
 */
export interface RegleRenouvellement {
  /** Durée de validité, en mois. */
  validiteMois: number;
  /** Préavis d'alerte, en jours avant l'échéance. */
  preavisJours: number;
  /** Libellé de la cadence, affiché dans l'alerte. */
  cadence: string;
}

const QUINZE_JOURS = 15;
const TROIS_MOIS = 90;

export const REGLES_RENOUVELLEMENT: Record<string, RegleRenouvellement> = {
  fiscale: {
    validiteMois: 6,
    preavisJours: QUINZE_JOURS,
    cadence: "valable 6 mois",
  },
  urssaf: {
    validiteMois: 6,
    preavisJours: QUINZE_JOURS,
    cadence: "valable 6 mois",
  },
  kbis: {
    validiteMois: 3,
    preavisJours: QUINZE_JOURS,
    cadence: "valable 3 mois",
  },
  assurance_rc: {
    validiteMois: 12,
    preavisJours: QUINZE_JOURS,
    cadence: "valable 1 an",
  },
  carte_pro_dirigeant: {
    validiteMois: 60,
    preavisJours: TROIS_MOIS,
    cadence: "valable 5 ans",
  },
  carte_pro_member: {
    validiteMois: 60,
    preavisJours: TROIS_MOIS,
    cadence: "valable 5 ans",
  },
  carte_pro_entreprise: {
    validiteMois: 99 * 12,
    preavisJours: TROIS_MOIS,
    cadence: "autorisation d'exercice CNAPS",
  },
};

/** Cadences conservées pour les écrans qui les affichent encore. */
export const RENEWAL_MONTHS: Record<string, number> = Object.fromEntries(
  Object.entries(REGLES_RENOUVELLEMENT).map(([type, r]) => [
    type,
    r.validiteMois,
  ]),
);

/** Types soumis à une date d'expiration — les autres n'en demandent pas. */
export const EXPIRY_TYPES = new Set(Object.keys(REGLES_RENOUVELLEMENT));

export function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export type DocAlert = {
  id: string;
  label: string;
  message: string;
  level: "danger" | "warning";
  date?: string;
};

/** Date d'échéance d'une pièce : celle saisie, sinon déduite du dépôt. */
function echeanceDe(
  doc: { expiryDate?: string | null; createdAt: string },
  regle: RegleRenouvellement,
): Date {
  return doc.expiryDate
    ? new Date(doc.expiryDate)
    : addMonths(new Date(doc.createdAt), regle.validiteMois);
}

export function computeDocumentAlerts(items: ComplianceItem[]): DocAlert[] {
  const maintenant = new Date();
  const alerts: DocAlert[] = [];

  for (const item of items) {
    const { type, name, id, isRequired } = item.requirement;
    const regle = REGLES_RENOUVELLEMENT[type];
    const doc = item.document;

    // Pièce non soumise à renouvellement (CNI, RIB, statuts…) : jamais d'alerte
    // d'échéance. Seule l'absence d'une pièce obligatoire est signalée.
    if (!regle) {
      if (!doc && isRequired) {
        alerts.push({
          id,
          label: name,
          message: "À téléverser",
          level: "danger",
        });
      }
      continue;
    }

    if (!doc) {
      if (isRequired) {
        alerts.push({
          id,
          label: name,
          message: `À téléverser (${regle.cadence})`,
          level: "danger",
        });
      }
      continue;
    }

    const echeance = echeanceDe(doc, regle);
    const preavis = new Date(maintenant);
    preavis.setDate(preavis.getDate() + regle.preavisJours);
    const preavisTexte =
      regle.preavisJours >= 90 ? "3 mois" : `${regle.preavisJours} jours`;

    if (echeance < maintenant) {
      alerts.push({
        id,
        label: name,
        message: `Expiré (${regle.cadence})`,
        level: "danger",
        date: echeance.toISOString(),
      });
    } else if (echeance < preavis) {
      alerts.push({
        id,
        label: name,
        message: `À renouveler sous ${preavisTexte} (${regle.cadence})`,
        level: "warning",
        date: echeance.toISOString(),
      });
    }
  }

  return alerts.sort((a, b) =>
    a.level === b.level ? 0 : a.level === "danger" ? -1 : 1,
  );
}
