"use client";

import { useState, use } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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
  Gift,
  User,
  Eye,
  MoreVertical,
  Receipt,
} from "lucide-react";

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
}

const requiredDocuments = [
  { type: "contrat_cadre", name: "Contrat cadre", category: "contrat" },
  { type: "kbis_client", name: "Kbis du client", category: "juridique" },
];

const mockClients: Client[] = [
  {
    id: "1",
    name: "Société ABC Industries",
    address: "123 Rue de l'Industrie",
    city: "Paris",
    postalCode: "75001",
    country: "France",
    contactPerson: "Jean Dupont",
    phone: "01 23 45 67 89",
    email: "contact@abcindustries.fr",
    siret: "12345678901234",
    numTVA: "FR12345678901",
    sector: "Industrie",
    dirigeant: {
      nom: "Dupont",
      prenom: "Jean",
      dateNaissance: "1975-05-15",
      lieuNaissance: "Paris, France",
      nationalite: "Française",
      adresse: "15 Avenue Victor Hugo, 75016 Paris",
      email: "jean.dupont@abcindustries.fr",
      telephone: "06 12 34 56 78",
      fonction: "PDG",
      dateNomination: "2010-03-01",
      numeroSecuriteSociale: "1 75 05 75 123 456 78",
    },
  },
  {
    id: "2",
    name: "Entreprise XYZ Services",
    address: "456 Avenue des Services",
    city: "Lyon",
    postalCode: "69000",
    country: "France",
    contactPerson: "Marie Martin",
    phone: "04 56 78 90 12",
    email: "contact@xyzservices.fr",
    siret: "56789012345678",
    numTVA: "FR98765432109",
    sector: "Services",
    dirigeant: {
      nom: "Martin",
      prenom: "Marie",
      dateNaissance: "1980-08-22",
      lieuNaissance: "Lyon, France",
      nationalite: "Française",
      adresse: "78 Cours Gambetta, 69003 Lyon",
      email: "marie.martin@xyzservices.fr",
      telephone: "06 98 76 54 32",
      fonction: "Directrice Générale",
      dateNomination: "2015-06-15",
      numeroSecuriteSociale: "2 80 08 69 234 567 89",
    },
  },
  {
    id: "3",
    name: "Groupe DEF Solutions",
    address: "789 Boulevard des Solutions",
    city: "Marseille",
    postalCode: "13000",
    country: "France",
    contactPerson: "Pierre Durand",
    phone: "04 91 23 45 67",
    email: "contact@defsolutions.fr",
    siret: "90123456789012",
    numTVA: "FR11223344556",
    sector: "Technologie",
    dirigeant: {
      nom: "Durand",
      prenom: "Pierre",
      dateNaissance: "1972-11-30",
      lieuNaissance: "Marseille, France",
      nationalite: "Française",
      adresse: "23 Rue Paradis, 13001 Marseille",
      email: "pierre.durand@defsolutions.fr",
      telephone: "06 45 67 89 01",
      fonction: "Président",
      dateNomination: "2012-09-01",
      numeroSecuriteSociale: "1 72 11 13 345 678 90",
    },
  },
];

const mockContracts: ClientContract[] = [
  {
    id: "1",
    clientId: "1",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2025-01-15"),
    description: "Contrat de surveillance générale",
    status: "active",
  },
  {
    id: "2",
    clientId: "1",
    startDate: new Date("2023-06-01"),
    endDate: new Date("2024-05-31"),
    description: "Contrat événementiel",
    status: "expired",
  },
  {
    id: "3",
    clientId: "2",
    startDate: new Date("2024-03-01"),
    description: "Contrat de gardiennage permanent",
    status: "active",
  },
];

const mockGifts: ClientGift[] = [
  {
    id: "1",
    clientId: "1",
    giftDescription: "Panier de Noël",
    date: new Date("2023-12-20"),
    valueHT: 125,
    tva: 25,
    valueTTC: 150,
    notes: "Remis au directeur général",
  },
  {
    id: "2",
    clientId: "2",
    giftDescription: "Bouteille de champagne",
    date: new Date("2024-01-15"),
    valueHT: 67,
    tva: 13,
    valueTTC: 80,
    notes: "Nouvel an - équipe dirigeante",
  },
];

const mockDocuments: Document[] = [
  {
    id: "1",
    clientId: "1",
    name: "Contrat cadre ABC Industries",
    type: "contrat_cadre",
    uploadDate: "2024-01-10",
    expiryDate: "2025-01-10",
    status: "valid",
    required: true,
  },
  {
    id: "2",
    clientId: "1",
    name: "Kbis ABC Industries",
    type: "kbis_client",
    uploadDate: "2024-10-15",
    expiryDate: "2025-04-15",
    status: "expiring",
    required: true,
  },
  {
    id: "3",
    clientId: "2",
    name: "Autorisation CNAPS - XYZ",
    type: "autorisation_cnaps",
    uploadDate: "2024-08-20",
    expiryDate: "2025-02-20",
    status: "expiring",
    required: true,
  },
];

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
            "bg-muted/30 border-transparent shadow-none cursor-default focus-visible:ring-0",
        )}
      />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
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

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [client, setClient] = useState<Client | null>(
    mockClients.find((c) => c.id === id) || null,
  );
  const [contracts, setContracts] = useState<ClientContract[]>(
    mockContracts.filter((c) => c.clientId === id),
  );
  const [gifts, setGifts] = useState<ClientGift[]>(
    mockGifts.filter((g) => g.clientId === id),
  );
  const [viewContract, setViewContract] = useState<ClientContract | null>(null);
  const [viewGift, setViewGift] = useState<ClientGift | null>(null);
  const [giftReceipts, setGiftReceipts] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<Document[]>(
    mockDocuments.filter((doc) => doc.clientId === id),
  );
  const [isEditing, setIsEditing] = useState(
    searchParams.get("edit") === "true",
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isCustomDocModalOpen, setIsCustomDocModalOpen] = useState(false);
  const [newCustomDoc, setNewCustomDoc] = useState({
    name: "",
    description: "",
  });

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

  const handleSave = () => {
    console.log("Saving:", client);
    setIsEditing(false);
  };

  const handlePreview = (doc: Document) => {
    console.log("Preview:", doc);
    // In a real app, open a modal or new window with the document
  };

  const handleDownload = (doc: Document) => {
    console.log("Download:", doc);
    // In a real app, trigger download of the file
  };

  const handleUpload = (docType: { name: string; type: string }) => {
    // For mock purposes, simulate upload by adding the document
    const newDoc: Document = {
      id: Date().toString(),
      clientId: id,
      name: docType.name,
      type: docType.type,
      uploadDate: new Date().toISOString().split("T")[0],
      status: "valid",
      required: true,
    };
    setDocuments([...documents, newDoc]);
  };

  const handleCancel = () => {
    const original = mockClients.find((c) => c.id === id);
    if (original) {
      setClient(original);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    console.log("Deleting:", id);
    router.push("/dashboard/hr/entreprise/clients");
  };

  const handleBulkDownload = () => {
    console.log("Downloading documents:", selectedDocuments);
  };

  const handleDeleteContract = (c: ClientContract) =>
    setContracts((prev) => prev.filter((x) => x.id !== c.id));

  const handleDeleteGift = (g: ClientGift) =>
    setGifts((prev) => prev.filter((x) => x.id !== g.id));

  const handleUploadReceipt = (g: ClientGift) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,application/pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) setGiftReceipts((prev) => ({ ...prev, [g.id]: file.name }));
    };
    input.click();
  };

  const handleDownloadReceipt = (g: ClientGift) => {
    // Mock : le reçu/facture sera servi par le backend une fois branché.
    console.log("Télécharger le reçu/facture du cadeau:", g.id, giftReceipts[g.id]);
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
          <span className="font-medium">{doc.name}</span>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (doc) => {
        const docType = requiredDocuments.find((d) => d.type === doc.type);
        return docType?.name || doc.type;
      },
    },
    {
      key: "description",
      label: "Description",
      sortable: false,
      render: (doc) => doc.description || "-",
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
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
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
                <Button size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Nouveau contrat
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={contracts}
                columns={contractColumns}
                searchKey="description"
                searchPlaceholder="Rechercher un contrat..."
                onRowClick={(c) => setViewContract(c)}
                rowClassName={() =>
                  "cursor-pointer transition-colors hover:bg-accent"
                }
                actions={(c) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setViewContract(c)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setViewContract(c)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteContract(c)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                <Button size="sm">
                  <Gift className="h-4 w-4 mr-2" />
                  Nouveau cadeau
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                data={gifts}
                columns={giftColumns}
                searchKey="giftDescription"
                searchPlaceholder="Rechercher un cadeau..."
                onRowClick={(g) => setViewGift(g)}
                rowClassName={() =>
                  "cursor-pointer transition-colors hover:bg-accent"
                }
                actions={(g) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setViewGift(g)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Voir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setViewGift(g)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          giftReceipts[g.id]
                            ? handleDownloadReceipt(g)
                            : handleUploadReceipt(g)
                        }
                      >
                        <Receipt className="mr-2 h-4 w-4" />
                        {giftReceipts[g.id]
                          ? "Télécharger le reçu/facture"
                          : "Téléverser un reçu/facture"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteGift(g)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                      {existingDoc ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreview(existingDoc)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Aperçu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(existingDoc)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => handleUpload(docType)}>
                          <Upload className="h-4 w-4 mr-1" />
                          Téléverser
                        </Button>
                      )}
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
            onClick: handleDelete,
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
        title="Ajouter un document personnalisé"
        actions={{
          primary: {
            label: "Ajouter",
            onClick: () => {
              const newDoc: Document = {
                id: Date.now().toString(),
                clientId: id,
                name: newCustomDoc.name,
                type: "custom",
                description: newCustomDoc.description,
                uploadDate: new Date().toISOString().split("T")[0],
                status: "valid",
                required: false,
              };
              setDocuments([...documents, newDoc]);
              setIsCustomDocModalOpen(false);
              setNewCustomDoc({ name: "", description: "" });
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
            <Label htmlFor="doc-description">Description</Label>
            <Input
              id="doc-description"
              value={newCustomDoc.description}
              onChange={(e) =>
                setNewCustomDoc({
                  ...newCustomDoc,
                  description: e.target.value,
                })
              }
              placeholder="Description du document"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!viewContract}
        onOpenChange={(o) => !o && setViewContract(null)}
        type="form"
        title="Détail du contrat"
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setViewContract(null),
            variant: "outline" as const,
          },
        }}
      >
        {viewContract && (
          <div className="space-y-1 text-base">
            <DetailRow label="Description" value={viewContract.description} />
            <DetailRow
              label="Date de début"
              value={new Date(viewContract.startDate).toLocaleDateString(
                "fr-FR",
              )}
            />
            <DetailRow
              label="Date de fin"
              value={
                viewContract.endDate
                  ? new Date(viewContract.endDate).toLocaleDateString("fr-FR")
                  : "Indéterminée"
              }
            />
            <DetailRow
              label="Statut"
              value={getStatusText(viewContract.status)}
            />
          </div>
        )}
      </Modal>

      <Modal
        open={!!viewGift}
        onOpenChange={(o) => !o && setViewGift(null)}
        type="form"
        title="Détail du cadeau"
        actions={{
          primary: {
            label: "Fermer",
            onClick: () => setViewGift(null),
            variant: "outline" as const,
          },
        }}
      >
        {viewGift && (
          <div className="space-y-3 text-base">
            <div className="space-y-1">
              <DetailRow
                label="Description"
                value={viewGift.giftDescription}
              />
              <DetailRow
                label="Date"
                value={new Date(viewGift.date).toLocaleDateString("fr-FR")}
              />
              <DetailRow
                label="Valeur HT"
                value={viewGift.valueHT ? `${viewGift.valueHT} €` : "-"}
              />
              <DetailRow
                label="TVA"
                value={viewGift.tva ? `${viewGift.tva} €` : "-"}
              />
              <DetailRow
                label="Valeur TTC"
                value={viewGift.valueTTC ? `${viewGift.valueTTC} €` : "-"}
              />
              <DetailRow label="Notes" value={viewGift.notes || "-"} />
              <DetailRow
                label="Reçu / Facture"
                value={giftReceipts[viewGift.id] ?? "Aucun"}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUploadReceipt(viewGift)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Téléverser un reçu
              </Button>
              {giftReceipts[viewGift.id] && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReceipt(viewGift)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
