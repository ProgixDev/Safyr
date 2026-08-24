"use client";

import {
  Info,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Square,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GeoZone } from "@/data/geolocation-zones";
import {
  computeZoneArea,
  computeZonePerimeter,
  formatArea,
  formatPerimeter,
  ZONE_TYPE_BADGE,
} from "@/data/geolocation-zones";
import { cn } from "@/lib/utils";

interface ZoneListSidebarProps {
  zones: GeoZone[];
  selectedZoneId: string | null;
  onZoneSelect: (zone: GeoZone) => void;
  onZoneEdit: (zone: GeoZone) => void;
  onZoneDelete: (zone: GeoZone) => void;
  onZoneDetails: (zone: GeoZone) => void;
  onCreateZone: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
}

function getActiveAlertCount(zone: GeoZone): number {
  const { alerts } = zone;
  return [alerts.entry, alerts.exit, alerts.absence, alerts.parking].filter(
    Boolean,
  ).length;
}

function getShapeLabel(zone: GeoZone): string {
  return zone.shape.kind === "circle" ? "Cercle" : "Polygone";
}

export function ZoneListSidebar({
  zones,
  selectedZoneId,
  onZoneSelect,
  onZoneEdit,
  onZoneDelete,
  onZoneDetails,
  onCreateZone,
  search,
  onSearchChange,
  className,
}: ZoneListSidebarProps) {
  return (
    <div
      className={cn("flex flex-col h-full", className)}
      role="region"
      aria-label="Liste des zones"
    >
      {/* Header */}
      <div className="p-3 border-b border-border/50 space-y-2">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher une zone…"
            aria-label="Rechercher une zone"
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={onCreateZone}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nouvelle zone
        </Button>
      </div>

      {/* Zone list */}
      <ScrollArea className="flex-1">
        <ul className="p-2 space-y-1 list-none">
          {zones.length === 0 ? (
            <li className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Square className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Aucune zone trouvée
              </p>
            </li>
          ) : (
            zones.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              const activeAlerts = getActiveAlertCount(zone);
              return (
                <li key={zone.id}>
                  <div
                    className={cn(
                      "group relative flex items-center gap-0 rounded-lg border transition-all duration-150 overflow-hidden",
                      isSelected
                        ? "border-cyan-500/40 bg-cyan-500/5"
                        : "border-border/60 hover:border-border hover:bg-muted/30",
                    )}
                  >
                    {/* Left color bar */}
                    <div
                      className={cn(
                        "absolute left-0 inset-y-0 w-[2px] rounded-r-full",
                        isSelected ? "bg-cyan-500" : "",
                      )}
                      style={
                        !isSelected
                          ? { backgroundColor: zone.color }
                          : undefined
                      }
                      aria-hidden="true"
                    />

                    {/* Clickable body */}
                    <button
                      onClick={() => onZoneSelect(zone)}
                      className="flex-1 flex items-start gap-2.5 p-2.5 pl-3.5 text-left min-w-0 cursor-pointer"
                      aria-label={`Sélectionner la zone ${zone.name}`}
                      aria-current={isSelected ? "true" : undefined}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="text-xs font-semibold leading-none truncate">
                            {zone.name}
                          </p>
                          <Badge
                            variant={ZONE_TYPE_BADGE[zone.type]}
                            className="shrink-0 text-[10px] px-1.5 py-0"
                          >
                            {zone.type}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {zone.site}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">
                            {getShapeLabel(zone)}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">
                            ·
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatArea(computeZoneArea(zone.shape))}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">
                            ·
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatPerimeter(computeZonePerimeter(zone.shape))}
                          </span>
                          {activeAlerts > 0 && (
                            <>
                              <span className="text-[10px] text-muted-foreground/60">
                                ·
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {activeAlerts}{" "}
                                {activeAlerts === 1 ? "alerte" : "alertes"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Actions dropdown */}
                    <div className="pr-2 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="h-8 w-8 flex items-center justify-center rounded opacity-40 hover:opacity-100 focus:opacity-100 hover:bg-accent transition-all"
                            aria-label={`Actions pour ${zone.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-36">
                          <DropdownMenuItem onClick={() => onZoneDetails(zone)}>
                            <Info className="h-3.5 w-3.5 mr-2 shrink-0" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onZoneEdit(zone)}>
                            <Pencil className="h-3.5 w-3.5 mr-2 shrink-0" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onZoneSelect(zone)}>
                            <MapPin className="h-3.5 w-3.5 mr-2 shrink-0" />
                            Localiser
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive"
                            className="text-destructive"
                            onClick={() => onZoneDelete(zone)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2 shrink-0" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
