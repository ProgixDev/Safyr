"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FilePlus2,
  FileText,
  Loader2,
} from "lucide-react";
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
  manquesRubrique,
  pdfEnFichier,
  telechargerPdf,
  type DonneesDossier,
  type PdfGenere,
  type Rubrique,
} from "@/lib/dossier-entreprise-pdf";
import {
  TYPE_DOCUMENT_PAR_DEFAUT,
  TYPE_PAR_RUBRIQUE,
  aujourdhui,
  messageErreur,
} from "./appel-offre-types";
import type { useDocumentsAO } from "./use-documents-ao";
import { useDonneesDossier } from "./use-donnees-dossier";

/** Résumé chiffré des données réellement utilisées par chaque rubrique. */
function resume(rubrique: Rubrique, d: DonneesDossier): string[] {
  const ag = agregerPersonnel(d);
  if (rubrique === "entreprise") {
    const pieces = d.piecesEntreprise;
    const deposees = pieces.filter((p) => p.depot !== undefined).length;
    return [
      d.entreprise?.nom
        ? `Entreprise : ${d.entreprise.nom}`
        : "Entreprise : non renseignée",
      d.entreprise?.siret
        ? `SIRET : ${d.entreprise.siret}`
        : "SIRET : non renseigné",
      `${deposees} pièce(s) administrative(s) déposée(s) sur ${pieces.length}`,
    ];
  }
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

interface Props {
  docs: ReturnType<typeof useDocumentsAO>;
}

interface Resultat {
  cible: Rubrique | "tout";
  pdf: PdfGenere;
  ajoute: boolean;
}

export function DossierEntrepriseTab({ docs }: Props) {
  const {
    apercu: donnees,
    chargement,
    sourcesEnErreur,
    generer,
  } = useDonneesDossier();

  const [enCours, setEnCours] = useState<Rubrique | "tout" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);

  // Un clic = un téléchargement : les données sont chargées au clic (et non
  // pendant le rendu), le PDF part en Blob + lien, et toute erreur s'affiche
  // ici au lieu de disparaître en silence.
  const lancer = async (cible: Rubrique | "tout") => {
    setEnCours(cible);
    setErreur(null);
    setResultat(null);
    try {
      const pdf = await generer(cible);
      telechargerPdf(pdf);
      setResultat({ cible, pdf, ajoute: false });
    } catch (e) {
      setErreur(`Génération du PDF impossible : ${messageErreur(e)}`);
    } finally {
      setEnCours(null);
    }
  };

  const ajouterAuxDocuments = async () => {
    if (!resultat) return;
    setAjoutEnCours(true);
    setErreur(null);
    try {
      const { cible, pdf } = resultat;
      const titre =
        cible === "tout"
          ? "Dossier de candidature"
          : cible === "entreprise"
            ? "Dossier de mon entreprise"
            : RUBRIQUES.find((r) => r.id === cible)!.titre;
      await docs.enregistrerDocument(
        {
          id: "",
          name: `${titre} - ${new Date().toLocaleDateString("fr-FR")}`,
          tenderId: "",
          type:
            cible === "tout"
              ? TYPE_DOCUMENT_PAR_DEFAUT
              : TYPE_PAR_RUBRIQUE[cible],
          date: aujourdhui(),
        },
        pdfEnFichier(pdf),
      );
      setResultat({ ...resultat, ajoute: true });
    } catch (e) {
      setErreur(`Ajout aux documents impossible : ${messageErreur(e)}`);
    } finally {
      setAjoutEnCours(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Dossier de mon entreprise</h2>
          <p className="text-sm text-muted-foreground">
            Les pièces de candidature sont compilées automatiquement à partir
            des données de l&apos;application, avec le logo et les coordonnées
            de l&apos;entreprise. Ce qui n&apos;est pas renseigné apparaît « Non
            renseigné » dans le PDF.
          </p>
        </div>
        <Button onClick={() => void lancer("tout")} disabled={enCours !== null}>
          {enCours === "tout" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {enCours === "tout" ? "Génération..." : "Tout télécharger"}
        </Button>
      </div>

      {chargement && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des données de l&apos;entreprise... Vous pouvez déjà
          générer les PDF : les données en cours de chargement seront attendues.
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
      {resultat && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/40 px-4 py-3"
          role="status"
        >
          <p className="text-sm">
            <CheckCircle2 className="inline h-4 w-4 mr-1 text-green-600" />
            PDF généré :{" "}
            <span className="font-medium">{resultat.pdf.nomFichier}</span>
            {resultat.ajoute && " - ajouté à vos documents (onglet Documents)."}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => telechargerPdf(resultat.pdf)}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger à nouveau
            </Button>
            {!resultat.ajoute && (
              <Button
                size="sm"
                onClick={() => void ajouterAuxDocuments()}
                disabled={ajoutEnCours}
              >
                {ajoutEnCours ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FilePlus2 className="h-4 w-4 mr-2" />
                )}
                Ajouter à mes documents
              </Button>
            )}
          </div>
        </div>
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
                  disabled={enCours !== null}
                >
                  {enCours === r.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {enCours === r.id ? "Génération..." : "Générer le PDF"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
