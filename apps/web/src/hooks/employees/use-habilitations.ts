"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  createCertification,
  deleteCertification,
  getEmployee,
  updateCertification,
  type Certification,
  type CreateCertificationPayload,
  type Employee as EmployeeApi,
} from "@safyr/api-client";
import type { FiscalRecordType } from "@safyr/api-client";
import type { TrainingCertification } from "@/lib/types";
import { useListePersistante } from "@/hooks/fiscal/use-liste-persistante";
import { useEmployees } from "./hooks";
import { employeeKeys } from "./keys";

/**
 * Habilitations (SSIAP, SST, H0B0) lues dans le dossier des salariés.
 *
 * Source unique : l'onglet « Diplômes et certifications » du dossier salarié
 * (table `Certification`). Les écrans Habilitations n'ont plus leur propre
 * liste : un diplôme ajouté au dossier apparaît ici sans double saisie, et une
 * certification créée ici est écrite dans le dossier.
 *
 * Les anciennes lignes enregistrées par ces écrans (registre `ssiap`, `sst`,
 * `h0b0`) restent affichées, fusionnées sans doublon : une ligne du registre
 * qui existe aussi dans un dossier (même salarié, même type, même numéro) est
 * masquée au profit de celle du dossier.
 */
export type FamilleHabilitation = "SSIAP" | "SST" | "H0B0";

const TYPES_PAR_FAMILLE: Record<FamilleHabilitation, Certification["type"][]> =
  {
    SSIAP: ["SSIAP1", "SSIAP2", "SSIAP3"],
    SST: ["SST"],
    H0B0: ["H0B0"],
  };

const MOIS_ALERTE = 3;

export type LigneHabilitation = TrainingCertification & {
  /** Présent pour une ligne issue d'un dossier salarié. */
  memberId?: string;
  dossier?: boolean;
  /** Ligne du registre qui ne porte que la date de dernier recyclage. */
  dossierCertId?: string;
};

const deuxChiffres = (n: number) => String(n).padStart(2, "0");

function jourLocal(d: Date): string {
  return `${d.getFullYear()}-${deuxChiffres(d.getMonth() + 1)}-${deuxChiffres(d.getDate())}`;
}

/** Statut recalculé à chaque affichage : la valeur enregistrée vieillit. */
function statutDe(expiry: Date): TrainingCertification["status"] {
  if (Number.isNaN(expiry.getTime())) return "expired";
  // Les dates saisies sont des jours (minuit UTC) : on compare des jours.
  const jourExpiration = expiry.toISOString().slice(0, 10);
  const aujourdhui = new Date();
  if (jourExpiration < jourLocal(aujourdhui)) return "expired";
  const limite = new Date(
    aujourdhui.getFullYear(),
    aujourdhui.getMonth() + MOIS_ALERTE,
    aujourdhui.getDate(),
  );
  if (jourExpiration <= jourLocal(limite)) return "expiring-soon";
  return "valid";
}

const jourIso = (d: Date) =>
  Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);

function typeDe(
  item: TrainingCertification,
  famille: FamilleHabilitation,
): Certification["type"] {
  const autorises = TYPES_PAR_FAMILLE[famille];
  const brut = item.type as Certification["type"];
  if (autorises.includes(brut)) return brut;
  if (famille === "SSIAP") return `SSIAP${item.level ?? "1"}` as never;
  return autorises[0];
}

function versPayload(
  item: TrainingCertification,
  famille: FamilleHabilitation,
): CreateCertificationPayload | null {
  const issueDate = jourIso(item.issueDate);
  const expiryDate = jourIso(item.expiryDate);
  if (!issueDate || !expiryDate) return null;
  return {
    type: typeDe(item, famille),
    number: item.number.trim(),
    issuer: item.issuer.trim() || "Non renseigné",
    issueDate,
    expiryDate,
    verified: item.validated,
  };
}

function cle(item: TrainingCertification): string {
  return `${item.employeeId}|${item.type}|${item.number}`.toLowerCase();
}

// Référence stable : sans elle la liste change à chaque rendu.
const garderDonnees = (resultats: { data: EmployeeApi | undefined }[]) =>
  resultats.map((r) => r.data);

export function useHabilitations(
  famille: FamilleHabilitation,
  registre: FiscalRecordType,
): [
  LigneHabilitation[],
  (
    maj:
      | TrainingCertification[]
      | ((precedent: TrainingCertification[]) => TrainingCertification[]),
  ) => void,
  boolean,
  string | null,
] {
  const qc = useQueryClient();
  const employesQuery = useEmployees();
  const employes = useMemo(
    () => employesQuery.data ?? [],
    [employesQuery.data],
  );

  // Serveur ancien : la liste n'embarque pas les certifications, on lit
  // alors les dossiers un par un (en parallèle, mis en cache).
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

  const [legacy, setLegacy, legacyChargement] =
    useListePersistante<LigneHabilitation>(registre);
  const [erreur, setErreur] = useState<string | null>(null);

  const types = TYPES_PAR_FAMILLE[famille];

  const dossierRows = useMemo<LigneHabilitation[]>(() => {
    const detailParId = new Map<string, EmployeeApi>();
    for (const d of details) if (d) detailParId.set(d.id, d);
    const lignes: LigneHabilitation[] = [];
    for (const e of employes) {
      const certifs = Array.isArray(e.certifications)
        ? e.certifications
        : (detailParId.get(e.id)?.certifications ?? []);
      const nom =
        `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() ||
        e.email ||
        e.employeeNumber ||
        "Salarié";
      for (const c of certifs) {
        if (!types.includes(c.type)) continue;
        const expiryDate = new Date(c.expiryDate);
        const issueDate = new Date(c.issueDate);
        lignes.push({
          id: c.id,
          memberId: e.id,
          dossier: true,
          employeeId: e.employeeNumber || e.id,
          employeeName: nom,
          // Filtré plus haut sur SSIAP1-3 / SST / H0B0 : tous valides pour l'écran.
          type: c.type as TrainingCertification["type"],
          level: c.type.startsWith("SSIAP") ? c.type.slice(5) : undefined,
          number: c.number,
          issueDate,
          expiryDate,
          issuer: c.issuer,
          status: statutDe(expiryDate),
          lastRenewalDate: issueDate,
          nextRenewalDate: expiryDate,
          validated: c.verified,
          validatedBy: c.verified ? "Vérifié" : undefined,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        });
      }
    }
    return lignes;
  }, [employes, details, types]);

  const rows = useMemo<LigneHabilitation[]>(() => {
    const surcouches = new Map<string, Date>();
    const anciennes: LigneHabilitation[] = [];
    for (const l of legacy) {
      if (l.dossierCertId) {
        surcouches.set(l.dossierCertId, new Date(l.lastRenewalDate ?? 0));
      } else {
        anciennes.push(l);
      }
    }
    const dossier = dossierRows.map((r) => {
      const dernier = surcouches.get(r.id);
      return dernier && !Number.isNaN(dernier.getTime())
        ? { ...r, lastRenewalDate: dernier }
        : r;
    });
    const existantes = new Set(dossier.map(cle));
    const restantes = anciennes
      .filter((l) => types.includes(l.type as Certification["type"]))
      .filter((l) => !existantes.has(cle(l)))
      .map((l) => ({ ...l, status: statutDe(new Date(l.expiryDate)) }));
    return [...dossier, ...restantes];
  }, [dossierRows, legacy, types]);

  const invalider = useCallback(
    (memberId: string) => {
      void qc.invalidateQueries({ queryKey: employeeKeys.list() });
      void qc.invalidateQueries({ queryKey: employeeKeys.detail(memberId) });
    },
    [qc],
  );

  const appliquer = useCallback(
    (
      maj:
        | TrainingCertification[]
        | ((precedent: TrainingCertification[]) => TrainingCertification[]),
    ) => {
      const suivant = typeof maj === "function" ? maj(rows) : maj;
      const avant = new Map(rows.map((r) => [r.id, r]));
      const apres = new Map(suivant.map((r) => [r.id, r as LigneHabilitation]));
      setErreur(null);

      const echec = (e: unknown) =>
        setErreur(
          `Enregistrement impossible : ${
            e instanceof Error ? e.message : "erreur inconnue"
          }`,
        );

      // Modifications du registre à appliquer en une seule fois.
      const retirerLegacy = new Set<string>();
      const modifierLegacy = new Map<string, LigneHabilitation>();
      const ajoutsLegacy: LigneHabilitation[] = [];
      const surcouchesAEcrire: {
        certId: string;
        ligne: LigneHabilitation;
        date: Date;
      }[] = [];

      for (const [id, item] of apres) {
        const ancien = avant.get(id);
        if (!ancien) {
          const salarie = employes.find(
            (e) => (e.employeeNumber || e.id) === item.employeeId,
          );
          const payload = versPayload(item, famille);
          if (salarie && payload) {
            createCertification(salarie.id, payload)
              .then(() => invalider(salarie.id))
              .catch(echec);
          } else if (!salarie) {
            ajoutsLegacy.push(item);
          } else {
            setErreur("Renseignez la date d'émission et la date d'expiration.");
          }
          continue;
        }
        if (!ancien.dossier) {
          if (JSON.stringify(ancien) !== JSON.stringify(item)) {
            modifierLegacy.set(id, item);
          }
          continue;
        }
        const memberId = ancien.memberId!;
        const nouveauPayload = versPayload(item, famille);
        const ancienPayload = versPayload(ancien, famille);
        if (item.employeeId !== ancien.employeeId) {
          // Changement de salarié : la certification change de dossier.
          const cible = employes.find(
            (e) => (e.employeeNumber || e.id) === item.employeeId,
          );
          if (cible && nouveauPayload) {
            createCertification(cible.id, nouveauPayload)
              .then(() => deleteCertification(memberId, id))
              .then(() => {
                invalider(memberId);
                invalider(cible.id);
              })
              .catch(echec);
            continue;
          }
        }
        if (
          nouveauPayload &&
          JSON.stringify(nouveauPayload) !== JSON.stringify(ancienPayload)
        ) {
          updateCertification(memberId, id, nouveauPayload)
            .then(() => invalider(memberId))
            .catch(echec);
        }
        const dernier = item.lastRenewalDate?.getTime();
        if (
          dernier !== undefined &&
          dernier !== ancien.lastRenewalDate?.getTime()
        ) {
          surcouchesAEcrire.push({
            certId: id,
            ligne: item,
            date: item.lastRenewalDate!,
          });
        }
      }

      for (const [id, ancien] of avant) {
        if (apres.has(id)) continue;
        if (ancien.dossier) {
          const memberId = ancien.memberId!;
          deleteCertification(memberId, id)
            .then(() => invalider(memberId))
            .catch(echec);
          for (const l of legacy)
            if (l.dossierCertId === id) retirerLegacy.add(l.id);
        } else {
          retirerLegacy.add(id);
        }
      }

      if (
        retirerLegacy.size ||
        modifierLegacy.size ||
        ajoutsLegacy.length ||
        surcouchesAEcrire.length
      ) {
        setLegacy((prec) => {
          let liste = prec
            .filter((l) => !retirerLegacy.has(l.id))
            .map((l) => modifierLegacy.get(l.id) ?? l);
          for (const s of surcouchesAEcrire) {
            const surcouche: LigneHabilitation = {
              ...s.ligne,
              // La date de dernier recyclage n'a pas de champ dans le dossier.
              dossierCertId: s.certId,
              lastRenewalDate: s.date,
              memberId: undefined,
              dossier: undefined,
            };
            const existante = liste.find((l) => l.dossierCertId === s.certId);
            liste = existante
              ? liste.map((l) =>
                  l === existante ? { ...surcouche, id: existante.id } : l,
                )
              : [...liste, surcouche];
          }
          return [...liste, ...ajoutsLegacy];
        });
      }
    },
    [rows, employes, famille, invalider, legacy, setLegacy],
  );

  const chargement = employesQuery.isLoading || legacyChargement;
  return [rows, appliquer, chargement, erreur];
}
