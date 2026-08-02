"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  FileText,
  MapPin,
  Shield,
  Download,
  Eye,
  Pencil,
  Trash2,
  Plus,
  History,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import {
  buildDateRange,
  isDateInRange,
  type DateFilterPreset,
} from "@/lib/date-range";

interface InterpellationRecord {
  id: string;
  siteId: string;
  siteName: string;
  date: string;
  agentId: string;
  agentName: string;
  reason: string;
  description: string;
  personInterpellated?: string;
  status: "archived" | "active";
  archivedAt: string;
  archivedBy: string;
  // Identity
  personNom?: string;
  personPrenom?: string;
  personDateNaissance?: string;
  personLieuNaissance?: string;
  personAdresse?: string;
  personTelephone?: string;
  // Circumstances
  heureInterpellation?: string;
  // Suites
  appelForcesOrdre?: boolean;
  detailForcesOrdre?: string;
  typeInfraction?: "vol" | "degradation" | "intrusion" | "autre";
  montantProduits?: number;
  statutPaiement?: "regle" | "non_regle";
}

const mockSites = [
  { id: "SITE-001", name: "Centre Commercial Atlantis" },
  { id: "SITE-002", name: "Tour de Bureaux Skyline" },
];

const mockInterpellationRecords: InterpellationRecord[] = [
  {
    id: "INT-2024-001",
    siteId: "SITE-001",
    siteName: "Centre Commercial Atlantis",
    date: "2024-12-24T14:30:00Z",
    agentId: "AGT-125",
    agentName: "Jean Dupont",
    reason: "Comportement suspect",
    description:
      "Personne suspecte observée dans le parking. Contrôle d'identité effectué.",
    personInterpellated: "M. X",
    status: "archived",
    archivedAt: "2024-12-24T15:00:00Z",
    archivedBy: "Marie Martin",
    personNom: "Dubois",
    personPrenom: "Laurent",
    personDateNaissance: "1987-03-15",
    personLieuNaissance: "Marseille",
    personAdresse: "12 rue de la Republique, 75001 Paris",
    personTelephone: "06 12 34 56 78",
    heureInterpellation: "14:30",
    appelForcesOrdre: true,
    detailForcesOrdre:
      "Police nationale contactée à 14:45. Arrivée sur site à 15:10. PV numéro 2024-1247.",
    typeInfraction: "vol",
    montantProduits: 245.5,
    statutPaiement: "regle",
  },
  {
    id: "INT-2024-002",
    siteId: "SITE-002",
    siteName: "Tour de Bureaux Skyline",
    date: "2024-12-23T10:15:00Z",
    agentId: "AGT-126",
    agentName: "Marie Martin",
    reason: "Tentative d'intrusion",
    description:
      "Tentative d'accès non autorisé détectée. Intervention immédiate.",
    status: "archived",
    archivedAt: "2024-12-23T11:00:00Z",
    archivedBy: "Pierre Durand",
    personNom: "Moreau",
    personPrenom: "Sébastien",
    personDateNaissance: "1994-07-22",
    personLieuNaissance: "Lyon",
    personAdresse: "45 avenue Jean Jaurès, 69007 Lyon",
    personTelephone: "07 89 01 23 45",
    heureInterpellation: "10:15",
    appelForcesOrdre: true,
    detailForcesOrdre:
      "Gendarmerie nationale contactée à 10:30. Remise en main propre à 11:05.",
    typeInfraction: "intrusion",
  },
  {
    id: "INT-2024-003",
    siteId: "SITE-001",
    siteName: "Centre Commercial Atlantis",
    date: "2024-12-22T16:45:00Z",
    agentId: "AGT-125",
    agentName: "Jean Dupont",
    reason: "Vérification d'identité",
    description: "Vérification d'identité de routine effectuée.",
    personInterpellated: "M. Y",
    status: "active",
    archivedAt: "",
    archivedBy: "",
    personNom: "Petit",
    personPrenom: "Arnaud",
    personDateNaissance: "2002-11-08",
    personLieuNaissance: "Nantes",
    personAdresse: "8 boulevard Victor Hugo, 44000 Nantes",
    personTelephone: "06 55 44 33 22",
    heureInterpellation: "16:45",
    appelForcesOrdre: false,
    typeInfraction: "degradation",
    montantProduits: 80.0,
    statutPaiement: "non_regle",
  },
];

const reasons = [
  "Vol",
  "Comportement suspect",
  "Tentative d'intrusion",
  "Vérification d'identité",
  "Contrôle d'accès",
  "Autre",
];

const infractionOptions = [
  { value: "vol", label: "Vol" },
  { value: "degradation", label: "Dégradation" },
  { value: "intrusion", label: "Intrusion" },
  { value: "autre", label: "Autre" },
];

const statutPaiementOptions = [
  { value: "regle", label: "Réglé" },
  { value: "non_regle", label: "Non réglé" },
];

const emptyFicheData = {
  reason: "",
  description: "",
  heureInterpellation: "",
  personNom: "",
  personPrenom: "",
  personDateNaissance: "",
  personLieuNaissance: "",
  personAdresse: "",
  personTelephone: "",
  appelForcesOrdre: false,
  detailForcesOrdre: "",
  typeInfraction: "",
  montantProduits: "",
  statutPaiement: "",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

type FicheFormData = typeof emptyFicheData;

function FicheFormSections({
  data,
  onChange,
  readOnly,
  recordDate,
  recordSite,
}: {
  data: FicheFormData;
  onChange: (updates: Partial<FicheFormData>) => void;
  readOnly?: boolean;
  recordDate?: string;
  recordSite?: string;
}) {
  const today = new Date().toLocaleDateString("fr-FR");
  const now = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const showMontant = !!data.typeInfraction;
  const montantValue = Number(data.montantProduits);
  const showStatutPaiement = showMontant && montantValue > 0;

  return (
    <div className="space-y-6">
      {/* Section 1 — Circonstances */}
      <div>
        <SectionTitle>Circonstances</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date</Label>
            <Input
              value={
                recordDate
                  ? new Date(recordDate).toLocaleDateString("fr-FR")
                  : today
              }
              readOnly
              className="bg-muted/30 text-muted-foreground"
            />
          </div>
          <div>
            <Label>Heure</Label>
            <Input
              value={data.heureInterpellation || now}
              readOnly
              className="bg-muted/30 text-muted-foreground"
            />
          </div>
          <div className="col-span-2">
            <Label>Site</Label>
            <Input
              value={recordSite ?? mockSites[0].name}
              readOnly
              className="bg-muted/30 text-muted-foreground"
            />
          </div>
          <div className="col-span-2">
            <Label>Motif</Label>
            {readOnly ? (
              <p className="text-sm mt-1">{data.reason || "-"}</p>
            ) : (
              <Select
                value={data.reason}
                onValueChange={(v) => onChange({ reason: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un motif" />
                </SelectTrigger>
                <SelectContent>
                  {reasons.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="col-span-2">
            <Label>Description / Libellé</Label>
            {readOnly ? (
              <p className="text-sm mt-1 whitespace-pre-wrap">
                {data.description || "-"}
              </p>
            ) : (
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
                value={data.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Description des circonstances..."
              />
            )}
          </div>
        </div>
      </div>

      {/* Section 2 — Personne interpellée */}
      <div>
        <SectionTitle>Personne interpellée</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nom</Label>
            {readOnly ? (
              <p className="text-sm mt-1">{data.personNom || "-"}</p>
            ) : (
              <Input
                value={data.personNom}
                onChange={(e) => onChange({ personNom: e.target.value })}
                placeholder="Nom de famille"
              />
            )}
          </div>
          <div>
            <Label>Prénom</Label>
            {readOnly ? (
              <p className="text-sm mt-1">{data.personPrenom || "-"}</p>
            ) : (
              <Input
                value={data.personPrenom}
                onChange={(e) => onChange({ personPrenom: e.target.value })}
                placeholder="Prénom"
              />
            )}
          </div>
          <div>
            <Label>Date de naissance</Label>
            {readOnly ? (
              <p className="text-sm mt-1">
                {data.personDateNaissance
                  ? new Date(data.personDateNaissance).toLocaleDateString(
                      "fr-FR",
                    )
                  : "-"}
              </p>
            ) : (
              <Input
                type="date"
                value={data.personDateNaissance}
                onChange={(e) =>
                  onChange({ personDateNaissance: e.target.value })
                }
              />
            )}
          </div>
          <div>
            <Label>Lieu de naissance</Label>
            {readOnly ? (
              <p className="text-sm mt-1">{data.personLieuNaissance || "-"}</p>
            ) : (
              <Input
                value={data.personLieuNaissance}
                onChange={(e) =>
                  onChange({ personLieuNaissance: e.target.value })
                }
                placeholder="Ville / Commune"
              />
            )}
          </div>
          <div className="col-span-2">
            <Label>Adresse</Label>
            {readOnly ? (
              <p className="text-sm mt-1">{data.personAdresse || "-"}</p>
            ) : (
              <Input
                value={data.personAdresse}
                onChange={(e) => onChange({ personAdresse: e.target.value })}
                placeholder="Adresse complète"
              />
            )}
          </div>
          <div>
            <Label>Téléphone</Label>
            {readOnly ? (
              <p className="text-sm mt-1">{data.personTelephone || "-"}</p>
            ) : (
              <Input
                value={data.personTelephone}
                onChange={(e) => onChange({ personTelephone: e.target.value })}
                placeholder="Numéro de téléphone"
              />
            )}
          </div>
        </div>
      </div>

      {/* Section 3 — Suites */}
      <div>
        <SectionTitle>Suites</SectionTitle>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {readOnly ? (
              <p className="text-sm">
                Forces de l&apos;ordre contactées :{" "}
                <strong>{data.appelForcesOrdre ? "Oui" : "Non"}</strong>
              </p>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={data.appelForcesOrdre}
                  onChange={(e) =>
                    onChange({ appelForcesOrdre: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                Forces de l&apos;ordre contactées
              </label>
            )}
          </div>

          {data.appelForcesOrdre && (
            <div>
              <Label>Détail forces de l&apos;ordre</Label>
              {readOnly ? (
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {data.detailForcesOrdre || "-"}
                </p>
              ) : (
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={2}
                  value={data.detailForcesOrdre}
                  onChange={(e) =>
                    onChange({ detailForcesOrdre: e.target.value })
                  }
                  placeholder="Unité contactée, heure d'arrivée, numéro de procès-verbal..."
                />
              )}
            </div>
          )}

          <div>
            <Label>Type d&apos;infraction</Label>
            {readOnly ? (
              <p className="text-sm mt-1">
                {infractionOptions.find((o) => o.value === data.typeInfraction)
                  ?.label ?? "-"}
              </p>
            ) : (
              <Select
                value={data.typeInfraction}
                onValueChange={(v) => onChange({ typeInfraction: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {infractionOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {showMontant && (
            <div>
              <Label>Montant produits / dégradation (€)</Label>
              {readOnly ? (
                <p className="text-sm mt-1">
                  {data.montantProduits
                    ? `${Number(data.montantProduits).toFixed(2)} €`
                    : "-"}
                </p>
              ) : (
                <Input
                  type="number"
                  value={data.montantProduits}
                  onChange={(e) =>
                    onChange({ montantProduits: e.target.value })
                  }
                  placeholder="Montant en euros"
                  min="0"
                  step="0.01"
                />
              )}
            </div>
          )}

          {showStatutPaiement && (
            <div>
              <Label>Statut du paiement</Label>
              {readOnly ? (
                <p className="text-sm mt-1">
                  {statutPaiementOptions.find(
                    (o) => o.value === data.statutPaiement,
                  )?.label ?? "-"}
                </p>
              ) : (
                <div className="flex gap-4 mt-2">
                  {statutPaiementOptions.map((o) => (
                    <label
                      key={o.value}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="statutPaiement"
                        value={o.value}
                        checked={data.statutPaiement === o.value}
                        onChange={() => onChange({ statutPaiement: o.value })}
                        className="h-4 w-4"
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {showMontant && (
            <div className="md:col-span-2">
              <Label>Justificatif</Label>
              <div
                className="mt-2 flex items-center gap-3 rounded-md border border-dashed border-border/60 bg-muted/20 p-3 opacity-60"
                title="Disponible bientôt"
              >
                <input
                  type="file"
                  accept="image/*,.pdf"
                  disabled
                  className="text-xs text-muted-foreground"
                />
                <span className="text-xs text-muted-foreground">
                  Disponible bientôt — ex. ticket de caisse si restitution
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function recordToFormData(record: InterpellationRecord): FicheFormData {
  return {
    reason: record.reason ?? "",
    description: record.description ?? "",
    heureInterpellation: record.heureInterpellation ?? "",
    personNom: record.personNom ?? "",
    personPrenom: record.personPrenom ?? "",
    personDateNaissance: record.personDateNaissance ?? "",
    personLieuNaissance: record.personLieuNaissance ?? "",
    personAdresse: record.personAdresse ?? "",
    personTelephone: record.personTelephone ?? "",
    appelForcesOrdre: record.appelForcesOrdre ?? false,
    detailForcesOrdre: record.detailForcesOrdre ?? "",
    typeInfraction: record.typeInfraction ?? "",
    montantProduits: record.montantProduits?.toString() ?? "",
    statutPaiement: record.statutPaiement ?? "",
  };
}

export default function InterpellationArchivesPage() {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] =
    useState<InterpellationRecord | null>(null);
  const [editingRecord, setEditingRecord] =
    useState<InterpellationRecord | null>(null);
  const [deletingRecord, setDeletingRecord] =
    useState<InterpellationRecord | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    site: "all",
    agent: "",
    reason: "all",
    startDate: "",
    endDate: "",
    searchTerm: "",
  });
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("all");

  const [newFicheData, setNewFicheData] =
    useState<FicheFormData>(emptyFicheData);
  const [editFicheData, setEditFicheData] =
    useState<FicheFormData>(emptyFicheData);

  let filteredRecords = mockInterpellationRecords;

  if (searchFilters.site !== "all") {
    filteredRecords = filteredRecords.filter(
      (r) => r.siteId === searchFilters.site,
    );
  }
  if (searchFilters.agent) {
    filteredRecords = filteredRecords.filter((r) =>
      r.agentName.toLowerCase().includes(searchFilters.agent.toLowerCase()),
    );
  }
  if (searchFilters.reason !== "all") {
    filteredRecords = filteredRecords.filter(
      (r) => r.reason === searchFilters.reason,
    );
  }
  const dateRange = buildDateRange(
    datePreset,
    searchFilters.startDate,
    searchFilters.endDate,
  );
  if (dateRange.from || dateRange.to) {
    filteredRecords = filteredRecords.filter((r) =>
      isDateInRange(r.date, dateRange),
    );
  }
  if (searchFilters.searchTerm) {
    filteredRecords = filteredRecords.filter(
      (r) =>
        r.description
          .toLowerCase()
          .includes(searchFilters.searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()),
    );
  }

  const columns: ColumnDef<InterpellationRecord>[] = [
    {
      key: "id",
      label: "ID",
      render: (record) => (
        <span className="font-mono text-xs">{record.id}</span>
      ),
    },
    {
      key: "siteName",
      label: "Site",
      render: (record) => (
        <span className="font-medium">{record.siteName}</span>
      ),
    },
    {
      key: "date",
      label: "Date",
      render: (record) => new Date(record.date).toLocaleString("fr-FR"),
    },
    {
      key: "agentName",
      label: "Agent",
    },
    {
      key: "reason",
      label: "Motif",
      render: (record) => <Badge variant="outline">{record.reason}</Badge>,
    },
    {
      key: "personNom",
      label: "Personne",
      render: (record) =>
        record.personNom
          ? `${record.personNom} ${record.personPrenom ?? ""}`.trim()
          : "-",
    },
    {
      key: "typeInfraction",
      label: "Infraction",
      render: (record) =>
        record.typeInfraction ? (
          <Badge variant="outline">
            {infractionOptions.find((o) => o.value === record.typeInfraction)
              ?.label ?? record.typeInfraction}
          </Badge>
        ) : (
          "-"
        ),
    },
    {
      key: "status",
      label: "Statut",
      render: (record) => (
        <Badge variant={record.status === "archived" ? "default" : "secondary"}>
          {record.status === "archived" ? "Archivé" : "Actif"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (record) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setViewingRecord(record);
              setIsViewModalOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditingRecord(record);
              setEditFicheData(recordToFormData(record));
              setIsEditModalOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingRecord(record);
              setIsDeleteModalOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    alert("Fiche d'interpellation créée");
    setIsCreateModalOpen(false);
    setNewFicheData(emptyFicheData);
  };

  const handleEdit = () => {
    alert("Fiche d'interpellation modifiée avec succès!");
    setIsEditModalOpen(false);
    setEditingRecord(null);
  };

  const handleDelete = () => {
    alert("Fiche d'interpellation supprimée avec succès!");
    setIsDeleteModalOpen(false);
    setDeletingRecord(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Archivage des Fiches d&apos;Interpellation
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Stockage sécurisé par site et date avec recherche avancée
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setNewFicheData(emptyFicheData);
              setIsCreateModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle fiche
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Historique */}
      <Card className="glass-card border-border/40">
        <CardHeader>
          <CardTitle className="text-lg font-light flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique — Recherche par période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangeFilter
            preset={datePreset}
            customStartDate={searchFilters.startDate}
            customEndDate={searchFilters.endDate}
            onPresetChange={setDatePreset}
            onCustomStartDateChange={(value) =>
              setSearchFilters((prev) => ({ ...prev, startDate: value }))
            }
            onCustomEndDateChange={(value) =>
              setSearchFilters((prev) => ({ ...prev, endDate: value }))
            }
            label="Période"
          />
        </CardContent>
      </Card>

      {/* Search Filters */}
      <Card className="glass-card border-border/40">
        <CardHeader>
          <CardTitle className="text-lg font-light flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche avancée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="site">Site</Label>
              <Select
                value={searchFilters.site}
                onValueChange={(value) =>
                  setSearchFilters({ ...searchFilters, site: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les sites</SelectItem>
                  <SelectItem value="SITE-001">
                    Centre Commercial Atlantis
                  </SelectItem>
                  <SelectItem value="SITE-002">
                    Tour de Bureaux Skyline
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="agent">Agent</Label>
              <Input
                id="agent"
                value={searchFilters.agent}
                onChange={(e) =>
                  setSearchFilters({ ...searchFilters, agent: e.target.value })
                }
                placeholder="Nom de l'agent..."
              />
            </div>

            <div>
              <Label htmlFor="reason">Motif</Label>
              <Select
                value={searchFilters.reason}
                onValueChange={(value) =>
                  setSearchFilters({ ...searchFilters, reason: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les motifs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les motifs</SelectItem>
                  {reasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="searchTerm">Recherche texte</Label>
              <Input
                id="searchTerm"
                value={searchFilters.searchTerm}
                onChange={(e) =>
                  setSearchFilters({
                    ...searchFilters,
                    searchTerm: e.target.value,
                  })
                }
                placeholder="Rechercher dans les descriptions..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <InfoCardContainer>
        <InfoCard
          icon={FileText}
          title="Total fiches"
          value={filteredRecords.length}
          color="blue"
        />
        <InfoCard
          icon={Shield}
          title="Archivées"
          value={filteredRecords.filter((r) => r.status === "archived").length}
          color="green"
        />
        <InfoCard
          icon={FileText}
          title="Actives"
          value={filteredRecords.filter((r) => r.status === "active").length}
          color="orange"
        />
        <InfoCard
          icon={MapPin}
          title="Sites concernés"
          value={new Set(filteredRecords.map((r) => r.siteId)).size}
          color="purple"
        />
      </InfoCardContainer>

      {/* Table */}
      <Card className="glass-card border-border/40">
        <CardHeader>
          <CardTitle className="text-lg font-light">
            Fiches d&apos;interpellation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            onRowClick={(record) => {
              setViewingRecord(record);
              setIsViewModalOpen(true);
            }}
            data={filteredRecords}
            columns={columns}
            searchKey="description"
            searchPlaceholder="Rechercher une fiche..."
          />
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) setNewFicheData(emptyFicheData);
        }}
        type="form"
        title="Nouvelle fiche d'interpellation"
        size="xl"
        actions={{
          primary: {
            label: "Enregistrer la fiche",
            onClick: handleCreate,
          },
          secondary: {
            label: "Annuler",
            onClick: () => {
              setIsCreateModalOpen(false);
              setNewFicheData(emptyFicheData);
            },
            variant: "outline",
          },
        }}
      >
        <FicheFormSections
          data={newFicheData}
          onChange={(updates) =>
            setNewFicheData((prev) => ({ ...prev, ...updates }))
          }
        />
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de la fiche d'interpellation"
        size="xl"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {viewingRecord && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ID</Label>
                <p className="text-sm font-mono mt-1">{viewingRecord.id}</p>
              </div>
              <div>
                <Label>Agent</Label>
                <p className="text-sm mt-1">{viewingRecord.agentName}</p>
              </div>
            </div>

            <div>
              <Label>Statut</Label>
              <div className="mt-1">
                <Badge
                  variant={
                    viewingRecord.status === "archived"
                      ? "default"
                      : "secondary"
                  }
                >
                  {viewingRecord.status === "archived" ? "Archivé" : "Actif"}
                </Badge>
              </div>
            </div>

            {viewingRecord.status === "archived" && (
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <Label>Archivé le</Label>
                  <p className="text-sm mt-1">
                    {new Date(viewingRecord.archivedAt).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div>
                  <Label>Archivé par</Label>
                  <p className="text-sm mt-1">{viewingRecord.archivedBy}</p>
                </div>
              </div>
            )}

            <FicheFormSections
              data={recordToFormData(viewingRecord)}
              onChange={() => {}}
              readOnly
              recordDate={viewingRecord.date}
              recordSite={viewingRecord.siteName}
            />
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setEditingRecord(null);
        }}
        type="form"
        title="Modifier la fiche d'interpellation"
        size="xl"
        actions={{
          primary: {
            label: "Enregistrer",
            onClick: handleEdit,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsEditModalOpen(false),
            variant: "outline",
          },
        }}
      >
        {editingRecord && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ID</Label>
                <Input value={editingRecord.id} disabled />
              </div>
              <div>
                <Label>Agent</Label>
                <Input value={editingRecord.agentName} disabled />
              </div>
            </div>
            <FicheFormSections
              data={editFicheData}
              onChange={(updates) =>
                setEditFicheData((prev) => ({ ...prev, ...updates }))
              }
              recordDate={editingRecord.date}
              recordSite={editingRecord.siteName}
            />
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        type="warning"
        title="Supprimer la fiche d'interpellation"
        description="Êtes-vous sûr de vouloir supprimer cette fiche d'interpellation ? Cette action est irréversible."
        size="sm"
        actions={{
          primary: {
            label: "Supprimer",
            onClick: handleDelete,
            variant: "destructive",
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsDeleteModalOpen(false),
            variant: "outline",
          },
        }}
      >
        {deletingRecord && (
          <div className="space-y-2">
            <p className="text-sm">
              <strong>ID:</strong> {deletingRecord.id}
            </p>
            <p className="text-sm">
              <strong>Site:</strong> {deletingRecord.siteName}
            </p>
            <p className="text-sm">
              <strong>Motif:</strong> {deletingRecord.reason}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
