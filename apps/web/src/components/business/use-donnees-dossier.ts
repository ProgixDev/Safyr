"use client";

import { useCallback, useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { getEmployeeCompliance, type ComplianceItem } from "@safyr/api-client";
import {
  useOrganization,
  useOrganizationCompliance,
} from "@/hooks/organization";
import { useEmployees } from "@/hooks/employees";
import { useSites } from "@/hooks/sites";
import { useClients } from "@/hooks/clients";
import { useInvoices } from "@/hooks/billing";
import { useFiscalRecords } from "@/hooks/fiscal";
import {
  construireDonnees,
  construireDossierCompletPdf,
  construireRubriquePdf,
  type DonneesDossier,
  type PdfGenere,
  type Rubrique,
} from "@/lib/dossier-entreprise-pdf";

/** Au-delà, une source qui ne répond pas est traitée comme absente. */
const DELAI_SOURCE_MS = 20_000;
const DELAI_PIECES_MS = 25_000;
const PARALLELISME_PIECES = 5;

function avecDelai<T>(promesse: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("délai dépassé")), ms);
    promesse.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e instanceof Error ? e : new Error("erreur inconnue"));
      },
    );
  });
}

/**
 * Lit une source au moment du clic : la donnée déjà en cache si elle existe,
 * sinon on attend le chargement en cours (sans l'annuler). Une source en
 * échec donne `undefined` : la rubrique concernée affichera « Non renseigné ».
 */
async function lire<T>(q: UseQueryResult<T, Error>): Promise<T | undefined> {
  if (q.data !== undefined) return q.data;
  try {
    const r = await avecDelai(
      q.refetch({ cancelRefetch: false }),
      DELAI_SOURCE_MS,
    );
    return r.data;
  } catch {
    return undefined;
  }
}

/**
 * Documents obligatoires de chaque salarié : la liste des salariés ne les
 * contient pas, il faut lire le dossier de conformité de chacun. Les échecs
 * sont isolés (le salarié apparaît « Non disponible »), jamais bloquants.
 */
async function chargerPiecesSalaries(
  ids: string[],
): Promise<Record<string, ComplianceItem[] | undefined>> {
  const resultat: Record<string, ComplianceItem[] | undefined> = {};
  const echeance = Date.now() + DELAI_PIECES_MS;
  const file = [...ids];
  const travailleur = async () => {
    for (let id = file.shift(); id; id = file.shift()) {
      if (Date.now() > echeance) return;
      try {
        resultat[id] = await avecDelai(
          getEmployeeCompliance(id),
          Math.max(1_000, echeance - Date.now()),
        );
      } catch {
        resultat[id] = undefined;
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(PARALLELISME_PIECES, ids.length) }, () =>
      travailleur(),
    ),
  );
  return resultat;
}

/**
 * Sources de données du dossier de candidature. `preparer()` garantit que les
 * données sont chargées AU CLIC : le bouton n'a jamais à rester grisé en
 * attendant qu'une des onze requêtes se termine.
 */
export function useDonneesDossier() {
  const organisation = useOrganization();
  const conformite = useOrganizationCompliance();
  const salaries = useEmployees();
  const sites = useSites();
  const clients = useClients();
  const factures = useInvoices();
  const contrats = useFiscalRecords("client_contrat");
  const equipements = useFiscalRecords("equipement");
  const tva = useFiscalRecords("tva");
  const cfe = useFiscalRecords("cfe");
  const divers = useFiscalRecords("divers");

  const chargement = [
    organisation,
    conformite,
    salaries,
    sites,
    clients,
    factures,
    contrats,
    equipements,
    tva,
    cfe,
    divers,
  ].some((q) => q.isLoading);

  const sources: [string, { isError: boolean }][] = [
    ["informations de l'entreprise", organisation],
    ["documents de l'entreprise", conformite],
    ["salariés", salaries],
    ["sites", sites],
    ["clients", clients],
    ["factures", factures],
    ["contrats clients", contrats],
  ];
  const sourcesEnErreur = sources.filter(([, q]) => q.isError).map(([n]) => n);

  // Aperçu affiché à l'écran (résumés, éléments manquants) : sans les pièces
  // des salariés, qui ne se chargent qu'à la génération.
  const apercu = useMemo(
    () =>
      construireDonnees({
        organisation: organisation.data,
        conformite: conformite.data,
        salaries: salaries.data,
        sites: sites.data,
        clients: clients.data,
        factures: factures.data,
        contrats: contrats.data,
        equipements: equipements.data,
        tva: tva.data,
        cfe: cfe.data,
        divers: divers.data,
      }),
    [
      organisation.data,
      conformite.data,
      salaries.data,
      sites.data,
      clients.data,
      factures.data,
      contrats.data,
      equipements.data,
      tva.data,
      cfe.data,
      divers.data,
    ],
  );

  const preparer = useCallback(async (): Promise<DonneesDossier> => {
    const [org, conf, sal, sit, cli, fac, con, equ, tvaLignes, cfeLignes, div] =
      await Promise.all([
        lire(organisation),
        lire(conformite),
        lire(salaries),
        lire(sites),
        lire(clients),
        lire(factures),
        lire(contrats),
        lire(equipements),
        lire(tva),
        lire(cfe),
        lire(divers),
      ]);
    const actifs = (sal ?? []).filter((e) => e.status === "active");
    const piecesSalaries = await chargerPiecesSalaries(actifs.map((e) => e.id));
    return construireDonnees({
      organisation: org,
      conformite: conf,
      salaries: sal,
      sites: sit,
      clients: cli,
      factures: fac,
      contrats: con,
      equipements: equ,
      tva: tvaLignes,
      cfe: cfeLignes,
      divers: div,
      piecesSalaries,
    });
  }, [
    organisation,
    conformite,
    salaries,
    sites,
    clients,
    factures,
    contrats,
    equipements,
    tva,
    cfe,
    divers,
  ]);

  /** Charge les données puis produit le PDF ; ne télécharge rien elle-même. */
  const generer = useCallback(
    async (cible: Rubrique | "tout"): Promise<PdfGenere> => {
      const d = await preparer();
      return cible === "tout"
        ? construireDossierCompletPdf(d)
        : construireRubriquePdf(cible, d);
    },
    [preparer],
  );

  return { apercu, chargement, sourcesEnErreur, generer };
}
