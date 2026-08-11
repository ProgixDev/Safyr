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
  Building,
  Mail,
  Plus,
  Receipt,
  CreditCard,
  Eye,
  FileText,
} from "lucide-react";
import {
  DocumentActionsMenu,
  RowActionsMenu,
} from "@/components/ui/row-actions-menu";
import {
  pickAndUploadFile,
  downloadStoredFile,
  type StoredFile,
} from "@/lib/document-files";

/** Cellule document : télécharger si présent, téléverser sinon. */
function DocumentCell({
  file,
  onUpload,
  onView,
}: {
  file: StoredFile | null;
  onUpload: () => void;
  onView?: () => void;
}) {
  if (!file) {
    return (
      <Button variant="outline" size="sm" onClick={onUpload}>
        <Upload className="h-3 w-3 mr-1" />
        Téléverser
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => void downloadStoredFile(file)}
        title={file.name}
      >
        <Download className="h-3 w-3 mr-1" />
        Télécharger
      </Button>
      {onView && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onView}
          title={`Voir ${file.name}`}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={onUpload}
        title="Remplacer le document"
      >
        <Upload className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface TVADocument {
  id: string;
  mois: string;
  annee: string;
  grandLivre: StoredFile | null;
  declaration: StoredFile | null;
  arDeclaration: StoredFile | null;
  paiement: StoredFile | null;
  statut: "complet" | "partiel" | "manquant";
  dateEcheance: string;
}

interface CFEDocument {
  id: string;
  annee: string;
  declaration: StoredFile | null;
  avis: StoredFile | null;
  paiement: StoredFile | null;
  statut: "complet" | "partiel" | "manquant";
  montant: number;
}

interface PrelevementDocument {
  id: string;
  periode: string;
  declaration: StoredFile | null;
  bordereau: StoredFile | null;
  statut: "declare" | "en_attente" | "en_retard";
  montant: number;
}

interface Courrier {
  id: string;
  date: string;
  type: "recu" | "envoye";
  objet: string;
  document: StoredFile | null;
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

  const [tvaDossiers, setTvaDossiers] = useState<TVADocument[]>([]);

  const [cfeDossiers, setCfeDossiers] = useState<CFEDocument[]>([]);

  const [prelevements, setPrelevements] = useState<PrelevementDocument[]>([]);

  const [courriers, setCourriers] = useState<Courrier[]>([]);

  // ── Courriers : menu action (voir / téléverser / télécharger / supprimer) ──
  const [viewedCourrier, setViewedCourrier] = useState<Courrier | null>(null);

  const handleViewCourrier = (courrier: Courrier) => {
    setViewedCourrier(courrier);
  };

  /** Attache (ou remplace) le document scanné du courrier. */
  const handleUploadCourrier = async (courrier: Courrier) => {
    const fichier = await televerser();
    if (!fichier) return;
    setCourriers((prev) =>
      prev.map((c) => (c.id === courrier.id ? { ...c, document: fichier } : c)),
    );
    setViewedCourrier((current) =>
      current?.id === courrier.id ? { ...current, document: fichier } : current,
    );
    confirmUpload(`le courrier « ${courrier.objet} »`, fichier.name);
  };

  const handleDeleteCourrier = (courrier: Courrier) => {
    setCourriers((prev) => prev.filter((c) => c.id !== courrier.id));
    setViewedCourrier((current) =>
      current?.id === courrier.id ? null : current,
    );
  };

  // ── Téléversement : confirmation visible après chaque dépôt ──────────────
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  /**
   * Sélectionne un fichier et l'envoie réellement dans le stockage : sans cela
   * « Télécharger » ne pouvait rendre qu'un texte d'espace réservé.
   */
  const televerser = async (): Promise<StoredFile | null> => {
    try {
      return await pickAndUploadFile();
    } catch (e) {
      alert(
        `Échec du téléversement : ${
          e instanceof Error ? e.message : "Erreur inconnue"
        }`,
      );
      return null;
    }
  };

  const confirmUpload = (label: string, filename: string) => {
    setUploadNotice(`« ${filename} » enregistré pour ${label}.`);
  };

  // ── Dossiers TVA : téléversement, consultation, modification ────────────
  type TvaDocField =
    | "grandLivre"
    | "declaration"
    | "arDeclaration"
    | "paiement";

  const TVA_DOC_LABELS: Record<TvaDocField, string> = {
    grandLivre: "Grand Livre TVA",
    declaration: "Déclaration TVA",
    arDeclaration: "AR Déclaration",
    paiement: "Paiement TVA",
  };

  /** Recalcule le statut d'un dossier TVA d'après les documents déposés. */
  const withTvaStatut = (dossier: TVADocument): TVADocument => {
    const docs = [
      dossier.grandLivre,
      dossier.declaration,
      dossier.arDeclaration,
      dossier.paiement,
    ];
    const presents = docs.filter(Boolean).length;
    return {
      ...dossier,
      statut:
        presents === docs.length
          ? "complet"
          : presents === 0
            ? "manquant"
            : "partiel",
    };
  };

  /**
   * Attache un document à un dossier TVA. Le tableau affiche les 12 mois même
   * quand aucun dossier n'existe encore : dans ce cas le dossier est créé à la
   * volée, sinon le téléversement serait perdu.
   */
  const handleUploadTva = async (dossier: TVADocument, field: TvaDocField) => {
    const fichier = await televerser();
    if (!fichier) return;

    setTvaDossiers((prev) => {
      const existe = prev.some(
        (d) => d.mois === dossier.mois && d.annee === dossier.annee,
      );
      const base = existe ? prev : [...prev, dossier];
      return base.map((d) =>
        d.mois === dossier.mois && d.annee === dossier.annee
          ? withTvaStatut({ ...d, [field]: fichier })
          : d,
      );
    });
    // La modale de consultation travaille sur une copie : on la rafraîchit
    // pour que le document apparaisse immédiatement quand elle est ouverte.
    setViewedTva((current) =>
      current &&
      current.mois === dossier.mois &&
      current.annee === dossier.annee
        ? withTvaStatut({ ...current, [field]: fichier })
        : current,
    );
    confirmUpload(
      `${TVA_DOC_LABELS[field]} — ${dossier.mois} ${dossier.annee}`,
      fichier.name,
    );
  };

  const [viewedTva, setViewedTva] = useState<TVADocument | null>(null);
  const [editedTva, setEditedTva] = useState<TVADocument | null>(null);

  const handleSaveTva = () => {
    if (!editedTva) return;
    setTvaDossiers((prev) => {
      const existe = prev.some(
        (d) => d.mois === editedTva.mois && d.annee === editedTva.annee,
      );
      const base = existe ? prev : [...prev, editedTva];
      return base.map((d) =>
        d.mois === editedTva.mois && d.annee === editedTva.annee
          ? editedTva
          : d,
      );
    });
    setEditedTva(null);
  };

  // ── CFE : téléversement, consultation, modification, suppression ────────
  type CfeDocField = "declaration" | "avis" | "paiement";

  const CFE_DOC_LABELS: Record<CfeDocField, string> = {
    declaration: "Déclaration CFE",
    avis: "Avis CFE",
    paiement: "Justificatif de paiement",
  };

  const withCfeStatut = (dossier: CFEDocument): CFEDocument => {
    const docs = [dossier.declaration, dossier.avis, dossier.paiement];
    const presents = docs.filter(Boolean).length;
    return {
      ...dossier,
      statut:
        presents === docs.length
          ? "complet"
          : presents === 0
            ? "manquant"
            : "partiel",
    };
  };

  const handleUploadCfe = async (dossier: CFEDocument, field: CfeDocField) => {
    const fichier = await televerser();
    if (!fichier) return;
    setCfeDossiers((prev) =>
      prev.map((d) =>
        d.id === dossier.id ? withCfeStatut({ ...d, [field]: fichier }) : d,
      ),
    );
    setViewedCfe((current) =>
      current?.id === dossier.id
        ? withCfeStatut({ ...current, [field]: fichier })
        : current,
    );
    confirmUpload(`${CFE_DOC_LABELS[field]} ${dossier.annee}`, fichier.name);
  };

  const [viewedCfe, setViewedCfe] = useState<CFEDocument | null>(null);
  const [editedCfe, setEditedCfe] = useState<CFEDocument | null>(null);
  const [cfeToDelete, setCfeToDelete] = useState<CFEDocument | null>(null);

  const handleSaveCfe = () => {
    if (!editedCfe) return;
    setCfeDossiers((prev) =>
      prev.map((d) => (d.id === editedCfe.id ? editedCfe : d)),
    );
    setEditedCfe(null);
  };

  const handleDeleteCfe = () => {
    if (!cfeToDelete) return;
    setCfeDossiers((prev) => prev.filter((d) => d.id !== cfeToDelete.id));
    setViewedCfe((current) =>
      current?.id === cfeToDelete.id ? null : current,
    );
    setCfeToDelete(null);
  };

  // ── Prélèvement à la source : mêmes actions ─────────────────────────────
  type PrelevementDocField = "declaration" | "bordereau";

  const PRELEVEMENT_DOC_LABELS: Record<PrelevementDocField, string> = {
    declaration: "Déclaration",
    bordereau: "Bordereau de versement",
  };

  const handleUploadPrelevement = async (
    prelevement: PrelevementDocument,
    field: PrelevementDocField,
  ) => {
    const fichier = await televerser();
    if (!fichier) return;
    setPrelevements((prev) =>
      prev.map((p) =>
        p.id === prelevement.id
          ? {
              ...p,
              [field]: fichier,
              statut:
                field === "declaration" && p.bordereau
                  ? "declare"
                  : field === "bordereau" && p.declaration
                    ? "declare"
                    : p.statut,
            }
          : p,
      ),
    );
    setViewedPrelevement((current) =>
      current?.id === prelevement.id
        ? { ...current, [field]: fichier }
        : current,
    );
    confirmUpload(
      `${PRELEVEMENT_DOC_LABELS[field]} — ${prelevement.periode}`,
      fichier.name,
    );
  };

  const [viewedPrelevement, setViewedPrelevement] =
    useState<PrelevementDocument | null>(null);
  const [editedPrelevement, setEditedPrelevement] =
    useState<PrelevementDocument | null>(null);
  const [prelevementToDelete, setPrelevementToDelete] =
    useState<PrelevementDocument | null>(null);

  const handleSavePrelevement = () => {
    if (!editedPrelevement) return;
    setPrelevements((prev) =>
      prev.map((p) => (p.id === editedPrelevement.id ? editedPrelevement : p)),
    );
    setEditedPrelevement(null);
  };

  const handleDeletePrelevement = () => {
    if (!prelevementToDelete) return;
    setPrelevements((prev) =>
      prev.filter((p) => p.id !== prelevementToDelete.id),
    );
    setViewedPrelevement((current) =>
      current?.id === prelevementToDelete.id ? null : current,
    );
    setPrelevementToDelete(null);
  };

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
    ...(
      ["grandLivre", "declaration", "arDeclaration", "paiement"] as const
    ).map<ColumnDef<TVADocument>>((field) => ({
      key: field,
      label: TVA_DOC_LABELS[field],
      render: (dossier) => (
        <DocumentCell
          file={dossier[field]}
          onUpload={() => void handleUploadTva(dossier, field)}
          onView={() => handleViewDocument(dossier, field)}
        />
      ),
    })),
    {
      key: "statut",
      label: "Statut",
      render: (dossier) => (
        <Select
          value={dossier.statut}
          onValueChange={(value: "complet" | "partiel" | "manquant") => {
            // Mettre à jour le statut directement
            setTvaDossiers((prev) =>
              prev.map((d) =>
                d.id === dossier.id ? { ...d, statut: value } : d,
              ),
            );
          }}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue>
              <Badge className={getStatutColor(dossier.statut)}>
                {getStatutText(dossier.statut)}
              </Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="complet">
              <Badge className="bg-green-500">Complet</Badge>
            </SelectItem>
            <SelectItem value="partiel">
              <Badge className="bg-orange-500">Partiel</Badge>
            </SelectItem>
            <SelectItem value="manquant">
              <Badge className="bg-red-500">Manquant</Badge>
            </SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ];

  const tvaActions = (dossier: TVADocument) => (
    <RowActionsMenu
      onView={() => setViewedTva(dossier)}
      onEdit={() => setEditedTva(dossier)}
    />
  );

  const [previewDocument, setPreviewDocument] = useState<{
    file: StoredFile;
    content: string;
    type: string;
  } | null>(null);

  /**
   * « Voir » : ouvre le fichier réellement déposé. Les lignes d'exemple n'ont
   * pas de fichier associé — on affiche alors une fiche d'information plutôt
   * qu'un document trompeur.
   */
  const handleViewDocument = (dossier: TVADocument, type: TvaDocField) => {
    const fichier = dossier[type];
    const label = TVA_DOC_LABELS[type];

    if (!fichier) return;

    if (fichier.key) {
      void downloadStoredFile(fichier);
      return;
    }

    setPreviewDocument({
      file: fichier,
      content: `Document : ${fichier.name}\n\nMois : ${dossier.mois}\nAnnée : ${dossier.annee}\nStatut : ${getStatutText(dossier.statut)}\n\n${label}\n${"-".repeat(label.length)}\n\n${
        fichier.key
          ? "Cliquez sur « Télécharger » pour ouvrir le fichier déposé."
          : "Exemple de démonstration : aucun fichier n'a été déposé pour cette ligne."
      }`,
      type: label,
    });
  };

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

      {/* Confirmation visible du dernier téléversement */}
      {uploadNotice && (
        <div
          role="status"
          className="flex items-center justify-between gap-4 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm"
        >
          <span>{uploadNotice}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUploadNotice(null)}
          >
            Fermer
          </Button>
        </div>
      )}

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
        <TabsList className="grid w-full grid-cols-4 text-base h-auto p-1">
          <TabsTrigger value="tva" className="text-base py-3 px-4">
            Dossiers TVA
          </TabsTrigger>
          <TabsTrigger value="cfe" className="text-base py-3 px-4">
            CFE
          </TabsTrigger>
          <TabsTrigger value="prelevement" className="text-base py-3 px-4">
            Prélèvement Source
          </TabsTrigger>
          <TabsTrigger value="courriers" className="text-base py-3 px-4">
            Courriers
          </TabsTrigger>
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
                actions={tvaActions}
                onRowClick={(dossier) => setViewedTva(dossier)}
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
                  ...(["declaration", "avis", "paiement"] as const).map<
                    ColumnDef<CFEDocument>
                  >((field) => ({
                    key: field,
                    label: CFE_DOC_LABELS[field],
                    render: (dossier) => (
                      <DocumentCell
                        file={dossier[field]}
                        onUpload={() => void handleUploadCfe(dossier, field)}
                      />
                    ),
                  })),
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
                actions={(dossier) => (
                  <RowActionsMenu
                    onView={() => setViewedCfe(dossier)}
                    onEdit={() => setEditedCfe(dossier)}
                    onDelete={() => setCfeToDelete(dossier)}
                  />
                )}
                onRowClick={(dossier) => setViewedCfe(dossier)}
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
                  ...(["declaration", "bordereau"] as const).map<
                    ColumnDef<PrelevementDocument>
                  >((field) => ({
                    key: field,
                    label: PRELEVEMENT_DOC_LABELS[field],
                    render: (prelevement) => (
                      <DocumentCell
                        file={prelevement[field]}
                        onUpload={() =>
                          void handleUploadPrelevement(prelevement, field)
                        }
                      />
                    ),
                  })),
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
                actions={(prelevement) => (
                  <RowActionsMenu
                    onView={() => setViewedPrelevement(prelevement)}
                    onEdit={() => setEditedPrelevement(prelevement)}
                    onDelete={() => setPrelevementToDelete(prelevement)}
                  />
                )}
                onRowClick={(prelevement) => setViewedPrelevement(prelevement)}
              />
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
                      <DocumentActionsMenu
                        onView={() => handleViewCourrier(courrier)}
                        onUpload={() => void handleUploadCourrier(courrier)}
                        onDownload={
                          courrier.document
                            ? () => void downloadStoredFile(courrier.document!)
                            : undefined
                        }
                        onDelete={() => handleDeleteCourrier(courrier)}
                      />
                    ),
                  },
                ]}
                searchKey="objet"
                searchPlaceholder="Rechercher un courrier..."
                onRowClick={handleViewCourrier}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal consultation d'un courrier */}
      <Modal
        open={!!viewedCourrier}
        onOpenChange={(open) => !open && setViewedCourrier(null)}
        type="details"
        title="Détail du courrier"
        size="md"
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setViewedCourrier(null),
          },
          ...(viewedCourrier?.document
            ? {
                secondary: {
                  label: "Télécharger",
                  variant: "outline" as const,
                  onClick: () =>
                    void downloadStoredFile(viewedCourrier.document!),
                },
              }
            : {}),
        }}
      >
        {viewedCourrier && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(viewedCourrier.date).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <p className="text-sm text-muted-foreground">
                  {viewedCourrier.type === "recu" ? "Reçu" : "Envoyé"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Organisme</Label>
                <p className="text-sm text-muted-foreground">
                  {getOrganismeText(viewedCourrier.organisme)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <p className="text-sm text-muted-foreground">
                  {getStatutText(viewedCourrier.statut)}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Objet</Label>
              <p className="text-sm text-muted-foreground">
                {viewedCourrier.objet}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Document joint</Label>
              <p className="text-sm text-muted-foreground">
                {viewedCourrier.document?.name ?? "Aucun document joint"}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Dossier TVA — consultation */}
      <Modal
        open={!!viewedTva}
        onOpenChange={(open) => !open && setViewedTva(null)}
        type="details"
        title={
          viewedTva
            ? `Dossier TVA — ${viewedTva.mois} ${viewedTva.annee}`
            : "Dossier TVA"
        }
        size="md"
        actions={{
          primary: { label: "Fermer", onClick: () => setViewedTva(null) },
          secondary: {
            label: "Modifier",
            variant: "outline" as const,
            onClick: () => {
              setEditedTva(viewedTva);
              setViewedTva(null);
            },
          },
        }}
      >
        {viewedTva && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Échéance</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(viewedTva.dateEcheance).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <p className="text-sm text-muted-foreground">
                  {getStatutText(viewedTva.statut)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {(Object.keys(TVA_DOC_LABELS) as TvaDocField[]).map((field) => (
                <div
                  key={field}
                  className="flex items-center justify-between gap-4 rounded border px-3 py-2"
                >
                  <span className="text-sm">{TVA_DOC_LABELS[field]}</span>
                  <DocumentCell
                    file={viewedTva[field]}
                    onUpload={() => void handleUploadTva(viewedTva, field)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Dossier TVA — modification */}
      <Modal
        open={!!editedTva}
        onOpenChange={(open) => !open && setEditedTva(null)}
        type="form"
        size="md"
        title={
          editedTva
            ? `Modifier le dossier TVA — ${editedTva.mois} ${editedTva.annee}`
            : "Modifier le dossier TVA"
        }
        actions={{
          primary: { label: "Enregistrer", onClick: handleSaveTva },
          secondary: {
            label: "Annuler",
            variant: "outline" as const,
            onClick: () => setEditedTva(null),
          },
        }}
      >
        {editedTva && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="tva-echeance">Date d&apos;échéance</Label>
              <Input
                id="tva-echeance"
                type="date"
                value={editedTva.dateEcheance}
                onChange={(e) =>
                  setEditedTva({ ...editedTva, dateEcheance: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="tva-statut">Statut</Label>
              <Select
                value={editedTva.statut}
                onValueChange={(value: "complet" | "partiel" | "manquant") =>
                  setEditedTva({ ...editedTva, statut: value })
                }
              >
                <SelectTrigger id="tva-statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complet">Complet</SelectItem>
                  <SelectItem value="partiel">Partiel</SelectItem>
                  <SelectItem value="manquant">Manquant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Modal>

      {/* CFE — consultation */}
      <Modal
        open={!!viewedCfe}
        onOpenChange={(open) => !open && setViewedCfe(null)}
        type="details"
        size="md"
        title={viewedCfe ? `Dossier CFE ${viewedCfe.annee}` : "Dossier CFE"}
        actions={{
          primary: { label: "Fermer", onClick: () => setViewedCfe(null) },
          secondary: {
            label: "Modifier",
            variant: "outline" as const,
            onClick: () => {
              setEditedCfe(viewedCfe);
              setViewedCfe(null);
            },
          },
        }}
      >
        {viewedCfe && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Montant</Label>
                <p className="text-sm text-muted-foreground">
                  {viewedCfe.montant.toLocaleString()} €
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <p className="text-sm text-muted-foreground">
                  {getStatutText(viewedCfe.statut)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {(Object.keys(CFE_DOC_LABELS) as CfeDocField[]).map((field) => (
                <div
                  key={field}
                  className="flex items-center justify-between gap-4 rounded border px-3 py-2"
                >
                  <span className="text-sm">{CFE_DOC_LABELS[field]}</span>
                  <DocumentCell
                    file={viewedCfe[field]}
                    onUpload={() => void handleUploadCfe(viewedCfe, field)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* CFE — modification */}
      <Modal
        open={!!editedCfe}
        onOpenChange={(open) => !open && setEditedCfe(null)}
        type="form"
        size="md"
        title="Modifier le dossier CFE"
        actions={{
          primary: { label: "Enregistrer", onClick: handleSaveCfe },
          secondary: {
            label: "Annuler",
            variant: "outline" as const,
            onClick: () => setEditedCfe(null),
          },
        }}
      >
        {editedCfe && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cfe-annee">Année</Label>
              <Select
                value={editedCfe.annee}
                onValueChange={(value) =>
                  setEditedCfe({ ...editedCfe, annee: value })
                }
              >
                <SelectTrigger id="cfe-annee">
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
            <div>
              <Label htmlFor="cfe-montant">Montant (€)</Label>
              <Input
                id="cfe-montant"
                type="number"
                value={editedCfe.montant}
                onChange={(e) =>
                  setEditedCfe({
                    ...editedCfe,
                    montant: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="cfe-statut">Statut</Label>
              <Select
                value={editedCfe.statut}
                onValueChange={(value: "complet" | "partiel" | "manquant") =>
                  setEditedCfe({ ...editedCfe, statut: value })
                }
              >
                <SelectTrigger id="cfe-statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complet">Complet</SelectItem>
                  <SelectItem value="partiel">Partiel</SelectItem>
                  <SelectItem value="manquant">Manquant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Modal>

      {/* CFE — suppression */}
      <Modal
        open={!!cfeToDelete}
        onOpenChange={(open) => !open && setCfeToDelete(null)}
        type="confirmation"
        title="Supprimer le dossier CFE"
        actions={{
          primary: { label: "Supprimer", onClick: handleDeleteCfe },
          secondary: {
            label: "Annuler",
            variant: "outline" as const,
            onClick: () => setCfeToDelete(null),
          },
        }}
      >
        <p>
          Êtes-vous sûr de vouloir supprimer le dossier CFE{" "}
          <span className="font-semibold">{cfeToDelete?.annee}</span> ainsi que
          ses documents ? Cette action est irréversible.
        </p>
      </Modal>

      {/* Prélèvement à la source — consultation */}
      <Modal
        open={!!viewedPrelevement}
        onOpenChange={(open) => !open && setViewedPrelevement(null)}
        type="details"
        size="md"
        title={
          viewedPrelevement
            ? `Prélèvement à la source — ${viewedPrelevement.periode}`
            : "Prélèvement à la source"
        }
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setViewedPrelevement(null),
          },
          secondary: {
            label: "Modifier",
            variant: "outline" as const,
            onClick: () => {
              setEditedPrelevement(viewedPrelevement);
              setViewedPrelevement(null);
            },
          },
        }}
      >
        {viewedPrelevement && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Montant</Label>
                <p className="text-sm text-muted-foreground">
                  {viewedPrelevement.montant.toLocaleString()} €
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <p className="text-sm text-muted-foreground">
                  {getStatutText(viewedPrelevement.statut)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {(
                Object.keys(PRELEVEMENT_DOC_LABELS) as PrelevementDocField[]
              ).map((field) => (
                <div
                  key={field}
                  className="flex items-center justify-between gap-4 rounded border px-3 py-2"
                >
                  <span className="text-sm">
                    {PRELEVEMENT_DOC_LABELS[field]}
                  </span>
                  <DocumentCell
                    file={viewedPrelevement[field]}
                    onUpload={() =>
                      void handleUploadPrelevement(viewedPrelevement, field)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Prélèvement à la source — modification */}
      <Modal
        open={!!editedPrelevement}
        onOpenChange={(open) => !open && setEditedPrelevement(null)}
        type="form"
        size="md"
        title="Modifier la déclaration"
        actions={{
          primary: { label: "Enregistrer", onClick: handleSavePrelevement },
          secondary: {
            label: "Annuler",
            variant: "outline" as const,
            onClick: () => setEditedPrelevement(null),
          },
        }}
      >
        {editedPrelevement && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pas-periode">Période</Label>
              <Input
                id="pas-periode"
                value={editedPrelevement.periode}
                onChange={(e) =>
                  setEditedPrelevement({
                    ...editedPrelevement,
                    periode: e.target.value,
                  })
                }
                placeholder="Ex : Janvier 2024"
              />
            </div>
            <div>
              <Label htmlFor="pas-montant">Montant (€)</Label>
              <Input
                id="pas-montant"
                type="number"
                value={editedPrelevement.montant}
                onChange={(e) =>
                  setEditedPrelevement({
                    ...editedPrelevement,
                    montant: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="pas-statut">Statut</Label>
              <Select
                value={editedPrelevement.statut}
                onValueChange={(
                  value: "declare" | "en_attente" | "en_retard",
                ) =>
                  setEditedPrelevement({ ...editedPrelevement, statut: value })
                }
              >
                <SelectTrigger id="pas-statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="declare">Déclaré</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="en_retard">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </Modal>

      {/* Prélèvement à la source — suppression */}
      <Modal
        open={!!prelevementToDelete}
        onOpenChange={(open) => !open && setPrelevementToDelete(null)}
        type="confirmation"
        title="Supprimer la déclaration"
        actions={{
          primary: { label: "Supprimer", onClick: handleDeletePrelevement },
          secondary: {
            label: "Annuler",
            variant: "outline" as const,
            onClick: () => setPrelevementToDelete(null),
          },
        }}
      >
        <p>
          Êtes-vous sûr de vouloir supprimer la déclaration{" "}
          <span className="font-semibold">{prelevementToDelete?.periode}</span>{" "}
          ? Cette action est irréversible.
        </p>
      </Modal>

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

      {/* Modal d'aperçu du document */}
      {previewDocument && (
        <Modal
          open={!!previewDocument}
          onOpenChange={() => setPreviewDocument(null)}
          type="form"
          size="xl"
          title={`Aperçu : ${previewDocument.type}`}
          icon={<FileText className="h-5 w-5" />}
          actions={{
            primary: {
              label: "Télécharger",
              onClick: () => {
                void downloadStoredFile(previewDocument.file);
              },
            },
            secondary: {
              label: "Fermer",
              onClick: () => setPreviewDocument(null),
              variant: "outline" as const,
            },
          }}
        >
          <div className="space-y-4">
            {/* En-tête du document */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{previewDocument.file.name}</p>
                  <p className="text-xs text-muted-foreground">PDF • 2.4 MB</p>
                </div>
              </div>
              <Badge variant="outline">Aperçu</Badge>
            </div>

            {/* Contenu du document */}
            <div className="border rounded-lg p-6 bg-white dark:bg-gray-900 min-h-[300px]">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-muted/50 p-4 rounded-lg">
                  {previewDocument.content}
                </pre>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Aperçu généré à titre indicatif. Téléchargez le document pour la
              version complète.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
