// ── Types ──────────────────────────────────────────────────────────

export type ZoneType =
  | "Site client"
  | "Zone sensible"
  | "Zone restreinte"
  | "Point de contrôle";

export type ZoneShape =
  | { kind: "circle"; center: [number, number]; radius: number } // [lng, lat], radius in meters
  | { kind: "polygon"; vertices: [number, number][] }; // [lng, lat] pairs

export interface ZoneAlertRules {
  entry: boolean;
  exit: boolean;
  absence: boolean;
  parking: boolean;
}

export interface GeoZone {
  id: string;
  name: string;
  type: ZoneType;
  site: string;
  color: string; // hex color
  shape: ZoneShape;
  alerts: ZoneAlertRules;
  createdAt: string; // ISO date
}

// ── Config ─────────────────────────────────────────────────────────

export const ZONE_TYPES: ZoneType[] = [
  "Site client",
  "Zone sensible",
  "Zone restreinte",
  "Point de contrôle",
];

export const ZONE_TYPE_COLORS: Record<ZoneType, string> = {
  "Site client": "#22d3ee",
  "Zone sensible": "#f59e0b",
  "Zone restreinte": "#ef4444",
  "Point de contrôle": "#a855f7",
};

export type ZoneTypeBadgeVariant = "cyan" | "warning" | "error" | "secondary";

export const ZONE_TYPE_BADGE: Record<ZoneType, ZoneTypeBadgeVariant> = {
  "Site client": "cyan",
  "Zone sensible": "warning",
  "Zone restreinte": "error",
  "Point de contrôle": "secondary",
};

export const ALERT_LABELS: { key: keyof ZoneAlertRules; label: string }[] = [];

// ── Geometry utilities (derived, not stored) ───────────────────────

/** Convert circle to polygon ring for rendering/calculations */
export function circleToPolygon(
  center: [number, number],
  radiusM: number,
  steps = 64,
): [number, number][] {
  const [lng, lat] = center;
  const points: [number, number][] = [];
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dLat = (radiusM / 111320) * Math.cos(angle);
    const dLng =
      (radiusM / (111320 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
    points.push([lng + dLng, lat + dLat]);
  }
  points.push(points[0]);
  return points;
}

/** Ensure a polygon ring is closed (first === last vertex) */
export function ensureClosedRing(
  vertices: [number, number][],
): [number, number][] {
  if (vertices.length === 0) return vertices;
  const first = vertices[0];
  const last = vertices[vertices.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return [...vertices, first];
  }
  return vertices;
}

/** Flat-earth distance between two [lng, lat] points in meters */
export function flatEarthDistance(
  a: [number, number],
  b: [number, number],
): number {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = (lat2 - lat1) * 111320;
  const dLng =
    (lng2 - lng1) * 111320 * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180));
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/** Compute zone area in m² using the shoelace formula on projected coordinates */
export function computeZoneArea(shape: ZoneShape): number {
  if (shape.kind === "circle") {
    return Math.PI * shape.radius * shape.radius;
  }
  // Shoelace formula on flat-earth projected coordinates
  const verts = shape.vertices;
  const refLat = verts[0][1];
  const cosLat = Math.cos((refLat * Math.PI) / 180);
  let area = 0;
  for (let i = 0; i < verts.length; i++) {
    const j = (i + 1) % verts.length;
    const xi = verts[i][0] * 111320 * cosLat;
    const yi = verts[i][1] * 111320;
    const xj = verts[j][0] * 111320 * cosLat;
    const yj = verts[j][1] * 111320;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area) / 2;
}

/** Compute zone perimeter in meters */
export function computeZonePerimeter(shape: ZoneShape): number {
  if (shape.kind === "circle") {
    return 2 * Math.PI * shape.radius;
  }
  const verts = shape.vertices;
  let perimeter = 0;
  for (let i = 0; i < verts.length; i++) {
    const j = (i + 1) % verts.length;
    perimeter += flatEarthDistance(verts[i], verts[j]);
  }
  return perimeter;
}

/** Format area for display: m² if < 10000, otherwise ha */
export function formatArea(areaM2: number): string {
  if (areaM2 < 10000) return `${Math.round(areaM2)} m²`;
  return `${(areaM2 / 10000).toFixed(2)} ha`;
}

/** Format perimeter for display: m if < 1000, otherwise km */
export function formatPerimeter(perimeterM: number): string {
  if (perimeterM < 1000) return `${Math.round(perimeterM)} m`;
  return `${(perimeterM / 1000).toFixed(2)} km`;
}

// ── Point-in-zone detection ─────────────────────────────────────────

/** Ray-casting algorithm: check if point [lng, lat] is inside a polygon */
function isPointInPolygon(
  point: [number, number],
  vertices: [number, number][],
): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Check if a [lng, lat] point falls inside a zone shape (circle or polygon) */
export function isPointInZone(
  point: [number, number],
  shape: ZoneShape,
): boolean {
  if (shape.kind === "circle") {
    return flatEarthDistance(point, shape.center) <= shape.radius;
  }
  return isPointInPolygon(point, shape.vertices);
}

/** Distance from a point to the nearest edge of a zone, in meters. Returns 0 if inside. */
export function distanceToZone(
  point: [number, number],
  shape: ZoneShape,
): number {
  if (isPointInZone(point, shape)) return 0;
  if (shape.kind === "circle") {
    return flatEarthDistance(point, shape.center) - shape.radius;
  }
  // For polygons, find minimum distance to any edge vertex (approximation)
  let minDist = Infinity;
  for (const vertex of shape.vertices) {
    const d = flatEarthDistance(point, vertex);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

/** Bounding box of all zones for a given site, for map viewport fitting */
export function getSiteBounds(
  zones: GeoZone[],
  site: string,
): [[number, number], [number, number]] | null {
  const siteZones = zones.filter((z) => z.site === site);
  if (siteZones.length === 0) return null;

  const points: [number, number][] = [];
  for (const zone of siteZones) {
    if (zone.shape.kind === "circle") {
      const { center, radius } = zone.shape;
      const dLat = radius / 111320;
      const dLng = radius / (111320 * Math.cos((center[1] * Math.PI) / 180));
      points.push([center[0] - dLng, center[1] - dLat]);
      points.push([center[0] + dLng, center[1] + dLat]);
    } else {
      for (const v of zone.shape.vertices) points.push(v);
    }
  }

  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

// ── Mock Data ──────────────────────────────────────────────────────

export const mockGeolocationZones: GeoZone[] = [];
