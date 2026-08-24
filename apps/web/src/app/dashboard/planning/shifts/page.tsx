"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BREAK_DURATION_OPTIONS } from "@/lib/planning-constants";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RotateCcw,
  Plus,
  MapPin,
  Clock,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Sun,
  Sunset,
  Moon,
  Coffee,
} from "lucide-react";
import type { StandardShift } from "@/lib/types";
import {
  useShiftTemplates,
  useCreateShiftTemplate,
  useDeleteShiftTemplate,
} from "@/hooks/contracts";
import { usePlanningSites } from "@/hooks/planning";
import { SITE_COLOR_MAP } from "@/lib/site-colors";

// ─── helpers ────────────────────────────────────────────────────────────────

function calcDuration(start: string, end: string, breakMin: number): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins <= startMins) endMins += 24 * 60;
  return Math.max(0, (endMins - startMins - breakMin) / 60);
}

function formatDuration(h: number): string {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins.toString().padStart(2, "0")}`;
}

function getPeriodIcon(startTime: string) {
  const hour = parseInt(startTime.split(":")[0], 10);
  if (hour >= 5 && hour < 12)
    return <Sun className="h-3.5 w-3.5 text-amber-500" />;
  if (hour >= 12 && hour < 18)
    return <Sunset className="h-3.5 w-3.5 text-orange-400" />;
  return <Moon className="h-3.5 w-3.5 text-indigo-400" />;
}

function getPeriodLabel(startTime: string): string {
  const h = parseInt(startTime.split(":")[0], 10);
  if (h >= 5 && h < 12) return "Matin";
  if (h >= 12 && h < 18) return "Après-midi";
  return "Nuit";
}

const SHIFT_COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#10b981",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

type ShiftFormData = {
  siteId: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  color: string;
  isSplitShift: boolean;
  startTime2: string;
  endTime2: string;
};

const DEFAULT_FORM: ShiftFormData = {
  siteId: "",
  name: "",
  startTime: "08:00",
  endTime: "16:00",
  breakDuration: 30,
  color: "#3b82f6",
  isSplitShift: false,
  startTime2: "14:00",
  endTime2: "17:00",
};

// ─── page ────────────────────────────────────────────────────────────────────

export default function ShiftsPage() {
  const { sites: mockSites } = usePlanningSites();

  const searchParams = useSearchParams();
  // Modeles de vacation enregistres en base (table shift_template).
  const { data: modeles = [] } = useShiftTemplates();
  const creerModele = useCreateShiftTemplate();
  const supprimerModele = useDeleteShiftTemplate();

  const shifts: StandardShift[] = modeles.map((m) => ({
    id: m.id,
    siteId: m.siteId,
    name: m.name,
    startTime: m.startTime,
    endTime: m.endTime,
    breakDuration: m.breakDuration,
    color: m.color,
    createdAt: new Date(m.createdAt),
    updatedAt: new Date(m.updatedAt),
  }));
  const [selectedShift, setSelectedShift] = useState<StandardShift | null>(
    null,
  );
  const [shiftToDelete, setShiftToDelete] = useState<StandardShift | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState<ShiftFormData>(DEFAULT_FORM);

  // Sync with URL on mount
  const showCreateFromUrl = searchParams.get("create") === "true";

  // ─── derived stats ───────────────────────────────────────────────────────

  const totalShifts = shifts.length;
  const { sitesWithShifts, avgDuration, nightShifts } = useMemo(() => {
    const sites = new Set(shifts.map((s) => s.siteId)).size;
    const avg =
      shifts.length > 0
        ? shifts.reduce(
            (acc, s) =>
              acc + calcDuration(s.startTime, s.endTime, s.breakDuration),
            0,
          ) / shifts.length
        : 0;
    const night = shifts.filter((s) => {
      const h = parseInt(s.startTime.split(":")[0], 10);
      return h >= 20 || h < 5;
    }).length;
    return { sitesWithShifts: sites, avgDuration: avg, nightShifts: night };
  }, [shifts]);

  // Create lookup maps for O(1) site access
  const siteNameMap = useMemo(
    () => new Map(mockSites.map((s) => [s.id, s.name])),
    [mockSites],
  );
  const siteColorMap = useMemo(
    () => new Map(mockSites.map((s) => [s.id, s.color])),
    [mockSites],
  );
  const siteClientMap = useMemo(
    () => new Map(mockSites.map((s) => [s.id, s.clientName])),
    [mockSites],
  );

  const getSiteName = (siteId: string) => siteNameMap.get(siteId) ?? siteId;
  const getSiteClient = (siteId: string) => siteClientMap.get(siteId) ?? "";

  // ─── handlers ────────────────────────────────────────────────────────────

  const handleView = (shift: StandardShift) => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedShift(shift);
    setIsViewModalOpen(true);
  };

  const handleEdit = (shift: StandardShift) => {
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedShift(shift);
    setFormData({
      siteId: shift.siteId,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDuration: shift.breakDuration,
      color: shift.color,
      isSplitShift: false,
      startTime2: "14:00",
      endTime2: "17:00",
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (shift: StandardShift) => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setShiftToDelete(shift);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!shiftToDelete) return;
    try {
      await supprimerModele.mutateAsync(shiftToDelete.id);
    } catch (e) {
      alert(
        `Échec de la suppression : ${
          e instanceof Error ? e.message : "erreur inconnue"
        }`,
      );
    }
    setIsDeleteModalOpen(false);
    setShiftToDelete(null);
  };

  const handleOpenCreate = () => {
    setFormData({ ...DEFAULT_FORM, siteId: mockSites[0]?.id ?? "" });
    setIsCreateModalOpen(true);
  };

  const handleSave = async (isEdit: boolean) => {
    const payload = {
      siteId: formData.siteId,
      name: formData.name,
      startTime: formData.startTime,
      endTime: formData.endTime,
      breakDuration: formData.breakDuration,
      color: formData.color,
    };
    try {
      // La modification passe par un remplacement : suppression puis creation,
      // ce qui evite un endpoint supplementaire pour un cas rare.
      if (isEdit && selectedShift) {
        await supprimerModele.mutateAsync(selectedShift.id);
      }
      await creerModele.mutateAsync(payload);
      setIsEditModalOpen(false);
      setIsCreateModalOpen(false);
    } catch (e) {
      alert(
        `Échec de l'enregistrement : ${
          e instanceof Error ? e.message : "erreur inconnue"
        }`,
      );
    }
  };

  // ─── table columns ────────────────────────────────────────────────────────

  const columns: ColumnDef<StandardShift>[] = [
    {
      key: "name",
      label: "Nom",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
            style={{ backgroundColor: s.color }}
          >
            {s.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-sm">{s.name}</span>
        </div>
      ),
    },
    {
      key: "startTime",
      label: "Horaires",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-1.5 text-sm">
          {getPeriodIcon(s.startTime)}
          <span>
            {s.startTime} – {s.endTime}
          </span>
        </div>
      ),
    },
    {
      key: "breakDuration",
      label: "Pause",
      render: (s) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Coffee className="h-3.5 w-3.5 shrink-0" />
          <span>
            {s.breakDuration === 0 ? "Aucune" : `${s.breakDuration} min`}
          </span>
        </div>
      ),
    },
    {
      key: "duration",
      label: "Durée nette",
      render: (s) => {
        const dur = calcDuration(s.startTime, s.endTime, s.breakDuration);
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">{formatDuration(dur)}</span>
          </div>
        );
      },
    },
    {
      key: "period",
      label: "Période",
      render: (s) => (
        <Badge variant="outline" className="gap-1 text-xs">
          {getPeriodIcon(s.startTime)}
          {getPeriodLabel(s.startTime)}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (s) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(s)}>
                <Eye className="h-4 w-4 mr-2 text-green-600" /> Voir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(s)}>
                <Pencil className="h-4 w-4 mr-2 text-orange-500" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive"
                className="text-destructive"
                onClick={() => handleDeleteClick(s)}
              >
                <Trash2 className="h-4 w-4 mr-2 text-red-600" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  // ─── form body (shared between create/edit) ───────────────────────────────

  const formBody = (showSite: boolean) => {
    const dur = calcDuration(
      formData.startTime,
      formData.endTime,
      formData.breakDuration,
    );
    const dur2 = formData.isSplitShift
      ? calcDuration(formData.startTime2, formData.endTime2, 0)
      : 0;
    const totalDur = dur + dur2;
    return (
      <div className="space-y-6">
        {showSite && (
          <div>
            <Label className="text-base font-semibold mb-3 block">Site</Label>
            <Select
              value={formData.siteId}
              onValueChange={(value) =>
                setFormData((f) => ({ ...f, siteId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un site" />
              </SelectTrigger>
              <SelectContent>
                {mockSites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name} — {site.address.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label className="text-base font-semibold mb-3 block">
            Nom du shift
          </Label>
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="Ex: Matin, Après-midi, Nuit..."
            className="text-base"
          />
        </div>

        {/* Live preview */}
        {formData.name && (
          <div
            className="relative h-20 rounded-lg border-l-4 p-4 shadow-sm overflow-hidden flex items-center gap-4"
            style={{
              backgroundColor: formData.color,
              borderLeftColor: formData.color,
            }}
          >
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
            >
              {formData.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold text-base">
                {formData.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className="bg-white/20 text-white border-0 text-xs gap-1">
                  <Clock className="h-3 w-3" />
                  {formData.startTime} – {formData.endTime}
                </Badge>
                {formData.isSplitShift && (
                  <Badge className="bg-white/20 text-white border-0 text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    {formData.startTime2} – {formData.endTime2}
                  </Badge>
                )}
                {formData.breakDuration > 0 && (
                  <span className="text-white/80 text-xs">
                    Pause {formData.breakDuration}min
                  </span>
                )}
                <span className="text-white/80 text-xs font-medium">
                  {formatDuration(totalDur)} travaillées
                </span>
              </div>
            </div>
          </div>
        )}

        <div>
          <Label className="text-base font-semibold mb-3 block">Horaires</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm mb-2 block">Début</Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, startTime: e.target.value }))
                }
                className="text-base"
              />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Fin</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, endTime: e.target.value }))
                }
                className="text-base"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Switch
              checked={formData.isSplitShift}
              onCheckedChange={(checked) =>
                setFormData((f) => ({ ...f, isSplitShift: checked }))
              }
            />
            <Label>Shift coupé (2 plages horaires)</Label>
          </div>

          {formData.isSplitShift && (
            <div className="mt-4">
              <Label className="text-sm font-semibold mb-2 block">
                Plage horaire 2
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-2 block">Début</Label>
                  <Input
                    type="time"
                    value={formData.startTime2}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        startTime2: e.target.value,
                      }))
                    }
                    className="text-base"
                  />
                </div>
                <div>
                  <Label className="text-sm mb-2 block">Fin</Label>
                  <Input
                    type="time"
                    value={formData.endTime2}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, endTime2: e.target.value }))
                    }
                    className="text-base"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <Label className="text-base font-semibold mb-3 block">
            Durée de pause
          </Label>
          <Select
            value={String(formData.breakDuration)}
            onValueChange={(value) =>
              setFormData((f) => ({ ...f, breakDuration: Number(value) }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner la durée" />
            </SelectTrigger>
            <SelectContent>
              {BREAK_DURATION_OPTIONS.map((min) => (
                <SelectItem key={min} value={String(min)}>
                  {min === 0 ? "Aucune" : `${min} minutes`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-base font-semibold mb-3 block">Couleur</Label>
          <div className="flex gap-3 flex-wrap">
            {SHIFT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData((f) => ({ ...f, color }))}
                className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                  formData.color === color
                    ? "border-foreground scale-110 shadow-md"
                    : "border-border"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── view modal body ──────────────────────────────────────────────────────

  const viewBody = (shift: StandardShift) => {
    const dur = calcDuration(
      shift.startTime,
      shift.endTime,
      shift.breakDuration,
    );
    const site = mockSites.find((s) => s.id === shift.siteId);
    return (
      <div className="space-y-6">
        {/* Hero card */}
        <div
          className="relative h-24 rounded-xl border-l-4 p-5 shadow-sm flex items-center gap-4 overflow-hidden"
          style={{ backgroundColor: shift.color, borderLeftColor: shift.color }}
        >
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
          >
            {shift.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-bold text-xl">{shift.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-white/20 text-white border-0 gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {shift.startTime} – {shift.endTime}
              </Badge>
              <Badge className="bg-white/20 text-white border-0 text-xs">
                {getPeriodLabel(shift.startTime)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Horaires
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Début</span>
                <span className="font-medium flex items-center gap-1.5">
                  {getPeriodIcon(shift.startTime)}
                  {shift.startTime}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fin</span>
                <span className="font-medium">{shift.endTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pause</span>
                <span className="font-medium flex items-center gap-1.5">
                  <Coffee className="h-3.5 w-3.5 text-muted-foreground" />
                  {shift.breakDuration === 0
                    ? "Aucune"
                    : `${shift.breakDuration} min`}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-1">
                <span className="text-muted-foreground">Durée nette</span>
                <span className="font-bold text-base flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatDuration(dur)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Site
            </p>
            {site ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{site.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {site.clientName}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  {site.address.street}, {site.address.city}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
            <div className="border-t border-border/40 pt-2 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Créé le</span>
                <span className="text-xs">
                  {new Date(shift.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">
                  Modifié le
                </span>
                <span className="text-xs">
                  {new Date(shift.updatedAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Other shifts on same site */}
        {(() => {
          const siblings = shifts.filter(
            (s) => s.siteId === shift.siteId && s.id !== shift.id,
          );
          if (siblings.length === 0) return null;
          return (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Autres shifts sur ce site
              </p>
              <div className="flex flex-wrap gap-2">
                {siblings.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: s.color }}
                  >
                    {getPeriodIcon(s.startTime)}
                    {s.name} · {s.startTime}–{s.endTime}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RotateCcw className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-serif text-3xl font-light tracking-tight">
              Shifts
            </h1>
            <p className="mt-1 text-sm font-light text-muted-foreground">
              Modèles de shifts utilisés pour l&apos;affectation des agents par
              site
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau shift
        </Button>
      </div>

      {/* Stats */}
      <InfoCardContainer>
        <InfoCard
          icon={RotateCcw}
          title="Total shifts"
          value={totalShifts}
          color="blue"
        />
        <InfoCard
          icon={MapPin}
          title="Sites couverts"
          value={sitesWithShifts}
          subtext={`sur ${mockSites.length} sites`}
          color="green"
        />
        <InfoCard
          icon={Clock}
          title="Durée moyenne"
          value={`${formatDuration(avgDuration)}`}
          color="indigo"
        />
        <InfoCard
          icon={Moon}
          title="Shifts de nuit"
          value={nightShifts}
          color="purple"
        />
      </InfoCardContainer>

      {/* Table grouped by site */}
      <DataTable
        data={shifts}
        columns={columns}
        getSearchValue={(s) => `${s.name} ${getSiteName(s.siteId)}`}
        searchPlaceholder="Rechercher par nom ou site..."
        groupBy="siteId"
        groupByLabel={(v) => {
          const siteId = v as string;
          const color = siteColorMap.get(siteId) ?? "blue";
          const cls = SITE_COLOR_MAP[color as keyof typeof SITE_COLOR_MAP];
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold text-white ${cls.bg}`}
            >
              {getSiteName(siteId)}
              <span className="font-normal opacity-80">
                — {getSiteClient(siteId)}
              </span>
            </span>
          );
        }}
        groupByRowClassName={() => ""}
        groupByOptions={mockSites.map((s) => ({ value: s.id, label: s.name }))}
        getRowId={(s) => s.id}
        onRowClick={handleView}
        itemsPerPage={50}
      />

      {/* Create modal */}
      <Modal
        open={showCreateFromUrl || isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            // Clear the URL param when modal is closed
            window.history.pushState({}, "", window.location.pathname);
          }
        }}
        type="form"
        title="Nouveau shift"
        description="Définir un modèle de shift pour un site"
        size="md"
        actions={{
          primary: {
            label: "Créer",
            onClick: () => void handleSave(false),
            disabled: !formData.name || !formData.siteId,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
        }}
      >
        {formBody(true)}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        type="form"
        title="Modifier le shift"
        description={
          selectedShift
            ? `${selectedShift.name} — ${getSiteName(selectedShift.siteId)}`
            : undefined
        }
        size="md"
        actions={{
          primary: {
            label: "Enregistrer",
            onClick: () => void handleSave(true),
            disabled: !formData.name,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsEditModalOpen(false),
            variant: "outline",
          },
        }}
      >
        {formBody(false)}
      </Modal>

      {/* View modal */}
      {selectedShift && (
        <Modal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          type="details"
          title={selectedShift.name}
          description={getSiteName(selectedShift.siteId)}
          size="md"
          actions={{
            primary: {
              label: "Modifier",
              onClick: () => {
                setIsViewModalOpen(false);
                handleEdit(selectedShift);
              },
            },
            secondary: {
              label: "Fermer",
              onClick: () => setIsViewModalOpen(false),
              variant: "outline",
            },
          }}
        >
          {viewBody(selectedShift)}
        </Modal>
      )}

      {/* Delete confirmation */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        type="warning"
        title="Supprimer le shift"
        description={
          shiftToDelete
            ? `Supprimer le shift "${shiftToDelete.name}" du site ${getSiteName(shiftToDelete.siteId)} ? Les affectations utilisant ce modèle ne seront pas affectées.`
            : ""
        }
        actions={{
          primary: {
            label: "Supprimer",
            onClick: () => void handleConfirmDelete(),
            variant: "destructive",
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsDeleteModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div />
      </Modal>
    </div>
  );
}
