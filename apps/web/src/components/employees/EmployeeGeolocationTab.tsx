"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Map, { Source, Layer, Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Modal } from "@/components/ui/modal";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import {
  CheckCircle,
  Clock,
  Route,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Calendar,
  Building,
  Footprints,
  ShieldAlert,
  User,
  Timer,
} from "lucide-react";
import type { Employee } from "@/lib/types";
import {
  getEmployeeGeolocationSummary,
  HSE_TYPE_CONFIG,
  HSE_STATUS_CONFIG,
  type PresenceHistoryEntry,
  type HSEIncident,
  type PatrolSummary,
} from "@/data/hr-geolocation";

interface EmployeeGeolocationTabProps {
  employee: Employee;
}

const PRESENCE_STATUS_CONFIG: Record<
  PresenceHistoryEntry["status"],
  { label: string; className: string }
> = {
  present: {
    label: "Présent",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  late: {
    label: "Retard",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  absent: {
    label: "Absent",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  "off-zone": {
    label: "Hors zone",
    className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
};

const PATROL_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  terminee: {
    label: "Terminée",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  incomplete: {
    label: "Incomplète",
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  "en-cours": {
    label: "En cours",
    className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
  planifiee: {
    label: "Planifiée",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
};

const clickableRowClassName = () => "cursor-pointer hover:bg-muted/50";

const presenceColumns: ColumnDef<PresenceHistoryEntry>[] = [
  {
    key: "date",
    label: "Date",
    sortable: true,
    render: (item) =>
      new Date(item.date).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
  },
  { key: "sitePrev", label: "Site prévu" },
  {
    key: "shift",
    label: "Horaire",
    render: (item) => `${item.shiftStart} — ${item.shiftEnd}`,
  },
  {
    key: "arrival",
    label: "Arrivée",
    render: (item) => item.arrival ?? "—",
  },
  {
    key: "departure",
    label: "Départ",
    render: (item) => item.departure ?? "—",
  },
  {
    key: "patrols",
    label: "Rondes",
    render: (item) => {
      const completed = item.patrols.filter(
        (p) => p.status === "terminee",
      ).length;
      return (
        <span className="text-sm">
          {completed}/{item.patrols.length}
        </span>
      );
    },
  },
  {
    key: "status",
    label: "Statut",
    sortable: true,
    render: (item) => {
      const config = PRESENCE_STATUS_CONFIG[item.status];
      return (
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      );
    },
  },
];

const hseColumns: ColumnDef<HSEIncident>[] = [
  {
    key: "date",
    label: "Date",
    sortable: true,
    render: (item) =>
      new Date(item.date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
  },
  {
    key: "type",
    label: "Type",
    render: (item) => {
      const config = HSE_TYPE_CONFIG[item.type];
      return (
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      );
    },
  },
  { key: "site", label: "Site" },
  {
    key: "status",
    label: "Statut",
    render: (item) => {
      const config = HSE_STATUS_CONFIG[item.status];
      return (
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      );
    },
  },
  { key: "description", label: "Description" },
];

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

function PatrolRow({ patrol }: { patrol: PatrolSummary }) {
  const config = PATROL_STATUS_CONFIG[patrol.status];
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <Route className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{patrol.routeName}</p>
          <p className="text-xs text-muted-foreground">
            {patrol.checkpointsScanned}/{patrol.checkpointsTotal} checkpoints
            {patrol.durationMinutes != null &&
              ` · ${patrol.durationMinutes} min`}
            {patrol.distanceMeters != null &&
              ` · ${(patrol.distanceMeters / 1000).toFixed(1)} km`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">
          {patrol.completionRate}%
        </span>
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      </div>
    </div>
  );
}

function PresenceDetailModal({
  entry,
  open,
  onOpenChange,
}: {
  entry: PresenceHistoryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!entry) return null;
  const statusConfig = PRESENCE_STATUS_CONFIG[entry.status];
  const completedPatrols = entry.patrols.filter(
    (p) => p.status === "terminee",
  ).length;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      type="details"
      title={`Détail présence — ${new Date(entry.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`}
      size="lg"
      icon={<Calendar className="h-5 w-5 text-primary" />}
      actions={{
        secondary: {
          label: "Fermer",
          onClick: () => onOpenChange(false),
        },
      }}
    >
      <div className="space-y-5">
        {/* Status + Summary */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={statusConfig?.className}>
            {statusConfig?.label}
          </Badge>
          {entry.anomalies.length > 0 && (
            <span className="text-xs text-amber-400">
              {entry.anomalies.join(" · ")}
            </span>
          )}
        </div>

        {/* Shift details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DetailRow icon={Building} label="Site">
            {entry.sitePrev}
          </DetailRow>
          <DetailRow icon={Clock} label="Horaire prévu">
            {entry.shiftStart} — {entry.shiftEnd}
          </DetailRow>
          <DetailRow icon={Clock} label="Arrivée / Départ">
            {entry.arrival ?? "—"} / {entry.departure ?? "—"}
          </DetailRow>
          <DetailRow icon={Footprints} label="Distance parcourue">
            {entry.kmTraveled} km
          </DetailRow>
        </div>

        <Separator />

        {/* Patrols */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Route className="h-4 w-4" />
            Rondes ({completedPatrols}/{entry.patrols.length})
          </h4>
          {entry.patrols.length > 0 ? (
            <div className="divide-y divide-border rounded-lg border">
              {entry.patrols.map((patrol, i) => (
                <div key={i} className="px-3">
                  <PatrolRow patrol={patrol} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-3">
              Aucune ronde effectuée ce jour.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function HSEDetailModal({
  incident,
  open,
  onOpenChange,
}: {
  incident: HSEIncident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!incident) return null;

  const statusConfig = HSE_STATUS_CONFIG[incident.status];
  const typeConfig = HSE_TYPE_CONFIG[incident.type];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      type="details"
      title={`Incident HSE — ${incident.type}`}
      size="lg"
      icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
      actions={{
        secondary: {
          label: "Fermer",
          onClick: () => onOpenChange(false),
        },
      }}
    >
      <div className="space-y-5">
        {/* Status badges */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={typeConfig?.className}>
            {typeConfig?.label}
          </Badge>
          <Badge variant="outline" className={statusConfig?.className}>
            {statusConfig?.label}
          </Badge>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4">
          <DetailRow icon={Calendar} label="Date et heure">
            {new Date(incident.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </DetailRow>
          <DetailRow icon={Building} label="Site">
            {incident.site}
          </DetailRow>
          <DetailRow icon={MapPin} label="Coordonnées GPS">
            {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
          </DetailRow>
          {incident.durationMinutes != null && (
            <DetailRow icon={Timer} label="Durée de l'incident">
              {incident.durationMinutes} min
            </DetailRow>
          )}
        </div>

        <Separator />

        {/* Description */}
        <div>
          <h4 className="text-sm font-semibold mb-1">Description</h4>
          <p className="text-sm text-muted-foreground">
            {incident.description}
          </p>
        </div>

        {/* Response timeline */}
        <div>
          <h4 className="text-sm font-semibold mb-2">
            Chronologie de la réponse
          </h4>
          <div className="relative space-y-3 pl-4 border-l-2 border-border ml-1">
            <div className="flex items-start gap-3 relative">
              <div className="absolute -left-[calc(0.25rem+1px)] w-2 h-2 rounded-full bg-red-500 mt-1.5" />
              <div>
                <p className="text-sm font-medium">Déclenchement</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(incident.date).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
            {incident.acknowledgedAt && (
              <div className="flex items-start gap-3 relative">
                <div className="absolute -left-[calc(0.25rem+1px)] w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    Acquittement
                    {incident.acknowledgedBy && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {incident.acknowledgedBy}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(incident.acknowledgedAt).toLocaleTimeString(
                      "fr-FR",
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </p>
                </div>
              </div>
            )}
            {incident.resolvedAt && (
              <div className="flex items-start gap-3 relative">
                <div className="absolute -left-[calc(0.25rem+1px)] w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                <div>
                  <p className="text-sm font-medium">Résolution</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(incident.resolvedAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {incident.resolution && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {incident.resolution}
                    </p>
                  )}
                </div>
              </div>
            )}
            {!incident.acknowledgedAt && !incident.resolvedAt && (
              <div className="flex items-start gap-3 relative">
                <div className="absolute -left-[calc(0.25rem+1px)] w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                <p className="text-sm text-amber-400">
                  En attente de prise en charge
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function EmployeeGeolocationTab({
  employee,
}: EmployeeGeolocationTabProps) {
  const [selectedPresence, setSelectedPresence] =
    useState<PresenceHistoryEntry | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<HSEIncident | null>(
    null,
  );
  const summary = getEmployeeGeolocationSummary(employee.id);

  const trailGeoJson = useMemo(() => {
    if (!summary) return null;
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: summary.recentPositions.map((p) => [p.lng, p.lat]),
          },
        },
      ],
    };
  }, [summary]);

  const mapCenter = useMemo(() => {
    if (!summary || summary.recentPositions.length === 0) return null;
    const positions = summary.recentPositions;
    const avgLat = positions.reduce((s, p) => s + p.lat, 0) / positions.length;
    const avgLng = positions.reduce((s, p) => s + p.lng, 0) / positions.length;
    return { latitude: avgLat, longitude: avgLng };
  }, [summary]);

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Aucune donnée de géolocalisation disponible pour cet employé.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-xl font-semibold">Synthèse Géolocalisation</h2>

      {/* Stats */}
      <InfoCardContainer>
        <InfoCard
          icon={CheckCircle}
          title="Taux de présence"
          value={`${summary.presenceRate}%`}
          color="green"
        />
        <InfoCard
          icon={Clock}
          title="Retards"
          value={summary.tardinessCount}
          subtext={`Arrivée moy. ${summary.avgArrivalTime}`}
          color="amber"
        />
        <InfoCard
          icon={Route}
          title="Rondes complétées"
          value={`${summary.patrolsCompleted}/${summary.patrolsTotal}`}
          subtext={`${summary.patrolCompletionRate}% de complétion`}
          color="blue"
        />
        <InfoCard
          icon={AlertTriangle}
          title="Alertes SOS"
          value={summary.sosCount}
          subtext={`${summary.totalKmTraveled} km parcourus`}
          color="red"
        />
      </InfoCardContainer>

      {/* Mini Map */}
      {mapCenter && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Positions récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="h-[300px] rounded-lg overflow-hidden"
              role="img"
              aria-label={`Carte des ${summary.recentPositions.length} dernières positions de l'agent`}
            >
              <Map
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                initialViewState={{
                  ...mapCenter,
                  zoom: 14,
                }}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
              >
                {trailGeoJson && (
                  <Source
                    id="employee-trail"
                    type="geojson"
                    data={trailGeoJson}
                  >
                    <Layer
                      id="employee-trail-line"
                      type="line"
                      paint={{
                        "line-color": "#357AB7",
                        "line-width": 2,
                        "line-opacity": 0.7,
                      }}
                    />
                  </Source>
                )}
                {summary.recentPositions.map((pos, i) => (
                  <Marker
                    key={i}
                    longitude={pos.lng}
                    latitude={pos.lat}
                    anchor="center"
                  >
                    <div
                      className={`rounded-full border-2 border-white/50 ${
                        i === summary.recentPositions.length - 1
                          ? "w-3.5 h-3.5 bg-cyan-400"
                          : "w-2.5 h-2.5 bg-cyan-400/60"
                      }`}
                    />
                  </Marker>
                ))}
              </Map>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Presence History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique présence</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={summary.presenceHistory}
            columns={presenceColumns}
            itemsPerPage={7}
            onRowClick={(entry) => setSelectedPresence(entry)}
            rowClassName={clickableRowClassName}
          />
        </CardContent>
      </Card>

      {/* HSE Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incidents HSE</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.hseIncidents.length > 0 ? (
            <DataTable
              data={summary.hseIncidents}
              columns={hseColumns}
              itemsPerPage={5}
              onRowClick={(incident) => setSelectedIncident(incident)}
              rowClassName={clickableRowClassName}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun incident HSE enregistré.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Link to live tracking */}
      <div className="flex justify-end">
        <Button asChild>
          <Link href={`/dashboard/geolocation/live?agent=${employee.id}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Voir sur la carte en direct
          </Link>
        </Button>
      </div>

      {/* Detail Modals */}
      <PresenceDetailModal
        entry={selectedPresence}
        open={selectedPresence !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPresence(null);
        }}
      />
      <HSEDetailModal
        incident={selectedIncident}
        open={selectedIncident !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedIncident(null);
        }}
      />
    </div>
  );
}
