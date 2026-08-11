"use client";

import { useState } from "react";
import {
  mockLogbookEvents,
  mockSites,
  mockAgents,
  LogbookEvent,
} from "@/data/logbook-events";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Download,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  MapPin,
  Camera,
  Video,
  Mic,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { QRCodeScanner } from "@/components/logbook/QRCodeScanner";
import { MediaUpload } from "@/components/logbook/MediaUpload";
import { DigitalSignature } from "@/components/logbook/DigitalSignature";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import {
  getSeverityBadgeVariant,
  getStatusBadgeVariant,
  getSeverityLabel,
  getStatusLabel,
} from "@/lib/logbook-utils";
import {
  buildDateRange,
  isDateInRange,
  type DateFilterPreset,
} from "@/lib/date-range";

// Agent et site de l'utilisateur courant. Les listes de démonstration ayant
// été retirées, on retombe sur des valeurs neutres tant que la session n'est
// pas branchée sur le module (sinon `mockAgents[0]` plantait la page).
const CURRENT_AGENT = mockAgents[0] ?? { id: "", name: "—", role: "" };
const CURRENT_SITE = mockSites.find((s) => s.id === CURRENT_AGENT.siteId) ?? {
  id: "",
  name: "—",
  city: "",
};

export default function EventsListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSite, setSelectedSite] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilterPreset>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [viewingEvent, setViewingEvent] = useState<LogbookEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<LogbookEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<LogbookEvent | null>(null);
  const [platform, setPlatform] = useState<"mobile" | "pc" | "tablet">("pc");
  const [formData, setFormData] = useState({
    site: "",
    zone: "",
    type: "",
    severity: "",
    title: "",
    description: "",
    agent: "",
    status: "in_progress",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<File[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [signature, setSignature] = useState<string | null>(null);
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleQRScan = (data: { zone: string; siteId: string }) => {
    setFormData((prev) => ({
      ...prev,
      zone: data.zone,
      site: data.siteId,
    }));
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Impossible d'obtenir la géolocalisation");
        },
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur");
    }
  };

  const handleCreate = () => {
    setFormData({
      site: CURRENT_SITE.id,
      zone: "",
      type: "",
      severity: "",
      title: "",
      description: "",
      agent: CURRENT_AGENT.id,
      status: "in_progress",
    });
    setPhotos([]);
    setVideos([]);
    setVoiceNotes([]);
    setLocation(null);
    setSignature(null);
    setPlatform("pc");
    setIsNewEventModalOpen(true);
  };

  const handleSave = () => {
    if (!signature) {
      alert("Veuillez signer électroniquement le document");
      return;
    }

    const eventData = {
      ...formData,
      photos: photos.map((f) => f.name),
      videos: videos.map((f) => f.name),
      voiceNotes: voiceNotes.map((f) => f.name),
      location,
      signature,
      platform,
      timestamp: new Date().toISOString(),
    };

    console.log("Submitting event:", eventData);
    setIsNewEventModalOpen(false);
    // Here you would normally add the event to the list or refresh
  };

  const handleEdit = () => {
    alert("Événement modifié avec succès!");
    setIsEditModalOpen(false);
    setEditingEvent(null);
  };

  const handleDelete = () => {
    alert("Événement supprimé avec succès!");
    setIsDeleteModalOpen(false);
    setDeletingEvent(null);
  };

  const columns: ColumnDef<LogbookEvent>[] = [
    {
      key: "id",
      label: "ID",
      render: (event) => <span className="font-mono text-xs">{event.id}</span>,
    },
    {
      key: "timestamp",
      label: "Date/Heure",
      render: (event) => (
        <span className="text-xs">
          {new Date(event.timestamp).toLocaleString("fr-FR")}
        </span>
      ),
    },
    {
      key: "site",
      label: "Site",
      render: (event) => <span className="text-sm">{event.site}</span>,
    },
    {
      key: "zone",
      label: "Zone",
      render: (event) => (
        <span className="text-sm text-muted-foreground">
          {event.zone || "-"}
        </span>
      ),
    },
    {
      key: "title",
      label: "Titre",
      render: (event) => (
        <span className="text-sm font-medium">{event.title}</span>
      ),
    },
    {
      key: "severity",
      label: "Gravité",
      render: (event) => (
        <Badge variant={getSeverityBadgeVariant(event.severity)}>
          {getSeverityLabel(event.severity)}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (event) => (
        <Badge variant={getStatusBadgeVariant(event.status)}>
          {getStatusLabel(event.status)}
        </Badge>
      ),
    },
    {
      key: "agentName",
      label: "Agent",
      render: (event) => <span className="text-sm">{event.agentName}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (event) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setViewingEvent(event);
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
              setEditingEvent(event);
              setFormData({
                site: event.siteId,
                zone: event.zone || "",
                type: event.type,
                severity: event.severity,
                title: event.title,
                description: event.description,
                agent: event.agentId,
                status: event.status,
              });
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
              setDeletingEvent(event);
              setIsDeleteModalOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const dateRange = buildDateRange(dateFilter, customStartDate, customEndDate);

  const filteredEvents = mockLogbookEvents.filter((event) => {
    if (!isDateInRange(event.timestamp, dateRange)) {
      return false;
    }

    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSite = selectedSite === "all" || event.siteId === selectedSite;
    const matchesStatus =
      selectedStatus === "all" || event.status === selectedStatus;
    const matchesSeverity =
      selectedSeverity === "all" || event.severity === selectedSeverity;

    return matchesSearch && matchesSite && matchesStatus && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            Tous les événements
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Historique complet de la main courante
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel événement
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        <div className="flex-1">
          <Input
            placeholder="Rechercher un événement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <DateRangeFilter
          preset={dateFilter}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onPresetChange={setDateFilter}
          onCustomStartDateChange={setCustomStartDate}
          onCustomEndDateChange={setCustomEndDate}
        />
        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les sites</SelectItem>
            {mockSites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="in_progress">En cours</SelectItem>
            <SelectItem value="resolved">Résolu</SelectItem>
            <SelectItem value="deferred">Reporté</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Gravité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les gravités</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="high">Élevée</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <DataTable
        onRowClick={(event) => {
          setViewingEvent(event);
          setIsViewModalOpen(true);
        }}
        columns={columns}
        data={filteredEvents}
      />

      {/* New Event Modal */}
      <Modal
        open={isNewEventModalOpen}
        onOpenChange={setIsNewEventModalOpen}
        type="form"
        title="Nouvel événement"
        description="Saisir un nouvel événement dans la main courante"
        size="lg"
        actions={{
          primary: {
            label: "Enregistrer l'événement",
            onClick: handleSave,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsNewEventModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          {/* Platform Selection */}
          <div>
            <Label>Plateforme de saisie</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={platform === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setPlatform("mobile")}
                className="gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Mobile
              </Button>
              <Button
                type="button"
                variant={platform === "pc" ? "default" : "outline"}
                size="sm"
                onClick={() => setPlatform("pc")}
                className="gap-2"
              >
                <Monitor className="h-4 w-4" />
                PC Sécurité
              </Button>
              <Button
                type="button"
                variant={platform === "tablet" ? "default" : "outline"}
                size="sm"
                onClick={() => setPlatform("tablet")}
                className="gap-2"
              >
                <Tablet className="h-4 w-4" />
                Tablette
              </Button>
            </div>
          </div>

          {/* QR Scanner */}
          <div>
            <QRCodeScanner onScan={handleQRScan} />
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Site (attribue automatiquement)</Label>
              <p className="text-sm py-2 px-3 bg-muted/30 rounded-md border border-border/40">
                {CURRENT_SITE.name}
              </p>
            </div>

            <div>
              <Label htmlFor="zone">Zone</Label>
              <Input
                id="zone"
                value={formData.zone}
                onChange={(e) => handleInputChange("zone", e.target.value)}
                placeholder="Ex: Entrée principale"
              />
            </div>

            <div>
              <Label htmlFor="type">Type d&apos;événement *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
                required
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Événement courant</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                  <SelectItem value="control">Contrôle</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="severity">Gravité *</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => handleInputChange("severity", value)}
                required
              >
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Sélectionner la gravité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Agent responsable (connecte)</Label>
              <p className="text-sm py-2 px-3 bg-muted/30 rounded-md border border-border/40">
                {CURRENT_AGENT.name}
              </p>
            </div>

            <div>
              <Label htmlFor="status">Statut *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
                required
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Sélectionner le statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="deferred">Reporté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Ex: Tentative d'effraction, Ronde de contrôle..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Décrire l'événement en détail..."
              rows={4}
              required
            />
          </div>

          {/* Media & Location */}
          <div>
            <Label>Documents et médias</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <MediaUpload
                type="photo"
                onUpload={(files) => setPhotos((prev) => [...prev, ...files])}
                files={photos}
                onRemove={(index) =>
                  setPhotos((prev) => prev.filter((_, i) => i !== index))
                }
              />
              <MediaUpload
                type="video"
                onUpload={(files) => setVideos((prev) => [...prev, ...files])}
                files={videos}
                onRemove={(index) =>
                  setVideos((prev) => prev.filter((_, i) => i !== index))
                }
              />
              <MediaUpload
                type="voice"
                onUpload={(files) =>
                  setVoiceNotes((prev) => [...prev, ...files])
                }
                files={voiceNotes}
                onRemove={(index) =>
                  setVoiceNotes((prev) => prev.filter((_, i) => i !== index))
                }
              />
            </div>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGetLocation}
              className="gap-2"
            >
              <MapPin className="h-4 w-4" />
              {location
                ? `Position: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                : "Obtenir la géolocalisation"}
            </Button>
            {location && (
              <Badge variant="secondary" className="ml-2">
                GPS activé
              </Badge>
            )}
          </div>

          {/* Digital Signature */}
          <div>
            <Label>Signature numérique (optionnel)</Label>
            <DigitalSignature onSign={setSignature} signature={signature} />
          </div>

          {/* Automatic Info */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Horodatage: </span>
              <span className="font-medium">
                {new Date().toLocaleString("fr-FR")}
              </span>
              <Badge variant="outline" className="ml-auto">
                Automatique
              </Badge>
            </div>
          </div>
        </div>
      </Modal>

      {/* View Event Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de l'événement"
        size="lg"
      >
        {viewingEvent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ID</Label>
                <p className="text-sm font-mono">{viewingEvent.id}</p>
              </div>
              <div>
                <Label>Date/Heure</Label>
                <p className="text-sm">
                  {new Date(viewingEvent.timestamp).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Site</Label>
                <p className="text-sm">
                  {mockSites.find((s) => s.id === viewingEvent.siteId)?.name ||
                    "N/A"}
                </p>
              </div>
              <div>
                <Label>Zone</Label>
                <p className="text-sm">{viewingEvent.zone || "-"}</p>
              </div>
            </div>

            <div>
              <Label>Titre</Label>
              <p className="text-sm font-medium">{viewingEvent.title}</p>
            </div>

            <div>
              <Label>Description</Label>
              <p className="text-sm whitespace-pre-wrap">
                {viewingEvent.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Badge variant="outline">{viewingEvent.type}</Badge>
              </div>
              <div>
                <Label>Gravité</Label>
                <Badge variant={getSeverityBadgeVariant(viewingEvent.severity)}>
                  {getSeverityLabel(viewingEvent.severity)}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statut</Label>
                <Badge variant={getStatusBadgeVariant(viewingEvent.status)}>
                  {getStatusLabel(viewingEvent.status)}
                </Badge>
              </div>
              <div>
                <Label>Agent</Label>
                <p className="text-sm">
                  {mockAgents.find((a) => a.id === viewingEvent.agentId)
                    ?.name || "N/A"}
                </p>
              </div>
            </div>

            {viewingEvent.location && (
              <div>
                <Label>Géolocalisation</Label>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {viewingEvent.location.lat.toFixed(4)},{" "}
                    {viewingEvent.location.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            )}

            {viewingEvent.media && (
              <div>
                <Label>Médias</Label>
                <div className="flex gap-4 text-sm">
                  {viewingEvent.media.photos &&
                    viewingEvent.media.photos.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        <span>{viewingEvent.media.photos.length} photo(s)</span>
                      </div>
                    )}
                  {viewingEvent.media.videos &&
                    viewingEvent.media.videos.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>{viewingEvent.media.videos.length} vidéo(s)</span>
                      </div>
                    )}
                  {viewingEvent.media.voiceNotes &&
                    viewingEvent.media.voiceNotes.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4" />
                        <span>
                          {viewingEvent.media.voiceNotes.length} note(s)
                          vocale(s)
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}

            {viewingEvent.signature && (
              <div>
                <Label>Signature numérique</Label>
                <div className="mt-2 border rounded-lg p-2 bg-white">
                  {viewingEvent.signature.startsWith("data:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={viewingEvent.signature}
                      alt="Signature"
                      className="max-h-24"
                    />
                  ) : (
                    <Image
                      src={viewingEvent.signature}
                      alt="Signature"
                      width={200}
                      height={96}
                      className="max-h-24 object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {viewingEvent.supervisorName && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <Label>Validation</Label>
                <p className="text-sm mt-1">
                  Validé par:{" "}
                  <span className="font-medium">
                    {viewingEvent.supervisorName}
                  </span>
                </p>
                {viewingEvent.supervisorComment && (
                  <p className="text-sm mt-1 text-muted-foreground">
                    {viewingEvent.supervisorComment}
                  </p>
                )}
                {viewingEvent.validatedAt && (
                  <p className="text-xs mt-1 text-muted-foreground">
                    Le{" "}
                    {new Date(viewingEvent.validatedAt).toLocaleString("fr-FR")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        type="form"
        title="Modifier l'événement"
        size="lg"
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
        {editingEvent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Site</Label>
                <Select
                  value={formData.site}
                  onValueChange={(value) => handleInputChange("site", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un site" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockSites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Zone</Label>
                <Input
                  value={formData.zone}
                  onChange={(e) => handleInputChange("zone", e.target.value)}
                  placeholder="Zone..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="observation">Observation</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="alert">Alerte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Gravité</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) =>
                    handleInputChange("severity", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critique</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Titre</Label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Titre de l'événement"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Description détaillée..."
                rows={4}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        type="warning"
        title="Supprimer l'événement"
        description="Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible."
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
        {deletingEvent && (
          <div className="space-y-2">
            <p className="text-sm">
              <strong>ID:</strong> {deletingEvent.id}
            </p>
            <p className="text-sm">
              <strong>Titre:</strong> {deletingEvent.title}
            </p>
            <p className="text-sm">
              <strong>Site:</strong> {deletingEvent.site}
            </p>
            <p className="text-sm">
              <strong>Date:</strong>{" "}
              {new Date(deletingEvent.timestamp).toLocaleString("fr-FR")}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
