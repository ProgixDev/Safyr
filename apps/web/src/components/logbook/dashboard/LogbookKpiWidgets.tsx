"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  MapPin,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import type { LogbookEvent } from "@/data/logbook-events";
import { useEvenementsMainCourante } from "./evenements-reels";

interface KpiWidgetProps {
  isLoading: boolean;
}

type AnalyticsData = {
  totalIncidents: number;
  criticalIncidents: number;
  resolvedIncidents: number;
  resolutionRate: string;
  avgResolutionTime: string;
  totalRounds: number;
  avgRoundInterval: string;
  agentsInvolved: number;
  hseIncidents: number;
  topZones: [string, number][];
  trendData: { date: string; evenements: number }[];
  pieData: { name: string; value: number; color: string }[];
  typeData: { type: string; count: number }[];
  siteData: { site: string; count: number }[];
  heatmapData: { day: string; dayIndex: number; hour: number; count: number }[];
  resolutionTrendData: { date: string; rate: number }[];
};

const DARK_TOOLTIP_STYLE = {
  contentStyle: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#f1f5f9",
    fontSize: 12,
  },
  labelStyle: { color: "#94a3b8" },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22d3ee",
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critique",
  high: "Haute",
  medium: "Moyenne",
  low: "Faible",
};

const TYPE_LABELS: Record<string, string> = {
  routine: "Routine",
  incident: "Incident",
  action: "Action",
  control: "Contrôle",
  critical: "Critique",
};

/** Delai moyen entre la survenue d'un evenement et sa validation. */
function delaiMoyenValidation(events: LogbookEvent[]): string {
  const delais = events
    .map((e) => {
      const valide = (e as unknown as { validatedAt?: string | null })
        .validatedAt;
      if (!valide) return null;
      return new Date(valide).getTime() - new Date(e.timestamp).getTime();
    })
    .filter((v): v is number => v !== null && v >= 0);
  if (delais.length === 0) return "—";
  const heures = delais.reduce((s, v) => s + v, 0) / delais.length / 3_600_000;
  return heures < 1
    ? `${Math.round(heures * 60)} min`
    : `${heures.toFixed(1)} h`;
}

/** Intervalle moyen entre deux rondes consecutives. */
function intervalleMoyenRondes(events: LogbookEvent[]): string {
  const rondes = events
    .filter((e) => e.title.toLowerCase().includes("ronde"))
    .map((e) => new Date(e.timestamp).getTime())
    .sort((a, b) => a - b);
  if (rondes.length < 2) return "—";
  const total = rondes[rondes.length - 1] - rondes[0];
  const minutes = total / (rondes.length - 1) / 60_000;
  return minutes < 90
    ? `${Math.round(minutes)} min`
    : `${(minutes / 60).toFixed(1)} h`;
}

function computeAnalytics(events: LogbookEvent[]): AnalyticsData {
  const totalIncidents = events.filter((e) => e.type === "incident").length;
  const criticalIncidents = events.filter(
    (e) => e.severity === "critical",
  ).length;
  const resolvedIncidents = events.filter(
    (e) => e.status === "resolved",
  ).length;
  const resolutionRate =
    totalIncidents > 0
      ? ((resolvedIncidents / totalIncidents) * 100).toFixed(1)
      : "0";

  const totalRounds = events.filter(
    (e) => e.type === "action" && e.title.toLowerCase().includes("ronde"),
  ).length;
  const agentsInvolved = new Set(events.map((e) => e.agentId)).size;
  const hseIncidents = events.filter(
    (e) => e.tags?.includes("hse") || e.tags?.includes("sst"),
  ).length;

  const zoneData = events.reduce(
    (acc, e) => {
      const zone = e.zone || e.site;
      acc[zone] = (acc[zone] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const topZones = Object.entries(zoneData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const dayBuckets: Record<string, number> = {};
  for (const e of events) {
    const d = new Date(e.timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
    dayBuckets[d] = (dayBuckets[d] || 0) + 1;
  }
  const trendData = Object.entries(dayBuckets)
    .sort((a, b) => {
      const [da, ma] = a[0].split("/").map(Number);
      const [db, mb] = b[0].split("/").map(Number);
      return ma !== mb ? ma - mb : da - db;
    })
    .map(([date, count]) => ({ date, evenements: count }));

  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  for (const e of events) {
    if (e.severity in severityCounts) {
      severityCounts[e.severity] += 1;
    }
  }
  const pieData = Object.entries(severityCounts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: SEVERITY_LABELS[k] ?? k,
      value: v,
      color: SEVERITY_COLORS[k] ?? "#94a3b8",
    }));

  const typeCounts: Record<string, number> = {
    routine: 0,
    incident: 0,
    action: 0,
    control: 0,
    critical: 0,
  };
  for (const e of events) {
    if (e.type in typeCounts) {
      typeCounts[e.type] += 1;
    }
  }
  const typeData = Object.entries(typeCounts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ type: TYPE_LABELS[k] ?? k, count: v }));

  const siteCounts: Record<string, number> = {};
  for (const e of events) {
    siteCounts[e.site] = (siteCounts[e.site] || 0) + 1;
  }
  const siteData = Object.entries(siteCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([site, count]) => ({ site, count }));

  const dayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const heatmapMap: Record<string, number> = {};
  for (const e of events) {
    const d = new Date(e.timestamp);
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const hour = d.getHours();
    const key = `${day}-${hour}`;
    heatmapMap[key] = (heatmapMap[key] || 0) + 1;
  }
  const heatmapData = Object.entries(heatmapMap).map(([key, count]) => {
    const [dayIndex, hour] = key.split("-").map(Number);
    return { day: dayLabels[dayIndex], dayIndex, hour, count };
  });

  const resolutionByDay: Record<string, { total: number; resolved: number }> =
    {};
  for (const e of events) {
    if (e.type !== "incident") continue;
    const d = new Date(e.timestamp).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
    if (!resolutionByDay[d]) resolutionByDay[d] = { total: 0, resolved: 0 };
    resolutionByDay[d].total += 1;
    if (e.status === "resolved") resolutionByDay[d].resolved += 1;
  }
  const resolutionTrendData = Object.entries(resolutionByDay)
    .sort((a, b) => {
      const [da, ma] = a[0].split("/").map(Number);
      const [db, mb] = b[0].split("/").map(Number);
      return ma !== mb ? ma - mb : da - db;
    })
    .map(([date, { total, resolved }]) => ({
      date,
      rate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    }));

  return {
    totalIncidents,
    criticalIncidents,
    resolvedIncidents,
    resolutionRate,
    avgResolutionTime: delaiMoyenValidation(events),
    totalRounds,
    avgRoundInterval: intervalleMoyenRondes(events),
    agentsInvolved,
    hseIncidents,
    topZones,
    trendData,
    pieData,
    typeData,
    siteData,
    heatmapData,
    resolutionTrendData,
  };
}

/** Indicateurs de la main courante calcules sur les evenements enregistres. */
function useAnalytique(): AnalyticsData {
  const evenements = useEvenementsMainCourante();
  return useMemo(() => computeAnalytics(evenements), [evenements]);
}

function SmallSkeletonCard() {
  return (
    <Card className="glass-card border-border/40 h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  );
}

export function SecurityIncidentsWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Incidents / période
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-light tracking-tight">
          {analytics.totalIncidents}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Total incidents</p>
      </CardContent>
    </Card>
  );
}

export function CriticalEventsWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-red-500" />
          Incidents critiques
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-light tracking-tight">
          {analytics.criticalIncidents}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Priorité haute</p>
      </CardContent>
    </Card>
  );
}

export function ResolutionRateWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          Taux de résolution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-light tracking-tight">
          {analytics.resolutionRate}%
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {analytics.resolvedIncidents} incidents résolus
        </p>
      </CardContent>
    </Card>
  );
}

export function PatrolRoundsWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          Rondes effectuées
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-light tracking-tight">
          {analytics.totalRounds}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Intervalle moyen: {analytics.avgRoundInterval}
        </p>
      </CardContent>
    </Card>
  );
}

export function RHImpactWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          KPI RH
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Agents impliqués</span>
          <span className="font-light text-lg">{analytics.agentsInvolved}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Incidents HSE/SST</span>
          <span className="font-light text-lg">{analytics.hseIncidents}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientPerformanceWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          KPI Client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Événements traités</span>
          <span className="font-light text-lg">
            {analytics.resolutionRate}%
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Incidents critiques</span>
          <span className="font-light text-lg">
            {analytics.criticalIncidents}
          </span>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          La satisfaction client n’est pas encore collectée dans Safyr.
        </p>
      </CardContent>
    </Card>
  );
}

export function TrendChartWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground">
          Tendance des événements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analytics.trendData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            Aucun événement
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={analytics.trendData}
              margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                {...DARK_TOOLTIP_STYLE}
                formatter={(value) => [value, "Événements"]}
              />
              <Area
                type="monotone"
                dataKey="evenements"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#trendFill)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function SeverityDistributionWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground">
          Répartition par gravité
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analytics.pieData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            Aucun événement
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={analytics.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {analytics.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  {...DARK_TOOLTIP_STYLE}
                  formatter={(value, name) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {analytics.pieData.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center gap-1 text-xs"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: entry.color }}
                  />
                  <span className="text-muted-foreground">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function EventTypesWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground">
          Types d&apos;événements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analytics.typeData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            Aucun événement
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={analytics.typeData}
              layout="vertical"
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="type"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip
                {...DARK_TOOLTIP_STYLE}
                formatter={(value) => [value, "Événements"]}
              />
              <Bar dataKey="count" fill="#22d3ee" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function TopZonesWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Zones impactées
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analytics.topZones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune zone</p>
        ) : (
          <div className="space-y-2">
            {analytics.topZones.map(([zone, count], index) => (
              <div
                key={zone}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span className="text-sm font-medium truncate max-w-[150px]">
                    {zone}
                  </span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SiteComparisonWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Comparaison par site
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analytics.siteData.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
            Aucun événement
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={analytics.siteData}
              layout="vertical"
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="site"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={140}
              />
              <Tooltip
                {...DARK_TOOLTIP_STYLE}
                formatter={(value) => [value, "Événements"]}
              />
              <Bar dataKey="count" fill="#22d3ee" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function AgentActivityHeatmapWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const hours = Array.from({ length: 24 }, (_, h) => h);
  const cellMap = new Map<string, number>();
  for (const cell of analytics.heatmapData) {
    cellMap.set(`${cell.dayIndex}-${cell.hour}`, cell.count);
  }
  const max = Math.max(1, ...analytics.heatmapData.map((c) => c.count));

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Activité agents — jour × heure
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analytics.heatmapData.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
            Aucun événement
          </div>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-[40px_repeat(24,minmax(0,1fr))] gap-[2px] text-[10px] text-muted-foreground">
              <span />
              {hours.map((h) => (
                <span
                  key={h}
                  className="text-center"
                  style={{ visibility: h % 3 === 0 ? "visible" : "hidden" }}
                >
                  {h}h
                </span>
              ))}
            </div>
            {days.map((day, dayIndex) => (
              <div
                key={day}
                className="grid grid-cols-[40px_repeat(24,minmax(0,1fr))] gap-[2px]"
              >
                <span className="text-[10px] text-muted-foreground self-center">
                  {day}
                </span>
                {hours.map((h) => {
                  const v = cellMap.get(`${dayIndex}-${h}`) ?? 0;
                  const intensity = v === 0 ? 0 : 0.15 + (v / max) * 0.85;
                  return (
                    <div
                      key={h}
                      title={`${day} ${h}h — ${v} événement${v > 1 ? "s" : ""}`}
                      className="h-5 rounded-sm"
                      style={{
                        background:
                          v === 0
                            ? "rgba(148,163,184,0.08)"
                            : `rgba(34,211,238,${intensity})`,
                      }}
                    />
                  );
                })}
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 text-[10px] text-muted-foreground">
              <span>Moins</span>
              <div className="flex gap-[2px]">
                {[0.15, 0.4, 0.65, 0.9].map((i) => (
                  <span
                    key={i}
                    className="h-3 w-3 rounded-sm"
                    style={{ background: `rgba(34,211,238,${i})` }}
                  />
                ))}
              </div>
              <span>Plus</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResolutionTrendWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          Taux de résolution — tendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analytics.resolutionTrendData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            Aucun incident
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={analytics.resolutionTrendData}
              margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                {...DARK_TOOLTIP_STYLE}
                formatter={(value) => [`${value}%`, "Résolution"]}
              />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function CriticalSplitWidget({ isLoading }: KpiWidgetProps) {
  const analytics = useAnalytique();
  if (isLoading) return <SmallSkeletonCard />;

  return (
    <Card className="glass-card border-border/40 hover:border-primary/30 transition-all h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Critiques vs mineurs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Critiques</p>
            <p className="text-3xl font-light text-red-500">
              {analytics.criticalIncidents}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mineurs</p>
            <p className="text-3xl font-light text-emerald-500">
              {analytics.totalIncidents - analytics.criticalIncidents}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Temps moyen de résolution: {analytics.avgResolutionTime}
        </p>
      </CardContent>
    </Card>
  );
}
