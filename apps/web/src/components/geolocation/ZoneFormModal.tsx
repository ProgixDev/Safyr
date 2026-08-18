"use client";

import React, { useState } from "react";
import { useSites } from "@/hooks/sites";
import { ZonePreviewMap } from "@/components/geolocation/ZonePreviewMap";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type {
  GeoZone,
  ZoneShape,
  ZoneType,
  ZoneAlertRules,
} from "@/data/geolocation-zones";
import { ZONE_TYPES, ALERT_LABELS } from "@/data/geolocation-zones";

// ── Constants ───────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#22d3ee",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#10b981",
  "#3b82f6",
];

// ── Props ───────────────────────────────────────────────────────────

interface ZoneFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: GeoZone | null;
  pendingShape: ZoneShape | null;
  onSave: (data: Omit<GeoZone, "id" | "createdAt">) => void;
  onStartDrawing: (mode: "circle" | "polygon") => void;
}

// ── Component ───────────────────────────────────────────────────────

export function ZoneFormModal({
  open,
  onOpenChange,
  zone,
  pendingShape,
  onSave,
  onStartDrawing,
}: ZoneFormModalProps) {
  const [name, setName] = useState(zone?.name ?? "");
  const [type, setType] = useState<ZoneType>(zone?.type ?? "Site client");
  const [site, setSite] = useState(zone?.site ?? "");
  const [color, setColor] = useState(zone?.color ?? "#22d3ee");
  const [shape, setShape] = useState<ZoneShape | null>(
    zone?.shape ?? pendingShape ?? null,
  );
  const [alerts, setAlerts] = useState<ZoneAlertRules>(
    zone?.alerts ?? { entry: true, exit: true, absence: false, parking: false },
  );

  // Track whether the modal was closed for drawing (to preserve form state).
  // Stored in state rather than a ref so we can read it safely during render.
  const [closedForDrawing, setClosedForDrawing] = useState(false);

  // ── Derived-state resets (React "storing previous props" pattern) ──
  //
  // Calling setState during render (before returning JSX) is the idiomatic
  // way to reset/derive state when props change, without using an effect.
  // React will re-render immediately with the new state, discarding the
  // partially-rendered output — no cascading effect renders.

  const [prevZoneId, setPrevZoneId] = useState<string | null | undefined>(
    zone?.id,
  );
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevPendingShape, setPrevPendingShape] = useState(pendingShape);

  if (zone?.id !== prevZoneId || open !== prevOpen) {
    setPrevZoneId(zone?.id);
    setPrevOpen(open);

    if (open && zone) {
      // Edit mode: pre-populate from zone when modal opens.
      setName(zone.name);
      setType(zone.type);
      setSite(zone.site);
      setColor(zone.color);
      setShape(zone.shape);
      setAlerts(zone.alerts);
    } else if (!open && !zone && !closedForDrawing) {
      // Create mode: reset when modal closes (but not when closing for drawing).
      setName("");
      setType("Site client");
      setSite("");
      setColor("#22d3ee");
      setShape(null);
      setAlerts({ entry: true, exit: true, absence: false, parking: false });
    }
    if (open) {
      setClosedForDrawing(false);
    }
  }

  if (pendingShape !== prevPendingShape) {
    setPrevPendingShape(pendingShape);
    if (pendingShape) {
      setShape(pendingShape);
    }
  }

  const handleStartDrawing = (mode: "circle" | "polygon") => {
    setClosedForDrawing(true);
    onStartDrawing(mode);
  };

  const handleSave = () => {
    if (!name || !shape) return;
    onSave({ name, type, site, color, shape, alerts });
  };

  const toggleAlert = (key: keyof ZoneAlertRules) => {
    setAlerts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Shape summary ───────────────────────────────────────────────

  const renderShapeSummary = () => {
    if (!shape) return null;

    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {shape.kind === "circle"
            ? `Cercle — rayon: ${Math.round(shape.radius)}m`
            : `Polygone — ${shape.vertices.length} sommets`}
        </p>
        {shape.kind === "circle" && (
          <div className="space-y-1.5">
            <Label htmlFor="radius">Rayon (m)</Label>
            <Input
              id="radius"
              type="number"
              min={1}
              value={shape.radius}
              onChange={(e) => {
                const r = Number(e.target.value);
                if (r > 0) setShape({ ...shape, radius: r });
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStartDrawing("circle")}
          >
            Redessiner cercle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStartDrawing("polygon")}
          >
            Redessiner polygone
          </Button>
        </div>
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      type="form"
      size="lg"
      title={zone ? "Modifier la zone" : "Nouvelle zone"}
      actions={{
        primary: {
          label: "Enregistrer",
          onClick: handleSave,
          disabled: !name || !shape,
        },
        secondary: {
          label: "Annuler",
          onClick: () => onOpenChange(false),
        },
      }}
    >
      <ZoneFormContent
        name={name}
        setName={setName}
        type={type}
        setType={setType}
        site={site}
        setSite={setSite}
        color={color}
        setColor={setColor}
        shape={shape}
        setShape={setShape}
        alerts={alerts}
        toggleAlert={toggleAlert}
        renderShapeSummary={renderShapeSummary}
        onStartDrawing={handleStartDrawing}
      />
    </Modal>
  );
}

// ── Shared form content ─────────────────────────────────────────

interface ZoneFormContentProps {
  name: string;
  setName: (v: string) => void;
  type: ZoneType;
  setType: (v: ZoneType) => void;
  site: string;
  setSite: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  shape: ZoneShape | null;
  setShape: (v: ZoneShape | null) => void;
  alerts: ZoneAlertRules;
  toggleAlert: (key: keyof ZoneAlertRules) => void;
  renderShapeSummary: () => React.ReactNode;
  onStartDrawing?: (mode: "circle" | "polygon") => void;
}

function ZoneFormContent({
  name,
  setName,
  type,
  setType,
  site,
  setSite,
  color,
  setColor,
  shape,
  alerts,
  toggleAlert,
  renderShapeSummary,
  onStartDrawing,
}: ZoneFormContentProps) {
  const { data: sitesDisponibles = [] } = useSites();
  const nomsDesSites = sitesDisponibles.map((site) => site.name);
  return (
    <div className="space-y-4">
      {/* Nom de la zone */}
      <div className="space-y-1.5">
        <Label htmlFor="zone-name">Nom de la zone</Label>
        <Input
          id="zone-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Zone Nord — Rosny 2"
        />
      </div>

      {/* Type de zone */}
      <div className="space-y-1.5">
        <Label>Type de zone</Label>
        <Select value={type} onValueChange={(v) => setType(v as ZoneType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ZONE_TYPES.map((zt) => (
              <SelectItem key={zt} value={zt}>
                {zt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Site / Client associé */}
      <div className="space-y-1.5">
        <Label>Site / Client associé</Label>
        <Select value={site} onValueChange={setSite}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner un site" />
          </SelectTrigger>
          <SelectContent>
            {nomsDesSites.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Couleur */}
      <div className="space-y-1.5">
        <Label>Couleur</Label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                "h-8 w-8 rounded-full transition-all",
                color === c
                  ? "ring-2 ring-offset-2 ring-offset-background"
                  : "hover:scale-110",
              )}
              style={{
                backgroundColor: c,
                ...(color === c
                  ? ({ "--tw-ring-color": c } as React.CSSProperties)
                  : {}),
              }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      {/* Forme de la zone */}
      <div className="space-y-2">
        <Label>Forme de la zone</Label>
        {shape ? (
          <>
            {renderShapeSummary()}
            <ZonePreviewMap shape={shape} color={color} height={160} />
          </>
        ) : onStartDrawing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartDrawing("circle")}
              >
                Cercle
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartDrawing("polygon")}
              >
                Polygone
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Dessinez la forme directement sur la carte.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Aucune forme définie.</p>
        )}
      </div>

      {/* Règles d'alerte */}
      <div className="space-y-3">
        <Label>Règles d&apos;alerte</Label>
        {ALERT_LABELS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <Label className="font-normal">{label}</Label>
            <Switch
              checked={alerts[key]}
              onCheckedChange={() => toggleAlert(key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel variant (for inline sidebar use) ──────────────────────

interface ZoneFormPanelProps {
  zone: GeoZone | null;
  pendingShape: ZoneShape | null;
  onSave: (data: Omit<GeoZone, "id" | "createdAt">) => void;
  onCancel: () => void;
  onStartDrawing: (mode: "circle" | "polygon") => void;
}

export function ZoneFormPanel({
  zone,
  pendingShape,
  onSave,
  onCancel,
  onStartDrawing,
}: ZoneFormPanelProps) {
  const [name, setName] = useState(zone?.name ?? "");
  const [type, setType] = useState<ZoneType>(zone?.type ?? "Site client");
  const [site, setSite] = useState(zone?.site ?? "");
  const [color, setColor] = useState(zone?.color ?? "#22d3ee");
  const [shape, setShape] = useState<ZoneShape | null>(
    zone?.shape ?? pendingShape ?? null,
  );
  const [alerts, setAlerts] = useState<ZoneAlertRules>(
    zone?.alerts ?? { entry: true, exit: true, absence: false, parking: false },
  );

  // ── Derived-state resets (React "storing previous props" pattern) ──
  const [prevZoneId, setPrevZoneId] = useState<string | null | undefined>(
    zone?.id,
  );
  const [prevPendingShape, setPrevPendingShape] = useState(pendingShape);

  if (zone?.id !== prevZoneId) {
    setPrevZoneId(zone?.id);
    if (zone) {
      setName(zone.name);
      setType(zone.type);
      setSite(zone.site);
      setColor(zone.color);
      setShape(zone.shape);
      setAlerts(zone.alerts);
    } else {
      setName("");
      setType("Site client");
      setSite("");
      setColor("#22d3ee");
      setShape(null);
      setAlerts({ entry: true, exit: true, absence: false, parking: false });
    }
  }

  if (pendingShape !== prevPendingShape) {
    setPrevPendingShape(pendingShape);
    if (pendingShape) {
      setShape(pendingShape);
    }
  }

  const handleSave = () => {
    if (!name || !shape) return;
    onSave({ name, type, site, color, shape, alerts });
  };

  const toggleAlert = (key: keyof ZoneAlertRules) => {
    setAlerts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderShapeSummary = () => {
    if (!shape) return null;

    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {shape.kind === "circle"
            ? `Cercle — rayon: ${Math.round(shape.radius)}m`
            : `Polygone — ${shape.vertices.length} sommets`}
        </p>
        {shape.kind === "circle" && (
          <div className="space-y-1.5">
            <Label htmlFor="radius">Rayon (m)</Label>
            <Input
              id="radius"
              type="number"
              min={1}
              value={shape.radius}
              onChange={(e) => {
                const r = Number(e.target.value);
                if (r > 0) setShape({ ...shape, radius: r });
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStartDrawing("circle")}
          >
            Redessiner cercle
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStartDrawing("polygon")}
          >
            Redessiner polygone
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <ZoneFormContent
          name={name}
          setName={setName}
          type={type}
          setType={setType}
          site={site}
          setSite={setSite}
          color={color}
          setColor={setColor}
          shape={shape}
          setShape={setShape}
          alerts={alerts}
          toggleAlert={toggleAlert}
          renderShapeSummary={renderShapeSummary}
          onStartDrawing={onStartDrawing}
        />
      </div>
      <div className="shrink-0 p-3 border-t border-border/50 flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={handleSave}
          disabled={!name || !shape}
        >
          Enregistrer
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}
