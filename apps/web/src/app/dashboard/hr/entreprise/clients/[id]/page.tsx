"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRegistre } from "@/hooks/fiscal/use-registre";
import {
  useAttachments,
  useAttachDocument,
  useDeleteAttachment,
} from "@/hooks/contracts";
import { pickFile, downloadStoredFile } from "@/lib/document-files";
import { exporterCsvExcel, exporterPdf } from "@/lib/export-table";
import {
  estFichierLisible,
  estPhotoLisible,
  preparerPhotoPourLecture,
} from "@/lib/receipt-image";
import {
  Building2,
  FileText,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  FileCheck,
  Edit3,
  Save,
  X,
  Upload,
  ArrowLeft,
  Trash2,
  Calendar,
  Gift,
  User,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useClient, useUpdateClient, useDeleteClient } from "@/hooks/clients";
import { extractReceiptFile } from "@safyr/api-client";
import {
  ChampFichierTeleverse,
  useEnregistrerLigne,
  useRattacherFichier,
  useTeleversementImmediat,
} from "./fichier-televerse";
import type {
  Client as ApiClient,
  UpdateClientPayload,
} from "@safyr/api-client";

interface DirigeantInfo {
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  adresse: string;
  email: string;
  telephone: string;
  fonction: string;
  dateNomination: string;
  numeroSecuriteSociale: string;
}

interface Client {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  siret?: string;
  numTVA?: string;
  sector?: string;
  dirigeant?: DirigeantInfo;
}

interface ClientContract {
  id: string;
  clientId: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  status: "active" | "expired" | "terminated";
}

interface ClientGift {
  id: string;
  clientId: string;
  giftDescription: string;
  date: Date;
  valueHT?: number; // Hors Tax
  tva?: number; // TVA
  valueTTC?: number; // Toutes Taxes Comprises
  notes?: string;
}

interface Document {
  id: string;
  clientId: string;
  name: string;
  type: string;
  description?: string;
  uploadDate: string;
  expiryDate?: string;
  status: "valid" | "expiring" | "expired";
  required: boolean;
  /** Clé du fichier réel dans le stockage, pour voir/télécharger. */
  storageKey?: string;
  /**
   * "contrat" : fichier repris automatiquement de l'onglet Contrats. Il se
   * consulte ici mais se gère (remplacement, suppression) depuis Contrats.
   */
  source: "document" | "contrat";
  /** Libellé du contrat d'origine, pour les documents de source "contrat". */
  contratLibelle?: string;
}

const MOIS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

type ChampMontant = "valueHT" | "tva" | "valueTTC";

const arrondi2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Applique une saisie de montant et complète le troisième champ dès que deux
 * sont renseignés : TTC = HT + TVA, ou TVA = TTC − HT, ou HT = TTC − TVA.
 * Le champ modifié n'est jamais réécrit ; un résultat négatif est ignoré.
 */
function appliquerMontant<
  F extends { valueHT: string; tva: string; valueTTC: string },
>(form: F, champ: ChampMontant, valeur: string): F {
  const suivant = { ...form, [champ]: valeur };
  if (valeur.trim() === "") return suivant;
  const lire = (v: string) => (v.trim() === "" ? null : Number(v));
  const ht = lire(suivant.valueHT);
  const tva = lire(suivant.tva);
  const ttc = lire(suivant.valueTTC);
  if ([ht, tva, ttc].some((n) => n !== null && Number.isNaN(n))) return suivant;
  const ecrire = (cle: ChampMontant, n: number) => {
    if (n >= 0) suivant[cle] = String(arrondi2(n));
  };

  if (champ === "valueHT") {
    if (tva !== null) ecrire("valueTTC", ht! + tva);
    else if (ttc !== null) ecrire("tva", ttc - ht!);
  } else if (champ === "tva") {
    if (ht !== null) ecrire("valueTTC", ht + tva!);
    else if (ttc !== null) ecrire("valueHT", ttc - tva!);
  } else {
    if (ht !== null) ecrire("tva", ttc! - ht);
    else if (tva !== null) ecrire("valueHT", ttc! - tva);
  }
  return suivant;
}

const MESSAGE_FORMAT_NON_LISIBLE =
  "Lecture automatique indisponible pour ce format : saisissez les montants. Astuce : une photo/capture d'écran ou un PDF du reçu est lu automatiquement.";

/** Champs du formulaire cadeau que la lecture automatique sait remplir. */
type ChampLu = "date" | "valueHT" | "tva" | "valueTTC" | "giftDescription";

/** Contour vert des champs remplis par la lecture automatique. */
const SURLIGNE = "ring-2 ring-green-500/60 border-green-500";

const slug = (texte: string) =>
  texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const requiredDocuments = [
  { type: "contrat_cadre", name: "Contrat cadre", category: "contrat" },
  { type: "kbis_client", name: "Kbis du client", category: "juridique" },
];

/** Lignes telles qu'enregistrées en base (dates en chaînes ISO). */
interface LigneContrat {
  id: string;
  clientId: string;
  startDate: string;
  endDate?: string;
  description: string;
  status: "active" | "expired" | "terminated";
}

interface LigneCadeau {
  id: string;
  clientId: string;
  giftDescription: string;
  date: string;
  valueHT?: number;
  tva?: number;
  valueTTC?: number;
  notes?: string;
}

const EPOQUE = new Date(0);
const CHAMPS_FICHIERS: readonly string[] = [];

// Champ "lecture / édition" avec cadre — même rendu que Mon entreprise.
function Field({
  label,
  value,
  onChange,
  isEditing,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isEditing: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-base font-medium">{label}</Label>
      <Input
        type={type}
        value={value}
        disabled={!isEditing}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "text-base",
          !isEditing &&
            "bg-muted/30 shadow-none cursor-default focus-visible:ring-0",
        )}
      />
    </div>
  );
}

const CLIENT_FIELDS: { key: keyof Client; label: string; type?: string }[] = [
  { key: "name", label: "Nom du client" },
  { key: "siret", label: "SIRET" },
  { key: "numTVA", label: "Num TVA" },
  { key: "address", label: "Adresse" },
  { key: "city", label: "Ville" },
  { key: "postalCode", label: "Code postal" },
  { key: "country", label: "Pays" },
  { key: "sector", label: "Secteur" },
  { key: "contactPerson", label: "Personne de contact" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Téléphone" },
];

const DIRIGEANT_FIELDS: {
  key: keyof DirigeantInfo;
  label: string;
  type?: string;
}[] = [
  { key: "nom", label: "Nom" },
  { key: "prenom", label: "Prénom" },
  { key: "fonction", label: "Fonction" },
  { key: "dateNomination", label: "Date de nomination", type: "date" },
  { key: "dateNaissance", label: "Date de naissance", type: "date" },
  { key: "lieuNaissance", label: "Lieu de naissance" },
  { key: "nationalite", label: "Nationalité" },
  { key: "numeroSecuriteSociale", label: "Numéro de sécurité sociale" },
  { key: "adresse", label: "Adresse" },
  { key: "email", label: "Email", type: "email" },
  { key: "telephone", label: "Téléphone" },
];

/** Convertit le client renvoyé par l'API en copie éditable du formulaire. */
function toEditableClient(apiClient: ApiClient): Client {
  return {
    id: apiClient.id,
    name: apiClient.name,
    address: apiClient.address ?? "",
    city: apiClient.city ?? "",
    postalCode: apiClient.postalCode ?? "",
    country: apiClient.country ?? "",
    contactPerson: apiClient.contactPerson ?? "",
    phone: apiClient.phone ?? "",
    email: apiClient.email ?? "",
    siret: apiClient.siret ?? "",
    numTVA: apiClient.numTVA ?? "",
    sector: apiClient.sector ?? "",
    dirigeant: apiClient.dirigeant
      ? { ...EMPTY_DIRIGEANT, ...apiClient.dirigeant }
      : undefined,
  };
}

/** Ne transmet que les champs renseignés — le back-end refuse les chaînes vides. */
function toUpdatePayload(client: Client): UpdateClientPayload {
  const { id: _id, dirigeant, ...champs } = client;
  const payload = Object.fromEntries(
    Object.entries(champs).filter(([, v]) => (v ?? "").trim() !== ""),
  ) as UpdateClientPayload;
  if (dirigeant) {
    const renseigne = Object.fromEntries(
      Object.entries(dirigeant).filter(([, v]) => (v ?? "").trim() !== ""),
    );
    if (Object.keys(renseigne).length > 0) payload.dirigeant = renseigne;
  }
  return payload;
}

const EMPTY_DIRIGEANT: DirigeantInfo = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  lieuNaissance: "",
  nationalite: "",
  adresse: "",
  email: "",
  telephone: "",
  fonction: "",
  dateNomination: "",
  numeroSecuriteSociale: "",
};

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // La fiche lisait une liste de démonstration : un client réellement créé
  // (identifiant généré par la base) n'y figurait jamais, d'où le « Client non
  // trouvé » juste après sa création. Elle lit désormais l'API.
  const { data: apiClient, isLoading } = useClient(id);
  const updateClientMutation = useUpdateClient(id);
  const deleteClientMutation = useDeleteClient();

  const [client, setClient] = useState<Client | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Synchronisation pendant le rendu (recommandation React) plutôt que dans un
  // effet : la copie éditable suit le client renvoyé par l'API.
  if (apiClient && loadedId !== apiClient.id) {
    setLoadedId(apiClient.id);
    setClient(toEditableClient(apiClient));
  }

  // Contrats, cadeaux et documents sont enregistrés en base : ces trois
  // listes ne vivaient auparavant que dans l'état React, et les boutons
  // « Nouveau contrat » / « Nouveau cadeau » n'avaient aucun gestionnaire.
  const registreContrats = useRegistre<LigneContrat>(
    "client_contrat",
    CHAMPS_FICHIERS,
  );
  const registreCadeaux = useRegistre<LigneCadeau>(
    "client_cadeau",
    CHAMPS_FICHIERS,
  );
  const contracts = registreContrats.lignes
    .filter((l) => l.clientId === id)
    .map(
      (l): ClientContract => ({
        id: l.id,
        clientId: l.clientId,
        startDate: l.startDate ? new Date(l.startDate) : EPOQUE,
        endDate: l.endDate ? new Date(l.endDate) : undefined,
        description: l.description ?? "",
        status: l.status ?? "active",
      }),
    );
  const gifts = registreCadeaux.lignes
    .filter((l) => l.clientId === id)
    .map(
      (l): ClientGift => ({
        id: l.id,
        clientId: l.clientId,
        giftDescription: l.giftDescription ?? "",
        date: l.date ? new Date(l.date) : EPOQUE,
        valueHT: l.valueHT,
        tva: l.tva,
        valueTTC: l.valueTTC,
        notes: l.notes,
      }),
    );
  // Message éphémère (pas de bibliothèque de toasts dans le projet).
  const [notice, setNotice] = useState<{
    texte: string;
    ton: "info" | "erreur";
  } | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const afficherNotice = (
    texte: string,
    ton: "info" | "erreur" = "info",
    dureeMs = 5000,
  ) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ texte, ton });
    noticeTimer.current = setTimeout(() => setNotice(null), dureeMs);
  };
  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );
  const [isContractFormOpen, setIsContractFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ClientContract | null>(
    null,
  );
  const [contractForm, setContractForm] = useState({
    startDate: "",
    endDate: "",
    description: "",
    status: "active" as ClientContract["status"],
  });
  // Le fichier part vers le stockage dès qu'il est choisi (voir fichier-televerse).
  const televersementContrat = useTeleversementImmediat();
  const [enregistrementContrat, setEnregistrementContrat] = useState(false);
  const [erreurContrat, setErreurContrat] = useState<string | null>(null);
  const enregistrerContrat = useEnregistrerLigne("client_contrat");
  const rattacherFichier = useRattacherFichier(id);
  const [isGiftFormOpen, setIsGiftFormOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<ClientGift | null>(null);
  const [giftForm, setGiftForm] = useState({
    giftDescription: "",
    date: "",
    valueHT: "",
    tva: "",
    valueTTC: "",
    notes: "",
  });
  // Dernière valeur du formulaire, lisible depuis l'analyse asynchrone.
  const giftFormRef = useRef(giftForm);
  useEffect(() => {
    giftFormRef.current = giftForm;
  });
  const televersementRecu = useTeleversementImmediat();
  const [enregistrementCadeau, setEnregistrementCadeau] = useState(false);
  const [erreurCadeau, setErreurCadeau] = useState<string | null>(null);
  const enregistrerCadeau = useEnregistrerLigne("client_cadeau");
  // Champs remplis par la lecture automatique (surlignés jusqu'à modification).
  const [champsLus, setChampsLus] = useState<ChampLu[]>([]);
  // Description lue mais non appliquée car une description est déjà saisie.
  const [descriptionProposee, setDescriptionProposee] = useState("");
  // Lecture automatique du reçu : état de l'analyse et retour affiché au client.
  const [analyseEnCours, setAnalyseEnCours] = useState(false);
  const [analyseRetour, setAnalyseRetour] = useState<{
    texte: string;
    ton: "succes" | "info";
    /** Ce qui a été lu, ce qui reste à saisir. */
    lus?: { champ: ChampLu; label: string; valeur: string }[];
    manquants?: string[];
    /** Message discret : HT/TVA déduits du TTC. */
    estimation?: string;
  } | null>(null);
  // Dernière description remplie automatiquement : permet de la remplacer par
  // celle d'un autre reçu sans jamais écraser un texte saisi à la main.
  const [descriptionAuto, setDescriptionAuto] = useState("");
  // Identifie l'analyse en cours pour ignorer le résultat d'une analyse périmée
  // (autre fichier choisi entre-temps, formulaire rouvert).
  const analyseId = useRef(0);
  // Export de la liste des cadeaux : période choisie ("all" = pas de filtre).
  const [exportMois, setExportMois] = useState("all");
  const [exportAnnee, setExportAnnee] = useState("all");
  const [exportOuvert, setExportOuvert] = useState(false);
  // Documents et reçus de cadeaux : pièces jointes réelles, scope "client".
  // Le reçu d'un cadeau est une pièce dont le slot vaut "recu-<idCadeau>".
  const { data: pieces = [] } = useAttachments("client", id);
  const attacherPiece = useAttachDocument("client", id);
  const detacherPiece = useDeleteAttachment("client", id);
  const recuDe = (giftId: string) =>
    pieces.find((p) => p.slot === `recu-${giftId}`);
  // Le fichier d'un contrat est une pièce dont le slot vaut "contrat-<idContrat>".
  const fichierContratDe = (contractId: string) =>
    pieces.find((p) => p.slot === `contrat-${contractId}`);
  // Un fichier de contrat dont la ligne n'existe plus (supprimée) est ignoré.
  const contratDeSlot = (slot: string) =>
    contracts.find((c) => `contrat-${c.id}` === slot);
  const documents: Document[] = pieces
    .filter((p) => !p.slot.startsWith("recu-"))
    .filter((p) => !p.slot.startsWith("contrat-") || !!contratDeSlot(p.slot))
    .map((p) => {
      const docType = requiredDocuments.find((d) => d.type === p.slot);
      const contrat = p.slot.startsWith("contrat-")
        ? contratDeSlot(p.slot)
        : undefined;
      return {
        id: p.id,
        clientId: id,
        name: p.name,
        type: p.slot,
        uploadDate: p.createdAt,
        status: "valid",
        required: !!docType,
        storageKey: p.storageKey,
        source: contrat ? "contrat" : "document",
        contratLibelle: contrat?.description,
      };
    });
  const [isEditing, setIsEditing] = useState(
    searchParams.get("edit") === "true",
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isCustomDocModalOpen, setIsCustomDocModalOpen] = useState(false);
  const [newCustomDoc, setNewCustomDoc] = useState({ name: "" });
  const [fichierPersonnalise, setFichierPersonnalise] = useState<File | null>(
    null,
  );
  const customDocFileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Chargement…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Client non trouvé
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => router.back()}>Retour</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success text-success-foreground";
      case "expired":
        return "bg-neutral text-neutral-foreground";
      case "terminated":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-neutral text-neutral-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "expired":
        return "Expiré";
      case "terminated":
        return "Résilié";
      default:
        return status;
    }
  };

  const handleSave = async () => {
    if (!client) return;
    setSaveError(null);
    try {
      await updateClientMutation.mutateAsync(toUpdatePayload(client));
      setIsEditing(false);
    } catch (error) {
      setSaveError(
        `Échec de l'enregistrement : ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      );
    }
  };

  const handlePreview = (doc: Document) => {
    if (!doc.storageKey) {
      afficherNotice("Ce document n'a pas de fichier associé.", "erreur");
      return;
    }
    void downloadStoredFile({ name: doc.name, key: doc.storageKey });
  };

  const handleDownload = handlePreview;

  const handleUpload = async (docType: { name: string; type: string }) => {
    const fichier = await pickFile();
    if (!fichier) return;
    try {
      await attacherPiece.mutateAsync({
        file: fichier,
        scopeId: id,
        slot: docType.type,
      });
    } catch (erreur) {
      alert(
        erreur instanceof Error
          ? `Échec du téléversement : ${erreur.message}`
          : "Échec du téléversement.",
      );
    }
  };

  const handleDeleteDocument = (doc: Document) =>
    void detacherPiece.mutateAsync(doc.id).catch((erreur: unknown) => {
      afficherNotice(
        erreur instanceof Error
          ? `Échec de la suppression : ${erreur.message}`
          : "Échec de la suppression.",
        "erreur",
      );
    });

  const handleCancel = () => {
    if (apiClient) {
      setClient(toEditableClient(apiClient));
    }
    setSaveError(null);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      await deleteClientMutation.mutateAsync(id);
      router.push("/dashboard/hr/entreprise/clients");
    } catch (error) {
      alert(
        `Échec de la suppression : ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      );
    }
  };

  const handleBulkDownload = () => {
    for (const docId of selectedDocuments) {
      const doc = documents.find((d) => d.id === docId);
      if (doc) handleDownload(doc);
    }
  };

  const handleCreateContract = () => {
    setEditingContract(null);
    setContractForm({
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      description: "",
      status: "active",
    });
    televersementContrat.retirer();
    setErreurContrat(null);
    setIsContractFormOpen(true);
  };

  const handleEditContract = (c: ClientContract) => {
    setEditingContract(c);
    setContractForm({
      startDate: c.startDate.toISOString().split("T")[0],
      endDate: c.endDate ? c.endDate.toISOString().split("T")[0] : "",
      description: c.description,
      status: c.status,
    });
    televersementContrat.retirer();
    setErreurContrat(null);
    setIsContractFormOpen(true);
  };

  const fermerFormContrat = () => {
    setIsContractFormOpen(false);
    televersementContrat.retirer();
  };

  /**
   * La fenêtre se ferme dès que la ligne est enregistrée (id serveur connu) :
   * le rattachement du fichier déjà téléversé et les rechargements se font
   * ensuite en arrière-plan, avec un message d'état.
   */
  const handleSaveContract = async () => {
    if (enregistrementContrat) return;
    const fichier =
      televersementContrat.etat.statut === "pret"
        ? televersementContrat.etat
        : null;
    const ligne: LigneContrat = {
      id: editingContract?.id ?? "",
      clientId: id,
      startDate: contractForm.startDate,
      endDate: contractForm.endDate || undefined,
      description: contractForm.description,
      status: contractForm.status,
    };
    setErreurContrat(null);
    setEnregistrementContrat(true);
    let recordId: string;
    try {
      recordId = await enregistrerContrat(ligne, !!editingContract, {
        period: contractForm.startDate.slice(0, 7),
        label: contractForm.description || `Contrat — ${client.name}`,
        status: contractForm.status,
      });
    } catch (erreur) {
      setErreurContrat(
        erreur instanceof Error
          ? `Échec de l'enregistrement : ${erreur.message}`
          : "Échec de l'enregistrement.",
      );
      return;
    } finally {
      setEnregistrementContrat(false);
    }
    fermerFormContrat();
    if (!fichier) {
      afficherNotice("Contrat enregistré.");
      return;
    }
    afficherNotice("Contrat enregistré. Rattachement du fichier…");
    rattacherFichier(fichier, `contrat-${recordId}`).then(
      () => afficherNotice("Contrat enregistré, fichier rattaché."),
      (erreur: unknown) =>
        afficherNotice(
          `Contrat enregistré, mais le fichier n'a pas pu être rattaché${
            erreur instanceof Error && erreur.message
              ? ` (${erreur.message})`
              : ""
          }. Ouvrez « Modifier » sur ce contrat pour le joindre à nouveau.`,
          "erreur",
          12000,
        ),
    );
  };

  // Le fichier suit la ligne : sans cela, il resterait orphelin dans le stockage.
  const handleDeleteContract = async (c: ClientContract) => {
    const fichier = fichierContratDe(c.id);
    await registreContrats.supprimerLigne(c.id);
    if (fichier) await detacherPiece.mutateAsync(fichier.id).catch(() => {});
  };

  // « Voir » ouvre directement le fichier du contrat (plus de fenêtre de détail).
  const handleViewContract = (c: ClientContract) => {
    const fichier = fichierContratDe(c.id);
    if (!fichier) {
      afficherNotice("Aucun fichier joint à ce contrat", "erreur");
      return;
    }
    void downloadStoredFile({ name: fichier.name, key: fichier.storageKey });
  };

  // Idem pour un cadeau : « Voir » ouvre le reçu / la facture joint.
  const handleViewGift = (g: ClientGift) => {
    const recu = recuDe(g.id);
    if (!recu) {
      afficherNotice("Aucun fichier joint à ce cadeau", "erreur");
      return;
    }
    void downloadStoredFile({ name: recu.name, key: recu.storageKey });
  };

  const resetAnalyse = () => {
    analyseId.current += 1;
    setAnalyseEnCours(false);
    setAnalyseRetour(null);
    setDescriptionAuto("");
    setDescriptionProposee("");
    setChampsLus([]);
    setErreurCadeau(null);
  };

  const handleCreateGift = () => {
    setEditingGift(null);
    resetAnalyse();
    setGiftForm({
      giftDescription: "",
      date: new Date().toISOString().split("T")[0],
      valueHT: "",
      tva: "",
      valueTTC: "",
      notes: "",
    });
    televersementRecu.retirer();
    setIsGiftFormOpen(true);
  };

  const handleEditGift = (g: ClientGift) => {
    setEditingGift(g);
    resetAnalyse();
    setGiftForm({
      giftDescription: g.giftDescription,
      date: g.date.toISOString().split("T")[0],
      valueHT: g.valueHT?.toString() ?? "",
      tva: g.tva?.toString() ?? "",
      valueTTC: g.valueTTC?.toString() ?? "",
      notes: g.notes ?? "",
    });
    televersementRecu.retirer();
    setIsGiftFormOpen(true);
  };

  const fermerFormCadeau = () => {
    analyseId.current += 1; // ignore une analyse encore en cours
    setIsGiftFormOpen(false);
    televersementRecu.retirer();
  };

  // Même principe que pour le contrat : fermeture dès l'id serveur connu.
  const handleSaveGift = async () => {
    if (enregistrementCadeau) return;
    const fichier =
      televersementRecu.etat.statut === "pret" ? televersementRecu.etat : null;
    const ligne: LigneCadeau = {
      id: editingGift?.id ?? "",
      clientId: id,
      giftDescription: giftForm.giftDescription,
      date: giftForm.date,
      valueHT: giftForm.valueHT ? Number(giftForm.valueHT) : undefined,
      tva: giftForm.tva ? Number(giftForm.tva) : undefined,
      valueTTC: giftForm.valueTTC ? Number(giftForm.valueTTC) : undefined,
      notes: giftForm.notes || undefined,
    };
    setErreurCadeau(null);
    setEnregistrementCadeau(true);
    let recordId: string;
    try {
      recordId = await enregistrerCadeau(ligne, !!editingGift, {
        period: giftForm.date.slice(0, 7),
        label: giftForm.giftDescription || `Cadeau — ${client.name}`,
      });
    } catch (erreur) {
      setErreurCadeau(
        erreur instanceof Error
          ? `Échec de l'enregistrement : ${erreur.message}`
          : "Échec de l'enregistrement.",
      );
      return;
    } finally {
      setEnregistrementCadeau(false);
    }
    fermerFormCadeau();
    if (!fichier) {
      afficherNotice("Cadeau enregistré.");
      return;
    }
    afficherNotice("Cadeau enregistré. Rattachement du reçu…");
    rattacherFichier(fichier, `recu-${recordId}`).then(
      () => afficherNotice("Cadeau enregistré, reçu rattaché."),
      (erreur: unknown) =>
        afficherNotice(
          `Cadeau enregistré, mais le reçu n'a pas pu être rattaché${
            erreur instanceof Error && erreur.message
              ? ` (${erreur.message})`
              : ""
          }. Ouvrez « Modifier » sur ce cadeau pour le joindre à nouveau.`,
          "erreur",
          12000,
        ),
    );
  };

  const handleDeleteGift = async (g: ClientGift) => {
    const recu = recuDe(g.id);
    await registreCadeaux.supprimerLigne(g.id);
    if (recu) await detacherPiece.mutateAsync(recu.id).catch(() => {});
  };

  /**
   * Après le choix du reçu : il part au stockage immédiatement, puis (photo
   * ou PDF) est lu pour pré-remplir date, HT, TVA, TTC et description. Un
   * échec n'empêche jamais la saisie manuelle.
   */
  const handleGiftFileChange = async (fichier: File | null) => {
    if (!fichier) return;
    televersementRecu.choisir(fichier);
    const courant = ++analyseId.current;
    setAnalyseRetour(null);
    setAnalyseEnCours(false);
    setChampsLus([]);
    setDescriptionProposee("");

    // Les formats hors photo/PDF (Word, Excel…) ne sont pas lus : évite un
    // aller-retour serveur dont le résultat est connu d'avance.
    if (!estFichierLisible(fichier)) {
      setAnalyseRetour({ texte: MESSAGE_FORMAT_NON_LISIBLE, ton: "info" });
      return;
    }

    setAnalyseEnCours(true);
    try {
      // Les photos sont réduites avant l'envoi (poids) ; un PDF part tel quel.
      const envoi = estPhotoLisible(fichier)
        ? await preparerPhotoPourLecture(fichier)
        : fichier;
      const extrait = await extractReceiptFile(envoi);
      if (courant !== analyseId.current) return;

      const trouves = [
        extrait.date,
        extrait.montantHT,
        extrait.tva,
        extrait.montantTTC,
        extrait.description,
      ].filter((v) => v !== null && v !== "").length;
      if (trouves === 0) {
        setAnalyseRetour({
          texte:
            "Le document n'a pas pu être lu : saisissez les champs manuellement.",
          ton: "info",
        });
        return;
      }

      // Valeur courante du formulaire (l'utilisateur a pu saisir pendant l'analyse).
      const prev = giftFormRef.current;
      let suivant = { ...prev };
      const lus: ChampLu[] = [];
      if (extrait.date) {
        suivant.date = extrait.date;
        lus.push("date");
      }
      if (extrait.montantHT !== null) {
        suivant.valueHT = String(extrait.montantHT);
        lus.push("valueHT");
      }
      if (extrait.tva !== null) {
        suivant.tva = String(extrait.tva);
        lus.push("tva");
      }
      if (extrait.montantTTC !== null) {
        suivant.valueTTC = String(extrait.montantTTC);
        lus.push("valueTTC");
      }
      // Complète le troisième montant si le serveur n'a pu le faire.
      if (suivant.valueHT && suivant.tva && !suivant.valueTTC) {
        suivant = appliquerMontant(suivant, "tva", suivant.tva);
        lus.push("valueTTC");
      } else if (suivant.valueHT && suivant.valueTTC && !suivant.tva) {
        suivant = appliquerMontant(suivant, "valueHT", suivant.valueHT);
        lus.push("tva");
      } else if (suivant.tva && suivant.valueTTC && !suivant.valueHT) {
        suivant = appliquerMontant(suivant, "tva", suivant.tva);
        lus.push("valueHT");
      }
      // Une description saisie à la main n'est jamais écrasée : elle est
      // conservée et la description lue est proposée à côté.
      let descriptionGardee = false;
      if (extrait.description) {
        if (
          prev.giftDescription.trim() === "" ||
          prev.giftDescription === descriptionAuto
        ) {
          suivant.giftDescription = extrait.description;
          lus.push("giftDescription");
          setDescriptionAuto(extrait.description);
        } else if (prev.giftDescription !== extrait.description) {
          descriptionGardee = true;
          setDescriptionProposee(extrait.description);
        }
      }
      setGiftForm(suivant);
      setChampsLus(lus);

      const euros = (n: string) =>
        `${Number(n).toFixed(2).replace(".", ",")} €`;
      const definitions: { champ: ChampLu; label: string; valeur: string }[] = [
        {
          champ: "date",
          label: "Date",
          valeur: extrait.date
            ? new Date(`${extrait.date}T00:00:00Z`).toLocaleDateString(
                "fr-FR",
                { timeZone: "UTC" },
              )
            : "",
        },
        { champ: "valueHT", label: "Valeur HT", valeur: suivant.valueHT },
        { champ: "tva", label: "TVA", valeur: suivant.tva },
        { champ: "valueTTC", label: "Valeur TTC", valeur: suivant.valueTTC },
        {
          champ: "giftDescription",
          label: "Description",
          valeur: suivant.giftDescription,
        },
      ];
      const lusRecap = definitions
        .filter((d) => lus.includes(d.champ))
        .map((d) =>
          d.champ === "valueHT" || d.champ === "tva" || d.champ === "valueTTC"
            ? { ...d, valeur: euros(d.valeur) }
            : d,
        );
      const manquants = definitions
        .filter(
          (d) =>
            !lus.includes(d.champ) &&
            !(d.champ === "giftDescription" && descriptionGardee) &&
            d.valeur.trim() === "",
        )
        .map((d) => d.label);
      setAnalyseRetour({
        texte:
          manquants.length === 0
            ? "Tous les champs ont été lus : vérifiez-les avant d'enregistrer."
            : "Lecture partielle : complétez les champs restants avant d'enregistrer.",
        ton: manquants.length === 0 ? "succes" : "info",
        lus: lusRecap,
        manquants,
        estimation: extrait.estime
          ? `HT/TVA estimés (${String(extrait.tauxEstime ?? 20).replace(".", ",")} %) à partir du TTC : vérifiez-les.`
          : undefined,
      });
    } catch (erreur) {
      if (courant !== analyseId.current) return;
      setAnalyseRetour({
        texte:
          erreur instanceof Error && erreur.message
            ? erreur.message
            : "Lecture automatique impossible : saisissez les champs manuellement.",
        ton: "info",
      });
    } finally {
      if (courant === analyseId.current) setAnalyseEnCours(false);
    }
  };

  /** Saisie manuelle : le champ n'est plus « lu automatiquement ». */
  const saisirCadeau = (champ: ChampLu, form: typeof giftForm) => {
    setChampsLus((lus) => lus.filter((c) => c !== champ));
    setGiftForm(form);
  };

  const handleUploadReceipt = async (g: ClientGift) => {
    const fichier = await pickFile();
    if (!fichier) return;
    try {
      await attacherPiece.mutateAsync({
        file: fichier,
        scopeId: id,
        slot: `recu-${g.id}`,
      });
    } catch (erreur) {
      alert(
        erreur instanceof Error
          ? `Échec du téléversement : ${erreur.message}`
          : "Échec du téléversement.",
      );
    }
  };

  const handleDownloadReceipt = (g: ClientGift) => {
    const recu = recuDe(g.id);
    if (!recu) return;
    void downloadStoredFile({ name: recu.name, key: recu.storageKey });
  };

  const handleUploadContractFile = async (c: ClientContract) => {
    const fichier = await pickFile();
    if (!fichier) return;
    try {
      await attacherPiece.mutateAsync({
        file: fichier,
        scopeId: id,
        slot: `contrat-${c.id}`,
      });
    } catch (erreur) {
      alert(
        erreur instanceof Error
          ? `Échec du téléversement : ${erreur.message}`
          : "Échec du téléversement.",
      );
    }
  };

  const handleDownloadContractFile = (c: ClientContract) => {
    const fichier = fichierContratDe(c.id);
    if (!fichier) return;
    void downloadStoredFile({ name: fichier.name, key: fichier.storageKey });
  };

  // ── Export de la liste des cadeaux (PDF / Excel) ────────────────────────
  // Les dates sont des jours « YYYY-MM-DD » lus en UTC : on filtre en UTC pour
  // ne pas décaler un cadeau d'un mois selon le fuseau du navigateur.
  const anneesCadeaux = Array.from(
    new Set([
      new Date().getFullYear(),
      ...gifts.map((g) => g.date.getUTCFullYear()),
    ]),
  ).sort((a, b) => b - a);
  const cadeauxExport = gifts
    .filter(
      (g) =>
        (exportAnnee === "all" ||
          g.date.getUTCFullYear() === Number(exportAnnee)) &&
        (exportMois === "all" || g.date.getUTCMonth() === Number(exportMois)),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const periodeExport = () => {
    if (exportMois === "all" && exportAnnee === "all") return "Toutes périodes";
    if (exportMois === "all") return `Année ${exportAnnee}`;
    const mois = MOIS[Number(exportMois)];
    return exportAnnee === "all" ? mois : `${mois} ${exportAnnee}`;
  };

  const colonnesExportCadeaux = [
    {
      titre: "Date",
      valeur: (g: ClientGift) =>
        g.date.toLocaleDateString("fr-FR", { timeZone: "UTC" }),
    },
    { titre: "Description", valeur: (g: ClientGift) => g.giftDescription },
    { titre: "Hors taxe (€)", valeur: (g: ClientGift) => g.valueHT },
    { titre: "TVA (€)", valeur: (g: ClientGift) => g.tva },
    { titre: "TTC (€)", valeur: (g: ClientGift) => g.valueTTC },
    { titre: "Notes", valeur: (g: ClientGift) => g.notes },
    {
      titre: "Reçu / facture",
      valeur: (g: ClientGift) => (recuDe(g.id) ? "Oui" : "Non"),
    },
  ];

  const nomFichierExport = () =>
    ["cadeaux", slug(client.name), slug(periodeExport())]
      .filter(Boolean)
      .join("-");

  const handleExportCadeaux = async (format: "pdf" | "excel") => {
    if (cadeauxExport.length === 0) return;
    try {
      if (format === "excel") {
        exporterCsvExcel(
          nomFichierExport(),
          colonnesExportCadeaux,
          cadeauxExport,
        );
      } else {
        const somme = (cle: ChampMontant) =>
          arrondi2(cadeauxExport.reduce((t, g) => t + (g[cle] ?? 0), 0));
        await exporterPdf(
          nomFichierExport(),
          colonnesExportCadeaux,
          cadeauxExport,
          {
            titre: `Liste des cadeaux — ${client.name}`,
            sousTitre: periodeExport(),
            orientation: "landscape",
            pied: [
              "Total",
              "",
              somme("valueHT"),
              somme("tva"),
              somme("valueTTC"),
              "",
              "",
            ],
          },
        );
      }
      setExportOuvert(false);
    } catch (erreur) {
      afficherNotice(
        erreur instanceof Error
          ? `Échec de l'export : ${erreur.message}`
          : "Échec de l'export.",
        "erreur",
      );
    }
  };

  const contractColumns: ColumnDef<ClientContract>[] = [
    {
      key: "description",
      label: "Description",
      sortable: true,
      render: (contract) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{contract.description}</span>
        </div>
      ),
    },
    {
      key: "startDate",
      label: "Date début",
      sortable: true,
      render: (contract) =>
        new Date(contract.startDate).toLocaleDateString("fr-FR"),
    },
    {
      key: "endDate",
      label: "Date fin",
      sortable: true,
      render: (contract) =>
        contract.endDate
          ? new Date(contract.endDate).toLocaleDateString("fr-FR")
          : "Indéterminée",
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (contract) => (
        <Badge className={getStatusColor(contract.status)}>
          {getStatusText(contract.status)}
        </Badge>
      ),
    },
  ];

  const giftColumns: ColumnDef<ClientGift>[] = [
    {
      key: "giftDescription",
      label: "Description",
      sortable: true,
      render: (gift) => (
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{gift.giftDescription}</span>
        </div>
      ),
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (gift) => new Date(gift.date).toLocaleDateString("fr-FR"),
    },
    {
      key: "valueHT",
      label: "Hors Tax",
      sortable: true,
      render: (gift) => (gift.valueHT ? `${gift.valueHT} €` : "-"),
    },
    {
      key: "tva",
      label: "TVA",
      sortable: true,
      render: (gift) => (gift.tva ? `${gift.tva} €` : "-"),
    },
    {
      key: "valueTTC",
      label: "TTC",
      sortable: true,
      render: (gift) => (gift.valueTTC ? `${gift.valueTTC} €` : "-"),
    },
    {
      key: "notes",
      label: "Notes",
      sortable: false,
      render: (gift) => gift.notes || "-",
    },
  ];

  const documentColumns: ColumnDef<Document>[] = [
    {
      key: "name",
      label: "Document",
      sortable: true,
      render: (doc) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">{doc.name}</span>
            {doc.contratLibelle && (
              <p className="text-sm text-muted-foreground">
                {doc.contratLibelle}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (doc) => {
        if (doc.source === "contrat")
          return <Badge variant="info">Contrat</Badge>;
        const docType = requiredDocuments.find((d) => d.type === doc.type);
        if (docType) return docType.name;
        return doc.type.startsWith("custom-")
          ? "Document personnalisé"
          : doc.type;
      },
    },
    {
      key: "uploadDate",
      label: "Date d'upload",
      sortable: true,
      render: (doc) => new Date(doc.uploadDate).toLocaleDateString("fr-FR"),
    },
    {
      key: "expiryDate",
      label: "Date d'expiration",
      sortable: true,
      render: (doc) =>
        doc.expiryDate
          ? new Date(doc.expiryDate).toLocaleDateString("fr-FR")
          : "N/A",
    },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (doc) => {
        const isExpired =
          doc.expiryDate && new Date(doc.expiryDate) < new Date();
        const isExpiring =
          doc.expiryDate &&
          new Date(doc.expiryDate) <=
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        return (
          <Badge
            variant={
              isExpired ? "destructive" : isExpiring ? "secondary" : "default"
            }
          >
            {isExpired ? "Expiré" : isExpiring ? "Expire bientôt" : "Valide"}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (doc) => (
        <RowActionsMenu
          onView={() => handlePreview(doc)}
          onDownload={() => handleDownload(doc)}
          // Un fichier de contrat se supprime depuis l'onglet Contrats.
          onDelete={
            doc.source === "contrat"
              ? undefined
              : () => handleDeleteDocument(doc)
          }
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {notice && (
        <div
          role="status"
          className={cn(
            "fixed bottom-6 right-6 z-[100] max-w-sm rounded-md border px-4 py-3 text-sm shadow-lg",
            notice.ton === "erreur"
              ? "border-destructive/30 bg-destructive text-destructive-foreground"
              : "border-border bg-popover text-popover-foreground",
          )}
        >
          {notice.texte}
        </div>
      )}
      {saveError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {saveError}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4" />
              {client.sector || "Secteur non spécifié"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button
                onClick={() => void handleSave()}
                disabled={updateClientMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateClientMutation.isPending
                  ? "Enregistrement…"
                  : "Enregistrer"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </>
          )}
        </div>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={FileCheck}
          title="Contrats actifs"
          value={contracts.filter((c) => c.status === "active").length}
          color="green"
        />
        <InfoCard
          icon={Gift}
          title="Cadeaux cette année"
          value={
            gifts.filter(
              (g) =>
                new Date(g.date).getFullYear() === new Date().getFullYear(),
            ).length
          }
          color="purple"
        />
        <InfoCard
          icon={FileText}
          title="Documents"
          value={documents.length}
          color="blue"
        />
        <InfoCard
          icon={AlertTriangle}
          title="Docs expirant"
          value={documents.filter((d) => d.status === "expiring").length}
          color="yellow"
        />
      </InfoCardContainer>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info" className="text-base">
            Informations
          </TabsTrigger>
          <TabsTrigger value="contrats" className="text-base">
            Contrats
          </TabsTrigger>
          <TabsTrigger value="cadeaux" className="text-base">
            Cadeaux
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-base">
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Informations entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CLIENT_FIELDS.map((f) => (
                  <Field
                    key={f.key}
                    label={f.label}
                    type={f.type}
                    isEditing={isEditing}
                    value={(client[f.key] as string) ?? ""}
                    onChange={(v) => setClient({ ...client, [f.key]: v })}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {client.dirigeant && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Informations du dirigeant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DIRIGEANT_FIELDS.map((f) => (
                    <Field
                      key={f.key}
                      label={f.label}
                      type={f.type}
                      isEditing={isEditing}
                      value={client.dirigeant![f.key] ?? ""}
                      onChange={(v) =>
                        setClient({
                          ...client,
                          dirigeant: { ...client.dirigeant!, [f.key]: v },
                        })
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contrats" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Contrats
                </CardTitle>
                <Button size="sm" onClick={handleCreateContract}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Nouveau contrat
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={contracts}
                isLoading={registreContrats.isLoading}
                columns={contractColumns}
                searchKey="description"
                searchPlaceholder="Rechercher un contrat..."
                actions={(c) => (
                  <RowActionsMenu
                    onView={() => handleViewContract(c)}
                    onEdit={() => handleEditContract(c)}
                    onDelete={() => void handleDeleteContract(c)}
                    onUpload={() => void handleUploadContractFile(c)}
                    onDownload={
                      fichierContratDe(c.id)
                        ? () => handleDownloadContractFile(c)
                        : undefined
                    }
                  />
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cadeaux" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gift className="h-5 w-5" />
                  Suivi des cadeaux
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Popover open={exportOuvert} onOpenChange={setExportOuvert}>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2 text-violet-500" />
                        Télécharger la liste
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80 space-y-4">
                      <div>
                        <p className="text-base font-medium">
                          Liste des cadeaux
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Choisissez la période à exporter.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="export-mois">Mois</Label>
                          <Select
                            value={exportMois}
                            onValueChange={setExportMois}
                          >
                            <SelectTrigger id="export-mois">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous</SelectItem>
                              {MOIS.map((mois, i) => (
                                <SelectItem key={mois} value={String(i)}>
                                  {mois}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="export-annee">Année</Label>
                          <Select
                            value={exportAnnee}
                            onValueChange={setExportAnnee}
                          >
                            <SelectTrigger id="export-annee">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Toutes</SelectItem>
                              {anneesCadeaux.map((annee) => (
                                <SelectItem key={annee} value={String(annee)}>
                                  {annee}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cadeauxExport.length === 0
                          ? "Aucun cadeau sur cette période."
                          : `${cadeauxExport.length} cadeau${cadeauxExport.length > 1 ? "x" : ""} — ${periodeExport()}`}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={cadeauxExport.length === 0}
                          onClick={() => void handleExportCadeaux("pdf")}
                        >
                          <FileText className="h-4 w-4 mr-2 text-red-600" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={cadeauxExport.length === 0}
                          onClick={() => void handleExportCadeaux("excel")}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                          Excel
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button size="sm" onClick={handleCreateGift}>
                    <Gift className="h-4 w-4 mr-2" />
                    Nouveau cadeau
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={gifts}
                isLoading={registreCadeaux.isLoading}
                columns={giftColumns}
                searchKey="giftDescription"
                searchPlaceholder="Rechercher un cadeau..."
                actions={(g) => (
                  <RowActionsMenu
                    onView={() => handleViewGift(g)}
                    onEdit={() => handleEditGift(g)}
                    onDelete={() => void handleDeleteGift(g)}
                    onUpload={() => void handleUploadReceipt(g)}
                    uploadLabel={
                      recuDe(g.id)
                        ? "Remplacer le reçu/facture"
                        : "Téléverser un reçu/facture"
                    }
                    onDownload={
                      recuDe(g.id) ? () => handleDownloadReceipt(g) : undefined
                    }
                    downloadLabel="Télécharger le reçu/facture"
                  />
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
                <div className="flex gap-2">
                  {selectedDocuments.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDownload}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger ({selectedDocuments.length})
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setIsCustomDocModalOpen(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter un document
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={documents}
                columns={documentColumns}
                searchKey="name"
                searchPlaceholder="Rechercher un document..."
                selectable
                onSelectionChange={(selectedDocs) =>
                  setSelectedDocuments(selectedDocs.map((d) => d.id))
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents requis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {requiredDocuments.map((docType) => {
                  const existingDoc = documents.find(
                    (d) => d.type === docType.type,
                  );
                  return (
                    <div
                      key={docType.type}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-base font-medium">
                            {docType.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {docType.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={existingDoc ? "success" : "warning"}>
                          {existingDoc ? "Fourni" : "Manquant"}
                        </Badge>
                        <RowActionsMenu
                          onView={
                            existingDoc
                              ? () => handlePreview(existingDoc)
                              : undefined
                          }
                          onUpload={() => void handleUpload(docType)}
                          uploadLabel={existingDoc ? "Remplacer" : "Téléverser"}
                          onDownload={
                            existingDoc
                              ? () => handleDownload(existingDoc)
                              : undefined
                          }
                          onDelete={
                            existingDoc
                              ? () => handleDeleteDocument(existingDoc)
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        type="confirmation"
        title="Supprimer le client"
        actions={{
          primary: {
            label: "Supprimer",
            onClick: () => void handleDelete(),
            variant: "destructive" as const,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsDeleteModalOpen(false),
            variant: "outline" as const,
          },
        }}
      >
        <p>
          Êtes-vous sûr de vouloir supprimer le client{" "}
          <span className="font-semibold">{client.name}</span> ? Cette action
          est irréversible et supprimera également tous les contrats, cadeaux et
          documents associés.
        </p>
      </Modal>

      <Modal
        open={isCustomDocModalOpen}
        onOpenChange={setIsCustomDocModalOpen}
        type="form"
        title="Ajouter un document"
        actions={{
          primary: {
            label: "Ajouter",
            disabled: !fichierPersonnalise || !newCustomDoc.name,
            onClick: () => {
              if (!fichierPersonnalise) return;
              // Le nom affiché vient du fichier lui-même côté serveur : on
              // renomme l'objet File pour que le libellé saisi soit conservé.
              const renomme = new File(
                [fichierPersonnalise],
                newCustomDoc.name,
                { type: fichierPersonnalise.type },
              );
              const slot = `custom-${Date.now()}`;
              void attacherPiece
                .mutateAsync({ file: renomme, scopeId: id, slot })
                .then(() => {
                  setIsCustomDocModalOpen(false);
                  setNewCustomDoc({ name: "" });
                  setFichierPersonnalise(null);
                })
                .catch((erreur: unknown) => {
                  alert(
                    erreur instanceof Error
                      ? `Échec du téléversement : ${erreur.message}`
                      : "Échec du téléversement.",
                  );
                });
            },
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsCustomDocModalOpen(false),
            variant: "outline" as const,
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="doc-name">Nom du document</Label>
            <Input
              id="doc-name"
              value={newCustomDoc.name}
              onChange={(e) =>
                setNewCustomDoc({ ...newCustomDoc, name: e.target.value })
              }
              placeholder="Nom du document"
            />
          </div>
          <div>
            <Label htmlFor="doc-file">Fichier</Label>
            <input
              ref={customDocFileInputRef}
              id="doc-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
              className="hidden"
              onChange={(e) =>
                setFichierPersonnalise(e.target.files?.[0] ?? null)
              }
            />
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 font-normal"
              onClick={() => customDocFileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {fichierPersonnalise
                ? fichierPersonnalise.name
                : "Choisir un fichier"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isContractFormOpen}
        onOpenChange={(ouvert) =>
          ouvert ? setIsContractFormOpen(true) : fermerFormContrat()
        }
        type="form"
        title={editingContract ? "Modifier le contrat" : "Nouveau contrat"}
        actions={{
          primary: {
            label: enregistrementContrat
              ? "Enregistrement…"
              : televersementContrat.etat.statut === "envoi"
                ? "Téléversement en cours…"
                : editingContract
                  ? "Enregistrer"
                  : "Créer",
            icon:
              enregistrementContrat ||
              televersementContrat.etat.statut === "envoi" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : undefined,
            onClick: () => void handleSaveContract(),
            disabled:
              !contractForm.description ||
              !contractForm.startDate ||
              enregistrementContrat ||
              televersementContrat.etat.statut === "envoi" ||
              televersementContrat.etat.statut === "erreur",
          },
          secondary: {
            label: "Annuler",
            onClick: fermerFormContrat,
            variant: "outline" as const,
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="contract-description">Description</Label>
            <Input
              id="contract-description"
              value={contractForm.description}
              onChange={(e) =>
                setContractForm({
                  ...contractForm,
                  description: e.target.value,
                })
              }
              placeholder="Ex : Contrat de prestation gardiennage"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contract-start">Date de début</Label>
              <Input
                id="contract-start"
                type="date"
                value={contractForm.startDate}
                onChange={(e) =>
                  setContractForm({
                    ...contractForm,
                    startDate: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="contract-end">Date de fin</Label>
              <Input
                id="contract-end"
                type="date"
                value={contractForm.endDate}
                onChange={(e) =>
                  setContractForm({ ...contractForm, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="contract-status">Statut</Label>
            <Select
              value={contractForm.status}
              onValueChange={(v: ClientContract["status"]) =>
                setContractForm({ ...contractForm, status: v })
              }
            >
              <SelectTrigger id="contract-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
                <SelectItem value="terminated">Résilié</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="contract-file" className="mb-1.5 block">
              Fichier du contrat
            </Label>
            <ChampFichierTeleverse
              id="contract-file"
              etat={televersementContrat.etat}
              fichierExistant={
                editingContract
                  ? fichierContratDe(editingContract.id)?.name
                  : undefined
              }
              onChoisir={televersementContrat.choisir}
              onRetirer={televersementContrat.retirer}
              onReessayer={televersementContrat.reessayer}
            />
          </div>
          {erreurContrat && (
            <p role="alert" className="text-sm text-destructive">
              {erreurContrat}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={isGiftFormOpen}
        onOpenChange={(ouvert) =>
          ouvert ? setIsGiftFormOpen(true) : fermerFormCadeau()
        }
        type="form"
        title={editingGift ? "Modifier le cadeau" : "Nouveau cadeau"}
        actions={{
          primary: {
            label: enregistrementCadeau
              ? "Enregistrement…"
              : televersementRecu.etat.statut === "envoi"
                ? "Téléversement en cours…"
                : editingGift
                  ? "Enregistrer"
                  : "Créer",
            icon:
              enregistrementCadeau ||
              televersementRecu.etat.statut === "envoi" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : undefined,
            onClick: () => void handleSaveGift(),
            disabled:
              !giftForm.giftDescription ||
              !giftForm.date ||
              enregistrementCadeau ||
              televersementRecu.etat.statut === "envoi" ||
              televersementRecu.etat.statut === "erreur",
          },
          secondary: {
            label: "Annuler",
            onClick: fermerFormCadeau,
            variant: "outline" as const,
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="gift-description">Description</Label>
            <Input
              id="gift-description"
              value={giftForm.giftDescription}
              className={cn(champsLus.includes("giftDescription") && SURLIGNE)}
              onChange={(e) =>
                saisirCadeau("giftDescription", {
                  ...giftForm,
                  giftDescription: e.target.value,
                })
              }
              placeholder="Ex : Coffret gastronomique"
            />
            {descriptionProposee && (
              <p className="mt-1 text-xs text-muted-foreground">
                Description lue sur le document : « {descriptionProposee} ».{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline underline-offset-2"
                  onClick={() => {
                    saisirCadeau("giftDescription", {
                      ...giftForm,
                      giftDescription: descriptionProposee,
                    });
                    setDescriptionAuto(descriptionProposee);
                    setDescriptionProposee("");
                  }}
                >
                  Utiliser cette description
                </button>
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="gift-date">Date</Label>
            <Input
              id="gift-date"
              type="date"
              value={giftForm.date}
              className={cn(champsLus.includes("date") && SURLIGNE)}
              onChange={(e) =>
                saisirCadeau("date", { ...giftForm, date: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="gift-ht">Valeur HT (€)</Label>
              <Input
                id="gift-ht"
                type="number"
                step="0.01"
                min="0"
                value={giftForm.valueHT}
                className={cn(champsLus.includes("valueHT") && SURLIGNE)}
                onChange={(e) =>
                  saisirCadeau(
                    "valueHT",
                    appliquerMontant(giftForm, "valueHT", e.target.value),
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="gift-tva">TVA (€)</Label>
              <Input
                id="gift-tva"
                type="number"
                step="0.01"
                min="0"
                value={giftForm.tva}
                className={cn(champsLus.includes("tva") && SURLIGNE)}
                onChange={(e) =>
                  saisirCadeau(
                    "tva",
                    appliquerMontant(giftForm, "tva", e.target.value),
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="gift-ttc">Valeur TTC (€)</Label>
              <Input
                id="gift-ttc"
                type="number"
                step="0.01"
                min="0"
                value={giftForm.valueTTC}
                className={cn(champsLus.includes("valueTTC") && SURLIGNE)}
                onChange={(e) =>
                  saisirCadeau(
                    "valueTTC",
                    appliquerMontant(giftForm, "valueTTC", e.target.value),
                  )
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="gift-notes">Notes</Label>
            <Textarea
              id="gift-notes"
              value={giftForm.notes}
              onChange={(e) =>
                setGiftForm({ ...giftForm, notes: e.target.value })
              }
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="gift-file" className="mb-1.5 block">
              Reçu / facture
            </Label>
            <ChampFichierTeleverse
              id="gift-file"
              etat={televersementRecu.etat}
              fichierExistant={
                editingGift ? recuDe(editingGift.id)?.name : undefined
              }
              onChoisir={(f) => void handleGiftFileChange(f)}
              onRetirer={() => {
                televersementRecu.retirer();
                resetAnalyse();
              }}
              onReessayer={televersementRecu.reessayer}
            />
            {analyseEnCours && (
              <p
                role="status"
                className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyse du document…
              </p>
            )}
            {!analyseEnCours && analyseRetour && (
              <div role="status" className="mt-2 space-y-1 text-sm">
                <p
                  className={cn(
                    analyseRetour.ton === "succes"
                      ? "text-green-600 dark:text-green-500"
                      : "text-orange-500",
                  )}
                >
                  {analyseRetour.texte}
                </p>
                {analyseRetour.lus && analyseRetour.lus.length > 0 && (
                  <ul className="space-y-0.5">
                    {analyseRetour.lus.map((l) => (
                      <li
                        key={l.champ}
                        className="flex items-start gap-1.5 text-green-600 dark:text-green-500"
                      >
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          {l.label} : <strong>{l.valeur}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {analyseRetour.manquants &&
                  analyseRetour.manquants.length > 0 && (
                    <p className="flex items-start gap-1.5 text-orange-500">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        À saisir : {analyseRetour.manquants.join(", ")}
                      </span>
                    </p>
                  )}
                {analyseRetour.estimation && (
                  <p className="text-xs text-muted-foreground">
                    {analyseRetour.estimation}
                  </p>
                )}
              </div>
            )}
          </div>
          {erreurCadeau && (
            <p role="alert" className="text-sm text-destructive">
              {erreurCadeau}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
