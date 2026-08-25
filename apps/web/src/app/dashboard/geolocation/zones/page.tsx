"use client";

import { useState, useMemo } from "react";
import { PanelRight, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ZoneMap } from "@/components/geolocation/ZoneMap";
import { ZoneListSidebar } from "@/components/geolocation/ZoneListSidebar";
import { ZoneFormPanel } from "@/components/geolocation/ZoneFormModal";
import { ZonePreviewMap } from "@/components/geolocation/ZonePreviewMap";
import { useListePersistante } from "@/hooks/fiscal/use-liste-persistante";
import {
  GeoZone,
  ZoneShape,
  ZONE_TYPES,
  ZONE_TYPE_COLORS,
  ZONE_TYPE_BADGE,
  ALERT_LABELS,
  computeZoneArea,
  computeZonePerimeter,
  formatArea,
  formatPerimeter,
  mockGeolocationZones,
} from "@/data/geolocation-zones";

// ── Sidebar view type ──────────────────────────────────────────

type SidebarView = "list" | "detail" | "form";

// ── Shape description helper ───────────────────────────────────

function describeShape(shape: GeoZone["shape"]): string {
  if (shape.kind === "circle") {
    return `Cercle (rayon: ${Math.round(shape.radius)}m)`;
  }
  return `Polygone (${shape.vertices.length} sommets)`;
}

// ── Page component ─────────────────────────────────────────────

export default function ZonesPage() {
  // Enregistré en base : la liste ne vivait que dans le navigateur.
  const [zones, setZones] = useListePersistante<GeoZone>("zone_geo");
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [editingZone, setEditingZone] = useState<GeoZone | null>(null);
  const [drawingMode, setDrawingMode] = useState<"none" | "circle" | "polygon">(
    "none",
  );
  const [pendingShape, setPendingShape] = useState<ZoneShape | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GeoZone | null>(null);
  const [detailZone, setDetailZone] = useState<GeoZone | null>(null);

  // UI state
  const [showNav, setShowNav] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarView, setSidebarView] = useState<SidebarView>("list");

  // ── Filtering ──────────────────────────────────────────────────

  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      if (typeFilter !== "all" && z.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !z.name.toLowerCase().includes(q) &&
          !z.site.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [zones, typeFilter, search]);

  const typeCounts = useMemo(() => {
    return zones.reduce(
      (acc, z) => ({ ...acc, [z.type]: (acc[z.type] || 0) + 1 }),
      {} as Record<string, number>,
    );
  }, [zones]);

  // ── Drawing flow ───────────────────────────────────────────────

  const handleStartDrawing = (mode: "circle" | "polygon") => {
    setShowSidebar(false);
    setShowNav(false);
    setDrawingMode(mode);
  };

  const handleDrawComplete = (shape: ZoneShape) => {
    setPendingShape(shape);
    setDrawingMode("none");
    setShowSidebar(true);
    setSidebarView("form");
  };

  const handleDrawCancel = () => {
    setDrawingMode("none");
    setShowSidebar(true);
    setSidebarView("form");
  };

  // ── CRUD ───────────────────────────────────────────────────────

  const handleCreateZone = () => {
    setEditingZone(null);
    setPendingShape(null);
    setSidebarView("form");
    setShowSidebar(true);
  };

  const handleEditZone = (zone: GeoZone) => {
    setEditingZone(zone);
    setPendingShape(zone.shape);
    setSidebarView("form");
    setShowSidebar(true);
  };

  const handleZoneDetails = (zone: GeoZone) => {
    setDetailZone(zone);
    setSidebarView("detail");
    setShowSidebar(true);
  };

  const handleSave = (data: Omit<GeoZone, "id" | "createdAt">) => {
    if (editingZone) {
      setZones((prev) =>
        prev.map((z) => (z.id === editingZone.id ? { ...z, ...data } : z)),
      );
    } else {
      setZones((prev) => [
        ...prev,
        {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setEditingZone(null);
    setPendingShape(null);
    setSidebarView("list");
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setZones((prev) => prev.filter((z) => z.id !== deleteTarget.id));
    if (selectedZoneId === deleteTarget.id) setSelectedZoneId(null);
    if (detailZone?.id === deleteTarget.id) {
      setDetailZone(null);
      setSidebarView("list");
    }
    setDeleteTarget(null);
  };

  const handleZoneClick = (zone: GeoZone) => {
    setSelectedZoneId(zone.id);
  };

  const handleFormCancel = () => {
    setSidebarView("list");
    setEditingZone(null);
    setPendingShape(null);
  };

  // ── Sidebar content renderer (shared between desktop and mobile) ──

  const renderSidebarContent = () => {
    // ── Detail view ──
    if (sidebarView === "detail" && detailZone) {
      return (
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <h2 className="text-sm font-bold">{detailZone.name}</h2>
            <div className="flex items-center gap-2">
              <Badge variant={ZONE_TYPE_BADGE[detailZone.type]}>
                {detailZone.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {detailZone.site}
              </span>
            </div>

            {/* Stats: area, perimeter, shape */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Superficie
                </div>
                <div className="text-xs font-semibold">
                  {formatArea(computeZoneArea(detailZone.shape))}
                </div>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Périmètre
                </div>
                <div className="text-xs font-semibold">
                  {formatPerimeter(computeZonePerimeter(detailZone.shape))}
                </div>
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Forme
                </div>
                <div className="text-xs font-semibold">
                  {describeShape(detailZone.shape)}
                </div>
              </div>
            </div>

            {/* Mini-map preview */}
            <ZonePreviewMap
              shape={detailZone.shape}
              color={detailZone.color}
              height={160}
            />

            {/* Alert rules */}
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Règles d&apos;alerte
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ALERT_LABELS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        detailZone.alerts[key]
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/40",
                      )}
                    />
                    <span className="text-xs">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Created date */}
            <div className="text-[10px] text-muted-foreground">
              Créée le{" "}
              {new Date(detailZone.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Sticky action buttons */}
          <div className="shrink-0 p-3 border-t border-border/50 flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                setEditingZone(detailZone);
                setPendingShape(detailZone.shape);
                setSidebarView("form");
              }}
            >
              Modifier
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => setDeleteTarget(detailZone)}
            >
              Supprimer
            </Button>
          </div>
        </div>
      );
    }

    // ── Form view ──
    if (sidebarView === "form") {
      return (
        <ZoneFormPanel
          zone={editingZone}
          pendingShape={pendingShape}
          onSave={(data) => handleSave(data)}
          onCancel={handleFormCancel}
          onStartDrawing={handleStartDrawing}
        />
      );
    }

    // ── List view (default) ──
    return (
      <ZoneListSidebar
        zones={filteredZones}
        selectedZoneId={selectedZoneId}
        onZoneSelect={handleZoneClick}
        onZoneEdit={handleEditZone}
        onZoneDelete={setDeleteTarget}
        onZoneDetails={handleZoneDetails}
        onCreateZone={handleCreateZone}
        search={search}
        onSearchChange={setSearch}
      />
    );
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="relative h-full">
      {/* Full-page map */}
      <ZoneMap
        zones={filteredZones}
        selectedZoneId={selectedZoneId}
        onZoneClick={handleZoneClick}
        drawingMode={drawingMode}
        onDrawComplete={handleDrawComplete}
        onDrawCancel={handleDrawCancel}
        className="absolute inset-0"
      />

      {/* ── Nav overlay (merged header + toolbar) ────────────────── */}
      {showNav && drawingMode === "none" && (
        <div className="absolute top-3 left-3 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl shadow-lg overflow-hidden">
          {/* Header row */}
          <div className="flex items-center justify-between px-4 py-2.5">
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Zone Géolocalisée
              </h1>
              <p className="text-xs text-muted-foreground">
                {filteredZones.length} zone
                {filteredZones.length > 1 ? "s" : ""} configurée
                {filteredZones.length > 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setShowNav(false)}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
              aria-label="Masquer les filtres"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Filter pills row */}
          <div
            className="px-3 pb-2.5 flex items-center gap-1 flex-wrap"
            role="toolbar"
            aria-label="Filtres"
          >
            <div
              className="flex gap-1"
              role="group"
              aria-label="Filtrer par type"
            >
              <button
                onClick={() => setTypeFilter("all")}
                aria-pressed={typeFilter === "all"}
                className={cn(
                  "h-8 px-3 text-xs rounded-md border transition-colors",
                  typeFilter === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input text-muted-foreground hover:bg-accent",
                )}
              >
                Tous{" "}
                <span
                  className="ml-1 opacity-60 tabular-nums"
                  aria-hidden="true"
                >
                  {zones.length}
                </span>
              </button>
              {ZONE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  aria-pressed={typeFilter === type}
                  className={cn(
                    "h-8 px-3 text-xs rounded-md border transition-colors flex items-center gap-1.5",
                    typeFilter === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input text-muted-foreground hover:bg-accent",
                  )}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: ZONE_TYPE_COLORS[type] }}
                    aria-hidden="true"
                  />
                  {type}
                  <span className="opacity-60 tabular-nums" aria-hidden="true">
                    {typeCounts[type] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nav toggle (when nav is hidden) */}
      {!showNav && drawingMode === "none" && (
        <button
          onClick={() => setShowNav(true)}
          className="absolute top-3 left-3 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl p-2.5 shadow-lg"
          aria-label="Afficher les filtres"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      )}

      {/* ── Desktop sidebar (right side) ──────────────────────── */}
      {showSidebar && drawingMode === "none" && (
        <div className="hidden lg:flex absolute top-3 right-3 bottom-3 z-10 w-96 flex-col bg-background/80 backdrop-blur-md border border-border/50 rounded-xl shadow-lg overflow-hidden">
          {/* Sidebar header with dismiss */}
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1 shrink-0">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {sidebarView === "list"
                ? "Zones"
                : sidebarView === "detail"
                  ? "Détails"
                  : "Formulaire"}
            </span>
            <button
              onClick={() => setShowSidebar(false)}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
              aria-label="Masquer le panneau"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {renderSidebarContent()}
        </div>
      )}

      {/* Sidebar toggle (desktop, when sidebar is hidden) */}
      {!showSidebar && drawingMode === "none" && (
        <button
          onClick={() => setShowSidebar(true)}
          className="hidden lg:flex absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl p-2.5 shadow-lg"
          aria-label="Afficher le panneau"
        >
          <PanelRight className="h-4 w-4" />
        </button>
      )}

      {/* ── Mobile sidebar (Sheet) ────────────────────────────── */}
      {drawingMode === "none" && (
        <Sheet>
          <SheetTrigger asChild>
            <button className="lg:hidden absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl p-2.5 shadow-lg">
              <PanelRight className="h-4 w-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-96 p-0">
            {renderSidebarContent()}
          </SheetContent>
        </Sheet>
      )}

      {/* ── Delete confirmation modal ─────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        type="warning"
        title="Supprimer la zone"
        description={`Voulez-vous vraiment supprimer la zone "${deleteTarget?.name}" ? Cette action est irréversible.`}
        actions={{
          primary: {
            label: "Supprimer",
            onClick: handleDelete,
            variant: "destructive",
          },
          secondary: {
            label: "Annuler",
            onClick: () => setDeleteTarget(null),
          },
        }}
      >
        <div />
      </Modal>
    </div>
  );
}
