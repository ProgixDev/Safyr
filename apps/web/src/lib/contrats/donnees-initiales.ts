/**
 * Pré-remplissage du dialogue « Générer contrat » à partir du dossier du
 * salarié, de sa fiche emploi (grille des salaires, période d'essai) et de
 * l'entreprise. Rien n'est codé en dur : une donnée absente reste vide et sera
 * signalée « À compléter ».
 */
import type { Employee } from "@/lib/types";
import type { PdfBranding } from "@/lib/pdf-branding";
import { estDateRenseignee } from "@/lib/employee-adapter";
import {
  finEssaiProposee,
  heuresRetenues,
  type FicheEmploi,
} from "@/lib/fiche-emploi";
import { BASE_HEURES_MENSUELLE } from "@/lib/grille-salaires";
import { MOTIFS_CDD, formaterNombre, type DonneesContrat } from "./generateur";

const enTexte = (n: number | null | undefined, decimales: number): string =>
  n === null || n === undefined
    ? ""
    : formaterNombre(n, decimales).replace(/ /g, "");

const versIso = (d: Date | null | undefined): string =>
  d && estDateRenseignee(d) ? d.toISOString().slice(0, 10) : "";

export interface SourcesContrat {
  employee: Employee;
  fiche: FicheEmploi | null;
  branding: PdfBranding;
  /** Fonction du représentant légal (« Président »…), si renseignée. */
  qualiteRepresentant?: string;
}

export function donneesInitiales({
  employee,
  fiche,
  branding,
  qualiteRepresentant,
}: SourcesContrat): DonneesContrat {
  const type: DonneesContrat["type"] =
    employee.contractType === "CDD" ? "CDD" : "CDI";
  const heuresFiche = fiche ? heuresRetenues(fiche) : null;
  const tempsPartiel =
    employee.workSchedule === "part-time" ||
    (heuresFiche !== null && heuresFiche < BASE_HEURES_MENSUELLE - 0.005);
  const heures =
    heuresFiche !== null
      ? heuresFiche
      : tempsPartiel
        ? null
        : BASE_HEURES_MENSUELLE;

  const debut =
    versIso(employee.hireDate) || new Date().toISOString().slice(0, 10);
  // Sans fin d'essai dans la fiche, l'option reste décochée (`essai.actif`).
  const finEssai = fiche?.finEssai ?? "";
  const adresse = employee.address
    ? [
        employee.address.street,
        [employee.address.postalCode, employee.address.city]
          .filter(Boolean)
          .join(" "),
      ]
        .filter((p) => p && p.trim())
        .join(", ")
    : "";

  return {
    type,
    tempsPartiel,
    entreprise: {
      nom: branding.name,
      capital: branding.capitalLine,
      adresse: branding.address,
      siret: branding.siret,
      cnaps: branding.authorizationNumber,
      representant: branding.presidentName ?? "",
      qualite: qualiteRepresentant ?? "",
    },
    salarie: {
      civilite:
        employee.gender === "male"
          ? "Monsieur"
          : employee.gender === "female"
            ? "Madame"
            : "",
      prenom: employee.firstName ?? "",
      nom: employee.lastName ?? "",
      dateNaissance: versIso(employee.dateOfBirth),
      lieuNaissance: employee.placeOfBirth ?? "",
      nationalite: employee.nationality ?? "",
      adresse,
      numSecu: employee.socialSecurityNumber ?? "",
      cartePro: employee.cartePro ?? "",
    },
    emploi: {
      poste: employee.position ?? "",
      categorie: fiche?.categorie ?? "",
      niveau: fiche?.niveau ?? "",
      echelon: fiche?.echelon ?? "",
      coefficient: fiche?.coefficient ? String(fiche.coefficient) : "",
    },
    dateDebut: debut,
    dateFin: "",
    motifCdd: type === "CDD" ? MOTIFS_CDD[0] : "",
    precisionCdd: "",
    essai: { actif: Boolean(finEssai), fin: finEssai },
    lieuTravail: "",
    heuresMensuelles: enTexte(heures, 4),
    repartition: "",
    horaires: "",
    tauxHoraire: enTexte(fiche?.tauxHoraire, 5),
    salaireMensuel: enTexte(fiche?.salaireMensuel, 2),
    organismes: "",
    options: { mobilite: false, dedit: false, tenue: false },
    mobiliteZone: "",
    dedit: { formation: "", dureeMois: "", cout: "" },
    clausesParticulieres: "",
    signature: { lieu: "", date: "" },
  };
}

/** Fin d'essai proposée quand l'option est cochée sans date (modifiable). */
export function essaiParDefaut(d: DonneesContrat): string {
  return finEssaiProposee(d.dateDebut, d.type, d.emploi.categorie);
}
