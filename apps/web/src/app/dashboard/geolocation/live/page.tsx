"use client";

import { useState, useMemo, useEffect } from "react";
import { useSOSStore } from "@/lib/stores/sosStore";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Info,
  Crosshair,
  Search,
  ExternalLink,
  Clock,
  Gauge,
  Compass,
  BatteryLow,
  MapPin,
  PanelRight,
  X,
  SlidersHorizontal,
  ArrowLeft,
  History,
  ShieldAlert,
  AlertTriangle as ImmobilityIcon,
} from "lucide-react";
import {
  mockGeolocationAgents,
  GeolocationAgent,
} from "@/data/geolocation-agents";
import { mockPatrolRoutes } from "@/data/geolocation-patrols";
import {
  getAgentDayHistory,
  buildHistoryTrailGeoJson,
  interpolateHistoryPosition,
  computeCumulativeDistances,
} from "@/data/geolocation-agent-history";
import type { HistoricalPosition } from "@/data/geolocation-agent-history";
import { AgentMap } from "@/components/geolocation/AgentMap";
import { AgentHistoryControls } from "@/components/geolocation/AgentHistoryControls";
import { AgentHistoryTimeline } from "@/components/geolocation/AgentHistoryTimeline";
import { cn, getInitials } from "@/lib/utils";

const STATUS_OPTIONS: GeolocationAgent["status"][] = [
  "En poste",
  "En déplacement",
  "Hors ligne",
];

const STATUS_CONFIG: Record<
  GeolocationAgent["status"],
  { dot: string; ring: string; badge: string }
> = {
  "En poste": {
    dot: "bg-green-500",
    ring: "ring-green-500/30",
    badge: "border-green-500/30 text-green-400 bg-green-500/10",
  },
  "En déplacement": {
    dot: "bg-blue-500",
    ring: "ring-blue-500/30",
    badge: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  },
  "Hors ligne": {
    dot: "bg-gray-500",
    ring: "ring-gray-500/20",
    badge: "border-gray-500/30 text-gray-400 bg-gray-500/10",
  },
};

function getBatteryClasses(value: number): { fill: string; text: string } {
  if (value < 20) return { fill: "bg-red-500", text: "text-red-400" };
  if (value < 50) return { fill: "bg-amber-400", text: "text-amber-400" };
  return { fill: "bg-emerald-500", text: "text-emerald-400" };
}

function getCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] as const;
  return dirs[Math.round(deg / 45) % 8];
}

function AgentAvatar({
  name,
  status,
  offline,
  size = "sm",
}: {
  name: string;
  status: GeolocationAgent["status"];
  offline: boolean;
  size?: "sm" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-11 w-11 text-sm" : "h-8 w-8 text-[11px]";
  return (
    <div
      className={cn(
        "rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground shrink-0 ring-2 transition-opacity",
        sizeClass,
        STATUS_CONFIG[status].ring,
        offline && "opacity-40",
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}

function BatteryBar({ value }: { value: number }) {
  const { fill } = getBatteryClasses(value);
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full", fill)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground">
        {value}%
      </span>
    </div>
  );
}

// Stateless — parent owns the single clock tick, passed as prop
function LastSeen({ iso, now }: { iso: string; now: number }) {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60000);
  return (
    <span
      aria-label={
        minutes === 0 ? "connecté maintenant" : `vu il y a ${minutes} minutes`
      }
      className={cn(
        "text-[10px] tabular-nums font-medium",
        minutes === 0
          ? "text-emerald-500"
          : minutes < 10
            ? "text-muted-foreground"
            : "text-amber-400",
      )}
      suppressHydrationWarning
    >
      {minutes === 0 ? "live" : `${minutes}m`}
    </span>
  );
}

function PositionHistoryTable({
  positions,
}: {
  positions: HistoricalPosition[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/40 text-muted-foreground">
            <th className="py-2 pr-2 text-left font-medium">Heure</th>
            <th className="py-2 pr-2 text-left font-medium">Lat</th>
            <th className="py-2 pr-2 text-left font-medium">Lon</th>
            <th className="py-2 pr-2 text-right font-medium">Vitesse</th>
            <th className="py-2 text-left font-medium">Statut</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr
              key={pos.id}
              className="border-b border-border/20 hover:bg-muted/20"
            >
              <td className="py-1.5 pr-2 tabular-nums">
                {new Date(pos.timestamp).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="py-1.5 pr-2 font-mono tabular-nums">
                {pos.latitude.toFixed(5)}
              </td>
              <td className="py-1.5 pr-2 font-mono tabular-nums">
                {pos.longitude.toFixed(5)}
              </td>
              <td className="py-1.5 pr-2 tabular-nums text-right">
                {pos.speed} km/h
              </td>
              <td className="py-1.5">
                <span className="inline-flex items-center gap-1">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      STATUS_CONFIG[pos.status]?.dot ?? "bg-gray-500",
                    )}
                  />
                  {pos.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AgentDetailContent({
  agent,
  now,
  onClose,
  historyPositions,
}: {
  agent: GeolocationAgent;
  now: number;
  onClose: () => void;
  historyPositions?: HistoricalPosition[];
}) {
  const discreteAgentIds = useSOSStore((s) => s.discreteAgentIds);
  const toggleDiscreteMode = useSOSStore((s) => s.toggleDiscreteMode);
  const [activeTab, setActiveTab] = useState<"infos" | "historique">("infos");
  const [prevAgentId, setPrevAgentId] = useState(agent.id);
  if (agent.id !== prevAgentId) {
    setPrevAgentId(agent.id);
    setActiveTab("infos");
  }
  const isOffline = agent.status === "Hors ligne";
  const isMoving = agent.status === "En déplacement";
  const { dot, badge } = STATUS_CONFIG[agent.status];
  const { fill: batteryFill, text: batteryColor } = getBatteryClasses(
    agent.battery,
  );
  const minutesAgo = Math.floor(
    (now - new Date(agent.lastUpdate).getTime()) / 60000,
  );

  return (
    <div className="space-y-4">
      {/* Agent identity */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
        <AgentAvatar
          name={agent.name}
          status={agent.status}
          offline={isOffline}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight">{agent.name}</p>
          <p className="text-sm text-muted-foreground truncate">{agent.site}</p>
          {agent.zone && (
            <p className="text-xs text-muted-foreground/70">{agent.zone}</p>
          )}
          <Link
            href={`/dashboard/hr/collaborators/${agent.id}`}
            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors mt-1"
            onClick={onClose}
          >
            <ExternalLink className="h-3 w-3" />
            Voir le profil
          </Link>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium shrink-0",
            badge,
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              dot,
              isMoving && "animate-pulse",
            )}
          />
          {agent.status}
        </span>
      </div>

      {/* Tabs */}
      {historyPositions && historyPositions.length > 0 && (
        <div className="flex gap-1 p-0.5 rounded-lg bg-muted/30 border border-border/40">
          {(["infos", "historique"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                activeTab === tab
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "infos" ? "Infos" : "Historique"}
            </button>
          ))}
        </div>
      )}

      {activeTab === "historique" &&
      historyPositions &&
      historyPositions.length > 0 ? (
        <PositionHistoryTable positions={historyPositions} />
      ) : (
        <>
          {/* Position + time */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">
              Position
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-[10px] text-muted-foreground mb-1.5">
                  Coordonnées GPS
                </p>
                <p className="text-sm font-mono tabular-nums leading-tight">
                  {agent.latitude.toFixed(5)}
                </p>
                <p className="text-sm font-mono tabular-nums leading-tight">
                  {agent.longitude.toFixed(5)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Dernière position
                </p>
                <p className="text-sm font-medium" suppressHydrationWarning>
                  {new Date(agent.lastUpdate).toLocaleTimeString("fr-FR")}
                </p>
                {isOffline ? (
                  <p
                    className="text-xs text-amber-400 mt-0.5"
                    suppressHydrationWarning
                  >
                    il y a {minutesAgo} min
                  </p>
                ) : (
                  <p className="text-xs text-emerald-500 mt-0.5">En direct</p>
                )}
              </div>
            </div>
          </div>

          {/* Shift hours */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">
              Vacation
            </p>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/40 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm tabular-nums">
                {agent.shiftStart} – {agent.shiftEnd}
              </span>
            </div>
          </div>

          {/* Movement — only for actively moving agents */}
          {isMoving && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">
                Déplacement
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                  <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                    <Gauge className="h-3 w-3" /> Vitesse
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {agent.speed}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      km/h
                    </span>
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                  <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                    <Compass className="h-3 w-3" /> Direction
                  </p>
                  <p className="text-xl font-bold">
                    {getCardinal(agent.direction)}
                    <span className="text-sm font-normal text-muted-foreground ml-1.5">
                      {agent.direction}°
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mode discret */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">
              Mode discret
            </p>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
              <div>
                <p className="text-sm font-medium">Masquer l&apos;agent</p>
                <p className="text-xs text-muted-foreground">
                  Invisible pour les non-superviseurs
                </p>
              </div>
              <Switch
                checked={discreteAgentIds.includes(agent.id)}
                onCheckedChange={() => toggleDiscreteMode(agent.id)}
              />
            </div>
          </div>

          {/* Battery */}
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">
              Appareil
            </p>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Batterie</span>
                <span
                  className={cn("text-sm font-bold tabular-nums", batteryColor)}
                >
                  {agent.battery}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    batteryFill,
                  )}
                  style={{ width: `${agent.battery}%` }}
                />
              </div>
              {agent.battery < 20 && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                  <BatteryLow className="h-3.5 w-3.5" />
                  Batterie faible — recharge recommandée
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type SidebarView = "list" | "detail";

export default function LiveTrackingPage() {
  const searchParams = useSearchParams();
  const agents = mockGeolocationAgents;

  // Auto-select agent from URL search params (e.g. ?agent=1)
  const initialAgent = useMemo(() => {
    const agentId = searchParams.get("agent");
    if (agentId) return agents.find((a) => a.id === agentId) ?? null;
    return null;
  }, [searchParams, agents]);

  const [selectedAgent, setSelectedAgent] = useState<GeolocationAgent | null>(
    initialAgent,
  );
  const [siteFilter, setSiteFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [showNav, setShowNav] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPatrolRoutes, setShowPatrolRoutes] = useState(false);
  const [sidebarView, setSidebarView] = useState<SidebarView>(() =>
    initialAgent ? "detail" : "list",
  );

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const activeAlerts = useSOSStore((s) => s.activeAlerts);
  const discreteAgentIds = useSOSStore((s) => s.discreteAgentIds);
  const immobilityAlerts = useSOSStore((s) => s.immobilityAlerts);
  const sosAgentIds = useMemo(
    () => new Set(activeAlerts.map((a) => a.agentId)),
    [activeAlerts],
  );
  const immobilityAgentIds = useMemo(
    () => new Set(immobilityAlerts.map((a) => a.agentId)),
    [immobilityAlerts],
  );

  // History mode state
  const [historyMode, setHistoryMode] = useState(false);
  const [historyDate, setHistoryDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [historyProgress, setHistoryProgress] = useState(0);
  const [isHistoryPlaying, setIsHistoryPlaying] = useState(false);

  // Single clock tick shared by all LastSeen instances
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // History replay interval
  useEffect(() => {
    if (!isHistoryPlaying) return;
    const id = setInterval(() => {
      setHistoryProgress((p) => {
        if (p >= 1) {
          setIsHistoryPlaying(false);
          return 1;
        }
        return Math.min(1, p + 0.01);
      });
    }, 100);
    return () => clearInterval(id);
  }, [isHistoryPlaying]);

  const historyAgentId = historyMode ? (selectedAgent?.id ?? null) : null;

  // Reset progress when agent or date changes (setState-during-render pattern)
  const [prevHistoryKey, setPrevHistoryKey] = useState(
    `${historyAgentId}-${historyDate}`,
  );
  const historyKey = `${historyAgentId}-${historyDate}`;
  if (historyKey !== prevHistoryKey) {
    setPrevHistoryKey(historyKey);
    setHistoryProgress(0);
    setIsHistoryPlaying(false);
  }

  // Derived history data
  const agentDayHistory = useMemo(
    () =>
      historyMode && historyAgentId
        ? getAgentDayHistory(historyAgentId, historyDate)
        : undefined,
    [historyMode, historyAgentId, historyDate],
  );

  const historyTrailGeoJson = useMemo(
    () =>
      agentDayHistory
        ? buildHistoryTrailGeoJson(agentDayHistory.positions)
        : null,
    [agentDayHistory],
  );

  const historyCumulDists = useMemo(
    () =>
      agentDayHistory
        ? computeCumulativeDistances(agentDayHistory.positions)
        : [],
    [agentDayHistory],
  );

  const historyInterpolated = useMemo(() => {
    if (!agentDayHistory) return null;
    return interpolateHistoryPosition(
      agentDayHistory.positions,
      historyCumulDists,
      historyProgress,
    );
  }, [agentDayHistory, historyCumulDists, historyProgress]);

  const historyMarkerPos = historyInterpolated
    ? ([historyInterpolated.longitude, historyInterpolated.latitude] as [
        number,
        number,
      ])
    : null;

  const historyCurrentTime = historyInterpolated?.timestamp ?? null;

  const historyStartEnd = useMemo(() => {
    if (!agentDayHistory || agentDayHistory.positions.length < 2) return null;
    const first = agentDayHistory.positions[0];
    const last =
      agentDayHistory.positions[agentDayHistory.positions.length - 1];
    return {
      start: [first.longitude, first.latitude] as [number, number],
      end: [last.longitude, last.latitude] as [number, number],
    };
  }, [agentDayHistory]);

  const historyStats = useMemo(() => {
    if (!agentDayHistory) return undefined;
    return {
      distanceKm: agentDayHistory.totalDistanceMeters / 1000,
      durationMinutes: agentDayHistory.totalDurationMinutes,
      positionCount: agentDayHistory.positions.length,
    };
  }, [agentDayHistory]);

  const sites = useMemo(
    () => Array.from(new Set(agents.map((a) => a.site))),
    [agents],
  );

  const statusCounts = useMemo(
    () =>
      agents.reduce(
        (acc, a) => ({ ...acc, [a.status]: (acc[a.status] || 0) + 1 }),
        {} as Record<string, number>,
      ),
    [agents],
  );

  const filteredAgents = useMemo(
    () =>
      agents
        .filter((a) => {
          const siteMatch = siteFilter === "all" || a.site === siteFilter;
          const statusMatch =
            statusFilter === "all" || a.status === statusFilter;
          return siteMatch && statusMatch;
        })
        .filter(
          (a) => !discreteAgentIds.includes(a.id) || sosAgentIds.has(a.id),
        ),
    [agents, siteFilter, statusFilter, discreteAgentIds, sosAgentIds],
  );

  const listAgents = useMemo(
    () =>
      filteredAgents.filter(
        (a) =>
          search === "" ||
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.site.toLowerCase().includes(search.toLowerCase()),
      ),
    [filteredAgents, search],
  );

  const handleAgentZoom = (agent: GeolocationAgent) => setSelectedAgent(agent);

  const handleAgentDetails = (agent: GeolocationAgent) => {
    setSelectedAgent(agent);
    setSidebarView("detail");
    setShowSidebar(true);
  };

  // Shared sidebar content used in both desktop overlay and mobile Sheet
  const sidebarContent = (
    <div
      className="flex flex-col gap-2 h-full min-h-0 overflow-hidden"
      role="region"
      aria-label="Liste des agents"
    >
      <div className="relative shrink-0 px-3 pt-3">
        <Search
          className="absolute left-5.5 top-5.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un agent…"
          aria-label="Rechercher un agent"
          className="pl-8 h-8 text-xs"
        />
      </div>

      <ul className="flex-1 overflow-y-auto space-y-1 px-3 pb-3 list-none">
        {listAgents.length === 0 ? (
          <li className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Aucun agent trouvé</p>
          </li>
        ) : (
          listAgents.map((agent) => {
            const isSelected = selectedAgent?.id === agent.id;
            const isOffline = agent.status === "Hors ligne";
            const { dot } = STATUS_CONFIG[agent.status];

            return (
              <li key={agent.id} className="relative">
                <div
                  className={cn(
                    "group relative flex items-center gap-0 rounded-lg border transition-all duration-150 overflow-hidden",
                    isSelected
                      ? "border-cyan-500/40 bg-cyan-500/5"
                      : "border-border/60 hover:border-border hover:bg-muted/30",
                  )}
                >
                  {isSelected && (
                    <span
                      className="absolute left-0 inset-y-0 w-[2px] rounded-r-full bg-cyan-400"
                      aria-hidden="true"
                    />
                  )}

                  <button
                    onClick={() => handleAgentZoom(agent)}
                    className="flex-1 flex items-start gap-2.5 p-2.5 text-left min-w-0"
                    aria-label={`Localiser ${agent.name} sur la carte`}
                    aria-current={isSelected ? "true" : undefined}
                  >
                    <AgentAvatar
                      name={agent.name}
                      status={agent.status}
                      offline={isOffline}
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <p
                          className={cn(
                            "text-xs font-semibold leading-none truncate",
                            isOffline && "opacity-50",
                          )}
                        >
                          {agent.name}
                        </p>
                        {historyMode && historyAgentId === agent.id ? (
                          <span className="flex items-center gap-0.5 text-[10px] text-cyan-400 font-medium">
                            <History className="h-2.5 w-2.5" />
                            hist.
                          </span>
                        ) : (
                          <LastSeen iso={agent.lastUpdate} now={now} />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {agent.site}
                      </p>
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-1">
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              dot,
                              isOffline && "opacity-40",
                            )}
                            aria-hidden="true"
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {agent.status}
                          </span>
                          {sosAgentIds.has(agent.id) && (
                            <ShieldAlert className="h-3.5 w-3.5 text-red-400 motion-safe:animate-pulse" />
                          )}
                          {immobilityAgentIds.has(agent.id) && (
                            <ImmobilityIcon className="h-3.5 w-3.5 text-amber-400" />
                          )}
                        </div>
                        <BatteryBar value={agent.battery} />
                      </div>
                    </div>
                  </button>

                  <div className="pr-2 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded opacity-40 hover:opacity-100 focus:opacity-100 hover:bg-accent transition-all"
                          aria-label={`Actions pour ${agent.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-36">
                        <DropdownMenuItem
                          onClick={() => handleAgentDetails(agent)}
                        >
                          <Info className="h-3.5 w-3.5 mr-2 shrink-0" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAgentZoom(agent)}
                        >
                          <Crosshair className="h-3.5 w-3.5 mr-2 shrink-0" />
                          Localiser
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
    </div>
  );

  return (
    <div className="relative h-full">
      {/* Full-page map */}
      <AgentMap
        agents={historyMode ? [] : filteredAgents}
        selectedAgent={historyMode ? null : selectedAgent}
        onAgentClick={handleAgentZoom}
        initialCenter={
          initialAgent
            ? {
                longitude: initialAgent.longitude,
                latitude: initialAgent.latitude,
                zoom: 15,
              }
            : undefined
        }
        patrolRoutes={historyMode ? undefined : mockPatrolRoutes}
        showPatrolRoutes={historyMode ? false : showPatrolRoutes}
        onTogglePatrolRoutes={
          historyMode ? undefined : () => setShowPatrolRoutes((prev) => !prev)
        }
        historyMode={historyMode}
        historyTrail={historyTrailGeoJson}
        historyMarkerPosition={historyMarkerPos}
        historyStartEnd={historyStartEnd}
        sosAgentIds={sosAgentIds}
        className="absolute inset-0"
      />

      {/* Empty state when history mode but no agent selected */}
      {historyMode && !agentDayHistory && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-center">
            <History className="h-8 w-8 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground/50">
              Sélectionnez un agent pour afficher son historique
            </p>
          </div>
        </div>
      )}

      {/* Merged nav overlay (header + toolbar) */}
      {showNav && (
        <div className="absolute top-3 left-3 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl shadow-lg overflow-hidden min-w-[480px] max-w-[calc(100vw-24px)]">
          {/* Header row */}
          <div className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h1 className="text-lg font-bold tracking-tight">
                  {historyMode
                    ? "Historique des Positions"
                    : "Suivi en Temps Réel"}
                </h1>
                {historyMode ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    aria-label="Mode historique"
                  >
                    <History className="h-3 w-3" />
                    Historique
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-red-500/10 text-red-400 border border-red-500/20"
                    aria-label="Flux en direct"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"
                      aria-hidden="true"
                    />
                    Live
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {historyMode
                  ? "Parcours et positions enregistrées"
                  : `${filteredAgents.length} agent${filteredAgents.length > 1 ? "s" : ""} · ${sites.length} site${sites.length > 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setHistoryMode((prev) => !prev);
                  setIsHistoryPlaying(false);
                }}
                className={cn(
                  "h-7 px-2.5 flex items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-colors",
                  historyMode
                    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                    : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                )}
                aria-label={
                  historyMode
                    ? "Retour au mode live"
                    : "Passer en mode historique"
                }
                aria-pressed={historyMode}
              >
                <History className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {historyMode ? "Live" : "Historique"}
                </span>
              </button>
              <button
                onClick={() => setShowNav(false)}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
                aria-label="Masquer les filtres"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {/* Filter / Controls row */}
          <div
            className="px-5 pb-3 flex items-center gap-2 flex-wrap"
            role="toolbar"
            aria-label={historyMode ? "Contrôles historique" : "Filtres"}
          >
            {historyMode ? (
              <AgentHistoryControls
                date={historyDate}
                onDateChange={setHistoryDate}
                selectedAgentName={agentDayHistory?.agentName}
                onOpenAgentList={() => setMobileSheetOpen(true)}
                stats={historyStats}
              />
            ) : (
              <>
                <label htmlFor="site-filter" className="sr-only">
                  Filtrer par site
                </label>
                <select
                  id="site-filter"
                  value={siteFilter}
                  onChange={(e) => setSiteFilter(e.target.value)}
                  className="h-8 text-xs rounded-md border border-input bg-background px-2.5 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="all">Tous les sites</option>
                  {sites.map((site) => (
                    <option key={site} value={site}>
                      {site}
                    </option>
                  ))}
                </select>

                <div className="h-4 w-px bg-border" aria-hidden="true" />

                <div
                  className="flex gap-1"
                  role="group"
                  aria-label="Filtrer par statut"
                >
                  <button
                    onClick={() => setStatusFilter("all")}
                    aria-pressed={statusFilter === "all"}
                    className={cn(
                      "h-8 px-3 text-xs rounded-md border transition-colors",
                      statusFilter === "all"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input text-muted-foreground hover:bg-accent",
                    )}
                  >
                    Tous{" "}
                    <span
                      className="ml-1 opacity-60 tabular-nums"
                      aria-hidden="true"
                    >
                      {agents.length}
                    </span>
                  </button>
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      aria-pressed={statusFilter === status}
                      className={cn(
                        "h-8 px-3 text-xs rounded-md border transition-colors flex items-center gap-1.5",
                        statusFilter === status
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input text-muted-foreground hover:bg-accent",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          STATUS_CONFIG[status].dot,
                        )}
                        aria-hidden="true"
                      />
                      {status}
                      <span
                        className="opacity-60 tabular-nums"
                        aria-hidden="true"
                      >
                        {statusCounts[status] ?? 0}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Nav toggle when hidden */}
      {!showNav && (
        <button
          onClick={() => setShowNav(true)}
          className="absolute top-3 left-3 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl p-2.5 shadow-lg"
          aria-label="Afficher les filtres"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      )}

      {/* Desktop sidebar overlay (right side) */}
      {showSidebar && (
        <div className="hidden lg:flex absolute top-3 right-3 bottom-3 z-10 w-96 flex-col bg-background/80 backdrop-blur-md border border-border/50 rounded-xl shadow-lg overflow-hidden">
          {/* Sidebar header with dismiss */}
          <div className="flex items-center justify-between px-3 pt-2.5 pb-1 shrink-0">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {sidebarView === "list" ? "Agents" : "Détails"}
            </span>
            <button
              onClick={() => setShowSidebar(false)}
              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground"
              aria-label="Fermer le panneau"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {sidebarView === "list"
            ? sidebarContent
            : selectedAgent && (
                <div className="flex flex-col h-full">
                  <button
                    onClick={() => setSidebarView("list")}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors p-3 pb-0"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour
                  </button>
                  <ScrollArea className="flex-1">
                    <div className="p-3">
                      <AgentDetailContent
                        agent={selectedAgent}
                        now={now}
                        onClose={() => setSidebarView("list")}
                        historyPositions={
                          historyMode &&
                          agentDayHistory?.agentId === selectedAgent.id
                            ? agentDayHistory.positions
                            : undefined
                        }
                      />
                    </div>
                  </ScrollArea>
                </div>
              )}
        </div>
      )}

      {/* Desktop sidebar toggle when hidden */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="hidden lg:flex absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl p-2.5 shadow-lg"
          aria-label="Afficher la liste"
        >
          <PanelRight className="h-4 w-4" />
        </button>
      )}

      {/* History timeline bar */}
      {historyMode && agentDayHistory && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
          <AgentHistoryTimeline
            progress={historyProgress}
            onProgressChange={setHistoryProgress}
            isPlaying={isHistoryPlaying}
            onTogglePlay={() => {
              if (historyProgress >= 1) setHistoryProgress(0);
              setIsHistoryPlaying((p) => !p);
            }}
            startTime={agentDayHistory.positions[0]?.timestamp ?? null}
            endTime={
              agentDayHistory.positions[agentDayHistory.positions.length - 1]
                ?.timestamp ?? null
            }
            currentTime={historyCurrentTime}
          />
        </div>
      )}

      {/* Mobile sidebar toggle */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetTrigger asChild>
          <button className="lg:hidden absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl p-2.5 shadow-lg">
            <PanelRight className="h-4 w-4" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-96 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </div>
  );
}
