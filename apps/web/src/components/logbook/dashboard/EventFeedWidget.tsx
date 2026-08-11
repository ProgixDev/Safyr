"use client";

import { useState } from "react";
import { useEvenementsMainCourante } from "./evenements-reels";
import Link from "next/link";
import { MapPin, Camera, Video, Mic } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Modal } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import {
  mockSites,
  mockAgents,
  type LogbookEvent,
} from "@/data/logbook-events";
import {
  getSeverityBadgeVariant,
  getStatusBadgeVariant,
  getSeverityDotColor,
  formatRelativeTime,
} from "@/lib/logbook-utils";
import { cn } from "@/lib/utils";

interface EventFeedWidgetProps {
  isLoading: boolean;
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critique",
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

const STATUS_LABELS: Record<string, string> = {
  resolved: "Resolu",
  in_progress: "En cours",
  pending: "En attente",
  deferred: "Differe",
};

const SEVERITY_FILTERS = [
  { value: "all", label: "Tous" },
  { value: "critical", label: "Critique" },
  { value: "high", label: "Haute" },
  { value: "medium", label: "Moyenne" },
  { value: "low", label: "Basse" },
];

export function EventFeedWidget({ isLoading }: EventFeedWidgetProps) {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [viewingEvent, setViewingEvent] = useState<LogbookEvent | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const evenements = useEvenementsMainCourante();

  const sortedEvents = [...evenements]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 10);

  const filteredEvents =
    severityFilter === "all"
      ? sortedEvents
      : sortedEvents.filter((e) => e.severity === severityFilter);

  const handleEventClick = (event: LogbookEvent) => {
    setViewingEvent(event);
    setIsViewModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card border-border/40 h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-light text-muted-foreground">
              Fil d&apos;evenements
            </CardTitle>
            <Link
              href="/dashboard/logbook/events"
              className="text-xs text-primary hover:underline shrink-0"
            >
              Voir tout
            </Link>
          </div>
          {/* Severity filter toggles */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SEVERITY_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setSeverityFilter(f.value)}
                className="focus:outline-none"
              >
                <Badge
                  variant={severityFilter === f.value ? "cyan" : "muted"}
                  className="cursor-pointer text-[10px] px-2 py-0.5"
                >
                  {f.label}
                </Badge>
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[420px] pr-2">
            <div className="relative pl-5">
              {/* Vertical line */}
              <div className="absolute left-[9px] top-0 bottom-0 w-px bg-border/40" />
              <div className="space-y-1">
                {filteredEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Aucun evenement pour ce filtre
                  </p>
                )}
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="relative flex items-start gap-3 pb-1 cursor-pointer hover:bg-muted/20 rounded-lg px-2 py-2 transition-colors"
                    onClick={() => handleEventClick(event)}
                  >
                    {/* Colored dot */}
                    <div
                      className={cn(
                        "absolute -left-5 top-3 h-3 w-3 rounded-full border-2 border-background z-10",
                        getSeverityDotColor(event.severity),
                      )}
                    />
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getSeverityBadgeVariant(event.severity)}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {SEVERITY_LABELS[event.severity] ?? event.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate mt-0.5">
                        {event.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.site} &middot; {event.agentName}
                      </p>
                    </div>
                    <Badge
                      variant={getStatusBadgeVariant(event.status)}
                      className="shrink-0 text-[10px] px-1.5 py-0 mt-1"
                    >
                      {STATUS_LABELS[event.status] ?? event.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Event Detail Modal */}
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
                <Label>Date / Heure</Label>
                <p className="text-sm">
                  {new Date(viewingEvent.timestamp).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Site</Label>
                <p className="text-sm">
                  {mockSites.find((s) => s.id === viewingEvent.siteId)?.name ??
                    "N/A"}
                </p>
              </div>
              <div>
                <Label>Zone</Label>
                <p className="text-sm">{viewingEvent.zone ?? "-"}</p>
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
                <Label>Gravite</Label>
                <Badge variant={getSeverityBadgeVariant(viewingEvent.severity)}>
                  {SEVERITY_LABELS[viewingEvent.severity] ??
                    viewingEvent.severity}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Statut</Label>
                <Badge variant={getStatusBadgeVariant(viewingEvent.status)}>
                  {STATUS_LABELS[viewingEvent.status] ?? viewingEvent.status}
                </Badge>
              </div>
              <div>
                <Label>Agent</Label>
                <p className="text-sm">
                  {mockAgents.find((a) => a.id === viewingEvent.agentId)
                    ?.name ?? "N/A"}
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
                <Label>Medias</Label>
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
                        <span>{viewingEvent.media.videos.length} video(s)</span>
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
          </div>
        )}
      </Modal>
    </>
  );
}
