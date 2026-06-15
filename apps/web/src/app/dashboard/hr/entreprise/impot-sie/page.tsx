"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import {
  Upload,
  Download,
  ExternalLink,
  Building,
  Mail,
  Plus,
  Edit3,
  Receipt,
  CreditCard,
} from "lucide-react";

// Téléchargement (mock) d'un document : génère un fichier placeholder.
// À remplacer par le vrai fichier servi par le backend une fois branché.
function downloadMock(filename: string) {
  const blob = new Blob(
    [
      `Document : ${filename}\n(Placeholder — le vrai fichier sera servi par le backend une fois branché.)`,
    ],
    { type: "text/plain" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

interface TVADocument {
  id: string;
  mois: string;
  annee: string;
  grandLivre: string | null;
  declaration: string | null;
  arDeclaration: string | null;
  paiement: string | null;
  statut: "complet" | "partiel" | "manquant";
  dateEcheance: string;
}

interface CFEDocument {
  id: string;
  annee: string;
  declaration: string | null;
  avis: string | null;
  paiement: string | null;
  statut: "complet" | "partiel" | "manquant";
  montant: number;
}

interface PrelevementDocument {
  id: string;
  periode: string;
  declaration: string | null;
  bordereau: string | null;
  statut: "declare" | "en_attente" | "en_retard";
  montant: number;
}

interface Courrier {
  id: string;
  date: string;
  type: "recu" | "envoye";
  objet: string;
  document: string | null;
  organisme: "impots" | "urssaf" | "tresor_public";
  statut: "traite" | "en_cours" | "en_attente";
}

export default function ImpotSIEPage() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [activeTab, setActiveTab] = useState("tva");
  const [isNewDocumentModalOpen, setIsNewDocumentModalOpen] = useState(false);
  const [newDocumentType, setNewDocumentType] = useState<
    "tva" | "cfe" | "prelevement" | "courrier"
  >("tva");
  const [newDocument, setNewDocument] = useState({
    mois: "",
    annee: selectedYear,
    periode: "",
    date: new Date().toISOString().split("T")[0],
    type: "recu" as "recu" | "envoye",
    objet: "",
    organisme: "impots" as "impots" | "urssaf" | "tresor_public",
    montant: 0,
  });

  const [tvaDossiers, setTvaDossiers] = useState<TVADocument[]>([
    {
      id: "1",
      mois: "janvier",
      annee: "2024",
      grandLivre: "GL_01_2024.pdf",
      declaration: "DECL_TVA_01_2024.pdf",
      arDeclaration: "AR_TVA_01_2024.pdf",
      paiement: "PAIEMENT_TVA_01_2024.pdf",
      statut: "complet",
      dateEcheance: "2024-02-20",
    },
    {
      id: "2",
      mois: "février",
      annee: "2024",
      grandLivre: "GL_02_2024.pdf",
      declaration: "DECL_TVA_02_2024.pdf",
      arDeclaration: null,
      paiement: null,
      statut: "partiel",
      dateEcheance: "2024-03-20",
    },
    {
      id: "3",
      mois: "mars",
      annee: "2024",
      grandLivre: null,
      declaration: null,
      arDeclaration: null,
      paiement: null,
      statut: "manquant",
      dateEcheance: "2024-04-20",
    },
  ]);

  const [cfeDossiers, setCfeDossiers] = useState<CFEDocument[]>([
    {
      id: "1",
      annee: "2024",
      declaration: "CFE_2024.pdf",
      avis: "AVIS_CFE_2024.pdf",
      paiement: "PAIEMENT_CFE_2024.pdf",
      statut: "complet",
      montant: 2500,
    },
    {
      id: "2",
      annee: "2023",
      declaration: "CFE_2023.pdf",
      avis: "AVIS_CFE_2023.pdf",
      paiement: "PAIEMENT_CFE_2023.pdf",
      statut: "complet",
      montant: 2200,
    },
  ]);

  const [prelevements, setPrelevements] = useState<PrelevementDocument[]>([
    {
      id: "1",
      periode: "Janvier 2024",
      declaration: "PAS_01_2024.pdf",
      bordereau: "BORDEREAU_01_2024.pdf",
      statut: "declare",
      montant: 15000,
    },
    {
      id: "2",
      periode: "Février 2024",
      declaration: "PAS_02_2024.pdf",
      bordereau: null,
      statut: "en_attente",
      montant: 16200,
    },
  ]);

  const [courriers, setCourriers] = useState<Courrier[]>([
    {
      id: "1",
      date: "2024-02-15",
      type: "recu",
      objet: "Demande de justificatifs TVA Q4 2023",
      document: "COURRIER_IMPOTS_02_2024.pdf",
      organisme: "impots",
      statut: "traite",
    },
    {
      id: "2",
      date: "2024-02-20",
      type: "envoye",
      objet: "Réponse demande justificatifs",
      document: "REPONSE_IMPOTS_02_2024.pdf",
      organisme: "impots",
      statut: "traite",
    },
    {
      id: "3",
      date: "2024-03-01",
      type: "recu",
      objet: "Avis de contrôle fiscal",
      document: "CONTROLE_FISCAL_03_2024.pdf",
      organisme: "impots",
      statut: "en_cours",
    },
  ]);

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "complet":
      case "declare":
      case "traite":
        return "bg-green-500";
      case "partiel":
      case "en_attente":
        return "bg-orange-500";
      case "manquant":
      case "en_retard":
      case "en_cours":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatutText = (statut: string) => {
    switch (statut) {
      case "complet":
        return "Complet";
      case "partiel":
        return "Partiel";
      case "manquant":
        return "Manquant";
      case "declare":
        return "Déclaré";
      case "en_attente":
        return "En attente";
      case "en_retard":
        return "En retard";
      case "traite":
        return "Traité";
      case "en_cours":
        return "En cours";
      default:
        return "Inconnu";
    }
  };

  const getOrganismeText = (organisme: string) => {
    switch (organisme) {
      case "impots":
        return "DGI";
      case "urssaf":
        return "URSSAF";
      case "tresor_public":
        return "Trésor Public";
      default:
        return organisme;
    }
  };

  const moisFrancais = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];

  const annees = ["2024", "2023", "2022", "2021"];

  const handleNewDocument = () => {
    const newId = Date.now().toString();

    if (newDocumentType === "tva") {
      const newTvaDoc: TVADocument = {
        id: newId,
        mois: newDocument.mois,
        annee: newDocument.annee,
        grandLivre: null,
        declaration: null,
        arDeclaration: null,
        paiement: null,
        statut: "manquant",
        dateEcheance: `${newDocument.annee}-${(moisFrancais.indexOf(newDocument.mois) + 2).toString().padStart(2, "0")}-20`,
      };
      setTvaDossiers((prev) => [...prev, newTvaDoc]);
    } else if (newDocumentType === "cfe") {
      const newCfeDoc: CFEDocument = {
        id: newId,
        annee: newDocument.annee,
        declaration: null,
        avis: null,
        paiement: null,
        statut: "manquant",
        montant: 0,
      };
      setCfeDossiers((prev) => [...prev, newCfeDoc]);
    } else if (newDocumentType === "prelevement") {
      const newPrelevement: PrelevementDocument = {
        id: newId,
        periode: newDocument.periode,
        declaration: null,
        bordereau: null,
        statut: "en_attente",
        montant: newDocument.montant,
      };
      setPrelevements((prev) => [...prev, newPrelevement]);
    } else if (newDocumentType === "courrier") {
      const newCourrier: Courrier = {
        id: newId,
        date: newDocument.date,
        type: newDocument.type,
        objet: newDocument.objet,
        document: null,
        organisme: newDocument.organisme,
        statut: "en_attente",
      };
      setCourriers((prev) => [...prev, newCourrier]);
    }

    setIsNewDocumentModalOpen(false);
    // Reset form
    setNewDocument({
      mois: "",
      annee: selectedYear,
      periode: "",
      date: new Date().toISOString().split("T")[0],
      type: "recu",
      objet: "",
      organisme: "impots",
      montant: 0,
    });
  };
  // Column definitions for TVA table
  const tvaColumns: ColumnDef<TVADocument>[] = [
    {
      key: "mois",
      label: "Mois",
      sortable: true,
      render: (dossier) => <span className="capitalize">{dossier.mois}</span>,
    },
    {
      key: "dateEcheance",
      label: "Échéance",
      sortable: true,
      render: (dossier) =>
        new Date(dossier.dateEcheance).toLocaleDateString("fr-FR"),
    },
    {
      key: "grandLivre",
      label: "Grand Livre TVA",
      render: (dossier) => (
        <div className="flex gap-2">
          {dossier.grandLivre ? (
            <Button variant="outline" size="sm" onClick={() => downloadMock("Document")}>
              <Download className="h-3 w-3 mr-1" />
              Télécharger
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <Upload className="h-3 w-3 mr-1" />
              Uploader
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "declaration",
      label: "Déclaration TVA",
      render: (dossier) => (
        <div className="flex gap-2">
          {dossier.declaration ? (
            <Button variant="outline" size="sm" onClick={() => downloadMock("Document")}>
              <Download className="h-3 w-3 mr-1" />
              Télécharger
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <Upload className="h-3 w-3 mr-1" />
              Uploader
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "arDeclaration",
      label: "AR Déclaration",
      render: (dossier) => (
        <div className="flex gap-2">
          {dossier.arDeclaration ? (
            <Button variant="outline" size="sm" onClick={() => downloadMock("Document")}>
              <Download className="h-3 w-3 mr-1" />
              Télécharger
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <Upload className="h-3 w-3 mr-1" />
              Uploader
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "paiement",
      label: "Paiement TVA",
      render: (dossier) => (
        <div className="flex gap-2">
          {dossier.paiement ? (
            <Button variant="outline" size="sm" onClick={() => downloadMock("Document")}>
              <Download className="h-3 w-3 mr-1" />
              Télécharger
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <Upload className="h-3 w-3 mr-1" />
              Uploader
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "statut",
      label: "Statut",
      render: (dossier) => (
        <Badge className={getStatutColor(dossier.statut)}>
          {getStatutText(dossier.statut)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Impôts & SIE</h1>
          <p className="text-muted-foreground">
            Gestion des dossiers TVA, CFE, prélèvements à la source et courriers
            fiscaux
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {annees.map((annee) => (
                <SelectItem key={annee} value={annee}>
                  {annee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="flex items-center gap-2"
            onClick={() => setIsNewDocumentModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nouveau Document
          </Button>
        </div>
      </div>

      {/* Vue d'ensemble */}
      <InfoCardContainer>
        <InfoCard
          icon={Receipt}
          title={`TVA ${selectedYear}`}
          value={`${
            tvaDossiers.filter(
              (d) => d.annee === selectedYear && d.statut === "complet",
            ).length
          }/12`}
          color="blue"
        />

        <InfoCard
          icon={Building}
          title="CFE"
          value={`${
            cfeDossiers
              .find((d) => d.annee === selectedYear)
              ?.montant.toLocaleString() || "0"
          } €`}
          color="green"
        />

        <InfoCard
          icon={CreditCard}
          title={`Prél. Source ${selectedYear}`}
          value={`${prelevements
            .filter((p) => p.periode.includes(selectedYear.toString()))
            .reduce((sum, p) => sum + p.montant, 0)
            .toLocaleString()} €`}
          color="purple"
        />

        <InfoCard
          icon={Mail}
          title={`Courriers ${selectedYear}`}
          value={
            courriers.filter(
              (c) =>
                c.date.startsWith(selectedYear.toString()) &&
                c.statut === "en_cours",
            ).length
          }
          color="orange"
        />
      </InfoCardContainer>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tva">Dossiers TVA</TabsTrigger>
          <TabsTrigger value="cfe">CFE</TabsTrigger>
          <TabsTrigger value="prelevement">Prélèvement Source</TabsTrigger>
          <TabsTrigger value="courriers">Courriers</TabsTrigger>
        </TabsList>

        <TabsContent value="tva">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Dossiers TVA {selectedYear}
              </CardTitle>
              <CardDescription>
                Pour chaque mois: Grand livre TVA, Déclaration TVA, AR
                déclaration, Paiement TVA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={moisFrancais.map((mois, index) => {
                  const existing = tvaDossiers.find(
                    (d) => d.mois === mois && d.annee === selectedYear,
                  );
                  return (
                    existing || {
                      id: `new-${selectedYear}-${index}`,
                      mois,
                      annee: selectedYear,
                      grandLivre: null,
                      declaration: null,
                      arDeclaration: null,
                      paiement: null,
                      statut: "manquant" as const,
                      dateEcheance: `${selectedYear}-${(index + 2)
                        .toString()
                        .padStart(2, "0")}-20`,
                    }
                  );
                })}
                columns={tvaColumns}
                searchKey="mois"
                searchPlaceholder="Rechercher un mois..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cfe">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Cotisation Foncière des Entreprises (CFE)
              </CardTitle>
              <CardDescription>Dossier CFE par année</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={cfeDossiers.filter((d) => d.annee === selectedYear)}
                columns={[
                  {
                    key: "annee",
                    label: "Année",
                    sortable: true,
                  },
                  {
                    key: "montant",
                    label: "Montant",
                    sortable: true,
                    render: (dossier) =>
                      `${dossier.montant.toLocaleString()} €`,
                  },
                  {
                    key: "declaration",
                    label: "Déclaration CFE",
                    render: (dossier) => (
                      <div className="flex gap-2">
                        {dossier.declaration ? (
                          <Button variant="outline" size="sm" onClick={() => downloadMock("Document")}>
                            <Download className="h-3 w-3 mr-1" />
                            Télécharger
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Upload className="h-3 w-3 mr-1" />
                            Uploader
                          </Button>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "avis",
                    label: "Avis d'imposition",
                    render: (dossier) => (
                      <div className="flex gap-2">
                        {dossier.avis ? (
                          <Button variant="outline" size="sm" onClick={() => downloadMock("Document")}>
                            <Download className="h-3 w-3 mr-1" />
                            Télécharger
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Upload className="h-3 w-3 mr-1" />
                            Uploader
                          </Button>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "paiement",
                    label: "Justificatif de paiement",
                    render: (dossier) => (
                      <div className="flex gap-2">
                        {dossier.paiement ? (
                          <Button variant="outline" size="sm" onClick={() => downloadMock("Document")}>
                            <Download className="h-3 w-3 mr-1" />
                            Télécharger
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Upload className="h-3 w-3 mr-1" />
                            Uploader
                          </Button>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "statut",
                    label: "Statut",
                    render: (dossier) => (
                      <Badge className={getStatutColor(dossier.statut)}>
                        {getStatutText(dossier.statut)}
                      </Badge>
                    ),
                  },
                ]}
                searchKey="annee"
                searchPlaceholder="Rechercher une année..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prelevement">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Prélèvement à la Source
              </CardTitle>
              <CardDescription>
                Déclarations mensuelles et bordereaux de versement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={prelevements.filter((p) =>
                  p.periode.includes(selectedYear.toString()),
                )}
                columns={[
                  {
                    key: "periode",
                    label: "Période",
                    sortable: true,
                  },
                  {
                    key: "montant",
                    label: "Montant",
                    sortable: true,
                    render: (prelevement) =>
                      `${prelevement.montant.toLocaleString()} €`,
                  },
                  {
                    key: "declaration",
                    label: "Déclaration",
                    render: (prelevement) => (
                      <div className="flex gap-2">
                        {prelevement.declaration ? (
                          <Button variant="outline" size="sm" onClick={() => downloadMock("Document")}>
                            <Download className="h-3 w-3 mr-1" />
                            Télécharger
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Upload className="h-3 w-3 mr-1" />
                            Uploader
                          </Button>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "bordereau",
                    label: "Bordereau de versement",
                    render: (prelevement) => (
                      <div className="flex gap-2">
                        {prelevement.bordereau ? (
                          <Button variant="outline" size="sm" onClick={() => downloadMock("Document")}>
                            <Download className="h-3 w-3 mr-1" />
                            Télécharger
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Upload className="h-3 w-3 mr-1" />
                            Uploader
                          </Button>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "statut",
                    label: "Statut",
                    render: (prelevement) => (
                      <Badge className={getStatutColor(prelevement.statut)}>
                        {getStatutText(prelevement.statut)}
                      </Badge>
                    ),
                  },
                ]}
                searchKey="periode"
                searchPlaceholder="Rechercher une période..."
              />

              <Button className="w-full mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle déclaration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courriers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Courriers Fiscaux
              </CardTitle>
              <CardDescription>
                Courriers reçus et envoyés aux services fiscaux
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={courriers.filter((c) =>
                  c.date.startsWith(selectedYear.toString()),
                )}
                columns={[
                  {
                    key: "date",
                    label: "Date",
                    sortable: true,
                    render: (courrier) =>
                      new Date(courrier.date).toLocaleDateString("fr-FR"),
                  },
                  {
                    key: "objet",
                    label: "Objet",
                    sortable: true,
                  },
                  {
                    key: "type",
                    label: "Type",
                    render: (courrier) => (
                      <Badge
                        variant="outline"
                        className={
                          courrier.type === "recu"
                            ? "border-blue-200"
                            : "border-green-200"
                        }
                      >
                        {courrier.type === "recu" ? "Reçu" : "Envoyé"}
                      </Badge>
                    ),
                  },
                  {
                    key: "organisme",
                    label: "Organisme",
                    sortable: true,
                    render: (courrier) => getOrganismeText(courrier.organisme),
                  },
                  {
                    key: "statut",
                    label: "Statut",
                    render: (courrier) => (
                      <Badge className={getStatutColor(courrier.statut)}>
                        {getStatutText(courrier.statut)}
                      </Badge>
                    ),
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    render: (courrier) => (
                      <div className="flex items-center gap-2">
                        {courrier.document && (
                          <Button variant="outline" size="sm" onClick={() => downloadMock("Document")}>
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                searchKey="objet"
                searchPlaceholder="Rechercher un courrier..."
              />

              <Button className="w-full mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau courrier
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Liens rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Liens Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start h-auto p-4"
              onClick={() => window.open("https://impots.gouv.fr", "_blank")}
            >
              <div className="p-2 bg-blue-100 rounded">
                <ExternalLink className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium">impots.gouv.fr</p>
                <p className="text-xs text-muted-foreground">
                  Espace professionnel
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start h-auto p-4"
              onClick={() =>
                window.open("https://cfspro.impots.gouv.fr", "_blank")
              }
            >
              <div className="p-2 bg-green-100 rounded">
                <ExternalLink className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium">CFS Pro</p>
                <p className="text-xs text-muted-foreground">
                  Centre des Finances
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start h-auto p-4"
              onClick={() =>
                window.open("https://www.net-entreprises.fr", "_blank")
              }
            >
              <div className="p-2 bg-purple-100 rounded">
                <ExternalLink className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium">Net-Entreprises</p>
                <p className="text-xs text-muted-foreground">
                  Déclarations sociales
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Modal nouveau document */}
      <Modal
        open={isNewDocumentModalOpen}
        onOpenChange={setIsNewDocumentModalOpen}
        type="form"
        title="Nouveau Document"
        actions={{
          primary: {
            label: "Ajouter",
            onClick: handleNewDocument,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsNewDocumentModalOpen(false),
            variant: "outline" as const,
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="documentType">Type de document</Label>
            <Select
              value={newDocumentType}
              onValueChange={(
                value: "tva" | "cfe" | "prelevement" | "courrier",
              ) => setNewDocumentType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tva">Dossier TVA</SelectItem>
                <SelectItem value="cfe">CFE</SelectItem>
                <SelectItem value="prelevement">
                  Prélèvement à la Source
                </SelectItem>
                <SelectItem value="courrier">Courrier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newDocumentType === "tva" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mois">Mois</Label>
                <Select
                  value={newDocument.mois}
                  onValueChange={(value) =>
                    setNewDocument({ ...newDocument, mois: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un mois" />
                  </SelectTrigger>
                  <SelectContent>
                    {moisFrancais.map((mois) => (
                      <SelectItem key={mois} value={mois}>
                        {mois.charAt(0).toUpperCase() + mois.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="annee">Année</Label>
                <Select
                  value={newDocument.annee}
                  onValueChange={(value) =>
                    setNewDocument({ ...newDocument, annee: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {annees.map((annee) => (
                      <SelectItem key={annee} value={annee}>
                        {annee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {newDocumentType === "cfe" && (
            <div>
              <Label htmlFor="annee">Année</Label>
              <Select
                value={newDocument.annee}
                onValueChange={(value) =>
                  setNewDocument({ ...newDocument, annee: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {annees.map((annee) => (
                    <SelectItem key={annee} value={annee}>
                      {annee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {newDocumentType === "prelevement" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="periode">Période</Label>
                <Input
                  id="periode"
                  value={newDocument.periode}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, periode: e.target.value })
                  }
                  placeholder="Ex: Janvier 2024"
                />
              </div>
              <div>
                <Label htmlFor="montant">Montant (€)</Label>
                <Input
                  id="montant"
                  type="number"
                  value={newDocument.montant}
                  onChange={(e) =>
                    setNewDocument({
                      ...newDocument,
                      montant: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {newDocumentType === "courrier" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="objet">Objet</Label>
                <Input
                  id="objet"
                  value={newDocument.objet}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, objet: e.target.value })
                  }
                  placeholder="Objet du courrier"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newDocument.date}
                    onChange={(e) =>
                      setNewDocument({ ...newDocument, date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newDocument.type}
                    onValueChange={(value: "recu" | "envoye") =>
                      setNewDocument({ ...newDocument, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recu">Reçu</SelectItem>
                      <SelectItem value="envoye">Envoyé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="organisme">Organisme</Label>
                <Select
                  value={newDocument.organisme}
                  onValueChange={(
                    value: "impots" | "urssaf" | "tresor_public",
                  ) => setNewDocument({ ...newDocument, organisme: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="impots">DGI</SelectItem>
                    <SelectItem value="urssaf">URSSAF</SelectItem>
                    <SelectItem value="tresor_public">Trésor Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
