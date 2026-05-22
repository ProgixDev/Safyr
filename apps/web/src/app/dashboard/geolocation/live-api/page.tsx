"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useMemo, useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import {
  Activity,
  Clock,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivePositions } from "@/hooks/time-entries";
import type { ActivePosition } from "@safyr/api-client";

const PARIS = { longitude: 2.3522, latitude: 48.8566, zoom: 11 };

function fullName(a: ActivePosition): string {
  const m = a.member;
  return (
    [m.firstName, m.lastName].filter(Boolean).join(" ") ||
    m.employeeNumber ||
    "Agent"
  );
}

function initials(a: ActivePosition): string {
  const m = a.member;
  return (
    ((m.firstName?.[0] ?? "") + (m.lastName?.[0] ?? "")).toUpperCase() || "A"
  );
}

function formatDuration(fromIso: string): string {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(fromIso).getTime()) / 60000),
  );
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export default function LiveApiPage() {
  const { data, isLoading, refetch, isFetching } = useActivePositions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const positions = useMemo<ActivePosition[]>(
    () => (data ?? []).filter((p) => p.clockInLat != null && p.clockInLng != null),
    [data],
  );

  const noGps = useMemo<ActivePosition[]>(
    () => (data ?? []).filter((p) => p.clockInLat == null || p.clockInLng == null),
    [data],
  );

  const initialView = useMemo(() => {
    if (positions.length === 0) return PARIS;
    const avgLat =
      positions.reduce((acc, p) => acc + (p.clockInLat ?? 0), 0) / positions.length;
    const avgLng =
      positions.reduce((acc, p) => acc + (p.clockInLng ?? 0), 0) / positions.length;
    return { latitude: avgLat, longitude: avgLng, zoom: 11 };
  }, [positions]);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
  const selected = positions.find((p) => p.id === selectedId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-7 w-7" />
            Suivi en temps réel
          </h1>
          <p className="text-muted-foreground">
            Positions GPS des agents actuellement en vacation
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Rafraîchir
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-0 h-[600px] rounded-lg overflow-hidden relative">
            {!mapboxToken ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground p-6 text-center">
                <span>
                  Carte indisponible — configurez{" "}
                  <code className="font-mono text-xs">
                    NEXT_PUBLIC_MAPBOX_TOKEN
                  </code>{" "}
                  dans <code>.env.local</code> côté web.
                </span>
              </div>
            ) : (
              <Map
                initialViewState={initialView}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={mapboxToken}
                style={{ width: "100%", height: "100%" }}
              >
                {positions.map((p) => (
                  <Marker
                    key={p.id}
                    longitude={p.clockInLng!}
                    latitude={p.clockInLat!}
                    anchor="bottom"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      setSelectedId(p.id);
                    }}
                  >
                    <div className="flex flex-col items-center cursor-pointer group">
                      <div className="w-9 h-9 rounded-full bg-green-500 border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs hover:scale-110 transition-transform">
                        {initials(p)}
                      </div>
                      <div className="w-2 h-2 bg-green-500 rotate-45 -mt-1" />
                    </div>
                  </Marker>
                ))}

                {selected && (
                  <Popup
                    longitude={selected.clockInLng!}
                    latitude={selected.clockInLat!}
                    anchor="top"
                    closeOnClick={false}
                    onClose={() => setSelectedId(null)}
                  >
                    <div className="space-y-1 min-w-[160px]">
                      <p className="font-semibold text-sm">{fullName(selected)}</p>
                      {selected.member.position && (
                        <p className="text-xs text-muted-foreground">
                          {selected.member.position}
                        </p>
                      )}
                      {selected.siteName && (
                        <p className="text-xs">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {selected.siteName}
                        </p>
                      )}
                      <p className="text-xs">
                        <Clock className="h-3 w-3 inline mr-1" />
                        En service depuis {formatDuration(selected.clockInAt)}
                      </p>
                    </div>
                  </Popup>
                )}
              </Map>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                En service
              </span>
              <Badge variant="default">{data?.length ?? 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[540px] overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : (data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Aucun agent en service actuellement.
              </p>
            ) : (
              (data ?? []).map((p) => {
                const isSelected = p.id === selectedId;
                const hasGps = p.clockInLat != null && p.clockInLng != null;
                return (
                  <button
                    key={p.id}
                    onClick={() => hasGps && setSelectedId(p.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : hasGps
                          ? "hover:bg-accent"
                          : "opacity-75"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {initials(p)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {fullName(p)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.siteName ?? "Sans site"} •{" "}
                          {formatDuration(p.clockInAt)}
                        </p>
                      </div>
                      {!hasGps && (
                        <Badge
                          variant="outline"
                          className="text-orange-600 border-orange-500/40"
                        >
                          Sans GPS
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })
            )}

            {noGps.length > 0 && (
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  {noGps.length} agent(s) sans coordonnée GPS — pointage manuel
                  ou autorisation refusée
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Mise à jour automatique
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Toutes les 15 secondes
          </span>
        </CardHeader>
      </Card>
    </div>
  );
}
