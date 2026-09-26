"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  getEmployee,
  type Certification,
  type Employee as EmployeeApi,
} from "@safyr/api-client";
import { useEmployees } from "@/hooks/employees";
import { employeeKeys } from "@/hooks/employees/keys";
import { useRegistre } from "@/hooks/fiscal";
import { useListePersistante } from "@/hooks/fiscal/use-liste-persistante";
import { normaliserStatutDossier } from "@/components/safety-training/couleurs";
import type { StoredFile } from "@/lib/document-files";
import type { TrainingCertification, TrainingPlan } from "@/lib/types";
import {
  fusionner,
  jourIso,
  statutDe,
  typeDepuisTexte,
  type LigneFormation,
  type TypeFormation,
} from "./formations";

/**
 * Formation saisie au registre, telle qu'enregistrée en base (registre
 * « formation_realisee »). Les champs gardent les noms de l'ancien écran : les
 * lignes déjà enregistrées se relisent sans migration. Le document est une
 * pièce jointe, pas une métadonnée.
 */
export interface FormationSaisie {
  id: string;
  employeeId: string;
  employeeName?: string;
  trainingName: string;
  /** Code de type ; les anciennes valeurs (« fire », « MAC/SST »…) sont relues. */
  trainingType: string;
  trainingOrganization: string;
  /** AAAA-MM-JJ (les anciennes lignes portent un ISO complet). */
  startDate?: string | null;
  endDate?: string | null;
  duration?: number | null;
  cost?: number | null;
  fundingSource?: string;
  certificationNumber?: string;
  certificationDate?: string | null;
  /** Date de validité du certificat. */
  expirationDate?: string | null;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  document?: StoredFile | null;
}

export const CHAMPS_PIECES_FORMATION = ["document"] as const;

/** Dossier AKTO / OPCO, lu pour repérer les formations terminées. */
interface DossierAkto {
  id: string;
  reference?: string;
  type?: string;
  title?: string;
  employeeIds?: string[];
  employeeNames?: string[];
  employeeName?: string;
  trainingType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  devis?: StoredFile | null;
  convention?: StoredFile | null;
  facture?: StoredFile | null;
}
const CHAMPS_AKTO = ["devis", "convention", "facture"] as const;

const TYPES_CERTIFICATION: Certification["type"][] = [
  "CQP_APS",
  "SSIAP1",
  "SSIAP2",
  "SSIAP3",
  "SST",
  "H0B0",
  "FIRE",
];

const INTITULE_CERTIFICATION: Record<string, string> = {
  CQP_APS: "CQP APS",
  SSIAP1: "SSIAP 1",
  SSIAP2: "SSIAP 2",
  SSIAP3: "SSIAP 3",
  SST: "SST (sauveteur secouriste du travail)",
  H0B0: "Habilitation électrique H0B0",
  FIRE: "Habilitation incendie",
  OTHER: "Certification",
};

const TYPE_CERTIFICATION: Record<string, TypeFormation> = {
  CQP_APS: "CQP",
  SSIAP1: "SSIAP",
  SSIAP2: "SSIAP",
  SSIAP3: "SSIAP",
  SST: "SST",
  H0B0: "H0B0",
  FIRE: "INCENDIE",
};

const garderDonnees = (resultats: { data: EmployeeApi | undefined }[]) =>
  resultats.map((r) => r.data);

interface Salarie {
  id: string;
  nom: string;
}

export function useFormations() {
  const employesQuery = useEmployees();
  const employes = useMemo(
    () => employesQuery.data ?? [],
    [employesQuery.data],
  );

  // Serveur ancien : la liste n'embarque pas les certifications, on lit alors
  // les dossiers un par un (mis en cache).
  const sansCertifs = useMemo(
    () => employes.filter((e) => !Array.isArray(e.certifications)),
    [employes],
  );
  const details = useQueries({
    queries: sansCertifs.map((e) => ({
      queryKey: employeeKeys.detail(e.id),
      queryFn: () => getEmployee(e.id),
      staleTime: 60_000,
    })),
    combine: garderDonnees,
  });

  const registre = useRegistre<FormationSaisie>(
    "formation_realisee",
    CHAMPS_PIECES_FORMATION,
  );
  const aktoRegistre = useRegistre<DossierAkto>("akto", CHAMPS_AKTO);
  const [plans, , plansChargement] =
    useListePersistante<TrainingPlan>("plan_formation");
  // Anciennes lignes des écrans Habilitations et Certifications.
  const [ssiap] = useListePersistante<TrainingCertification>("ssiap");
  const [sst] = useListePersistante<TrainingCertification>("sst");
  const [h0b0] = useListePersistante<TrainingCertification>("h0b0");
  const [autres] = useListePersistante<TrainingCertification>("certification");

  const lignes = useMemo<LigneFormation[]>(() => {
    // Un salarié se retrouve par identifiant ou par matricule (les plans et les
    // anciennes habilitations stockent le matricule).
    const parRef = new Map<string, Salarie>();
    for (const e of employes) {
      const nom =
        `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() ||
        e.email ||
        e.employeeNumber ||
        "Salarié";
      const s = { id: e.id, nom };
      parRef.set(e.id, s);
      if (e.employeeNumber) parRef.set(e.employeeNumber, s);
    }
    const salarie = (ref: string, nomConnu?: string): Salarie =>
      parRef.get(ref) ?? { id: ref, nom: nomConnu || ref || "Salarié inconnu" };

    const sortie: LigneFormation[] = [];
    const base = {
      dureeH: null,
      certificat: "",
      validite: "",
      document: null,
      notes: "",
      organisme: "",
    } satisfies Partial<LigneFormation>;
    const finaliser = (
      l: Omit<LigneFormation, "statut" | "cle">,
      cle: string,
    ) => sortie.push({ ...l, cle, statut: statutDe(l.validite) });

    // 1. Saisies du registre.
    for (const f of registre.lignes) {
      const s = salarie(f.employeeId, f.employeeName);
      const validite = jourIso(f.expirationDate);
      finaliser(
        {
          ...base,
          origine: "saisie",
          id: f.id,
          salarieId: s.id,
          salarie: s.nom,
          intitule: f.trainingName ?? "",
          organisme: f.trainingOrganization ?? "",
          debut: jourIso(f.startDate),
          fin: jourIso(f.endDate),
          dureeH: typeof f.duration === "number" ? f.duration : null,
          type: typeDepuisTexte(f.trainingType),
          certificat: f.certificationNumber ?? "",
          validite,
          document: f.document ?? null,
          notes: f.notes ?? "",
        },
        `saisie:${f.id}`,
      );
    }

    // 2. Certifications des dossiers salariés, puis anciennes lignes des
    // écrans Habilitations (sans doublon : même salarié, type et numéro).
    const detailParId = new Map<string, EmployeeApi>();
    for (const d of details) if (d) detailParId.set(d.id, d);
    const vues = new Set<string>();
    const cleCertif = (idSalarie: string, type: string, numero: string) =>
      `${idSalarie}|${type}|${numero}`.toLowerCase();
    for (const e of employes) {
      const certifs = Array.isArray(e.certifications)
        ? e.certifications
        : (detailParId.get(e.id)?.certifications ?? []);
      const s = salarie(e.id);
      for (const c of certifs) {
        if (!TYPES_CERTIFICATION.includes(c.type)) continue;
        vues.add(cleCertif(s.id, c.type, c.number));
        const emission = jourIso(c.issueDate);
        finaliser(
          {
            ...base,
            origine: "dossier",
            id: c.id,
            salarieId: s.id,
            salarie: s.nom,
            intitule: INTITULE_CERTIFICATION[c.type] ?? c.type,
            organisme: c.issuer ?? "",
            debut: emission,
            fin: emission,
            type: TYPE_CERTIFICATION[c.type] ?? "AUTRE",
            certificat: c.number ?? "",
            validite: jourIso(c.expiryDate),
            document: c.document
              ? { name: c.document.name, key: c.document.storageKey }
              : null,
          },
          `dossier:${c.id}`,
        );
      }
    }
    for (const c of [...ssiap, ...sst, ...h0b0, ...autres]) {
      // Ligne de recyclage rattachée à un diplôme du dossier : pas une formation.
      if ((c as { dossierCertId?: string }).dossierCertId) continue;
      const s = salarie(c.employeeId, c.employeeName);
      if (vues.has(cleCertif(s.id, c.type, c.number))) continue;
      vues.add(cleCertif(s.id, c.type, c.number));
      const emission = jourIso(c.issueDate);
      finaliser(
        {
          ...base,
          origine: "dossier",
          id: c.id,
          salarieId: s.id,
          salarie: s.nom,
          intitule: INTITULE_CERTIFICATION[c.type] ?? String(c.type),
          organisme: c.issuer ?? "",
          debut: emission,
          fin: emission,
          type: TYPE_CERTIFICATION[c.type] ?? typeDepuisTexte(String(c.type)),
          certificat: c.number ?? "",
          validite: jourIso(c.expiryDate),
        },
        `ancienne:${c.id}`,
      );
    }

    // 3. Formations du plan passées à « Terminée » : une ligne par participant.
    for (const p of plans) {
      if (p.status !== "completed") continue;
      const jour = jourIso(p.actualDate ?? p.plannedDate);
      for (const ref of p.participants ?? []) {
        const s = salarie(ref);
        finaliser(
          {
            ...base,
            origine: "plan",
            id: `${p.id}:${ref}`,
            salarieId: s.id,
            salarie: s.nom,
            intitule: p.title,
            organisme: p.trainer ?? "",
            debut: jour,
            fin: jour,
            dureeH: p.actualDuration ?? p.duration ?? null,
            type: typeDepuisTexte(p.title),
            notes: p.notes ?? "",
          },
          `plan:${p.id}:${ref}`,
        );
      }
    }

    // 4. Dossiers AKTO / OPCO validés dont la formation est terminée.
    const aujourdhui = new Date().toISOString().slice(0, 10);
    for (const d of aktoRegistre.lignes) {
      if (normaliserStatutDossier(d.status) !== "Validé") continue;
      const fin = jourIso(d.endDate);
      if (!fin || fin > aujourdhui) continue;
      const personnes: Salarie[] = d.employeeIds?.length
        ? d.employeeIds.map((id) => salarie(id))
        : (d.employeeNames?.length
            ? d.employeeNames
            : d.employeeName
              ? [d.employeeName]
              : []
          ).map((nom) => salarie(nom, nom));
      for (const s of personnes) {
        finaliser(
          {
            ...base,
            origine: "akto",
            id: `${d.id}:${s.id}`,
            salarieId: s.id,
            salarie: s.nom,
            intitule: d.title || d.trainingType || "Formation",
            debut: jourIso(d.startDate) || fin,
            fin,
            type: typeDepuisTexte(d.trainingType || d.title),
            document: d.convention ?? d.facture ?? d.devis ?? null,
            notes: `Financement ${d.type ?? "AKTO"}${d.reference ? ` — dossier ${d.reference}` : ""}`,
          },
          `akto:${d.id}:${s.id}`,
        );
      }
    }

    return fusionner(sortie);
  }, [
    employes,
    details,
    registre.lignes,
    aktoRegistre.lignes,
    plans,
    ssiap,
    sst,
    h0b0,
    autres,
  ]);

  return {
    lignes,
    salaries: employes,
    registre,
    isLoading: employesQuery.isLoading || registre.isLoading || plansChargement,
  };
}
