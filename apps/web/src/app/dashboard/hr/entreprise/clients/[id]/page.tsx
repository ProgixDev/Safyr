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
import { estPhotoLisible, preparerPhotoPourLecture } from "@/lib/receipt-image";
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
} from "lucide-react";
import { useClient, useUpdateClient, useDeleteClient } from "@/hooks/clients";
import { extractReceiptFile } from "@safyr/api-client";
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

const MESSAGE_PDF =
  "Lecture automatique disponible pour les photos (JPG/PNG) — saisissez les montants pour un PDF.";

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
  const afficherNotice = (texte: string, ton: "info" | "erreur" = "info") => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ texte, ton });
    noticeTimer.current = setTimeout(() => setNotice(null), 5000);
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
  const [contractFile, setContractFile] = useState<File | null>(null);
  const contractFileInputRef = useRef<HTMLInputElement>(null);
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
  const [giftFile, setGiftFile] = useState<File | null>(null);
  const giftFileInputRef = useRef<HTMLInputElement>(null);
  // Lecture automatique du reçu : état de l'analyse et retour affiché au client.
  const [analyseEnCours, setAnalyseEnCours] = useState(false);
  const [analyseRetour, setAnalyseRetour] = useState<{
    texte: string;
    ton: "succes" | "info";
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
    setContractFile(null);
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
    setContractFile(null);
    setIsContractFormOpen(true);
  };

  const handleSaveContract = async () => {
    const ligne: LigneContrat = {
      id: editingContract?.id ?? "",
      clientId: id,
      startDate: contractForm.startDate,
      endDate: contractForm.endDate || undefined,
      description: contractForm.description,
      status: contractForm.status,
    };
    const recordId = await registreContrats.enregistrer(ligne, {
      period: contractForm.startDate.slice(0, 7),
      label: contractForm.description || `Contrat — ${client.name}`,
      status: contractForm.status,
    });
    if (contractFile) {
      await attacherPiece.mutateAsync({
        file: contractFile,
        scopeId: id,
        slot: `contrat-${recordId}`,
      });
    }
    setIsContractFormOpen(false);
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
    setGiftFile(null);
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
    setGiftFile(null);
    setIsGiftFormOpen(true);
  };

  const handleSaveGift = async () => {
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
    const recordId = await registreCadeaux.enregistrer(ligne, {
      period: giftForm.date.slice(0, 7),
      label: giftForm.giftDescription || `Cadeau — ${client.name}`,
    });
    if (giftFile) {
      await attacherPiece.mutateAsync({
        file: giftFile,
        scopeId: id,
        slot: `recu-${recordId}`,
      });
    }
    setIsGiftFormOpen(false);
  };

  const handleDeleteGift = async (g: ClientGift) => {
    const recu = recuDe(g.id);
    await registreCadeaux.supprimerLigne(g.id);
    if (recu) await detacherPiece.mutateAsync(recu.id).catch(() => {});
  };

  /**
   * Après le choix du reçu : lit la photo et pré-remplit date, HT, TVA, TTC et
   * description. Un échec n'empêche jamais la saisie manuelle.
   */
  const handleGiftFileChange = async (fichier: File | null) => {
    setGiftFile(fichier);
    const courant = ++analyseId.current;
    setAnalyseRetour(null);
    setAnalyseEnCours(false);
    if (!fichier) return;

    // Les PDF (et Word/Excel) ne sont pas lus : évite un aller-retour serveur
    // dont le résultat est connu d'avance.
    if (!estPhotoLisible(fichier)) {
      setAnalyseRetour({ texte: MESSAGE_PDF, ton: "info" });
      return;
    }

    setAnalyseEnCours(true);
    try {
      const envoi = await preparerPhotoPourLecture(fichier);
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

      setGiftForm((prev) => {
        // Le serveur complète déjà le troisième montant s'il en lit deux.
        const suivant = { ...prev };
        if (extrait.date) suivant.date = extrait.date;
        if (extrait.montantHT !== null)
          suivant.valueHT = String(extrait.montantHT);
        if (extrait.tva !== null) suivant.tva = String(extrait.tva);
        if (extrait.montantTTC !== null)
          suivant.valueTTC = String(extrait.montantTTC);
        if (
          extrait.description &&
          (prev.giftDescription.trim() === "" ||
            prev.giftDescription === descriptionAuto)
        ) {
          suivant.giftDescription = extrait.description;
        }
        return suivant;
      });
      if (extrait.description) setDescriptionAuto(extrait.description);
      setAnalyseRetour({
        texte:
          "Champs pré-remplis à partir du document : vérifiez-les avant d'enregistrer.",
        ton: "succes",
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
        onOpenChange={setIsContractFormOpen}
        type="form"
        title={editingContract ? "Modifier le contrat" : "Nouveau contrat"}
        actions={{
          primary: {
            label: editingContract ? "Enregistrer" : "Créer",
            onClick: () => void handleSaveContract(),
            disabled: !contractForm.description || !contractForm.startDate,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsContractFormOpen(false),
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
            <Label htmlFor="contract-file">Fichier du contrat</Label>
            <input
              ref={contractFileInputRef}
              id="contract-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
              className="hidden"
              onChange={(e) => setContractFile(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 font-normal"
              onClick={() => contractFileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {contractFile
                ? contractFile.name
                : editingContract && fichierContratDe(editingContract.id)
                  ? fichierContratDe(editingContract.id)!.name
                  : "Choisir un fichier"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isGiftFormOpen}
        onOpenChange={setIsGiftFormOpen}
        type="form"
        title={editingGift ? "Modifier le cadeau" : "Nouveau cadeau"}
        actions={{
          primary: {
            label: editingGift ? "Enregistrer" : "Créer",
            onClick: () => void handleSaveGift(),
            disabled: !giftForm.giftDescription || !giftForm.date,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsGiftFormOpen(false),
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
              onChange={(e) =>
                setGiftForm({ ...giftForm, giftDescription: e.target.value })
              }
              placeholder="Ex : Coffret gastronomique"
            />
          </div>
          <div>
            <Label htmlFor="gift-date">Date</Label>
            <Input
              id="gift-date"
              type="date"
              value={giftForm.date}
              onChange={(e) =>
                setGiftForm({ ...giftForm, date: e.target.value })
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
                onChange={(e) =>
                  setGiftForm(
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
                onChange={(e) =>
                  setGiftForm(appliquerMontant(giftForm, "tva", e.target.value))
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
                onChange={(e) =>
                  setGiftForm(
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
            <Label htmlFor="gift-file">Reçu / facture</Label>
            <input
              ref={giftFileInputRef}
              id="gift-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const fichier = e.target.files?.[0] ?? null;
                void handleGiftFileChange(fichier);
                // Permet de re-choisir le même fichier pour relancer l'analyse.
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 font-normal"
              onClick={() => giftFileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {giftFile
                ? giftFile.name
                : editingGift && recuDe(editingGift.id)
                  ? recuDe(editingGift.id)!.name
                  : "Choisir un fichier"}
            </Button>
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
              <p
                role="status"
                className={cn(
                  "mt-2 text-sm",
                  analyseRetour.ton === "succes"
                    ? "text-green-600 dark:text-green-500"
                    : "text-orange-500",
                )}
              >
                {analyseRetour.texte}
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
