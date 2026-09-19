import type { PayrollVariableType } from "@/lib/types";

/**
 * Définitions centralisées des primes et indemnités de la paie.
 *
 * Chaque prime dit COMMENT elle se calcule :
 *  - `quantite_x_unitaire` : nombre × montant unitaire (paniers, jours…) ;
 *  - `heures_x_taux`       : heures de paie × taux horaire (habillage…) ;
 *  - `montant_global`      : un seul montant saisi.
 *
 * Le montant par défaut est celui de l'année en cours ; il est modifiable
 * chaque année dans « Paramètres des primes » (enregistré en base).
 */
export type ModeCalculPrime =
  | "quantite_x_unitaire"
  | "heures_x_taux"
  | "montant_global";

export type PrimeId = Exclude<PayrollVariableType, `h_${string}`>;

export interface PrimeDefinition {
  id: PrimeId;
  label: string;
  mode: ModeCalculPrime;
  /** Montant unitaire (ou global) proposé par défaut. */
  montantDefaut: number;
  /** Libellé du champ quantité (modes `quantite_x_unitaire` et `heures_x_taux`). */
  quantiteLabel?: string;
  /** Unité écrite à côté de la quantité dans le détail du calcul. */
  unite?: string;
  /** Libellé du montant unitaire ou global. */
  montantLabel: string;
  /** Le montant change-t-il chaque année (paniers, taux…) ? */
  annuel: boolean;
  /** Prime à libellé libre (« Autre prime »). */
  libelleLibre?: boolean;
  aide?: string;
}

/** SMIC horaire brut 2026 : base du taux d'habillage par défaut. */
export const SMIC_HORAIRE_2026 = 12.02;
/** Part du temps de travail indemnisée au titre de l'habillage (par défaut). */
export const PART_HABILLAGE_PAR_DEFAUT = 0.02;

export const TAUX_HABILLAGE_PAR_DEFAUT =
  Math.round(SMIC_HORAIRE_2026 * PART_HABILLAGE_PAR_DEFAUT * 100) / 100;

export const PRIMES: readonly PrimeDefinition[] = [
  {
    id: "indemnite_habillage",
    label: "Indemnité d'habillage",
    mode: "heures_x_taux",
    montantDefaut: TAUX_HABILLAGE_PAR_DEFAUT,
    quantiteLabel: "Heures de paie",
    unite: "h",
    montantLabel: "Taux d'habillage (€ / heure de paie)",
    annuel: true,
    aide: "Par défaut : 2 % du SMIC horaire. Remplacez par l'indemnité prévue par votre convention collective.",
  },
  {
    id: "nbre_paniers",
    label: "Prime de panier",
    mode: "quantite_x_unitaire",
    montantDefaut: 4.48,
    quantiteLabel: "Nombre de paniers",
    unite: "paniers",
    montantLabel: "Montant par panier (€)",
    annuel: true,
    aide: "Le montant du panier est revalorisé chaque année.",
  },
  {
    id: "frais_restauration",
    label: "Frais de restauration",
    mode: "quantite_x_unitaire",
    montantDefaut: 12,
    quantiteLabel: "Nombre de jours",
    unite: "jours",
    montantLabel: "Montant par jour (€)",
    annuel: true,
  },
  {
    id: "nbre_deplacement",
    label: "Frais de déplacement",
    mode: "quantite_x_unitaire",
    montantDefaut: 8,
    quantiteLabel: "Nombre de jours",
    unite: "jours",
    montantLabel: "Montant par jour (€)",
    annuel: true,
  },
  {
    id: "tenue",
    label: "Prime d'entretien de tenue",
    mode: "montant_global",
    montantDefaut: 150,
    montantLabel: "Montant mensuel (€)",
    annuel: true,
  },
  {
    id: "autres_indemnites",
    label: "Autre prime",
    mode: "montant_global",
    montantDefaut: 0,
    montantLabel: "Montant (€)",
    annuel: false,
    libelleLibre: true,
  },
  {
    id: "prime",
    label: "Prime exceptionnelle",
    mode: "montant_global",
    montantDefaut: 0,
    montantLabel: "Montant (€)",
    annuel: false,
  },
  {
    id: "prime_anciennete",
    label: "Prime d'ancienneté",
    mode: "montant_global",
    montantDefaut: 0,
    montantLabel: "Montant (€)",
    annuel: false,
  },
  {
    id: "treizieme_mois",
    label: "13ème mois",
    mode: "montant_global",
    montantDefaut: 0,
    montantLabel: "Montant (€)",
    annuel: false,
  },
  {
    id: "astreinte",
    label: "Indemnité d'astreinte",
    mode: "quantite_x_unitaire",
    montantDefaut: 0,
    quantiteLabel: "Nombre de jours d'astreinte",
    unite: "jours",
    montantLabel: "Montant par jour (€)",
    annuel: true,
  },
  {
    id: "majoration_dimanche_ferie",
    label: "Majoration dimanche / jours fériés",
    mode: "quantite_x_unitaire",
    montantDefaut: 0,
    quantiteLabel: "Nombre d'heures",
    unite: "h",
    montantLabel: "Majoration par heure (€)",
    annuel: true,
  },
];

const PAR_ID = new Map<string, PrimeDefinition>(PRIMES.map((p) => [p.id, p]));

export function primeParId(id: string): PrimeDefinition | undefined {
  return PAR_ID.get(id);
}

/** Libellés de tous les types de variables (heures comprises). */
export const LIBELLES_VARIABLES: Record<PayrollVariableType, string> = {
  h_jour: "H Jour",
  h_dimanche: "H Dimanche",
  h_ferie: "H Férié",
  h_nuit: "H Nuit",
  h_dimanche_nuit: "H Dimanche Nuit",
  h_ferie_nuit: "H Férié Nuit",
  h_supp_25: "H Supp 25%",
  h_supp_50: "H Supp 50%",
  h_compl_10: "H Compl 10%",
  nbre_paniers: "Prime de panier",
  frais_restauration: "Frais de restauration",
  prime: "Prime exceptionnelle",
  indemnite_habillage: "Indemnité d'habillage",
  tenue: "Prime d'entretien de tenue",
  nbre_deplacement: "Frais de déplacement",
  autres_indemnites: "Autre prime",
  prime_anciennete: "Prime d'ancienneté",
  treizieme_mois: "13ème mois",
  astreinte: "Indemnité d'astreinte",
  majoration_dimanche_ferie: "Majoration dimanche / jours fériés",
};

export function libelleVariable(type: string): string {
  return LIBELLES_VARIABLES[type as PayrollVariableType] ?? type;
}

// ── Nombres ────────────────────────────────────────────────────────────

export const arrondi2 = (n: number): number =>
  Math.round((n + Number.EPSILON) * 100) / 100;

/** « 12,5 » ou « 12.5 » → 12.5 ; vide ou invalide → 0. */
export function lireNombre(saisie: string | number | undefined | null): number {
  if (typeof saisie === "number") return Number.isFinite(saisie) ? saisie : 0;
  if (!saisie) return 0;
  const n = Number.parseFloat(String(saisie).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function formaterEuros(n: number): string {
  return `${arrondi2(n).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

/** Valeur d'un champ <input type="number"> : point décimal obligatoire. */
export const versSaisie = (n: number): string => String(arrondi2(n));

/** Nombre sans zéros inutiles, virgule française (26 → « 26 », 4.5 → « 4,5 »). */
export function formaterNombre(n: number): string {
  return String(arrondi2(n)).replace(".", ",");
}

// ── Ligne de saisie ────────────────────────────────────────────────────

export interface LignePrime {
  /** Clé locale stable (liste React). */
  cle: string;
  /** Variable de paie existante (modification). */
  recordId?: string;
  primeId: PrimeId;
  quantite: string;
  unitaire: string;
  montant: string;
  /** Habillage : heures saisies à la main, elles remplacent le calcul auto. */
  heuresManuelles: string;
  /** Libellé libre (autre prime) ou note. */
  libelle: string;
}

let compteur = 0;
export const nouvelleCle = () => `ligne-${Date.now()}-${compteur++}`;

export function ligneVide(
  primeId: PrimeId,
  unitaire: number | undefined,
): LignePrime {
  const def = primeParId(primeId);
  const defaut = unitaire ?? def?.montantDefaut ?? 0;
  return {
    cle: nouvelleCle(),
    primeId,
    quantite: "",
    unitaire: def?.mode === "montant_global" ? "" : versSaisie(defaut),
    montant: def?.mode === "montant_global" && defaut ? versSaisie(defaut) : "",
    heuresManuelles: "",
    libelle: "",
  };
}

/** Heures retenues pour l'habillage : saisie manuelle si renseignée, sinon heures de paie. */
export function heuresRetenues(
  ligne: Pick<LignePrime, "heuresManuelles">,
  heuresAuto: number,
): number {
  const manuel = ligne.heuresManuelles.trim();
  return manuel !== "" ? lireNombre(manuel) : heuresAuto;
}

/** Total en euros d'une ligne de saisie. */
export function totalLigne(ligne: LignePrime, heuresAuto: number): number {
  const def = primeParId(ligne.primeId);
  if (!def) return arrondi2(lireNombre(ligne.montant));
  if (def.mode === "montant_global") return arrondi2(lireNombre(ligne.montant));
  if (def.mode === "heures_x_taux") {
    return arrondi2(
      heuresRetenues(ligne, heuresAuto) * lireNombre(ligne.unitaire),
    );
  }
  return arrondi2(lireNombre(ligne.quantite) * lireNombre(ligne.unitaire));
}

// ── Description enregistrée avec la variable ───────────────────────────
// La table des variables ne stocke qu'un montant : le détail du calcul est
// écrit dans la description (« 26 jours × 12 € — note ») pour pouvoir le
// réafficher et le modifier.

const MOTIF_CALCUL =
  /^(\d+(?:,\d+)?) (\S+) × (\d+(?:,\d+)?) €(?:\/h)?(?: \((heures manuelles|heures de paie)\))?(?: — (.*))?$/;

export interface CalculDecode {
  quantite: number;
  unite: string;
  unitaire: number;
  manuel: boolean;
  note: string;
}

export function decoderCalcul(
  description: string | null | undefined,
): CalculDecode | null {
  if (!description) return null;
  const m = MOTIF_CALCUL.exec(description.trim());
  if (!m) return null;
  return {
    quantite: lireNombre(m[1]),
    unite: m[2],
    unitaire: lireNombre(m[3]),
    manuel: m[4] === "heures manuelles",
    note: m[5] ?? "",
  };
}

export function encoderDescription(
  ligne: LignePrime,
  heuresAuto: number,
): string {
  const def = primeParId(ligne.primeId);
  const note = ligne.libelle.trim();
  if (!def || def.mode === "montant_global") return note;
  const unitaire = formaterNombre(lireNombre(ligne.unitaire));
  const suffixeNote = note ? ` — ${note}` : "";
  if (def.mode === "heures_x_taux") {
    const manuel = ligne.heuresManuelles.trim() !== "";
    const heures = formaterNombre(heuresRetenues(ligne, heuresAuto));
    return `${heures} h × ${unitaire} €/h (${
      manuel ? "heures manuelles" : "heures de paie"
    })${suffixeNote}`;
  }
  const quantite = formaterNombre(lireNombre(ligne.quantite));
  return `${quantite} ${def.unite ?? ""} × ${unitaire} €${suffixeNote}`;
}

/** Reconstitue une ligne de saisie depuis une variable enregistrée. */
export function ligneDepuisVariable(
  v: { id: string; type: string; amount: number; description?: string | null },
  unitaireParDefaut: number,
): LignePrime {
  const def = primeParId(v.type);
  const primeId = (def?.id ?? "autres_indemnites") as PrimeId;
  const calcul = decoderCalcul(v.description);
  const base = ligneVide(primeId, unitaireParDefaut);
  base.recordId = v.id;

  if (!def || def.mode === "montant_global") {
    base.montant = versSaisie(v.amount);
    base.libelle = v.description ?? "";
    return base;
  }
  if (calcul) {
    base.unitaire = versSaisie(calcul.unitaire);
    base.libelle = calcul.note;
    if (def.mode === "heures_x_taux") {
      if (calcul.manuel) base.heuresManuelles = versSaisie(calcul.quantite);
    } else {
      base.quantite = versSaisie(calcul.quantite);
    }
    return base;
  }
  // Ancien format : « nbre_paniers » / « nbre_deplacement » portaient le
  // nombre, pas un montant ; les autres portaient déjà un montant en euros.
  if (v.type.startsWith("nbre_")) {
    base.quantite = versSaisie(v.amount);
  } else if (def.mode === "quantite_x_unitaire") {
    base.quantite = "1";
    base.unitaire = versSaisie(v.amount);
  } else if (lireNombre(base.unitaire) > 0) {
    // Habillage enregistré avant : seul le montant est connu, on retrouve les heures.
    base.heuresManuelles = versSaisie(v.amount / lireNombre(base.unitaire));
  }
  base.libelle = v.description ?? "";
  return base;
}

/**
 * Montant en euros d'une variable enregistrée.
 * Les anciennes lignes « Nbre Paniers » / « Nbre Déplacement » portaient un
 * NOMBRE dans le champ montant : elles sont valorisées au montant unitaire
 * courant, au lieu d'être additionnées comme des euros (ou ignorées).
 */
export function montantEuros(
  v: { type: string; amount: number; description?: string | null },
  unitaireCourant: (id: string) => number,
): number {
  if (v.type.startsWith("h_")) return 0;
  if (v.type.startsWith("nbre_") && !decoderCalcul(v.description)) {
    return arrondi2(v.amount * unitaireCourant(v.type));
  }
  return arrondi2(v.amount);
}

/** Détail lisible du calcul (« 26 jours × 12 € ») pour une variable. */
export function detailCalcul(v: {
  type: string;
  amount: number;
  description?: string | null;
}): string {
  const calcul = decoderCalcul(v.description);
  if (calcul) {
    const u = calcul.unite === "h" ? "h" : ` ${calcul.unite}`;
    return `${formaterNombre(calcul.quantite)}${u} × ${formaterNombre(calcul.unitaire)} €`;
  }
  return "";
}
