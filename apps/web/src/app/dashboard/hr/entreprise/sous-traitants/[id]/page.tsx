"use client";

import { formaterTelephone } from "@/lib/phone-format";

import { useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
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
  Building2,
  FileText,
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
  Mail,
  Phone,
  CreditCard,
  Euro,
} from "lucide-react";
import { pickFile, downloadStoredFile } from "@/lib/document-files";
import {
  useAttachments,
  useAttachDocument,
  useDeleteAttachment,
} from "@/hooks/contracts";
import {
  useSubcontractor,
  useUpdateSubcontractor,
  useDeleteSubcontractor,
} from "@/hooks/clients";
import type {
  Subcontractor as ApiSubcontractor,
  UpdateSubcontractorPayload,
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

interface SousTraitant {
  id: string;
  name: string;
  siret: string;
  address: string;
  dirigeant: DirigeantInfo;
  email: string;
  telephone: string;
  capitalSocial: string;
  numeroAutorisation: string;
  dateDebut: string;
  statut: "actif" | "inactif" | "suspendu";
  prochainRenouvellement: string;
}

interface Document {
  id: string;
  sousTraitantId: string;
  name: string;
  type: string;
  uploadDate: string;
  expiryDate?: string;
  status: "valid" | "expiring" | "expired";
  required: boolean;
  /** Clé du bucket privé, permet le téléchargement du fichier réel. */
  storageKey?: string;
}

const requiredDocuments = [
  { type: "cni_dirigeant", name: "CNI du dirigeant", category: "dirigeant" },
  {
    type: "carte_pro_dirigeant",
    name: "Carte pro CNAPS du dirigeant",
    category: "dirigeant",
  },
  {
    type: "carte_pro_entreprise",
    name: "Carte pro CNAPS de l'entreprise",
    category: "entreprise",
  },
  { type: "kbis", name: "Kbis", category: "entreprise" },
  {
    type: "urssaf",
    name: "Attestation de vigilance URSSAF",
    category: "attestations",
  },
  {
    type: "fiscale",
    name: "Attestation de régularité Fiscale",
    category: "attestations",
  },
  {
    type: "assurance_rc",
    name: "Attestation d'assurance RC PRO",
    category: "attestations",
  },
  { type: "rib", name: "RIB", category: "bancaire" },
];

const optionalDocuments = [
  { type: "statuts", name: "Statuts", category: "juridique" },
  { type: "pv_ag", name: "PV Assemblée Générale", category: "juridique" },
];

const mockDocuments: Document[] = [];

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

/** Convertit le sous-traitant de l'API en copie éditable du formulaire. */
function toEditable(api: ApiSubcontractor): SousTraitant {
  return {
    id: api.id,
    name: api.name,
    siret: api.siret ?? "",
    address: api.address ?? "",
    dirigeant: { ...EMPTY_DIRIGEANT, ...(api.dirigeant ?? {}) },
    email: api.email ?? "",
    telephone: api.telephone ?? "",
    capitalSocial: api.capitalSocial ?? "",
    numeroAutorisation: api.numeroAutorisation ?? "",
    dateDebut: api.dateDebut ?? "",
    statut: api.statut,
    prochainRenouvellement: api.prochainRenouvellement ?? "",
  };
}

/** Ne transmet que les champs renseignés — le back-end refuse les chaînes vides. */
function toUpdatePayload(st: SousTraitant): UpdateSubcontractorPayload {
  const { id: _id, dirigeant, statut, ...champs } = st;
  const payload = Object.fromEntries(
    Object.entries(champs).filter(([, v]) => (v ?? "").trim() !== ""),
  ) as UpdateSubcontractorPayload;
  payload.statut = statut;
  const renseigne = Object.fromEntries(
    Object.entries(dirigeant).filter(([, v]) => (v ?? "").trim() !== ""),
  );
  if (Object.keys(renseigne).length > 0) payload.dirigeant = renseigne;
  return payload;
}

export default function SousTraitantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // La fiche lisait des données de démonstration : un sous-traitant réellement
  // créé n'y figurait pas, d'où le « Sous-traitant non trouvé ».
  const { data: apiSousTraitant, isLoading } = useSubcontractor(id);
  const updateMutation = useUpdateSubcontractor(id);
  const deleteMutation = useDeleteSubcontractor();

  const [sousTraitant, setSousTraitant] = useState<SousTraitant | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (apiSousTraitant && loadedId !== apiSousTraitant.id) {
    setLoadedId(apiSousTraitant.id);
    setSousTraitant(toEditable(apiSousTraitant));
  }

  // Documents persistes en base (rattachement generique scope/scopeId/slot).
  const { data: pieces = [] } = useAttachments("subcontractor", id);
  const attacher = useAttachDocument("subcontractor", id);
  const detacher = useDeleteAttachment("subcontractor", id);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const documents: Document[] = pieces.map((p) => ({
    id: p.id,
    sousTraitantId: id,
    name: p.name,
    type: p.slot,
    uploadDate: p.createdAt.split("T")[0],
    status: "valid",
    required: requiredDocuments.some((d) => d.type === p.slot),
    storageKey: p.storageKey,
  }));
  const [isEditing, setIsEditing] = useState(
    searchParams.get("edit") === "true",
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

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

  if (!sousTraitant) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Sous-traitant non trouvé
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
      case "actif":
        return "bg-success text-success-foreground";
      case "inactif":
        return "bg-neutral text-neutral-foreground";
      case "suspendu":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-neutral text-neutral-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "actif":
        return "Actif";
      case "inactif":
        return "Inactif";
      case "suspendu":
        return "Suspendu";
      default:
        return "Inconnu";
    }
  };

  const handleSave = async () => {
    if (!sousTraitant) return;
    setSaveError(null);
    try {
      await updateMutation.mutateAsync(toUpdatePayload(sousTraitant));
      setIsEditing(false);
    } catch (error) {
      setSaveError(
        `Échec de l'enregistrement : ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      );
    }
  };

  const handleCancel = () => {
    if (apiSousTraitant) {
      setSousTraitant(toEditable(apiSousTraitant));
    }
    setSaveError(null);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      router.push("/dashboard/hr/entreprise/sous-traitants");
    } catch (error) {
      alert(
        `Échec de la suppression : ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      );
    }
  };

  /**
   * Téléverse une pièce du dossier sous-traitant. Le bouton se contentait d'un
   * console.log. Le fichier part réellement dans le stockage ; faute de table
   * dédiée côté serveur, le rattachement à la ligne ne survit pas au
   * rechargement — c'est signalé sous la liste.
   */
  const handleDocumentUpload = async (type: string) => {
    const exigence = [...requiredDocuments, ...optionalDocuments].find(
      (d) => d.type === type,
    );
    const file = await pickFile();
    if (!file) return;
    try {
      await attacher.mutateAsync({ file, scopeId: id, slot: type });
      setUploadNotice(
        `« ${file.name} » enregistré pour ${exigence?.name ?? type}.`,
      );
    } catch (e) {
      alert(
        `Échec du téléversement : ${
          e instanceof Error ? e.message : "Erreur inconnue"
        }`,
      );
    }
  };

  /** Ouvre le fichier reellement depose. */
  const telechargerDocument = (doc: Document) => {
    if (!doc.storageKey) {
      alert("Ce document n'a pas de fichier associé.");
      return;
    }
    void downloadStoredFile({ name: doc.name, key: doc.storageKey });
  };

  const handleBulkDownload = () => {
    console.log("Downloading documents:", selectedDocuments);
  };

  const documentColumns: ColumnDef<Document>[] = [
    {
      key: "name",
      label: "Document",
      sortable: true,
      render: (doc) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{doc.name}</span>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (doc) => {
        const docType = [...requiredDocuments, ...optionalDocuments].find(
          (d) => d.type === doc.type,
        );
        return docType?.name || doc.type;
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
  ];

  return (
    <div className="space-y-6">
      {uploadNotice && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm"
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
      {saveError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {saveError}
        </p>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{sousTraitant.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(sousTraitant.statut)}>
                {getStatusText(sousTraitant.statut)}
              </Badge>
              <span className="text-sm">SIRET: {sousTraitant.siret}</span>
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
                disabled={updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="info">Informations</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          {/* Quick Stats */}
          <InfoCardContainer>
            <InfoCard
              icon={Calendar}
              title="Date de début"
              value={new Date(sousTraitant.dateDebut).toLocaleDateString(
                "fr-FR",
              )}
              color="blue"
            />
            <InfoCard
              icon={Calendar}
              title="Renouvellement"
              value={new Date(
                sousTraitant.prochainRenouvellement,
              ).toLocaleDateString("fr-FR")}
              color="purple"
            />
            <InfoCard
              icon={Euro}
              title="Capital"
              value={`${Number(sousTraitant.capitalSocial).toLocaleString()} €`}
              color="green"
            />
            <InfoCard
              icon={FileCheck}
              title="Documents"
              value={`${documents.filter((d) => d.status === "valid").length}/${documents.length}`}
              subtext="valides"
              color="orange"
            />
          </InfoCardContainer>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de l&apos;entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l&apos;entreprise</Label>
                  <Input
                    id="name"
                    value={sousTraitant.name}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({ ...sousTraitant, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET</Label>
                  <Input
                    id="siret"
                    value={sousTraitant.siret}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        siret: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={sousTraitant.address}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setSousTraitant({
                      ...sousTraitant,
                      address: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capital" className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Capital Social (€)
                  </Label>
                  <Input
                    id="capital"
                    value={sousTraitant.capitalSocial}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        capitalSocial: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="autorisation"
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    N° Autorisation CNAPS
                  </Label>
                  <Input
                    id="autorisation"
                    value={sousTraitant.numeroAutorisation}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        numeroAutorisation: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email de l&apos;entreprise
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={sousTraitant.email}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="telephone"
                    className="flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Téléphone de l&apos;entreprise
                  </Label>
                  <Input
                    id="telephone"
                    value={sousTraitant.telephone}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        telephone: formaterTelephone(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select
                    value={sousTraitant.statut}
                    onValueChange={(value) =>
                      setSousTraitant({
                        ...sousTraitant,
                        statut: value as SousTraitant["statut"],
                      })
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="statut">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="inactif">Inactif</SelectItem>
                      <SelectItem value="suspendu">Suspendu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateDebut">Date de début</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    value={sousTraitant.dateDebut}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        dateDebut: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="renouvellement">
                    Prochain renouvellement
                  </Label>
                  <Input
                    id="renouvellement"
                    type="date"
                    value={sousTraitant.prochainRenouvellement}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        prochainRenouvellement: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dirigeant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations du dirigeant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dirigeant-nom">Nom</Label>
                  <Input
                    id="dirigeant-nom"
                    value={sousTraitant.dirigeant.nom}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        dirigeant: {
                          ...sousTraitant.dirigeant,
                          nom: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dirigeant-prenom">Prénom</Label>
                  <Input
                    id="dirigeant-prenom"
                    value={sousTraitant.dirigeant.prenom}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        dirigeant: {
                          ...sousTraitant.dirigeant,
                          prenom: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dirigeant-fonction">Fonction</Label>
                  <Input
                    id="dirigeant-fonction"
                    value={sousTraitant.dirigeant.fonction}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        dirigeant: {
                          ...sousTraitant.dirigeant,
                          fonction: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dirigeant-date-nomination">
                    Date de nomination
                  </Label>
                  <Input
                    id="dirigeant-date-nomination"
                    type="date"
                    value={sousTraitant.dirigeant.dateNomination}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        dirigeant: {
                          ...sousTraitant.dirigeant,
                          dateNomination: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dirigeant-date-naissance">
                    Date de naissance
                  </Label>
                  <Input
                    id="dirigeant-date-naissance"
                    type="date"
                    value={sousTraitant.dirigeant.dateNaissance}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        dirigeant: {
                          ...sousTraitant.dirigeant,
                          dateNaissance: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dirigeant-lieu-naissance">
                    Lieu de naissance
                  </Label>
                  <Input
                    id="dirigeant-lieu-naissance"
                    value={sousTraitant.dirigeant.lieuNaissance}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        dirigeant: {
                          ...sousTraitant.dirigeant,
                          lieuNaissance: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dirigeant-nationalite">Nationalité</Label>
                  <Input
                    id="dirigeant-nationalite"
                    value={sousTraitant.dirigeant.nationalite}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        dirigeant: {
                          ...sousTraitant.dirigeant,
                          nationalite: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dirigeant-secu">
                    Numéro de sécurité sociale
                  </Label>
                  <Input
                    id="dirigeant-secu"
                    value={sousTraitant.dirigeant.numeroSecuriteSociale}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        dirigeant: {
                          ...sousTraitant.dirigeant,
                          numeroSecuriteSociale: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dirigeant-adresse">Adresse personnelle</Label>
                <Textarea
                  id="dirigeant-adresse"
                  value={sousTraitant.dirigeant.adresse}
                  disabled={!isEditing}
                  onChange={(e) =>
                    setSousTraitant({
                      ...sousTraitant,
                      dirigeant: {
                        ...sousTraitant.dirigeant,
                        adresse: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dirigeant-email">Email personnel</Label>
                  <Input
                    id="dirigeant-email"
                    type="email"
                    value={sousTraitant.dirigeant.email}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        dirigeant: {
                          ...sousTraitant.dirigeant,
                          email: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dirigeant-telephone">
                    Téléphone personnel
                  </Label>
                  <Input
                    id="dirigeant-telephone"
                    value={sousTraitant.dirigeant.telephone}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setSousTraitant({
                        ...sousTraitant,
                        dirigeant: {
                          ...sousTraitant.dirigeant,
                          telephone: formaterTelephone(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {/* Document Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDownload}
                    disabled={selectedDocuments.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger sélection
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={documents}
                columns={documentColumns}
                searchKeys={["name", "type"]}
                searchPlaceholder="Rechercher un document..."
                itemsPerPage={10}
                selectable
                onSelectionChange={(selected) =>
                  setSelectedDocuments(selected.map((d) => d.id))
                }
                getRowId={(doc) => doc.id}
                actions={(doc) => (
                  <RowActionsMenu
                    onDownload={() => telechargerDocument(doc)}
                    onUpload={() => void handleDocumentUpload(doc.type)}
                    uploadLabel="Remplacer"
                    onDelete={() => void detacher.mutateAsync(doc.id)}
                  />
                )}
              />
            </CardContent>
          </Card>

          {/* Missing Documents Alert */}
          {requiredDocuments.length >
            documents.filter((d) => d.required).length && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Documents manquants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {requiredDocuments
                    .filter(
                      (docType) =>
                        !documents.find((d) => d.type === docType.type),
                    )
                    .map((docType) => (
                      <div
                        key={docType.type}
                        className="flex items-center justify-between py-2 px-3 border rounded-md"
                      >
                        <span className="text-sm font-medium">
                          {docType.name}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            void handleDocumentUpload(docType.type)
                          }
                        >
                          <Upload className="h-3 w-3 mr-2" />
                          Téléverser
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        type="warning"
        title="Supprimer le sous-traitant"
        description={`Êtes-vous sûr de vouloir supprimer ${sousTraitant.name} ? Cette action est irréversible.`}
        actions={{
          primary: {
            label: "Supprimer",
            onClick: () => void handleDelete(),
            variant: "destructive",
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsDeleteModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Les éléments suivants seront également supprimés :</p>
          <ul className="list-disc list-inside space-y-1">
            <li>{documents.length} documents associés</li>
            <li>Historique des modifications</li>
            <li>Toutes les données liées au sous-traitant</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}
