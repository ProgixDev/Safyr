"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import Map, { Source, Layer, Marker, Popup, MapRef } from "react-map-gl/mapbox";
import { Maximize2, Layers } from "lucide-react";
import {
  PatrolCheckpoint,
  PatrolExecution,
  PatrolRoute,
  CheckpointScan,
  CHECKPOINT_TYPE_CONFIG,
} from "@/data/geolocation-patrols";
import type { GeoZone } from "@/data/geolocation-zones";
import { circleToPolygon, ensureClosedRing } from "@/data/geolocation-zones";
import { cn } from "@/lib/utils";

// ── Props ───────────────────────────────────────────────────────────

// ── Imperative handle ────────────────────────────────────────────────

export interface PatrolMapHandle {
  fitBoundsTo: (bounds: [[number, number], [number, number]]) => void;
}

interface PatrolMapProps {
  routeCheckpoints?: PatrolCheckpoint[];
  execution?: PatrolExecution | null;
  route?: PatrolRoute | null;
  allRoutes?: PatrolRoute[]; // all routes for global view fallback
  selectedCheckpointId?: string | null;
  onCheckpointClick?: (checkpoint: PatrolCheckpoint) => void;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  editMode?: boolean; // crosshair cursor for checkpoint placement
  replayProgress?: number; // 0-1, position along GPS trail for history replay
  zones?: GeoZone[];
  showZones?: boolean;
  onToggleZones?: () => void;
  className?: string;
}

// ── Scan status colors ──────────────────────────────────────────────

const SCAN_STATUS_STYLES: Record<
  CheckpointScan["status"],
  { bg: string; border: string; text: string; pulse: boolean }
> = {
  pending: {
    bg: "bg-slate-700",
    border: "border-slate-500",
    text: "text-slate-300",
    pulse: false,
  },
  validated: {
    bg: "bg-emerald-500",
    border: "border-emerald-600",
    text: "text-white",
    pulse: false,
  },
  missed: {
    bg: "bg-red-500",
    border: "border-red-600",
    text: "text-white",
    pulse: true,
  },
};

// ── Legend config ────────────────────────────────────────────────────

const LEGEND: { label: string; dot: string }[] = [
  { label: "Validé", dot: "bg-emerald-500" },
  { label: "En attente", dot: "bg-slate-500" },
  { label: "Manqué", dot: "bg-red-500" },
  { label: "Trajet réel", dot: "bg-cyan-400" },
];

// ── Helpers ─────────────────────────────────────────────────────────

/** Interpolate a position along a trail based on progress 0-1 */
function interpolateTrailPosition(
  trail: { coords: [number, number] }[],
  progress: number,
): [number, number] | null {
  if (trail.length === 0) return null;
  if (trail.length === 1) return trail[0].coords;

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const totalSegments = trail.length - 1;
  const exactIndex = clampedProgress * totalSegments;
  const segmentIndex = Math.min(Math.floor(exactIndex), totalSegments - 1);
  const segmentProgress = exactIndex - segmentIndex;

  const [lng1, lat1] = trail[segmentIndex].coords;
  const [lng2, lat2] = trail[segmentIndex + 1].coords;

  return [
    lng1 + (lng2 - lng1) * segmentProgress,
    lat1 + (lat2 - lat1) * segmentProgress,
  ];
}

/** Slice a trail up to a given progress (0-1) for partial replay rendering */
function sliceTrailToProgress(
  trail: { coords: [number, number] }[],
  progress: number,
): [number, number][] {
  if (trail.length === 0) return [];
  if (progress >= 1) return trail.map((p) => p.coords);

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const totalSegments = trail.length - 1;
  const exactIndex = clampedProgress * totalSegments;
  const segmentIndex = Math.floor(exactIndex);
  const segmentProgress = exactIndex - segmentIndex;

  const coords = trail.slice(0, segmentIndex + 1).map((p) => p.coords);

  // Add interpolated endpoint
  if (segmentIndex < totalSegments) {
    const [lng1, lat1] = trail[segmentIndex].coords;
    const [lng2, lat2] = trail[segmentIndex + 1].coords;
    coords.push([
      lng1 + (lng2 - lng1) * segmentProgress,
      lat1 + (lat2 - lat1) * segmentProgress,
    ]);
  }

  return coords;
}

// ── Component ───────────────────────────────────────────────────────

export const PatrolMap = forwardRef<PatrolMapHandle, PatrolMapProps>(
  function PatrolMap(
    {
      routeCheckpoints,
      execution,
      route,
      allRoutes,
      selectedCheckpointId,
      onCheckpointClick,
      onMapClick,
      editMode,
      replayProgress,
      zones,
      showZones,
      onToggleZones,
      className,
    }: PatrolMapProps,
    ref,
  ) {
    const mapRef = useRef<MapRef>(null);
    const [hoveredCheckpoint, setHoveredCheckpoint] =
      useState<PatrolCheckpoint | null>(null);

    // ── Expose fitBoundsTo for parent (e.g. on site selection) ────────
    useImperativeHandle(ref, () => ({
      fitBoundsTo: (bounds) => {
        if (!mapRef.current) return;
        mapRef.current.fitBounds(bounds, {
          padding: 80,
          maxZoom: 17,
          duration: 1000,
        });
      },
    }));

    // Resolve the checkpoints to display (from props or from route)
    const checkpoints = useMemo(
      () =>
        routeCheckpoints ??
        route?.checkpoints ??
        (execution
          ? // If only execution provided, we might not have checkpoints
            []
          : []),
      [routeCheckpoints, route, execution],
    );

    // Build a scan status lookup from execution
    const scanStatusMap = useMemo(() => {
      const map: Record<string, CheckpointScan> = {};
      if (execution) {
        for (const scan of execution.checkpointScans) {
          map[scan.checkpointId] = scan;
        }
      }
      return map;
    }, [execution]);

    // ── Planned route GeoJSON (dashed line) ───────────────────────────
    const routeGeoJson = useMemo(() => {
      if (checkpoints.length < 2) return null;
      return {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: checkpoints.map((cp) => cp.coords),
            },
          },
        ],
      };
    }, [checkpoints]);

    // ── Actual GPS trail GeoJSON (solid line) ─────────────────────────
    const trailGeoJson = useMemo(() => {
      if (!execution || execution.gpsTrail.length < 2) return null;

      const isReplay = replayProgress !== undefined && replayProgress !== null;
      const coordinates = isReplay
        ? sliceTrailToProgress(execution.gpsTrail, replayProgress)
        : execution.gpsTrail.map((p) => p.coords);

      if (coordinates.length < 2) return null;

      return {
        type: "FeatureCollection" as const,
        features: [
          {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates,
            },
          },
        ],
      };
    }, [execution, replayProgress]);

    // ── Agent position ────────────────────────────────────────────────
    const agentPosition = useMemo((): [number, number] | null => {
      if (!execution || execution.gpsTrail.length === 0) return null;

      const isReplay = replayProgress !== undefined && replayProgress !== null;

      if (isReplay) {
        return interpolateTrailPosition(execution.gpsTrail, replayProgress);
      }

      // For active patrols, use the last GPS trail point
      if (execution.status === "en-cours") {
        return execution.gpsTrail[execution.gpsTrail.length - 1].coords;
      }

      return null;
    }, [execution, replayProgress]);

    // ── Zones GeoJSON overlay ────────────────────────────────────────
    const zonesGeoJson = useMemo(() => {
      if (!zones || !showZones) return null;
      const features = zones.map((zone) => {
        const coordinates =
          zone.shape.kind === "circle"
            ? [circleToPolygon(zone.shape.center, zone.shape.radius)]
            : [ensureClosedRing(zone.shape.vertices)];
        return {
          type: "Feature" as const,
          properties: { color: zone.color, name: zone.name },
          geometry: { type: "Polygon" as const, coordinates },
        };
      });
      return { type: "FeatureCollection" as const, features };
    }, [zones, showZones]);

    // ── Collect all map points for bounds fitting ─────────────────────
    const allPoints = useMemo(() => {
      const points: [number, number][] = [];
      for (const cp of checkpoints) {
        points.push(cp.coords);
      }
      if (execution) {
        for (const p of execution.gpsTrail) {
          points.push(p.coords);
        }
      }
      // Fallback: use all routes' checkpoints when nothing is selected
      if (points.length === 0 && allRoutes) {
        for (const r of allRoutes) {
          for (const cp of r.checkpoints) {
            points.push(cp.coords);
          }
        }
      }
      return points;
    }, [checkpoints, execution, allRoutes]);

    // ── Auto-fit bounds on mount / data change ────────────────────────
    useEffect(() => {
      if (!mapRef.current || allPoints.length === 0) return;

      // Small delay to ensure map is loaded
      const timer = setTimeout(() => {
        if (!mapRef.current || allPoints.length === 0) return;

        if (allPoints.length === 1) {
          mapRef.current.flyTo({
            center: allPoints[0],
            zoom: 16,
            duration: 1000,
          });
          return;
        }

        const lngs = allPoints.map((p) => p[0]);
        const lats = allPoints.map((p) => p[1]);

        mapRef.current.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 60, maxZoom: 16, duration: 1000 },
        );
      }, 100);

      return () => clearTimeout(timer);
    }, [allPoints]);

    // ── Global view handler ───────────────────────────────────────────
    const handleGlobalView = useCallback(() => {
      if (!mapRef.current || allPoints.length === 0) return;

      if (allPoints.length === 1) {
        mapRef.current.flyTo({
          center: allPoints[0],
          zoom: 16,
          duration: 1000,
        });
        return;
      }

      const lngs = allPoints.map((p) => p[0]);
      const lats = allPoints.map((p) => p[1]);

      mapRef.current.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 60, maxZoom: 16, duration: 1000 },
      );
    }, [allPoints]);

    // ── Checkpoint click handler ──────────────────────────────────────
    const handleCheckpointClick = useCallback(
      (checkpoint: PatrolCheckpoint, e: React.MouseEvent) => {
        e.stopPropagation();
        onCheckpointClick?.(checkpoint);
      },
      [onCheckpointClick],
    );

    // ── Map click handler (for checkpoint placement) ────────────────
    const handleMapClick = useCallback(
      (event: { lngLat: { lng: number; lat: number } }) => {
        if (!onMapClick) return;
        onMapClick({ lng: event.lngLat.lng, lat: event.lngLat.lat });
      },
      [onMapClick],
    );

    // ── Resolve scan status for a checkpoint ──────────────────────────
    const getScanStatus = useCallback(
      (checkpointId: string): CheckpointScan["status"] => {
        return scanStatusMap[checkpointId]?.status ?? "pending";
      },
      [scanStatusMap],
    );

    const getScanTime = useCallback(
      (checkpointId: string): string | null => {
        return scanStatusMap[checkpointId]?.scannedAt ?? null;
      },
      [scanStatusMap],
    );

    // ── Default center (Paris) ────────────────────────────────────────
    const initialViewState = useMemo(() => {
      if (allPoints.length > 0) {
        const lngs = allPoints.map((p) => p[0]);
        const lats = allPoints.map((p) => p[1]);
        return {
          longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
          latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
          zoom: 14,
        };
      }
      return { longitude: 2.3488, latitude: 48.8534, zoom: 11 };
    }, [allPoints]);

    // ── Render ────────────────────────────────────────────────────────

    return (
      <div
        className={cn("relative overflow-hidden", className)}
        aria-label="Carte de la ronde de patrouille"
        role="region"
      >
        <Map
          ref={mapRef}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          initialViewState={initialViewState}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          onClick={handleMapClick}
          cursor={editMode ? "crosshair" : undefined}
        >
          {/* Zone overlays */}
          {zonesGeoJson && (
            <Source id="zones-overlay" type="geojson" data={zonesGeoJson}>
              <Layer
                id="zones-overlay-fill"
                type="fill"
                paint={{
                  "fill-color": ["get", "color"],
                  "fill-opacity": 0.12,
                }}
              />
              <Layer
                id="zones-overlay-line"
                type="line"
                paint={{
                  "line-color": ["get", "color"],
                  "line-width": 1.5,
                  "line-opacity": 0.5,
                }}
              />
            </Source>
          )}

          {/* Planned route line (dashed) */}
          {routeGeoJson && (
            <Source id="planned-route" type="geojson" data={routeGeoJson}>
              <Layer
                id="planned-route-line"
                type="line"
                paint={{
                  "line-color": "#94a3b8",
                  "line-width": 2,
                  "line-dasharray": [8, 4],
                }}
              />
            </Source>
          )}

          {/* Actual GPS trail (solid cyan) */}
          {trailGeoJson && (
            <Source id="gps-trail" type="geojson" data={trailGeoJson}>
              <Layer
                id="gps-trail-line"
                type="line"
                paint={{
                  "line-color": "#357AB7",
                  "line-width": 3,
                }}
              />
            </Source>
          )}

          {/* Checkpoint markers */}
          {checkpoints.map((checkpoint) => {
            const status = getScanStatus(checkpoint.id);
            const styles = execution
              ? SCAN_STATUS_STYLES[status]
              : SCAN_STATUS_STYLES.pending;
            const isSelected = selectedCheckpointId === checkpoint.id;

            return (
              <Marker
                key={checkpoint.id}
                longitude={checkpoint.coords[0]}
                latitude={checkpoint.coords[1]}
                anchor="center"
              >
                <div className="relative flex items-center justify-center">
                  {/* Selection ring */}
                  {isSelected && (
                    <span className="absolute h-9 w-9 rounded-full bg-cyan-400/20 animate-pulse" />
                  )}
                  {/* Pulse ring for missed */}
                  {styles.pulse && (
                    <span className="absolute h-7 w-7 rounded-full bg-red-500/30 animate-ping" />
                  )}
                  <button
                    onClick={(e) => handleCheckpointClick(checkpoint, e)}
                    onMouseEnter={() => setHoveredCheckpoint(checkpoint)}
                    onMouseLeave={() => setHoveredCheckpoint(null)}
                    className={cn(
                      "relative flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold cursor-pointer transition-transform hover:scale-110 shadow-lg",
                      styles.bg,
                      styles.border,
                      styles.text,
                      isSelected &&
                        "ring-2 ring-cyan-400 ring-offset-1 ring-offset-black/50 scale-110",
                    )}
                    aria-label={`Point de contrôle ${checkpoint.order}: ${checkpoint.name} — ${status}`}
                  >
                    {checkpoint.order}
                  </button>
                </div>
              </Marker>
            );
          })}

          {/* Agent position marker */}
          {agentPosition && (
            <Marker
              longitude={agentPosition[0]}
              latitude={agentPosition[1]}
              anchor="center"
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute h-6 w-6 rounded-full bg-cyan-400/30 animate-ping" />
                <span className="absolute h-4 w-4 rounded-full bg-cyan-400/20 animate-pulse" />
                <span className="relative h-3 w-3 rounded-full bg-cyan-400 border-2 border-cyan-300 shadow-lg shadow-cyan-400/50" />
              </div>
            </Marker>
          )}

          {/* Checkpoint hover popup */}
          {/* H1: use inline styles inside Popup — CSS variables don't cascade into Mapbox's detached DOM layer */}
          {hoveredCheckpoint && (
            <Popup
              longitude={hoveredCheckpoint.coords[0]}
              latitude={hoveredCheckpoint.coords[1]}
              anchor="bottom"
              closeButton={false}
              closeOnClick={false}
              offset={14}
            >
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                <p style={{ fontWeight: 600, color: "#f1f5f9", margin: 0 }}>
                  {hoveredCheckpoint.name}
                </p>
                <p style={{ color: "#94a3b8", margin: 0 }}>
                  Type : {CHECKPOINT_TYPE_CONFIG[hoveredCheckpoint.type].label}
                </p>
                {execution &&
                  (() => {
                    const scanTime = getScanTime(hoveredCheckpoint.id);
                    const status = getScanStatus(hoveredCheckpoint.id);
                    if (status === "validated" && scanTime) {
                      return (
                        <p style={{ color: "#34d399", margin: "2px 0 0" }}>
                          Validé à{" "}
                          {new Date(scanTime).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      );
                    }
                    if (status === "missed") {
                      return (
                        <p style={{ color: "#f87171", margin: "2px 0 0" }}>
                          Manqué
                        </p>
                      );
                    }
                    return (
                      <p style={{ color: "#94a3b8", margin: "2px 0 0" }}>
                        En attente
                      </p>
                    );
                  })()}
              </div>
            </Popup>
          )}
        </Map>

        {/* Bottom-left controls */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
          <div className="flex items-center gap-3 rounded-lg bg-background/80 backdrop-blur-md border border-border/50 px-3 py-1.5 shadow-sm">
            {LEGEND.map(({ label, dot }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", dot)} />
                <span className="text-[10px] text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={handleGlobalView}
            className="flex items-center gap-1.5 rounded-lg bg-background/80 backdrop-blur-md border border-border/50 px-2.5 py-1.5 text-[10px] font-medium shadow-sm hover:bg-background/95 transition-colors"
            title="Afficher toute la ronde"
            aria-label="Vue globale — afficher toute la ronde"
          >
            <Maximize2 className="h-3 w-3" />
            Vue globale
          </button>
          {onToggleZones && (
            <button
              onClick={onToggleZones}
              className={cn(
                "flex items-center gap-1.5 rounded-lg backdrop-blur-md border px-2.5 py-1.5 text-[10px] font-medium shadow-sm transition-colors",
                showZones
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                  : "bg-background/80 border-border/50 hover:bg-background/95",
              )}
              title={showZones ? "Masquer les zones" : "Afficher les zones"}
              aria-label={
                showZones ? "Masquer les zones" : "Afficher les zones"
              }
              aria-pressed={showZones}
            >
              <Layers className="h-3 w-3" />
              Zones
            </button>
          )}
        </div>
      </div>
    );
  },
);
