"use client";

import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Clock,
  Info,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Route,
  Search,
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
import type { PatrolRoute, PatrolFrequency } from "@/data/geolocation-patrols";
import {
  CHECKPOINT_TYPE_CONFIG,
  PATROL_FREQUENCIES,
} from "@/data/geolocation-patrols";
import { cn } from "@/lib/utils";

// ── Props ───────────────────────────────────────────────────────────

interface PatrolRouteSidebarProps {
  routes: PatrolRoute[];
  selectedRouteId: string | null;
  onSelectRoute: (id: string) => void;
  onCreateRoute: () => void;
  onEditRoute: (route: PatrolRoute) => void;
  onDeleteRoute: (route: PatrolRoute) => void;
  onViewDetail: (route: PatrolRoute) => void;
  sidebarView: "list" | "detail" | "form";
  onBackToList: () => void;
}

// ── Frequency badge variant mapping ─────────────────────────────────

const FREQUENCY_BADGE: Record<
  PatrolFrequency,
  "cyan" | "success" | "warning" | "info"
> = {
  Quotidienne: "cyan",
  "Bi-quotidienne": "info",
  Nocturne: "warning",
  Hebdomadaire: "success",
};

// ── Component ───────────────────────────────────────────────────────

export function PatrolRouteSidebar({
  routes,
  selectedRouteId,
  onSelectRoute,
  onCreateRoute,
  onEditRoute,
  onDeleteRoute,
  onViewDetail,
  sidebarView,
  onBackToList,
}: PatrolRouteSidebarProps) {
  const [search, setSearch] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");

  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      if (frequencyFilter !== "all" && r.frequency !== frequencyFilter)
        return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.site.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [routes, frequencyFilter, search]);

  // ── Detail view ──────────────────────────────────────────────────

  if (sidebarView === "detail" && selectedRoute) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Back button */}
          <button
            onClick={onBackToList}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </button>

          {/* Route name + site */}
          <div>
            <h2 className="text-sm font-bold">{selectedRoute.name}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">
              {selectedRoute.site}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Points
              </div>
              <div className="text-xs font-semibold">
                {selectedRoute.checkpoints.length}
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Durée
              </div>
              <div className="text-xs font-semibold">
                {selectedRoute.estimatedDurationMinutes} min
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Distance
              </div>
              <div className="text-xs font-semibold">
                {selectedRoute.distanceMeters >= 1000
                  ? `${(selectedRoute.distanceMeters / 1000).toFixed(1)} km`
                  : `${selectedRoute.distanceMeters} m`}
              </div>
            </div>
          </div>

          {/* Checkpoint list */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
              Points de contrôle
            </div>
            <div className="space-y-1.5">
              {selectedRoute.checkpoints
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((cp) => {
                  const typeConfig = CHECKPOINT_TYPE_CONFIG[cp.type];
                  return (
                    <div
                      key={cp.id}
                      className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/20 p-2"
                    >
                      <span
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: typeConfig.color }}
                      >
                        {cp.order}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {cp.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="muted"
                            className="text-[9px] px-1.5 py-0"
                            style={{
                              borderColor: `${typeConfig.color}40`,
                              color: typeConfig.color,
                            }}
                          >
                            {typeConfig.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {cp.expectedMinutes} min (&plusmn;
                            {cp.toleranceMinutes})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Sticky action buttons */}
        <div className="shrink-0 p-3 border-t border-border/50 flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onEditRoute(selectedRoute)}
          >
            Modifier
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="flex-1"
            onClick={() => onDeleteRoute(selectedRoute)}
          >
            Supprimer
          </Button>
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-full"
      role="region"
      aria-label="Liste des rondes"
    >
      {/* Create CTA */}
      <div className="p-3 border-b border-border/50">
        <Button
          size="sm"
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium"
          onClick={onCreateRoute}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nouvelle Ronde
        </Button>
      </div>

      {/* Header */}
      <div className="p-3 border-b border-border/50 space-y-2">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une ronde…"
            aria-label="Rechercher une ronde"
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Frequency filter pills */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFrequencyFilter("all")}
            aria-pressed={frequencyFilter === "all"}
            className={cn(
              "h-7 px-2.5 text-[10px] rounded-md border transition-colors",
              frequencyFilter === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input text-muted-foreground hover:bg-accent",
            )}
          >
            Toutes
          </button>
          {PATROL_FREQUENCIES.map((freq) => (
            <button
              key={freq}
              onClick={() => setFrequencyFilter(freq)}
              aria-pressed={frequencyFilter === freq}
              className={cn(
                "h-7 px-2.5 text-[10px] rounded-md border transition-colors",
                frequencyFilter === freq
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input text-muted-foreground hover:bg-accent",
              )}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      {/* Route list */}
      <ScrollArea className="flex-1">
        <ul className="p-2 space-y-1 list-none">
          {filteredRoutes.length === 0 ? (
            <li className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Route className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Aucune ronde trouvée
              </p>
            </li>
          ) : (
            filteredRoutes.map((route) => {
              const isSelected = selectedRouteId === route.id;
              return (
                <li key={route.id}>
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
                        isSelected ? "bg-cyan-500" : "bg-slate-600",
                      )}
                      aria-hidden="true"
                    />

                    {/* Clickable body */}
                    <button
                      onClick={() => onSelectRoute(route.id)}
                      className="flex-1 flex items-start gap-2.5 p-2.5 pl-3.5 text-left min-w-0 cursor-pointer"
                      aria-label={`Sélectionner la ronde ${route.name}`}
                      aria-current={isSelected ? "true" : undefined}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="text-xs font-semibold leading-none truncate">
                            {route.name}
                          </p>
                          <Badge
                            variant={FREQUENCY_BADGE[route.frequency]}
                            className="shrink-0 text-[10px] px-1.5 py-0"
                          >
                            {route.frequency}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {route.site}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {route.checkpoints.length} points
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">
                            ·
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {route.estimatedDurationMinutes} min
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">
                            ·
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {route.distanceMeters >= 1000
                              ? `${(route.distanceMeters / 1000).toFixed(1)} km`
                              : `${route.distanceMeters} m`}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Actions dropdown */}
                    <div className="pr-2 shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="h-8 w-8 flex items-center justify-center rounded opacity-40 hover:opacity-100 focus:opacity-100 hover:bg-accent transition-all"
                            aria-label={`Actions pour ${route.name}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-36">
                          <DropdownMenuItem onClick={() => onViewDetail(route)}>
                            <Info className="h-3.5 w-3.5 mr-2 shrink-0" />
                            Détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditRoute(route)}>
                            <Pencil className="h-3.5 w-3.5 mr-2 shrink-0" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            className="text-destructive"
                            onClick={() => onDeleteRoute(route)}
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
