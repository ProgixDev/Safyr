"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Source, Layer, MapRef, MapMouseEvent } from "react-map-gl/mapbox";
import { Maximize2, X } from "lucide-react";
import {
  GeoZone,
  ZoneShape,
  ZONE_TYPE_COLORS,
  ZoneType,
  circleToPolygon,
  ensureClosedRing,
  flatEarthDistance,
} from "@/data/geolocation-zones";
import { cn } from "@/lib/utils";

// ── Props ───────────────────────────────────────────────────────────

interface ZoneMapProps {
  zones: GeoZone[];
  selectedZoneId: string | null;
  onZoneClick: (zone: GeoZone) => void;
  drawingMode: "none" | "circle" | "polygon";
  onDrawComplete: (shape: ZoneShape) => void;
  onDrawCancel: () => void;
  className?: string;
}

// ── Legend config ────────────────────────────────────────────────────

const LEGEND: { label: ZoneType; color: string }[] = (
  Object.entries(ZONE_TYPE_COLORS) as [ZoneType, string][]
).map(([label, color]) => ({ label, color }));

// ── Component ───────────────────────────────────────────────────────

export function ZoneMap({
  zones,
  selectedZoneId,
  onZoneClick,
  drawingMode,
  onDrawComplete,
  onDrawCancel,
  className,
}: ZoneMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [cursorPos, setCursorPos] = useState<[number, number] | null>(null);

  // ── Reset drawing state when mode changes ─────────────────────────
  // Track previous mode to detect transitions and reset state during render
  // (the React-idiomatic alternative to setState-in-effect for derived resets).
  const [prevDrawingMode, setPrevDrawingMode] = useState(drawingMode);
  if (drawingMode !== prevDrawingMode) {
    setPrevDrawingMode(drawingMode);
    setDrawingPoints([]);
    setCursorPos(null);
  }

  // ── ESC to cancel drawing ─────────────────────────────────────────
  useEffect(() => {
    if (drawingMode === "none") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawingPoints([]);
        setCursorPos(null);
        onDrawCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawingMode, onDrawCancel]);

  // ── Fit bounds to selected zone ──────────────────────────────────
  useEffect(() => {
    if (!selectedZoneId || !mapRef.current) return;
    const zone = zones.find((z) => z.id === selectedZoneId);
    if (!zone) return;

    // Get the polygon coordinates for bounding box
    const coords =
      zone.shape.kind === "circle"
        ? circleToPolygon(zone.shape.center, zone.shape.radius)
        : ensureClosedRing(zone.shape.vertices);

    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);

    mapRef.current.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 80, maxZoom: 17, duration: 1200 },
    );
  }, [selectedZoneId, zones]);

  // ── GeoJSON FeatureCollection for zones ───────────────────────────
  const zonesGeoJson = useMemo(() => {
    const features = zones.map((zone) => {
      const coordinates =
        zone.shape.kind === "circle"
          ? [circleToPolygon(zone.shape.center, zone.shape.radius)]
          : [ensureClosedRing(zone.shape.vertices)];

      return {
        type: "Feature" as const,
        properties: {
          zoneId: zone.id,
          color: zone.color,
          name: zone.name,
          selected: zone.id === selectedZoneId,
        },
        geometry: {
          type: "Polygon" as const,
          coordinates,
        },
      };
    });

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [zones, selectedZoneId]);

  // ── Drawing preview GeoJSON ───────────────────────────────────────
  const drawingPreviewGeoJson = useMemo(() => {
    const features: GeoJSON.Feature[] = [];

    if (drawingMode === "circle" && drawingPoints.length === 1 && cursorPos) {
      const center = drawingPoints[0];
      const radius = flatEarthDistance(center, cursorPos);
      const ring = circleToPolygon(center, radius);
      features.push({
        type: "Feature",
        properties: {},
        geometry: { type: "Polygon", coordinates: [ring] },
      });
    }

    if (drawingMode === "polygon" && drawingPoints.length > 0) {
      const coords: [number, number][] = [...drawingPoints];
      if (cursorPos) coords.push(cursorPos);
      if (coords.length >= 2) {
        features.push({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords },
        });
      }
    }

    // Draw placed points as a line connecting them
    if (drawingMode === "circle" && drawingPoints.length === 1) {
      features.push({
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: drawingPoints[0] },
      });
    }

    return { type: "FeatureCollection" as const, features };
  }, [drawingMode, drawingPoints, cursorPos]);

  // ── Map click handler ─────────────────────────────────────────────
  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      if (drawingMode === "circle") {
        if (drawingPoints.length === 0) {
          setDrawingPoints([point]);
        } else {
          const center = drawingPoints[0];
          const radius = flatEarthDistance(center, point);
          setDrawingPoints([]);
          setCursorPos(null);
          onDrawComplete({ kind: "circle", center, radius });
        }
        return;
      }

      if (drawingMode === "polygon") {
        setDrawingPoints((prev) => [...prev, point]);
        return;
      }

      // Normal mode — detect zone click
      const feature = e.features?.[0];
      if (feature?.properties?.zoneId) {
        const zone = zones.find((z) => z.id === feature.properties!.zoneId);
        if (zone) onZoneClick(zone);
      }
    },
    [drawingMode, drawingPoints, zones, onZoneClick, onDrawComplete],
  );

  // ── Map double-click handler (close polygon) ─────────────────────
  const handleMapDblClick = useCallback(
    (e: MapMouseEvent) => {
      if (drawingMode !== "polygon" || drawingPoints.length < 3) return;
      e.preventDefault();
      const vertices = [...drawingPoints];
      setDrawingPoints([]);
      setCursorPos(null);
      onDrawComplete({ kind: "polygon", vertices });
    },
    [drawingMode, drawingPoints, onDrawComplete],
  );

  // ── Mouse move ────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: MapMouseEvent) => {
      if (drawingMode !== "none") {
        setCursorPos([e.lngLat.lng, e.lngLat.lat]);
      }
    },
    [drawingMode],
  );

  // ── Global view (fit bounds on all zones) ─────────────────────────
  const handleGlobalView = useCallback(() => {
    if (!mapRef.current || zones.length === 0) return;

    const allPoints: [number, number][] = [];
    for (const zone of zones) {
      if (zone.shape.kind === "circle") {
        const ring = circleToPolygon(zone.shape.center, zone.shape.radius, 8);
        allPoints.push(...ring);
      } else {
        allPoints.push(...zone.shape.vertices);
      }
    }

    if (allPoints.length === 0) return;

    const lngs = allPoints.map((p) => p[0]);
    const lats = allPoints.map((p) => p[1]);

    mapRef.current.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 60, maxZoom: 14, duration: 1000 },
    );
  }, [zones]);

  // ── Cancel drawing helper ─────────────────────────────────────────
  const handleCancelDrawing = useCallback(() => {
    setDrawingPoints([]);
    setCursorPos(null);
    onDrawCancel();
  }, [onDrawCancel]);

  // ── Finish polygon drawing ──────────────────────────────────────
  const handleFinishPolygon = useCallback(() => {
    if (drawingMode !== "polygon" || drawingPoints.length < 3) return;
    const vertices = [...drawingPoints];
    setDrawingPoints([]);
    setCursorPos(null);
    onDrawComplete({ kind: "polygon", vertices });
  }, [drawingMode, drawingPoints, onDrawComplete]);

  // ── Render ────────────────────────────────────────────────────────

  const isDrawing = drawingMode !== "none";

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      aria-label="Carte des zones géolocalisées"
      role="region"
    >
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ longitude: 2.3488, latitude: 48.8534, zoom: 11 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        interactiveLayerIds={isDrawing ? undefined : ["zones-fill"]}
        onClick={handleMapClick}
        onDblClick={handleMapDblClick}
        onMouseMove={handleMouseMove}
        cursor={isDrawing ? "crosshair" : undefined}
        doubleClickZoom={!isDrawing}
      >
        {/* Zone overlays */}
        <Source id="zones" type="geojson" data={zonesGeoJson}>
          <Layer
            id="zones-glow"
            type="line"
            paint={{
              "line-color": ["get", "color"],
              "line-width": ["case", ["get", "selected"], 10, 0],
              "line-opacity": ["case", ["get", "selected"], 0.25, 0],
              "line-blur": 6,
            }}
          />
          <Layer
            id="zones-fill"
            type="fill"
            paint={{
              "fill-color": ["get", "color"],
              "fill-opacity": ["case", ["get", "selected"], 0.35, 0.15],
            }}
          />
          <Layer
            id="zones-line"
            type="line"
            paint={{
              "line-color": ["get", "color"],
              "line-width": ["case", ["get", "selected"], 4, 2],
              "line-opacity": ["case", ["get", "selected"], 1.0, 0.6],
            }}
          />
        </Source>

        {/* Drawing preview */}
        {isDrawing && (
          <Source
            id="drawing-preview"
            type="geojson"
            data={drawingPreviewGeoJson}
          >
            <Layer
              id="drawing-preview-line"
              type="line"
              paint={{
                "line-color": "#357AB7",
                "line-width": 2,
                "line-dasharray": [4, 4],
              }}
            />
            <Layer
              id="drawing-preview-fill"
              type="fill"
              paint={{
                "fill-color": "#357AB7",
                "fill-opacity": 0.1,
              }}
            />
            <Layer
              id="drawing-preview-point"
              type="circle"
              filter={["==", "$type", "Point"]}
              paint={{
                "circle-radius": 5,
                "circle-color": "#357AB7",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
              }}
            />
          </Source>
        )}
      </Map>

      {/* Drawing instruction banner */}
      {isDrawing && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 rounded-lg bg-background/90 backdrop-blur-md border border-cyan-500/30 px-4 py-2 shadow-lg">
          <span className="text-xs text-foreground">
            {drawingMode === "circle"
              ? drawingPoints.length === 0
                ? "Cliquez pour placer le centre du cercle"
                : "Cliquez pour définir le rayon"
              : `Cliquez pour ajouter des sommets${drawingPoints.length > 0 ? ` (${drawingPoints.length})` : ""}`}
          </span>
          {drawingMode === "polygon" && drawingPoints.length >= 3 && (
            <button
              onClick={handleFinishPolygon}
              className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Valider
            </button>
          )}
          <button
            onClick={handleCancelDrawing}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-3 w-3" />
            Annuler
          </button>
        </div>
      )}

      {/* Bottom-left controls */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
        <div className="flex items-center gap-3 rounded-lg bg-background/80 backdrop-blur-md border border-border/50 px-3 py-1.5 shadow-sm">
          {LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleGlobalView}
          className="flex items-center gap-1.5 rounded-lg bg-background/80 backdrop-blur-md border border-border/50 px-2.5 py-1.5 text-[10px] font-medium shadow-sm hover:bg-background/95 transition-colors"
          title="Afficher toutes les zones"
          aria-label="Vue globale — afficher toutes les zones"
        >
          <Maximize2 className="h-3 w-3" />
          Vue globale
        </button>
      </div>
    </div>
  );
}
