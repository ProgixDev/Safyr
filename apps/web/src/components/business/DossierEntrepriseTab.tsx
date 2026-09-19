"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
} from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RUBRIQUES,
  agregerPersonnel,
  construireDonnees,
  genererDossierCompletPdf,
  genererRubriquePdf,
  manquesRubrique,
  type DonneesDossier,
  type Rubrique,
} from "@/lib/dossier-entreprise-pdf";
import { messageErreur } from "./appel-offre-types";

/** Résumé chiffré des données réellement utilisées par chaque rubrique. */
function resume(rubrique: Rubrique, d: DonneesDossier): string[] {
  const ag = agregerPersonnel(d);
  if (rubrique === "memoire") {
    return [
      d.entreprise?.nom
        ? `Entreprise : ${d.entreprise.nom}`
        : "Entreprise : non renseignée",
      `${ag.effectif} salarié(s) actif(s), ${d.sites.length} site(s)`,
      `${d.equipements.length} type(s) d'équipement attribué(s)`,
    ];
  }
  if (rubrique === "financier") {
    return [
      `${d.ca.length} exercice(s) avec facturation`,
      `${d.pieces.filter((p) => p.statut === "Fournie").length} pièce(s) sur ${d.pieces.length} fournie(s)`,
      `${d.declarations.tva} déclaration(s) TVA, ${d.declarations.cfe} CFE`,
    ];
  }
  if (rubrique === "references") {
    return [
      `${d.clients.length} client(s)`,
      `${d.contrats.filter((c) => c.statut === "active").length} contrat(s) en cours sur ${d.contrats.length}`,
      `${d.sites.length} site(s) sous surveillance`,
    ];
  }
  return [
    `${ag.effectif} salarié(s) actif(s)`,
    `${ag.parQualification.reduce((n, q) => n + q.total, 0)} qualification(s) enregistrée(s)`,
    `${ag.cartes.total} carte(s) professionnelle(s), dont ${ag.cartes.valides} valide(s)`,
  ];
}

export function DossierEntrepriseTab() {
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

  const [enCours, setEnCours] = useState<Rubrique | "tout" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

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

  // Une source en erreur ne bloque pas le dossier : ses données sont simplement
  // absentes et la rubrique concernée affiche « Non renseigné ».
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

  const donnees = useMemo(
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

  const lancer = async (cible: Rubrique | "tout") => {
    setEnCours(cible);
    setErreur(null);
    try {
      if (cible === "tout") await genererDossierCompletPdf(donnees);
      else await genererRubriquePdf(cible, donnees);
    } catch (e) {
      setErreur(`Génération du PDF impossible : ${messageErreur(e)}`);
    } finally {
      setEnCours(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Dossier de mon entreprise</h2>
          <p className="text-sm text-muted-foreground">
            Les pièces de candidature sont compilées automatiquement à partir
            des données de l&apos;application. Ce qui n&apos;est pas renseigné
            apparaît « Non renseigné » dans le PDF.
          </p>
        </div>
        <Button
          onClick={() => void lancer("tout")}
          disabled={chargement || enCours !== null}
        >
          {enCours === "tout" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Tout télécharger
        </Button>
      </div>

      {chargement && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des données de l&apos;entreprise...
        </p>
      )}
      {sourcesEnErreur.length > 0 && (
        <p className="text-sm text-amber-600" role="alert">
          Certaines données n&apos;ont pas pu être chargées (
          {sourcesEnErreur.join(", ")}) : les rubriques concernées seront
          incomplètes.
        </p>
      )}
      {erreur && (
        <p className="text-sm text-destructive" role="alert">
          {erreur}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {RUBRIQUES.map((r) => {
          const manques = manquesRubrique(donnees, r.id);
          return (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {r.titre}
                  </CardTitle>
                  {!chargement &&
                    (manques.length === 0 ? (
                      <Badge variant="default">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complet
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />
                        À compléter
                      </Badge>
                    ))}
                </div>
                <CardDescription>{r.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {resume(r.id, donnees).map((ligne) => (
                    <li key={ligne}>- {ligne}</li>
                  ))}
                </ul>
                {!chargement && manques.length > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-500">
                    Non renseigné : {manques.join(", ")}
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void lancer(r.id)}
                  disabled={chargement || enCours !== null}
                >
                  {enCours === r.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Générer le PDF
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
