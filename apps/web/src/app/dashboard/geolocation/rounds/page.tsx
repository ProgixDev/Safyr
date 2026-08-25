"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { PanelRight, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PatrolMap,
  type PatrolMapHandle,
} from "@/components/geolocation/PatrolMap";
import { PatrolRouteSidebar } from "@/components/geolocation/PatrolRouteSidebar";
import { PatrolRouteFormPanel } from "@/components/geolocation/PatrolRouteFormPanel";
import { PatrolExecutionSidebar } from "@/components/geolocation/PatrolExecutionSidebar";
import { useListePersistante } from "@/hooks/fiscal/use-liste-persistante";
import type {
  PatrolRoute,
  PatrolExecution,
  PatrolCheckpoint,
} from "@/data/geolocation-patrols";
import {
  mockPatrolRoutes,
  mockPatrolExecutions,
  getRouteById,
} from "@/data/geolocation-patrols";
import {
  mockGeolocationZones,
  isPointInZone,
  getSiteBounds,
} from "@/data/geolocation-zones";

// ── Tab type ────────────────────────────────────────────────────────

type PatrolTab = "itineraires" | "en-cours";

// ── Page component ──────────────────────────────────────────────────

export default function RoundsPage() {
  // ── Data state ──────────────────────────────────────────────────
  // Enregistré en base : la liste ne vivait que dans le navigateur.
  const [routes, setRoutes] = useListePersistante<PatrolRoute>("ronde");
  const [executions] = useState<PatrolExecution[]>(mockPatrolExecutions);

  // ── Tab & selection state ───────────────────────────────────────
  const [activeTab, setActiveTab] = useState<PatrolTab>("itineraires");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(
    null,
  );
  const [sidebarView, setSidebarView] = useState<"list" | "detail" | "form">(
    "list",
  );

  // ── Form state ──────────────────────────────────────────────────
  const [editingRoute, setEditingRoute] = useState<PatrolRoute | null>(null);
  const [formSite, setFormSite] = useState("");
  const [formCheckpoints, setFormCheckpoints] = useState<PatrolCheckpoint[]>(
    [],
  );
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<
    string | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<PatrolRoute | null>(null);

  // ── Map handle (for imperative fitBoundsTo calls) ────────────────
  const patrolMapRef = useRef<PatrolMapHandle>(null);

  // ── UI state ────────────────────────────────────────────────────
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNav, setShowNav] = useState(true);
  const [showZones, setShowZones] = useState(false);

  // ── Derived data ────────────────────────────────────────────────

  const selectedRoute = useMemo(
    () =>
      selectedRouteId ? (getRouteById(routes, selectedRouteId) ?? null) : null,
    [routes, selectedRouteId],
  );

  const selectedExecution = useMemo(
    () =>
      selectedExecutionId
        ? (executions.find((e) => e.id === selectedExecutionId) ?? null)
        : null,
    [executions, selectedExecutionId],
  );

  const selectedExecutionRoute = useMemo(
    () =>
      selectedExecution
        ? (getRouteById(routes, selectedExecution.routeId) ?? null)
        : null,
    [selectedExecution, routes],
  );

  // ── Handlers ────────────────────────────────────────────────────

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as PatrolTab);
    setSidebarView("list");
    setSelectedRouteId(null);
    setSelectedExecutionId(null);
  }, []);

  const handleCreateRoute = useCallback(() => {
    setEditingRoute(null);
    setFormSite("");
    setFormCheckpoints([]);
    setSelectedCheckpointId(null);
    setSidebarView("form");
    setShowSidebar(true);
  }, []);

  const handleEditRoute = useCallback((route: PatrolRoute) => {
    setEditingRoute(route);
    setFormSite(route.site);
    setFormCheckpoints(route.checkpoints);
    setSelectedCheckpointId(null);
    setSidebarView("form");
    setShowSidebar(true);
    // Fly to site bounds after state settles
    const bounds = getSiteBounds(mockGeolocationZones, route.site);
    if (bounds) {
      setTimeout(() => patrolMapRef.current?.fitBoundsTo(bounds), 150);
    }
  }, []);

  const handleViewRouteDetail = useCallback((route: PatrolRoute) => {
    setSelectedRouteId(route.id);
    setSidebarView("detail");
  }, []);

  const handleSaveRoute = useCallback(
    (route: PatrolRoute) => {
      if (editingRoute) {
        setRoutes((prev) => prev.map((r) => (r.id === route.id ? route : r)));
      } else {
        setRoutes((prev) => [...prev, route]);
      }
      setSidebarView("list");
      setEditingRoute(null);
      setFormSite("");
      setFormCheckpoints([]);
      setSelectedCheckpointId(null);
    },
    [editingRoute],
  );

  const handleFormCancel = useCallback(() => {
    setSidebarView("list");
    setEditingRoute(null);
    setFormSite("");
    setFormCheckpoints([]);
    setSelectedCheckpointId(null);
  }, []);

  // ── Site change: fly to site bounds, clear checkpoints ─────────

  const handleFormSiteChange = useCallback((newSite: string) => {
    setFormSite(newSite);
    setFormCheckpoints([]);
    setSelectedCheckpointId(null);
    const bounds = getSiteBounds(mockGeolocationZones, newSite);
    if (bounds) {
      setTimeout(() => patrolMapRef.current?.fitBoundsTo(bounds), 150);
    }
  }, []);

  const handleDeleteRoute = useCallback(() => {
    if (!deleteTarget) return;
    setRoutes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    if (selectedRouteId === deleteTarget.id) {
      setSelectedRouteId(null);
      setSidebarView("list");
    }
    setDeleteTarget(null);
  }, [deleteTarget, selectedRouteId]);

  const handleSelectExecution = useCallback((id: string) => {
    if (!id) {
      setSelectedExecutionId(null);
      setSidebarView("list");
      return;
    }
    setSelectedExecutionId(id);
    setSidebarView("detail");
  }, []);

  // ── Checkpoint warnings: which checkpoints are outside site zones ─

  const checkpointWarnings = useMemo(() => {
    const warningSet = new Set<string>();
    if (!formSite) return warningSet;
    const siteZones = mockGeolocationZones.filter((z) => z.site === formSite);
    if (siteZones.length === 0) return warningSet;
    for (const cp of formCheckpoints) {
      if (!siteZones.some((z) => isPointInZone(cp.coords, z.shape))) {
        warningSet.add(cp.id);
      }
    }
    return warningSet;
  }, [formSite, formCheckpoints]);

  // ── Map click: add checkpoint in form mode ──────────────────────

  const handleMapClickAddCheckpoint = useCallback(
    (lngLat: { lng: number; lat: number }) => {
      if (sidebarView !== "form" || !formSite) return;
      const newCheckpoint: PatrolCheckpoint = {
        id: crypto.randomUUID(),
        name: "",
        coords: [lngLat.lng, lngLat.lat],
        type: "GPS",
        expectedMinutes: 0,
        toleranceMinutes: 2,
        order: formCheckpoints.length + 1,
      };
      setFormCheckpoints((prev) => [...prev, newCheckpoint]);
      setSelectedCheckpointId(newCheckpoint.id);
    },
    [sidebarView, formSite, formCheckpoints.length],
  );

  // ── Map checkpoint click: select for editing in form mode ──────

  const handleCheckpointClickInForm = useCallback(
    (checkpoint: PatrolCheckpoint) => {
      if (sidebarView === "form") {
        setSelectedCheckpointId(checkpoint.id);
      }
    },
    [sidebarView],
  );

  // ── Map props based on active tab ──────────────────────────────

  const mapProps = useMemo(() => {
    // Form mode: show form checkpoints with edit interactions
    if (activeTab === "itineraires" && sidebarView === "form") {
      return {
        routeCheckpoints: formCheckpoints,
        selectedCheckpointId,
        onCheckpointClick: handleCheckpointClickInForm,
        onMapClick: formSite ? handleMapClickAddCheckpoint : undefined,
        editMode: !!formSite,
      };
    }
    if (activeTab === "itineraires" && selectedRoute) {
      return {
        routeCheckpoints: selectedRoute.checkpoints,
        route: selectedRoute,
      };
    }
    if (activeTab === "en-cours" && selectedExecution) {
      return {
        execution: selectedExecution,
        route: selectedExecutionRoute,
        routeCheckpoints: selectedExecutionRoute?.checkpoints,
      };
    }
    return {};
  }, [
    activeTab,
    sidebarView,
    formSite,
    formCheckpoints,
    selectedCheckpointId,
    handleCheckpointClickInForm,
    handleMapClickAddCheckpoint,
    selectedRoute,
    selectedExecution,
    selectedExecutionRoute,
  ]);

  // ── Sidebar content renderer ──────────────────────────────────

  const renderSidebarContent = () => {
    // Form view for route creation/editing
    if (activeTab === "itineraires" && sidebarView === "form") {
      return (
        <PatrolRouteFormPanel
          editingRoute={editingRoute}
          site={formSite}
          onSiteChange={handleFormSiteChange}
          checkpoints={formCheckpoints}
          selectedCheckpointId={selectedCheckpointId}
          checkpointWarnings={checkpointWarnings}
          onCheckpointsChange={setFormCheckpoints}
          onSelectedCheckpointChange={setSelectedCheckpointId}
          onSave={handleSaveRoute}
          onCancel={handleFormCancel}
        />
      );
    }

    if (activeTab === "itineraires") {
      return (
        <PatrolRouteSidebar
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelectRoute={(id) => {
            setSelectedRouteId(id);
            setSidebarView("list");
          }}
          onCreateRoute={handleCreateRoute}
          onEditRoute={handleEditRoute}
          onDeleteRoute={setDeleteTarget}
          onViewDetail={handleViewRouteDetail}
          sidebarView={sidebarView}
          onBackToList={() => setSidebarView("list")}
        />
      );
    }

    if (activeTab === "en-cours") {
      return (
        <PatrolExecutionSidebar
          executions={executions}
          selectedExecutionId={selectedExecutionId}
          onSelectExecution={handleSelectExecution}
          sidebarView={sidebarView}
          onBackToList={() => {
            setSelectedExecutionId(null);
            setSidebarView("list");
          }}
        />
      );
    }

    return null;
  };

  // ── Sidebar label ─────────────────────────────────────────────

  const sidebarLabel =
    sidebarView === "form"
      ? editingRoute
        ? "Modifier"
        : "Nouvelle Ronde"
      : activeTab === "itineraires"
        ? "Rondes"
        : "En cours";

  const sidebarWidth = "w-96";

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="relative h-full">
      {/* Full-page map */}
      <PatrolMap
        ref={patrolMapRef}
        className="absolute inset-0"
        {...mapProps}
        allRoutes={routes}
        zones={mockGeolocationZones}
        showZones={showZones}
        onToggleZones={() => setShowZones((prev) => !prev)}
      />

      {/* ── Top-left: tab selector overlay ──────────────────────── */}
      {showNav && (
        <div className="absolute top-3 left-3 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="itineraires">Rondes</TabsTrigger>
                <TabsTrigger value="en-cours">En cours</TabsTrigger>
              </TabsList>
            </Tabs>
            <button
              onClick={() => setShowNav(false)}
              className="ml-2 h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
              aria-label="Masquer les onglets"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Nav toggle (when nav is hidden) */}
      {!showNav && (
        <button
          onClick={() => setShowNav(true)}
          className="absolute top-3 left-3 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl p-2.5 shadow-lg"
          aria-label="Afficher les onglets"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      )}

      {/* ── Desktop sidebar (right side) ──────────────────────── */}
      {showSidebar && (
        <div
          className={cn(
            "hidden lg:flex absolute top-3 right-3 bottom-3 z-10 flex-col bg-background/80 backdrop-blur-md border border-border/50 rounded-xl shadow-lg overflow-hidden transition-all",
            sidebarWidth,
          )}
        >
          {/* Sidebar header with dismiss */}
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1 shrink-0">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {sidebarLabel}
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
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="hidden lg:flex absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl p-2.5 shadow-lg"
          aria-label="Afficher le panneau"
        >
          <PanelRight className="h-4 w-4" />
        </button>
      )}

      {/* ── Mobile sidebar (Sheet) ────────────────────────────── */}
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

      {/* ── Delete confirmation modal ─────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        type="warning"
        title="Supprimer la ronde"
        description={`Voulez-vous vraiment supprimer la ronde "${deleteTarget?.name}" ? Cette action est irréversible.`}
        actions={{
          primary: {
            label: "Supprimer",
            onClick: handleDeleteRoute,
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
