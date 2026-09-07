"use client";

import { useState } from "react";
import { useRegistre, useUpdateFiscalRecord } from "@/hooks/fiscal";
import { downloadStoredFile, type StoredFile } from "@/lib/document-files";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Upload,
  Download,
  AlertTriangle,
  Building,
  Mail,
  Plus,
  Trash2,
  Search,
  Users,
  Shield,
  Heart,
  Calculator,
  Phone,
  Landmark,
  CheckCircle2,
  Clock,
} from "lucide-react";

/** Ouvre la pièce réellement déposée ; explique si la ligne n'en a pas. */
function ouvrirPiece(piece: StoredFile | null | undefined, libelle: string) {
  if (!piece) {
    alert(`Aucun fichier n'a été déposé pour « ${libelle} ».`);
    return;
  }
  void downloadStoredFile(piece);
}

const DOC_STATUTS = [
  { value: "en_attente", label: "En attente" },
  { value: "en_cours", label: "En cours" },
  { value: "traite", label: "Traité" },
];

interface Organisme {
  id: string;
  nom: string;
  type: string;
  description: string;
  icon: string;
  couleur: string;
}

interface Document {
  id: string;
  organismeId: string;
  nom: string;
  type: string;
  dateAjout: string;
  dateModification: string;
  taille: string;
  tags: string[];
  description: string;
  urgent: boolean;
}

interface Courrier {
  id: string;
  organismeId: string;
  objet: string;
  type: "recu" | "envoye";
  date: string;
  expediteur: string;
  destinataire: string;
  statut: "lu" | "non_lu" | "traite" | "en_cours";
  pieceJointe: string | null;
}

/** Document d'organisme tel qu'enregistré : la pièce est un champ à part. */
type DocumentEnregistre = Document & { fichier?: StoredFile | null };
type CourrierEnregistre = Omit<Courrier, "pieceJointe"> & {
  piece?: StoredFile | null;
};

export default function DiversDocumentsPage() {
  // Organismes, documents et courriers enregistrés en base : cet écran ne
  // conservait rien, les dépôts disparaissaient à la reconnexion et les
  // boutons d'ajout n'étaient reliés à rien.
  const registreOrganismes = useRegistre<Organisme>("organisme", []);
  const registreDocuments = useRegistre<DocumentEnregistre>("divers", [
    "fichier",
  ]);
  const registreCourriers = useRegistre<CourrierEnregistre>(
    "courrier_organisme",
    ["piece"],
  );
  // Renomme "Document" → le nom réel une fois le fichier déposé (voir
  // handleAjouterDocument). Appel direct plutôt que registreDocuments.
  // enregistrer(...) : celui-ci s'appuie sur la liste "records" capturée au
  // rendu précédent pour savoir si la ligne existe déjà, or elle vient
  // d'être créée par le même appel — la liste est encore l'ancienne. Il
  // concluait donc à tort "ligne inconnue" et EN CRÉAIT UNE SECONDE, avec le
  // bon nom mais sans le fichier (resté attaché à la première, restée
  // nommée "Document"). Une mise à jour directe sur l'identifiant connu
  // n'a pas ce problème.
  const renommerDocument = useUpdateFiscalRecord();

  const organismes = registreOrganismes.lignes;
  const documents = registreDocuments.lignes;
  const courriers = registreCourriers.lignes;
  const [erreurDepot, setErreurDepot] = useState<string | null>(null);

  const [selectedOrganisme, setSelectedOrganisme] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isAddingOrganisme, setIsAddingOrganisme] = useState(false);
  const [docStatuts, setDocStatuts] = useState<Record<string, string>>({});
  // Organisme visé par un dépôt, en attente du choix du type de document.
  const [organismeDocAAjouter, setOrganismeDocAAjouter] = useState<
    string | null
  >(null);
  const [typeDocAAjouter, setTypeDocAAjouter] = useState("attestation");
  const [isAddingCourrier, setIsAddingCourrier] = useState(false);
  const [newCourrier, setNewCourrier] = useState({
    objet: "",
    type: "recu" as "recu" | "envoye",
    date: new Date().toISOString().split("T")[0],
    expediteur: "",
    destinataire: "",
  });
  const [newOrganisme, setNewOrganisme] = useState({
    nom: "",
    type: "",
    description: "",
  });

  const getIconComponent = (iconName: string) => {
    const icons = {
      shield: Shield,
      users: Users,
      heart: Heart,
      calculator: Calculator,
      landmark: Landmark,
      phone: Phone,
      mail: Mail,
      building: Building,
    };
    return icons[iconName as keyof typeof icons] || Building;
  };

  const getCouleurClasses = (couleur: string) => {
    const couleurs = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      red: "bg-red-100 text-red-800 border-red-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
      teal: "bg-teal-100 text-teal-800 border-teal-200",
      gray: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return (
      couleurs[couleur as keyof typeof couleurs] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getOrganismeDocuments = (organismeId: string) => {
    let filtered = documents.filter((doc) => doc.organismeId === organismeId);

    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((doc) => doc.type === selectedType);
    }

    return filtered;
  };

  const getOrganismeCourriers = (organismeId: string) => {
    return courriers.filter((courrier) => courrier.organismeId === organismeId);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "lu":
      case "traite":
        return "bg-green-500";
      case "en_cours":
        return "bg-orange-500";
      case "non_lu":
        return "bg-red-500";
      case "en_attente":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatutText = (statut: string) => {
    switch (statut) {
      case "lu":
        return "Lu";
      case "non_lu":
        return "Non lu";
      case "traite":
        return "Traité";
      case "en_cours":
        return "En cours";
      case "en_attente":
        return "En attente";
      default:
        return "Inconnu";
    }
  };

  /**
   * Dépose un document pour l'organisme choisi : le fichier part dans le
   * stockage et la ligne est créée en base. Les deux boutons d'ajout de cette
   * page n'étaient reliés à rien.
   */
  const handleAjouterDocument = async (organismeId: string, type: string) => {
    setErreurDepot(null);
    const organisme = organismes.find((o) => o.id === organismeId);
    if (!organisme) {
      setErreurDepot("Sélectionnez d'abord un organisme.");
      return;
    }
    const aujourdhui = new Date().toISOString().split("T")[0];
    const brouillon: DocumentEnregistre = {
      id: `doc-${Date.now()}`,
      organismeId,
      nom: "Document",
      type,
      dateAjout: aujourdhui,
      dateModification: aujourdhui,
      taille: "",
      tags: [],
      description: "",
      urgent: false,
    };
    try {
      const depose = await registreDocuments.televerserPiece(
        brouillon,
        "fichier",
        { period: aujourdhui.slice(0, 4), label: organisme.nom },
      );
      if (!depose) return;
      // Le nom du fichier déposé devient le libellé de la ligne, sur la
      // ligne réellement créée par le dépôt ci-dessus.
      const { id: _brouillonId, ...champsMeta } = brouillon;
      await renommerDocument.mutateAsync({
        recordId: depose.id,
        payload: {
          period: aujourdhui.slice(0, 4),
          label: organisme.nom,
          meta: { ...champsMeta, nom: depose.nom },
        },
      });
    } catch (e) {
      setErreurDepot(
        e instanceof Error ? e.message : "Le dépôt du document a échoué.",
      );
    }
  };

  /** Supprime un organisme ainsi que ses documents et courriers. */
  const handleDeleteOrganisme = async (organisme: Organisme) => {
    if (
      !confirm(
        `Supprimer l'organisme « ${organisme.nom} » ? Ses documents et courriers seront également supprimés.`,
      )
    ) {
      return;
    }
    const docs = documents.filter((d) => d.organismeId === organisme.id);
    const lettres = courriers.filter((c) => c.organismeId === organisme.id);
    await Promise.all([
      ...docs.map((d) => registreDocuments.supprimerLigne(d.id)),
      ...lettres.map((c) => registreCourriers.supprimerLigne(c.id)),
    ]);
    await registreOrganismes.supprimerLigne(organisme.id);
    if (selectedOrganisme === organisme.id) setSelectedOrganisme("");
  };

  const handleAddOrganisme = () => {
    if (newOrganisme.nom && newOrganisme.type) {
      const organisme: Organisme = {
        id: Date.now().toString(),
        nom: newOrganisme.nom,
        type: newOrganisme.type,
        description: newOrganisme.description,
        icon: "building",
        couleur: "blue",
      };
      void registreOrganismes.enregistrer(organisme, {
        period: String(new Date().getFullYear()),
        label: organisme.nom,
      });
      setNewOrganisme({ nom: "", type: "", description: "" });
      setIsAddingOrganisme(false);
    }
  };

  const typesDocuments = [
    "all",
    "attestation",
    "contrat",
    "courrier",
    "releve",
    "facture",
    "devis",
  ];
  const typesOrganismes = [
    "organisme_social",
    "assurance",
    "professionnel",
    "financier",
    "organisme_officiel",
  ];

  return (
    <div className="space-y-6">
      {erreurDepot && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {erreurDepot}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Divers Documents</h1>
          <p className="text-muted-foreground">
            Organisation des documents et courriers par organisme
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAddingOrganisme(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter Organisme
          </Button>
          <Button
            className="flex items-center gap-2"
            disabled={!selectedOrganisme}
            title={
              selectedOrganisme
                ? undefined
                : "Ouvrez d'abord un organisme pour y déposer un document"
            }
            onClick={() => {
              setTypeDocAAjouter("attestation");
              setOrganismeDocAAjouter(selectedOrganisme);
            }}
          >
            <Upload className="h-4 w-4" />
            Nouveau Document
          </Button>
        </div>
      </div>

      {!selectedOrganisme ? (
        <div className="space-y-6">
          {/* Statistiques */}
          <InfoCardContainer className="md:grid-cols-4">
            <InfoCard
              icon={Building}
              title="Organismes"
              value={organismes.length}
              color="blue"
            />
            <InfoCard
              icon={FileText}
              title="Documents"
              value={documents.length}
              color="green"
            />
            <InfoCard
              icon={AlertTriangle}
              title="Urgents"
              value={documents.filter((doc) => doc.urgent).length}
              color="red"
            />
            <InfoCard
              icon={Mail}
              title="Courriers"
              value={courriers.length}
              color="orange"
            />
          </InfoCardContainer>

          {/* Liste des organismes */}
          <Card>
            <CardHeader>
              <CardTitle>Organismes</CardTitle>
              <CardDescription>
                Cliquez sur un organisme pour accéder à ses documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organismes.map((organisme) => {
                  const Icon = getIconComponent(organisme.icon);
                  const docsCount = documents.filter(
                    (doc) => doc.organismeId === organisme.id,
                  ).length;
                  const courriersCount = courriers.filter(
                    (courrier) => courrier.organismeId === organisme.id,
                  ).length;

                  return (
                    <Card
                      key={organisme.id}
                      className="cursor-pointer hover:shadow-md transition-shadow relative"
                      onClick={() => setSelectedOrganisme(organisme.id)}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-7 w-7 text-red-500 hover:text-red-500"
                        title="Supprimer l'organisme"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteOrganisme(organisme);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={`p-3 rounded-full ${getCouleurClasses(organisme.couleur).split(" ")[0]} ${getCouleurClasses(organisme.couleur).split(" ")[1]}`}
                          >
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{organisme.nom}</h3>
                            <Badge
                              variant="outline"
                              className={getCouleurClasses(organisme.couleur)}
                            >
                              {organisme.type.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                          {organisme.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-center">
                            <p className="font-medium">{docsCount}</p>
                            <p className="text-muted-foreground">Documents</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{courriersCount}</p>
                            <p className="text-muted-foreground">Courriers</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Vue détaillée d'un organisme */
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedOrganisme("")}>
              ← Retour
            </Button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {organismes.find((org) => org.id === selectedOrganisme)?.nom}
              </h2>
              <p className="text-muted-foreground">
                {
                  organismes.find((org) => org.id === selectedOrganisme)
                    ?.description
                }
              </p>
            </div>
          </div>

          {/* Filtres et recherche */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Rechercher dans les documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {typesDocuments
                      .filter((type) => type !== "all")
                      .map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="documents" className="space-y-4">
            <TabsList>
              <TabsTrigger value="documents" className="text-lg font-semibold">
                Documents ({getOrganismeDocuments(selectedOrganisme).length})
              </TabsTrigger>
              <TabsTrigger value="courriers" className="text-lg font-semibold">
                Courriers ({getOrganismeCourriers(selectedOrganisme).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getOrganismeDocuments(selectedOrganisme).map(
                      (document) => (
                        <div
                          key={document.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold">
                                    {document.nom}
                                  </h3>
                                  <Badge
                                    className={getStatutColor(
                                      docStatuts[document.id] ?? "en_attente",
                                    )}
                                  >
                                    {getStatutText(
                                      docStatuts[document.id] ?? "en_attente",
                                    )}
                                  </Badge>
                                  {document.urgent && (
                                    <Badge className="bg-red-500">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Urgent
                                    </Badge>
                                  )}
                                  <Badge variant="outline">
                                    {document.type}
                                  </Badge>
                                </div>
                                <p className="text-base text-muted-foreground mt-1">
                                  {document.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                  <span>
                                    Ajouté le{" "}
                                    {new Date(
                                      document.dateAjout,
                                    ).toLocaleDateString("fr-FR")}
                                  </span>
                                  <span>Taille: {document.taille}</span>
                                  <div className="flex gap-1">
                                    {document.tags.map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Select
                                value={docStatuts[document.id] ?? "en_attente"}
                                onValueChange={(v) =>
                                  setDocStatuts((prev) => ({
                                    ...prev,
                                    [document.id]: v,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8 w-[150px] text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DOC_STATUTS.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>
                                      {s.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <RowActionsMenu
                                // « Voir » ouvre directement le fichier déposé,
                                // sans passer par la fenêtre de détail.
                                onView={() =>
                                  ouvrirPiece(document.fichier, document.nom)
                                }
                                onDownload={() =>
                                  ouvrirPiece(document.fichier, document.nom)
                                }
                                onDelete={() =>
                                  void registreDocuments.supprimerLigne(
                                    document.id,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={() => {
                      setTypeDocAAjouter("attestation");
                      setOrganismeDocAAjouter(selectedOrganisme);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un document
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="courriers">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="h-5 w-5" />
                    Courriers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getOrganismeCourriers(selectedOrganisme).map(
                      (courrier) => (
                        <div
                          key={courrier.id}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-full ${
                                  courrier.type === "recu"
                                    ? "bg-blue-100"
                                    : "bg-green-100"
                                }`}
                              >
                                <Mail
                                  className={`h-4 w-4 ${
                                    courrier.type === "recu"
                                      ? "text-blue-500"
                                      : "text-green-500"
                                  }`}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg font-semibold">
                                    {courrier.objet}
                                  </h3>
                                  <Badge
                                    variant="outline"
                                    className={
                                      courrier.type === "recu"
                                        ? "border-blue-200"
                                        : "border-green-200"
                                    }
                                  >
                                    {courrier.type === "recu"
                                      ? "Reçu"
                                      : "Envoyé"}
                                  </Badge>
                                </div>
                                <div className="text-base text-muted-foreground mt-1">
                                  <p>
                                    De: {courrier.expediteur} → À:{" "}
                                    {courrier.destinataire}
                                  </p>
                                  <p>
                                    {new Date(courrier.date).toLocaleDateString(
                                      "fr-FR",
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={getStatutColor(courrier.statut)}
                              >
                                {getStatutText(courrier.statut)}
                              </Badge>
                              {courrier.piece && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    ouvrirPiece(courrier.piece, courrier.objet)
                                  }
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              <RowActionsMenu
                                onView={
                                  courrier.piece
                                    ? () =>
                                        ouvrirPiece(
                                          courrier.piece,
                                          courrier.objet,
                                        )
                                    : undefined
                                }
                                onDelete={() =>
                                  void registreCourriers.supprimerLigne(
                                    courrier.id,
                                  )
                                }
                                extraItems={[
                                  {
                                    label: "Marquer en cours",
                                    icon: Clock,
                                    tone: "history" as const,
                                    onClick: () =>
                                      void registreCourriers.enregistrer(
                                        { ...courrier, statut: "en_cours" },
                                        {
                                          period: (courrier.date ?? "").slice(
                                            0,
                                            4,
                                          ),
                                          label: courrier.objet,
                                          status: "en_cours",
                                        },
                                      ),
                                  },
                                  {
                                    label: "Marquer comme traité",
                                    icon: CheckCircle2,
                                    tone: "validate" as const,
                                    onClick: () =>
                                      void registreCourriers.enregistrer(
                                        { ...courrier, statut: "traite" },
                                        {
                                          period: (courrier.date ?? "").slice(
                                            0,
                                            4,
                                          ),
                                          label: courrier.objet,
                                          status: "traite",
                                        },
                                      ),
                                  },
                                ]}
                              />
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={() => setIsAddingCourrier(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau courrier
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Dialog pour ajouter un organisme */}
      <Modal
        open={isAddingOrganisme}
        onOpenChange={setIsAddingOrganisme}
        type="form"
        title="Ajouter un nouvel organisme"
        description="Créez un nouvel organisme pour organiser vos documents"
        size="md"
        actions={{
          primary: {
            label: "Ajouter",
            onClick: handleAddOrganisme,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsAddingOrganisme(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom de l&apos;organisme</Label>
            <Input
              id="nom"
              value={newOrganisme.nom}
              onChange={(e) =>
                setNewOrganisme({ ...newOrganisme, nom: e.target.value })
              }
              placeholder="Ex: Nouvelle Mutuelle"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type d&apos;organisme</Label>
            <Select
              value={newOrganisme.type}
              onValueChange={(value) =>
                setNewOrganisme({ ...newOrganisme, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                {typesOrganismes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace("_", " ").charAt(0).toUpperCase() +
                      type.replace("_", " ").slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newOrganisme.description}
              onChange={(e) =>
                setNewOrganisme({
                  ...newOrganisme,
                  description: e.target.value,
                })
              }
              placeholder="Description de l'organisme..."
            />
          </div>
        </div>
      </Modal>

      {/* Choix du type avant dépôt : tout partait auparavant en "attestation". */}
      <Modal
        open={!!organismeDocAAjouter}
        onOpenChange={(o) => !o && setOrganismeDocAAjouter(null)}
        type="form"
        title="Type de document"
        description="Choisissez le type avant de sélectionner le fichier."
        size="sm"
        actions={{
          primary: {
            label: "Choisir le fichier",
            onClick: () => {
              if (!organismeDocAAjouter) return;
              const organismeId = organismeDocAAjouter;
              setOrganismeDocAAjouter(null);
              void handleAjouterDocument(organismeId, typeDocAAjouter);
            },
          },
          secondary: {
            label: "Annuler",
            onClick: () => setOrganismeDocAAjouter(null),
            variant: "outline" as const,
          },
        }}
      >
        <div>
          <Label htmlFor="type-doc-a-ajouter">Type de document</Label>
          <Select value={typeDocAAjouter} onValueChange={setTypeDocAAjouter}>
            <SelectTrigger id="type-doc-a-ajouter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typesDocuments
                .filter((t) => t !== "all")
                .map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </Modal>

      {/* Création d'un courrier : le bouton "Nouveau courrier" n'était relié
          à rien. */}
      <Modal
        open={isAddingCourrier}
        onOpenChange={setIsAddingCourrier}
        type="form"
        title="Nouveau courrier"
        size="md"
        actions={{
          primary: {
            label: "Créer",
            disabled: !newCourrier.objet,
            onClick: () => {
              if (!selectedOrganisme) return;
              const ligne: CourrierEnregistre = {
                id: `courrier-${Date.now()}`,
                organismeId: selectedOrganisme,
                objet: newCourrier.objet,
                type: newCourrier.type,
                date: newCourrier.date,
                expediteur: newCourrier.expediteur,
                destinataire: newCourrier.destinataire,
                statut: "non_lu",
                piece: null,
              };
              void registreCourriers.enregistrer(ligne, {
                period: newCourrier.date.slice(0, 7),
                label: newCourrier.objet,
              });
              setIsAddingCourrier(false);
              setNewCourrier({
                objet: "",
                type: "recu",
                date: new Date().toISOString().split("T")[0],
                expediteur: "",
                destinataire: "",
              });
            },
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsAddingCourrier(false),
            variant: "outline" as const,
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="courrier-objet">Objet</Label>
            <Input
              id="courrier-objet"
              value={newCourrier.objet}
              onChange={(e) =>
                setNewCourrier({ ...newCourrier, objet: e.target.value })
              }
              placeholder="Ex : Relance déclaration TVA"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="courrier-type">Type</Label>
              <Select
                value={newCourrier.type}
                onValueChange={(v: "recu" | "envoye") =>
                  setNewCourrier({ ...newCourrier, type: v })
                }
              >
                <SelectTrigger id="courrier-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recu">Reçu</SelectItem>
                  <SelectItem value="envoye">Envoyé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="courrier-date">Date</Label>
              <Input
                id="courrier-date"
                type="date"
                value={newCourrier.date}
                onChange={(e) =>
                  setNewCourrier({ ...newCourrier, date: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="courrier-expediteur">Expéditeur</Label>
              <Input
                id="courrier-expediteur"
                value={newCourrier.expediteur}
                onChange={(e) =>
                  setNewCourrier({
                    ...newCourrier,
                    expediteur: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="courrier-destinataire">Destinataire</Label>
              <Input
                id="courrier-destinataire"
                value={newCourrier.destinataire}
                onChange={(e) =>
                  setNewCourrier({
                    ...newCourrier,
                    destinataire: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
